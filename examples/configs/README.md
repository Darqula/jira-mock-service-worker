# Example Configurations

This directory contains example configuration files demonstrating the per-project
configuration system. The only top-level keys are `version` and the `projects` array —
every other setting lives on its project entry.

JSON does not support comments, so the example files are kept comment-free; this
document explains the fields.

## Files

### `minimal.json`
The simplest possible configuration: a single project and nothing else. All other
configuration values use the built-in epic-based defaults (~1,010 issues).

**Use case:** Quick testing, simple mock data generation

### `small-project.json`
A small team project (~58 issues) exercising most per-project fields: epics with
children, standalone stories/tasks/bugs, sprints, versions, worklogs, custom data.

**Use case:** A realistic small-team board

### `team-managed.json`
A team-managed (Next-Gen) project (~123 issues) with weekly sprints and its own seed.

**Use case:** Testing team-managed project behavior

### `large-project.json`
A large enterprise project (~1,200 issues) spanning two years with 12 versions and
heavy worklogging.

**Use case:** Performance benchmarks and pagination testing

### `full-featured.json`
The canonical reference example: every supported field on a single company-managed
project (~360 issues).

**Use case:** Copy-paste starting point — see the root README's "All Configuration
Fields" section for a field-by-field walkthrough

### `multi-project.json`
A three-project workspace (Backend, Frontend, Infrastructure), each configured
independently.

**Features demonstrated:**
- Per-project seeds, status distributions, and worklog settings
- Different issue counts per project (BACKEND derives ~55 issues from its epic config;
  FRONTEND and INFRA configure no `issueTypes`, so they use the built-in defaults,
  ~1,010 issues each)
- Project-specific assignees and labels
- Both company-managed and team-managed projects

**Use case:** Simulating a real organization's Jira workspace

## Structure

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
- `projects` — required, array of project configurations (at least one).
- `projectKey` — required, unique per config, 1–10 characters matching
  `[A-Z][A-Z0-9]*`.
- `issueCount` — optional: exact number of issues for this project (1–10000).
  When omitted, the count is derived from the `issueTypes` configuration
  (built-in defaults: 10 epics + 10 × 100 children = 1,010 issues).

Per-project fields: `projectName`, `projectType`, `seed`, `issueCount`,
`statusDistribution`, `issueTypes`, `sprints`, `versions`, `worklogs`, `data`,
`startIssueNumber`, `startDate`, `endDate`. Dates must be full ISO 8601
(e.g. `"2024-01-01T00:00:00.000Z"`).

## Key Features

1. **Per-project configuration**: every project is configured independently
2. **Built-in defaults**: unset fields fall back to defaults
3. **Flexible**: mix and match settings across projects

## Note on Older Formats

Earlier revisions accepted a top-level `seed` / `statusDistribution` and a `projects`
object of the shape `{ "count": 3, "issuesPerProject": 10 }`. That format is **no
longer supported**: unknown top-level keys are stripped during validation and
`projects` must be an array, so old-shape configs fail. Migrating is mechanical —
move every top-level setting into each project entry and expand `projects.count`
into one entry per project with its own unique key.
