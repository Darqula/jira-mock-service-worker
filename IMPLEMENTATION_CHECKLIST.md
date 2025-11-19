# Configuration Extension - Implementation Checklist

> **Reference:** See [CONFIGURATION_EXTENSION_PLAN.md](./CONFIGURATION_EXTENSION_PLAN.md) for detailed specifications.

**Status:** Not Started
**Started:** TBD
**Target Completion:** TBD

---

## 📋 Overview

- [ ] **Phase 1:** Core Foundation (Week 1) - 0/15 tasks
- [ ] **Phase 2:** Generator Modifications (Week 2) - 0/23 tasks
- [ ] **Phase 3:** UI Components & Sections (Week 3) - 0/37 tasks
- [ ] **Phase 4:** Enhanced Features (Week 4) - 0/17 tasks
- [ ] **Phase 5:** Testing & Documentation (Ongoing) - 0/24 tasks

**Total Progress:** 0/116 tasks (0%)

---

## Phase 1: Core Foundation (Week 1)

**Goal:** Extend configuration schema and add default value handling

### 1.1 Create New Type Definitions

**File:** `packages/core/src/config/types.ts`

- [ ] Add `ProjectType` enum (`'company-managed' | 'team-managed'`)
- [ ] Add `GeneralConfig` interface
- [ ] Add `StatusDistribution` interface
- [ ] Add `EpicConfig` interface
- [ ] Add `IssueTypeConfig` interface
- [ ] Add `SprintsConfig` interface
- [ ] Add `VersionsConfig` interface
- [ ] Add `WorklogsConfig` interface
- [ ] Add `DataConfig` interface
- [ ] Update `JiraMockConfig` interface with all new optional sections
- [ ] Add JSDoc comments for all new types

### 1.2 Create Validation Schema

**File:** `packages/core/src/config/schema.ts`

- [ ] Add `ProjectTypeSchema`
- [ ] Add `GeneralConfigSchema` with all field validations
- [ ] Add `StatusDistributionSchema` with 0-1 range validation
- [ ] Add `EpicConfigSchema` with child distribution validation
- [ ] Add `IssueTypeConfigSchema` for Story/Task/Bug
- [ ] Add `IssueTypesConfigSchema` combining all issue types
- [ ] Add `SprintsConfigSchema`
- [ ] Add `VersionsConfigSchema`
- [ ] Add `WorklogsConfigSchema` with min/max validation
- [ ] Add `DataConfigSchema` with email validation for assignees
- [ ] Update `JiraMockConfigSchema` with all new schemas
- [ ] Add cross-field validation (e.g., `startDate < endDate`)
- [ ] Add cross-field validation (e.g., `hoursMin <= hoursMax`)
- [ ] Add cross-field validation (e.g., `countMin <= countMax`)

### 1.3 Create Defaults File

**File:** `packages/core/src/config/defaults.ts` (new file)

- [ ] Create file and export structure
- [ ] Define `DEFAULT_CONFIG` constant with all default values
- [ ] Implement `mergeWithDefaults()` function
- [ ] Add deep merge for nested objects
- [ ] Add unit tests for `mergeWithDefaults()`
- [ ] Add unit tests for default value coverage

### 1.4 Update Validator

**File:** `packages/core/src/config/validator.ts`

- [ ] Update `validateConfig()` to use new schema
- [ ] Improve error messages for clarity
- [ ] Add custom validators for complex rules
- [ ] Add warning system for non-blocking issues (e.g., large issue counts)

### 1.5 Update Exports

**File:** `packages/core/src/index.ts`

- [ ] Export all new types
- [ ] Export `DEFAULT_CONFIG`
- [ ] Export `mergeWithDefaults`
- [ ] Update package documentation

---

## Phase 2: Generator Modifications (Week 2)

**Goal:** Update all generators to use new configuration options

### 2.1 Issue Generator

**File:** `packages/core/src/generators/issue.generator.ts`

- [ ] Add probability-based assignment logic
- [ ] Add weighted status distribution using `statusDistribution` config
- [ ] Add epic generation with configurable count
- [ ] Add epic-child relationship handling (parent field)
- [ ] Add child type distribution (Story/Task/Bug percentages)
- [ ] Add standalone issue generation for Story/Task/Bug
- [ ] Add team-managed ParentKey custom field support
- [ ] Add label probability logic
- [ ] Add date range generation using `startDate` and `endDate`
- [ ] Integrate task template system with realistic summaries
- [ ] Add epic-specific assign/label probabilities
- [ ] Add issue-type-specific assign/label probabilities
- [ ] Add tests for probability distributions
- [ ] Add tests for epic-child relationships
- [ ] Add tests for team-managed projects

### 2.2 Worklog Generator

**File:** `packages/core/src/generators/worklog.generator.ts`

- [ ] Add probability-based generation using `worklogs.probability`
- [ ] Add configurable hour ranges (`hoursMin`, `hoursMax`)
- [ ] Add configurable count ranges (`countMin`, `countMax`)
- [ ] Add realistic worklog timestamps (working hours 9-18)
- [ ] Add random worklog comments from template list
- [ ] Add ISO 8601 duration format (PT format)
- [ ] Add tests for hour ranges
- [ ] Add tests for count ranges
- [ ] Add tests for probability

### 2.3 Version Generator

**File:** `packages/core/src/generators/version.generator.ts`

- [ ] Add configurable start number
- [ ] Add configurable count
- [ ] Add release date generation based on date range
- [ ] Add version state (released vs unreleased)
- [ ] Add version assignment probability
- [ ] Add tests for version numbering
- [ ] Add tests for release date generation

### 2.4 Project Generator

**File:** `packages/core/src/generators/project.generator.ts`

- [ ] Add custom project key support from config
- [ ] Add project type (company-managed vs team-managed)
- [ ] Add sprint generation based on date ranges
- [ ] Add sprint duration configuration
- [ ] Add sprint state calculation (ACTIVE, CLOSED, FUTURE)
- [ ] Add sprint assignment to issues based on probability
- [ ] Add tests for sprint generation
- [ ] Add tests for project types

### 2.5 User Generator

**File:** `packages/core/src/generators/user.generator.ts`

- [ ] Add custom assignee list support from `data.assignees`
- [ ] Fallback to generated users if custom list is empty
- [ ] Validate email format for custom assignees
- [ ] Add tests for custom assignee list
- [ ] Add tests for fallback behavior

### 2.6 Priority Generator

**File:** `packages/core/src/generators/priority.generator.ts`

- [ ] Add priority filtering based on `data.priorities`
- [ ] Ensure at least one priority is available
- [ ] Add tests for priority filtering

### 2.7 Create Helper Utilities

**File:** `packages/core/src/generators/utils/probability.ts` (new file)

- [ ] Create file and export structure
- [ ] Implement `shouldApply(probability: number): boolean`
- [ ] Implement `weightedPick<T>(weights: Record<string, number>): string`
- [ ] Implement `randomInRange(min: number, max: number): number`
- [ ] Add unit tests for all utility functions

### 2.8 Create Task Templates

**File:** `packages/core/src/generators/utils/templates.ts` (new file)

- [ ] Create file and export structure
- [ ] Add task templates for Epic
- [ ] Add task templates for Story
- [ ] Add task templates for Task
- [ ] Add task templates for Bug
- [ ] Add template modifiers for variation
- [ ] Add `generateTaskContent()` function
- [ ] Add tests for template generation

---

## Phase 3: UI Components & Sections (Week 3)

**Goal:** Build new UI components and configuration sections

### 3.1 Base UI Components

#### 3.1.1 Slider Component

**File:** `packages/config-ui/src/components/ui/slider.tsx`

- [ ] Create slider component file
- [ ] Implement range slider with draggable thumb
- [ ] Add value display
- [ ] Add min/max/step props
- [ ] Add disabled state
- [ ] Style with Tailwind CSS
- [ ] Add accessibility (ARIA labels, keyboard support)
- [ ] Add component tests

#### 3.1.2 Probability Slider Component

**File:** `packages/config-ui/src/components/ui/probability-slider.tsx`

- [ ] Create probability slider component
- [ ] Wrap base slider with 0-1 range
- [ ] Display value as percentage (0-100%)
- [ ] Add label and help text props
- [ ] Add component tests

#### 3.1.3 Multi-Select Component

**File:** `packages/config-ui/src/components/ui/multi-select.tsx`

- [ ] Create multi-select component file
- [ ] Implement dropdown with checkbox list
- [ ] Add search/filter functionality
- [ ] Add "Add item" input field (conditional)
- [ ] Add "Remove item" button (conditional)
- [ ] Add "Select all" / "Clear all" buttons
- [ ] Show selected count in header
- [ ] Handle click outside to close dropdown
- [ ] Add keyboard navigation support
- [ ] Add component tests

#### 3.1.4 Date Picker Component

**File:** `packages/config-ui/src/components/ui/date-picker.tsx`

- [ ] Create date picker component
- [ ] Use HTML5 date input as base
- [ ] Add calendar icon
- [ ] Handle ISO date format conversion
- [ ] Add min/max validation
- [ ] Add component tests

#### 3.1.5 Tabs Component

**File:** `packages/config-ui/src/components/ui/tabs.tsx`

- [ ] Create tabs component file
- [ ] Implement tab navigation
- [ ] Implement tab content panels
- [ ] Add active state styling
- [ ] Support keyboard navigation
- [ ] Add component tests

### 3.2 Configuration Sections

#### 3.2.1 General Section

**File:** `packages/config-ui/src/components/ConfigEditor/GeneralSection.tsx`

- [ ] Create GeneralSection component
- [ ] Add project type selector (dropdown)
- [ ] Add project key text input (max 10 chars validation)
- [ ] Add start issue number input
- [ ] Add start date picker
- [ ] Add end date picker
- [ ] Add chunk size input
- [ ] Add date range validation (start < end)
- [ ] Add team-managed info banner (conditional)
- [ ] Add help text for all fields
- [ ] Add section tests

#### 3.2.2 Status Distribution Section

**File:** `packages/config-ui/src/components/ConfigEditor/StatusSection.tsx`

- [ ] Create StatusSection component
- [ ] Add "To Do" probability slider
- [ ] Add "In Progress" probability slider
- [ ] Add "Done" probability slider
- [ ] Display total (sum of all three)
- [ ] Add normalization helper/warning
- [ ] Add visual distribution bar (optional)
- [ ] Add section tests

#### 3.2.3 Issue Types Section

**File:** `packages/config-ui/src/components/ConfigEditor/IssueTypesSection.tsx`

- [ ] Create IssueTypesSection component
- [ ] Implement master-detail layout with tabs
- [ ] Create Epic panel:
  - [ ] Count input
  - [ ] Children per epic input
  - [ ] Assign probability slider
  - [ ] Label probability slider
  - [ ] Child distribution subsection
  - [ ] Story distribution slider
  - [ ] Task distribution slider
  - [ ] Bug distribution slider
  - [ ] Distribution total display
- [ ] Create Story panel:
  - [ ] Standalone count input
  - [ ] Assign probability slider
  - [ ] Label probability slider
- [ ] Create Task panel:
  - [ ] Standalone count input
  - [ ] Assign probability slider
  - [ ] Label probability slider
- [ ] Create Bug panel:
  - [ ] Standalone count input
  - [ ] Assign probability slider
  - [ ] Label probability slider
- [ ] Add tab switching logic
- [ ] Add section tests

#### 3.2.4 Sprint Section

**File:** `packages/config-ui/src/components/ConfigEditor/SprintSection.tsx`

- [ ] Create SprintSection component
- [ ] Add start number input
- [ ] Add duration input (days)
- [ ] Add assignment probability slider
- [ ] Show calculated sprint count based on date range (optional)
- [ ] Add help text for all fields
- [ ] Add section tests

#### 3.2.5 Version Section

**File:** `packages/config-ui/src/components/ConfigEditor/VersionSection.tsx`

- [ ] Create VersionSection component
- [ ] Add start number input
- [ ] Add count input
- [ ] Add assignment probability slider
- [ ] Add help text for all fields
- [ ] Add section tests

#### 3.2.6 Worklog Section

**File:** `packages/config-ui/src/components/ConfigEditor/WorklogSection.tsx`

- [ ] Create WorklogSection component
- [ ] Add probability slider
- [ ] Add hours min input
- [ ] Add hours max input
- [ ] Add count min input
- [ ] Add count max input
- [ ] Add validation (min <= max for both ranges)
- [ ] Add help text for all fields
- [ ] Add section tests

#### 3.2.7 Data Options Section

**File:** `packages/config-ui/src/components/ConfigEditor/DataSection.tsx`

- [ ] Create DataSection component
- [ ] Add assignees multi-select with email input
- [ ] Add email format validation
- [ ] Add priorities multi-select (predefined list)
- [ ] Add labels multi-select with add/remove
- [ ] Add help text for all fields
- [ ] Add section tests

### 3.3 Update Main Editor

**File:** `packages/config-ui/src/components/ConfigEditor/index.tsx`

- [ ] Import all new sections
- [ ] Add GeneralSection to layout
- [ ] Add StatusSection to layout
- [ ] Add IssueTypesSection to layout
- [ ] Add SprintSection to layout
- [ ] Add VersionSection to layout
- [ ] Add WorklogSection to layout
- [ ] Add DataSection to layout
- [ ] Update state management for all new config fields
- [ ] Add section collapsing/expanding (accordion - optional)
- [ ] Update validation to use new schema
- [ ] Update save/load functions to handle new fields
- [ ] Add integration tests for full editor

---

## Phase 4: Enhanced Features (Week 4)

**Goal:** Add export chunking, preview enhancements, and polish

### 4.1 Export Manager

**File:** `packages/config-ui/src/lib/export-manager.ts` (new file)

- [ ] Create export manager file
- [ ] Implement chunking algorithm
- [ ] Group epics with children in same chunk
- [ ] Implement JSZip integration for ZIP archives
- [ ] Add chunk naming (e.g., `jira-data-1-100.json`)
- [ ] Add single JSON export (when `chunkSize = 0`)
- [ ] Add progress indicator during export (optional)
- [ ] Add error handling for export failures
- [ ] Add tests for chunking algorithm
- [ ] Add tests for ZIP generation

### 4.2 Preview Section Enhancements

**File:** `packages/config-ui/src/components/ConfigEditor/PreviewSection.tsx`

- [ ] Add table columns: Key, Summary, Type, Status, Priority, Assignee, Labels
- [ ] Add table columns: Parent, Start Date, Due Date, Sprint, Version
- [ ] Show first 50 items with pagination/limit
- [ ] Add "Showing X of Y" indicator
- [ ] Add sorting by column (optional)
- [ ] Add filtering by issue type (optional)
- [ ] Show parent-child relationships visually (indentation or icon)
- [ ] Add component tests

### 4.3 LocalStorage Improvements

**File:** `packages/config-ui/src/lib/config-manager.ts`

- [ ] Implement auto-save on config change (debounced to 500ms)
- [ ] Add version tracking in localStorage schema
- [ ] Add version migration support for future versions
- [ ] Handle localStorage quota exceeded errors gracefully
- [ ] Add clear/reset functionality
- [ ] Add tests for auto-save
- [ ] Add tests for version migration

### 4.4 Validation Improvements

- [ ] Add real-time validation feedback
- [ ] Show field-level errors inline
- [ ] Add helpful error messages with suggestions
- [ ] Add warning for large issue counts (>1000)
- [ ] Add validation summary section

### 4.5 Documentation Updates

- [ ] Update main README.md with new configuration options
- [ ] Add configuration examples to README
- [ ] Add migration guide section to README
- [ ] Update packages/core/README.md with new API
- [ ] Update packages/config-ui/README.md with new UI features

---

## Phase 5: Testing & Documentation (Ongoing)

**Goal:** Ensure quality and provide comprehensive documentation

### 5.1 Unit Tests - Core Package

**Location:** `packages/core/src/**/*.test.ts`

- [ ] Config schema validation tests (all fields)
- [ ] Config schema validation tests (cross-field rules)
- [ ] Default value merging tests
- [ ] Generator probability tests
- [ ] Epic-child relationship tests
- [ ] Worklog generation tests
- [ ] Sprint generation tests
- [ ] Version generation tests
- [ ] Team-managed project tests
- [ ] Company-managed project tests
- [ ] Probability utility tests
- [ ] Template generation tests

### 5.2 Unit Tests - Config UI Package

**Location:** `packages/config-ui/src/**/*.test.tsx`

- [ ] Slider component tests
- [ ] Probability slider component tests
- [ ] Multi-select component tests
- [ ] Date picker component tests
- [ ] Tabs component tests
- [ ] GeneralSection tests
- [ ] StatusSection tests
- [ ] IssueTypesSection tests
- [ ] SprintSection tests
- [ ] VersionSection tests
- [ ] WorklogSection tests
- [ ] DataSection tests

### 5.3 Integration Tests

**Location:** `packages/config-ui/src/__tests__/integration/*.test.tsx`

- [ ] Full config editor workflow test
- [ ] Export/import functionality test
- [ ] LocalStorage persistence test
- [ ] Preview generation test
- [ ] Simple configuration end-to-end test
- [ ] Advanced configuration end-to-end test
- [ ] Team-managed project end-to-end test
- [ ] Export chunking end-to-end test

### 5.4 Example Configurations

**Location:** `examples/configs/` (new directory)

- [ ] Create examples directory
- [ ] Small project example (`small-project.json`)
- [ ] Large project example (`large-project.json`)
- [ ] Team-managed project example (`team-managed.json`)
- [ ] Company-managed project example (`company-managed.json`)
- [ ] Minimal config example (`minimal.json`)
- [ ] Full-featured config example (`full-featured.json`)

### 5.5 Documentation

- [ ] Create `docs/configuration.md` with detailed config guide
- [ ] Create `docs/migration.md` with migration guide
- [ ] Add JSDoc comments to all new interfaces
- [ ] Add JSDoc comments to all new functions
- [ ] Update main README with screenshots
- [ ] Add troubleshooting section to docs
- [ ] Add FAQ section

---

## Quality Gates

### Before Phase 2
- [ ] All Phase 1 tasks completed
- [ ] All new types have JSDoc comments
- [ ] Schema validation covers all fields
- [ ] Default config has 100% coverage
- [ ] Unit tests passing for Phase 1

### Before Phase 3
- [ ] All Phase 2 tasks completed
- [ ] All generators use new config options
- [ ] Epic-child relationships working correctly
- [ ] Team-managed projects supported
- [ ] Unit tests passing for Phase 2

### Before Phase 4
- [ ] All Phase 3 tasks completed
- [ ] All UI components implemented
- [ ] All configuration sections working
- [ ] Main editor updated
- [ ] Component tests passing

### Before Release
- [ ] All Phase 4 tasks completed
- [ ] Export chunking working
- [ ] Preview showing all fields
- [ ] Auto-save implemented
- [ ] All tests passing (>90% core, >80% UI)
- [ ] Documentation complete
- [ ] Example configs added
- [ ] Migration guide written
- [ ] Backward compatibility verified

---

## Success Criteria

- [ ] All 116 tasks completed
- [ ] Test coverage: Core package >90%
- [ ] Test coverage: Config UI package >80%
- [ ] All integration tests passing
- [ ] Zero TypeScript errors
- [ ] Zero linting errors
- [ ] Documentation complete and reviewed
- [ ] Example configurations tested
- [ ] Backward compatibility verified (old configs work)
- [ ] Performance acceptable (<10s export for 10k issues)
- [ ] UI responsive with large configurations

---

## Notes & Issues

### Blockers
<!-- Add blockers here -->

### Questions
<!-- Add questions here -->

### Decisions Made
<!-- Document key decisions made during implementation -->

---

**Last Updated:** [Date]
**Updated By:** [Name]
