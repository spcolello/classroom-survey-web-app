-- Run once in the Supabase SQL Editor or with the Supabase CLI.
-- Add an instructor after creating their Supabase Auth user:
-- insert into public.instructor_users (user_id) values ('AUTH_USER_UUID');

create table public.instructor_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table public.surveys (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(btrim(title)) between 1 and 200),
  description text,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'closed', 'archived')),
  public_slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index surveys_status_idx on public.surveys(status);
create unique index only_one_active_survey on public.surveys ((status)) where status = 'active';

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  question_text text not null check (length(btrim(question_text)) between 1 and 500),
  question_type text not null check (question_type in ('multiple_choice', 'true_false')),
  position integer not null check (position > 0),
  created_at timestamptz not null default now(),
  unique (survey_id, position)
);
create index questions_survey_id_idx on public.questions(survey_id);

create table public.choices (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions(id) on delete cascade,
  choice_text text not null check (length(btrim(choice_text)) between 1 and 300),
  position integer not null check (position > 0),
  created_at timestamptz not null default now(),
  unique (question_id, position)
);
create index choices_question_id_idx on public.choices(question_id);

create table public.responses (
  id uuid primary key default gen_random_uuid(),
  survey_id uuid not null references public.surveys(id) on delete cascade,
  anonymous_token text not null check (length(anonymous_token) between 16 and 100),
  submitted_at timestamptz not null default now(),
  unique (survey_id, anonymous_token)
);
create index responses_survey_id_idx on public.responses(survey_id);
create index responses_submitted_at_idx on public.responses(submitted_at);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  response_id uuid not null references public.responses(id) on delete cascade,
  question_id uuid not null references public.questions(id) on delete cascade,
  choice_id uuid not null references public.choices(id),
  created_at timestamptz not null default now(),
  unique (response_id, question_id)
);
create index answers_response_id_idx on public.answers(response_id);
create index answers_question_id_idx on public.answers(question_id);
create index answers_choice_id_idx on public.answers(choice_id);

create function public.touch_survey_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
create trigger surveys_updated_at before update on public.surveys
for each row execute function public.touch_survey_updated_at();

create function public.is_instructor()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.instructor_users where user_id = (select auth.uid())
  );
$$;
revoke all on function public.is_instructor() from public;
grant execute on function public.is_instructor() to authenticated;

alter table public.instructor_users enable row level security;
alter table public.surveys enable row level security;
alter table public.questions enable row level security;
alter table public.choices enable row level security;
alter table public.responses enable row level security;
alter table public.answers enable row level security;

create policy instructor_surveys on public.surveys for all to authenticated
using (public.is_instructor()) with check (public.is_instructor());
create policy instructor_questions on public.questions for all to authenticated
using (public.is_instructor()) with check (public.is_instructor());
create policy instructor_choices on public.choices for all to authenticated
using (public.is_instructor()) with check (public.is_instructor());
create policy instructor_responses on public.responses for select to authenticated
using (public.is_instructor());
create policy instructor_answers on public.answers for select to authenticated
using (public.is_instructor());

create policy student_active_surveys on public.surveys for select to anon
using (status = 'active');
create policy student_active_questions on public.questions for select to anon
using (exists (
  select 1 from public.surveys s where s.id = survey_id and s.status = 'active'
));
create policy student_active_choices on public.choices for select to anon
using (exists (
  select 1 from public.questions q
  join public.surveys s on s.id = q.survey_id
  where q.id = question_id and s.status = 'active'
));

-- Keep tables unavailable to anon for writes and results reads.
revoke all on public.instructor_users from anon, authenticated;
revoke all on public.surveys, public.questions, public.choices, public.responses, public.answers from anon, authenticated;
grant select, delete on public.surveys to authenticated;
grant select on public.questions, public.choices to authenticated;
grant select on public.responses, public.answers to authenticated;
grant select on public.surveys, public.questions, public.choices to anon;
revoke all on public.responses, public.answers from anon;

create function public.save_survey(
  p_survey_id uuid, p_title text, p_description text, p_questions jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_survey_id uuid;
  v_question jsonb;
  v_choice jsonb;
  v_question_id uuid;
  v_qpos integer := 0;
  v_cpos integer;
  v_type text;
begin
  if not public.is_instructor() then raise exception 'NOT_AUTHORIZED'; end if;
  if p_title is null or length(btrim(p_title)) not between 1 and 200 then
    raise exception 'INVALID_TITLE';
  end if;
  if jsonb_typeof(p_questions) is distinct from 'array'
    or jsonb_array_length(p_questions) < 1
    or jsonb_array_length(p_questions) > 50 then
    raise exception 'INVALID_QUESTIONS';
  end if;

  if p_survey_id is null then
    insert into public.surveys(title, description) values (btrim(p_title), nullif(btrim(p_description), ''))
      returning id into v_survey_id;
  else
    select id into v_survey_id from public.surveys
      where id = p_survey_id and status = 'draft' for update;
    if v_survey_id is null then raise exception 'SURVEY_NOT_EDITABLE'; end if;
    update public.surveys set title = btrim(p_title),
      description = nullif(btrim(p_description), '') where id = v_survey_id;
    delete from public.questions where survey_id = v_survey_id;
  end if;

  for v_question in select value from jsonb_array_elements(p_questions) loop
    v_qpos := v_qpos + 1;
    v_type := v_question->>'question_type';
    if v_type not in ('multiple_choice', 'true_false')
      or length(btrim(coalesce(v_question->>'question_text', ''))) not between 1 and 500
      or jsonb_typeof(v_question->'choices') is distinct from 'array'
      or jsonb_array_length(v_question->'choices') not between 2 and 10 then
      raise exception 'INVALID_QUESTION';
    end if;
    if v_type = 'true_false' and
      (jsonb_array_length(v_question->'choices') <> 2
       or v_question->'choices'->>0 <> 'True'
       or v_question->'choices'->>1 <> 'False') then
      raise exception 'INVALID_TRUE_FALSE';
    end if;
    insert into public.questions(survey_id, question_text, question_type, position)
      values (v_survey_id, btrim(v_question->>'question_text'), v_type, v_qpos)
      returning id into v_question_id;
    v_cpos := 0;
    for v_choice in select value from jsonb_array_elements(v_question->'choices') loop
      v_cpos := v_cpos + 1;
      if jsonb_typeof(v_choice) <> 'string'
        or length(btrim(v_choice #>> '{}')) not between 1 and 300 then
        raise exception 'INVALID_CHOICE';
      end if;
      insert into public.choices(question_id, choice_text, position)
        values (v_question_id, btrim(v_choice #>> '{}'), v_cpos);
    end loop;
  end loop;
  return v_survey_id;
end;
$$;

create function public.activate_survey(p_survey_id uuid)
returns public.surveys
language plpgsql security definer set search_path = '' as $$
declare v_survey public.surveys;
begin
  if not public.is_instructor() then raise exception 'NOT_AUTHORIZED'; end if;
  perform pg_catalog.pg_advisory_xact_lock(87423911);
  select * into v_survey from public.surveys where id = p_survey_id for update;
  if v_survey.id is null or v_survey.status not in ('draft', 'closed') then
    raise exception 'SURVEY_NOT_ACTIVATABLE';
  end if;
  if not exists (select 1 from public.questions where survey_id = p_survey_id) then
    raise exception 'SURVEY_HAS_NO_QUESTIONS';
  end if;
  update public.surveys set status = 'closed' where status = 'active';
  update public.surveys set status = 'active',
    public_slug = coalesce(public_slug, replace(gen_random_uuid()::text, '-', ''))
    where id = p_survey_id returning * into v_survey;
  return v_survey;
end;
$$;

create function public.close_survey(p_survey_id uuid)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_instructor() then raise exception 'NOT_AUTHORIZED'; end if;
  update public.surveys set status = 'closed' where id = p_survey_id and status = 'active';
  if not found then raise exception 'SURVEY_NOT_ACTIVE'; end if;
end;
$$;

create function public.archive_survey(p_survey_id uuid)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_instructor() then raise exception 'NOT_AUTHORIZED'; end if;
  update public.surveys set status = 'archived'
    where id = p_survey_id and status in ('draft', 'closed');
  if not found then raise exception 'SURVEY_NOT_ARCHIVABLE'; end if;
end;
$$;

create function public.submit_survey_response(
  p_survey_id uuid, p_anonymous_token text, p_answers jsonb
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_response_id uuid;
  v_answer jsonb;
  v_question_id uuid;
  v_choice_id uuid;
  v_question_count integer;
begin
  -- Called by anon only. Authenticated instructors cannot spoof student submissions.
  if (select auth.role()) <> 'anon' then raise exception 'NOT_AUTHORIZED'; end if;
  if p_anonymous_token is null or length(p_anonymous_token) not between 16 and 100
     or p_anonymous_token !~ '^[A-Za-z0-9-]+$' then
    raise exception 'INVALID_TOKEN';
  end if;
  -- Lock prevents closing while a submission is validated and inserted.
  perform 1 from public.surveys where id = p_survey_id and status = 'active' for share;
  if not found then raise exception 'SURVEY_NOT_ACTIVE'; end if;
  select count(*) into v_question_count from public.questions where survey_id = p_survey_id;
  if jsonb_typeof(p_answers) is distinct from 'array'
    or jsonb_array_length(p_answers) <> v_question_count then
    raise exception 'MISSING_REQUIRED_ANSWER';
  end if;
  if exists (select 1 from public.responses
    where survey_id = p_survey_id and anonymous_token = p_anonymous_token) then
    raise exception 'DUPLICATE_RESPONSE';
  end if;
  insert into public.responses(survey_id, anonymous_token)
    values (p_survey_id, p_anonymous_token) returning id into v_response_id;

  for v_answer in select value from jsonb_array_elements(p_answers) loop
    begin
      v_question_id := (v_answer->>'question_id')::uuid;
      v_choice_id := (v_answer->>'choice_id')::uuid;
    exception when invalid_text_representation then
      raise exception 'INVALID_ANSWER';
    end;
    if not exists (select 1 from public.questions q
      join public.choices c on c.question_id = q.id
      where q.id = v_question_id and q.survey_id = p_survey_id and c.id = v_choice_id) then
      raise exception 'INVALID_CHOICE';
    end if;
    insert into public.answers(response_id, question_id, choice_id)
      values (v_response_id, v_question_id, v_choice_id);
  end loop;
  return v_response_id;
exception when unique_violation then
  raise exception 'DUPLICATE_RESPONSE';
end;
$$;

revoke all on function public.save_survey(uuid, text, text, jsonb) from public;
revoke all on function public.activate_survey(uuid) from public;
revoke all on function public.close_survey(uuid) from public;
revoke all on function public.archive_survey(uuid) from public;
revoke all on function public.submit_survey_response(uuid, text, jsonb) from public;
grant execute on function public.save_survey(uuid, text, text, jsonb) to authenticated;
grant execute on function public.activate_survey(uuid) to authenticated;
grant execute on function public.close_survey(uuid) to authenticated;
grant execute on function public.archive_survey(uuid) to authenticated;
grant execute on function public.submit_survey_response(uuid, text, jsonb) to anon;
