# Per-Project Configuration Refactoring Plan

## Executive Summary

This document outlines the architectural changes required to eliminate the `globalDefaults` concept and make all configuration strictly per-project. The current system supports a 3-level configuration merge (built-in defaults → global defaults → project config). After this refactoring, it will use a simplified 2-level merge (built-in defaults → project config).

**Key Change:** Remove `globalDefaults` from the configuration schema entirely. All configuration must be specified at the project level.

## Problem Statement

The current architecture has these issues:

1. **Confusion about scope**: Configuration blocks (Status Distribution, Issue Types, Sprints, Versions, Worklogs) can be defined globally AND per-project, creating a complex hierarchy
2. **UI complexity**: Global settings UI is separated from project settings, making it unclear where to configure
3. **Semantic mismatch**: Issues are generated per-project, but their generation rules can come from global settings
4. **Unnecessary complexity**: The 3-level merge adds complexity without clear benefits for most users

## Current State

### Configuration Schema

```typescript
interface JiraMockConfig {
  version: '1.0';
  globalDefaults?: ProjectConfig; // ← WILL BE REMOVED
  projects: ProjectConfigWithKey[];
}
```

### Configuration Blocks (Currently Support Global + Per-Project)

1. **Status Distribution** (`statusDistribution`)
2. **Issue Types** (`issueTypes`) - Epic, Story, Task, Bug configuration
3. **Sprints** (`sprints`)
4. **Versions** (`versions`)
5. **Worklogs** (`worklogs`)
6. **Data** (`data`) - Assignees, priorities, labels

### Current Merge Hierarchy (3 Levels)

```
Built-in Defaults (CODE) → Global Defaults (USER) → Project Config (USER) → Final Config
```

**Example:**

```json
{
  "version": "1.0",
  "globalDefaults": {
    "statusDistribution": { "toDo": 0.5, "inProgress": 0.3, "done": 0.2 }
  },
  "projects": [
    {
      "projectKey": "TEST",
      "issueCount": 50
      // Inherits statusDistribution from globalDefaults
    }
  ]
}
```

### Current UI Structure

- **Global Defaults Section** - Contains Status, IssueTypes, Sprints, Versions, Worklogs, Data editors
- **Projects Manager** - Only basic project fields (key, name, count, type, seed)
- Configuration sections are separated by scope (global vs project)

## Target State

### Configuration Schema

```typescript
interface JiraMockConfig {
  version: '1.0';
  projects: ProjectConfigWithKey[]; // No globalDefaults
}

interface ProjectConfigWithKey {
  projectKey: string; // Required
  projectName?: string;
  projectType?: ProjectType;
  issueCount: number; // Required
  seed?: number;
  // All configuration blocks are per-project
  statusDistribution?: StatusDistribution;
  issueTypes?: IssueTypesConfig;
  sprints?: SprintsConfig;
  versions?: VersionsConfig;
  worklogs?: WorklogsConfig;
  data?: DataConfig;
  startIssueNumber?: number;
  startDate?: string;
  endDate?: string;
}
```

### New Merge Hierarchy (2 Levels)

```
Built-in Defaults (CODE) → Project Config (USER) → Final Config
```

**Example:**

```json
{
  "version": "1.0",
  "projects": [
    {
      "projectKey": "TEST",
      "issueCount": 50,
      "statusDistribution": { "toDo": 0.5, "inProgress": 0.3, "done": 0.2 }
      // Must specify all config per-project
    }
  ]
}
```

### New UI Structure

- **No Global Defaults Section** - Removed entirely
- **Projects Manager** - Expanded to include ALL configuration within each project card
- Each project card contains:
  - Basic fields (key, name, count, type, seed)
  - Status Distribution section
  - Issue Types section
  - Sprints section
  - Versions section
  - Worklogs section
  - Data section

## Implementation Breakdown

### Phase 1: Core Package (`packages/core`)

#### 1.1 Type Definitions (`src/config/types.ts`)

**Changes:**

- Remove `globalDefaults?: ProjectConfig` from `JiraMockConfig` interface
- Keep `ProjectConfig` and `ProjectConfigWithKey` as-is
- Update JSDoc comments to reflect per-project only scope

**Lines to modify:** ~186-193

#### 1.2 Schema Validation (`src/config/schema.ts`)

**Changes:**

- Remove `globalDefaults: ProjectConfigSchema` from `JiraMockConfigSchema`
- All validation rules remain the same for per-project config

**Lines to modify:** ~182-195

#### 1.3 Default Merging (`src/config/defaults.ts`)

**Critical Changes:**

```typescript
// BEFORE (3-level merge)
export function mergeProjectWithDefaults(
  projectConfig: ProjectConfigWithKey,
  globalDefaults?: ProjectConfig // ← Remove this parameter
): ProjectConfigWithKey {
  const builtInDefaults = getBuiltInDefaults();

  const baseConfig = globalDefaults
    ? deepMerge(builtInDefaults, globalDefaults) // ← Remove this logic
    : builtInDefaults;

  const merged = deepMerge(baseConfig, projectConfig);
  return merged;
}

// AFTER (2-level merge)
export function mergeProjectWithDefaults(
  projectConfig: ProjectConfigWithKey
): ProjectConfigWithKey {
  const builtInDefaults = getBuiltInDefaults();
  const merged = deepMerge(builtInDefaults, projectConfig);
  return merged;
}
```

**Lines to modify:** ~169-194

#### 1.4 Data Generation (`src/index.ts`)

**Changes:**

```typescript
// BEFORE
const globalSeed = validConfig.globalDefaults?.seed || Date.now();
const mergedProjectConfig = mergeProjectWithDefaults(
  projectConfig,
  validConfig.globalDefaults // ← Remove this argument
);

// AFTER
for (const projectConfig of validConfig.projects) {
  const mergedProjectConfig = mergeProjectWithDefaults(projectConfig);
  const projectSeed = mergedProjectConfig.seed || Date.now();
  // ... rest of generation
}
```

**Lines to modify:** ~63, ~129-132

#### 1.5 Validators (`src/config/validator.ts`)

**Changes:**

- Remove any validation specific to `globalDefaults`
- Update error messages to reflect per-project validation only

**Lines to check:** Full file review for `globalDefaults` references

### Phase 2: Config UI (`packages/config-ui`)

#### 2.1 Main Editor (`src/components/ConfigEditor/index.tsx`)

**Major Changes:**

**REMOVE these sections entirely:**

- Lines 155-167: Global Defaults header card
- Lines 169-200: Global seed input
- Lines 203-218: All global configuration sections (Status, IssueTypes, Sprints, Versions, Worklogs, Data)

**KEEP:**

- Action buttons
- Projects Manager
- Preview section

**New structure:**

```tsx
export function ConfigEditor() {
  return (
    <div>
      <ActionButtons />
      <ProjectsManager /> {/* Now contains ALL config */}
      <PreviewSection />
    </div>
  );
}
```

#### 2.2 Projects Manager (`src/components/ConfigEditor/ProjectsManager.tsx`)

**Major Refactoring Required:**

**Current:** Basic project fields only
**New:** Complete project configuration within expandable cards

**Implementation approach:**

1. Add tab/accordion system within each project card
2. Import all section components
3. Pass `projectIndex` to each section
4. Sections update `config.projects[projectIndex]` instead of `config.globalDefaults`

**New structure:**

```tsx
<ProjectCard>
  <ProjectHeader />
  <ProjectContent>
    <BasicFields />
    <Tabs>
      <Tab label="Status">
        <StatusSection projectIndex={index} config={config} onChange={onChange} />
      </Tab>
      <Tab label="Issue Types">
        <IssueTypesSection projectIndex={index} config={config} onChange={onChange} />
      </Tab>
      <Tab label="Sprints">
        <SprintsSection projectIndex={index} config={config} onChange={onChange} />
      </Tab>
      <Tab label="Versions">
        <VersionsSection projectIndex={index} config={config} onChange={onChange} />
      </Tab>
      <Tab label="Worklogs">
        <WorklogsSection projectIndex={index} config={config} onChange={onChange} />
      </Tab>
      <Tab label="Data">
        <DataSection projectIndex={index} config={config} onChange={onChange} />
      </Tab>
    </Tabs>
  </ProjectContent>
</ProjectCard>
```

**Add UI Components:**

- Import Tabs component from shadcn/ui
- Or use Accordion for collapsible sections
- Add visual indicators for fields using built-in defaults

#### 2.3 Configuration Sections

**All 6 section components must be updated:**

1. `StatusSection.tsx`
2. `IssueTypesSection.tsx`
3. `SprintsSection.tsx`
4. `VersionsSection.tsx`
5. `WorklogsSection.tsx`
6. `DataSection.tsx`

**Changes for each:**

```typescript
// BEFORE
interface SectionProps {
  config: JiraMockConfig;
  onChange: (config: JiraMockConfig) => void;
}

// Section updates config.globalDefaults
const updateValue = (newValue) => {
  onChange({
    ...config,
    globalDefaults: {
      ...config.globalDefaults,
      statusDistribution: newValue,
    },
  });
};

// AFTER
interface SectionProps {
  config: JiraMockConfig;
  onChange: (config: JiraMockConfig) => void;
  projectIndex: number; // ← NEW: Which project to update
}

// Section updates config.projects[projectIndex]
const updateValue = (newValue) => {
  const newProjects = [...config.projects];
  newProjects[projectIndex] = {
    ...newProjects[projectIndex],
    statusDistribution: newValue,
  };
  onChange({
    ...config,
    projects: newProjects,
  });
};
```

### Phase 3: Examples (`examples/`)

All example config files must be updated to remove `globalDefaults` and move settings to each project.

#### 3.1 Example Config Files

**Files to update:**

1. `examples/configs/multi-project.json`
2. `examples/configs/large-project.json`
3. `examples/configs/full-featured.json`
4. `examples/configs/small-project.json`
5. `examples/configs/team-managed.json`
6. `examples/configs/minimal.json`
7. `examples/nextjs-openapi-tester/jira-mock-config.json`

**Transformation pattern:**

```json
// BEFORE
{
  "version": "1.0",
  "globalDefaults": {
    "seed": 12345,
    "statusDistribution": { "toDo": 0.4, "inProgress": 0.3, "done": 0.3 },
    "worklogs": { "probability": 0.5 }
  },
  "projects": [
    {
      "projectKey": "PROJ1",
      "issueCount": 50
    },
    {
      "projectKey": "PROJ2",
      "issueCount": 100,
      "statusDistribution": { "toDo": 0.5, "inProgress": 0.3, "done": 0.2 }
    }
  ]
}

// AFTER
{
  "version": "1.0",
  "projects": [
    {
      "projectKey": "PROJ1",
      "issueCount": 50,
      "seed": 12345,
      "statusDistribution": { "toDo": 0.4, "inProgress": 0.3, "done": 0.3 },
      "worklogs": { "probability": 0.5 }
    },
    {
      "projectKey": "PROJ2",
      "issueCount": 100,
      "seed": 12345,
      "statusDistribution": { "toDo": 0.5, "inProgress": 0.3, "done": 0.2 },
      "worklogs": { "probability": 0.5 }
    }
  ]
}
```

Note: Settings must be duplicated across projects if they should be the same.

#### 3.2 Documentation

**File to update:**

- `examples/configs/README.md`

**Changes:**

- Remove references to `globalDefaults`
- Explain per-project configuration
- Add examples showing how to configure each project
- Document that built-in defaults apply when project config is omitted

### Phase 4: Tests

#### 4.1 Core Package Tests

**Files to update:**

1. **`packages/core/tests/data-generation.test.ts`**
   - Remove all tests using `globalDefaults`
   - Add tests verifying built-in defaults apply
   - Add tests verifying per-project config works
   - Verify two projects with different configs generate correctly

2. **`packages/core/tests/config.test.ts`**
   - Update tests to reject configs with `globalDefaults`
   - Test per-project validation

3. **Generator tests** (`packages/core/tests/generators/*.test.ts`)
   - Update any tests that create configs with `globalDefaults`

**Example new tests:**

```typescript
it('should use built-in defaults when project config is minimal', () => {
  const config = {
    version: '1.0',
    projects: [{ projectKey: 'TEST', issueCount: 10 }],
  };
  const { dataStore } = generateMockData(config);
  const issues = dataStore.getAllIssues();
  // Verify DEFAULT_STATUS_DISTRIBUTION is applied
});

it('should use per-project config when specified', () => {
  const config = {
    version: '1.0',
    projects: [
      {
        projectKey: 'TEST',
        issueCount: 10,
        statusDistribution: { toDo: 1.0, inProgress: 0, done: 0 },
      },
    ],
  };
  const { dataStore } = generateMockData(config);
  const issues = dataStore.getAllIssues();
  // Verify all issues are "To Do"
});

it('should allow different config per project', () => {
  const config = {
    version: '1.0',
    projects: [
      {
        projectKey: 'PROJ1',
        issueCount: 10,
        statusDistribution: { toDo: 1.0, inProgress: 0, done: 0 },
      },
      {
        projectKey: 'PROJ2',
        issueCount: 10,
        statusDistribution: { toDo: 0, inProgress: 0, done: 1.0 },
      },
    ],
  };
  const { dataStore } = generateMockData(config);
  const proj1Issues = dataStore.getAllIssues().filter((i) => i.fields.project.key === 'PROJ1');
  const proj2Issues = dataStore.getAllIssues().filter((i) => i.fields.project.key === 'PROJ2');
  // Verify PROJ1 issues are all "To Do"
  // Verify PROJ2 issues are all "Done"
});
```

#### 4.2 Config UI Tests

**Files to update:**

1. **`packages/config-ui/src/components/ConfigEditor/__tests__/ConfigEditor.integration.test.tsx`**
   - Remove tests for global defaults sections
   - Add tests for per-project configuration
   - Test expanding project and editing sections

2. **`packages/config-ui/src/components/ConfigEditor/__tests__/ProjectsManager.test.tsx`**
   - Add tests for tabs/sections within projects
   - Test updating per-project config
   - Test that changes update correct project

3. **Section tests** (`__tests__/StatusSection.test.tsx`, etc.)
   - Update to pass `projectIndex` prop
   - Verify updates go to correct project

4. **`packages/config-ui/src/components/ConfigEditor/__tests__/DataSection.test.tsx`**
5. **`packages/config-ui/src/components/ConfigEditor/__tests__/IssueTypesSection.test.tsx`**

#### 4.3 Integration Tests

**Files to update:**

1. **`packages/msw-integration/tests/integration.test.ts`**
   - Update all test configs to remove `globalDefaults`
   - Move settings to project level

2. **`packages/msw-integration/tests/openapi-validation.test.ts`**
   - Update test configs

3. **`examples/vitest-example/jira-api.test.ts`**
   - Update test configs

## Data Flow Comparison

### Before (3-Level Merge)

```
User creates config:
{
  globalDefaults: { statusDistribution: { toDo: 0.5, inProgress: 0.3, done: 0.2 } },
  projects: [{ projectKey: "TEST", issueCount: 10 }]
}
         ↓
mergeProjectWithDefaults(project, globalDefaults)
         ↓
Built-in Defaults:     { toDo: 0.4, inProgress: 0.3, done: 0.3 }
+ Global Defaults:     { toDo: 0.5, inProgress: 0.3, done: 0.2 }
+ Project Config:      { }
         ↓
Final Config:          { toDo: 0.5, inProgress: 0.3, done: 0.2 }
```

### After (2-Level Merge)

```
User creates config:
{
  projects: [{
    projectKey: "TEST",
    issueCount: 10,
    statusDistribution: { toDo: 0.5, inProgress: 0.3, done: 0.2 }
  }]
}
         ↓
mergeProjectWithDefaults(project)
         ↓
Built-in Defaults:     { toDo: 0.4, inProgress: 0.3, done: 0.3 }
+ Project Config:      { toDo: 0.5, inProgress: 0.3, done: 0.2 }
         ↓
Final Config:          { toDo: 0.5, inProgress: 0.3, done: 0.2 }
```

## UX Considerations

### Benefits

1. **Simplicity**: One less layer of configuration to understand
2. **Clarity**: All project settings in one place
3. **Self-contained**: Each project is independent
4. **No ambiguity**: No confusion about global vs project scope

### Challenges

1. **Duplication**: Must repeat config for similar projects
2. **Verbosity**: Config files become longer
3. **UI complexity**: More content per project card
4. **Initial setup**: More work to configure first project

### Mitigation Strategies

1. **UI Features:**
   - "Duplicate Project" button to clone entire config
   - Template selector for common project types
   - Collapsible sections (tabs/accordions) for manageable UI

2. **Documentation:**
   - Clear examples of per-project configs
   - Explanation of built-in defaults
   - Migration guide (even though not supporting migration)

3. **Editor UX:**
   - Show which fields are using built-in defaults (visual indicator)
   - Allow clearing fields to use defaults
   - Provide tooltips explaining each setting

## File Modification Summary

### Core Package (6 files)

- `packages/core/src/config/types.ts` - Remove `globalDefaults` from interface
- `packages/core/src/config/schema.ts` - Remove from schema
- `packages/core/src/config/defaults.ts` - Remove parameter from merge function
- `packages/core/src/config/validator.ts` - Remove global validation
- `packages/core/src/index.ts` - Remove global defaults usage
- `packages/core/src/types/generator.types.ts` - Update context types

### Config UI (9 files)

- `packages/config-ui/src/components/ConfigEditor/index.tsx` - Remove global sections
- `packages/config-ui/src/components/ConfigEditor/ProjectsManager.tsx` - Add config sections
- `packages/config-ui/src/components/ConfigEditor/StatusSection.tsx` - Add projectIndex
- `packages/config-ui/src/components/ConfigEditor/IssueTypesSection.tsx` - Add projectIndex
- `packages/config-ui/src/components/ConfigEditor/SprintsSection.tsx` - Add projectIndex
- `packages/config-ui/src/components/ConfigEditor/VersionsSection.tsx` - Add projectIndex
- `packages/config-ui/src/components/ConfigEditor/WorklogsSection.tsx` - Add projectIndex
- `packages/config-ui/src/components/ConfigEditor/DataSection.tsx` - Add projectIndex
- (Potentially) Add `packages/config-ui/src/components/ui/tabs.tsx` if not exists

### Tests (10+ files)

- `packages/core/tests/data-generation.test.ts`
- `packages/core/tests/config.test.ts`
- `packages/core/tests/generators/*.test.ts` (multiple files)
- `packages/config-ui/src/components/ConfigEditor/__tests__/ConfigEditor.integration.test.tsx`
- `packages/config-ui/src/components/ConfigEditor/__tests__/ProjectsManager.test.tsx`
- `packages/config-ui/src/components/ConfigEditor/__tests__/DataSection.test.tsx`
- `packages/config-ui/src/components/ConfigEditor/__tests__/IssueTypesSection.test.tsx`
- `packages/msw-integration/tests/integration.test.ts`
- `packages/msw-integration/tests/openapi-validation.test.ts`
- `examples/vitest-example/jira-api.test.ts`

### Examples (7 files)

- `examples/configs/multi-project.json`
- `examples/configs/large-project.json`
- `examples/configs/full-featured.json`
- `examples/configs/small-project.json`
- `examples/configs/team-managed.json`
- `examples/configs/minimal.json`
- `examples/nextjs-openapi-tester/jira-mock-config.json`

### Documentation (1 file)

- `examples/configs/README.md`

**Total: ~33 files**

## Success Criteria

✅ **Configuration:**

- Config with `globalDefaults` is rejected by schema validation
- Config with only per-project settings is accepted
- Built-in defaults apply when project config is empty
- Per-project config overrides built-in defaults correctly

✅ **Code Quality:**

- No references to `globalDefaults` anywhere in codebase
- All merge logic uses 2-level merge
- All tests pass

✅ **UI:**

- No global defaults section in config editor
- All configuration sections appear within project cards
- Can add/edit/remove projects with full configuration
- UI clearly shows which settings use built-in defaults

✅ **Examples:**

- All example configs work without `globalDefaults`
- Generated data respects per-project settings
- Multi-project examples show different configs per project

✅ **Documentation:**

- README and examples explain per-project approach
- No references to `globalDefaults` in docs

## Notes

- **No backward compatibility**: Old configs with `globalDefaults` will fail validation
- **No version bump**: Keeping version at "1.0"
- **No migration path**: Users must manually update configs
