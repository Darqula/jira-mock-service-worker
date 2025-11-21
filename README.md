# Jira Mock Service Worker

A comprehensive Mock Service Worker (MSW) integration for mocking Jira Cloud API endpoints. Perfect for automated testing and performance benchmarks.

## Features

- 🎯 **100+ Jira Cloud API endpoints** mocked and ready to use
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

The configuration file controls what mock data is generated. The configuration system supports extensive customization including project types, issue hierarchies (epics with children), sprint management, version tracking, worklog generation, and more.

### Basic Configuration

The minimal configuration requires only `version` and `projects`:

```typescript
interface JiraMockConfig {
  version: '1.0';
  seed?: number;              // Optional: for reproducible data
  projects: {
    count: number;            // 1-100 projects
    issuesPerProject: number; // 1-10000 issues per project (used when not using epics)
  };
}
```

### Minimal Example

```typescript
const config = {
  version: '1.0',
  projects: {
    count: 1,
    issuesPerProject: 50,
  },
};
```

### Advanced Configuration

For advanced use cases, you can customize nearly every aspect of the generated data:

```typescript
const config = {
  version: '1.0',
  seed: 12345, // Reproducible data generation

  // General project settings
  general: {
    projectKey: 'DEMO',           // Custom project key
    startIssueNumber: 1,          // Starting issue number
    startDate: '2024-01-01',      // Project start date
    endDate: '2024-12-31',        // Project end date
    projectType: 'company-managed', // or 'team-managed'
    chunkSize: 250,               // Issues per export chunk (0 = no chunking)
  },

  // Status distribution (percentages)
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

  projects: {
    count: 1,
    issuesPerProject: 400,       // Only used if not using epic-based generation
  },
};
```

### Configuration Examples

See the `examples/configs/` directory for ready-to-use configuration examples:

- **minimal.json** - Simplest configuration with defaults (50 issues)
- **small-project.json** - Small team project with customization (~58 issues)
- **team-managed.json** - Team-managed (Next-Gen) project example (~123 issues)
- **large-project.json** - Large enterprise project (~1,200 issues)
- **full-featured.json** - Comprehensive feature showcase (~360 issues)

Each example includes detailed comments and demonstrates different use cases. See `examples/configs/README.md` for complete documentation.

### Key Configuration Features

#### Epic Hierarchy
When using epics, the total issue count is calculated automatically:
```
Total Issues = (Epic Count × Children Per Epic) + Standalone Stories + Standalone Tasks + Standalone Bugs
```

Example: 10 epics × 30 children + 25 stories + 15 tasks + 10 bugs = 350 total issues

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
Use the `seed` field for reproducible data generation:
```typescript
const config = {
  version: '1.0',
  seed: 12345, // Same seed = same data every time
  projects: { count: 2, issuesPerProject: 20 },
};
```

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
- [Configuration Plan](./CONFIGURATION_EXTENSION_PLAN.md) - Complete feature specifications
- [Implementation Checklist](./IMPLEMENTATION_CHECKLIST.md) - Implementation progress
- [Example Configurations](./examples/configs/README.md) - Ready-to-use examples

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
- ⚙️ **Advanced configuration sections** for all features:
  - Project settings (type, key, dates)
  - Status distribution sliders
  - Epic hierarchy configuration
  - Sprint management
  - Version tracking
  - Worklog generation
  - Custom assignees, priorities, and labels

Open [http://localhost:3000](http://localhost:3000) to use the configuration UI.

> **Note:** The UI currently supports basic configuration. Advanced features (epics, sprints, custom data) can be configured by importing JSON configurations or editing the configuration JSON directly.

## Supported Endpoints

### Users & Permissions
- `GET /rest/api/2/myself` - Get current user
- `GET /rest/api/2/user` - Get user by accountId
- `GET /rest/api/2/user/search` - Search users

### Projects
- `GET /rest/api/2/project` - Get all projects
- `GET /rest/api/2/project/{projectIdOrKey}` - Get project by ID or key
- `GET /rest/api/2/project/{projectIdOrKey}/statuses` - Get project statuses
- `GET /rest/api/2/project/{projectIdOrKey}/components` - Get project components
- `GET /rest/api/2/project/{projectIdOrKey}/versions` - Get project versions

### Issues
- `GET /rest/api/2/issue/{issueIdOrKey}` - Get issue
- `POST /rest/api/2/issue` - Create issue
- `PUT /rest/api/2/issue/{issueIdOrKey}` - Update issue
- `DELETE /rest/api/2/issue/{issueIdOrKey}` - Delete issue
- `GET /rest/api/2/issue/picker` - Issue picker suggestions

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
- `GET /rest/api/2/component/{id}` - Get component
- `POST /rest/api/2/component` - Create component
- `PUT /rest/api/2/component/{id}` - Update component
- `DELETE /rest/api/2/component/{id}` - Delete component

### Versions
- `GET /rest/api/2/version/{id}` - Get version
- `POST /rest/api/2/version` - Create version
- `PUT /rest/api/2/version/{id}` - Update version
- `DELETE /rest/api/2/version/{id}` - Delete version

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
├── examples/                 # Example configurations
│   └── configs/
│       ├── minimal.json      # Minimal configuration
│       ├── small-project.json # Small team project
│       ├── team-managed.json # Team-managed project
│       ├── large-project.json # Large enterprise project
│       ├── full-featured.json # All features showcase
│       └── README.md         # Configuration guide
│
└── docs/                     # Documentation
    ├── CONFIGURATION_EXTENSION_PLAN.md
    └── IMPLEMENTATION_CHECKLIST.md
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
