import { db } from './supabase'
import type { DraftQuestion, ResponseRow, Survey, SurveyDetail } from './types'

function fail(error: { message: string } | null): void {
  if (error) throw new Error(error.message)
}

export async function listSurveys(): Promise<Survey[]> {
  const { data, error } = await db().from('surveys').select('*').order('created_at', { ascending: false })
  fail(error)
  return (data ?? []) as Survey[]
}

export async function getSurvey(id: string): Promise<SurveyDetail> {
  const { data, error } = await db().from('surveys')
    .select('*, questions(*, choices(*))').eq('id', id).single()
  fail(error)
  if (!data) throw new Error('Survey not found')
  return normalize(data as SurveyDetail)
}

export async function getPublicSurvey(slug: string): Promise<SurveyDetail | null> {
  const { data, error } = await db().from('surveys')
    .select('*, questions(*, choices(*))').eq('public_slug', slug).eq('status', 'active').maybeSingle()
  fail(error)
  return data ? normalize(data as SurveyDetail) : null
}

function normalize(survey: SurveyDetail): SurveyDetail {
  return {
    ...survey,
    questions: (survey.questions ?? []).sort((a, b) => a.position - b.position)
      .map(q => ({ ...q, choices: (q.choices ?? []).sort((a, b) => a.position - b.position) })),
  }
}

export async function saveSurvey(id: string | null, title: string, description: string, questions: DraftQuestion[]): Promise<string> {
  const payload = questions.map(q => ({
    question_text: q.question_text.trim(),
    question_type: q.question_type,
    choices: q.choices.map(c => c.choice_text.trim()),
  }))
  const { data, error } = await db().rpc('save_survey', {
    p_survey_id: id, p_title: title.trim(), p_description: description.trim(), p_questions: payload,
  })
  fail(error)
  return data as string
}

export async function activateSurvey(id: string): Promise<Survey> {
  const { data, error } = await db().rpc('activate_survey', { p_survey_id: id })
  fail(error)
  return data as Survey
}
export async function closeSurvey(id: string): Promise<void> {
  const { error } = await db().rpc('close_survey', { p_survey_id: id })
  fail(error)
}
export async function archiveSurvey(id: string): Promise<void> {
  const { error } = await db().rpc('archive_survey', { p_survey_id: id })
  fail(error)
}
export async function deleteSurvey(id: string): Promise<void> {
  const { error } = await db().from('surveys').delete().eq('id', id)
  fail(error)
}
export async function submitSurvey(id: string, token: string, answers: { question_id: string; choice_id: string }[]): Promise<string> {
  const { data, error } = await db().rpc('submit_survey_response', {
    p_survey_id: id, p_anonymous_token: token, p_answers: answers,
  })
  fail(error)
  return data as string
}
export async function countResponses(id: string): Promise<number> {
  const { count, error } = await db().from('responses').select('id', { count: 'exact', head: true }).eq('survey_id', id)
  fail(error)
  return count ?? 0
}
export async function allResponses(id: string): Promise<ResponseRow[]> {
  const rows: ResponseRow[] = []
  for (let from = 0; ; from += 500) {
    const { data, error } = await db().from('responses')
      .select('id,survey_id,submitted_at,answers(question_id,choice_id)')
      .eq('survey_id', id).order('submitted_at', { ascending: true }).range(from, from + 499)
    fail(error)
    const batch = (data ?? []) as ResponseRow[]
    rows.push(...batch)
    if (batch.length < 500) break
  }
  return rows
}

export function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error)
  if (/DUPLICATE_RESPONSE|responses_survey_id_anonymous_token_key|23505/.test(message)) return 'You have already submitted this survey.'
  if (/SURVEY_NOT_ACTIVE/.test(message)) return 'This survey is no longer accepting responses.'
  if (/MISSING_REQUIRED_ANSWER/.test(message)) return 'Please answer every question.'
  if (/INVALID_QUESTION|INVALID_CHOICE|INVALID_ANSWER/.test(message)) return 'One of the answers is invalid. Refresh the page and try again.'
  if (/Failed to fetch|NetworkError|fetch failed/i.test(message)) return 'Could not connect. Check your internet connection and try again.'
  return 'Something went wrong. Please try again.'
}
