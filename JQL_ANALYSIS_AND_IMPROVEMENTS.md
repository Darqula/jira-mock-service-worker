# JQL Search Endpoint - Analysis and Proposed Improvements

## Executive Summary

This document provides a thorough analysis of the current JQL implementation in the mock service worker and proposes improvements to support more comprehensive Jira Query Language (JQL) syntax.

## Current Implementation Analysis

### What's Currently Supported

#### Operators
- **`=` (Equals)**: Basic equality matching for most fields
- **`IN` (In list)**: For `key` field and `project` field
  - Example: `key IN (TEST-1, TEST-2)`
  - Example: `project IN (PROJ1, PROJ2, 1001, 1002)`

#### Fields
1. **project** - Supports both project key and project ID
   - Single: `project = TEST` or `project = 1001`
   - Multiple: `project IN (TEST, DEMO)` or `project IN (1001, 1002)`
2. **status** - Issue status name
3. **assignee** - User assignment (supports `currentUser()` function)
4. **reporter** - Issue reporter (supports `currentUser()` function)
5. **priority** - Issue priority
6. **issuetype** - Type of issue
7. **labels** - Single label matching only
8. **key** - Issue key with IN operator

#### Functions
- **currentUser()** - Only for assignee and reporter fields

#### Logical Operators
- **AND** - Implicit support (multiple conditions are combined with AND logic)
- No explicit parsing of AND/OR keywords

#### Special Features
- Case-insensitive field names
- Quoted string support (preserves case and spaces)
- Unquoted value support (auto-capitalized for certain fields)
- ORDER BY clause (limited support in parser but not in query engine)

### Current Limitations

#### Missing Operators
1. **`!=` (Not equals)** - Cannot exclude values
2. **`>`, `>=`, `<`, `<=`** - No comparison operators for dates/numbers
3. **`~` (Contains)** - No text search capability
4. **`!~` (Does not contain)** - No negative text search
5. **`IS EMPTY` / `IS NOT EMPTY`** - No null/empty checks
6. **`NOT IN`** - Cannot exclude from lists
7. **`WAS`, `WAS IN`, `WAS NOT`** - No historical queries
8. **`CHANGED`** - No change tracking queries

#### Missing Fields
1. **created** - Issue creation date
2. **updated** - Last update date
3. **resolved** - Resolution date
4. **due** - Due date
5. **summary** - Issue summary/title
6. **description** - Issue description
7. **comment** - Comments on issues
8. **text** - Full-text search across multiple fields
9. **component** - Issue components
10. **fixVersion** - Fix versions
11. **affectedVersion** - Affected versions
12. **sprint** - Sprint assignment
13. **resolution** - Resolution status
14. **parent** - Parent issue
15. **epic** - Epic link
16. **Custom fields** - No support for custom field queries

#### Missing Functions
1. **membersOf(group)** - Find issues by group membership
2. **now()** - Current date/time
3. **startOfDay()**, **endOfDay()** - Date boundaries
4. **startOfWeek()**, **endOfWeek()** - Week boundaries
5. **startOfMonth()**, **endOfMonth()** - Month boundaries
6. **startOfYear()**, **endOfYear()** - Year boundaries
7. **openSprints()** - Active sprints
8. **closedSprints()** - Completed sprints
9. **linkedIssues()** - Linked issue queries
10. **watchedIssues()** - Issues user is watching

#### Missing Logical Operators
1. **OR** - No alternative condition support
2. **NOT** - No negation support
3. **Parentheses** - No grouping for complex logic

#### Other Limitations
1. **Multiple label matching** - Only supports single label
2. **ORDER BY** - Parser extracts it but QueryEngine doesn't use it
3. **Date arithmetic** - No date math (e.g., `created >= -7d`)
4. **Relative dates** - No support for relative time periods
5. **Subqueries** - No nested query support
6. **Field aliases** - No support for field name variations

## Jira JQL Syntax Reference

### Complete Operator List

| Operator | Description | Example |
|----------|-------------|---------|
| `=` | Equals | `status = "In Progress"` |
| `!=` | Not equals | `status != Done` |
| `>` | Greater than | `created > "2024-01-01"` |
| `>=` | Greater than or equal | `priority >= High` |
| `<` | Less than | `due < now()` |
| `<=` | Less than or equal | `updated <= endOfDay()` |
| `IN` | In list | `project IN (TEST, DEMO)` |
| `NOT IN` | Not in list | `status NOT IN (Done, Closed)` |
| `~` | Contains (text search) | `summary ~ "bug"` |
| `!~` | Does not contain | `summary !~ "duplicate"` |
| `IS` | Is (for empty/null) | `assignee IS EMPTY` |
| `IS NOT` | Is not (for empty/null) | `resolution IS NOT EMPTY` |
| `WAS` | Was (historical) | `status WAS "In Progress"` |
| `WAS IN` | Was in (historical) | `assignee WAS IN (user1, user2)` |
| `WAS NOT` | Was not (historical) | `status WAS NOT Done` |
| `WAS NOT IN` | Was not in (historical) | `priority WAS NOT IN (Low, Lowest)` |
| `CHANGED` | Changed | `status CHANGED` |

### Logical Operators

| Operator | Description | Example |
|----------|-------------|---------|
| `AND` | All conditions must match | `project = TEST AND status = Open` |
| `OR` | Any condition must match | `status = Open OR status = "In Progress"` |
| `NOT` | Negation | `NOT assignee = currentUser()` |
| `()` | Grouping | `project = TEST AND (status = Open OR status = "In Progress")` |

### Common Fields

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `project` | Project | Project key or ID | `project = TEST` |
| `key` | Issue Key | Specific issue | `key = TEST-123` |
| `issuetype` | Issue Type | Type of issue | `issuetype = Bug` |
| `status` | Status | Current status | `status = "In Progress"` |
| `priority` | Priority | Issue priority | `priority = High` |
| `assignee` | User | Assigned user | `assignee = currentUser()` |
| `reporter` | User | Reporting user | `reporter = john.doe` |
| `created` | Date | Creation date | `created >= "2024-01-01"` |
| `updated` | Date | Last update | `updated >= startOfDay()` |
| `resolved` | Date | Resolution date | `resolved < now()` |
| `due` | Date | Due date | `due <= endOfWeek()` |
| `summary` | Text | Issue title | `summary ~ "performance"` |
| `description` | Text | Description | `description ~ "critical"` |
| `comment` | Text | Comments | `comment ~ "workaround"` |
| `text` | Text | Full-text search | `text ~ "database error"` |
| `labels` | Label | Issue labels | `labels IN (frontend, backend)` |
| `component` | Component | Issue component | `component = "API"` |
| `fixVersion` | Version | Fix version | `fixVersion = "1.0"` |
| `affectedVersion` | Version | Affected version | `affectedVersion = "0.9"` |
| `sprint` | Sprint | Sprint assignment | `sprint IN openSprints()` |
| `resolution` | Resolution | Resolution type | `resolution = Fixed` |
| `parent` | Issue | Parent issue | `parent = EPIC-1` |

### Common Functions

| Function | Description | Example |
|----------|-------------|---------|
| `currentUser()` | Current logged-in user | `assignee = currentUser()` |
| `membersOf(group)` | Members of a group | `assignee IN membersOf("developers")` |
| `now()` | Current date/time | `created >= now()` |
| `startOfDay()` | Start of current day | `created >= startOfDay()` |
| `endOfDay()` | End of current day | `due <= endOfDay()` |
| `startOfWeek()` | Start of current week | `created >= startOfWeek()` |
| `endOfWeek()` | End of current week | `due <= endOfWeek()` |
| `startOfMonth()` | Start of current month | `created >= startOfMonth()` |
| `endOfMonth()` | End of current month | `due <= endOfMonth()` |
| `startOfYear()` | Start of current year | `created >= startOfYear()` |
| `endOfYear()` | End of current year | `due <= endOfYear()` |
| `openSprints()` | Active sprints | `sprint IN openSprints()` |
| `closedSprints()` | Completed sprints | `sprint IN closedSprints()` |
| `linkedIssues(key)` | Issues linked to key | `issue IN linkedIssues(TEST-1)` |
| `watchedIssues()` | Issues user watches | `issue IN watchedIssues()` |

### Keywords

| Keyword | Description | Example |
|---------|-------------|---------|
| `EMPTY` | Empty/null value | `assignee IS EMPTY` |
| `NULL` | Null value | `resolution IS NULL` |
| `UNASSIGNED` | No assignee | `assignee = UNASSIGNED` |

## Proposed Improvements

### Priority 1: High-Impact Improvements

#### 1. Support `!=` (Not Equals) Operator
**Impact**: High - Very common use case
**Effort**: Low

```typescript
// Example usage
assignee != currentUser()
status != Done
priority != Low
```

**Implementation**:
- Add `!=` operator parsing in `extractFieldValue`
- Modify filter logic to support negation
- Update `IssueFilters` type to support excluded values

#### 2. Support `IN` Operator for More Fields
**Impact**: High - Essential for multi-value filtering
**Effort**: Medium

```typescript
// Example usage
status IN ("To Do", "In Progress", "Blocked")
assignee IN (user1, user2, user3)
priority IN (High, Highest)
issuetype IN (Bug, Task)
labels IN (frontend, backend, api)
```

**Implementation**:
- Extend parser to detect `IN` for all fields
- Modify filter matching to handle arrays
- Support both quoted and unquoted values in lists

#### 3. Support `NOT IN` Operator
**Impact**: High - Common exclusion pattern
**Effort**: Low (if `IN` is already implemented)

```typescript
// Example usage
status NOT IN (Done, Closed, Cancelled)
priority NOT IN (Low, Lowest)
```

#### 4. Support `IS EMPTY` / `IS NOT EMPTY`
**Impact**: High - Essential for null checks
**Effort**: Medium

```typescript
// Example usage
assignee IS EMPTY
resolution IS NOT EMPTY
labels IS EMPTY
component IS NOT EMPTY
```

**Implementation**:
- Parse `IS EMPTY` and `IS NOT EMPTY` patterns
- Add null/empty checking in filter logic
- Handle different empty states (null, undefined, empty array)

#### 5. Support `~` (Contains) Operator for Text Search
**Impact**: High - Critical for searching
**Effort**: Medium

```typescript
// Example usage
summary ~ "performance"
description ~ "database error"
text ~ "critical bug"  // Full-text search
```

**Implementation**:
- Add text search operator parsing
- Implement case-insensitive substring matching
- Support `text` field for multi-field search (summary + description + comments)

#### 6. Support Date Fields and Comparisons
**Impact**: High - Very common filtering need
**Effort**: Medium-High

```typescript
// Example usage
created >= "2024-01-01"
updated <= "2024-12-31"
due < now()
resolved IS EMPTY
```

**Implementation**:
- Add date field parsing (created, updated, resolved, due)
- Implement comparison operators (`>`, `>=`, `<`, `<=`)
- Parse and compare ISO 8601 date strings
- Support date functions (now(), startOfDay(), etc.)

### Priority 2: Medium-Impact Improvements

#### 7. Support `OR` Logical Operator
**Impact**: Medium - Needed for alternative conditions
**Effort**: High (requires parser redesign)

```typescript
// Example usage
status = Open OR status = "In Progress"
project = TEST OR project = DEMO
(assignee = currentUser() AND status = Open) OR priority = Highest
```

**Implementation**:
- Parse OR keyword and group conditions
- Build expression tree for complex logic
- Evaluate OR branches separately and merge results

#### 8. Support `NOT` Logical Operator
**Impact**: Medium - Useful for negation
**Effort**: Medium

```typescript
// Example usage
NOT assignee = currentUser()
NOT status IN (Done, Closed)
```

#### 9. Support Parentheses for Grouping
**Impact**: Medium - Essential for complex queries
**Effort**: High (requires expression parser)

```typescript
// Example usage
project = TEST AND (status = Open OR priority = Highest)
(assignee = currentUser() OR reporter = currentUser()) AND status != Done
```

#### 10. Support Additional Date Functions
**Impact**: Medium - Useful for relative dates
**Effort**: Medium

```typescript
// Example usage
created >= startOfWeek()
due <= endOfMonth()
updated >= startOfDay()
```

**Implementation**:
- Implement date calculation functions
- Support relative date arithmetic
- Handle timezone considerations

#### 11. Support `ORDER BY` in Query Execution
**Impact**: Medium - Currently parsed but not used
**Effort**: Low

```typescript
// Example usage
project = TEST ORDER BY created DESC
status = Open ORDER BY priority ASC, updated DESC
```

**Implementation**:
- Already parsed in JQLParseResult
- Add sorting logic in DataStore.searchIssues
- Support multiple sort fields

#### 12. Support Multiple Labels Matching
**Impact**: Medium - More flexible label filtering
**Effort**: Low

```typescript
// Example usage
labels IN (frontend, backend)
labels = frontend AND labels = backend  // Has both labels
```

### Priority 3: Advanced Improvements

#### 13. Support `resolution` Field
**Impact**: Medium - Common for completed issues
**Effort**: Low

```typescript
// Example usage
resolution = Fixed
resolution IS EMPTY
resolution IN (Fixed, "Won't Fix")
```

#### 14. Support `component` Field
**Impact**: Medium - Important for component-based projects
**Effort**: Medium

```typescript
// Example usage
component = "API"
component IN ("UI", "Backend")
```

#### 15. Support `fixVersion` and `affectedVersion`
**Impact**: Medium - Important for release management
**Effort**: Medium

```typescript
// Example usage
fixVersion = "1.0.0"
affectedVersion IN ("0.9.0", "0.9.1")
```

#### 16. Support Sprint Fields
**Impact**: Medium - Critical for agile teams
**Effort**: Medium-High

```typescript
// Example usage
sprint = "Sprint 1"
sprint IN openSprints()
sprint IN closedSprints()
```

#### 17. Support Historical Queries (`WAS`, `CHANGED`)
**Impact**: Low - Advanced use case
**Effort**: Very High (requires history tracking)

```typescript
// Example usage
status WAS "In Progress"
assignee CHANGED
priority WAS IN (High, Highest)
```

**Implementation**:
- Requires issue history/changelog storage
- Track field changes over time
- Query historical states

#### 18. Support Custom Fields
**Impact**: Medium - Flexibility for custom schemas
**Effort**: High

```typescript
// Example usage
cf[10001] = "Custom Value"
"Story Points" >= 5
```

#### 19. Support Advanced Functions
**Impact**: Low-Medium - Specialized use cases
**Effort**: Medium-High

```typescript
// Example usage
assignee IN membersOf("developers")
issue IN linkedIssues(TEST-1)
issue IN watchedIssues()
```

#### 20. Support Date Arithmetic
**Impact**: Medium - Flexible date queries
**Effort**: Medium

```typescript
// Example usage
created >= -7d     // Last 7 days
due <= 30d         // Next 30 days
updated >= -1w     // Last week
```

## Implementation Roadmap

### Phase 1: Core Operators (1-2 weeks)
1. Implement `!=` operator
2. Extend `IN` to all fields
3. Implement `NOT IN`
4. Implement `IS EMPTY` / `IS NOT EMPTY`
5. Implement `~` contains operator

**Estimated effort**: Medium
**Impact**: High - Covers most common use cases

### Phase 2: Date Support (2-3 weeks)
1. Add date field parsing (created, updated, resolved, due)
2. Implement comparison operators for dates
3. Add basic date functions (now(), startOfDay(), endOfDay())
4. Add week/month/year date functions

**Estimated effort**: Medium-High
**Impact**: High - Essential for time-based queries

### Phase 3: Logical Operators (3-4 weeks)
1. Refactor parser to build expression tree
2. Implement `OR` operator
3. Implement `NOT` operator
4. Support parentheses for grouping
5. Implement proper operator precedence

**Estimated effort**: High - Significant parser redesign
**Impact**: High - Enables complex queries

### Phase 4: Additional Fields (2-3 weeks)
1. Add resolution field
2. Add component field
3. Add version fields (fixVersion, affectedVersion)
4. Improve ORDER BY implementation
5. Support multiple label matching

**Estimated effort**: Medium
**Impact**: Medium - Expands field coverage

### Phase 5: Advanced Features (4-6 weeks)
1. Sprint support
2. Custom fields
3. Advanced functions (membersOf, linkedIssues)
4. Date arithmetic
5. Historical queries (WAS, CHANGED)

**Estimated effort**: High
**Impact**: Medium - Advanced use cases

## Testing Strategy

### Test Categories

1. **Operator Tests**
   - Each operator with various field types
   - Edge cases (null, empty, special characters)
   - Combination of operators

2. **Field Tests**
   - Each field with various operators
   - Data type validation
   - Case sensitivity

3. **Function Tests**
   - Each function with correct parameters
   - Invalid parameters
   - Function composition

4. **Complex Query Tests**
   - Multiple conditions with AND
   - Multiple conditions with OR
   - Nested parentheses
   - Mixed operators and functions

5. **Performance Tests**
   - Large datasets
   - Complex queries
   - Multiple concurrent searches

## Breaking Changes

### Minimal Breaking Changes Expected

The proposed improvements are designed to be **backward compatible**:
- Existing queries continue to work
- New syntax is additive
- Parser gracefully handles unsupported syntax

### Potential Issues

1. **Case sensitivity changes** - If we adjust capitalization logic
2. **Operator precedence** - If we change how AND/OR are evaluated
3. **Date parsing** - If date format expectations change

## Conclusion

The current JQL implementation supports basic filtering but lacks many essential JQL features. The proposed improvements will significantly enhance the mock's capabilities while maintaining backward compatibility.

### Recommended Next Steps

1. **Review and prioritize** improvements based on user needs
2. **Start with Phase 1** (core operators) for quick wins
3. **Implement comprehensive tests** for each feature
4. **Document supported JQL syntax** for users
5. **Consider incremental releases** to get feedback early

### Success Metrics

- **Coverage**: Support for top 20 most-used JQL patterns
- **Accuracy**: 95%+ match with real Jira JQL behavior
- **Performance**: Sub-100ms query execution for typical datasets
- **Compatibility**: Zero breaking changes to existing queries

## References

- [JQL Operators Reference](https://support.atlassian.com/jira-software-cloud/docs/jql-operators/)
- [JQL Functions Reference](https://support.atlassian.com/jira-software-cloud/docs/jql-functions/)
- [JQL Fields Reference](https://support.atlassian.com/jira-software-cloud/docs/advanced-search-reference-jql-fields/)
- [JQL Cheat Sheet](https://www.atlassian.com/software/jira/guides/jql/cheat-sheet)
- [Comprehensive JQL Guide](https://www.salto.io/blog-posts/jira-jql-guide)
