# Per-Project Configuration Refactoring Checklist

This checklist provides a step-by-step task list for removing `globalDefaults` and making all configuration per-project only.

## Phase 1: Core Package (`packages/core`)

### 1.1 Type Definitions

**File:** `packages/core/src/config/types.ts`

- [ ] Remove `globalDefaults?: ProjectConfig` from `JiraMockConfig` interface (line ~190)
- [ ] Update JSDoc comment on `JiraMockConfig` to reflect per-project only
- [ ] Update JSDoc on `ProjectConfig` to clarify it represents per-project configuration
- [ ] Verify `ProjectConfigWithKey` still has all needed fields
- [ ] Run TypeScript compiler to check for type errors

**Verification:**

```bash
cd packages/core
npm run build
```

### 1.2 Schema Validation

**File:** `packages/core/src/config/schema.ts`

- [ ] Remove `globalDefaults: ProjectConfigSchema` from `JiraMockConfigSchema` (line ~184)
- [ ] Verify schema still validates `projects` array correctly
- [ ] Verify refinement functions still work (unique keys, date validation, etc.)
- [ ] Run schema validation tests

**Verification:**

```bash
npm test -- config.test
```

### 1.3 Default Merging

**File:** `packages/core/src/config/defaults.ts`

- [ ] Update `mergeProjectWithDefaults()` function signature:
  - [ ] Remove `globalDefaults?: ProjectConfig` parameter
  - [ ] Keep only `projectConfig: ProjectConfigWithKey` parameter
- [ ] Update function body:
  - [ ] Remove `globalDefaults` merge logic
  - [ ] Keep only 2-level merge: `builtInDefaults` + `projectConfig`
- [ ] Update JSDoc comments to explain 2-level merge
- [ ] Verify `getConfigValue()` function no longer needs `globalDefaults` parameter
- [ ] Remove `globalDefaults` parameter from `getConfigValue()` if present

**Code changes:**

```typescript
// Update function signature (line ~170)
export function mergeProjectWithDefaults(
  projectConfig: ProjectConfigWithKey
): ProjectConfigWithKey {
  const builtInDefaults = getBuiltInDefaults();
  const merged = deepMerge(builtInDefaults, projectConfig);
  return {
    ...merged,
    projectKey: projectConfig.projectKey,
    issueCount: projectConfig.issueCount,
    projectName: projectConfig.projectName,
    projectType: projectConfig.projectType || 'company-managed',
  };
}

// Update getConfigValue() signature (line ~213)
export function getConfigValue<T>(
  projectConfig: ProjectConfigWithKey,
  path: string
): T | undefined {
  const merged = mergeProjectWithDefaults(projectConfig);
  // ... rest of implementation
}
```

**Verification:**

```bash
npm run build
npm test -- defaults
```

### 1.4 Data Generation

**File:** `packages/core/src/index.ts`

- [ ] Remove global seed logic (line ~63):
  - [ ] Remove `const globalSeed = validConfig.globalDefaults?.seed || Date.now();`
  - [ ] Seed is now per-project only
- [ ] Update project loop (line ~125-143):
  - [ ] Remove second argument to `mergeProjectWithDefaults()`
  - [ ] Change from: `mergeProjectWithDefaults(projectConfig, validConfig.globalDefaults)`
  - [ ] Change to: `mergeProjectWithDefaults(projectConfig)`
- [ ] Update project context creation:
  - [ ] Remove global seed reference
  - [ ] Use `projectSeed` from merged config only
- [ ] Verify no other references to `validConfig.globalDefaults`

**Code changes:**

```typescript
// Remove (line ~63):
// const globalSeed = validConfig.globalDefaults?.seed || Date.now();

// Update (line ~129-132):
const mergedProjectConfig = mergeProjectWithDefaults(projectConfig);

// Update (line ~135-143):
const projectSeed = mergedProjectConfig.seed || Date.now();
const projectFaker = createFaker(projectSeed);
const projectContext: GenerationContext = {
  ...context,
  faker: projectFaker,
  seed: projectSeed,
  currentProject: mergedProjectConfig,
  projectIndex,
};
```

**Verification:**

```bash
npm run build
npm test -- data-generation
```

### 1.5 Validators

**File:** `packages/core/src/config/validator.ts`

- [ ] Search for all references to `globalDefaults`
- [ ] Remove any special validation for `globalDefaults`
- [ ] Update error messages to reflect per-project validation
- [ ] Verify validation still works for per-project config
- [ ] Check warning generation doesn't reference `globalDefaults`

**Verification:**

```bash
grep -n "globalDefaults" packages/core/src/config/validator.ts
npm test -- validator
```

### 1.6 Generator Types

**File:** `packages/core/src/types/generator.types.ts`

- [ ] Check if `GenerationContext` references `globalDefaults`
- [ ] Verify `currentProject` field is correctly typed as `ProjectConfigWithKey`
- [ ] Update comments if needed

**Verification:**

```bash
npm run build
```

## Phase 2: Config UI (`packages/config-ui`)

### 2.1 Main Editor

**File:** `packages/config-ui/src/components/ConfigEditor/index.tsx`

- [ ] **Remove Global Defaults Header** (lines ~155-167):
  - [ ] Delete entire `<Card>` with "Global Defaults" title
  - [ ] Delete Globe icon import if no longer used
- [ ] **Remove Global Seed Input** (lines ~169-200):
  - [ ] Delete entire seed input card
- [ ] **Remove Global Configuration Sections** (lines ~202-218):
  - [ ] Delete `<StatusSection config={config} onChange={setConfig} />`
  - [ ] Delete `<IssueTypesSection config={config} onChange={setConfig} />`
  - [ ] Delete `<SprintsSection config={config} onChange={setConfig} />`
  - [ ] Delete `<VersionsSection config={config} onChange={setConfig} />`
  - [ ] Delete `<WorklogsSection config={config} onChange={setConfig} />`
  - [ ] Delete `<DataSection config={config} onChange={setConfig} />`
- [ ] Verify new structure is:
  - [ ] Action buttons card
  - [ ] Projects Manager card (only)
  - [ ] Preview Section
- [ ] Update default config state to not include `globalDefaults`:
  ```typescript
  const [config, setConfig] = useState<JiraMockConfig>({
    version: '1.0',
    projects: [
      {
        projectKey: 'PROJ',
        issueCount: 50,
      },
    ],
  });
  ```

**Verification:**

```bash
cd packages/config-ui
npm run build
npm run dev  # Visual check
```

### 2.2 Projects Manager

**File:** `packages/config-ui/src/components/ConfigEditor/ProjectsManager.tsx`

This is the MOST COMPLEX change. The ProjectsManager must now contain all configuration sections.

- [ ] **Add imports for all section components:**

  ```typescript
  import { StatusSection } from './StatusSection';
  import { IssueTypesSection } from './IssueTypesSection';
  import { SprintsSection } from './SprintsSection';
  import { VersionsSection } from './VersionsSection';
  import { WorklogsSection } from './WorklogsSection';
  import { DataSection } from './DataSection';
  ```

- [ ] **Add Tabs component import (or Accordion):**

  ```typescript
  import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
  ```

- [ ] **If Tabs doesn't exist, create it:**
  - [ ] Add `packages/config-ui/src/components/ui/tabs.tsx` from shadcn/ui
  - [ ] Run: `npx shadcn@latest add tabs`

- [ ] **Update project card expanded content** (after line ~244):
  - [ ] Keep existing basic fields grid
  - [ ] Add separator/divider
  - [ ] Add Tabs component with 6 tabs:
    - Tab 1: "Status Distribution" → `<StatusSection>`
    - Tab 2: "Issue Types" → `<IssueTypesSection>`
    - Tab 3: "Sprints" → `<SprintsSection>`
    - Tab 4: "Versions" → `<VersionsSection>`
    - Tab 5: "Worklogs" → `<WorklogsSection>`
    - Tab 6: "Data" → `<DataSection>`

- [ ] **Update the helper text** (line ~245-249):
  - [ ] Change from "configure in sections below" to "configure in tabs above"
  - [ ] Or remove entirely since config is now in same card

**New structure:**

```tsx
{
  expandedProjects.has(index) && (
    <CardContent className="space-y-4 pt-0">
      {/* Basic Fields Grid */}
      <div className="grid grid-cols-2 gap-4">{/* ... existing fields ... */}</div>

      {/* Configuration Sections */}
      <div className="pt-4 border-t">
        <Tabs defaultValue="status" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="status">Status</TabsTrigger>
            <TabsTrigger value="types">Types</TabsTrigger>
            <TabsTrigger value="sprints">Sprints</TabsTrigger>
            <TabsTrigger value="versions">Versions</TabsTrigger>
            <TabsTrigger value="worklogs">Worklogs</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
          </TabsList>

          <TabsContent value="status">
            <StatusSection config={config} onChange={onChange} projectIndex={index} />
          </TabsContent>

          <TabsContent value="types">
            <IssueTypesSection config={config} onChange={onChange} projectIndex={index} />
          </TabsContent>

          <TabsContent value="sprints">
            <SprintsSection config={config} onChange={onChange} projectIndex={index} />
          </TabsContent>

          <TabsContent value="versions">
            <VersionsSection config={config} onChange={onChange} projectIndex={index} />
          </TabsContent>

          <TabsContent value="worklogs">
            <WorklogsSection config={config} onChange={onChange} projectIndex={index} />
          </TabsContent>

          <TabsContent value="data">
            <DataSection config={config} onChange={onChange} projectIndex={index} />
          </TabsContent>
        </Tabs>
      </div>
    </CardContent>
  );
}
```

**Verification:**

```bash
npm run build
npm run dev  # Visual check
```

### 2.3 Configuration Sections

All 6 section components must be updated with the same pattern.

#### StatusSection

**File:** `packages/config-ui/src/components/ConfigEditor/StatusSection.tsx`

- [ ] **Update interface:**

  ```typescript
  interface StatusSectionProps {
    config: JiraMockConfig;
    onChange: (config: JiraMockConfig) => void;
    projectIndex: number; // NEW
  }
  ```

- [ ] **Update component signature:**

  ```typescript
  export function StatusSection({ config, onChange, projectIndex }: StatusSectionProps);
  ```

- [ ] **Update value source:**

  ```typescript
  // OLD: const currentValue = config.globalDefaults?.statusDistribution
  // NEW:
  const currentValue = config.projects[projectIndex]?.statusDistribution || {};
  ```

- [ ] **Update onChange handler:**

  ```typescript
  const updateValue = (field: keyof StatusDistribution, value: number) => {
    const newProjects = [...config.projects];
    newProjects[projectIndex] = {
      ...newProjects[projectIndex],
      statusDistribution: {
        ...newProjects[projectIndex].statusDistribution,
        [field]: value,
      },
    };
    onChange({
      ...config,
      projects: newProjects,
    });
  };
  ```

- [ ] Remove card wrapper if sections are now inside tabs
- [ ] Keep only the form fields

**Verification:**

```bash
npm run build
npm test -- StatusSection
```

#### IssueTypesSection

**File:** `packages/config-ui/src/components/ConfigEditor/IssueTypesSection.tsx`

- [ ] Add `projectIndex: number` to props interface
- [ ] Update value source: `config.projects[projectIndex]?.issueTypes`
- [ ] Update onChange to modify `config.projects[projectIndex].issueTypes`
- [ ] Same pattern as StatusSection

**Verification:**

```bash
npm run build
npm test -- IssueTypesSection
```

#### SprintsSection

**File:** `packages/config-ui/src/components/ConfigEditor/SprintsSection.tsx`

- [ ] Add `projectIndex: number` to props interface
- [ ] Update value source: `config.projects[projectIndex]?.sprints`
- [ ] Update onChange to modify `config.projects[projectIndex].sprints`
- [ ] Same pattern as StatusSection

**Verification:**

```bash
npm run build
```

#### VersionsSection

**File:** `packages/config-ui/src/components/ConfigEditor/VersionsSection.tsx`

- [ ] Add `projectIndex: number` to props interface
- [ ] Update value source: `config.projects[projectIndex]?.versions`
- [ ] Update onChange to modify `config.projects[projectIndex].versions`
- [ ] Same pattern as StatusSection

**Verification:**

```bash
npm run build
```

#### WorklogsSection

**File:** `packages/config-ui/src/components/ConfigEditor/WorklogsSection.tsx`

- [ ] Add `projectIndex: number` to props interface
- [ ] Update value source: `config.projects[projectIndex]?.worklogs`
- [ ] Update onChange to modify `config.projects[projectIndex].worklogs`
- [ ] Same pattern as StatusSection

**Verification:**

```bash
npm run build
```

#### DataSection

**File:** `packages/config-ui/src/components/ConfigEditor/DataSection.tsx`

- [ ] Add `projectIndex: number` to props interface
- [ ] Update value source: `config.projects[projectIndex]?.data`
- [ ] Update onChange to modify `config.projects[projectIndex].data`
- [ ] Same pattern as StatusSection

**Verification:**

```bash
npm run build
npm test -- DataSection
```

## Phase 3: Examples (`examples/`)

### 3.1 Example Config Files

Update each config file to remove `globalDefaults` and move settings to project level.

#### multi-project.json

**File:** `examples/configs/multi-project.json`

- [ ] Read current config
- [ ] Identify all `globalDefaults` settings
- [ ] For each project without explicit settings:
  - [ ] Add settings from `globalDefaults`
  - [ ] Duplicate if needed for consistency
- [ ] Remove `globalDefaults` object entirely
- [ ] Verify all projects have required fields
- [ ] Test config validates

**Verification:**

```bash
cd examples/configs
node -e "console.log(JSON.parse(require('fs').readFileSync('multi-project.json', 'utf8')))"
```

#### large-project.json

**File:** `examples/configs/large-project.json`

- [ ] Remove `globalDefaults`
- [ ] Move all global settings to the single project
- [ ] Verify config validates

#### full-featured.json

**File:** `examples/configs/full-featured.json`

- [ ] Remove `globalDefaults`
- [ ] Distribute settings to all projects
- [ ] Verify config validates

#### small-project.json

**File:** `examples/configs/small-project.json`

- [ ] Remove `globalDefaults`
- [ ] Move settings to project
- [ ] Verify config validates

#### team-managed.json

**File:** `examples/configs/team-managed.json`

- [ ] Remove `globalDefaults`
- [ ] Move settings to project
- [ ] Verify config validates

#### minimal.json

**File:** `examples/configs/minimal.json`

- [ ] Remove `globalDefaults` if present
- [ ] Keep project config minimal (rely on built-in defaults)
- [ ] Verify config validates

#### nextjs-openapi-tester config

**File:** `examples/nextjs-openapi-tester/jira-mock-config.json`

- [ ] Remove `globalDefaults`
- [ ] Distribute settings to all projects
- [ ] Verify app runs correctly with new config

**Verification:**

```bash
cd examples/nextjs-openapi-tester
npm run dev
# Check console for errors
# Verify issues are generated correctly
```

### 3.2 Documentation

**File:** `examples/configs/README.md`

- [ ] Remove all mentions of `globalDefaults`
- [ ] Update examples to show per-project configuration only
- [ ] Add section explaining built-in defaults
- [ ] Add examples showing:
  - [ ] Minimal config (using built-in defaults)
  - [ ] Fully configured project
  - [ ] Multiple projects with different configs
- [ ] Update "Configuration Fields" section if needed

## Phase 4: Tests

### 4.1 Core Package Tests

#### data-generation.test.ts

**File:** `packages/core/tests/data-generation.test.ts`

- [ ] Find all tests using `globalDefaults`
- [ ] Remove or update tests that validate global defaults merging
- [ ] **Add new test:** "should use built-in defaults when project config is minimal"
  ```typescript
  it('should use built-in defaults when project config is minimal', () => {
    const config: JiraMockConfig = {
      version: '1.0',
      projects: [{ projectKey: 'TEST', issueCount: 10 }],
    };
    const { dataStore } = generateMockData(config);
    // Verify default status distribution is applied
  });
  ```
- [ ] **Add new test:** "should use per-project config when specified"
  ```typescript
  it('should use per-project config when specified', () => {
    const config: JiraMockConfig = {
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
    // Verify all issues are "To Do" status
  });
  ```
- [ ] **Add new test:** "should allow different config per project"
  ```typescript
  it('should support different configurations per project', () => {
    const config: JiraMockConfig = {
      version: '1.0',
      projects: [
        {
          projectKey: 'PROJ1',
          issueCount: 5,
          statusDistribution: { toDo: 1.0, inProgress: 0, done: 0 },
        },
        {
          projectKey: 'PROJ2',
          issueCount: 5,
          statusDistribution: { toDo: 0, inProgress: 0, done: 1.0 },
        },
      ],
    };
    const { dataStore } = generateMockData(config);
    const proj1Issues = dataStore.getAllIssues().filter((i) => i.fields.project.key === 'PROJ1');
    const proj2Issues = dataStore.getAllIssues().filter((i) => i.fields.project.key === 'PROJ2');
    // Verify PROJ1 issues are "To Do"
    // Verify PROJ2 issues are "Done"
  });
  ```
- [ ] Update existing test "should generate correct number of issues per project" (line ~52):
  - [ ] Remove `globalDefaults` from config
  - [ ] Ensure test still passes

**Verification:**

```bash
npm test -- data-generation
```

#### config.test.ts

**File:** `packages/core/tests/config.test.ts`

- [ ] **Add test:** "should reject config with globalDefaults"
  ```typescript
  it('should reject configuration with globalDefaults field', () => {
    const config = {
      version: '1.0',
      globalDefaults: { seed: 123 },
      projects: [{ projectKey: 'TEST', issueCount: 10 }],
    };
    expect(() => validateConfig(config)).toThrow();
  });
  ```
- [ ] **Add test:** "should accept config with per-project settings only"
  ```typescript
  it('should accept configuration with per-project settings', () => {
    const config = {
      version: '1.0',
      projects: [
        {
          projectKey: 'TEST',
          issueCount: 10,
          seed: 123,
          statusDistribution: { toDo: 0.5, inProgress: 0.3, done: 0.2 },
        },
      ],
    };
    expect(() => validateConfig(config)).not.toThrow();
  });
  ```
- [ ] Update any existing tests that use `globalDefaults`

**Verification:**

```bash
npm test -- config
```

#### Generator tests

**Files:** `packages/core/tests/generators/*.test.ts`

- [ ] Search all generator tests for `globalDefaults`
- [ ] Update test configs to remove `globalDefaults`
- [ ] Verify all generator tests still pass

**Verification:**

```bash
grep -r "globalDefaults" packages/core/tests/generators/
npm test -- generators
```

### 4.2 Config UI Tests

#### ConfigEditor.integration.test.tsx

**File:** `packages/config-ui/src/components/ConfigEditor/__tests__/ConfigEditor.integration.test.tsx`

- [ ] Remove tests for global defaults section
- [ ] **Add test:** "should allow editing per-project configuration"
- [ ] **Add test:** "should show configuration sections within project card"
- [ ] **Add test:** "should update correct project when editing"
- [ ] Verify all remaining tests pass

**Verification:**

```bash
cd packages/config-ui
npm test -- ConfigEditor.integration
```

#### ProjectsManager.test.tsx

**File:** `packages/config-ui/src/components/ConfigEditor/__tests__/ProjectsManager.test.tsx`

- [ ] **Add test:** "should render configuration tabs for expanded project"
- [ ] **Add test:** "should update project configuration via sections"
- [ ] **Add test:** "should not affect other projects when editing one"
- [ ] Verify existing tests still pass

**Verification:**

```bash
npm test -- ProjectsManager
```

#### Section tests

**Files:**

- `__tests__/StatusSection.test.tsx`
- `__tests__/DataSection.test.tsx`
- `__tests__/IssueTypesSection.test.tsx`

- [ ] Update each test to pass `projectIndex` prop
- [ ] Update tests to verify changes go to correct project
- [ ] **Add test in each:** "should update correct project in config"
  ```typescript
  it('should update the correct project', () => {
    const config = {
      version: '1.0',
      projects: [
        { projectKey: 'PROJ1', issueCount: 10 },
        { projectKey: 'PROJ2', issueCount: 20 },
      ],
    };
    const onChange = vi.fn();

    render(
      <StatusSection config={config} onChange={onChange} projectIndex={1} />
    );

    // Make change
    // Verify onChange called with PROJ2 updated, not PROJ1
  });
  ```

**Verification:**

```bash
npm test -- StatusSection
npm test -- DataSection
npm test -- IssueTypesSection
```

### 4.3 Integration Tests

#### msw-integration tests

**File:** `packages/msw-integration/tests/integration.test.ts`

- [ ] Find all test configs with `globalDefaults`
- [ ] Move settings to project level
- [ ] Verify tests still pass

**File:** `packages/msw-integration/tests/openapi-validation.test.ts`

- [ ] Find all test configs with `globalDefaults`
- [ ] Move settings to project level
- [ ] Verify tests still pass

**Verification:**

```bash
cd packages/msw-integration
npm test
```

#### vitest-example tests

**File:** `examples/vitest-example/jira-api.test.ts`

- [ ] Update test configs to remove `globalDefaults`
- [ ] Move settings to project level
- [ ] Verify tests still pass

**Verification:**

```bash
cd examples/vitest-example
npm test
```

## Phase 5: Final Verification

### 5.1 Code Search

- [ ] **Search entire codebase for `globalDefaults`:**
  ```bash
  grep -r "globalDefaults" --exclude-dir=node_modules --exclude-dir=dist --exclude="*.md"
  ```
- [ ] Verify only markdown docs (this plan) contain references
- [ ] No code files should reference `globalDefaults`

### 5.2 Build All Packages

- [ ] **Build core package:**
  ```bash
  cd packages/core
  npm run build
  ```
- [ ] **Build config-ui:**
  ```bash
  cd packages/config-ui
  npm run build
  ```
- [ ] **Build msw-integration:**
  ```bash
  cd packages/msw-integration
  npm run build
  ```

### 5.3 Run All Tests

- [ ] **Core tests:**
  ```bash
  cd packages/core
  npm test
  ```
- [ ] **Config UI tests:**
  ```bash
  cd packages/config-ui
  npm test
  ```
- [ ] **MSW integration tests:**
  ```bash
  cd packages/msw-integration
  npm test
  ```
- [ ] **Example tests:**
  ```bash
  cd examples/vitest-example
  npm test
  ```

### 5.4 Visual Testing

- [ ] **Start config-ui:**
  ```bash
  cd packages/config-ui
  npm run dev
  ```
- [ ] Verify no global defaults section visible
- [ ] Add a new project
- [ ] Expand project and verify tabs are present
- [ ] Edit each configuration section
- [ ] Verify changes save correctly
- [ ] Download config and verify structure is correct (no `globalDefaults`)
- [ ] Upload a config with per-project settings
- [ ] Verify it loads correctly

- [ ] **Start nextjs-openapi-tester:**
  ```bash
  cd examples/nextjs-openapi-tester
  npm run dev
  ```
- [ ] Verify it starts without errors
- [ ] Check console for configuration display
- [ ] Verify issue counts are correct
- [ ] Test API endpoints via Swagger UI

### 5.5 Documentation Review

- [ ] Review `examples/configs/README.md`
- [ ] Verify all examples work
- [ ] Check that no docs reference `globalDefaults`

## Completion Criteria

### Code

- ✅ No references to `globalDefaults` in any `.ts`, `.tsx`, `.js`, `.jsx` files
- ✅ All TypeScript builds succeed without errors
- ✅ All tests pass
- ✅ `mergeProjectWithDefaults()` has single parameter
- ✅ Schema rejects configs with `globalDefaults`

### UI

- ✅ No global defaults section in config editor
- ✅ All configuration sections appear in project cards
- ✅ Tabs/accordions work correctly
- ✅ Can add/edit/remove projects with full configuration
- ✅ Download/upload works with new format
- ✅ Preview shows correct data

### Examples

- ✅ All 7 example configs updated
- ✅ All configs validate successfully
- ✅ nextjs-openapi-tester runs without errors
- ✅ Generated data matches expectations

### Tests

- ✅ All core tests pass
- ✅ All config-ui tests pass
- ✅ All integration tests pass
- ✅ New tests added for per-project behavior
- ✅ Tests verify built-in defaults apply correctly

### Documentation

- ✅ README.md updated
- ✅ examples/configs/README.md updated
- ✅ No references to `globalDefaults` in user-facing docs

## Notes

- **Breaking Change**: This is a breaking change. Old configs will not work.
- **No Migration**: We are not providing a migration path per requirements.
- **Version**: Config version stays at "1.0" per requirements.
- **Built-in Defaults**: System still has built-in defaults, just no user-configurable global defaults.

## Rollback Plan

If this refactoring needs to be rolled back:

1. Revert all commits related to this refactoring
2. Restore `globalDefaults` to schema and types
3. Restore 3-level merge in `mergeProjectWithDefaults()`
4. Restore global defaults UI sections
5. Restore original example configs from git history
