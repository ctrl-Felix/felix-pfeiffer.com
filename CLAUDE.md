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
- Self-hosted with `docker compose` (deployed on Coolify as a Docker Compose application): services `db` (Postgres 17, built from `db/Dockerfile` with the role script baked in), `migrate` (dbmate, built from `db/migrate.Dockerfile` with the migrations baked in, runs `up` before the app starts) and `web` (Next `standalone`). All hardened: dropped caps, read-only, no-new-privileges. `db` and `migrate` are only on the internal `backend` network. `web` only `expose`s 3000: Coolify routes the domain to it. Locally add `docker-compose.local.yml` to publish `127.0.0.1:3000`.
- Configuration is plain environment variables, listed in `.env.example`: `DB_SUPERUSER_PASSWORD`, `DB_MIGRATOR_PASSWORD`, `DB_APP_PASSWORD`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `CONTACT_TO`. On Coolify set them in the app's Environment Variables. Locally `scripts/init-env.sh` writes a `.env` with random database passwords, then `docker compose -f docker-compose.yml -f docker-compose.local.yml up -d --build`. `web` only gets the app password and SMTP values, never the superuser or migrator password. The database roles are created once on first init of the data volume, so changing a password later needs `ALTER ROLE` as well.
- Migrations live in `db/migrations` as dbmate SQL with `-- migrate:up` and `-- migrate:down`. Always write both. Roll back with `docker compose run --rm migrate rollback`, check with `docker compose run --rm migrate status`. Roles are created once by `db/roles.sql` (via `db/init/01-roles.sh`) on first database init: `portfolio_migrator` owns the schema, `portfolio_app` only gets the grants a migration gives it (currently select and insert on `events`).
- Next.js connects to the database in server code only: `src/lib/db.ts` (the only place that imports `pg`), route handlers, and `use cache` queries in `src/lib/stats.ts`.
- Source in `src/app` (pages, `stats`, `api/contact`, `api/stocks`, `api/track`) and `src/components` (macOS UI: menu bar, dock, desktop icons, window manager in `windows/`, Profile, Mail, Stocks, Stats and Finder).
- Windows: `windows/WindowManager.tsx` owns state (one window per app id), `windows/Window.tsx` is the frame (drag, resize, minimize, zoom, close). App content uses `useWindow()` for traffic lights and drag handles. Register new apps in `src/components/apps.tsx`.
- Stocks data is placeholder data for now: `src/lib/placeholderMarket.ts` generates deterministic fake quotes, charts and search results for a fixed list of symbols, and `src/lib/market.ts` is the single switch point (a `MarketProvider` with `getQuotes`, `getChart`, `searchSymbols`). The request layer stays real: `api/stocks/*` routes with rate limiting, `src/components/stocks/api.ts` fetchers and the hooks. The UI says the data is placeholder. A real provider (needs free keys, US stocks only, no index symbols) replaces `placeholderMarket` in `market.ts`; keys must be environment variables read with `readSecret()`. The market overview tracks US-listed index funds (`src/components/stocks/indices.ts`).
- Profile content lives only in `src/data/profile.ts` and feeds the Profile window, the hidden SEO text and JSON-LD. Never put the phone number on the site.
- Mail window posts to `/api/contact` (nodemailer, SMTP settings in `.env`, honeypot and per-IP rate limit).
- Glass look is the `.glass` class in `globals.css`. Keep it inside `@layer components` so Tailwind utilities can override it. Glass is for the functional layer (dock, toolbars, menus). Content cards use plain translucent fills.
- Brand icon: `src/app/icon.svg` (F and P monogram on a blue tile). `favicon.ico` and `apple-icon.png` are rendered from it. Regenerate them if the SVG changes.
- Do not use `pkill -f` in the shell, it kills the tool shell. Use `fuser -k <port>/tcp`.

# Privacy and tracking

- The only tracking is `/api/track`, shown in full on `/stats` and in the Stats window (same `StatsBody`, data from `/api/stats`). It stores time, kind (visit or click), a whitelisted target and a daily anonymous visitor hash. No cookies, no IP, no user agent storage. DNT, GPC and bots are ignored.
- Anything new that is tracked must be added to the whitelist in `src/lib/tracking.ts`, shown on `/stats` and described in the transparency text there. Never add third-party analytics.

# Security rules

- Credentials only come from environment variables (Coolify env or an untracked `.env`) read through `readSecret()` in `src/lib/secrets.ts`, which also supports `NAME_FILE`. Never put a secret in code, `docker-compose.yml`, `.env.example`, URLs, logs, commits or chat. Compose requires them with `${VAR:?}` so a missing one fails fast. Never read or print `.env` (blocked in `.claude/settings.json`).
- SQL only with `$1` placeholders. ESLint blocks interpolated SQL, direct `pg` imports and direct `process.env.*PASSWORD` reads. Do not disable these rules.
- Public endpoints validate input, rate limit with `src/lib/rateLimit.ts` and return no internal details.
- CI (`.github/workflows/ci.yml`) runs lint, build, npm audit, gitleaks, CodeQL, a migration up/down/up test with a least-privilege check, hadolint, Trivy and an optional Claude security review on pull requests (needs the `ANTHROPIC_API_KEY` repository secret). Dependabot updates npm, Docker, Compose and Actions weekly. Keep CI green. Run the `security-review` skill before large changes.
