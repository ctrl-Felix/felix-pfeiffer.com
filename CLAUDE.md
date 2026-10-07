# Guidelines

- The owner writes no code. All code, docs and text are written by Claude.
- No code documentation or comments. No human reads the code.
- Keep chat replies short. Do not trade code clarity for brevity: no minifying, no cryptic names.
- Keep files small and focused so they are cheap to read.
- Keep this file current: stack, structure and conventions go below.

# Project

Personal portfolio of Felix Pfeiffer (MSc Information Security @ UCL, ex Fraunhofer IOSB, BaFin, AXA, co-founder of Cosmoshield and Pakt). Experiment in how far AI can take a real project.

# Mission

1. Rank first on Google for "Felix Pfeiffer".
2. Be easy for AI assistants and AI search to find, read and cite.

SEO and AI optimization come before visual polish when the two conflict. Every change must keep:
- Real, crawlable text in the HTML (no content only inside images or client-only code).
- Correct metadata, canonical URL, JSON-LD `Person`, `sitemap.xml`, `robots.txt`, `llms.txt`.
- Fast loads and good Core Web Vitals.
- Facts consistent with LinkedIn and GitHub (name, role, links).
Site config and facts live in `src/config.ts`.

# Stack and structure

- Next.js (App Router), TypeScript, Tailwind. Next.js 16 differs from training data: read `node_modules/next/dist/docs/` before using its APIs.
- AI features: Vercel AI SDK with Claude (not installed yet).
- Self-hosted via Docker: multi-stage `Dockerfile` (Next `standalone` output), `docker-compose.yml` hardened (non-root, read-only, caps dropped).
- Source in `src/app` (pages, `api/contact`) and `src/components` (macOS UI: menu bar, dock, desktop icons, Profile and Mail windows).
- Profile content lives only in `src/data/profile.ts` and feeds the Profile window, the hidden SEO text and JSON-LD. Never put the phone number on the site.
- Mail window posts to `/api/contact` (nodemailer, SMTP env vars in `.env.example`, honeypot and per-IP rate limit).
- Glass look is the `.glass` class in `globals.css`. Keep it inside `@layer components` so Tailwind utilities can override it.
- Do not use `pkill -f` in the shell, it kills the tool shell. Use `fuser -k <port>/tcp`.
