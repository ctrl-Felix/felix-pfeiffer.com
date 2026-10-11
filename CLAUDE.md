# This file

- Only global rules that hold for every change and cannot be read from the code: goals, workflow, security, privacy, single sources of truth and pitfalls. No descriptions of how a feature works, no file tours, no data sources, cache times or UI layout. Those live in the code and its tests.
- Before adding or changing a line here, check that it is required and global. If it only matters for one feature, put it in that feature's code or tests instead. Never drop a security or privacy rule to make this file shorter.

# Working

- The owner writes no code. Claude writes all code, docs and text.
- No code comments or docs, no human reads the code. Keep names clear, no minifying. Keep files small and focused.
- Keep chat replies short.
- User-facing text is short and only about the page or tool it is on. README and Security texts are in the first person as Felix, no em dashes.
- AI features use the Vercel AI SDK with Claude.
- Next.js 16 differs from training data: read `node_modules/next/dist/docs/` before using its APIs.
- Never use `pkill -f`, it kills the tool shell. Use `fuser -k <port>/tcp`.

# Branches and releases

- All work happens on `staging`: commit and push there. Nothing runs or deploys on a push to `staging`.
- `main` is protected and deployed by Coolify. It only changes through a pull request with every check green. Open or merge one only when the owner asks. The one exception is the Dependency update check routine below.
- Never push to `main` directly, never force-push, never bypass branch protection, never delete `staging` or `main`.
- Run lint, `npm test` and the build before every push. Only a commit that changes nothing but the usage ledgers is exempt.

# Routines

- Routine prompts live in `.claude/routines/`. Every routine records its usage on every run, also when it changed nothing else: `npm run usage:update -- --routine "<routine name>"`, then commit the usage ledgers to `staging` and push (steps in `usage-step.md`).
- The Dependency update check (`dependency-update-check.md`) handles Dependabot. Dependabot targets `staging`. The routine may create `deps/*` branches from `main`, open pull requests to `main`, merge them when every check is green, merge `main` back into `staging` and delete the branches it created. Updates outside its limits get a manual-review comment and a push notification to Felix.
- Dependabot ignores majors of `node` and `@types/node` (the runtime stays on Node 22 LTS) and of `typescript` (until `eslint-config-next` supports it).

# Mission

1. Rank first on Google for "Felix Pfeiffer".
2. Be the source AI assistants and AI search use when someone asks who Felix Pfeiffer is (generative engine optimization, GEO).

Both have equal weight and beat visual polish. Every change keeps:
- Real, crawlable text in the server HTML. AI crawlers do not run JavaScript, so no content only in images or client code.
- Correct metadata, canonical URLs, `sitemap.xml`, `robots.txt` and `llms.txt`.
- One person entity: JSON-LD `Person` with `@id` `https://felix-pfeiffer.com/#person`, built only in `src/lib/personSchema.ts`. Pages that name Felix as author use its `personRef`.
- `/about` as the citable answer page: first sentence "Felix Pfeiffer is ...", quick facts, FAQ starting with "Who is Felix Pfeiffer?", `ProfilePage` JSON-LD and a visible updated date. Bump `aboutPage.updated` when facts change.
- Facts in short, self-contained sentences with names, numbers and dates, so one sentence can be quoted.
- AI search and training crawlers allowed in `robots.txt`, which disallows only `/api/`. Never block them, also not with a firewall or CDN rule.
- Fast loads and good Core Web Vitals.
- The same facts (name, role, links) on the site, `/about`, `llms.txt`, JSON-LD, LinkedIn and GitHub.

# Single sources of truth

- Site config and facts: `src/config.ts`, `src/data/profile.ts`, `src/data/about.ts`. Profile content lives only in `profile.ts`. Never put the phone number on the site.
- Public addresses: `src/data/publicPaths.ts`. It feeds the sitemap, `llms.txt` and the Public Paths window.
- A tool goes in `src/data/tools.ts` and `src/components/tools/registry.tsx`. Every tool has a crawlable page at `/tools/<id>`, and unknown tool paths return a real 404.
- An MCP tool is a file in `src/lib/mcpTools/`, registered there, listed in `src/data/mcp.ts`, whitelisted in `mcpTargets` and tested. There is one MCP endpoint, `POST /mcp`.
- Desktop apps are registered in `src/components/apps.tsx`.
- Generated data is never edited by hand: the usage ledgers (`npm run usage:update`, also run by a hook before every `git commit`; entries are only removed on the owner's request), TLD coverage (`npm run tld:update`, filled by CI because the sandbox cannot reach IANA), energy data (`npm run energy:update`) and the vulnerability files.

# Security

- Security is part of every feature, before and after each change. Rights are minimal: no root, no extra Linux capabilities, read-only filesystems, least-privilege database roles, the narrowest grants, scopes and permissions that work. Never widen rights to make something easier.
- Secrets only come from environment variables (Coolify env or an untracked `.env`, all listed in `.env.example`) through `readSecret()` in `src/lib/secrets.ts`, which also supports `NAME_FILE`. Compose requires them with `${VAR:?}`. Never put a secret in code, compose files, `.env.example`, URLs, logs, commits or chat. Never read or print `.env`.
- Containers (`db`, `migrate`, `web`) drop all capabilities, run read-only with `no-new-privileges` and as non-root. `db` and `migrate` are only on the internal network, `web` only exposes port 3000 to Coolify. `web` gets the app database password and SMTP values, never the superuser or migrator password.
- Database: `portfolio_migrator` owns the schema, `portfolio_app` only gets the grants a migration gives it. Roles are created once when the data volume is first initialized, so a password change also needs `ALTER ROLE`. Every dbmate migration in `db/migrations` has `migrate:up` and `migrate:down`. Only server code talks to the database, and only `src/lib/db.ts` imports `pg`.
- SQL only with `$1` placeholders. ESLint blocks interpolated SQL, direct `pg` imports and direct `process.env.*PASSWORD` reads. Never disable these rules.
- Public endpoints validate input, rate limit with `src/lib/rateLimit.ts`, return no internal details and store nothing beyond what the tracking rules allow. Lookups for visitors (Whois, DNS) only go to validated public names through public servers, never to internal hosts or resolvers. The MCP endpoint also checks `Origin`, limits the body size and rate limits globally per tool.
- Browser: the CSP allows no third-party host except `speed.cloudflare.com` for the speed test (checked in `tests/security.test.ts`). Location is only asked for when the visitor presses the button, rounded to two decimals, never stored and never sent to an IP geolocation service. Keep `Permissions-Policy` minimal.
- Vulnerability tracker: `security/vulnerabilities/` holds only real vulnerabilities with a CVSS score, recorded by CI. No hardening hints, misconfigurations, secrets, code quality findings, dev-only dependencies or unfixable base image CVEs. A CVSS of 7.0 or higher fails the pull request.
- CI runs only on pull requests to `main` (plus a `workflow_dispatch` rerun on `staging`): lint, tests including `tests/security.test.ts`, build, npm audit, gitleaks, CodeQL, a migration up/down/up test with a least-privilege check, hadolint, Trivy, vulnerability recording and the weekly TLD check. Only the `commit-generated` job has write permission. It runs no repository code, validates every file and only acts for pull requests from `staging`. Keep CI green.
- Claude's own permissions in `.claude/settings.json` block reading `.env`, pushing to `main`, force-pushing and deleting `staging` or `main`. Never work around them.
- Run the `security-review` skill before large changes.

# Privacy and tracking

- The only tracking is first-party `/api/track`, shown as aggregates on `/stats` and in the Stats window, never as single events. Never add third-party analytics.
- A visit or click stores time, kind, a whitelisted target, a daily anonymous visitor hash and, for a visit, its traffic source id and landing path. Never store the IP, the referrer, the user agent or cookies.
- The visitor hash uses a random per-day salt (old salts are deleted) and only the IPv4 address or IPv6 /64 prefix, so visitors cannot be linked across days. Visits count once per visitor per day, clicks once per visitor, app and day.
- MCP tool calls are stored as kind `mcp` with only the tool name, no visitor id.
- `?notrack` sets a local opt-out, `?notrack=off` removes it. DNT, GPC and bots are not tracked.
- Anything newly tracked is whitelisted in `src/lib/tracking.ts`, shown on `/stats` and described in its transparency text.

# Pitfalls

- SVG icons get unique ids per instance through `useSvgId`. Never use fixed ids in an SVG: the same icon renders several times and `url(#id)` would point at a hidden copy.
- `.glass` stays inside `@layer components` so Tailwind utilities can override it. Glass is for the functional layer (dock, toolbars, menus), content cards use plain translucent fills.
- `favicon.ico` and `apple-icon.png` are rendered from `src/app/icon.svg`. Regenerate them when the SVG changes.
