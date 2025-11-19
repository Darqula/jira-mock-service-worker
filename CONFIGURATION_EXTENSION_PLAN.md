# Jira Mock Service Worker - Configuration Extension Plan

## Executive Summary

This document outlines a comprehensive plan to extend the Jira Mock Service Worker configuration system based on the reference implementation found in `jira-data-generator_reference.html`. The plan expands the current minimal configuration (2 options) to a full-featured system with 40+ configurable options across 9 major categories.

**Current State:** Basic configuration with project count and issues per project
**Target State:** Advanced configuration matching the reference implementation with full control over issue types, distributions, sprints, versions, worklogs, and more

**Estimated Effort:** 4 weeks
**Breaking Changes:** None (backward compatible)

---

## Table of Contents

1. [Analysis](#analysis)
2. [Configuration Schema Design](#configuration-schema-design)
3. [Implementation Phases](#implementation-phases)
4. [File Modifications](#file-modifications)
5. [Backward Compatibility](#backward-compatibility)
6. [Technical Decisions](#technical-decisions)
7. [Testing Strategy](#testing-strategy)
8. [Migration Guide](#migration-guide)

---

## Analysis

### Current Implementation

**Location:** `packages/core/src/config/types.ts`

```typescript
interface JiraMockConfig {
  version: '1.0';
  seed?: number;
  projects: {
    count: number;              // 1-100 projects
    issuesPerProject: number;   // 1-10000 issues per project
  };
}
```

**Capabilities:**
- Basic project and issue count control
- Optional seed for reproducibility
- Hardcoded issue type distribution
- No control over assignees, priorities, labels
- No sprint/version configuration
- No worklog configuration

### Reference Implementation Features

**Location:** `jira-data-generator_reference.html`

The reference implementation provides comprehensive configuration across **9 major categories**:

#### 1. General Settings
- Project type (Company-managed vs Team-managed)
- Project key (e.g., "PROJ", "DEMO")
- Start issue number (e.g., start from PROJ-100)
- Date range (start date to end date)
- Export chunk size (for splitting large datasets into multiple JSON files)

#### 2. Status Distribution
- Weighted probabilities for "To Do" (default: 40%)
- Weighted probabilities for "In Progress" (default: 30%)
- Weighted probabilities for "Done" (default: 30%)

#### 3. Issue Types Configuration
- **Epic:**
  - Count (number of epics)
  - Children per epic
  - Assign probability (chance to assign to user)
  - Label probability (chance to add labels)
  - Child type distribution (Story/Task/Bug percentages)
- **Story, Task, Bug:**
  - Standalone count (outside epics)
  - Assign probability
  - Label probability

#### 4. Data Options
- Custom assignee list (email addresses)
- Priority selection (Low, Medium, High, Highest)
- Custom labels (with add/remove functionality)

#### 5. Sprint Settings
- Start sprint number
- Sprint duration (in days)
- Sprint assignment probability

#### 6. Version Settings
- Start version number
- Version count
- Version assignment probability

#### 7. Worklog Settings
- Worklog probability (chance a task has worklogs)
- Min/max hours per worklog entry
- Min/max worklog count per task

#### 8. UI Features
- LocalStorage persistence with auto-save
- Master-detail layout for issue types
- Preview table showing first 50 items
- Multi-select dropdowns with search
- Probability sliders (0-100%)
- Export with chunking support (ZIP archives)

#### 9. Advanced Features
- Team-managed project support with ParentKey custom field
- Epic-child relationship preservation in chunked exports
- Task templates with modifiers for realistic summaries
- Sprint state calculation (ACTIVE, CLOSED, FUTURE)
- Version release date generation

### Gap Analysis

| Feature | Current | Reference | Gap |
|---------|---------|-----------|-----|
| Project count control | ✅ | ✅ | None |
| Issues per project | ✅ | ✅ | None |
| Project key customization | ❌ | ✅ | **Missing** |
| Project type (company/team) | ❌ | ✅ | **Missing** |
| Status distribution | ❌ | ✅ | **Missing** |
| Epic configuration | ❌ | ✅ | **Missing** |
| Epic-child relationships | ❌ | ✅ | **Missing** |
| Assignee customization | ❌ | ✅ | **Missing** |
| Priority filtering | ❌ | ✅ | **Missing** |
| Label customization | ❌ | ✅ | **Missing** |
| Sprint configuration | ❌ | ✅ | **Missing** |
| Version configuration | ❌ | ✅ | **Missing** |
| Worklog configuration | ❌ | ✅ | **Missing** |
| Probability controls | ❌ | ✅ | **Missing** |
| Date range control | ❌ | ✅ | **Missing** |
| Export chunking | ❌ | ✅ | **Missing** |
| UI preview table | ❌ | ✅ | **Missing** |

**Summary:** 14 of 16 features are missing from the current implementation.

---

## Configuration Schema Design

### Extended Configuration Interface

**Location:** `packages/core/src/config/types.ts`

```typescript
export interface JiraMockConfig {
  version: '1.0';
  seed?: number;

  // ========== GENERAL SETTINGS ==========
  general?: {
    projectKey?: string;              // Default: 'PROJ'
    projectType?: ProjectType;        // Default: 'company-managed'
    startIssueNumber?: number;        // Default: 1
    startDate?: string;                // ISO date, default: 6 months ago
    endDate?: string;                  // ISO date, default: today
    chunkSize?: number;                // 0 = no chunking, default: 0
  };

  // ========== STATUS DISTRIBUTION ==========
  statusDistribution?: {
    toDo?: number;                     // 0-1, default: 0.4
    inProgress?: number;               // 0-1, default: 0.3
    done?: number;                     // 0-1, default: 0.3
  };

  // ========== ISSUE TYPES ==========
  issueTypes?: {
    epic?: EpicConfig;
    story?: IssueTypeConfig;
    task?: IssueTypeConfig;
    bug?: IssueTypeConfig;
  };

  // ========== SPRINT CONFIGURATION ==========
  sprints?: {
    startNumber?: number;              // Default: 1
    duration?: number;                 // Days, default: 14
    assignProbability?: number;        // 0-1, default: 0.7
  };

  // ========== VERSION CONFIGURATION ==========
  versions?: {
    startNumber?: number;              // Default: 1
    count?: number;                    // Default: 3
    assignProbability?: number;        // 0-1, default: 0.6
  };

  // ========== WORKLOG CONFIGURATION ==========
  worklogs?: {
    probability?: number;              // 0-1, default: 0.6
    hoursMin?: number;                 // Default: 1
    hoursMax?: number;                 // Default: 4
    countMin?: number;                 // Default: 1
    countMax?: number;                 // Default: 3
  };

  // ========== DATA OPTIONS ==========
  data?: {
    assignees?: string[];              // Email addresses
    priorities?: string[];             // Priority names to include
    labels?: string[];                 // Available labels
  };

  // ========== LEGACY (REQUIRED) ==========
  projects: {
    count: number;                     // 1-100
    issuesPerProject: number;          // 1-10000
  };
}

export type ProjectType = 'company-managed' | 'team-managed';

export interface EpicConfig {
  count?: number;                      // Default: 10
  childrenPerEpic?: number;            // Default: 100
  assignProbability?: number;          // 0-1, default: 0.9
  labelProbability?: number;           // 0-1, default: 0.8
  childDistribution?: {
    story?: number;                    // 0-1, default: 0.5
    task?: number;                     // 0-1, default: 0.3
    bug?: number;                      // 0-1, default: 0.2
  };
}

export interface IssueTypeConfig {
  standaloneCount?: number;            // Default: 0
  assignProbability?: number;          // Default: 0.8 (0.6 for bugs)
  labelProbability?: number;           // Default: 0.5 (0.3 for bugs)
}
```

### Zod Validation Schema

**Location:** `packages/core/src/config/schema.ts`

```typescript
import { z } from 'zod';

const ProjectTypeSchema = z.enum(['company-managed', 'team-managed']);

const GeneralConfigSchema = z.object({
  projectKey: z.string().min(1).max(10).optional(),
  projectType: ProjectTypeSchema.optional(),
  startIssueNumber: z.number().int().min(1).max(999999).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  chunkSize: z.number().int().min(0).max(10000).optional(),
});

const StatusDistributionSchema = z.object({
  toDo: z.number().min(0).max(1).optional(),
  inProgress: z.number().min(0).max(1).optional(),
  done: z.number().min(0).max(1).optional(),
});

const EpicConfigSchema = z.object({
  count: z.number().int().min(0).max(1000).optional(),
  childrenPerEpic: z.number().int().min(0).max(10000).optional(),
  assignProbability: z.number().min(0).max(1).optional(),
  labelProbability: z.number().min(0).max(1).optional(),
  childDistribution: z.object({
    story: z.number().min(0).max(1).optional(),
    task: z.number().min(0).max(1).optional(),
    bug: z.number().min(0).max(1).optional(),
  }).optional(),
});

const IssueTypeConfigSchema = z.object({
  standaloneCount: z.number().int().min(0).max(10000).optional(),
  assignProbability: z.number().min(0).max(1).optional(),
  labelProbability: z.number().min(0).max(1).optional(),
});

const IssueTypesConfigSchema = z.object({
  epic: EpicConfigSchema.optional(),
  story: IssueTypeConfigSchema.optional(),
  task: IssueTypeConfigSchema.optional(),
  bug: IssueTypeConfigSchema.optional(),
});

const SprintsConfigSchema = z.object({
  startNumber: z.number().int().min(1).max(999).optional(),
  duration: z.number().int().min(1).max(30).optional(),
  assignProbability: z.number().min(0).max(1).optional(),
});

const VersionsConfigSchema = z.object({
  startNumber: z.number().int().min(1).max(999).optional(),
  count: z.number().int().min(0).max(20).optional(),
  assignProbability: z.number().min(0).max(1).optional(),
});

const WorklogsConfigSchema = z.object({
  probability: z.number().min(0).max(1).optional(),
  hoursMin: z.number().min(0.5).max(24).optional(),
  hoursMax: z.number().min(0.5).max(24).optional(),
  countMin: z.number().int().min(0).max(100).optional(),
  countMax: z.number().int().min(0).max(100).optional(),
});

const DataConfigSchema = z.object({
  assignees: z.array(z.string().email()).optional(),
  priorities: z.array(z.string()).optional(),
  labels: z.array(z.string()).optional(),
});

export const JiraMockConfigSchema = z.object({
  version: z.literal('1.0'),
  seed: z.number().int().optional(),
  general: GeneralConfigSchema.optional(),
  statusDistribution: StatusDistributionSchema.optional(),
  issueTypes: IssueTypesConfigSchema.optional(),
  sprints: SprintsConfigSchema.optional(),
  versions: VersionsConfigSchema.optional(),
  worklogs: WorklogsConfigSchema.optional(),
  data: DataConfigSchema.optional(),
  projects: z.object({
    count: z.number().int().min(1).max(100),
    issuesPerProject: z.number().int().min(1).max(10000),
  }),
});

export type JiraMockConfigInput = z.input<typeof JiraMockConfigSchema>;
export type JiraMockConfigOutput = z.output<typeof JiraMockConfigSchema>;
```

### Default Values

**Location:** `packages/core/src/config/defaults.ts` (new file)

```typescript
import type { JiraMockConfig } from './types.js';

export const DEFAULT_CONFIG: Required<Omit<JiraMockConfig, 'seed'>> = {
  version: '1.0',

  general: {
    projectKey: 'PROJ',
    projectType: 'company-managed',
    startIssueNumber: 1,
    startDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(), // 6 months ago
    endDate: new Date().toISOString(),
    chunkSize: 0,
  },

  statusDistribution: {
    toDo: 0.4,
    inProgress: 0.3,
    done: 0.3,
  },

  issueTypes: {
    epic: {
      count: 10,
      childrenPerEpic: 100,
      assignProbability: 0.9,
      labelProbability: 0.8,
      childDistribution: {
        story: 0.5,
        task: 0.3,
        bug: 0.2,
      },
    },
    story: {
      standaloneCount: 0,
      assignProbability: 0.8,
      labelProbability: 0.5,
    },
    task: {
      standaloneCount: 0,
      assignProbability: 0.8,
      labelProbability: 0.5,
    },
    bug: {
      standaloneCount: 0,
      assignProbability: 0.6,
      labelProbability: 0.3,
    },
  },

  sprints: {
    startNumber: 1,
    duration: 14,
    assignProbability: 0.7,
  },

  versions: {
    startNumber: 1,
    count: 3,
    assignProbability: 0.6,
  },

  worklogs: {
    probability: 0.6,
    hoursMin: 1,
    hoursMax: 4,
    countMin: 1,
    countMax: 3,
  },

  data: {
    assignees: [],
    priorities: ['Low', 'Medium', 'High', 'Highest'],
    labels: ['frontend', 'backend', 'api', 'bug', 'enhancement'],
  },

  projects: {
    count: 1,
    issuesPerProject: 100,
  },
};

/**
 * Merges user config with defaults
 */
export function mergeWithDefaults(config: JiraMockConfig): Required<Omit<JiraMockConfig, 'seed'>> & { seed?: number } {
  return {
    ...DEFAULT_CONFIG,
    ...config,
    general: { ...DEFAULT_CONFIG.general, ...config.general },
    statusDistribution: { ...DEFAULT_CONFIG.statusDistribution, ...config.statusDistribution },
    issueTypes: {
      epic: { ...DEFAULT_CONFIG.issueTypes.epic, ...config.issueTypes?.epic },
      story: { ...DEFAULT_CONFIG.issueTypes.story, ...config.issueTypes?.story },
      task: { ...DEFAULT_CONFIG.issueTypes.task, ...config.issueTypes?.task },
      bug: { ...DEFAULT_CONFIG.issueTypes.bug, ...config.issueTypes?.bug },
    },
    sprints: { ...DEFAULT_CONFIG.sprints, ...config.sprints },
    versions: { ...DEFAULT_CONFIG.versions, ...config.versions },
    worklogs: { ...DEFAULT_CONFIG.worklogs, ...config.worklogs },
    data: { ...DEFAULT_CONFIG.data, ...config.data },
  };
}
```

---

## Implementation Phases

### Phase 1: Core Foundation (Week 1)

**Goal:** Extend configuration schema and add default value handling

#### Tasks:

1. **Create new types** (`packages/core/src/config/types.ts`)
   - [ ] Add `ProjectType` enum
   - [ ] Add `GeneralConfig` interface
   - [ ] Add `StatusDistribution` interface
   - [ ] Add `EpicConfig` interface
   - [ ] Add `IssueTypeConfig` interface
   - [ ] Add `SprintsConfig` interface
   - [ ] Add `VersionsConfig` interface
   - [ ] Add `WorklogsConfig` interface
   - [ ] Add `DataConfig` interface
   - [ ] Update `JiraMockConfig` interface

2. **Create validation schema** (`packages/core/src/config/schema.ts`)
   - [ ] Add all Zod schemas for new config sections
   - [ ] Add custom validation rules (e.g., date range validation)
   - [ ] Add cross-field validation (e.g., hoursMin <= hoursMax)

3. **Create defaults file** (`packages/core/src/config/defaults.ts`)
   - [ ] Define `DEFAULT_CONFIG` constant
   - [ ] Implement `mergeWithDefaults()` function
   - [ ] Add unit tests for merge logic

4. **Update validator** (`packages/core/src/config/validator.ts`)
   - [ ] Update `validateConfig()` to use new schema
   - [ ] Add helpful error messages
   - [ ] Add custom validators for complex rules

#### Deliverables:
- Extended type definitions
- Complete Zod validation schema
- Default configuration values
- Updated validation logic
- Unit tests for validation

---

### Phase 2: Generator Modifications (Week 2)

**Goal:** Update all generators to use new configuration options

#### Tasks:

1. **Issue Generator** (`packages/core/src/generators/issue.generator.ts`)
   - [ ] Add probability-based assignment logic
   - [ ] Add weighted status distribution
   - [ ] Add epic generation with configurable count
   - [ ] Add epic-child relationship handling
   - [ ] Add child type distribution (Story/Task/Bug percentages)
   - [ ] Add standalone issue generation
   - [ ] Add team-managed ParentKey custom field support
   - [ ] Add label probability logic
   - [ ] Add date range generation
   - [ ] Add task template system with realistic summaries

2. **Worklog Generator** (`packages/core/src/generators/worklog.generator.ts`)
   - [ ] Add probability-based generation
   - [ ] Add configurable hour ranges (min/max)
   - [ ] Add configurable count ranges (min/max)
   - [ ] Add realistic worklog timestamps (working hours)
   - [ ] Add random worklog comments from template

3. **Version Generator** (`packages/core/src/generators/version.generator.ts`)
   - [ ] Add configurable start number
   - [ ] Add configurable count
   - [ ] Add release date generation based on date range
   - [ ] Add version state (released vs unreleased)
   - [ ] Add version assignment probability

4. **Project Generator** (`packages/core/src/generators/project.generator.ts`)
   - [ ] Add custom project key support
   - [ ] Add project type (company-managed vs team-managed)
   - [ ] Add sprint generation based on date ranges
   - [ ] Add sprint state calculation (ACTIVE, CLOSED, FUTURE)
   - [ ] Add sprint assignment to issues

5. **User Generator** (`packages/core/src/generators/user.generator.ts`)
   - [ ] Add custom assignee list support
   - [ ] Fallback to generated users if custom list is empty
   - [ ] Validate email format for custom assignees

6. **Priority Generator** (`packages/core/src/generators/priority.generator.ts`)
   - [ ] Add priority filtering based on config
   - [ ] Ensure at least one priority is available

7. **Create Helper Utilities** (`packages/core/src/generators/utils/probability.ts`)
   - [ ] `shouldApply(probability: number): boolean` - Random boolean based on probability
   - [ ] `weightedPick<T>(weights: Record<string, number>): string` - Pick item by weight
   - [ ] `randomInRange(min: number, max: number): number` - Random number in range

#### Deliverables:
- Updated generators with probability logic
- Epic-child relationship support
- Team-managed project support
- Realistic data generation
- Utility functions for probability
- Unit tests for all generators

---

### Phase 3: UI Components & Sections (Week 3)

**Goal:** Build new UI components and configuration sections

#### Part A: Base UI Components

1. **Slider Component** (`packages/config-ui/src/components/ui/slider.tsx`)
   - [ ] Create range slider with thumb
   - [ ] Add value display
   - [ ] Add min/max/step props
   - [ ] Add disabled state
   - [ ] Style with Tailwind CSS

2. **Probability Slider Component** (`packages/config-ui/src/components/ui/probability-slider.tsx`)
   - [ ] Wrap slider with 0-1 range
   - [ ] Display as percentage (0-100%)
   - [ ] Add label and help text props

3. **Multi-Select Component** (`packages/config-ui/src/components/ui/multi-select.tsx`)
   - [ ] Create dropdown with checkbox list
   - [ ] Add search/filter functionality
   - [ ] Add "Add item" input (optional)
   - [ ] Add "Remove item" button (optional)
   - [ ] Add "Select all" / "Clear all" buttons
   - [ ] Show selected count in header
   - [ ] Handle click outside to close

4. **Date Picker Component** (`packages/config-ui/src/components/ui/date-picker.tsx`)
   - [ ] Use HTML5 date input
   - [ ] Add calendar icon
   - [ ] Handle ISO date format
   - [ ] Add min/max validation

5. **Tabs Component** (`packages/config-ui/src/components/ui/tabs.tsx`)
   - [ ] Create tab navigation
   - [ ] Create tab content panels
   - [ ] Add active state styling
   - [ ] Support keyboard navigation

#### Part B: Configuration Sections

1. **General Section** (`packages/config-ui/src/components/ConfigEditor/GeneralSection.tsx`)
   - [ ] Project type selector (Company-managed / Team-managed)
   - [ ] Project key text input (max 10 chars)
   - [ ] Start issue number input
   - [ ] Start date picker
   - [ ] End date picker
   - [ ] Chunk size input
   - [ ] Add validation and help text
   - [ ] Add team-managed info banner

2. **Status Distribution Section** (`packages/config-ui/src/components/ConfigEditor/StatusSection.tsx`)
   - [ ] Three probability sliders (To Do, In Progress, Done)
   - [ ] Display total (should sum to ~1.0)
   - [ ] Add normalization helper
   - [ ] Add visual distribution bar

3. **Issue Types Section** (`packages/config-ui/src/components/ConfigEditor/IssueTypesSection.tsx`)
   - [ ] Master-detail layout with tabs (Epic, Story, Task, Bug)
   - [ ] **Epic Panel:**
     - Count input
     - Children per epic input
     - Assign probability slider
     - Label probability slider
     - Child distribution section (Story/Task/Bug sliders with total)
   - [ ] **Story/Task/Bug Panels:**
     - Standalone count input
     - Assign probability slider
     - Label probability slider

4. **Sprint Section** (`packages/config-ui/src/components/ConfigEditor/SprintSection.tsx`)
   - [ ] Start number input
   - [ ] Duration input (days)
   - [ ] Assignment probability slider
   - [ ] Show calculated sprint count based on date range

5. **Version Section** (`packages/config-ui/src/components/ConfigEditor/VersionSection.tsx`)
   - [ ] Start number input
   - [ ] Count input
   - [ ] Assignment probability slider

6. **Worklog Section** (`packages/config-ui/src/components/ConfigEditor/WorklogSection.tsx`)
   - [ ] Probability slider
   - [ ] Hours min input
   - [ ] Hours max input
   - [ ] Count min input
   - [ ] Count max input
   - [ ] Add validation (min <= max)

7. **Data Options Section** (`packages/config-ui/src/components/ConfigEditor/DataSection.tsx`)
   - [ ] Assignees multi-select with email input
   - [ ] Email validation
   - [ ] Priorities multi-select (predefined list)
   - [ ] Labels multi-select with add/remove

#### Part C: Update Main Editor

**File:** `packages/config-ui/src/components/ConfigEditor/index.tsx`

- [ ] Add all new sections to main editor
- [ ] Update state management for new config fields
- [ ] Add section collapsing/expanding (accordion)
- [ ] Update validation to use new schema

#### Deliverables:
- 5 new base UI components
- 7 new configuration sections
- Updated main config editor
- Component unit tests
- Storybook stories (optional)

---

### Phase 4: Enhanced Features (Week 4)

**Goal:** Add export chunking, preview enhancements, and polish

#### Tasks:

1. **Export Manager** (`packages/config-ui/src/lib/export-manager.ts`)
   - [ ] Implement chunking algorithm
   - [ ] Group epics with children in same chunk
   - [ ] Use JSZip to create ZIP archives
   - [ ] Add chunk naming (e.g., `jira-data-1-100.json`, `jira-data-101-200.json`)
   - [ ] Add single JSON export (when chunkSize = 0)
   - [ ] Add progress indicator during export

2. **Preview Section Enhancements** (`packages/config-ui/src/components/ConfigEditor/PreviewSection.tsx`)
   - [ ] Add table with columns: Key, Summary, Type, Status, Priority, Assignee, Labels, Parent, Start Date, Due Date, Sprint, Version
   - [ ] Show first 50 items
   - [ ] Add "Showing X of Y" indicator
   - [ ] Add sorting by column (optional)
   - [ ] Add filtering by issue type (optional)
   - [ ] Show parent-child relationships visually (indentation or icon)

3. **LocalStorage Improvements** (`packages/config-ui/src/lib/config-manager.ts`)
   - [ ] Implement auto-save on config change (debounced to 500ms)
   - [ ] Add version migration support
   - [ ] Handle localStorage quota exceeded errors
   - [ ] Add clear/reset functionality

4. **Validation Improvements**
   - [ ] Add real-time validation feedback
   - [ ] Show field-level errors
   - [ ] Add helpful error messages
   - [ ] Add warning for large issue counts

5. **Documentation**
   - [ ] Update README with new configuration options
   - [ ] Add configuration examples
   - [ ] Add migration guide
   - [ ] Add API documentation for new interfaces

#### Deliverables:
- Export chunking with ZIP support
- Enhanced preview table
- Auto-save functionality
- Improved validation UX
- Complete documentation

---

### Phase 5: Testing & Documentation (Ongoing)

**Goal:** Ensure quality and provide comprehensive documentation

#### Testing Tasks:

1. **Unit Tests**
   - [ ] Config schema validation tests
   - [ ] Default merge logic tests
   - [ ] Generator probability tests
   - [ ] Epic-child relationship tests
   - [ ] Worklog generation tests
   - [ ] Sprint generation tests
   - [ ] Version generation tests
   - [ ] UI component tests

2. **Integration Tests**
   - [ ] End-to-end config to data generation
   - [ ] Team-managed project tests
   - [ ] Company-managed project tests
   - [ ] Export chunking tests
   - [ ] LocalStorage persistence tests

3. **Example Configurations**
   - [ ] Small project (10 epics, 100 children each)
   - [ ] Large project (100 epics, 1000 children each)
   - [ ] Team-managed project
   - [ ] Company-managed with full features
   - [ ] Minimal config (backward compatibility)

#### Documentation Tasks:

1. **README Updates**
   - [ ] Add new configuration section
   - [ ] Add examples for each config option
   - [ ] Add screenshots of new UI
   - [ ] Add migration guide

2. **API Documentation**
   - [ ] Document all new interfaces
   - [ ] Document all new types
   - [ ] Document generator changes
   - [ ] Add JSDoc comments

3. **Migration Guide**
   - [ ] Simple to advanced config
   - [ ] Breaking changes (none expected)
   - [ ] New features overview
   - [ ] Troubleshooting section

#### Deliverables:
- Comprehensive test suite (>80% coverage)
- Updated documentation
- Example configurations
- Migration guide

---

## File Modifications

### Core Package (`packages/core/`)

#### New Files:
- `src/config/defaults.ts` - Default configuration values
- `src/generators/utils/probability.ts` - Probability utility functions
- `src/generators/utils/templates.ts` - Task summary templates

#### Modified Files:
- `src/config/types.ts` - Extended configuration interface
- `src/config/schema.ts` - Extended Zod validation schema
- `src/config/validator.ts` - Updated validation logic
- `src/generators/issue.generator.ts` - Probability-based generation, epic-child relationships
- `src/generators/worklog.generator.ts` - Configurable ranges and probabilities
- `src/generators/version.generator.ts` - Configurable numbering and count
- `src/generators/project.generator.ts` - Sprint generation, project types
- `src/generators/user.generator.ts` - Custom assignee support
- `src/generators/priority.generator.ts` - Priority filtering
- `src/types/generator.types.ts` - Additional context types
- `src/index.ts` - Export new types and utilities

### Config UI Package (`packages/config-ui/`)

#### New Files:

**Base UI Components:**
- `src/components/ui/slider.tsx`
- `src/components/ui/probability-slider.tsx`
- `src/components/ui/multi-select.tsx`
- `src/components/ui/date-picker.tsx`
- `src/components/ui/tabs.tsx`

**Configuration Sections:**
- `src/components/ConfigEditor/GeneralSection.tsx`
- `src/components/ConfigEditor/StatusSection.tsx`
- `src/components/ConfigEditor/IssueTypesSection.tsx`
- `src/components/ConfigEditor/SprintSection.tsx`
- `src/components/ConfigEditor/VersionSection.tsx`
- `src/components/ConfigEditor/WorklogSection.tsx`
- `src/components/ConfigEditor/DataSection.tsx`

**Utilities:**
- `src/lib/export-manager.ts`

#### Modified Files:
- `src/components/ConfigEditor/index.tsx` - Add new sections
- `src/components/ConfigEditor/PreviewSection.tsx` - Enhanced preview table
- `src/lib/config-manager.ts` - Auto-save, version migration
- `src/app/page.tsx` - Update layout if needed

### Documentation Files

#### New Files:
- `docs/configuration.md` - Detailed configuration guide
- `docs/migration.md` - Migration guide
- `docs/examples/` - Example configurations

#### Modified Files:
- `README.md` - Updated features and configuration section
- `packages/core/README.md` - Updated API documentation
- `packages/config-ui/README.md` - Updated UI documentation

---

## Backward Compatibility

### Strategy

**No Breaking Changes:** The implementation maintains full backward compatibility by:

1. **Required fields remain required:**
   - `version: '1.0'`
   - `projects.count`
   - `projects.issuesPerProject`

2. **All new fields are optional:**
   - Every new configuration section has `?` (optional)
   - Default values are used when fields are omitted

3. **Progressive enhancement:**
   - Old configs work without modification
   - New features can be adopted incrementally

### Migration Path

#### Old Config (Still Valid)
```json
{
  "version": "1.0",
  "projects": {
    "count": 3,
    "issuesPerProject": 50
  }
}
```

**Behavior:** Generates 3 projects with 50 random issues each (current behavior).

#### New Config (Basic Enhancement)
```json
{
  "version": "1.0",
  "projects": {
    "count": 1,
    "issuesPerProject": 1010
  },
  "general": {
    "projectKey": "DEMO"
  },
  "issueTypes": {
    "epic": {
      "count": 10,
      "childrenPerEpic": 100
    }
  }
}
```

**Behavior:** Generates 1 project named "DEMO" with 10 epics, each containing 100 children (1000 issues) + 10 standalone issues.

#### New Config (Full Featured)
```json
{
  "version": "1.0",
  "seed": 12345,
  "general": {
    "projectKey": "PROJ",
    "projectType": "company-managed",
    "startIssueNumber": 100,
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-12-31T23:59:59Z",
    "chunkSize": 100
  },
  "statusDistribution": {
    "toDo": 0.4,
    "inProgress": 0.3,
    "done": 0.3
  },
  "issueTypes": {
    "epic": {
      "count": 10,
      "childrenPerEpic": 100,
      "assignProbability": 0.9,
      "labelProbability": 0.8,
      "childDistribution": {
        "story": 0.5,
        "task": 0.3,
        "bug": 0.2
      }
    },
    "story": {
      "standaloneCount": 20,
      "assignProbability": 0.8,
      "labelProbability": 0.5
    }
  },
  "sprints": {
    "startNumber": 5,
    "duration": 14,
    "assignProbability": 0.7
  },
  "versions": {
    "startNumber": 2,
    "count": 5,
    "assignProbability": 0.6
  },
  "worklogs": {
    "probability": 0.6,
    "hoursMin": 1,
    "hoursMax": 8,
    "countMin": 1,
    "countMax": 5
  },
  "data": {
    "assignees": [
      "john.doe@example.com",
      "jane.smith@example.com"
    ],
    "priorities": ["High", "Highest"],
    "labels": ["frontend", "backend", "critical"]
  },
  "projects": {
    "count": 1,
    "issuesPerProject": 1020
  }
}
```

**Behavior:** Full-featured configuration with all options enabled.

### Validation Strategy

**Multi-level validation:**

1. **Schema validation:** Zod validates types and ranges
2. **Logical validation:** Cross-field validation (e.g., dates, min/max)
3. **Warning validation:** Non-blocking warnings for large issue counts
4. **Default fallback:** Missing fields use sensible defaults

### Version Migration

If future versions introduce breaking changes, migration will be handled:

```typescript
function migrateConfig(config: any): JiraMockConfig {
  if (config.version === '1.0') {
    return config; // No migration needed
  }

  // Future: handle migration from older versions
  throw new Error(`Unsupported config version: ${config.version}`);
}
```

---

## Technical Decisions

### 1. Schema Validation: Zod

**Decision:** Use Zod for runtime validation with TypeScript inference

**Rationale:**
- Type-safe validation
- Automatic TypeScript type inference
- Excellent error messages
- Tree-shakeable and lightweight
- Already used in the project

**Alternatives Considered:**
- JSON Schema - Less TypeScript integration
- Yup - Similar but Zod has better TS support
- Manual validation - Error-prone and verbose

### 2. Date Handling

**Decision:** Store dates as ISO 8601 strings, convert to Date objects in generators

**Rationale:**
- JSON-serializable
- Timezone-aware
- Standardized format
- Easy to parse and validate

**Format:** `YYYY-MM-DDTHH:mm:ss.sssZ` or `YYYY-MM-DD` for dates only

### 3. Probability Values

**Decision:** Store as decimals (0-1), display as percentages (0-100%)

**Rationale:**
- Mathematical operations easier with decimals
- Standard probability representation
- UI can convert for display without changing data

**Implementation:**
```typescript
// Storage: 0.75
// Display: 75%
const displayValue = Math.round(probability * 100);
const storageValue = displayValue / 100;
```

### 4. Epic-Child Relationships

**Decision:** Use different strategies for company-managed vs team-managed projects

**Company-Managed:**
- Use `parent` field with numeric ID reference
- Native Jira support for epic-child relationships

**Team-Managed:**
- Use `customFieldValues` array with `ParentKey` field
- Store parent issue key as string (e.g., "PROJ-1")
- Jira automation can use this field to link issues

**Rationale:**
- Matches actual Jira behavior
- Provides flexibility for both project types
- Allows users to test both scenarios

### 5. Export Chunking

**Decision:** Group epics with their children in the same chunk

**Rationale:**
- Maintains referential integrity
- Prevents broken parent-child links
- Makes import easier
- Allows parallel processing of chunks

**Algorithm:**
```
1. Separate epics from children
2. For each epic:
   a. Add epic to current chunk
   b. Add all children to current chunk
   c. If chunk exceeds size, start new chunk (but keep current epic group together)
3. Export each chunk as separate JSON file
4. Create ZIP archive with all chunks
```

### 6. Issue Count Calculation

**Decision:** `issuesPerProject` is calculated from epic configuration when epics are used

**Formula:**
```
issuesPerProject = (epicCount * (childrenPerEpic + 1)) + standaloneStories + standaloneTasks + standaloneBugs
```

**Note:** The `+1` accounts for the epic issue itself.

**Rationale:**
- Prevents configuration mismatch
- Makes total issue count predictable
- Backwards compatible (when no epic config, uses direct count)

### 7. Default Configuration Strategy

**Decision:** Provide comprehensive defaults for all optional fields

**Rationale:**
- Simplifies configuration for common use cases
- Reduces boilerplate in config files
- Makes examples cleaner
- Maintains backward compatibility

**Implementation:** See `packages/core/src/config/defaults.ts`

### 8. UI Component Library

**Decision:** Continue using shadcn/ui components with Tailwind CSS

**Rationale:**
- Already in use in the project
- Highly customizable
- Accessible by default
- No additional dependencies
- Copy-paste component pattern

### 9. State Management (UI)

**Decision:** Use React useState for local component state, lift state to parent for shared config

**Rationale:**
- Simple and sufficient for this use case
- No need for Redux/Zustand/Jotai
- Easy to understand and maintain
- Follows React best practices

### 10. LocalStorage Schema

**Decision:** Store entire config as single JSON object in localStorage

**Key:** `jira-mock-config`

**Format:**
```json
{
  "version": "1.0",
  "lastModified": "2024-01-15T10:30:00Z",
  "config": { /* JiraMockConfig */ }
}
```

**Rationale:**
- Simple to implement
- Easy to export/import
- Version tracking for future migrations
- Single source of truth

---

## Testing Strategy

### Unit Tests

**Core Package:**

1. **Configuration Tests** (`packages/core/src/config/*.test.ts`)
   - Schema validation for all fields
   - Default value merging
   - Cross-field validation (dates, min/max)
   - Error message clarity

2. **Generator Tests** (`packages/core/src/generators/*.test.ts`)
   - Probability logic accuracy
   - Epic-child relationships
   - Team-managed vs company-managed
   - Date range adherence
   - Worklog generation
   - Sprint generation
   - Version generation

3. **Utility Tests** (`packages/core/src/generators/utils/*.test.ts`)
   - Probability functions
   - Random ranges
   - Weighted selection

**Config UI Package:**

1. **Component Tests** (`packages/config-ui/src/components/**/*.test.tsx`)
   - Render tests for all components
   - User interaction tests
   - Validation feedback
   - State updates

2. **Integration Tests** (`packages/config-ui/src/__tests__/integration/*.test.tsx`)
   - Full config editor workflow
   - Export/import functionality
   - LocalStorage persistence
   - Preview generation

### Integration Tests

**End-to-End Scenarios:**

1. **Simple Configuration:**
   - Input: Basic config with only required fields
   - Output: Generated data matches expectations
   - Validation: Issue count, types, fields

2. **Advanced Configuration:**
   - Input: Full config with all options
   - Output: Generated data reflects all settings
   - Validation: Probabilities, distributions, relationships

3. **Team-Managed Project:**
   - Input: Config with `projectType: 'team-managed'`
   - Output: Issues have ParentKey custom field
   - Validation: No `parent` field, custom field present

4. **Export Chunking:**
   - Input: Config with large issue count and chunk size
   - Output: Multiple JSON files in ZIP
   - Validation: Epic-child groups intact, no split relationships

### Test Coverage Goals

- **Core Package:** >90% coverage
- **Config UI Package:** >80% coverage
- **Integration Tests:** All critical paths covered

### Test Data

**Fixtures:**
- Small config (10 issues)
- Medium config (100 issues)
- Large config (10,000 issues)
- Epic-heavy config
- Standalone-heavy config
- Team-managed config
- Company-managed config

---

## Migration Guide

### For Users

#### No Changes Required

If you have an existing configuration, it will continue to work without modification:

```json
{
  "version": "1.0",
  "projects": {
    "count": 3,
    "issuesPerProject": 50
  }
}
```

This will still generate 3 projects with 50 issues each.

#### Adopting New Features

You can progressively adopt new features:

**Step 1: Customize Project Key**
```json
{
  "version": "1.0",
  "general": {
    "projectKey": "MYPROJ"
  },
  "projects": {
    "count": 1,
    "issuesPerProject": 50
  }
}
```

**Step 2: Add Epics**
```json
{
  "version": "1.0",
  "general": {
    "projectKey": "MYPROJ"
  },
  "issueTypes": {
    "epic": {
      "count": 5,
      "childrenPerEpic": 10
    }
  },
  "projects": {
    "count": 1,
    "issuesPerProject": 55
  }
}
```

**Step 3: Configure Probabilities**
```json
{
  "version": "1.0",
  "general": {
    "projectKey": "MYPROJ"
  },
  "statusDistribution": {
    "toDo": 0.5,
    "inProgress": 0.3,
    "done": 0.2
  },
  "issueTypes": {
    "epic": {
      "count": 5,
      "childrenPerEpic": 10,
      "assignProbability": 0.9
    }
  },
  "projects": {
    "count": 1,
    "issuesPerProject": 55
  }
}
```

### For Developers

#### Updated Imports

```typescript
// Before
import type { JiraMockConfig } from '@jira-mock/core';

// After (same import, extended type)
import type { JiraMockConfig } from '@jira-mock/core';

// New exports available
import { mergeWithDefaults, DEFAULT_CONFIG } from '@jira-mock/core';
```

#### Generator Context

Generators now have access to full configuration:

```typescript
// Before
context.config.projects.count

// After (additional fields available)
context.config.general?.projectKey
context.config.issueTypes?.epic?.count
context.config.statusDistribution?.toDo
```

#### Custom Field Access

For team-managed projects:

```typescript
const parentKeyField = issue.fields.customFieldValues?.find(
  field => field.fieldName === 'ParentKey'
);
const parentKey = parentKeyField?.value;
```

---

## Timeline

### Week 1: Core Foundation
- **Days 1-2:** Type definitions and schema
- **Days 3-4:** Default values and validation
- **Day 5:** Unit tests and documentation

### Week 2: Generators
- **Days 1-2:** Issue generator (epics, children, probabilities)
- **Day 3:** Worklog, version, sprint generators
- **Day 4:** Project, user, priority generators
- **Day 5:** Integration tests

### Week 3: UI Components
- **Days 1-2:** Base UI components (slider, multi-select, etc.)
- **Days 3-4:** Configuration sections
- **Day 5:** Main editor updates and testing

### Week 4: Polish
- **Days 1-2:** Export chunking and preview enhancements
- **Day 3:** LocalStorage improvements
- **Day 4:** Documentation and examples
- **Day 5:** Final testing and release preparation

---

## Success Criteria

### Functional Requirements
- ✅ All 40+ configuration options implemented
- ✅ Epic-child relationships work correctly
- ✅ Team-managed and company-managed projects supported
- ✅ Export chunking produces valid ZIP archives
- ✅ Preview shows accurate data
- ✅ LocalStorage persistence works reliably
- ✅ Backward compatibility maintained (old configs work)

### Quality Requirements
- ✅ >90% test coverage in core package
- ✅ >80% test coverage in config UI package
- ✅ All integration tests passing
- ✅ No TypeScript errors
- ✅ No linting errors
- ✅ Documentation complete

### Performance Requirements
- ✅ UI remains responsive with large configurations
- ✅ Export completes within reasonable time (<10s for 10,000 issues)
- ✅ Preview renders quickly (<2s for 50 items)

---

## Risks & Mitigation

### Risk 1: Complexity Overwhelms Users

**Mitigation:**
- Provide comprehensive defaults
- Show advanced options in collapsible sections
- Include presets for common scenarios
- Provide clear examples and documentation

### Risk 2: Breaking Changes Introduced Accidentally

**Mitigation:**
- Maintain comprehensive test suite
- Test old configs in CI/CD
- Manual testing of examples
- Semantic versioning

### Risk 3: Performance Issues with Large Datasets

**Mitigation:**
- Implement chunking for exports
- Limit preview to 50 items
- Add progress indicators
- Optimize generators

### Risk 4: LocalStorage Quota Exceeded

**Mitigation:**
- Catch quota exceeded errors
- Show user-friendly error message
- Suggest downloading config as JSON
- Implement compression (optional)

---

## Future Enhancements

Beyond the initial implementation, consider:

1. **Configuration Presets**
   - Small project preset
   - Large project preset
   - Team-managed preset
   - Company-managed preset

2. **Visual Configuration**
   - Drag-and-drop issue type builder
   - Visual timeline for sprints
   - Pie chart for distributions

3. **Advanced Features**
   - Sub-tasks support
   - Multiple project configurations
   - Custom field definitions
   - Attachment generation

4. **Import/Export**
   - Import from real Jira instance
   - Export to different formats (CSV, Excel)
   - Configuration templates library

5. **Collaboration**
   - Share configurations via URL
   - Configuration versioning
   - Team workspaces

---

## Conclusion

This implementation plan provides a comprehensive roadmap for extending the Jira Mock Service Worker configuration system to match the feature-rich reference implementation. The plan prioritizes:

- **Backward compatibility** - existing configs continue to work
- **Progressive enhancement** - users adopt features as needed
- **Quality** - comprehensive testing and documentation
- **User experience** - intuitive UI with helpful defaults

By following this phased approach over 4 weeks, we can deliver a powerful, flexible configuration system that meets the needs of both simple and complex testing scenarios.

---

## Appendix: Example Configurations

### Example 1: Small Test Project

```json
{
  "version": "1.0",
  "seed": 42,
  "general": {
    "projectKey": "TEST",
    "projectType": "company-managed"
  },
  "issueTypes": {
    "epic": {
      "count": 3,
      "childrenPerEpic": 10
    }
  },
  "projects": {
    "count": 1,
    "issuesPerProject": 33
  }
}
```

**Output:** 1 project with 3 epics, each containing 10 children (33 total issues).

### Example 2: Large Performance Test

```json
{
  "version": "1.0",
  "general": {
    "projectKey": "PERF",
    "chunkSize": 500
  },
  "issueTypes": {
    "epic": {
      "count": 100,
      "childrenPerEpic": 100
    }
  },
  "projects": {
    "count": 1,
    "issuesPerProject": 10100
  }
}
```

**Output:** 1 project with 100 epics and 10,000 children, exported as multiple JSON files in a ZIP.

### Example 3: Team-Managed Project

```json
{
  "version": "1.0",
  "general": {
    "projectKey": "TEAM",
    "projectType": "team-managed"
  },
  "issueTypes": {
    "epic": {
      "count": 5,
      "childrenPerEpic": 20
    }
  },
  "data": {
    "assignees": [
      "alice@example.com",
      "bob@example.com"
    ]
  },
  "projects": {
    "count": 1,
    "issuesPerProject": 105
  }
}
```

**Output:** Team-managed project with ParentKey custom field for epic-child relationships.

### Example 4: Minimal Configuration (Backward Compatible)

```json
{
  "version": "1.0",
  "projects": {
    "count": 2,
    "issuesPerProject": 25
  }
}
```

**Output:** 2 projects with 25 random issues each (original behavior).
