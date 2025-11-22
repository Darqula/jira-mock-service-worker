# Per-Project Configuration - Implementation Plan

## Overview

This document outlines the plan to refactor the configuration system from a single global configuration to support individual configurations for each project.

## Current State

### Configuration Structure
Currently, the system uses a **single monolithic configuration** that applies to all projects:

```json
{
  "version": "1.0",
  "seed": 12345,
  "general": { "projectKey": "PROJ", ... },
  "statusDistribution": { ... },
  "issueTypes": { ... },
  "sprints": { ... },
  "versions": { ... },
  "worklogs": { ... },
  "data": { ... },
  "projects": {
    "count": 3,
    "issuesPerProject": 10
  }
}
```

**Limitations:**
- All projects share the same configuration
- Cannot have different issue counts, status distributions, or settings per project
- Cannot simulate realistic multi-project environments
- Limited flexibility for testing scenarios

## Target State

### New Configuration Structure

```json
{
  "version": "2.0",
  "globalDefaults": {
    "seed": 12345,
    "statusDistribution": { ... },
    "issueTypes": { ... },
    "sprints": { ... },
    "versions": { ... },
    "worklogs": { ... }
  },
  "projects": [
    {
      "projectKey": "ALPHA",
      "projectName": "Alpha Project",
      "projectType": "company-managed",
      "issueCount": 100,
      "seed": 12345,
      "statusDistribution": { "toDo": 0.5, "inProgress": 0.3, "done": 0.2 },
      "issueTypes": { ... },
      "sprints": { ... },
      "versions": { ... },
      "worklogs": { ... },
      "data": {
        "assignees": ["alice@example.com"],
        "priorities": ["High", "Medium"],
        "labels": ["backend", "api"]
      }
    },
    {
      "projectKey": "BETA",
      "projectName": "Beta Project",
      "projectType": "team-managed",
      "issueCount": 50,
      // Inherits from globalDefaults, can override specific fields
      "statusDistribution": { "toDo": 0.3, "inProgress": 0.1, "done": 0.6 }
    }
  ]
}
```

**Key Features:**
- `globalDefaults`: Optional default settings inherited by all projects
- `projects`: Array of project-specific configurations
- Each project can override any setting from globalDefaults
- Each project has its own `issueCount` instead of global `issuesPerProject`
- Each project must specify `projectKey` (required, unique identifier)

## Architecture Changes

### 1. Core Package (`packages/core`)

#### Configuration Types & Schema

**New Types** (`src/config/types.ts`):

```typescript
interface JiraMockConfigV2 {
  version: '2.0';
  globalDefaults?: ProjectConfig;  // Optional defaults for all projects
  projects: ProjectConfigWithKey[]; // Array of project configs
}

interface ProjectConfig {
  // All the current config fields EXCEPT projectKey
  seed?: number;
  statusDistribution?: StatusDistribution;
  issueTypes?: IssueTypesConfig;
  sprints?: SprintsConfig;
  versions?: VersionsConfig;
  worklogs?: WorklogsConfig;
  data?: DataConfig;
}

interface ProjectConfigWithKey extends ProjectConfig {
  projectKey: string;          // Required, unique
  projectName?: string;         // Optional display name
  projectType?: 'company-managed' | 'team-managed';
  issueCount: number;           // Required, 1-10000
}

// Union type for backward compatibility
type JiraMockConfig = JiraMockConfigV1 | JiraMockConfigV2;

interface JiraMockConfigV1 {
  version: '1.0';
  // ... current structure
}
```

**New Validation** (`src/config/schema.ts`):

```typescript
const projectConfigSchema = z.object({
  seed: z.number().optional(),
  statusDistribution: statusDistributionSchema.optional(),
  issueTypes: issueTypesConfigSchema.optional(),
  sprints: sprintsConfigSchema.optional(),
  versions: versionsConfigSchema.optional(),
  worklogs: worklogsConfigSchema.optional(),
  data: dataConfigSchema.optional(),
});

const projectConfigWithKeySchema = projectConfigSchema.extend({
  projectKey: z.string()
    .min(1, 'Project key is required')
    .max(10, 'Project key must be 10 characters or less')
    .regex(/^[A-Z][A-Z0-9]*$/, 'Project key must start with a letter and contain only uppercase letters and numbers'),
  projectName: z.string().optional(),
  projectType: z.enum(['company-managed', 'team-managed']).optional(),
  issueCount: z.number()
    .int('Issue count must be an integer')
    .min(1, 'Issue count must be at least 1')
    .max(10000, 'Issue count must be at most 10000'),
});

const configSchemaV2 = z.object({
  version: z.literal('2.0'),
  globalDefaults: projectConfigSchema.optional(),
  projects: z.array(projectConfigWithKeySchema)
    .min(1, 'At least one project is required')
    .refine(
      (projects) => {
        const keys = projects.map(p => p.projectKey);
        return keys.length === new Set(keys).size;
      },
      { message: 'Project keys must be unique' }
    ),
});

const configSchema = z.union([configSchemaV1, configSchemaV2]);
```

**New Default Merging** (`src/config/defaults.ts`):

```typescript
function mergeProjectWithDefaults(
  projectConfig: ProjectConfigWithKey,
  globalDefaults?: ProjectConfig
): ProjectConfigWithKey {
  // 1. Start with built-in defaults
  const builtInDefaults = getBuiltInDefaults();

  // 2. Merge with global defaults if provided
  const baseConfig = globalDefaults
    ? deepMerge(builtInDefaults, globalDefaults)
    : builtInDefaults;

  // 3. Merge with project-specific config
  return deepMerge(baseConfig, projectConfig);
}
```

#### Data Generation

**New Generation Flow** (`src/index.ts`):

```typescript
export function generateMockData(config: unknown): GenerateMockDataResult {
  // 1. Validate and determine version
  const validConfig = validateConfig(config);

  // 2. Initialize data store
  const dataStore = new DataStore();
  const queryEngine = new QueryEngine(dataStore);

  // 3. Handle version-specific generation
  if (validConfig.version === '2.0') {
    generateMockDataV2(validConfig, dataStore, queryEngine);
  } else {
    generateMockDataV1(validConfig, dataStore, queryEngine);
  }

  return { dataStore, queryEngine };
}

function generateMockDataV2(
  config: JiraMockConfigV2,
  dataStore: DataStore,
  queryEngine: QueryEngine
) {
  // 1. Generate global metadata (statuses, priorities, issue types)
  //    These are still global as they're shared across Jira instance

  // 2. Generate users (aggregate from all projects' data.assignees)
  const allAssignees = aggregateAssignees(config);

  // 3. For each project:
  for (const projectConfig of config.projects) {
    // Merge with global defaults
    const mergedConfig = mergeProjectWithDefaults(
      projectConfig,
      config.globalDefaults
    );

    // Create generation context for this project
    const context = createProjectContext(mergedConfig);

    // Generate project
    const project = generateProject(projectConfig, context);

    // Generate components, versions, sprints for this project
    generateProjectMetadata(project, context);

    // Generate issues for this project
    generateIssuesForProject(project, projectConfig.issueCount, context);

    // Generate worklogs, comments, attachments for this project's issues
    generateIssueMetadata(project, context);
  }

  // 4. Generate cross-project issue links (if needed)
}
```

### 2. Config-UI Package (`packages/config-ui`)

#### UI Structure

**New Components:**

```
src/components/ConfigEditor/
├── index.tsx                      # Main editor - manages project list
├── ProjectList.tsx                # List of projects with add/remove
├── ProjectEditor.tsx              # Editor for single project
├── GlobalDefaultsEditor.tsx       # Editor for global defaults
├── ProjectCard.tsx                # Collapsed project card view
└── ... (existing section components)
```

**Main Editor Changes** (`components/ConfigEditor/index.tsx`):

```typescript
interface ConfigEditorState {
  version: '2.0';
  globalDefaults?: ProjectConfig;
  projects: ProjectConfigWithKey[];
  selectedProjectIndex: number | null;
  editingGlobalDefaults: boolean;
}

function ConfigEditor() {
  const [state, setState] = useState<ConfigEditorState>({
    version: '2.0',
    projects: [],
    selectedProjectIndex: null,
    editingGlobalDefaults: false,
  });

  // Handlers
  const handleAddProject = () => { ... };
  const handleRemoveProject = (index: number) => { ... };
  const handleSelectProject = (index: number) => { ... };
  const handleUpdateProject = (index: number, config: ProjectConfigWithKey) => { ... };
  const handleUpdateGlobalDefaults = (defaults: ProjectConfig) => { ... };

  return (
    <div className="config-editor">
      <header>
        <h1>Jira Mock Configuration</h1>
        <div className="actions">
          <Button onClick={handleSave}>Save</Button>
          <Button onClick={handleDownload}>Download</Button>
          <Button onClick={handleUpload}>Upload</Button>
        </div>
      </header>

      <div className="editor-layout">
        <aside className="project-sidebar">
          <Button onClick={() => setEditingGlobalDefaults(true)}>
            Global Defaults
          </Button>
          <ProjectList
            projects={state.projects}
            selectedIndex={state.selectedProjectIndex}
            onSelect={handleSelectProject}
            onAdd={handleAddProject}
            onRemove={handleRemoveProject}
          />
        </aside>

        <main className="editor-main">
          {state.editingGlobalDefaults ? (
            <GlobalDefaultsEditor
              config={state.globalDefaults}
              onChange={handleUpdateGlobalDefaults}
            />
          ) : state.selectedProjectIndex !== null ? (
            <ProjectEditor
              config={state.projects[state.selectedProjectIndex]}
              globalDefaults={state.globalDefaults}
              onChange={(config) => handleUpdateProject(state.selectedProjectIndex!, config)}
            />
          ) : (
            <EmptyState />
          )}
        </main>
      </div>
    </div>
  );
}
```

**Project List Component** (`components/ConfigEditor/ProjectList.tsx`):

```typescript
interface ProjectListProps {
  projects: ProjectConfigWithKey[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
}

function ProjectList({ projects, selectedIndex, onSelect, onAdd, onRemove }: ProjectListProps) {
  return (
    <div className="project-list">
      <div className="project-list-header">
        <h2>Projects</h2>
        <Button onClick={onAdd} size="sm">Add Project</Button>
      </div>

      <div className="project-items">
        {projects.map((project, index) => (
          <ProjectCard
            key={project.projectKey}
            project={project}
            isSelected={selectedIndex === index}
            onClick={() => onSelect(index)}
            onRemove={() => onRemove(index)}
          />
        ))}
      </div>
    </div>
  );
}
```

**Project Editor Component** (`components/ConfigEditor/ProjectEditor.tsx`):

```typescript
interface ProjectEditorProps {
  config: ProjectConfigWithKey;
  globalDefaults?: ProjectConfig;
  onChange: (config: ProjectConfigWithKey) => void;
}

function ProjectEditor({ config, globalDefaults, onChange }: ProjectEditorProps) {
  // Show which fields are inherited from global defaults
  const isInherited = (field: string) => {
    return config[field] === undefined && globalDefaults?.[field] !== undefined;
  };

  return (
    <div className="project-editor">
      <header>
        <h2>Edit Project: {config.projectKey}</h2>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Basic Info</CardTitle>
        </CardHeader>
        <CardContent>
          <Input
            label="Project Key"
            value={config.projectKey}
            onChange={(e) => onChange({ ...config, projectKey: e.target.value })}
            required
          />
          <Input
            label="Project Name"
            value={config.projectName || ''}
            onChange={(e) => onChange({ ...config, projectName: e.target.value })}
          />
          <Input
            type="number"
            label="Issue Count"
            value={config.issueCount}
            onChange={(e) => onChange({ ...config, issueCount: parseInt(e.target.value) })}
            required
          />
        </CardContent>
      </Card>

      {/* Reuse existing section components */}
      <StatusSection
        config={config.statusDistribution}
        onChange={(statusDistribution) => onChange({ ...config, statusDistribution })}
        isInherited={isInherited('statusDistribution')}
      />

      <IssueTypesSection
        config={config.issueTypes}
        onChange={(issueTypes) => onChange({ ...config, issueTypes })}
        isInherited={isInherited('issueTypes')}
      />

      {/* ... other sections */}
    </div>
  );
}
```

#### Configuration Manager

**Updated Config Manager** (`lib/config-manager.ts`):

```typescript
const CONFIG_STORAGE_KEY = 'jira-mock-config-v2';

export function saveConfig(config: JiraMockConfigV2) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config, null, 2));
  }
}

export function loadConfig(): JiraMockConfigV2 | null {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem(CONFIG_STORAGE_KEY);
    if (stored) {
      try {
        const config = JSON.parse(stored);
        // Validate before returning
        return validateConfig(config);
      } catch (error) {
        console.error('Failed to load config:', error);
        return null;
      }
    }
  }
  return null;
}

// Migration helper
export function migrateV1ToV2(configV1: JiraMockConfigV1): JiraMockConfigV2 {
  const { version, projects, ...projectConfig } = configV1;

  return {
    version: '2.0',
    globalDefaults: projectConfig,
    projects: Array.from({ length: projects.count }, (_, i) => ({
      projectKey: `PROJ${i + 1}`,
      projectName: `Project ${i + 1}`,
      issueCount: projects.issuesPerProject,
      // Projects inherit from globalDefaults
    })),
  };
}
```

### 3. MSW-Integration Package (`packages/msw-integration`)

**Minimal Changes Required:**

The MSW integration package mostly just passes the config to the core package, so changes are minimal:

```typescript
// src/index.ts - No changes needed, just pass config through
export function setupJiraMock(options: SetupJiraMockOptions): SetupJiraMockResult {
  const { config, baseUrl = 'https://your-domain.atlassian.net' } = options;

  // Core package handles both v1 and v2 configs
  const { dataStore, queryEngine } = generateMockData(config);

  const handlers = createHandlers(dataStore, queryEngine, baseUrl);

  return { handlers, dataStore, queryEngine };
}
```

**Type Updates:**

```typescript
// src/types.ts
import type { JiraMockConfig } from '@jira-mock/core';

export interface SetupJiraMockOptions {
  config: JiraMockConfig;  // Now supports both v1 and v2
  baseUrl?: string;
}
```

### 4. Examples

**New Example Configs:**

```
examples/configs/
├── v2/
│   ├── multi-project.json          # Multiple projects with different configs
│   ├── inheritance-demo.json       # Demonstrates global defaults + overrides
│   ├── minimal-v2.json             # Minimal v2 config
│   └── realistic-workspace.json    # Realistic multi-project workspace
└── (keep existing v1 configs for backward compatibility)
```

**Example: Multi-Project Config** (`examples/configs/v2/multi-project.json`):

```json
{
  "version": "2.0",
  "globalDefaults": {
    "seed": 12345,
    "statusDistribution": {
      "toDo": 0.4,
      "inProgress": 0.3,
      "done": 0.3
    },
    "worklogs": {
      "probability": 0.5
    }
  },
  "projects": [
    {
      "projectKey": "BACKEND",
      "projectName": "Backend Services",
      "projectType": "company-managed",
      "issueCount": 150,
      "issueTypes": {
        "epic": {
          "count": 5,
          "childrenPerEpic": 10
        }
      },
      "data": {
        "assignees": ["backend-dev1@example.com", "backend-dev2@example.com"],
        "labels": ["api", "database", "performance"]
      }
    },
    {
      "projectKey": "FRONTEND",
      "projectName": "Frontend Application",
      "projectType": "team-managed",
      "issueCount": 100,
      "statusDistribution": {
        "toDo": 0.5,
        "inProgress": 0.4,
        "done": 0.1
      },
      "data": {
        "assignees": ["frontend-dev1@example.com", "frontend-dev2@example.com"],
        "labels": ["ui", "ux", "accessibility"]
      }
    },
    {
      "projectKey": "INFRA",
      "projectName": "Infrastructure",
      "projectType": "company-managed",
      "issueCount": 50,
      "data": {
        "assignees": ["devops1@example.com"],
        "labels": ["aws", "kubernetes", "monitoring"]
      }
    }
  ]
}
```

**Update Test Examples:**

```typescript
// examples/vitest-example/jira-api.test.ts
const { server, dataStore } = setupJiraMockServer({
  config: {
    version: '2.0',
    globalDefaults: {
      seed: 12345,
    },
    projects: [
      {
        projectKey: 'TEST1',
        issueCount: 10,
      },
      {
        projectKey: 'TEST2',
        issueCount: 5,
        statusDistribution: {
          toDo: 0,
          inProgress: 0,
          done: 1.0,
        },
      },
    ],
  },
  baseUrl: 'https://your-domain.atlassian.net',
});

// Test can now verify project-specific behavior
const test1Issues = await fetchIssues('TEST1');
const test2Issues = await fetchIssues('TEST2');
expect(test1Issues).toHaveLength(10);
expect(test2Issues).toHaveLength(5);
expect(test2Issues.every(issue => issue.fields.status.name === 'Done')).toBe(true);
```

## Migration Strategy

### Backward Compatibility

**Support Both Versions:**
- Core package validates and handles both v1 and v2 configs
- V1 configs continue to work without changes
- Config UI can import v1 configs and migrate them

**Migration Path:**

1. **Automatic Migration:**
   - Config UI detects v1 format on upload
   - Offers to migrate to v2
   - Shows preview of migrated config

2. **Manual Migration:**
   - Users can continue using v1 indefinitely
   - Documentation shows migration examples
   - CLI tool for batch migration (future enhancement)

### Deprecation Timeline

- **Phase 1 (Current):** Support both v1 and v2
- **Phase 2 (6 months):** Mark v1 as deprecated in docs
- **Phase 3 (12 months):** Consider removing v1 support in next major version

## Benefits of New Approach

1. **Flexibility:** Each project can have completely different configurations
2. **Realism:** Better simulates real Jira workspaces with multiple projects
3. **Testing:** Easier to test cross-project scenarios and project-specific behavior
4. **Maintainability:** Clearer separation between project-specific and global settings
5. **Scalability:** Can easily add/remove projects without affecting others
6. **Inheritance:** Global defaults reduce duplication while allowing overrides

## Open Questions

1. **Should we support nested inheritance?** (e.g., project groups)
2. **Should global defaults be required or optional?**
3. **How should we handle cross-project issue links?**
4. **Should we support project-level seeds or only global seed?**
5. **Should we validate total issue count across all projects?**

## Next Steps

See `IMPLEMENTATION_CHECKLIST.md` for detailed implementation tasks.
