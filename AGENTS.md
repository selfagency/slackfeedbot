# AGENTS.md

## Project Overview

SlackFeedBot — a GitHub Action (`runs.using: node24`) that fetches an RSS feed and posts new items to Slack and/or Discord webhooks. TypeScript 6 source in `src/` is bundled with esbuild into `dist/index.cjs`, which is committed; the Actions runtime executes the committed bundle.

- Repo: `github.com/selfagency/slackfeedbot` (MIT, see `LICENSE.txt`)
- Runtime: Node 24 everywhere (`.nvmrc` 24, `action.yml` `node24`, esbuild `--target=node24`, engines `>=24`)
- Lint/format: Biome via **ultracite** (`biome.jsonc` extends `ultracite/biome/core` + `ultracite/biome/vitest`); no eslint, no prettier (biome formats JS/TS/JSON/**YAML** but NOT Markdown — MD files have no formatter gate)
- Type checking: `tsc --noEmit` (strict, TS6 semantics, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `allowImportingTsExtensions` — relative imports carry `.ts` extensions)
- Tests: **vitest** (`npm test`, script runs `vitest run --passWithNoTests`)
- Commit gates: husky pre-commit = rebundle → lint-staged (ultracite fix on `src/**`) → **fallow audit --staged** (`fallow.config = .fallowrc.jsonc`)
- Static analysis: DeepSource (secrets + javascript analyzers; `.deepsource.toml`)
- CI: `.github/workflows/ci.yml` (push main/dev + PRs: npm ci → lint → test, Node 24) — all workflow `uses:` are SHA-pinned with `# vX.Y.Z` comments; `.github/dependabot.yml` keeps npm + actions current (Dependabot updates SHA + comment together)

## Setup

- `nvm use` (Node 24)
- `npm install` (runs `prepare` → `husky`, activating hooks; fallow must be on PATH or in node_modules for the audit gate)

## Commands

- `npm run lint` — `tsc --noEmit` + `ultracite check`. The main quality gate.
- `npm test` — vitest unit + integration suite (57 tests; local fixture servers only, no network).
- `npm run build` — esbuild → `dist/index.cjs`. The runtime artifact. Pre-commit rebundles automatically.
- `npm start` — runs the bundle; fails validation unless `INPUT_*` env vars are set (see Testing).

## Architecture

`src/main.ts` is the bundle entry; it wires real collaborators into `run()` (injected in `src/action.ts`, which is how tests drive the orchestration).

Pipeline (`src/action.ts` `run(deps)`):

1. `validate()` (`src/lib/validate.ts`) — `rss` + at least one of `slack_webhook`/`discord_webhook` (https; Discord must match `discord.com/api/webhooks/`); `cache_dir` or `interval` required; unfurl mode rejects `show_*` styling.
2. `getFeed()` (`src/lib/getfeed.ts`) — **rss-parser** (`parseURL`); maps `isoDate`→ms `created`, prefers full `content:encoded`, extracts item images (iTunes art → image enclosure). Cache mode drops cached items and anything older than 1 hour (missing cache file → fallback to 1-hour window); interval mode keeps items newer than N minutes. Empty feed = `info` + empty result (no failure).
3. `genPayload()` (`src/lib/payload.ts`) — Slack Block Kit payload; `src/lib/markdown.ts` converts HTML→mrkdwn (Slack flavor: `<url|label>`, `*bold*`, `_em_`; Discord flavor: `[label](url)`, `**bold**`). Slack text nodes + titles are entity-escaped (`&`,`<`,`>` → entities per Slack docs) so feed content can never inject `<!channel>`/`<@user>` mention syntax; link URLs are sanitized (`<>`, whitespace, leading `@`/`!` stripped).
4. Discord target (`src/lib/discord.ts`) — one embed per item: title ≤256, description ≤4096, `url`, ISO `timestamp`, image; chunked at 10 embeds / 6000 chars per message; `allowed_mentions: {"parse": []}` hardcoded (webhook default is `parse:["users"]`).
5. Delivery (`src/lib/deliver.ts`) — POST with response validation (Slack: 200 + body `ok`; Discord: 200/204), 429 honored via `Retry-After` header with ≤3 attempts, never retries 400/404. Returns per-target `DeliverResult`.
6. Cache write (`src/lib/cache.ts`) — happens **only if every delivery succeeded** (failed targets are retried next run); per-hostname JSON of sha256 hashes.

Support: `src/lib/feedimg.ts` (favicon via favicongrabber.com, base-URL injectable for tests), `src/types.ts` (all shared interfaces).

## Testing

- Tests are co-located `*.test.ts` (vitest). They are held to full ultracite standard (no lint downgrades).
- Network isolation: local `node:http` fixture servers; `INPUT_*` env vars exercise `@actions/core`.
- `run()` takes injected collaborators (`RunDeps`) — orchestration tests fake nothing: real getFeed/genPayload/deliver against local servers.
- Transitional lint downgrades exist in `biome.jsonc` (legacy `src/**/*.ts` only) and `.fallowrc.jsonc` (complexity rules) — DELETE both when the legacy modules (cache/validate) get refactored.

## Critical Rules

- `dist/index.cjs` is committed and is what actually runs. Never hand-edit `dist/`; let the pre-commit hook rebundle; never bypass the hook when `src/` changed.
- Node 24 for development and bundling.
- `slack_webhook`/`discord_webhook` are credentials. Pass via secrets, never commit, never log the value (validate logs `[set]`/`[unset]`; `run()` calls `core.setSecret`).

## Inputs: keep four surfaces in sync

`action.yml`, `src/action.ts` (parsing), `src/lib/validate.ts` (validation), `README.md` (options + examples). Adding an input means touching all four (+ tests). Current inputs: rss, feed_name, feed_image, slack_webhook, discord_webhook, cache_dir, interval, unfurl, show_desc, show_img, show_date, show_link.

## Git Workflow

- git-flow-next initialized (classic, develop branch = `dev`): `git flow feature start|finish`, base-branch promotion via `git flow integrate`.
- `main` — releases; `dev` — staging, dogfooded live by the FeedBot workflow via `uses: selfagency/slackfeedbot@dev`.
- Conventional Commits (`feat:`, `fix:`, `ci:`, `chore:`, `test:`, `docs:`); one logical change per commit.
- Husky pre-commit: `npm run build` → `git add dist` → `npm run lint-staged` → fallow managed block (`fallow audit --staged`).

## CI/CD

- `.github/workflows/ci.yml` — lint + tests on push (main/dev) and PRs.
- `.github/workflows/feedbot.yml` — dogfooding: cron hourly at :23 + `workflow_dispatch`; ten status-feed steps (GitHub, Tailscale, Bunny, Wasabi, netcup, RackNerd, Cloudflare, Fivenines, 1Password, Resend) → Discord via `DISCORD_WEBHOOK` secret, `continue-on-error: true`, shared cache dir (per-hostname cache files). Slack dogfood steps removed — the owner has no Slack team; Slack delivery remains supported for users. Run takes ~18s (10 fetches; public repo = free minutes).
- `.github/workflows/release.yml` — push to `main`: `EndBug/version-check` detects a `package.json` version change → `softprops/action-gh-release` tags `v{version}`.
- No in-repo PR gate beyond ci.yml; DeepSource analyzes server-side.

## Releasing (version bump checklist)

1. Bump `version` in `package.json`.
2. Update every `selfagency/slackfeedbot@vX.Y.Z` reference in `README.md`.
3. Commit — hooks rebundle `dist/index.cjs`.
4. `git flow feature finish` → `dev` soak → merge `dev`→`main` → release workflow tags `v{version}`.

## Code Style

- Biome via ultracite: double quotes, 2-space, trailing commas, sorted exports/interfaces (autofixable: `npx ultracite fix [--unsafe]`).
- `lint-staged` runs `npx ultracite fix` on staged `src/**/*.{js,mjs,cjs,ts,mts,cts,json,jsonc}`; Markdown/YAML are not pre-committed-formatted.
- No `any`; explicit types; type-only exports live in `src/types.ts`.

## Known Quirks

- `cacheSlug()` in `src/lib/cache.ts` appends `${slug}-…` to itself — self-referential but deterministic. Changing the hash scheme invalidates every deployed cache → mass reposts. Commented in source.
- Cache-mode filtering keeps a 1-hour recency window regardless of interval.
- Slack delivery success requires body `ok`; a 200 with error text (e.g. `invalid_payload`) is a failure. Discord POSTs send `wait=true`, so save failures return real 400s instead of a silent 204.
- External calls carry hard timeouts: feed fetch 10s (`FEED_TIMEOUT_MS`, getfeed), favicon 10s (`FAVICON_TIMEOUT_MS`, feedimg), webhook POST 15s (`WEBHOOK_TIMEOUT_MS`, deliver). Feed fetching is our own `fetch` + `parseString` (no rss-parser `parseURL`, no `url.parse` deprecation warnings).
- Feed items without dates get `created = 0` and are **skipped** in both modes (no recency evidence → no publication; prevents reposts).
- Scheduled workflows run from the default branch only and auto-disable after 60 days of repository inactivity (public repos) — use `workflow_dispatch` for manual smoke tests.
