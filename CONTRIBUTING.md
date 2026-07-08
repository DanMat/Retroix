# Contributing to Retroix

Thanks for helping improve the engine!

## Principles

- **No build step, no dependencies.** `retroix.js` is a single hand-written UMD
  file of browser-ready vanilla JS. Keep it that way — it must run as a plain
  `<script>` with zero tooling.
- **Small and composable.** Each piece (`canvas`, `loop`, `input`, `leaderboard`,
  `screens`, `initials`, `gfx`, …) should be usable on its own. Prefer adding a
  focused helper over a big opinionated framework.
- **Backwards compatible.** Games pin a version tag; don't break the public API
  in a patch release.

## Getting started

1. Fork and clone.
2. Edit `retroix.js` / `retroix.css`.
3. Smoke test: `npm test` (loads the module under Node).
4. Try it in a browser via a consuming game or the example in the README.

## Submitting changes

Open a pull request against `main` describing what changed and why, and bump the
version in `package.json` if it's a release. By contributing you agree your
work is licensed under the project's [MIT License](LICENSE).
