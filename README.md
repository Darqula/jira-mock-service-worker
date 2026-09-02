# Jira Mock Service Worker

A comprehensive Mock Service Worker (MSW) integration for mocking Jira Cloud API endpoints. Perfect for automated testing and performance benchmarks.

## Features

- 🎯 **77 Jira Cloud API endpoints** mocked and ready to use
- 🎲 **Realistic data generation** using faker.js with deterministic seeding
- 🔍 **JQL query support** with advanced search, autocomplete, and match checking
- 📦 **Full CRUD operations** for issues, projects, comments, worklogs, and more
- 💬 **Comments & Attachments** - Full support for issue discussions and file attachments
- 🔗 **Issue Links & Transitions** - Complete workflow and relationship management
- 📋 **Components & Versions** - Project organization, release tracking, and version swapping
- 🏃 **Sprints & Agile** - Sprint generation with realistic lifecycle states
- 🎯 **Epic Hierarchy** - Epics with children (stories/tasks/bugs) and configurable distribution
- 📊 **Flexible Configuration** - Extensive customization of data generation
- 🔐 **User Properties & Permissions** - User preferences and role-based access control
- 🏷️ **Entity Properties** - Custom properties for users, projects, and issues
- 📊 **Field Metadata** - Complete create/edit metadata for dynamic form generation
- 🧪 **100% TypeScript** with strict type safety
- ✅ **Thoroughly tested** with comprehensive test coverage
- 🚀 **Easy setup** - less than 5 lines of code
- 🌐 **Works everywhere** - Node.js and browser support

## Installation

The `@jira-mock/*` packages are **not published to npm** — they are used from this
repository directly. You still install `msw` itself from npm.

### From source

```bash
git clone https://github.com/Darqula/jira-mock-service-worker.git
cd jira-mock-service-worker
npm install
npm run build
```

Then consume the packages from your app in one of two ways:

- **`file:` dependencies** in your app's `package.json` (paths relative to your app):

  ```json
  {
    "dependencies": {
      "@jira-mock/core": "file:../jira-mock-service-worker/packages/core",
      "@jira-mock/msw-integration": "file:../jira-mock-service-worker/packages/msw-integration",
      "msw": "^2.6.4"
    }
  }
  ```

- **`npm link`** from this repo:

  ```bash
  # in packages/core and packages/msw-integration (in that order)
  npm link
  # in your app
  npm link @jira-mock/core @jira-mock/msw-integration
  ```

If your app lives inside this monorepo (like the `examples/` workspace packages), just
declare `"@jira-mock/core": "1.0.0"` and npm resolves it to the local workspace package.

## Quick Start

### Node.js (for Vitest, Jest, etc.)

```typescript
import { setupJiraMockServer } from '@jira-mock/msw-integration/node';

const config = {
  version: '1.0',
  projects: [
    { projectKey: 'PROJ1', issueCount: 50 },
    { projectKey: 'PROJ2', issueCount: 50 },
    { projectKey: 'PROJ3', issueCount: 50 },
  ],
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
  projects: [
    { projectKey: 'PROJ1', issueCount: 20 },
    { projectKey: 'PROJ2', issueCount: 30 },
    { projectKey: 'PROJ3', issueCount: 25 },
    { projectKey: 'PROJ4', issueCount: 25 },
  ],
};

const { worker, dataStore } = setupJiraMockWorker({ config });

// Start mocking
await worker.start();
```

## Configuration

The configuration system is **per-project**: the only top-level keys are `version` and
the `projects` array. Every other setting lives on a project entry; fields you omit fall
back to built-in defaults (there is no `globalDefaults` — repeat the settings or use a
shared object in your code if you need to).

### Basic Configuration

The minimal configuration requires only `version` and at least one project:

```typescript
interface JiraMockConfig {
  version: '1.0';                    // Required: literal
  projects: Array<{                  // Required: at least one, project keys unique
    projectKey: string;              // Required: 1-10 chars, e.g. "PROJ", "APP2"
    projectName?: string;            // Optional display name
    projectType?: 'company-managed' | 'team-managed';
    seed?: number;                   // Reproducible generation for this project
    issueCount?: number;             // Exact number of issues for this project (1-10000).
                                     // When omitted, the count is derived from the issue
                                     // types configuration (see Epic Hierarchy below).
    statusDistribution?: {           // Probabilities (0-1), see below
      toDo?: number; inProgress?: number; done?: number;
    };
    issueTypes?: {                   // Epic/standalone generation, see below
      epic?: { count?: number; childrenPerEpic?: number; /* ... */ };
      story?: { standaloneCount?: number; /* ... */ };
      task?: { standaloneCount?: number; /* ... */ };
      bug?: { standaloneCount?: number; /* ... */ };
    };
    sprints?: { startNumber?: number; duration?: number; assignProbability?: number };
    versions?: { startNumber?: number; count?: number; assignProbability?: number };
    worklogs?: { probability?: number; hoursMin?: number; hoursMax?: number;
                 countMin?: number; countMax?: number };
    data?: { assignees?: string[]; priorities?: string[]; labels?: string[] };
    startIssueNumber?: number;       // First issue number (default 1)
    startDate?: string;              // Full ISO 8601, e.g. '2024-01-01T00:00:00.000Z'
    endDate?: string;                // Must be after startDate when both are set
  }>;
}
```

### Minimal Example

```typescript
const config = {
  version: '1.0',
  projects: [
    { projectKey: 'PROJ', issueCount: 50 },
  ],
};
```

### Per-Project Configuration Example

Each project carries its own configuration — there are no global defaults:

```typescript
const config = {
  version: '1.0',
  projects: [
    {
      projectKey: 'BACKEND',
      projectName: 'Backend Services',
      seed: 42,
      issueCount: 150,
      statusDistribution: {
        toDo: 0.4,
        inProgress: 0.3,
        done: 0.3,
      },
      data: {
        assignees: ['backend-dev@example.com'],
        labels: ['api', 'database'],
      },
    },
    {
      projectKey: 'FRONTEND',
      projectName: 'Frontend App',
      seed: 7,
      issueCount: 100,
      statusDistribution: {
        toDo: 0.5,
        inProgress: 0.4,
        done: 0.1,
      },
      data: {
        assignees: ['frontend-dev@example.com'],
        labels: ['ui', 'ux'],
      },
    },
  ],
};
```

### All Configuration Fields (Single Project)

This example shows every available project-level field:

```typescript
const config = {
  version: '1.0',
  projects: [
    {
      projectKey: 'DEMO',                // Custom project key
      projectName: 'Demo Project',
      projectType: 'company-managed',    // or 'team-managed'
      seed: 12345,                       // Reproducible data generation
      startIssueNumber: 1,               // Starting issue number
      startDate: '2024-01-01T00:00:00.000Z', // Full ISO 8601 datetime
      endDate: '2024-12-31T23:59:59.999Z',

      // Status distribution (probabilities, 0-1)
      statusDistribution: {
        toDo: 0.3,       // 30% To Do
        inProgress: 0.5, // 50% In Progress
        done: 0.2,       // 20% Done
      },

      // Epic and issue type configuration
      issueTypes: {
        epic: {
          count: 10,                 // Number of epics
          childrenPerEpic: 30,       // Children per epic
          assignProbability: 0.9,    // 90% chance of assignee
          labelProbability: 0.8,     // 80% chance of labels
          childDistribution: {       // Child type distribution
            story: 0.5,  // 50% stories
            task: 0.3,   // 30% tasks
            bug: 0.2,    // 20% bugs
          },
        },
        story: {
          standaloneCount: 25,       // Stories not in epics
          assignProbability: 0.85,
          labelProbability: 0.75,
        },
        task: {
          standaloneCount: 15,       // Tasks not in epics
          assignProbability: 0.8,
          labelProbability: 0.7,
        },
        bug: {
          standaloneCount: 10,       // Bugs not in epics
          assignProbability: 0.95,
          labelProbability: 0.9,
        },
      },

      // Sprint configuration
      sprints: {
        startNumber: 1,              // Starting sprint number
        duration: 14,                // Sprint duration in days
        assignProbability: 0.7,      // 70% of issues in sprints
      },

      // Version/Release configuration
      versions: {
        startNumber: 1,              // Starting version number
        count: 6,                    // Number of versions
        assignProbability: 0.5,      // 50% of issues have fix versions
      },

      // Worklog configuration
      worklogs: {
        probability: 0.75,           // 75% of issues have worklogs
        hoursMin: 1,                 // Min hours per worklog
        hoursMax: 8,                 // Max hours per worklog
        countMin: 2,                 // Min worklogs per issue
        countMax: 10,                // Max worklogs per issue
      },

      // Data customization
      data: {
        assignees: [                 // Custom user email list
          'john.doe@example.com',
          'jane.smith@example.com',
        ],
        priorities: [                // Filter available priorities
          'Highest', 'High', 'Medium', 'Low', 'Lowest'
        ],
        labels: [                    // Available labels
          'frontend', 'backend', 'api', 'documentation'
        ],
      },
    },
  ],
};
```

For the same field set as a ready-to-use file, see
[`examples/configs/full-featured.json`](./examples/configs/full-featured.json) — the
canonical reference example.

### Configuration Examples

See the `examples/configs/` directory for ready-to-use configuration examples:

- **minimal.json** - Simplest configuration with defaults (~1,010 issues from the built-in epic defaults)
- **small-project.json** - Small team project with customization (~58 issues)
- **team-managed.json** - Team-managed (Next-Gen) project example (~123 issues)
- **large-project.json** - Large enterprise project (~1,200 issues)
- **full-featured.json** - Comprehensive feature showcase (~360 issues)
- **multi-project.json** - Three projects with mixed settings (~2,075 issues total; the
  two projects without an `issueTypes` block use the built-in epic defaults)

JSON files cannot contain comments, so each file is intentionally small and the accompanying `examples/configs/README.md` explains the fields. See `examples/configs/README.md` for complete documentation.

### Key Configuration Features

#### Epic Hierarchy and Issue Count

Every project's issue count is controlled by `issueCount`. When `issueCount` is set, the
project gets **exactly** that many issues (validated range: 1–10000). When it is omitted,
the count is derived from the issue types configuration:

```
Total Issues = Epics + (Epic Count × Children Per Epic)
             + Standalone Stories + Standalone Tasks + Standalone Bugs
```

With no `issueTypes` configured at all, the built-in defaults (10 epics × 100 children)
produce 10 + 1000 = **1,010 issues**.

Example: 10 epics + 10 × 30 children + 25 standalone stories + 15 tasks + 10 bugs =
**360 total issues** (this is the `full-featured.json` configuration).

**Clamping:** if `issueCount` is set to a value below the configured epic count, all
epics are still generated and the total becomes `max(issueCount, epicCount)` — the
hierarchy is never broken by dropping or orphaning issues. Otherwise, when
`issueCount` is set, the budget is distributed deterministically:

1. All epics are generated.
2. Standalone issues keep their configured counts first (in Story → Task → Bug order),
   truncated only when the budget is too small to fit them all.
3. The remaining budget is distributed as epic children, evenly across epics (the first
   epics absorb any indivisible remainder). Children are reduced or padded relative to
   `childrenPerEpic` as needed.

#### Project Types
- **Company-managed**: Traditional Jira projects with parent field for epic relationships
- **Team-managed**: Next-Gen projects using custom ParentKey field

#### Sprint Generation
Sprints are automatically generated based on your date range and sprint duration:
```
Number of Sprints = (End Date - Start Date) / Sprint Duration
```

Sprints have realistic states:
- **Future**: Starts after current date
- **Active**: Currently running (1 sprint max)
- **Closed**: Completed sprints

#### Probability-Based Generation
Many fields use probability (0-1) to control how often they appear:
- `assignProbability`: Chance an issue has an assignee
- `labelProbability`: Chance an issue has labels
- `sprints.assignProbability`: Chance an issue is in a sprint
- `versions.assignProbability`: Chance an issue has a fix version
- `worklogs.probability`: Chance an issue has worklogs

#### Data Seeding
Use the per-project `seed` field for reproducible data generation (there is no top-level
`seed` — it would be ignored):
```typescript
const config = {
  version: '1.0',
  projects: [
    { projectKey: 'PROJ1', seed: 12345, issueCount: 20 }, // same seed = same issues
    { projectKey: 'PROJ2', seed: 98765, issueCount: 20 },
  ],
};
```

**Determinism caveat:** the seed controls the generation of that project's data
(issues, worklogs, comments, attachments). Global metadata — users, statuses, priorities,
fields, issue types — and cross-project issue links are seeded from the current time on
each `generateMockData()` call, so user account IDs and issue-link sets vary between
runs even when the seeds are fixed.

### Configuration Validation

All configurations are validated using Zod schemas with helpful error messages:

```typescript
import { validateConfig } from '@jira-mock/core';

try {
  const validConfig = validateConfig(config);
  // Config is valid, use it
} catch (error) {
  console.error('Invalid configuration:', error.message);
}
```

For detailed configuration documentation, see:
- [Example Configurations](./examples/configs/README.md) - Ready-to-use examples
- [`packages/core/src/config/schema.ts`](./packages/core/src/config/schema.ts) - The Zod
  schema (single source of truth)

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
- ⚙️ **Editors for every configuration section:**
  - Projects (add/remove/clone, key, name, type, seed, start issue number)
  - Status distribution sliders
  - Issue types: epic hierarchy and standalone counts
  - Sprints
  - Versions
  - Worklogs
  - Data (custom assignees, priorities, and labels)

Open [http://localhost:3000](http://localhost:3000) to use the configuration UI.

> **Note:** Every configuration section is editable in the UI except `issueCount`,
> `startDate`, and `endDate` — set those by uploading a JSON config or editing the
> exported JSON directly.

## Supported Endpoints

77 handlers are registered; all paths use the `/rest/api/2/` prefix.

### Users & Permissions
- `GET /rest/api/2/myself` - Get current user
- `GET /rest/api/2/user` - Get user by accountId
- `GET /rest/api/2/user/search` - Search users
- `GET /rest/api/2/user/search/query` - Search users (newer query format)
- `GET /rest/api/2/user/assignable/multiProjectSearch` - Search assignable users across projects
- `GET /rest/api/2/mypermissions` - Get current user's permissions

### User Properties
- `GET /rest/api/2/user/properties/{propertyKey}` - Get user property
- `PUT /rest/api/2/user/properties/{propertyKey}` - Set user property
- `DELETE /rest/api/2/user/properties/{propertyKey}` - Delete user property

### Projects
- `GET /rest/api/2/project` - Get all projects
- `GET /rest/api/2/project/search` - Search projects
- `GET /rest/api/2/project/{projectIdOrKey}` - Get project by ID or key
- `GET /rest/api/2/project/{projectIdOrKey}/statuses` - Get project statuses

### Project Properties
- `GET /rest/api/2/project/{projectIdOrKey}/properties` - List project property keys
- `GET /rest/api/2/project/{projectIdOrKey}/properties/{propertyKey}` - Get project property
- `PUT /rest/api/2/project/{projectIdOrKey}/properties/{propertyKey}` - Set project property
- `DELETE /rest/api/2/project/{projectIdOrKey}/properties/{propertyKey}` - Delete project property

### Issues
- `GET /rest/api/2/issue/{issueIdOrKey}` - Get issue
- `POST /rest/api/2/issue` - Create issue
- `PUT /rest/api/2/issue/{issueIdOrKey}` - Update issue
- `DELETE /rest/api/2/issue/{issueIdOrKey}` - Delete issue
- `GET /rest/api/2/issue/picker` - Issue picker suggestions

### Issue Properties
- `PUT /rest/api/2/issue/{issueIdOrKey}/properties/{propertyKey}` - Set issue property
- `POST /rest/api/2/issue/properties/multi` - Get properties for multiple issues

### Comments
- `GET /rest/api/2/issue/{issueIdOrKey}/comment` - Get all comments
- `POST /rest/api/2/issue/{issueIdOrKey}/comment` - Add comment
- `GET /rest/api/2/issue/{issueIdOrKey}/comment/{id}` - Get comment
- `PUT /rest/api/2/issue/{issueIdOrKey}/comment/{id}` - Update comment
- `DELETE /rest/api/2/issue/{issueIdOrKey}/comment/{id}` - Delete comment

### Transitions
- `GET /rest/api/2/issue/{issueIdOrKey}/transitions` - Get available transitions
- `POST /rest/api/2/issue/{issueIdOrKey}/transitions` - Perform transition

### Issue Links
- `GET /rest/api/2/issueLinkType` - Get all issue link types
- `GET /rest/api/2/issueLink/{linkId}` - Get issue link
- `POST /rest/api/2/issueLink` - Create issue link
- `DELETE /rest/api/2/issueLink/{linkId}` - Delete issue link

### Attachments
- `GET /rest/api/2/attachment/{id}` - Get attachment metadata
- `POST /rest/api/2/issue/{issueIdOrKey}/attachments` - Add attachments
- `DELETE /rest/api/2/attachment/{id}` - Delete attachment

### Components
- `GET /rest/api/2/component` - Get all components (simple list)
- `GET /rest/api/2/component/page` - Get component page
- `GET /rest/api/2/component/{id}` - Get component
- `POST /rest/api/2/component` - Create component
- `PUT /rest/api/2/component/{id}` - Update component
- `DELETE /rest/api/2/component/{id}` - Delete component
- `GET /rest/api/2/project/{projectIdOrKey}/components` - Get project components

### Versions
- `GET /rest/api/2/project/{projectIdOrKey}/versions` - Get project versions
- `GET /rest/api/2/version/{id}` - Get version
- `POST /rest/api/2/version` - Create version
- `PUT /rest/api/2/version/{id}` - Update version
- `DELETE /rest/api/2/version/{id}` - Delete version
- `POST /rest/api/2/version/{id}/removeAndSwap` - Remove version and swap references

### Search & JQL
- `GET /rest/api/2/search` - Search with JQL (GET)
- `POST /rest/api/2/search/jql` - Search with JQL (POST)
- `POST /rest/api/2/search/approximate-count` - Approximate match count
- `POST /rest/api/2/jql/match` - Check whether issues match JQL
- `GET /rest/api/2/jql/autocompletedata/suggestions` - JQL autocomplete suggestions

### Worklogs
- `GET /rest/api/2/issue/{issueIdOrKey}/worklog` - Get worklogs
- `POST /rest/api/2/issue/{issueIdOrKey}/worklog` - Add worklog
- `PUT /rest/api/2/issue/{issueIdOrKey}/worklog/{worklogId}` - Update worklog
- `DELETE /rest/api/2/issue/{issueIdOrKey}/worklog/{worklogId}` - Delete worklog
- `GET /rest/api/2/worklog/updated` - Get updated worklog IDs
- `POST /rest/api/2/worklog/list` - Get worklogs by IDs
- `GET /rest/api/2/worklog/deleted` - Get deleted worklog IDs

### Metadata
- `GET /rest/api/2/issuetype` - Get all issue types
- `GET /rest/api/2/issuetype/page` - Issue types (paged)
- `GET /rest/api/2/issuetype/project` - Issue types for a project
- `GET /rest/api/2/field` - Get all fields
- `GET /rest/api/2/priority` - Get all priorities
- `GET /rest/api/2/status` - Get all statuses
- `GET /rest/api/2/statuscategory` - Get all status categories
- `GET /rest/api/2/label` - Get all labels
- `GET /rest/api/2/issue/createmeta` - Create-issue metadata
- `GET /rest/api/2/issue/createmeta/{projectIdOrKey}/issuetypes` - Create metadata: issue types
- `GET /rest/api/2/issue/createmeta/{projectIdOrKey}/issuetypes/{issueTypeId}` - Create metadata: fields
- `GET /rest/api/2/issue/{issueIdOrKey}/editmeta` - Edit-issue metadata

### Filters
- `GET /rest/api/2/filter/{filterId}` - Get filter
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
      projects: [
        { projectKey: 'TEST1', issueCount: 10 },
        { projectKey: 'TEST2', issueCount: 10 },
      ],
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
│   │   │   │   ├── types.ts  # TypeScript interfaces
│   │   │   │   ├── schema.ts # Zod validation schemas
│   │   │   │   ├── defaults.ts # Default values & merging
│   │   │   │   └── validator.ts # Validation with warnings
│   │   │   ├── generators/   # Data generators
│   │   │   │   ├── issue.generator.ts # Issue & epic generation
│   │   │   │   ├── sprint.generator.ts # Sprint lifecycle
│   │   │   │   ├── worklog.generator.ts # Worklog entries
│   │   │   │   └── utils/    # Probability & templates
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
│   └── config-ui/            # Next.js configuration UI
│
└── examples/                 # Example configs and runnable examples
    ├── configs/              # Ready-to-use configuration files
    │   ├── minimal.json      # Minimal configuration
    │   ├── small-project.json # Small team project
    │   ├── team-managed.json # Team-managed project
    │   ├── large-project.json # Large enterprise project
    │   ├── full-featured.json # All features showcase
    │   ├── multi-project.json # Multi-project workspace
    │   └── README.md         # Configuration guide
    ├── vitest-example/       # Vitest + MSW usage example
    └── nextjs-openapi-tester/ # Browser Swagger UI against the mock
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
# Run all tests (every workspace)
npm test

# Run one workspace's tests
npm run test --workspace @jira-mock/core

# Coverage / watch mode (scripts are defined per workspace, not at the root)
npm run test:coverage --workspace @jira-mock/core
npm run test:watch --workspace @jira-mock/msw-integration
```

## Contributing

Contributions are welcome! Please see our contributing guidelines (coming soon).

## License

MIT

## Roadmap

### Iteration 1
- ✅ Core data generation
- ✅ Basic API endpoints (44 endpoints)
- ✅ Basic JQL support
- ✅ CRUD operations
- ✅ Comprehensive tests
- ✅ Next.js configuration UI

### Iteration 2
- ✅ Comments - Full CRUD operations
- ✅ Issue transitions & workflows
- ✅ Attachments metadata support
- ✅ Issue links & link types
- ✅ Components CRUD operations
- ✅ Versions CRUD operations
- ✅ 70+ API endpoints total

### Iteration 3 (Current)
- ✅ Configuration extension system
- ✅ Epic hierarchy with parent-child relationships
- ✅ Sprint generation and lifecycle management
- ✅ Team-managed vs Company-managed projects
- ✅ Probability-based data generation
- ✅ Status distribution control
- ✅ Configurable worklogs, versions, and assignees
- ✅ Example configurations library
- ✅ Enhanced TypeScript types and validation

### Future Iterations
- 🔄 Advanced JQL support (complex queries, functions)
- 🔄 Custom fields configuration
- 🔄 Subtasks support
- 🔄 Agile board endpoints
- 🔄 Webhooks simulation
- 🔄 Real-time updates
- 🔄 Advanced workflow schemes
- 🔄 Configuration UI enhancements (visual editors for all new features)

## Support

For issues and questions, please open an issue on GitHub.

---

Made with ❤️ for better Jira testing
