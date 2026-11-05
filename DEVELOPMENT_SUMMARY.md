# Classroom Survey Web App — Development Summary

## Using the specifications and the AI agent

I gave the assignment and all five provided Markdown files to Codex, an AI coding agent. The overall specification defined the React, TypeScript, Vite, Supabase, Recharts, and QR code stack. `DATABASE.md` shaped the five-table relational model; `API.md` shaped the data access functions; `UI.md` guided the routes and screen states; and the supplied TODO provided a work sequence. The supplied TODO already had many checked items, but there was no project in this workspace, so I treated those checkmarks as unverified. I kept the original documents in `specs/` and wrote a new `TODO.md` that reflects this project's actual status.

Codex generated the React screens, TypeScript data layer, CSS, SQL migration, tests, README, and submission documentation. I guided it to preserve the specified student flow, enforce one active survey in PostgreSQL, and keep anonymous students away from results. The human-owned steps were creating the Supabase database and instructor credentials; the password was entered privately in the Supabase dashboard and was never placed in source code.

## How the application works

The **frontend** is the React application. The instructor uses it to create drafts, add questions and choices, activate surveys, present a QR code, and view results. A student opens a public link, selects one choice for each question, and submits without an account. The **backend** is Supabase Auth, its PostgreSQL database, and database functions exposed through Supabase's API. The **database** persists surveys, questions, choices, responses, and answers. UUID primary keys identify rows; foreign keys connect questions to surveys, choices to questions, responses to surveys, and answers to responses/questions/choices.

The frontend uses the Supabase JavaScript client with a project URL and publishable key. It calls `save_survey` to write a draft in one transaction and `activate_survey` to close the prior active survey and activate the selected one. For students, `submit_survey_response` checks that the survey is active and that each choice belongs to the corresponding question, then writes one response and its answers atomically. A browser token and database unique constraint prevent accidental repeat submissions. Instructor-only queries fetch persistent responses; React calculates counts and percentages and creates the CSV download.

## Security and design choices

I added an `instructor_users` allowlist because granting every authenticated account instructor powers would be unsafe. Row Level Security permits anonymous users to read only active survey content. Anonymous users cannot directly insert into the response tables or read them; the submission function is their only write path. Active and closed surveys cannot be edited, which preserves the meaning of historical responses. The browser token is a convenience against accidental duplicates, not a way to identify a student.

## Debugging and verification

The first TypeScript build failed because the Vite environment type declarations were missing. Codex added `src/vite-env.d.ts`, after which the production build passed. The first bundle was larger than needed because the results chart library loaded on every page; Codex moved the main screens to lazy-loaded routes. Two CSV tests passed, including a check that potentially dangerous spreadsheet formulas are neutralized.

After applying the migration in Supabase, I inspected the Table Editor and confirmed the required five tables exist. Anonymous requests can read an active survey but receive HTTP 401 for `responses` and `answers`. I signed into the deployed app, created a two-question draft, refreshed it to confirm persistence, and activated it. A phone opened the QR link and submitted without an account. The presenter count rose from zero to one; the instructor results and PostgreSQL answer rows matched the phone's choices. Refreshing the results preserved them. A second anonymous test submission produced 50%/50% results; repeating its browser token returned HTTP 400. Closing the survey hid the public form, and reactivating it restored the same link and historical results. I also downloaded the CSV and checked its row values.

During deployment, I discovered that the account recovery email would return to the app without a password reset screen. Codex added the recovery screen and a “Forgot password?” flow, rebuilt, and redeployed. The owner then signed in successfully. This was a useful example of a problem that a successful build alone would not reveal.

## Deployment and learning

The source is published at [GitHub](https://github.com/spcolello/classroom-survey-web-app). Cloudflare Pages builds the `main` branch and serves the app at [classroom-survey-web-app.pages.dev](https://classroom-survey-web-app.pages.dev/). The frontend was configured with only the Supabase project URL and public publishable key; the database password and service-role key are absent from Git. The Supabase Auth Site URL points to the Cloudflare site.

This project showed me that a full-stack app has distinct responsibilities: React renders forms and results, Supabase Auth identifies the instructor, and PostgreSQL stores and validates data. The most important debugging lesson was to test both the code build and the real database permissions. A working page alone does not prove that anonymous students are blocked from instructor-only data or that responses persist after refresh.
