# Classroom Survey — Verified Status

This replaces the supplied TODO's unverified checkmarks. The original is preserved in `specs/TODO_original.md`. A checked item here means it was implemented or verified in this project.

## Implemented locally

- [x] React + TypeScript + Vite application with Tailwind CSS, routing, Supabase client, Recharts, and QR generation.
- [x] Instructor login, protected routes, dashboard, search and status/date filters.
- [x] Draft editor with multiple-choice and true/false questions, choices, reordering, validation, and save/activate.
- [x] Survey duplication, activation, closing, archiving, deletion with confirmation.
- [x] Public student form with required answers, submission states, and browser-token duplicate protection.
- [x] Presentation page with QR code, readable URL, downloadable PNG, and refreshed response count.
- [x] Results with counts, percentages, charts, historical access, and CSV export.
- [x] PostgreSQL migration defining five required tables, relationships, indexes, RLS policies, instructor allowlist, and transactional RPC functions.
- [x] Original specifications included; README, design decisions, and AI interaction summary added.
- [x] `npm run test` and `npm run build` pass.

## Live-service verification

- [x] Create Supabase project and run migration; verify the five tables in Table Editor.
- [x] Add instructor account to Supabase Auth and instructor allowlist.
- [x] Configure public project URL and publishable key in ignored local environment file.
- [x] Verify anonymous API cannot read responses/answers or directly insert surveys/responses.
- [x] Verify anonymous submission RPC is callable and rejects an inactive survey.
- [x] Push repository to GitHub and record the repository URL.
- [x] Configure project URL and publishable key in Cloudflare Pages; set the Supabase Auth Site URL to the deployed site.
- [x] Deploy to https://classroom-survey-web-app.pages.dev/ from the GitHub main branch.
- [x] Sign in as the allowlisted instructor in production; create, save, reload, activate, duplicate, edit, close, and reactivate surveys.
- [x] Verify the active survey and questions are publicly readable, while anonymous requests to `responses` and `answers` return HTTP 401.
- [x] Scan the production QR code on a phone, submit anonymously, see confirmation, and see “Already submitted” on refresh.
- [x] Verify the presentation count, instructor results, and PostgreSQL response/answer rows; refresh the app and see the same data.
- [x] Send a second anonymous test response; a repeated token was rejected with HTTP 400. Results showed 2 responses and 50%/50% choices.
- [x] Close the survey and verify the public link becomes unavailable; reactivate it and verify the link and prior results return.
- [x] Export the results CSV and inspect its header and response row.
- [x] Inspect desktop pages and complete the student flow on a phone.
- [x] Capture the required Supabase and application evidence screenshots without passwords, project keys, or anonymous tokens.
- [x] Deploy a separate public instructor demo with its own Supabase project and demo-only anonymous Auth policy.
- [x] Verify one-click demo instructor access, survey creation and activation, unauthenticated student submission, duplicate protection, and persisted results.
- [x] Link the demo from the production landing and login pages while keeping the original instructor login private.

Keyboard-only navigation and opening the exported CSV in a separate spreadsheet application were not tested.

## Outside version 1

Live charts, question bank, additional question types, multi-instructor management, and LMS integration remain future enhancements from the supplied specification.
