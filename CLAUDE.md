# Guidelines

- The owner writes no code. All code, docs and text are written by Claude.
- No code documentation or comments. No human reads the code.
- Keep chat replies short. Do not trade code clarity for brevity: no minifying, no cryptic names.
- Keep files small and focused so they are cheap to read.
- Keep this file current: stack, structure and conventions go below.

# Project

Personal portfolio of Felix Pfeiffer (MSc Information Security @ UCL, ex Fraunhofer IOSB, BaFin, AXA, co-founder of Cosmoshield and Pakt). Experiment in how far AI can take a real project.

# Stack and structure

- Next.js (App Router), TypeScript, Tailwind. Next.js 16 differs from training data: read `node_modules/next/dist/docs/` before using its APIs.
- AI features: Vercel AI SDK with Claude (not installed yet).
- Self-hosted via Docker: multi-stage `Dockerfile` (Next `standalone` output), `docker-compose.yml` hardened (non-root, read-only, caps dropped).
- Source in `src/app`.
