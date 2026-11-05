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

## Requires live-service verification

- [ ] Create Supabase project and run migration.
- [ ] Add instructor account to Supabase Auth and instructor allowlist.
- [ ] Configure public project URL and publishable/anon key locally and in hosting.
- [ ] Verify instructor login and all database writes in the live project.
- [ ] Verify anonymous RLS access, result isolation, and duplicate protection with real browsers.
- [ ] Verify the complete QR → submit → results workflow and refresh persistence.
- [ ] Check responsive layout and keyboard access on desktop and mobile.
- [ ] Open CSV in a spreadsheet application.
- [ ] Push repository to GitHub and record the repository URL.
- [ ] Deploy to public hosting and record the application URL.
- [ ] Verify the production workflow from a separate device or browser.
- [ ] Capture the four required database/application evidence screenshots without credentials.

## Outside version 1

Live charts, question bank, additional question types, multi-instructor management, and LMS integration remain future enhancements from the supplied specification.
