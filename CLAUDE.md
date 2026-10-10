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
- Self-hosted with `docker compose`: services `db` (Postgres 17), `migrate` (dbmate, runs `up` before the app starts) and `web` (Next `standalone`). All hardened: non-root or dropped caps, read-only, no-new-privileges. `db` and `migrate` are only on the internal `backend` network and publish no ports. `web` binds to `127.0.0.1:3000` unless `WEB_BIND` is set.
- First run: `scripts/init-secrets.sh`, put the SMTP password into `secrets/smtp_password` and the Twelve Data key into `secrets/twelve_data_api_key`, copy `.env.example` to `.env`, then `docker compose up -d --build`.
- Migrations live in `db/migrations` as dbmate SQL with `-- migrate:up` and `-- migrate:down`. Always write both. Roll back with `docker compose run --rm migrate rollback`, check with `docker compose run --rm migrate status`. Roles are created once by `db/roles.sql` on first database init: `portfolio_migrator` owns the schema, `portfolio_app` only gets the grants a migration gives it (currently select and insert on `events`).
- Next.js connects to the database in server code only: `src/lib/db.ts` (the only place that imports `pg`), route handlers, and `use cache` queries in `src/lib/stats.ts`.
- Source in `src/app` (pages, `stats`, `api/contact`, `api/stocks`, `api/track`) and `src/components` (macOS UI: menu bar, dock, desktop icons, window manager in `windows/`, Profile, Mail, Stocks and Stats).
- Windows: `windows/WindowManager.tsx` owns state (one window per app id), `windows/Window.tsx` is the frame (drag, resize, minimize, zoom, close). App content uses `useWindow()` for traffic lights and drag handles. Register new apps in `src/components/apps.tsx`.
- Stocks data comes from Twelve Data (free Basic plan: 8 credits per minute, 800 per day) through `src/lib/market.ts`, which caches, coalesces and budgets credits (stale data on failure). The API key is the secret `twelve_data_api_key`, sent in the Authorization header. Free plan has no index symbols, so the market overview uses six US-listed index funds (`src/components/stocks/indices.ts`), which uses most of the 8 credits per minute. Keep that list short. `MARKET_DATA_BASE` overrides the host for tests.
- Profile content lives only in `src/data/profile.ts` and feeds the Profile window, the hidden SEO text and JSON-LD. Never put the phone number on the site.
- Mail window posts to `/api/contact` (nodemailer, SMTP settings in `.env`, honeypot and per-IP rate limit).
- Glass look is the `.glass` class in `globals.css`. Keep it inside `@layer components` so Tailwind utilities can override it. Glass is for the functional layer (dock, toolbars, menus). Content cards use plain translucent fills.
- Brand icon: `src/app/icon.svg` (F and P monogram on a blue tile). `favicon.ico` and `apple-icon.png` are rendered from it. Regenerate them if the SVG changes.
- Do not use `pkill -f` in the shell, it kills the tool shell. Use `fuser -k <port>/tcp`.

# Privacy and tracking

- The only tracking is `/api/track`, shown in full on `/stats`. It stores time, kind (visit or click), a whitelisted target and a daily anonymous visitor hash. No cookies, no IP, no user agent storage. DNT, GPC and bots are ignored.
- Anything new that is tracked must be added to the whitelist in `src/lib/tracking.ts`, shown on `/stats` and described in the transparency text there. Never add third-party analytics.

# Security rules

- Credentials only come from Docker secrets files read through `readSecret()` in `src/lib/secrets.ts`. Never put a secret in code, env values, URLs, logs, commits or chat. Never read or print `secrets/` or `.env` (blocked in `.claude/settings.json`).
- SQL only with `$1` placeholders. ESLint blocks interpolated SQL, direct `pg` imports and direct `process.env.*PASSWORD` reads. Do not disable these rules.
- Public endpoints validate input, rate limit with `src/lib/rateLimit.ts` and return no internal details.
- CI (`.github/workflows/ci.yml`) runs lint, build, npm audit, gitleaks, CodeQL, a migration up/down/up test with a least-privilege check, hadolint, Trivy and an optional Claude security review on pull requests (needs the `ANTHROPIC_API_KEY` repository secret). Dependabot updates npm, Docker, Compose and Actions weekly. Keep CI green. Run the `security-review` skill before large changes.
