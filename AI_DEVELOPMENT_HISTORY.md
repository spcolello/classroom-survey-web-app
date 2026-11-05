# AI Development History

This is a Markdown summary of this Codex conversation, provided in place of a Cursor export. It records actual work and decisions rather than inventing prompts from a different tool.

1. **Requirements review.** I provided the assignment and five Markdown specifications. I asked Codex to create the full application and submission materials. Codex read every document, identified the React/Supabase/Cloudflare stack, and treated the supplied TODO checkmarks as claims to verify rather than completed work.
2. **Architecture and security.** Codex chose a static React frontend with Supabase Auth and PostgreSQL. It added an instructor allowlist, Row Level Security, a partial unique index for one active survey, and database functions for atomic survey saving, activation, closing, and anonymous submission.
3. **Implementation.** Codex created the instructor login, dashboard, editor, presentation, student form, results dashboard, charts, QR download, and CSV export. It preserved the supplied specifications in the repository and documented decisions that the documents left open.
4. **Debugging.** The first TypeScript build reported missing Vite environment type declarations. Codex added `src/vite-env.d.ts`, rebuilt successfully, and split larger screens into lazy-loaded bundles after the bundler reported a large initial chunk.
5. **Testing.** Codex ran the production build and focused CSV tests, including spreadsheet formula neutralization. Live Supabase, browser workflow, and deployment verification are recorded in `TODO.md` as they are completed.

The generated code should still be reviewed and explained by the student before submission. Useful explanation: the frontend collects answers, the RPC validates them and writes a response plus answers in one transaction, and the results page reads those persistent rows using instructor-only permissions.
