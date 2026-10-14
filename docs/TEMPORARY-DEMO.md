# Temporary teacher demo — 9 October 2026

Public URL for the current running tunnel:
https://views-biology-neither-elections.trycloudflare.com

The access code is stored locally in `.data/share/access.json`. Do not commit or publish that file. Share the code directly with the intended reviewer.

Running chain: Cloudflare Quick Tunnel → access-code gateway on 127.0.0.1:3001 → production Next.js on 127.0.0.1:3000. PostgreSQL and Ollama remain local. The computer, network, database, web server, gateway, Ollama, and tunnel must remain running. Restarting the Quick Tunnel normally creates a different public URL.

Next.js was started with NEXTAUTH_URL set to the public URL and NEXTAUTH_URL_INTERNAL=http://127.0.0.1:3000. Set those process environment variables again when restarting the public demo.

## AI configuration

Course generation now uses local Ollama `qwen3:8b` (override with OLLAMA_COURSE_MODEL). This supersedes earlier Gemini course-generation documentation. The chat assistant uses `llama3.2:3b`. Both models are installed.

Course generation streams NDJSON progress and generates an outline followed by four lessons in two chapters. PDF text is extracted locally (first 20 pages); reference text is capped at 6,000 characters. Scanned PDFs need OCR before upload. Users review the draft before saving and can expand it using the course editor. One generation runs at a time.

## Verification

- Production build, TypeScript and lint passed (one existing seed.ts lint warning).
- Manual-course integration and real Ollama assistant checks passed.
- Public access gate, teacher sign-in, database/course library and real Qwen generation with a PDF reference passed via the public URL. The tested course completed in 34 seconds; other requests may take longer.
- `node scripts/test-public-demo.cjs` repeats the public check; DEMO_URL can override its URL. It stores its generated draft in `.data/share/generated-course-verification.json` without publishing a course.

Existing quiz-generation endpoints were not migrated as part of this course-generation change.
