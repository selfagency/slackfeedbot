# Plan: Node 24 Modernization + Discord Support — SlackFeedBot

Status: **P0–P5 EXECUTED** (commits 24bdfe5, 7aa4c92, 157551b, 917c8d9, 0a03fbb) — P6 (docs/release) in progress. Original draft below.

## Executive Summary

Modernize slackfeedbot from a silently-coerced `runs.using: node16` action to the now-mandatory Node 24 runtime, upgrade all dependencies and CI actions to current majors with SHA pinning, add Discord webhook support alongside Slack, write a unit + integration test suite covering all source modules, and remediate all findings from a code-review pass (current: lint gate green, `npm audit` red with 22 vulns).

**Urgency for node24**: Node 20 runtime was removed from hosted runners 2026-09-23; `runs.using` now only accepts `node20`/`node24` per the metadata reference; `node16` survives via silent remap with a deprecation annotation. GitHub requires a new release after a runtime change — matches this repo's release flow.

**Verified current state** (2026-11-27): `tsc --noEmit` + `eslint` + `prettier --check` PASS; `npm audit` FAIL (22 vulns: 9 moderate, 11 high, 2 critical — `showdown` ReDoS+2 XSS *no fix available* on untrusted feed input; `axios` via `rss-to-json` 4+ advisories; `@actions/core` via `uuid`); zero tests; `showImg` input is dead code.

## Success Criteria

1. `action.yml` declares `runs.using: node24`; action runs correctly under Node 24 (`dist/index.cjs` CJS bundle unchanged in format).
2. Zero `npm audit` vulnerabilities; all deps on current lines listed below; CI actions SHA-pinned with version comments and kept current by Dependabot.
3. Discord delivery parity with Slack (same feed, same cache, same input flags), safe against mention injection, honoring Discord rate limits.
4. `node --test` unit + integration suites for **every** source module pass locally and in a new CI workflow on push/PR.
5. All code-review findings from §Findings closed or explicitly waived.
6. Version bump → `dev` dogfooding → `main` push → automated release.

## Key Decisions (rationale, with alternatives)

| # | Decision | Rationale / Alternative |
|---|---|---|
| D1 | `runs.using: node24`, `.nvmrc` 24, esbuild `--target=node24` | Node 24 = only current JS-action runtime (node22 never valid; runner skips 20→24). macOS ≤13.4/ARM32 caveats → README note. |
| D2 | Keep esbuild CJS bundle as the artifact | Runtime requires nothing about module format; bundle keeps zero node_modules needed at execution. Drop `tsc` emit entirely: `build` = bundle, tsc is typecheck-only (`--noEmit`), which removes the fake `dist/index.js`/`main` mismatch. |
| D3 | `@actions/core` **3.0.1** | API used (`getInput/getBooleanInput/setFailed/debug/INFO`) unchanged in v3; ESM-only fine for esbuild; fixes `uuid` advisory. |
| D4 | Replace `rss-to-json` (2.1.1, stale since Feb 2023, axios advisory chain, `any`-typed) with **`rss-parser` 3.13.0** | Maintained, CJS, ships types, no axios. Requires mapping: package's `created`(ms)/`pubDate` → `isoDate`/`pubDate` strings → parse to ms; `content:encoded` via parser config. **Alt:** keep rss-to-json + axios patches (rejected: unmaintained). |
| D5 | Remove `showdown` (2.1.0: ReDoS + 2 XSS, no fix, feed HTML untrusted; `makeMarkdown` is API-frozen) | Replace HTML→Markdown step with small linkedom-walk converter (links `<url\|text>`, bold/italic/ul/ol from the already-allowed tag set) on top of existing `striptags`+`linkedom`. Conversion pinned by characterization tests. **Alt:** keep showdown at 2.1.0 (rejected: known ReDoS+XSS on untrusted input). |
| D6 | Drop `node-fetch` → global fetch (undici 7 bundled in Node 24) | node-fetch EOL-ish (last publish Jul 2023); global fetch stable. |
| D7 | Multi-target: send to *every* configured webhook; cache written only if **all** targets succeed; aggregate failure otherwise | Retry next run on partial failure (items not lost). Behavior change: Slack errors now surface (see Risks). |
| D8 | SHA-pin every `uses:` to full 40-char commit SHA + same-line `# vX.Y.Z` comment; add `dependabot.yml` (`github-actions` + `npm` ecosystems) | Dependabot updates SHA+comment together (since 2022-10); caveat: security alerts skip SHA-pinned refs — Dependabot PRs cover it. |
| D9 | Tests: **`node --test` on Node 24 native type-stripping**, zero test framework | Discovers `**/*.test.ts` natively; no enums/namespaces/param-properties in this codebase; type-only imports + explicit `.ts` extensions required. **Alt:** vitest (rejected: unneeded dep). |
| D10 | `typescript` **~6.0.3** | Latest 5.x = 5.9.3; TS 7.0.2 (native) hard-errors on TS6 deprecations and lacks programmatic API until 7.1; `@typescript-eslint` 8.74 peer caps `typescript <6.1.0`. TS6 config shifts: defaults `strict:true`, `module:esnext`, `target:es2025`, **`types:[]` (must keep `["node"]`)**; es5/node10/`esModuleInterop:false` deprecated. |
| D11 | `eslint` **10.16.0** (flat config only) + **`neostandard` 0.14.1** (maintained `eslint-config-standard` successor) + `@typescript-eslint` 8.74 + `eslint-plugin-prettier`? no — prettier stays a formatter | eslintrc removed in eslint 10; codemod `npx codemod @eslint/v9-to-v10` available. |
| D12 | `prettier` **3.10.1** — keep explicit `trailingComma: "none"` (v3 default changed to `"all"`) | Preserves current style. |
| D13 | `husky` **9.1.7** (strip shebang + `husky.sh` sourcing from hook files), `lint-staged` **17.6.2** (Node ≥22.22 ok), add `.ts` (and `*.ts` → prettier) to lint-staged globs | Fixes lint-staged omits-TS finding; delete bogus `post-receive` hook. |
| D14 | Version **1.3.0** | All existing user configs remain valid; Slack error-surfacing is the only behavior change. **Open question Q3.** |
| D15 | `cacheSlug()` hash scheme **unchanged** (self-append quirk documented, not "fixed") | Any hash change invalidates every deployed cache → mass reposts. Comment + behavior-pinning test. |
| D16 | Discord payload hardening: `allowed_mentions: {"parse":[]}` (webhook default is `parse:["users"]`); `wait=true` for delivery verification; `<url>` scheme-sanitize; honor `Retry-After` on 429, never retry 400/404 | Prevents `@everyone`/`@here` injection from feed content; Cloudflare invalid-request ban threshold (10k/10min) forbids blind retry. Same hardening (Slack `<!here>`/`<!channel>` neutralization) applied to Slack renderer. |

## Code-Review Findings → Remediation Map

Baseline automated checks: `tsc --noEmit` PASS, `eslint` PASS, `prettier --check` PASS, `npm audit` **FAIL** (22 vulns), tests: none.

| Sev | # | Finding (location) | Remediation (→ phase) |
|---|---|---|---|
| CRIT | F1 | `slack()` ignores response status/body (`src/lib/slack.ts:6`); fails silently, cache still written → items lost permanently | Deliver layer validates `200`+body `"ok"` (Slack) / `204`+`wait=true` message (Discord); cache-gating per D7 (P4/P5) |
| CRIT | F2 | No mention-injection sanitization of untrusted feed text (Slack mrkdwn `<!here>`/`<!channel>`; future Discord `@everyone`) | Escape/neutralize platform mention syntax in renderers; Discord `allowed_mentions {"parse":[]}` (P4/P5) |
| CRIT | F3 | Zero tests (whole repo) | Unit + integration suite, §Test Strategy (P3 onward) |
| HIGH | F4 | `showImg` dead: `item.image` never populated (verified in rss-to-json bundle) (`src/lib/payload.ts:81,84`) | **Q1**: drop input, or wire `itunes_image`/first image enclosure/media thumbnail (P4) |
| HIGH | F5 | Contract drift: `action.yml` declares `show_description` (never read), omits `show_desc`/`show_img`; `cache_dir` `required:true` vs code's OR-interval (`action.yml:20-34`) → single source of truth: `action.yml`, `src/action.ts`, `src/lib/validate.ts`, README (P4, folded into P5 edits) |
| HIGH | F6 | `showdown` advisories (ReDoS GHSA-rmmh-p597-ppvv; XSS GHSA-cr32-g25g-vxjj, GHSA-22g5-r2x5-97cx; no fix) | D5 removal (P2) |
| HIGH | F7 | `axios` via `rss-to-json`: DoS/SSRF/auth-bypass class advisories (<1.15.1) | D4 swap (P2) |
| HIGH | F8 | Empty feed throws → red ✗ every scheduled run (`src/lib/getfeed.ts:47`) | No-op + `core.info` (P4) |
| MED | F9 | Webhook URLs in `core.debug` output (`src/action.ts:27`, `src/lib/validate.ts:8`) | `core.setSecret()` both webhooks (P4) |
| MED | F10 | `cacheSlug` self-append `slug += \`${slug}-…\`` (`src/lib/cache.ts:40`) | D15: comment + pinning test only (P3) |
| MED | F11 | Unchecked cast + single-slash `https:/favicongrabber.com` URL, third-party favicon dependency (`src/lib/feedimg.ts:17`) | Type-guard the response; normalize URL; allow favicon disable via absent `feed_image` fallback (P4) |
| MED | F12 | `core.setFailed((<Error>err).message)` undefined for non-Error (`src/action.ts:69`) | `err instanceof Error ? err.message : String(err)` (P4) |
| MED | F13 | "UTC" label but renders runner-local time (`src/lib/payload.ts:99`) | Format from ms with explicit UTC (`dayjs.utc` plugin or manual) (P4) |
| MED | F14 | `package.json` `main: dist/index.js` ≠ real artifact | `main: dist/index.cjs`, remove `npm run build` tsc-emit (P1) |
| MED | F15 | Bogus server-side `post-receive` husky hook | Delete (P1) |
| MED | F16 | lint-staged omits `.ts`; no PR/push CI gate | D13 + new `ci.yml` (P1) |
| MED | F17 | No Slack 429 handling | Retry-after honoring in deliver layer (P5) |
| LOW | F18 | No `text` fallback on Slack payload; `?.`-abuse; stringly-typed index signatures; `../types.d` vs `../types`; dead comment; repeated `getInput` calls; `object-sha` unused (verified) | Cleanup in P4; `types.d.ts` → `types.ts` real module (P2) |

## Dependency Matrix

**Runtime** (`package.json`): remove `object-sha`, `node-fetch`, `rss-to-json`, `showdown`; add `rss-parser@^3.13.0`; bump `@actions/core@^3.0.1`, `dayjs@^1.11.23`, `html-to-text@^10.0.1` (`compile()` options unchanged since v8; needs Node ≥20.19), `linkedom@^0.18.15`, `striptags@^3.2.0` (current). Add `engines: {"node": ">=24"}`.

**Dev**: `typescript@~6.0.3`, `eslint@^10.16.0`, `neostandard@^0.14.1`, `@typescript-eslint/*@^8.74.0`, `@eslint/js`, `prettier@^3.10.1`, `husky@^9.1.7`, `lint-staged@^17.6.2`, `esbuild@^0.28.2`, `@types/node@^24.19.4`; drop `eslint-config-standard/…-prettier/…-node/…-promise`, `eslint-plugin-import/json/markdown/yml` (re-evaluate json/yml under flat config), `@types/showdown`, `@types/html-to-text` (v10 dual-exports; own types verify).

**CI actions** (all SHA-pinned, `# vX.Y.Z` comment): `actions/checkout@v7(7.0.1)`, `actions/setup-node@v7(7.1.0)` `node-version: 24`, `actions/cache@v6(6.1.0)`, `actions/github-script@v9` (script-compatible: our script uses only the injected `core`), `EndBug/version-check@v3(3.0.0)`, `zendesk/action-create-release` → **`softprops/action-gh-release@v3(3.0.4)`** (zendesk action stale, node16-declaring). Runner ≥2.329.0 required by first-party v6/v7 — hosted runners fine. Jobs get explicit minimal `permissions:` (release: `contents: write`; CI: `contents: read`).

## Phases (numbered, dependency-ordered)

**P0 — Baseline & branch** (git-flow-next): `git flow init --preset=classic --defaults` if needed → `git flow feature start node24-discord-modernization` off `dev`. Commit per subtask, conventional (`feat:`/`fix:`/`chore:`/`ci:`).

**P1 — Toolchain, runtime, CI/CD**
- `.nvmrc` 24; `package.json`: engines, scripts (`build`=esbuild node24; `lint`; `test`; `start`), `main`, remove tsc-emit deps; `tsconfig.json` for TS6 (`strict`, `module: nodenext` or `esnext`, `target: es2025`, `types:["node"]`, `verbatimModuleSyntax`, `erasableSyntaxOnly`, `allowImportingTsExtensions` + `noEmit`).
- `eslint.config.mjs` (flat, neostandard+ts-eslint); delete `.eslintrc`/`.eslintignore`; `.prettierrc` pinned `trailingComma:"none"`; `.husky/pre-commit` (husky 9 plain-script form: bundle → `git add dist` → lint-staged); delete `.husky/post-receive`.
- `action.yml`: `runs.using: node24`.
- New `.github/workflows/ci.yml` (push+pull_request: `npm ci`, lint, test; `ubuntu-latest`, setup-node v7 w/ npm cache, minimal permissions) — added now even though tests land in P3 (starts failing-safe green: no tests matched).
- Rewrite `feedbot.yml` + `release.yml` per CI matrix incl. full SHA pinning; add `.github/dependabot.yml` (npm + github-actions, weekly).
- *Files: `.nvmrc`, `package.json`, `package-lock.json`, `tsconfig.json`, `eslint.config.mjs`, `.eslintrc`, `.eslintignore`, `.prettierrc`, `.husky/*`, `action.yml`, `.github/workflows/{ci,feedbot,release}.yml`, `.github/dependabot.yml`, `dist/index.cjs` (rebundle).*
- *Verify: `npm run lint`, `npm run build`, node24 smoke (`INPUT_* node dist/index.cjs`), CI run green, dogfood dispatch.*

**P2 — Dependency modernization**
- Swap/bump per matrix; `types.d.ts` → `types.ts`; `type`-keyword imports; explicit `.ts` extensions in relative imports; drop `node-fetch` imports → `fetch`.
- `rss-parser` integration: parse URL via global fetch? (`rss-parser` `parseURL` uses its own http) → wrap: fetch text → `parseString` for testability; map fields (title/link/isoDate→ms/content:encoded/feed image) behind `getFeed` interface unchanged.
- HTML→mrkdwn mini-converter replacing showdown (linkedom DOM walk of allowed tags); remove showdown/striptags-unchanged/etc.
- *Files: `src/lib/{getfeed,payload,feedimg,cache,slack}.ts`, `src/types.ts`, `package.json`.*
- *Verify: lint, `npm audit` zero, dogfood dispatch on `dev`.*

**P3 — Test suite (unit + integration, all modules)**
- Framework D9; co-located `*.test.ts`. Testability injection points: favicon base URL param, feed fetch text param, deliver fetch impl param, tempdir cache.
- Unit: `validate.ts` (all branches + new multi-target rules), `cache.ts` (slug determinism incl. self-append pin, read/write/roundtrip in tmpdir, hit/miss), `getfeed.ts` (map, cache+1h window, interval, empty-feed no-op post-P4), `payload.ts` slack blocks (show_* matrix, unfurl mode, mrkdwn conversion fixtures, date UTC post-P4), `feedimg.ts` (icon selection fixture server), `types.ts` (n/a).
- Integration: local `node:http` fixture RSS feed + fake Slack/Discord webhook endpoints (assert body shape, status, 429 retry, 400 propagation); `run()` end-to-end with `INPUT_*` env + tmpdir cache; multi-target all-success (cache written) vs partial-failure (no cache write, aggregate fail).
- *Files: `src/**/*.test.ts`, `test/fixtures/*.xml`, test helpers (`src/test/`)*

**P4 — Remediation (test-first: failing test → fix → green)**
- F1, F2-Slack, F8, F11, F12, F13, F14/F15 (with P1), F18; F4 per Q1; F5 contract sync incl. removing `show_description`, adding missing inputs (`required:false` where validated-optional).
- *Verify: full suite + lint + dogfood.*

**P5 — Discord support (TDD)**
- `src/lib/render/discord.ts`: embeds ≤10/message, desc ≤4096, clamp to 6000-char total, title ≤256, `timestamp` ISO from ms, `image` per Q1 outcome; `username` = `feed_name` override or feed title; `avatar_url` = `feed_image` or favicon; `allowed_mentions {"parse":[]}`; chunk into multiple webhook messages.
- `src/lib/deliver.ts`: per-platform POST w/ `wait=true` (Discord) / status+body check (Slack `200`+`"ok"`); 429 `Retry-After` (seconds, header+body) with bounded retries (≤3); 400/403/404/410 → immediate failure with body in error.
- `validate.ts`: ≥1 of `slack_webhook`/`discord_webhook`; `action.ts`: iterate targets, aggregate, D7 cache gating; `core.setSecret` both webhooks; `slack_webhook` `required:false` in `action.yml`, add `discord_webhook`.
- Slack renderer mention-neutralization (F2); README Discord sections + examples + option docs; `feedbot.yml` Discord dogfood step (needs `DISCORD_WEBHOOK` secret — owner action).
- *Files: `action.yml`, `src/action.ts`, `src/lib/{validate,deliver,render/slack,render/discard→discord,cache}.ts`, README.md, `.github/workflows/feedbot.yml`.*

**P6 — Docs, release**
- README: options table sync (F5), node24/requirements notes, Discord examples (incl. cache example), version refs (bump count after edits); AGENTS.md refresh (node24, test script, CI matrix, quirks updates); release-notes note re: Slack error-surfacing behavior change.
- Version 2.0.0 (Q3) → README refs → commit (pre-commit rebundles `dist/index.cjs`) → `git flow feature finish` → `dev` dogfood 24h → **gate** → merge `dev`→`main` → `EndBug/version-check` v3 + `softprops/action-gh-release` v3 tag `v2.0.0`.

## Test Strategy Summary

- Framework: `node --test`, native `.ts` on Node 24. Unit + integration both in-tree; `npm test` runs all; CI runs `npm ci && npm run lint && npm test`.
- Red-first: P3 characterization suite locks current *observable* behavior; each P4 remediation lands as failing test → fix → green; P5 features TDD.
- Network isolation: all HTTP via localhost fixture servers (feed, favicon, webhooks); no third-party calls in tests. Discord/Slack payload assertions assert exact wire shape (mention safety, limits, retry).
- Dogfood (`feedbot.yml`) remains the live integration gate with `workflow_dispatch` for manual smoke.

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| rss-parser field semantics differ (`isoDate` strings; `created` gone) | Explicit ms-mapping helper + characterization tests before/after swap |
| showdown removal changes message formatting | Conversion fixture tests + visual compare via dogfood before merge |
| Slack failures now fail the run (behavior change) | Release notes; dogfood soak on `dev` first |
| Hash-scheme drift → mass reposts | D15: no hash change; pinned test |
| Discord rate limits / Cloudflare ban | Chunking, strict retry-after, never retry 400/404 |
| Dependabot alerts skip SHA-pinned refs | Dependabot PRs still bump SHA+comment; review cadence weekly |
| Scheduled dogfood auto-disabled after 60d repo inactivity (public repo) | `workflow_dispatch` manual smoke; keep repo active via releases |
| TS7 migration blocked (ts-eslint peer `<6.1.0`; no API until TS 7.1) | Out of scope; revisit post-7.1 |

## Explicitly Out of Scope

Outputs, `pre:`/`post:` action phases, forum/thread targeting, slack-discord "compatible" webhook mode, multi-webhook-per-platform, composite/docker refactor, ESM re-bundle, TypeScript 7.

## Open Questions (decided 2026-11-27)

1. **showImg (F4)**: **WIRE** — map `itunes_image` / first image enclosure / media thumbnail to item image; input becomes functional.
2. **showdown (D5)**: **REMOVE** — hand-rolled linkedom converter confirmed.
3. **Version (D12)**: **2.0.0**.
4. **Discord dogfood**: owner provided feed URL (multifeed merge via rssrssrssrss.com) + Discord webhook; workflow step consumes `${{ secrets.DISCORD_WEBHOOK }}` (raw URL never committed; owner adds secret or agent sets it via `gh secret set` with stdin).

## Verification Checklist

- [ ] `npm run lint` (tsc 6 + eslint 10 flat + prettier 3) green
- [ ] `npm audit` zero vulnerabilities
- [ ] `npm test` unit+integration green on Node 24 (`node --test`)
- [ ] `npm run build` → `dist/index.cjs` runs via `INPUT_*` smoke test
- [ ] CI workflow green on push/PR; release workflow tested via no-op version run
- [ ] All `uses:` SHA-pinned + commented; dependabot config active
- [ ] Dogfood on `dev` posts to Slack (+ Discord per Q4) for ≥1 soak period
- [ ] action.yml ↔ src ↔ README contract audit (inputs, docs, examples)
- [ ] Release `v2.0.0` tagged via GH release automation
