# Next.js OpenAPI Tester

A Next.js application for testing Jira API requests through an interactive OpenAPI (Swagger) interface with Mock Service Worker.

## Features

- 🔧 **Interactive OpenAPI UI**: Test Jira API endpoints directly in the browser
- 🎲 **Configurable Mock Data**: Use `jira-mock-config.json` to customize mock data generation
- 🔄 **MSW Integration**: Browser-based request interception with Mock Service Worker
- 📝 **Full API Coverage**: Access 100+ mocked Jira Cloud API endpoints
- 🎯 **Deterministic Testing**: Seeded data generation for reproducible tests

## Getting Started

### Install Dependencies

From the repository root:

```bash
npm install
```

### Configuration

Edit `jira-mock-config.json` to customize the mock data:

```json
{
  "version": "1.0",
  "seed": 42,
  "projects": {
    "count": 5,
    "issuesPerProject": 20
  }
}
```

- `seed`: Controls random data generation (same seed = same data)
- `projects.count`: Number of projects to generate (1-100)
- `projects.issuesPerProject`: Issues per project (1-10000)

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

## Configuration Options

You can modify behavior by:

- **Changing seed**: Get different random data
- **Adjusting counts**: Test with more/fewer projects and issues
- **Modifying MSW setup**: Edit `src/lib/msw.ts` for custom behavior

## Related Packages

- `@jira-mock/core` - Core data generation library
- `@jira-mock/msw-integration` - MSW handler integration

## License

MIT
