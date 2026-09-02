# Example Configurations

This directory contains example configuration files demonstrating various use cases for the per-project configuration feature.

## Files

### `minimal.json`
The simplest possible configuration with a single project and minimal settings. All other configuration values will use built-in defaults.

**Use case:** Quick testing, simple mock data generation

### `multi-project.json`
A realistic multi-project workspace with three projects (Backend, Frontend, Infrastructure), each with different configurations.

**Features demonstrated:**
- Global defaults that apply to all projects
- Project-specific overrides (e.g., Frontend has different status distribution)
- Different issue counts per project
- Project-specific assignees and labels
- Both company-managed and team-managed projects

**Use case:** Simulating a real organization's Jira workspace

## Per-Project Configuration

### Structure

JSON does not support comments, so the example files are kept comment-free. The shape is:

```json
{
  "version": "1.0",
  "projects": [
    {
      "projectKey": "PROJ1",
      "issueCount": 100
    }
  ]
}
```

- `version` — required, always `"1.0"`.
- `projects` — required, array of project configurations.
- `projectKey` — required, unique project identifier.
- `issueCount` — optional: exact number of issues for this project (1–10000).
  When omitted, the count is derived from the `issueTypes` configuration
  (see the `issueTypes` examples in this directory).

### Key Features

1. **Global Defaults**: Set once, apply everywhere
2. **Project-Specific Overrides**: Each project can override any setting
3. **Inheritance**: Built-in defaults → Global defaults → Project config
4. **Flexible**: Mix and match settings as needed

### Migration from Old Format

**Old format (no longer supported):**
```json
{
  "version": "1.0",
  "seed": 12345,
  "statusDistribution": { ... },
  "projects": {
    "count": 3,
    "issuesPerProject": 10
  }
}
```

**New format:**
```json
{
  "version": "1.0",
  "globalDefaults": {
    "seed": 12345,
    "statusDistribution": { ... }
  },
  "projects": [
    {"projectKey": "PROJ1", "issueCount": 10},
    {"projectKey": "PROJ2", "issueCount": 10},
    {"projectKey": "PROJ3", "issueCount": 10}
  ]
}
```

See [MIGRATION_GUIDE.md](../../MIGRATION_GUIDE.md) for detailed migration instructions.
