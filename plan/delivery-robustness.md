# Plan: Delivery Robustness & Artifact Integrity Follow-ups

Status: **COMPLETE & RELEASED as v2.0.1** (P1 a05664b, P2 6bf4fc1, P3 93af8df, P4 bc59b5e, P5 454e0a2; verified: dogfood run success with 0 errors and 0 `url.parse` warnings). Original draft below.

## Success Criteria

1. Discord message-level delivery failures surface as run failures (no silent acceptance).
2. No external HTTP call in the product can exceed its timeout (feed 10s, favicon 10s, webhook 15s).
3. A Dependabot npm merge can never ship a stale `dist/index.cjs` without a red CI run, and is self-healed.
4. No `url.parse()` deprecation warnings in runtime runs; feed fetches use our own timeout + `res.ok` handling.
5. Date-less feed items dedupe by title in cache mode (behavior change — see Q1).
6. Slack payloads carry a `text` fallback; usernames clamped; release workflow cruft removed.
7. All existing gates stay green (57+ tests, lint 0, audit) — new behavior pinned by new tests, red-first.

## Fixes

### Fix 1 — Discord `wait=true` (correctness, ~15 min)

`src/lib/deliver.ts`: for platform `discord`, resolve the POST target with the `URL` constructor and set `wait=true` (preserves any pre-existing query params, e.g. a user-configured `thread_id`). Success remains 200/204 (wait=true yields 200 with the message JSON); a failing message save now returns a real 400 that flows into the existing `DeliverResult` failure path.
**Tests** (deliver.test.ts): capture request URL — assert `wait=true` present for discord, absent for slack; 400-invalid-embed → `ok:false`; 200-with-message → `ok:true`.

### Fix 2 + Fix 4 — Fetch timeouts + parseURL removal

- `src/lib/getfeed.ts`: replace `parser.parseURL` with our own `fetch` (`AbortSignal.timeout(FEED_TIMEOUT_MS)` = 10s, `User-Agent: slackfeedbot`), `res.ok` check with body in the error, then `parser.parseString(text)`. Adds optional 4th param `timeoutMs = FEET_TIMEOUT_MS` (`FEED_TIMEOUT_MS` exported const). Kills the rss-parser `url.parse()` deprecation warnings (verified ~20/run today) and gives feed errors real status context.
- `src/lib/feedimg.ts`: `AbortSignal.timeout(FAVICON_TIMEOUT_MS)` = 10s on the grabber fetch.
- `src/lib/deliver.ts`: per-attempt `signal: AbortSignal.timeout(WEBHOOK_TIMEOUT_MS)` = 15s (created inside `attempt()` so retries get fresh budgets); wrap `fetchImpl` + `res.text()` in try/catch → return `{ ok: false, status: 0, body: String(err) }` for timeouts/connection errors instead of rejecting.
**Tests** (getfeed/feedimg/deliver.test.ts): slow local server (150ms sleep) + `timeoutMs: 50` → timeout error/result; non-200 feed page → error including status; deliver timeout → `ok:false`, no retry storm (single attempt).

### Fix 3 — Dependabot vs committed `dist/index.cjs`

Dependabot commits bypass the pre-commit rebundle → shipped bundle can drift from the lockfile. Two-part remedy:

1. **Staleness gate in `ci.yml`**: after `npm run build`, `git diff --exit-code dist` — any push to main/dev with a stale bundle goes red (catches dependabot merges and humans who bypass hooks).
2. **Self-heal — new `.github/workflows/dist-sync.yml`**: on push to main with `paths: ["src/**", "package.json", "package-lock.json"]` — checkout, `npm ci`, `npm run build`; if `git status --porcelain dist` is dirty → commit `chore: rebuild dist bundle` with `GITHUB_TOKEN` (pushes made with it don't retrigger workflows — no loop). SHA-pinned actions, minimal `contents: write`.
3. `release.yml`: drop the unused `setup-node` step (cruft, part of Fix 6).

### Fix 5 — Date-less feed items (needs your confirmation — Q1)

`src/lib/getfeed.ts` `toTimestamp`: fall back to `0` instead of `Date.now()`. Consequences (intended):
- Cache mode: `cacheSlug` has no date part for these items → deterministic hash → **dedupes by feed+title** (today it would repost forever).
- Interval mode: date-less items are never "newer than N minutes" → skipped (today they'd repost forever) — `core.debug` notes the skip.
Behavior change; none of the 10 dogfood feeds are affected today (verified 0 date-less items across RackNerd/Resend/Fivenines/netcup/Tailscale).
**Tests**: getfeed — date-less item + cache roundtrip (second run yields empty filtered); date-less item + interval → filtered empty.

### Fix 6 — Polish

- `src/lib/payload.ts`: add `text` fallback to the Slack payload (first item's plain title, else "`N` new feed items") — the notification-preview surface Slack recommends next to blocks.
- Username clamps: Slack username and Discord `username` truncated to 80 chars (`discord.ts` + `payload.ts`).
- `release.yml`: remove unused `setup-node`.
**Tests**: payload.test (text fallback present/absent cases, 100-char title clamps); discord.test (100-char title → username ≤80).

### Fix 7 — Operational watch (no code)

v2.0.0 had no pre-release soak; the hourly cron is the soak. Monitor the Discord channel ~24h for repost anomalies; also confirm the 10-step run keeps ~18s after these changes (timeouts only bite bad feeds).

## Phases (dependency-ordered, atomic commits)

| Phase | Contents | Files |
|---|---|---|
| P1 | Fix 1 (+ part of Fix 2: deliver timeout + error capture) | `src/lib/deliver.ts`, `src/lib/deliver.test.ts`, `src/types.ts` (DeliverOptions.timeoutMs) |
| P2 | Feed fetch refactor + timeouts (Fix 2+4) | `src/lib/getfeed.ts`, `src/lib/feedimg.ts`, their tests |
| P3 | Dist guard + self-heal (Fix 3) | `.github/workflows/ci.yml`, `.github/workflows/dist-sync.yml` (new), `.github/workflows/release.yml` |
| P4 | Date fallback + polish (Q1, Fix 6) | `src/lib/getfeed.ts`, `src/lib/payload.ts`, `src/lib/discord.ts`, `src/lib/markdown.ts`?, their tests |
| P5 | Gate, dogfood re-verify (zero deprecation warnings, all steps green), bump `2.0.1` + README version refs, push, promote `dev`→`main`, verify release + cron run | `package.json`, `README.md`, `AGENTS.md` quirks section |

Verification chain per phase: lint → vitest → build → fallow audit → conventional commit. Post-P5: `gh run` watch ci + release + feedbot; assert no `url.parse` warnings and no `::error::`.

## Risks

| Risk | Mitigation |
|---|---|
| `wait=true` changes response semantics (200 JSON vs 204) | `isOk` already accepts 200/204; tests pin both |
| 10s feed timeout too tight for slow upstreams | Constant exported + parameterized; raise if a feed proves slow (none today) |
| dist-sync self-commit loop | `GITHUB_TOKEN`-authored pushes never trigger workflows (GitHub guarantee) |
| Date fallback changes interval-mode results for date-less feeds | Documented behavior change; flagged in release notes (Q1) |
| Staleness gate false-red for contributors | Hook always rebundles before commit; gate only matters for bypass paths |

## Q1 (your call, defaults applied on approval)

Confirm: date-less items → `created = 0` (cache mode dedupes by title; interval mode skips them). Alternative: keep `Date.now()` fallback and only document the wart.

## Out of scope

RSS conditional GET (ETag/Last-Modified), Discord thread/forum targeting, removing Slack support, legacy cache/validate refactor (already-tracked tech debt).
