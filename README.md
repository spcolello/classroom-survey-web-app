# Classroom Survey

A full-stack classroom survey app built with React, TypeScript, Vite, Tailwind CSS, Supabase Auth/PostgreSQL, Recharts, and QR codes. One instructor creates surveys; students answer anonymously from a phone or laptop.

**Live app:** https://classroom-survey-web-app.pages.dev/

**Public instructor demo:** https://classroom-survey-public-demo.pages.dev/ — choose “Enter public demo.” This is a separate Supabase project with shared, disposable demo data. Do not enter personal information. No instructor password is required.

**Public sample survey:** https://classroom-survey-web-app.pages.dev/s/f8c3eb55f56d4dde9782f6a348bd6a97

**Submission links and instructor testing:** [SUBMISSION.md](SUBMISSION.md)

## What it does

- Instructor sign in, dashboard search and filters, draft editing, duplication, activation, closing, archiving, deleting, historical results, and CSV export.
- Multiple-choice and true/false questions, question and choice reordering, and validation.
- Public student route at `/s/:slug`, QR presentation page, response count refresh, and downloadable QR PNG.
- PostgreSQL persistence and database-enforced single active survey.
- Anonymous submission through one transaction in a database function; anonymous users cannot read responses or answers.

## Architecture

The React frontend runs as static files. Supabase Auth signs in the instructor. The frontend uses the Supabase JavaScript client to read survey data and call PostgreSQL functions. PostgreSQL stores five related tables: surveys → questions → choices and surveys → responses → answers. Row Level Security limits what anonymous students can read; writes for survey creation and student submission go through validated database functions. The browser only receives the Supabase **publishable/anon key**, which is intended to be public. Never use a service-role key in the frontend.

## Local setup

1. Create a Supabase project (Free plan is sufficient). In **SQL Editor**, run [the migration](supabase/migrations/202611050001_initial.sql) once. The migration creates tables, indexes, RLS policies, and RPC functions.
2. In **Authentication → Users**, add an instructor user. Do not enable public signups for the instructor interface. Copy the user's UUID and run:

   ```sql
   insert into public.instructor_users (user_id)
   values ('PASTE_INSTRUCTOR_AUTH_USER_UUID');
   ```

3. In **Project Settings → API Keys**, copy the project URL and the **publishable** (or legacy **anon**) key. Create `.env` in the project root from `.env.example` and set:

   ```text
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_ANON_KEY=YOUR_PUBLISHABLE_OR_ANON_KEY
   ```

4. Run `npm ci`, then `npm run dev`. Open the printed local URL. To test the student flow, use a private browser window so the browser is unauthenticated.

### Verify the database

1. Sign in and create a draft with a multiple-choice and a true/false question.
2. In **Table Editor**, inspect `surveys`, `questions`, and `choices`.
3. Activate the survey and open the QR link in a private window. Submit once and refresh.
4. Inspect `responses` and `answers` in Table Editor; confirm the same records remain after refreshing.
5. Open results and check each count and percentage; export CSV and open it in a spreadsheet.
6. Submit again from the same private browser. It should show “Already submitted.”
7. Close the survey and confirm the public link no longer accepts responses.

## Deploy to Cloudflare Pages

1. Push this folder to a GitHub repository. Keep `.env` untracked; `.gitignore` excludes it.
2. In Cloudflare Pages, connect the repository. Build command: `npm run build`. Output directory: `dist`. Framework preset: Vite. The `public/_redirects` file enables direct navigation to React routes.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as **build environment variables** in Pages. Redeploy after saving them. These values are embedded in the static bundle, so use only the public key.
4. In Supabase **Authentication → URL Configuration**, set the Site URL to your Pages URL. Password sign-in does not require a redirect, but this keeps the project configured for production.
5. Verify production login, create and activate a survey, open the QR link on a phone or in another browser, submit, refresh results, and export CSV.

### Public instructor demo

The public demo uses a second Cloudflare Pages project and a second Supabase project, so visitors cannot access the owner's surveys or student responses. To reproduce it, run the main migration in an empty **demo-only** Supabase project, then run [the demo policy](supabase/demo/202611050002_public_demo.sql) there. Enable **Authentication → Sign In / Providers → Allow anonymous sign-ins** in that demo project. Set its Pages build variables to its own `VITE_SUPABASE_URL`, its publishable `VITE_SUPABASE_ANON_KEY`, and `VITE_PUBLIC_DEMO=true`. Use `npm run build` and `dist`. Never apply the demo policy to the owner's database.

Supabase anonymous Auth users receive the authenticated database role. The demo-only policy recognizes their `is_anonymous` JWT claim and grants instructor tools in the demo project. Anyone can alter shared demo surveys and see shared demo results, so use only disposable examples. Students can still submit without an Auth session through `/s/:slug`; test that flow in a private browser window or on a phone. The production build uses `VITE_PUBLIC_DEMO=false` and retains its instructor allowlist.

## Security and design decisions

- `instructor_users` is an additional table that allowlists specific Supabase Auth users. An arbitrary authenticated user cannot manage surveys.
- Draft questions and choices are replaced atomically when a draft is saved. Active, closed, and archived surveys are immutable so historical answers remain meaningful. Duplicate a survey to revise it.
- Only one active survey is enforced with a partial unique index. Activation is serialized with a PostgreSQL advisory lock and closes any prior active survey in the same transaction.
- Anonymous users can read only active surveys and their questions/choices. They have no direct write or results read grants. The `submit_survey_response` function validates every answer, inserts the response and answers atomically, and rejects duplicate browser tokens.
- A random token is stored in browser local storage. It prevents accidental repeat submissions from the same browser; it is not an identity system and a student can use another browser.
- Anonymous visitors see “Survey unavailable” for both closed and unknown links, avoiding disclosure of unpublished surveys.
- Survey deletion is permanent and cascades to its questions and responses. The UI offers archive for retention and confirms deletion.

## Commands

```sh
npm ci
npm run dev
npm run test
npm run build
```

## Project files

- `src/pages`: React screens.
- `src/lib`: Supabase access, CSV export, browser token.
- `supabase/migrations`: versioned database schema, policies, and functions.
- `specs`: unmodified assignment specifications, including the originally supplied TODO.
- `TODO.md`: verified implementation status.
- `DEVELOPMENT_SUMMARY.md`, `AI_DEVELOPMENT_HISTORY.md`, and `evidence/`: submission support.
- `SUBMISSION.md`: paste-ready repository and deployment links plus private instructor access guidance.
