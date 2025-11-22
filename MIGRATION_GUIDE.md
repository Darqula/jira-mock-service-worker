# Migration Guide: Per-Project Configuration

This guide helps you migrate from the old configuration format to the new per-project configuration format.

## ⚠️ Breaking Change

**Version:** 2.0.0  
**Date:** 2025-11-22

The configuration format has changed to support per-project configuration. The old format is **no longer supported**.

## What Changed?

### Old Format (v1.x)

```json
{
  "version": "1.0",
  "seed": 12345,
  "general": {
    "projectKey": "PROJ",
    "projectType": "company-managed",
    "startIssueNumber": 1,
    "startDate": "2024-05-01T00:00:00Z",
    "endDate": "2024-11-01T00:00:00Z"
  },
  "statusDistribution": {
    "toDo": 0.4,
    "inProgress": 0.3,
    "done": 0.3
  },
  "issueTypes": {
    "epic": {
      "count": 10,
      "childrenPerEpic": 100
    }
  },
  "sprints": {
    "duration": 14,
    "assignProbability": 0.7
  },
  "versions": {
    "count": 3,
    "assignProbability": 0.6
  },
  "worklogs": {
    "probability": 0.6
  },
  "data": {
    "assignees": ["user1@example.com", "user2@example.com"],
    "labels": ["frontend", "backend"]
  },
  "projects": {
    "count": 3,
    "issuesPerProject": 100
  }
}
```

### New Format (v2.0+)

```json
{
  "version": "1.0",
  "globalDefaults": {
    "seed": 12345,
    "statusDistribution": {
      "toDo": 0.4,
      "inProgress": 0.3,
      "done": 0.3
    },
    "issueTypes": {
      "epic": {
        "count": 10,
        "childrenPerEpic": 100
      }
    },
    "sprints": {
      "duration": 14,
      "assignProbability": 0.7
    },
    "versions": {
      "count": 3,
      "assignProbability": 0.6
    },
    "worklogs": {
      "probability": 0.6
    },
    "data": {
      "assignees": ["user1@example.com", "user2@example.com"],
      "labels": ["frontend", "backend"]
    },
    "startDate": "2024-05-01T00:00:00Z",
    "endDate": "2024-11-01T00:00:00Z"
  },
  "projects": [
    {
      "projectKey": "PROJ1",
      "projectType": "company-managed",
      "issueCount": 100,
      "startIssueNumber": 1
    },
    {
      "projectKey": "PROJ2",
      "projectType": "company-managed",
      "issueCount": 100,
      "startIssueNumber": 1
    },
    {
      "projectKey": "PROJ3",
      "projectType": "company-managed",
      "issueCount": 100,
      "startIssueNumber": 1
    }
  ]
}
```

## Key Changes

1. **`projects` field changed from object to array**
   - Old: `"projects": { "count": 3, "issuesPerProject": 100 }`
   - New: `"projects": [{ "projectKey": "PROJ1", "issueCount": 100 }, ...]`

2. **`general` field removed**
   - Old: `"general": { "projectKey": "PROJ", ... }`
   - New: Project-specific fields moved to each project in the `projects` array

3. **New `globalDefaults` field**
   - Old: Configuration fields at root level
   - New: Common configuration in `globalDefaults` object

4. **Project-specific configuration**
   - Each project can now override any setting from `globalDefaults`
   - Required fields per project: `projectKey`, `issueCount`
   - Optional fields: All configuration options can be overridden

## Migration Steps

### Step 1: Create `projects` array

Replace the old `projects` object with an array of project configurations.

**Old:**
```json
"projects": {
  "count": 3,
  "issuesPerProject": 100
}
```

**New:**
```json
"projects": [
  { "projectKey": "PROJ1", "issueCount": 100 },
  { "projectKey": "PROJ2", "issueCount": 100 },
  { "projectKey": "PROJ3", "issueCount": 100 }
]
```

### Step 2: Move root-level configuration to `globalDefaults`

Move all configuration fields (except `version` and `projects`) into a `globalDefaults` object.

**Old:**
```json
{
  "version": "1.0",
  "seed": 12345,
  "statusDistribution": { ... },
  "issueTypes": { ... },
  "projects": { ... }
}
```

**New:**
```json
{
  "version": "1.0",
  "globalDefaults": {
    "seed": 12345,
    "statusDistribution": { ... },
    "issueTypes": { ... }
  },
  "projects": [ ... ]
}
```

### Step 3: Distribute `general` fields

Move fields from the `general` object to either `globalDefaults` or individual projects.

**Old:**
```json
"general": {
  "projectKey": "PROJ",
  "projectType": "company-managed",
  "startIssueNumber": 1,
  "startDate": "2024-05-01T00:00:00Z",
  "endDate": "2024-11-01T00:00:00Z",
  "chunkSize": 0
}
```

**New:**
```json
"globalDefaults": {
  "startDate": "2024-05-01T00:00:00Z",
  "endDate": "2024-11-01T00:00:00Z"
},
"projects": [
  {
    "projectKey": "PROJ",
    "projectType": "company-managed",
    "issueCount": 100,
    "startIssueNumber": 1
  }
]
```

Note: `chunkSize` has been removed as it's no longer needed.

### Step 4: Customize per project (optional)

Now you can override any setting per project:

```json
{
  "version": "1.0",
  "globalDefaults": {
    "statusDistribution": {
      "toDo": 0.4,
      "inProgress": 0.3,
      "done": 0.3
    }
  },
  "projects": [
    {
      "projectKey": "BACKEND",
      "issueCount": 150,
      "data": {
        "assignees": ["backend-dev@example.com"],
        "labels": ["api", "database"]
      }
    },
    {
      "projectKey": "FRONTEND",
      "issueCount": 100,
      "statusDistribution": {
        "toDo": 0.5,
        "inProgress": 0.4,
        "done": 0.1
      },
      "data": {
        "assignees": ["frontend-dev@example.com"],
        "labels": ["ui", "ux"]
      }
    }
  ]
}
```

## Complete Example

### Before (v1.x)

```json
{
  "version": "1.0",
  "seed": 42,
  "general": {
    "projectKey": "DEMO"
  },
  "statusDistribution": {
    "toDo": 0.3,
    "inProgress": 0.4,
    "done": 0.3
  },
  "projects": {
    "count": 2,
    "issuesPerProject": 50
  }
}
```

### After (v2.0+)

```json
{
  "version": "1.0",
  "globalDefaults": {
    "seed": 42,
    "statusDistribution": {
      "toDo": 0.3,
      "inProgress": 0.4,
      "done": 0.3
    }
  },
  "projects": [
    {
      "projectKey": "DEMO1",
      "issueCount": 50
    },
    {
      "projectKey": "DEMO2",
      "issueCount": 50
    }
  ]
}
```

## FAQ

### Q: Can I use the old format?

**A:** No, the old format is no longer supported. You must migrate to the new format.

### Q: Do I need to specify `globalDefaults`?

**A:** No, `globalDefaults` is optional. If omitted, all projects will use built-in defaults.

### Q: Can each project have different settings?

**A:** Yes! Each project can override any setting from `globalDefaults`.

### Q: What happens if I don't specify a setting for a project?

**A:** The project will inherit from `globalDefaults`. If not set there, it will use built-in defaults.

### Q: Can I have different issue counts per project?

**A:** Yes! Each project has its own `issueCount` field.

### Q: Can projects share assignees and labels?

**A:** Yes, either by:
1. Setting them in `globalDefaults`
2. Duplicating them in each project's `data` field

### Q: Is the `version` field still "1.0"?

**A:** Yes, the `version` field remains "1.0" but the package version is now 2.0.0 due to the breaking change.

## Need Help?

- See [examples/configs/](./examples/configs/) for working examples
- Check [PER_PROJECT_CONFIG_PLAN.md](./PER_PROJECT_CONFIG_PLAN.md) for technical details
- Report issues at https://github.com/Darqula/jira-mock-service-worker/issues
