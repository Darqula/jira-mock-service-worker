# Configuration Examples

This directory contains example configuration files demonstrating various features and use cases of the Jira Mock Service Worker.

## Available Examples

### 1. minimal.json

**Use Case:** Simplest possible configuration with default settings

**Features:**
- Minimal required fields only
- Uses all default values for optional configuration
- 1 project with 50 issues
- Default status distribution, issue types, and probabilities

**Best For:** Quick testing, learning the basics, minimal data generation

---

### 2. small-project.json

**Use Case:** Small team project with basic customization

**Features:**
- Single project with ~55 total issues (45 in epics + 10 standalone)
- 3 epics with 15 children each
- Custom project key ("DEMO")
- Configured status distribution (30% To Do, 50% In Progress, 20% Done)
- Custom assignees (3 team members)
- Sprint support with 2-week sprints
- Version management with 3 versions
- Worklog generation enabled
- Custom labels and priorities
- Full year date range (2024)

**Best For:** Team demos, small project simulation, learning configuration options

**Total Issues:**
- 3 epics
- 45 children (15 per epic)
- 5 standalone stories
- 3 standalone tasks
- 2 standalone bugs
- **Total: ~58 issues**

---

### 3. team-managed.json

**Use Case:** Team-managed (Next-Gen) Jira project

**Features:**
- Team-managed project type
- Uses custom fields for parent relationships
- 5 epics with 20 children each
- Weekly sprints (7 days)
- Higher assignment probabilities (team-managed style)
- 4 team members with company email addresses
- 118 total issues (100 in epics + 18 standalone)
- Extended label and priority lists
- High worklog probability (70%)

**Best For:** Simulating Next-Gen/Team-managed Jira projects, testing parent key custom fields

**Total Issues:**
- 5 epics
- 100 children (20 per epic)
- 10 standalone stories
- 5 standalone tasks
- 3 standalone bugs
- **Total: ~123 issues**

---

### 4. large-project.json

**Use Case:** Large enterprise project with extensive data

**Features:**
- 1,180 issues in epics + 180 standalone = 1,360 total issues
- 20 epics with 50 children each
- Custom start issue number (1000)
- 2-year date range (2023-2024)
- 8 team members
- 12 versions throughout the year
- Chunking enabled (500 issues per chunk)
- High worklog generation (80% probability)
- Extended label system (15 labels)
- Company-managed project type

**Best For:** Performance testing, large dataset generation, chunked export testing

**Total Issues:**
- 20 epics
- 1,000 children (50 per epic)
- 100 standalone stories
- 50 standalone tasks
- 30 standalone bugs
- **Total: ~1,200 issues**

---

### 5. full-featured.json

**Use Case:** Comprehensive example showcasing all configuration options

**Features:**
- Demonstrates all available configuration sections
- Balanced distribution across issue types
- 10 epics with 30 children each
- Chunking enabled (250 issues per chunk)
- Custom seed for reproducibility
- Moderate probabilities for realistic data
- 5 team members
- 6 versions over the year
- Full year timeline (2024)
- Company-managed project

**Best For:** Reference configuration, learning all options, comprehensive testing

**Total Issues:**
- 10 epics
- 300 children (30 per epic)
- 25 standalone stories
- 15 standalone tasks
- 10 standalone bugs
- **Total: ~360 issues**

---

## Configuration Sections Explained

### General
- `projectKey`: Custom project key (default: generated)
- `startIssueNumber`: Starting issue number (default: 1)
- `startDate`: Project start date for issue creation (default: 6 months ago)
- `endDate`: Project end date for issue creation (default: today)
- `projectType`: "company-managed" or "team-managed" (default: company-managed)
- `chunkSize`: Issues per chunk for export (0 = no chunking)

### Status Distribution
Percentage of issues in each status category:
- `toDo`: To Do / Open status (default: 0.3)
- `inProgress`: In Progress / Active status (default: 0.5)
- `done`: Done / Closed status (default: 0.2)

Values should sum to 1.0 (will be normalized if they don't).

### Issue Types

**Epic:**
- `count`: Number of epics to generate
- `childrenPerEpic`: Child issues per epic
- `assignProbability`: Probability of having an assignee (0-1)
- `labelProbability`: Probability of having labels (0-1)
- `childDistribution`: Distribution of child types (story/task/bug)

**Story/Task/Bug:**
- `standaloneCount`: Number of standalone issues (not in epics)
- `assignProbability`: Probability of having an assignee (0-1)
- `labelProbability`: Probability of having labels (0-1)

### Sprints
- `startNumber`: Starting sprint number (default: 1)
- `duration`: Sprint duration in days (default: 14)
- `assignProbability`: Probability of issue being in a sprint (0-1)

Sprints are auto-generated based on date range and duration.

### Versions
- `startNumber`: Starting version number (default: 1)
- `count`: Number of versions to generate (default: 3)
- `assignProbability`: Probability of issue having a fix version (0-1)

### Worklogs
- `probability`: Probability of issue having worklogs (0-1)
- `hoursMin`: Minimum hours per worklog entry
- `hoursMax`: Maximum hours per worklog entry
- `countMin`: Minimum worklog entries per issue
- `countMax`: Maximum worklog entries per issue

### Data
- `assignees`: Array of email addresses for custom assignees
- `priorities`: Array of priority names to use (filters defaults)
- `labels`: Array of label names available for issues

---

## Usage

### Using with CLI

```bash
npm run generate -- --config examples/configs/small-project.json
```

### Using with Node.js

```javascript
import { generateMockData } from '@jira-mock/core';
import fs from 'fs';

const config = JSON.parse(
  fs.readFileSync('examples/configs/small-project.json', 'utf-8')
);

const { dataStore, queryEngine } = generateMockData(config);

// Access generated data
const issues = dataStore.getAllIssues();
const projects = dataStore.getAllProjects();
```

### Using with Config UI

1. Start the config UI: `npm run dev` (in packages/config-ui)
2. Click "Import Configuration"
3. Select one of the example files
4. Preview and modify as needed
5. Export or use with MSW integration

---

## Tips

### Choosing the Right Example

- **Just starting?** Use `minimal.json`
- **Learning features?** Use `small-project.json` or `full-featured.json`
- **Testing team-managed projects?** Use `team-managed.json`
- **Performance testing?** Use `large-project.json`
- **Reference guide?** Use `full-featured.json`

### Customizing Examples

All examples can be customized by:
1. Copying the file
2. Modifying values to suit your needs
3. Running validation: `npm run validate-config your-config.json`

### Reproducibility

The `seed` field ensures reproducible data generation:
- Same seed = same generated data
- Omit seed = random data each time
- Useful for testing and demos

### Performance Considerations

- **<500 issues**: No chunking needed
- **500-2000 issues**: Use chunkSize: 250-500
- **>2000 issues**: Use chunkSize: 500, consider reducing worklogs

---

## Configuration Schema

For complete schema documentation, see:
- [CONFIGURATION_EXTENSION_PLAN.md](../../CONFIGURATION_EXTENSION_PLAN.md)
- [packages/core/src/config/types.ts](../../packages/core/src/config/types.ts)
- [packages/core/src/config/schema.ts](../../packages/core/src/config/schema.ts)

---

## Validation

All configurations can be validated using:

```bash
npm run validate-config examples/configs/your-config.json
```

This will:
- Check schema compliance
- Validate cross-field rules
- Show warnings for potential issues
- Suggest improvements

---

**Last Updated:** 2024-11-19
