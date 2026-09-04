# Contributing

Thanks for taking the time to contribute!

## Getting started

This is an npm workspaces monorepo (`packages/*`, `examples/*`). The packages are not
published to npm; everything is built from source.

```bash
git clone https://github.com/Darqula/jira-mock-service-worker.git
cd jira-mock-service-worker
npm install     # requires Node.js >= 20.19, npm >= 10
npm run build
```

`npm run build` must succeed before running tests: workspaces resolve
`@jira-mock/core` from its `dist/` output.

## Gates (what CI runs)

Every change must pass all of the following from the repo root:

```bash
npm run build       # builds every workspace
npm run typecheck   # tsc across workspaces
npm run lint        # eslint . — 0 errors required (a warning baseline exists)
npm test            # all workspace test suites
```

Before opening a PR, run `npm run format` (Prettier) so the formatting check stays
trivial.

## Pull request conventions

- Keep PRs small and scoped to one change; "cleanup, not rewrite" is the project's
  stance on refactors.
- Tests are the contract: if a change breaks a test, fix the code — change the test
  only when it encoded outdated behavior, and say so in the PR description.
- New mock endpoints need an integration test against `setupJiraMockServer` and an
  entry in the README "Supported Endpoints" list.
- Update the README whenever configuration semantics or endpoint coverage change.
- Never commit build outputs (`dist/`, `.next/`, `coverage/`) or the generated
  `public/mockServiceWorker.js`.

## Reporting issues

Open a [GitHub issue](https://github.com/Darqula/jira-mock-service-worker/issues)
with a minimal reproduction — a config JSON plus the request/response pair works well
for mock-behavior bugs.
