# Per-Project Configuration - Implementation Checklist

> **Reference:** See [PER_PROJECT_CONFIG_PLAN.md](./PER_PROJECT_CONFIG_PLAN.md) for detailed specifications.

**Status:** Not Started
**Started:** TBD
**Target Completion:** TBD

---

## 📋 Overview

- [ ] **Phase 1:** Core Package Updates - 0/36 tasks
- [ ] **Phase 2:** Config-UI Package Updates - 0/34 tasks
- [ ] **Phase 3:** MSW-Integration Package Updates - 0/3 tasks
- [ ] **Phase 4:** Examples Updates - 0/12 tasks
- [ ] **Phase 5:** Documentation & Migration - 0/12 tasks
- [ ] **Phase 6:** Testing & Quality Assurance - 0/11 tasks
- [ ] **Phase 7:** Deployment & Release - 0/11 tasks

**Total Progress:** 0/119 tasks (0%)

---

## Phase 1: Core Package Updates

**Goal:** Extend configuration system to support per-project configuration

### 1.1 Configuration Types & Schema

**File:** `packages/core/src/config/types.ts`

- [ ] Create `ProjectConfig` interface (all current fields except projectKey)
- [ ] Create `ProjectConfigWithKey` interface (extends ProjectConfig)
  - [ ] Add `projectKey: string` (required, unique)
  - [ ] Add `projectName?: string` (optional display name)
  - [ ] Add `projectType?: 'company-managed' | 'team-managed'`
  - [ ] Add `issueCount: number` (required, 1-10000)
- [ ] Create `JiraMockConfigV2` interface
  - [ ] Add `version: '2.0'` literal
  - [ ] Add `globalDefaults?: ProjectConfig`
  - [ ] Add `projects: ProjectConfigWithKey[]`
- [ ] Keep existing `JiraMockConfigV1` interface (rename current type)
- [ ] Create union type: `type JiraMockConfig = JiraMockConfigV1 | JiraMockConfigV2`
- [ ] Update exports to include new types
- [ ] Add JSDoc comments for all new types

**File:** `packages/core/src/config/schema.ts`

- [ ] Create `projectConfigSchema` (reuse existing field schemas)
- [ ] Create `projectConfigWithKeySchema`
  - [ ] Add `projectKey` validation (required, 1-10 chars, uppercase letters/numbers)
  - [ ] Add regex validation: `/^[A-Z][A-Z0-9]*$/`
  - [ ] Add `projectName` validation (optional string)
  - [ ] Add `projectType` validation (optional enum)
  - [ ] Add `issueCount` validation (required, 1-10000)
- [ ] Create `configSchemaV2`
  - [ ] Add `version: '2.0'` literal validation
  - [ ] Add `globalDefaults` (optional ProjectConfig)
  - [ ] Add `projects` array validation (min 1 item)
  - [ ] Add refinement check for unique projectKey across all projects
- [ ] Create union schema: `z.union([configSchemaV1, configSchemaV2])`
- [ ] Update `validateConfig()` function to handle both versions

**File:** `packages/core/src/config/validation.ts`

- [ ] Update `getConfigErrors()` to handle v2 structure
- [ ] Update `getConfigWarnings()` to handle v2 structure
- [ ] Add project-level validation warnings
- [ ] Add aggregate validation (e.g., total issues across all projects)
- [ ] Add helpful error messages for v2-specific issues

### 1.2 Configuration Defaults & Merging

**File:** `packages/core/src/config/defaults.ts`

- [ ] Refactor existing defaults to `ProjectConfig` format
- [ ] Create `getBuiltInDefaults()` function (returns base defaults)
- [ ] Create `mergeProjectWithDefaults(projectConfig, globalDefaults)` function
  - [ ] Implement 3-level merge: built-in → global → project
  - [ ] Handle deep merge for nested objects
  - [ ] Preserve project-specific overrides
- [ ] Update `mergeWithDefaults()` to handle both v1 and v2
- [ ] Add unit tests for 3-level merge
- [ ] Add unit tests for override behavior

### 1.3 Data Generation

**File:** `packages/core/src/index.ts`

- [ ] Add version detection logic in `generateMockData()`
- [ ] Refactor existing logic into `generateMockDataV1()` function
- [ ] Delegate to `generateMockDataV1()` for v1 configs
- [ ] Delegate to `generateMockDataV2()` for v2 configs
- [ ] Ensure backward compatibility for v1 configs

**File:** `packages/core/src/generation-v2.ts` (new file)

- [ ] Create new file and export structure
- [ ] Create `generateMockDataV2()` function
- [ ] Aggregate user emails from all projects' `data.assignees`
- [ ] Generate global metadata (statuses, priorities, issue types)
- [ ] Implement project iteration logic
- [ ] For each project:
  - [ ] Merge project config with global defaults
  - [ ] Create project-specific generation context
  - [ ] Generate project entity with correct projectKey
  - [ ] Generate project metadata (components, versions, sprints)
  - [ ] Generate issues with project-specific `issueCount`
  - [ ] Generate issue metadata (worklogs, comments, attachments)
- [ ] Handle cross-project relationships (if needed)
- [ ] Add error handling for invalid project configs

**File:** `packages/core/src/types/generation.ts`

- [ ] Add `currentProject: Project` to `GenerationContext`
- [ ] Add `projectConfig: ProjectConfigWithKey` to context
- [ ] Update context creation to support project-specific configs

**Update Generators:**

- [ ] `generators/project.generator.ts`: Use projectKey from config
- [ ] `generators/issue.generator.ts`: Use project-specific issue count
- [ ] `generators/sprint.generator.ts`: Generate sprints per project
- [ ] `generators/version.generator.ts`: Generate versions per project
- [ ] `generators/worklog.generator.ts`: Use project-specific config
- [ ] Verify all other generators respect project config

### 1.4 Testing

- [ ] **Update existing tests** (`config/validation.test.ts`)
  - [ ] Add v2 config validation tests
  - [ ] Test unique projectKey validation
  - [ ] Test project array validation (min 1 item)
  - [ ] Test globalDefaults validation
- [ ] **Update existing tests** (`config/defaults.test.ts`)
  - [ ] Add multi-level merge tests
  - [ ] Test built-in → global → project merge order
  - [ ] Test project-specific overrides
- [ ] **Create new test file** (`generation-v2.test.ts`)
  - [ ] Test multi-project generation
  - [ ] Test global defaults inheritance
  - [ ] Test project-specific overrides
  - [ ] Test cross-project data consistency
  - [ ] Test with varying project counts (1, 3, 10)
- [ ] **Backward compatibility tests**
  - [ ] Test all existing v1 configs still work
  - [ ] Test v1 and v2 can be validated in same codebase

### 1.5 Documentation

- [ ] **Update README** (`packages/core/README.md`)
  - [ ] Document v2 configuration structure
  - [ ] Add migration guide from v1 to v2
  - [ ] Update examples to show both v1 and v2
  - [ ] Document inheritance behavior (built-in → global → project)
  - [ ] Add example of globalDefaults usage
- [ ] **Update API documentation**
  - [ ] Document new types and interfaces
  - [ ] Update JSDoc comments
  - [ ] Add examples of v2 usage

---

## Phase 2: Config-UI Package Updates

**Goal:** Build UI for managing multiple projects with individual configurations

### 2.1 Component Structure

**Create new components:**

- [ ] `components/ConfigEditor/ProjectList.tsx`
  - [ ] List of projects with add/remove buttons
  - [ ] Show project summary (key, name, issue count)
  - [ ] Highlight selected project
  - [ ] Handle click to select project
- [ ] `components/ConfigEditor/ProjectCard.tsx`
  - [ ] Collapsed card showing project summary
  - [ ] Project key badge
  - [ ] Issue count display
  - [ ] Remove button with confirmation
  - [ ] Click to select/expand
- [ ] `components/ConfigEditor/ProjectEditor.tsx`
  - [ ] Full editor for single project
  - [ ] Basic info section (key, name, type, issueCount)
  - [ ] Reuse existing section components
  - [ ] Show inheritance indicators
  - [ ] Handle project config updates
- [ ] `components/ConfigEditor/GlobalDefaultsEditor.tsx`
  - [ ] Editor for global defaults
  - [ ] Reuse existing section components
  - [ ] Explain inheritance behavior
  - [ ] Show which projects inherit each field
- [ ] `components/ConfigEditor/EmptyState.tsx`
  - [ ] Shown when no project is selected
  - [ ] Call-to-action to add first project
  - [ ] Illustration or icon
- [ ] `components/ConfigEditor/MigrationDialog.tsx`
  - [ ] Dialog for migrating v1 to v2
  - [ ] Show preview of migration
  - [ ] Explain changes
  - [ ] Confirm/cancel buttons

### 2.2 State Management

**File:** `components/ConfigEditor/index.tsx`

- [ ] Update state structure for v2
  - [ ] `version: '2.0'`
  - [ ] `globalDefaults?: ProjectConfig`
  - [ ] `projects: ProjectConfigWithKey[]`
  - [ ] `selectedProjectIndex: number | null`
  - [ ] `editingGlobalDefaults: boolean`
- [ ] Implement project CRUD operations
  - [ ] `handleAddProject()` - Generate unique key, add to array
  - [ ] `handleRemoveProject(index)` - Show confirmation, remove from array
  - [ ] `handleUpdateProject(index, config)` - Update specific project
  - [ ] `handleDuplicateProject(index)` - Copy and create new with different key
  - [ ] `handleSelectProject(index)` - Update selectedProjectIndex
- [ ] Implement global defaults operations
  - [ ] `handleUpdateGlobalDefaults(config)` - Update globalDefaults
  - [ ] `handleToggleGlobalDefaults()` - Switch between global/project view

### 2.3 UI/UX Features

**Project management:**

- [ ] Add project button with dialog
  - [ ] Input for projectKey with validation
  - [ ] Optional projectName input
  - [ ] Default issueCount value
- [ ] Remove project with confirmation
  - [ ] Show warning about data loss
  - [ ] Require confirmation for deletion
- [ ] Duplicate project functionality
  - [ ] Copy all settings from existing project
  - [ ] Generate new unique key (e.g., PROJ1 → PROJ2)
  - [ ] Open duplicated project for editing

**Visual hierarchy:**

- [ ] Sidebar layout for project list
  - [ ] Collapsible sidebar (mobile-friendly)
  - [ ] Scrollable project list
  - [ ] Add project button in sidebar header
- [ ] Main editor area for selected project
  - [ ] Full-width editor panel
  - [ ] Scrollable content
- [ ] Breadcrumb navigation
  - [ ] Show "Global Defaults" or "Project: {name}"
  - [ ] Quick navigation between views
- [ ] Summary stats
  - [ ] Total projects count
  - [ ] Total issues across all projects
  - [ ] Validation status indicator

**Inheritance indicators:**

- [ ] Visual indicator for inherited values
  - [ ] Gray/italic text for inherited values
  - [ ] "Inherited from global defaults" tooltip
  - [ ] Icon showing inheritance status
- [ ] Override functionality
  - [ ] "Override" button to replace inherited value
  - [ ] "Reset to inherited" button to remove override
  - [ ] Visual diff showing inherited vs overridden

**Validation feedback:**

- [ ] Per-project validation errors
  - [ ] Show errors in ProjectCard
  - [ ] Show errors in ProjectEditor
- [ ] Global validation errors
  - [ ] Duplicate projectKey error
  - [ ] Empty projects array error
- [ ] Warning for large total issue counts
  - [ ] Sum issues across all projects
  - [ ] Warn if total > 5000

### 2.4 Configuration Manager

**File:** `lib/config-manager.ts`

- [ ] Update `saveConfig()` to handle v2
- [ ] Update `loadConfig()` to handle both v1 and v2
- [ ] Create `migrateV1ToV2()` migration function
  - [ ] Convert single config to globalDefaults
  - [ ] Generate projects array from `projects.count`
  - [ ] Generate projectKey (PROJ1, PROJ2, etc.)
  - [ ] Set issueCount from `issuesPerProject`
- [ ] Update `downloadConfig()` to use v2 format
- [ ] Update `uploadConfig()` to detect and migrate v1 configs
  - [ ] Detect version from config
  - [ ] Offer migration dialog if v1
  - [ ] Auto-migrate or ask user

### 2.5 API Routes

**File:** `app/api/config/validate/route.ts`

- [ ] Support v2 config validation
- [ ] Return project-specific errors with project index
- [ ] Return global errors (duplicate keys, etc.)

**File:** `app/api/config/preview/route.ts`

- [ ] Support v2 config
- [ ] Allow selecting which project to preview (query param)
- [ ] Show aggregated preview across all projects (optional)
- [ ] Limit preview to 1 project, 5 issues per project

### 2.6 Styling

**Layout:**

- [ ] Responsive sidebar (collapsible on mobile)
- [ ] Main editor scroll area
- [ ] Project card styling (collapsed/expanded states)
- [ ] Empty state illustration/message
- [ ] Breadcrumb styling

**Theme:**

- [ ] Inheritance indicator styles (gray, italic)
- [ ] Project card hover/selected states
- [ ] Global defaults editor distinct styling
- [ ] Validation error/warning styles

### 2.7 Testing

- [ ] `ProjectList.test.tsx` - Test add/remove/select
- [ ] `ProjectEditor.test.tsx` - Test editing and inheritance
- [ ] `GlobalDefaultsEditor.test.tsx` - Test defaults editing
- [ ] `ConfigEditor.test.tsx` - Test overall state management
- [ ] Integration test: Full workflow (add, edit, save, load)
- [ ] Integration test: Migration from v1 to v2
- [ ] Integration test: Validation across multiple projects

### 2.8 Documentation

- [ ] **Update README** (`packages/config-ui/README.md`)
  - [ ] Document new UI features
  - [ ] Add screenshots of new interface
  - [ ] Explain inheritance system
  - [ ] Document migration process
  - [ ] Add troubleshooting section

---

## Phase 3: MSW-Integration Package Updates

**Goal:** Ensure MSW integration works with v2 configs

### 3.1 Type Updates

**File:** `packages/msw-integration/src/types.ts`

- [ ] Import updated `JiraMockConfig` type from core
- [ ] Verify `SetupJiraMockOptions` accepts both v1 and v2
- [ ] Update JSDoc comments

### 3.2 Testing

- [ ] Test with v2 config
- [ ] Test backward compatibility with v1
- [ ] Test multi-project scenarios
  - [ ] Verify issues from different projects are separate
  - [ ] Verify project-specific settings apply correctly
  - [ ] Test cross-project queries

### 3.3 Documentation

- [ ] **Update README** (`packages/msw-integration/README.md`)
  - [ ] Show examples with v2 config
  - [ ] Document behavior with multiple projects
  - [ ] Add migration notes

---

## Phase 4: Examples Updates

**Goal:** Update examples to demonstrate v2 configuration

### 4.1 Configuration Files

**Create new v2 example configs** (`examples/configs/v2/`):

- [ ] Create `v2/` directory
- [ ] `minimal-v2.json` - Simplest v2 config (1 project, no defaults)
- [ ] `multi-project.json` - 3 projects with different settings
- [ ] `inheritance-demo.json` - Demonstrates global defaults + overrides
- [ ] `realistic-workspace.json` - Realistic workspace (3-5 projects)
- [ ] `README.md` - Explain each example config

**Keep existing configs:**

- [ ] Keep v1 configs for backward compatibility
- [ ] Add note about v1 deprecation
- [ ] Link to migration guide

### 4.2 Vitest Example

**File:** `examples/vitest-example/jira-api.test.ts`

- [ ] Create new test file: `jira-api-v2.test.ts`
- [ ] Update to use v2 config
- [ ] Add tests for multi-project scenarios
  - [ ] Test fetching issues from specific project
  - [ ] Test project-specific status distribution
  - [ ] Test project-specific assignees
- [ ] Keep v1 example for reference

### 4.3 Next.js Example

**File:** `examples/nextjs-openapi-tester/jira-mock-config.json`

- [ ] Update to v2 format
- [ ] Use 2-3 projects with different configs
- [ ] Demonstrate inheritance

**File:** `examples/nextjs-openapi-tester/src/app/api/config/route.ts`

- [ ] Verify it handles v2 config correctly

**UI updates** (`examples/nextjs-openapi-tester/src/`):

- [ ] Add project selector dropdown in navigation
- [ ] Show project info in issue cards
- [ ] Filter issues by project
- [ ] Show project-level statistics (optional)

### 4.4 Documentation

- [ ] Update Vitest example README
- [ ] Update Next.js example README
- [ ] Add migration examples
- [ ] Explain multi-project scenarios

---

## Phase 5: Documentation & Migration

**Goal:** Comprehensive documentation and migration support

### 5.1 Root Documentation

**File:** `README.md`

- [ ] Update Quick Start with v2 example
- [ ] Document both v1 and v2 support
- [ ] Add migration guide section
- [ ] Update feature list to mention per-project config
- [ ] Update screenshots/demos

**File:** `MIGRATION_V1_TO_V2.md` (new file)

- [ ] Create migration guide
- [ ] Explain differences between v1 and v2
- [ ] Step-by-step migration instructions
- [ ] Before/after config examples
- [ ] Common migration scenarios
- [ ] Troubleshooting section
- [ ] FAQ

**File:** `CHANGELOG.md`

- [ ] Document v2 configuration format
- [ ] Mark as major version bump (breaking changes)
- [ ] Note backward compatibility
- [ ] List all new features

### 5.2 Package Documentation

- [ ] Update `package.json` descriptions
- [ ] Update version to next major (if breaking)
- [ ] Update keywords to include "multi-project", "per-project"

### 5.3 TypeScript Documentation

- [ ] Add JSDoc comments to all new types
- [ ] Add `@example` tags showing v2 usage
- [ ] Add `@deprecated` tags for v1-specific APIs (if any)

---

## Phase 6: Testing & Quality Assurance

**Goal:** Ensure quality and stability

### 6.1 Comprehensive Testing

- [ ] Run all test suites
  - [ ] Core package tests (v1 and v2)
  - [ ] Config-UI package tests
  - [ ] MSW-integration tests
  - [ ] Example tests
- [ ] Manual testing scenarios
  - [ ] Create v2 config from scratch in UI
  - [ ] Upload v1 config and migrate to v2
  - [ ] Edit multiple projects with different settings
  - [ ] Verify inheritance behavior
  - [ ] Test with realistic multi-project configs
  - [ ] Verify generated data matches config

### 6.2 Performance Testing

- [ ] Load testing with 10+ projects
- [ ] Test with large issue counts per project (1000+ each)
- [ ] Verify UI performance with many projects
- [ ] Verify data generation performance
- [ ] Profile and optimize if needed

### 6.3 Cross-browser Testing

- [ ] Test Config UI in Chrome
- [ ] Test Config UI in Firefox
- [ ] Test Config UI in Safari
- [ ] Test Config UI in Edge
- [ ] Test responsive design on mobile

### 6.4 Backward Compatibility Testing

- [ ] Verify all existing v1 configs still work
- [ ] Test v1 with all packages
- [ ] Verify no breaking changes for v1 users
- [ ] Test migration of all example v1 configs

---

## Phase 7: Deployment & Release

**Goal:** Ship the update to users

### 7.1 Pre-release Checklist

**Code review:**

- [ ] Review all changes
- [ ] Check for security issues
- [ ] Verify error handling
- [ ] Check TypeScript strict mode compliance
- [ ] Verify no console.log statements

**Documentation review:**

- [ ] Verify all docs are updated
- [ ] Check for broken links
- [ ] Verify examples work
- [ ] Spell check all documentation

**Version bumping:**

- [ ] Update version in all package.json files
- [ ] Update CHANGELOG.md with all changes
- [ ] Decide on version number (major bump)

### 7.2 Release

**Build packages:**

- [ ] Run build for all packages
- [ ] Verify build artifacts
- [ ] Test packaged versions locally
- [ ] Check bundle sizes

**Git operations:**

- [ ] Commit all changes with descriptive message
- [ ] Push to feature branch: `claude/per-project-config-0149hjMfTEeDRJnTRTunvg4n`
- [ ] Create pull request with detailed description
- [ ] Request code review
- [ ] Address review feedback
- [ ] Merge to main after approval

### 7.3 Post-release

**Announcement:**

- [ ] Update README badges (if any)
- [ ] Announce in discussions/issues
- [ ] Update examples in docs

**Monitor:**

- [ ] Watch for issues
- [ ] Monitor package downloads (if published to npm)
- [ ] Respond to user feedback
- [ ] Create follow-up issues for improvements

---

## Quality Gates

### Before Phase 2

- [ ] All Phase 1 tasks completed
- [ ] All new types have JSDoc comments
- [ ] Schema validation covers all v2 fields
- [ ] Multi-level merge working correctly
- [ ] Unit tests passing for Phase 1
- [ ] V1 backward compatibility verified

### Before Phase 3

- [ ] All Phase 2 tasks completed
- [ ] All UI components implemented
- [ ] Project management working (add/remove/edit)
- [ ] Inheritance indicators working
- [ ] Migration from v1 working
- [ ] Component tests passing

### Before Phase 4

- [ ] All Phase 3 tasks completed
- [ ] MSW integration working with v2
- [ ] Multi-project mocking verified
- [ ] Integration tests passing

### Before Phase 5

- [ ] All Phase 4 tasks completed
- [ ] All examples updated
- [ ] Example configs tested
- [ ] Example apps working

### Before Release

- [ ] All phases completed
- [ ] All tests passing (>90% core, >80% UI)
- [ ] Documentation complete and reviewed
- [ ] Migration guide written and tested
- [ ] Backward compatibility verified
- [ ] Performance acceptable
- [ ] No known critical bugs

---

## Success Criteria

- [ ] All 119 tasks completed
- [ ] Test coverage: Core package >90%
- [ ] Test coverage: Config UI package >80%
- [ ] All integration tests passing
- [ ] Zero TypeScript errors
- [ ] Zero linting errors
- [ ] Documentation complete and reviewed
- [ ] Example configurations tested
- [ ] Backward compatibility verified (v1 configs work)
- [ ] Migration path tested (v1 → v2)
- [ ] Performance acceptable (<10s generation for 10k total issues)
- [ ] UI responsive with 10+ projects

---

## Notes & Decisions

### Key Decisions

- **Version Number**: v2.0 (breaking change in config structure)
- **Backward Compatibility**: Support both v1 and v2 indefinitely
- **Migration Strategy**: Automatic migration offered in UI, manual migration via guide
- **Inheritance Levels**: Built-in defaults → Global defaults → Project config
- **Project Key Format**: Uppercase letters and numbers, starts with letter, max 10 chars

### Open Questions

1. **Should we support nested inheritance?** (e.g., project groups) - **Decision: No, keep it simple for v2.0**
2. **Should global defaults be required or optional?** - **Decision: Optional, projects can work without it**
3. **How should we handle cross-project issue links?** - **Decision: Defer to future version**
4. **Should we support project-level seeds?** - **Decision: Yes, per-project seed with global seed as fallback**
5. **Should we validate total issue count across all projects?** - **Decision: Yes, warn if >5000 total**

### Blockers

<!-- Add blockers here as they arise -->

### Risks

- **Large refactor**: Changes touch many files, risk of introducing bugs
  - **Mitigation**: Comprehensive testing, backward compatibility
- **UI complexity**: Managing multiple projects adds UI complexity
  - **Mitigation**: Clear visual hierarchy, good UX design
- **Migration friction**: Users may not want to migrate
  - **Mitigation**: Support both versions indefinitely, make migration optional

---

**Last Updated:** 2025-11-22
**Created By:** Claude Code
