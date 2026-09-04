# Docs

## `jira_cloud_swagger.json`

A vendored dump of the official Jira Cloud REST API OpenAPI specification. It is not
generated or maintained by this project; it exists so the offline test suite and the
`examples/nextjs-openapi-tester` app can validate mock responses against the real
schema without a network dependency:

- `packages/msw-integration/tests/openapi-validation.test.ts` loads it via
  `../../docs/jira_cloud_swagger.json`.
- `examples/nextjs-openapi-tester` serves a filtered view of it (the Swagger UI).

The file is excluded from Prettier (`.prettierignore`) and should only be replaced by
a fresh upstream dump.
