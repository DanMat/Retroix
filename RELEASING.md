# Releasing Retroix

Retroix ships to two places from one version tag:

| Channel  | How it updates                                   | Needs infra? |
| -------- | ------------------------------------------------ | ------------ |
| jsDelivr | Automatic — serves any `vX.Y.Z` git tag on demand | No           |
| npm      | Published by the `Release` GitHub Action          | Yes (token)  |

Games pin an **exact** tag, e.g.
`https://cdn.jsdelivr.net/gh/DanMat/Retroix@v0.1.0/retroix.js`, so a new release
never changes a game until you bump that game's URL. That's deliberate.

## One-time setup

1. Create an npm **Automation** or **Granular Access** token with publish rights
   on the `retroix` package. (Automation tokens bypass 2FA, which CI needs.)
2. Add it to the repo as a secret named **`NPM_TOKEN`**:
   `Settings → Secrets and variables → Actions → New repository secret`,
   or `gh secret set NPM_TOKEN` (paste when prompted).

## First publish (v0.1.0 is already tagged, just not on npm)

`Actions → Publish to npm → Run workflow`. This publishes the current `main`
to npm as-is. Do this once, after the secret is set.

## Every release after that

`Actions → Release → Run workflow → pick patch / minor / major`. The workflow:

1. `npm version <bump>` — edits `package.json`, commits, tags `vX.Y.Z`
2. pushes the commit and tag
3. publishes to npm (with provenance)

jsDelivr serves the new tag immediately; npm has it within a minute.

### Prefer the command line?

```bash
npm version patch          # bump + commit + tag
git push --follow-tags     # pushing the tag triggers Publish to npm
```

## After a release: roll it out to games

Bump each game's pinned CDN URL (`@v0.1.0` → `@v0.2.0`) in its `index.html`
when you want that game to adopt the new engine, and re-test.
