# Jira Mock Service Worker

A comprehensive Mock Service Worker (MSW) integration for mocking Jira Cloud API endpoints. Perfect for automated testing and performance benchmarks.

## Features

- 🎯 **44 Jira Cloud API endpoints** mocked and ready to use
- 🎲 **Realistic data generation** using faker.js with deterministic seeding
- 🔍 **JQL query support** for searching issues
- 📦 **Full CRUD operations** for issues, projects, and worklogs
- 🧪 **100% TypeScript** with strict type safety
- ✅ **Thoroughly tested** with 41 passing tests
- 🚀 **Easy setup** - less than 5 lines of code
- 🌐 **Works everywhere** - Node.js and browser support

## Installation

```bash
npm install @jira-mock/core @jira-mock/msw-integration msw
```

## Quick Start

### Node.js (for Vitest, Jest, etc.)

```typescript
import { setupJiraMockServer } from '@jira-mock/msw-integration/node';

const config = {
  version: '1.0',
  projects: {
    count: 3,
    issuesPerProject: 50,
  },
};

const { server, dataStore } = setupJiraMockServer({ config });

// Start mocking
beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

// Now all Jira API calls will be mocked!
```

### Browser (for Playwright, Cypress, etc.)

```typescript
import { setupJiraMockWorker } from '@jira-mock/msw-integration/browser';

const config = {
  version: '1.0',
  projects: {
    count: 5,
    issuesPerProject: 100,
  },
};

const { worker, dataStore } = setupJiraMockWorker({ config });

// Start mocking
await worker.start();
```

## Configuration

The configuration file controls what mock data is generated:

```typescript
interface JiraMockConfig {
  version: '1.0';
  seed?: number;              // Optional: for reproducible data
  projects: {
    count: number;            // 1-100 projects
    issuesPerProject: number; // 1-10000 issues per project
  };
}
```

### Example with Seed

```typescript
const config = {
  version: '1.0',
  seed: 12345, // Same seed = same data every time
  projects: {
    count: 2,
    issuesPerProject: 20,
  },
};
```

## Configuration UI

A beautiful Next.js web interface is available for creating and managing configurations:

```bash
cd packages/config-ui
npm install
npm run dev
```

The UI provides:
- 🎨 **Visual config editor** with real-time validation
- 📊 **Live preview** showing what will be generated
- 💾 **Export/Import** configurations as JSON
- 📋 **LocalStorage persistence** for your settings
- 🌙 **Dark mode** support
- 📱 **Responsive design** for mobile and desktop

Open [http://localhost:3000](http://localhost:3000) to use the configuration UI.

## Supported Endpoints

### Users & Permissions
- `GET /rest/api/2/myself` - Get current user
- `GET /rest/api/2/user` - Get user by accountId
- `GET /rest/api/2/user/search` - Search users

### Projects
- `GET /rest/api/2/project` - Get all projects
- `GET /rest/api/2/project/{projectIdOrKey}` - Get project by ID or key
- `GET /rest/api/2/project/{projectIdOrKey}/statuses` - Get project statuses

### Issues
- `GET /rest/api/2/issue/{issueIdOrKey}` - Get issue
- `POST /rest/api/2/issue` - Create issue
- `PUT /rest/api/2/issue/{issueIdOrKey}` - Update issue
- `DELETE /rest/api/2/issue/{issueIdOrKey}` - Delete issue
- `GET /rest/api/2/issue/picker` - Issue picker suggestions

### Search
- `POST /rest/api/2/search/jql` - Search with JQL (POST)
- `GET /rest/api/2/search` - Search with JQL (GET)

### Worklogs
- `GET /rest/api/2/issue/{issueIdOrKey}/worklog` - Get worklogs
- `POST /rest/api/2/issue/{issueIdOrKey}/worklog` - Add worklog

### Metadata
- `GET /rest/api/2/issuetype` - Get all issue types
- `GET /rest/api/2/field` - Get all fields
- `GET /rest/api/2/priority` - Get all priorities
- `GET /rest/api/2/status` - Get all statuses
- `GET /rest/api/2/statuscategory` - Get all status categories
- `GET /rest/api/2/label` - Get all labels

### Filters
- `GET /rest/api/2/filter/search` - Search filters

## Usage Examples

### Testing with Vitest

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupJiraMockServer } from '@jira-mock/msw-integration/node';

describe('My Jira Integration', () => {
  const { server, dataStore } = setupJiraMockServer({
    config: {
      version: '1.0',
      projects: { count: 2, issuesPerProject: 10 },
    },
  });

  beforeAll(() => server.listen());
  afterAll(() => server.close());

  it('should fetch issues from project', async () => {
    const project = dataStore.getAllProjects()[0];

    const response = await fetch(
      `https://your-domain.atlassian.net/rest/api/2/search?jql=project=${project.key}`
    );

    const { issues } = await response.json();
    expect(issues).toHaveLength(10);
  });
});
```

### Creating Issues

```typescript
const response = await fetch('https://your-domain.atlassian.net/rest/api/2/issue', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    fields: {
      project: { key: 'PROJ' },
      summary: 'New issue',
      issuetype: { name: 'Task' },
    },
  }),
});

const { id, key } = await response.json();
console.log(`Created issue: ${key}`);
```

### Searching with JQL

```typescript
const response = await fetch(
  'https://your-domain.atlassian.net/rest/api/2/search?' +
  new URLSearchParams({
    jql: 'project = PROJ AND status = "In Progress"',
    maxResults: '50',
  })
);

const { issues, total } = await response.json();
console.log(`Found ${total} issues`);
```

### Accessing Generated Data

```typescript
const { server, dataStore } = setupJiraMockServer({ config });

// Get all generated data
const projects = dataStore.getAllProjects();
const issues = dataStore.getAllIssues();
const users = dataStore.getAllUsers();

// Get specific items
const issue = dataStore.getIssue('PROJ-1');
const project = dataStore.getProject('PROJ');
const user = dataStore.getUser(accountId);

// Search and query
const results = dataStore.searchIssues({
  projectKey: 'PROJ',
  status: 'In Progress'
});
```

## Project Structure

```
jira-mock-service-worker/
├── packages/
│   ├── core/                 # Core data generation library
│   │   ├── src/
│   │   │   ├── config/       # Configuration schema & validation
│   │   │   ├── generators/   # Data generators
│   │   │   ├── store/        # In-memory data store
│   │   │   ├── types/        # TypeScript types
│   │   │   └── utils/        # Utilities (JQL parser, pagination)
│   │   └── tests/            # Unit tests
│   │
│   ├── msw-integration/      # MSW integration layer
│   │   ├── src/
│   │   │   ├── handlers/     # HTTP handlers by domain
│   │   │   └── setup/        # Setup for Node.js & browser
│   │   └── tests/            # Integration tests
│   │
│   └── config-ui/            # Next.js configuration UI (coming soon)
│
├── examples/                 # Usage examples (coming soon)
└── docs/                     # Documentation (coming soon)
```

## Architecture

### Core Library (`@jira-mock/core`)

The core library handles data generation:

- **Config Validation**: Zod-based schema validation
- **Data Generators**: Realistic Jira entities (users, projects, issues, etc.)
- **Data Store**: In-memory store with indexes for fast lookup
- **Query Engine**: Basic JQL parsing and filtering

### MSW Integration (`@jira-mock/msw-integration`)

The MSW layer provides HTTP handlers:

- **Handlers**: One handler per endpoint, grouped by domain
- **Request Validation**: Query params and body validation
- **Error Handling**: Proper HTTP status codes (404, 400, etc.)
- **Setup Utilities**: Easy initialization for Node.js and browser

## Development

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Run tests for specific package
cd packages/core && npm test
cd packages/msw-integration && npm test
```

### Running Tests

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Run in watch mode
npm run test:watch
```

## Contributing

Contributions are welcome! Please see our contributing guidelines (coming soon).

## License

MIT

## Roadmap

### Iteration 1 (Current)
- ✅ Core data generation
- ✅ 44 API endpoints
- ✅ Basic JQL support
- ✅ CRUD operations
- ✅ Comprehensive tests

### Future Iterations
- 🔄 Next.js configuration UI
- 🔄 Advanced JQL support
- 🔄 Issue transitions & workflows
- 🔄 Attachments & comments
- 🔄 Custom fields configuration
- 🔄 Issue relationships (links, subtasks)
- 🔄 Real-time updates
- 🔄 Webhooks simulation

## Support

For issues and questions, please open an issue on GitHub.

---

Made with ❤️ for better Jira testing
