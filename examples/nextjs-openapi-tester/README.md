# Next.js OpenAPI Tester

A Next.js application for testing Jira API requests through an interactive OpenAPI (Swagger) interface with Mock Service Worker.

## Features

- **Interactive OpenAPI UI**: Test Jira API endpoints directly in the browser
- **Configurable Mock Data**: Use `jira-mock-config.json` to customize mock data generation
- **MSW Integration**: Browser-based request interception with Mock Service Worker
- **Filtered API Display**: Shows only MSW-mocked endpoints from the full Jira Cloud API
- **Deterministic Testing**: Seeded data generation for reproducible tests
- **Extensible**: Add new endpoints via `mocked-endpoints.json`

## Getting Started

### Install Dependencies

From the repository root:

```bash
npm install
```

### Configuration

Edit `jira-mock-config.json` to customize the mock data. It uses the standard
**array format** — the only supported shape (see the "Configuration Files" section
below and the root README for the full schema):

```json
{
  "version": "1.0",
  "projects": [
    {
      "projectKey": "PROJ1",
      "seed": 42
    }
  ]
}
```

- `seed` (per project): Controls random data generation (same seed = same issues)
- `issueCount` (per project, optional): Exact number of issues (1-10000); when omitted
  the count is derived from the project's `issueTypes` configuration

### Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Usage

1. **OpenAPI Interface**: The homepage displays the Swagger UI with all available Jira API endpoints
2. **Try Endpoints**: Click "Try it out" on any endpoint to test it
3. **View Responses**: See mock data responses based on your config
4. **Test Different Scenarios**: Modify the config and restart to test with different data

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run typecheck` - Run TypeScript type checking
- `npm run test:e2e` - Run Playwright E2E tests (starts the production server automatically; run `npm run build` first)

### Playwright E2E tests

`tests/e2e/msw.spec.ts` verifies the real browser behavior that Node-based tests cannot reach:

- the MSW service worker activates and exposes `window.jiraMock`
- browser `fetch` calls to the mocked Jira origin are intercepted and answered by MSW
- Swagger UI executes a request and renders the mocked response

## How It Works

1. **MSW Setup**: The app initializes Mock Service Worker in the browser
2. **Request Interception**: API requests are intercepted and handled by MSW handlers
3. **Mock Data**: Responses are generated using the configured mock data
4. **Swagger UI**: OpenAPI spec is displayed in an interactive interface

## Testing Endpoints

### Example: Get Projects

1. Navigate to `/rest/api/2/project`
2. Click "Try it out"
3. Click "Execute"
4. View the mock project data

### Example: Search Issues (JQL)

1. Navigate to `/rest/api/2/search`
2. Click "Try it out"
3. Enter JQL query: `project = PROJ1 AND status = "In Progress"`
4. Click "Execute"
5. View filtered issues

## Adding New Mocked Endpoints

The OpenAPI UI is filtered to show only endpoints that are actually mocked with MSW. To display additional endpoints:

### 1. Add MSW Handlers

First, implement the MSW handlers in the `@jira-mock/msw-integration` package:

```typescript
// packages/msw-integration/src/handlers/your-feature.handlers.ts
export function createYourFeatureHandlers(dataStore: DataStore, baseUrl: string) {
  return [
    http.get(`${baseUrl}/rest/api/2/your-endpoint`, () => {
      // Your handler implementation
    }),
  ];
}
```

### 2. Update mocked-endpoints.json

Add the new endpoint to `mocked-endpoints.json`:

```json
{
  "endpoints": [
    {
      "path": "/rest/api/2/your-endpoint",
      "methods": ["get"]
    }
  ]
}
```

**Important**: Use OpenAPI parameter syntax `{paramName}`, not MSW syntax `:paramName`.

### 3. Restart the Development Server

```bash
npm run dev
```

The new endpoint will now appear in the OpenAPI UI.

## Configuration Files

### jira-mock-config.json

Controls mock data generation. Uses the array format shown in the Configuration
section above (the checked-in file defines five projects, `PROJ1`–`PROJ5`, each with
`"seed": 42`).

Issue count per project can be pinned with `"issueCount": 20` (1–10000); when omitted it
is derived from the project's `issueTypes` configuration (defaults to ~1,010 issues).

### mocked-endpoints.json

Defines which endpoints appear in the OpenAPI UI:

- **path**: OpenAPI path using `{param}` syntax
- **methods**: Array of HTTP methods (lowercase)

Example:

```json
{
  "path": "/rest/api/2/issue/{issueIdOrKey}",
  "methods": ["get", "put", "delete"]
}
```

## Configuration Options

You can modify behavior by:

- **Changing seed**: Get different random data
- **Adjusting counts**: Test with more/fewer projects and issues
- **Adding endpoints**: Update `mocked-endpoints.json` to show more endpoints
- **Modifying MSW setup**: Edit `src/lib/msw.ts` for custom behavior

## Related Packages

- `@jira-mock/core` - Core data generation library
- `@jira-mock/msw-integration` - MSW handler integration

## License

MIT
