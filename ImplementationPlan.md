# Jira Mock Service Worker - Detailed Implementation Plan

## 1. Project Overview

### 1.1 Project Goals
- Generate realistic mock Jira Cloud API data for automated testing and performance benchmarks
- Support MSW (Mock Service Worker) integration for seamless API mocking
- Provide a user-friendly Next.js interface for configuration management

### 1.2 Technology Stack
- **Language**: TypeScript (strict mode)
- **Package Manager**: npm (with workspaces)
- **Testing**: Vitest + @testing-library
- **Mocking**: MSW (Mock Service Worker) v2.x
- **UI Framework**: Next.js 14+ with App Router
- **Validation**: Zod (for config and runtime validation)
- **Fake Data**: @faker-js/faker

---

## 2. Project Structure

```
jira-mock-service-worker/
├── packages/
│   ├── core/                          # Core data generation library
│   │   ├── src/
│   │   │   ├── config/
│   │   │   │   ├── schema.ts          # Zod schemas for config
│   │   │   │   ├── types.ts           # Config TypeScript types
│   │   │   │   └── validator.ts       # Config validation logic
│   │   │   ├── generators/
│   │   │   │   ├── base/              # Base generator utilities
│   │   │   │   │   ├── id-generator.ts
│   │   │   │   │   ├── date-generator.ts
│   │   │   │   │   └── faker-config.ts
│   │   │   │   ├── user.generator.ts
│   │   │   │   ├── project.generator.ts
│   │   │   │   ├── issue.generator.ts
│   │   │   │   ├── issue-type.generator.ts
│   │   │   │   ├── field.generator.ts
│   │   │   │   ├── status.generator.ts
│   │   │   │   ├── priority.generator.ts
│   │   │   │   ├── worklog.generator.ts
│   │   │   │   ├── version.generator.ts
│   │   │   │   ├── component.generator.ts
│   │   │   │   └── index.ts
│   │   │   ├── store/
│   │   │   │   ├── data-store.ts      # In-memory data store
│   │   │   │   ├── index-manager.ts   # Indexes for quick lookups
│   │   │   │   └── query-engine.ts    # JQL-like query support
│   │   │   ├── types/
│   │   │   │   ├── jira-schemas.ts    # Generated from OpenAPI
│   │   │   │   ├── generator.types.ts
│   │   │   │   └── index.ts
│   │   │   ├── utils/
│   │   │   │   ├── jql-parser.ts      # Basic JQL parsing
│   │   │   │   ├── pagination.ts
│   │   │   │   └── response-builder.ts
│   │   │   └── index.ts               # Main entry point
│   │   ├── tests/
│   │   │   ├── generators/
│   │   │   ├── store/
│   │   │   └── fixtures/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   ├── msw-integration/               # MSW integration layer
│   │   ├── src/
│   │   │   ├── handlers/
│   │   │   │   ├── users.handlers.ts
│   │   │   │   ├── projects.handlers.ts
│   │   │   │   ├── issues.handlers.ts
│   │   │   │   ├── search.handlers.ts
│   │   │   │   ├── worklogs.handlers.ts
│   │   │   │   ├── metadata.handlers.ts
│   │   │   │   ├── filters.handlers.ts
│   │   │   │   └── index.ts
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts
│   │   │   │   ├── error.middleware.ts
│   │   │   │   └── logging.middleware.ts
│   │   │   ├── setup/
│   │   │   │   ├── browser.ts         # Browser setup
│   │   │   │   ├── node.ts            # Node setup
│   │   │   │   └── index.ts
│   │   │   ├── types/
│   │   │   │   └── handler.types.ts
│   │   │   ├── utils/
│   │   │   │   ├── request-parser.ts
│   │   │   │   └── response-formatter.ts
│   │   │   └── index.ts
│   │   ├── tests/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── vitest.config.ts
│   │
│   └── config-ui/                     # Next.js configuration UI
│       ├── src/
│       │   ├── app/
│       │   │   ├── layout.tsx
│       │   │   ├── page.tsx
│       │   │   └── api/
│       │   │       └── config/
│       │   │           ├── route.ts   # GET/POST config
│       │   │           └── validate/
│       │   │               └── route.ts
│       │   ├── components/
│       │   │   ├── ConfigEditor/
│       │   │   │   ├── index.tsx
│       │   │   │   ├── ProjectsSection.tsx
│       │   │   │   ├── IssuesSection.tsx
│       │   │   │   └── PreviewSection.tsx
│       │   │   ├── ui/                # Shadcn components
│       │   │   └── layout/
│       │   ├── lib/
│       │   │   ├── config-manager.ts
│       │   │   └── validation.ts
│       │   └── types/
│       │       └── config.types.ts
│       ├── public/
│       ├── package.json
│       ├── tsconfig.json
│       ├── next.config.js
│       └── tailwind.config.js
│
├── examples/                          # Usage examples
│   ├── vitest-example/
│   ├── playwright-example/
│   └── performance-benchmark/
│
├── docs/
│   ├── architecture.md
│   ├── api-reference.md
│   ├── configuration.md
│   └── examples.md
│
├── package.json                       # Root package.json with workspaces
├── tsconfig.base.json
├── .gitignore
└── README.md
```

---

## 3. Core Library Design (`packages/core`)

### 3.1 Configuration Schema (Iteration 1)

```typescript
// config/schema.ts
interface JiraMockConfig {
  version: "1.0";
  seed?: number;                    // For reproducible random data
  projects: {
    count: number;                  // Number of projects to generate
    issuesPerProject: number;       // Issues per project
  };
}
```

### 3.2 Data Generation Strategy

**Key Principles:**
1. **Deterministic generation**: Use seed for reproducibility
2. **Relational integrity**: Maintain relationships between entities
3. **Realistic data**: Use faker.js with sensible defaults
4. **Performance**: Generate data lazily where possible

**Generation Flow:**
```
1. Load & validate config
2. Initialize ID generators (deterministic sequences)
3. Generate global metadata (statuses, priorities, issue types)
4. Generate users pool
5. For each project:
   a. Generate project metadata
   b. Generate project users/roles
   c. Generate components & versions
   d. Generate issues with relationships
   e. Generate worklogs
6. Build indexes for fast lookup
7. Store in data-store
```

### 3.3 Core Components

#### 3.3.1 Data Store
- In-memory storage with indexed access
- Support for:
  - Get by ID
  - Query by filters
  - JQL-like search (basic support)
  - Pagination
  - Field projection

#### 3.3.2 Generators

Each generator follows this interface:
```typescript
interface Generator<T> {
  generate(context: GenerationContext): T;
  generateMany(count: number, context: GenerationContext): T[];
}
```

**Priority Order:**
1. **User Generator**: System users, project leads, assignees
2. **Metadata Generators**: Statuses, priorities, issue types, fields
3. **Project Generator**: Projects with metadata
4. **Issue Generator**: Issues with fields, relationships
5. **Worklog Generator**: Time tracking entries
6. **Version/Component Generators**: Release management

#### 3.3.3 Query Engine

Support for:
- Field filtering (equality, IN, range)
- Basic JQL parsing (project, status, assignee, etc.)
- Sorting
- Pagination
- Field selection/expansion

---

## 4. MSW Integration Library (`packages/msw-integration`)

### 4.1 Handler Organization

Group handlers by API domain:
- **Users & Permissions**: `/rest/api/2/myself`, `/rest/api/2/user/*`
- **Projects**: `/rest/api/2/project/*`
- **Issues**: `/rest/api/2/issue/*`
- **Search**: `/rest/api/2/search/*`, `/rest/api/2/jql/*`
- **Worklogs**: `/rest/api/2/worklog/*`
- **Metadata**: `/rest/api/2/issuetype`, `/rest/api/2/field`, etc.
- **Filters**: `/rest/api/2/filter/*`

### 4.2 Handler Pattern

```typescript
// Example handler structure
export const getIssueHandler = (dataStore: DataStore) =>
  http.get('/rest/api/2/issue/:issueId', async ({ params, request }) => {
    const { issueId } = params;
    const url = new URL(request.url);
    const expand = url.searchParams.get('expand');

    const issue = dataStore.getIssue(issueId);
    if (!issue) {
      return HttpResponse.json({ error: 'Issue not found' }, { status: 404 });
    }

    return HttpResponse.json(formatIssue(issue, expand));
  });
```

### 4.3 Initialization API

```typescript
// Public API
export function setupJiraMock(config: JiraMockConfig) {
  const dataStore = generateMockData(config);
  const handlers = createHandlers(dataStore);
  return { handlers, dataStore };
}

// Usage in tests
const { handlers } = setupJiraMock({
  version: "1.0",
  projects: { count: 3, issuesPerProject: 50 }
});

const server = setupServer(...handlers);
```

### 4.4 Features

1. **Request validation**: Validate query params, body
2. **Error simulation**: Support for error injection
3. **Latency simulation**: Configurable response delays
4. **Logging**: Optional request/response logging
5. **Auth middleware**: Basic auth header validation

---

## 5. Next.js Configuration UI (`packages/config-ui`)

### 5.1 Features (Iteration 1)

1. **Config Editor**:
   - Number of projects input (1-100)
   - Issues per project input (1-10000)
   - Seed input (optional)
   - Real-time validation

2. **Preview Section**:
   - Show what will be generated
   - Estimated data size
   - Estimated generation time

3. **Export/Import**:
   - Download config as JSON
   - Upload existing config
   - Save to localStorage

4. **Validation**:
   - Client-side validation (Zod)
   - Server-side validation (API route)
   - Clear error messages

### 5.2 UI Components

- Form with controlled inputs
- Validation error display
- JSON preview/editor (Monaco/CodeMirror)
- Export/import buttons
- Dark mode support

### 5.3 API Routes

- `GET /api/config` - Load saved config
- `POST /api/config` - Save config
- `POST /api/config/validate` - Validate config
- `POST /api/config/preview` - Generate preview data

---

## 6. Implementation Phases

### Phase 1: Core Foundation (Week 1)
1. Set up monorepo structure with npm workspaces
2. Configure TypeScript, ESLint, Prettier
3. Set up Vitest testing infrastructure
4. Implement config schema & validation
5. Create base generator utilities (ID, date, faker setup)
6. Implement data store with basic CRUD

### Phase 2: Core Generators (Week 1-2)
1. User generator
2. Project generator (basic)
3. Issue type, status, priority generators
4. Field generator
5. Issue generator with relationships
6. Component & version generators
7. Worklog generator

### Phase 3: Core Testing (Week 2)
1. Unit tests for all generators
2. Unit tests for data store
3. Unit tests for config validation
4. Data consistency tests

### Phase 4: MSW Integration (Week 2-3)
1. Set up MSW handlers structure
2. Implement user endpoints
3. Implement project endpoints
4. Implement issue CRUD endpoints
5. Implement search/JQL endpoint (basic)
6. Implement worklog endpoints
7. Implement metadata endpoints
8. Tests for MSW handlers

### Phase 5: Next.js UI (Week 3)
1. Set up Next.js 14 with App Router
2. Create layout and navigation
3. Build config editor form
4. Implement validation UI
5. Add preview functionality
6. Add export/import features
7. Style with Tailwind + Shadcn

### Phase 6: Documentation & Examples (Week 4)
1. Write comprehensive README
2. Create API reference docs
3. Add usage examples (Vitest, Playwright)
4. Add performance benchmark example (for users to test their projects)
5. Create architecture documentation

### Phase 7: Polish & Release (Week 4)
1. End-to-end testing
2. Error handling improvements
3. CI/CD setup
4. Prepare for npm publication

---

## 7. Testing Strategy

### 7.1 Core Library Tests

**Unit Tests:**
- Each generator produces valid Jira entities
- ID generation is deterministic with seed
- Relationships are maintained correctly
- Config validation works correctly
- Data store CRUD operations work correctly
- Query engine filtering works correctly
- JQL parser handles basic queries

### 7.2 MSW Integration Tests

- All handlers return correct response shapes
- Error cases handled properly (404, 400, etc.)
- Query parameters parsed correctly
- Pagination headers correct
- Request/response validation

### 7.3 UI Tests

- Form validation works
- Config export/import works
- API routes respond correctly
- Error states display properly

---

## 8. Key Technical Decisions

### 8.1 Why Monorepo with npm workspaces?
- Shared types between packages
- Easier development and testing
- Single version management
- Coordinated releases
- Native to npm (no additional tools needed)

### 8.2 Why Zod?
- Runtime validation
- Type inference
- Great error messages
- JSON schema generation

### 8.3 Why Vitest?
- Fast
- Native ESM support
- Compatible with Vite/Next.js
- Great DX

### 8.4 Why In-Memory Store?
- Simple implementation
- Fast for testing scenarios
- No external dependencies
- Sufficient for mock data

---

## 9. API Coverage (Iteration 1)

### 9.1 Must Implement (44 endpoints)
- GET /rest/api/2/myself
- GET /rest/api/2/user
- GET /rest/api/2/user/search
- GET /rest/api/2/project
- GET /rest/api/2/project/{projectId}
- GET /rest/api/2/project/{projectId}/statuses
- GET /rest/api/2/issuetype
- GET /rest/api/2/field
- GET /rest/api/2/priority
- GET /rest/api/2/statuscategory
- POST /rest/api/2/issue
- GET /rest/api/2/issue/{issueId}
- PUT /rest/api/2/issue/{issueId}
- DELETE /rest/api/2/issue/{issueId}
- GET /rest/api/2/issue/{issueId}/worklog
- POST /rest/api/2/issue/{issueId}/worklog
- POST /rest/api/2/search/jql
- GET /rest/api/2/issue/picker
- GET /rest/api/2/filter/search
- GET /rest/api/2/label

### 9.2 Future Iterations
- Advanced JQL support
- Issue transitions
- Attachments
- Comments
- Webhooks simulation
- Real-time updates

---

## 10. Dependencies

### Root (`package.json`)
```json
{
  "name": "jira-mock-service-worker",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "packages/*",
    "examples/*"
  ],
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0",
    "eslint": "^8.56.0",
    "prettier": "^3.2.0"
  }
}
```

### Core (`packages/core`)
```json
{
  "name": "@jira-mock/core",
  "version": "1.0.0",
  "dependencies": {
    "@faker-js/faker": "^9.0.0",
    "zod": "^3.22.0"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "@types/node": "^20.0.0",
    "typescript": "^5.3.0"
  }
}
```

### MSW Integration (`packages/msw-integration`)
```json
{
  "name": "@jira-mock/msw-integration",
  "version": "1.0.0",
  "dependencies": {
    "@jira-mock/core": "*",
    "msw": "^2.0.0"
  },
  "devDependencies": {
    "vitest": "^2.0.0",
    "@vitest/ui": "^2.0.0"
  }
}
```

### Config UI (`packages/config-ui`)
```json
{
  "name": "@jira-mock/config-ui",
  "version": "1.0.0",
  "dependencies": {
    "@jira-mock/core": "*",
    "next": "^14.0.0",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "zod": "^3.22.0",
    "tailwindcss": "^3.4.0",
    "@radix-ui/react-*": "latest"
  }
}
```

---

## 11. Future Enhancements (Post-Iteration 1)

1. **Config Expansion**:
   - Users per project
   - Workflows and transitions
   - Custom fields configuration
   - Issue relationships (links, subtasks)
   - Components and versions per project

2. **Advanced Features**:
   - Realistic JQL parser
   - Issue history/changelog
   - Attachments support
   - Comments and mentions
   - Notifications simulation

3. **Performance**:
   - Lazy loading for large datasets
   - Streaming responses
   - Database backend option (SQLite)

4. **UI Enhancements**:
   - Visual config builder
   - Data preview/browsing
   - Export to different formats
   - Preset configurations

---

## 12. Success Criteria

**Core Library**:
- Generates valid Jira entities matching OpenAPI spec
- Passes all unit tests
- Has >80% code coverage

**MSW Integration**:
- Covers all iteration 1 endpoints
- Works in both Node and browser
- Easy setup (< 5 lines of code)
- Clear documentation

**Next.js UI**:
- Intuitive config editing
- Real-time validation
- Works on mobile/desktop
- Fast and responsive

**Documentation**:
- Complete API reference
- Multiple usage examples
- Architecture explanation
- Contribution guidelines
