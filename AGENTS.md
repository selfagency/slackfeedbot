# AGENTS.md

## Project Overview

SlackFeedBot — a GitHub Action (`node16` JavaScript runtime) that fetches an RSS feed and posts new items to a Slack Incoming Webhook. TypeScript source in `src/` is bundled with esbuild into `dist/index.cjs`, which is committed to the repo; the Actions runtime executes the committed bundle, not the TypeScript source.

- Repo: `github.com/selfagency/slackfeedbot` (MIT, see `LICENSE.txt`)
- Runtime: Node 16 everywhere (`.nvmrc`, `action.yml` `runs.using: node16`, esbuild `--target=node16`, CI `setup-node` 16)
- Module system: package is ESM (`"type": "module"`), but the action artifact is a single CJS bundle
- Static analysis: DeepSource (secrets + javascript analyzers, prettier transformer; `.deepsource.toml`)

## Setup

- Use Node 16: `nvm use`
- `npm install` (also runs `prepare` → `husky install`, which activates the git hooks)

## Commands

- `npm run lint` — the only quality gate: `tsc --noEmit` + `eslint src/.` + `prettier --check src/.`. Run before every commit.
- `npm run bundle` — esbuild → `dist/index.cjs`. This is the runtime artifact. The pre-commit hook runs it automatically and stages `dist`.
- `npm run build` — tsc emit to `dist/` (JS + declarations). Not used by the action runtime; `bundle` is what ships.
- `npm start` — runs `node dist/index.cjs`. Fails validation outside Actions unless `INPUT_*` env vars are set (see Testing).

## Testing

There is no test suite, test framework, or test files. Do not claim tests exist. Verify changes with:

1. `npm run lint`
2. Manual run of the bundle: `@actions/core` reads inputs from `INPUT_<NAME>` env vars, so a local smoke test works without Actions:

   ```bash
   INPUT_RSS='https://example.com/feed.xml' \
   INPUT_SLACK_WEBHOOK='https://hooks.slack.com/services/...' \
   INPUT_INTERVAL=15 node dist/index.cjs
   ```

3. Live dogfooding via the `FeedBot` workflow (see CI/CD), which can be triggered manually with `workflow_dispatch`.

## Architecture

`src/action.ts` orchestrates the pipeline:

1. `validate()` (`src/lib/validate.ts`) — input checks: `rss` and `slack_webhook` required and must start with `http`/`https`; `cache_dir` or `interval` required; `interval` must parse as a number; unfurl mode rejects `show_*` styling inputs.
2. `getFeed()` (`src/lib/getfeed.ts`) — parses the feed with `rss-to-json`, then filters items:
   - `cache_dir` mode: drops items whose hash is in the cache, and additionally only keeps items from the last 1 hour; an unreadable/missing cache file falls back to posting everything from the last hour.
   - `interval` mode: keeps items newer than N minutes.
3. `genPayload()` (`src/lib/payload.ts`) — builds Slack Block Kit payload; converts HTML descriptions to Markdown (showdown, striptags, linkedom, html-to-text).
4. `slack()` (`src/lib/slack.ts`) — POSTs the JSON payload to the webhook.
5. `writeCache()` (`src/lib/cache.ts`) — persists sha256 hashes of published item slugs to a per-hostname JSON file in the cache dir.

Support: `src/lib/feedimg.ts` (favicon lookup via favicongrabber.com), `src/types.d.ts` (ambient interfaces: `RssFeed`, `RssFeedItem`, `Payload`, `Block`, `Icons`).

## Critical Rules

- `dist/index.cjs` is committed and is what actually runs in users' workflows. Never hand-edit `dist/`; always let the pre-commit hook rebundle, and never bypass the hook when `src/` changed.
- Use Node 16 for development and bundling.
- `slack_webhook` is a credential. Pass via repository/org secrets, never commit it. It only appears in `core.debug` output, which is masked unless `ACTIONS_STEP_DEBUG` is set — keep it that way.

## Inputs: keep four surfaces in sync

Action inputs are declared in `action.yml`, parsed in `src/action.ts`, validated in `src/lib/validate.ts`, and documented in `README.md`. Any input change must reconcile all four. Known drift right now:

- Source reads `show_desc` and `show_img`; `action.yml` instead declares `show_description` (never read) and omits `show_img`.
- `action.yml` marks `cache_dir` as `required: true`, but `validate()` accepts `cache_dir` OR `interval`.

## Git Workflow

- `main` — default branch; releases are cut from here.
- `dev` — staging; this branch is exercised live by the FeedBot workflow via `uses: selfagency/slackfeedbot@dev`.
- Conventional Commits (`feat:`, `fix:`, `ci:`, `chore:`). History is mixed but conventional is the current direction; one logical change per commit.
- Husky hooks: `pre-commit` (bundle → stage `dist` → lint-staged), `post-receive` (`npm i`).

## CI/CD

- `.github/workflows/feedbot.yml` — dogfooding: cron `*/15` + `workflow_dispatch`. Runs this action from `@dev` against 7 real feeds, all `continue-on-error: true`, caching to `./slackfeedbot-cache` via `actions/cache`. Uses the repo secret `SLACK_WEBHOOK`.
- `.github/workflows/release.yml` — on push to `main`: `EndBug/version-check` detects a `package.json` version change → `action-create-release` creates tag `v{version}` + GitHub release.
- No in-repo CI runs lint on PRs or pushes. The gates are: the pre-commit hook, DeepSource (server-side), and the dogfood workflow.

## Releasing (version bump checklist)

1. Bump `version` in `package.json`.
2. Update every `selfagency/slackfeedbot@vX.Y.Z` reference in `README.md` (currently 5 occurrences).
3. Commit — the pre-commit hook rebundles and stages `dist/index.cjs`.
4. Push/merge to `main`; the release workflow tags and releases automatically.

## Code Style

- TypeScript strict mode, target `es2016`, ESM.
- ESLint: `standard` + `@typescript-eslint/recommended` + json/markdown/yml plugins; yml-specific overrides in `.eslintrc`.
- Prettier (`.prettierrc`): 120 cols, single quotes, semicolons, no trailing commas, `arrowParens: avoid`, `proseWrap: preserve`.
- lint-staged auto-fixes `*.{js,json,md,yml}` only — TypeScript files are NOT auto-formatted on commit; format them manually.

## Known Quirks

- `src/lib/feedimg.ts` fetches `https:/favicongrabber.com` (single slash). It works because WHATWG URL normalization handles special schemes; verify behavior before "fixing" it.
- `cacheSlug()` in `src/lib/cache.ts` appends `${slug}-…` to itself — self-referential but deterministic. Changing the hash scheme invalidates every deployed cache and will cause mass reposts.
- `src/types.d.ts` is imported both as `from '../types.d'` and as `from '../types'`; both resolve to the same ambient declaration file.
- Cache-mode filtering keeps a 1-hour recency window regardless of workflow interval, so older uncached items never post.
