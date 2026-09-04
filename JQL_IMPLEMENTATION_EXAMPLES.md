# JQL Implementation Examples

This document provides concrete code examples for implementing the proposed JQL improvements.

## Architecture Overview

The JQL implementation has three main components:

1. **Parser** (`packages/core/src/utils/jql-parser.ts`) - Parses JQL string into structured format
2. **Query Engine** (`packages/core/src/store/query-engine.ts`) - Executes parsed query against data
3. **Data Store** (`packages/core/src/store/data-store.ts`) - Filters and returns matching issues

## Phase 1 Implementations

### 1. Implement `!=` (Not Equals) Operator

#### Parser Changes

```typescript
// packages/core/src/utils/jql-parser.ts

export interface JQLParseResult {
  project?: string;
  status?: string;
  statusExclude?: string; // NEW: Excluded values
  assignee?: string;
  assigneeExclude?: string; // NEW
  priority?: string;
  priorityExclude?: string; // NEW
  // ... other fields
}

function extractFieldValue(
  jql: string,
  field: string
): {
  value: string | null;
  operator: '=' | '!=' | 'IN' | 'NOT IN' | 'IS' | 'IS NOT' | '~' | '!~';
} {
  // Check for != operator
  const notEqualsRegex = new RegExp(`${field}\\s*!=\\s*"([^"]+)"`, 'i');
  const notEqualsMatch = jql.match(notEqualsRegex);
  if (notEqualsMatch) {
    return { value: notEqualsMatch[1], operator: '!=' };
  }

  // Check for = operator
  const equalsRegex = new RegExp(`${field}\\s*=\\s*"([^"]+)"`, 'i');
  const equalsMatch = jql.match(equalsRegex);
  if (equalsMatch) {
    return { value: equalsMatch[1], operator: '=' };
  }

  return { value: null, operator: '=' };
}
```

#### Data Store Changes

```typescript
// packages/core/src/store/data-store.ts

export interface IssueFilters {
  // Existing
  status?: string;
  assignee?: string;

  // NEW: Exclusion filters
  statusExclude?: string;
  assigneeExclude?: string;
  priorityExclude?: string;
  issueTypeExclude?: string;
}

searchIssues(filters: IssueFilters, options: QueryOptions): SearchResults {
  let filtered = this.issues;

  // Existing positive filters
  if (filters.status) {
    filtered = filtered.filter(
      (issue) => issue.fields.status.name === filters.status
    );
  }

  // NEW: Negative filters
  if (filters.statusExclude) {
    filtered = filtered.filter(
      (issue) => issue.fields.status.name !== filters.statusExclude
    );
  }

  if (filters.assigneeExclude) {
    filtered = filtered.filter(
      (issue) => issue.fields.assignee?.accountId !== filters.assigneeExclude
    );
  }

  // ... rest of filtering logic
}
```

#### Test Cases

```typescript
// packages/core/tests/utils/jql-parser.test.ts

describe('NOT EQUALS operator', () => {
  it('should parse status != Done', () => {
    const result = parseJQL('status != Done');
    expect(result.statusExclude).toBe('Done');
  });

  it('should parse assignee != currentUser()', () => {
    const result = parseJQL('assignee != currentUser()');
    expect(result.assigneeExclude).toBe('currentuser()');
  });

  it('should handle quoted values', () => {
    const result = parseJQL('status != "In Progress"');
    expect(result.statusExclude).toBe('In Progress');
  });
});

// packages/core/tests/store/query-engine.test.ts

describe('Query execution with !=', () => {
  it('should exclude status', () => {
    const issue1 = createTestIssue('TEST-1', testProject);
    issue1.fields.status = { name: 'Done', ... };

    const issue2 = createTestIssue('TEST-2', testProject);
    issue2.fields.status = { name: 'Open', ... };

    dataStore.addIssue(issue1);
    dataStore.addIssue(issue2);

    const results = queryEngine.executeJQL({ jql: 'status != Done' });

    expect(results.total).toBe(1);
    expect(results.issues[0].key).toBe('TEST-2');
  });
});
```

### 2. Implement `IN` Operator for All Fields

#### Parser Changes

```typescript
// packages/core/src/utils/jql-parser.ts

export interface JQLParseResult {
  status?: string;
  statusValues?: string[]; // NEW: Multiple values
  priority?: string;
  priorityValues?: string[]; // NEW
  labels?: string[]; // Already supports multiple
  // ... other fields
}

function parseFieldWithOperators(jql: string, field: string): FieldParseResult {
  // Check for IN operator
  const inRegex = new RegExp(`${field}\\s+IN\\s*\\(([^)]+)\\)`, 'i');
  const inMatch = jql.match(inRegex);

  if (inMatch) {
    const values = inMatch[1].split(',').map((v) => v.trim().replace(/["']/g, ''));
    return { operator: 'IN', values };
  }

  // Check for single = operator
  const eqRegex = new RegExp(`${field}\\s*=\\s*"?([^"\\s,]+)"?`, 'i');
  const eqMatch = jql.match(eqRegex);

  if (eqMatch) {
    return { operator: '=', value: eqMatch[1] };
  }

  return { operator: null, value: null };
}
```

#### Data Store Changes

```typescript
// packages/core/src/store/data-store.ts

export interface IssueFilters {
  status?: string;
  statusValues?: string[];  // NEW: Multiple values
  priority?: string;
  priorityValues?: string[];  // NEW
  assignees?: string[];  // NEW: Multiple assignees
}

searchIssues(filters: IssueFilters, options: QueryOptions): SearchResults {
  let filtered = this.issues;

  // Single value filter
  if (filters.status && !filters.statusValues) {
    filtered = filtered.filter(
      (issue) => issue.fields.status.name === filters.status
    );
  }

  // NEW: Multiple values filter
  if (filters.statusValues) {
    filtered = filtered.filter(
      (issue) => filters.statusValues!.includes(issue.fields.status.name)
    );
  }

  if (filters.priorityValues) {
    filtered = filtered.filter(
      (issue) => filters.priorityValues!.includes(issue.fields.priority?.name || '')
    );
  }

  // ... rest of filtering logic
}
```

#### Test Cases

```typescript
describe('IN operator for all fields', () => {
  it('should parse status IN (...)', () => {
    const result = parseJQL('status IN ("To Do", "In Progress", "Blocked")');
    expect(result.statusValues).toEqual(['To Do', 'In Progress', 'Blocked']);
  });

  it('should filter by multiple statuses', () => {
    // Add issues with different statuses
    const issue1 = createTestIssue('TEST-1', testProject);
    issue1.fields.status = { name: 'To Do', ... };

    const issue2 = createTestIssue('TEST-2', testProject);
    issue2.fields.status = { name: 'In Progress', ... };

    const issue3 = createTestIssue('TEST-3', testProject);
    issue3.fields.status = { name: 'Done', ... };

    dataStore.addIssue(issue1);
    dataStore.addIssue(issue2);
    dataStore.addIssue(issue3);

    const results = queryEngine.executeJQL({
      jql: 'status IN ("To Do", "In Progress")'
    });

    expect(results.total).toBe(2);
    expect(results.issues.map(i => i.key)).toEqual(['TEST-1', 'TEST-2']);
  });
});
```

### 3. Implement `IS EMPTY` / `IS NOT EMPTY`

#### Parser Changes

```typescript
// packages/core/src/utils/jql-parser.ts

export interface JQLParseResult {
  assigneeIsEmpty?: boolean; // NEW
  assigneeIsNotEmpty?: boolean; // NEW
  resolutionIsEmpty?: boolean; // NEW
  labelsIsEmpty?: boolean; // NEW
  // ... other fields
}

function parseEmptyChecks(jql: string): Partial<JQLParseResult> {
  const result: Partial<JQLParseResult> = {};

  // Check for IS EMPTY
  const isEmptyRegex = /(\w+)\s+IS\s+EMPTY/gi;
  let match;
  while ((match = isEmptyRegex.exec(jql)) !== null) {
    const field = match[1].toLowerCase();
    result[`${field}IsEmpty`] = true;
  }

  // Check for IS NOT EMPTY
  const isNotEmptyRegex = /(\w+)\s+IS\s+NOT\s+EMPTY/gi;
  while ((match = isNotEmptyRegex.exec(jql)) !== null) {
    const field = match[1].toLowerCase();
    result[`${field}IsNotEmpty`] = true;
  }

  return result;
}
```

#### Data Store Changes

```typescript
// packages/core/src/store/data-store.ts

searchIssues(filters: IssueFilters, options: QueryOptions): SearchResults {
  let filtered = this.issues;

  // NEW: IS EMPTY checks
  if (filters.assigneeIsEmpty) {
    filtered = filtered.filter(
      (issue) => !issue.fields.assignee || issue.fields.assignee === null
    );
  }

  // NEW: IS NOT EMPTY checks
  if (filters.assigneeIsNotEmpty) {
    filtered = filtered.filter(
      (issue) => issue.fields.assignee !== null && issue.fields.assignee !== undefined
    );
  }

  if (filters.labelsIsEmpty) {
    filtered = filtered.filter(
      (issue) => !issue.fields.labels || issue.fields.labels.length === 0
    );
  }

  // ... rest of filtering logic
}
```

#### Test Cases

```typescript
describe('IS EMPTY / IS NOT EMPTY', () => {
  it('should parse assignee IS EMPTY', () => {
    const result = parseJQL('assignee IS EMPTY');
    expect(result.assigneeIsEmpty).toBe(true);
  });

  it('should find unassigned issues', () => {
    const issue1 = createTestIssue('TEST-1', testProject);
    issue1.fields.assignee = null;

    const issue2 = createTestIssue('TEST-2', testProject);
    issue2.fields.assignee = testUser;

    dataStore.addIssue(issue1);
    dataStore.addIssue(issue2);

    const results = queryEngine.executeJQL({ jql: 'assignee IS EMPTY' });

    expect(results.total).toBe(1);
    expect(results.issues[0].key).toBe('TEST-1');
  });

  it('should find issues with labels', () => {
    const issue1 = createTestIssue('TEST-1', testProject);
    issue1.fields.labels = ['bug', 'urgent'];

    const issue2 = createTestIssue('TEST-2', testProject);
    issue2.fields.labels = [];

    dataStore.addIssue(issue1);
    dataStore.addIssue(issue2);

    const results = queryEngine.executeJQL({ jql: 'labels IS NOT EMPTY' });

    expect(results.total).toBe(1);
    expect(results.issues[0].key).toBe('TEST-1');
  });
});
```

## Phase 2 Implementations

### 4. Implement Text Search (`~` operator)

#### Parser Changes

```typescript
// packages/core/src/utils/jql-parser.ts

export interface JQLParseResult {
  summaryContains?: string; // NEW
  descriptionContains?: string; // NEW
  textContains?: string; // NEW: Full-text search
}

function parseTextSearch(jql: string): Partial<JQLParseResult> {
  const result: Partial<JQLParseResult> = {};

  // Parse ~ operator
  const containsRegex = /(\w+)\s*~\s*"([^"]+)"/gi;
  let match;

  while ((match = containsRegex.exec(jql)) !== null) {
    const field = match[1].toLowerCase();
    const searchTerm = match[2];

    if (field === 'summary') {
      result.summaryContains = searchTerm;
    } else if (field === 'description') {
      result.descriptionContains = searchTerm;
    } else if (field === 'text') {
      result.textContains = searchTerm;
    }
  }

  return result;
}
```

#### Data Store Changes

```typescript
// packages/core/src/store/data-store.ts

searchIssues(filters: IssueFilters, options: QueryOptions): SearchResults {
  let filtered = this.issues;

  // NEW: Text contains search
  if (filters.summaryContains) {
    const searchTerm = filters.summaryContains.toLowerCase();
    filtered = filtered.filter(
      (issue) => issue.fields.summary?.toLowerCase().includes(searchTerm)
    );
  }

  if (filters.descriptionContains) {
    const searchTerm = filters.descriptionContains.toLowerCase();
    filtered = filtered.filter(
      (issue) => issue.fields.description?.toLowerCase().includes(searchTerm)
    );
  }

  // NEW: Full-text search across multiple fields
  if (filters.textContains) {
    const searchTerm = filters.textContains.toLowerCase();
    filtered = filtered.filter((issue) => {
      const summary = issue.fields.summary?.toLowerCase() || '';
      const description = issue.fields.description?.toLowerCase() || '';
      // Could also search comments here

      return summary.includes(searchTerm) || description.includes(searchTerm);
    });
  }

  // ... rest of filtering logic
}
```

### 5. Implement Date Fields and Comparisons

#### Type Definitions

```typescript
// packages/core/src/types/jira-schemas.ts

export interface IssueFields {
  summary: string;
  description?: string;
  created: string; // ISO 8601 date string
  updated: string; // ISO 8601 date string
  resolved?: string; // Optional resolution date
  duedate?: string; // Optional due date
  // ... other fields
}
```

#### Parser Changes

```typescript
// packages/core/src/utils/jql-parser.ts

export interface DateFilter {
  field: 'created' | 'updated' | 'resolved' | 'duedate';
  operator: '=' | '!=' | '>' | '>=' | '<' | '<=';
  value: string | DateFunction;
}

export type DateFunction =
  | { type: 'now' }
  | { type: 'startOfDay'; offset?: number }
  | { type: 'endOfDay'; offset?: number }
  | { type: 'startOfWeek'; offset?: number }
  | { type: 'endOfWeek'; offset?: number };

export interface JQLParseResult {
  // ... existing fields
  dateFilters?: DateFilter[]; // NEW
}

function parseDateFilters(jql: string): DateFilter[] {
  const filters: DateFilter[] = [];

  // Match date comparisons
  const dateRegex =
    /(created|updated|resolved|duedate)\s*(=|!=|>|>=|<|<=)\s*("[\d-]+"|now\(\)|startOfDay\(\)|endOfDay\(\))/gi;

  let match;
  while ((match = dateRegex.exec(jql)) !== null) {
    const field = match[1].toLowerCase() as 'created' | 'updated' | 'resolved' | 'duedate';
    const operator = match[2] as '=' | '!=' | '>' | '>=' | '<' | '<=';
    const rawValue = match[3];

    let value: string | DateFunction;

    if (rawValue === 'now()') {
      value = { type: 'now' };
    } else if (rawValue === 'startOfDay()') {
      value = { type: 'startOfDay' };
    } else if (rawValue === 'endOfDay()') {
      value = { type: 'endOfDay' };
    } else {
      // Remove quotes and use as date string
      value = rawValue.replace(/"/g, '');
    }

    filters.push({ field, operator, value });
  }

  return filters;
}
```

#### Date Utilities

```typescript
// packages/core/src/utils/date-functions.ts

export function evaluateDateFunction(func: DateFunction): Date {
  const now = new Date();

  switch (func.type) {
    case 'now':
      return now;

    case 'startOfDay':
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      return startOfDay;

    case 'endOfDay':
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      return endOfDay;

    case 'startOfWeek':
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      return startOfWeek;

    case 'endOfWeek':
      const endOfWeek = new Date(now);
      const dayEnd = endOfWeek.getDay();
      const diffEnd = endOfWeek.getDate() - dayEnd + 7; // Sunday
      endOfWeek.setDate(diffEnd);
      endOfWeek.setHours(23, 59, 59, 999);
      return endOfWeek;

    default:
      return now;
  }
}

export function compareDates(
  issueDate: string | undefined,
  operator: string,
  compareValue: string | DateFunction
): boolean {
  if (!issueDate) {
    // If field is empty, only = and != make sense
    if (operator === '!=') return true;
    return false;
  }

  const issueDateTime = new Date(issueDate).getTime();

  let compareDateTime: number;
  if (typeof compareValue === 'string') {
    compareDateTime = new Date(compareValue).getTime();
  } else {
    compareDateTime = evaluateDateFunction(compareValue).getTime();
  }

  switch (operator) {
    case '=':
      return issueDateTime === compareDateTime;
    case '!=':
      return issueDateTime !== compareDateTime;
    case '>':
      return issueDateTime > compareDateTime;
    case '>=':
      return issueDateTime >= compareDateTime;
    case '<':
      return issueDateTime < compareDateTime;
    case '<=':
      return issueDateTime <= compareDateTime;
    default:
      return false;
  }
}
```

#### Data Store Changes

```typescript
// packages/core/src/store/data-store.ts

import { compareDates } from '../utils/date-functions.js';

searchIssues(filters: IssueFilters, options: QueryOptions): SearchResults {
  let filtered = this.issues;

  // ... existing filters

  // NEW: Date filters
  if (filters.dateFilters) {
    for (const dateFilter of filters.dateFilters) {
      filtered = filtered.filter((issue) => {
        const fieldValue = issue.fields[dateFilter.field];
        return compareDates(fieldValue, dateFilter.operator, dateFilter.value);
      });
    }
  }

  // ... rest of filtering logic
}
```

## Phase 3 Implementations

### 6. Implement OR Operator (Complex)

This requires a significant parser redesign to build an expression tree.

#### Expression Tree Structure

```typescript
// packages/core/src/utils/jql-ast.ts

export type JQLExpression = AndExpression | OrExpression | NotExpression | ComparisonExpression;

export interface AndExpression {
  type: 'AND';
  left: JQLExpression;
  right: JQLExpression;
}

export interface OrExpression {
  type: 'OR';
  left: JQLExpression;
  right: JQLExpression;
}

export interface NotExpression {
  type: 'NOT';
  expression: JQLExpression;
}

export interface ComparisonExpression {
  type: 'COMPARISON';
  field: string;
  operator: '=' | '!=' | '>' | '>=' | '<' | '<=' | 'IN' | 'NOT IN' | '~' | 'IS' | 'IS NOT';
  value: any;
}
```

#### Recursive Descent Parser

```typescript
// packages/core/src/utils/jql-expression-parser.ts

class JQLExpressionParser {
  private tokens: Token[];
  private current = 0;

  parse(jql: string): JQLExpression {
    this.tokens = this.tokenize(jql);
    this.current = 0;
    return this.parseOrExpression();
  }

  private parseOrExpression(): JQLExpression {
    let expr = this.parseAndExpression();

    while (this.match('OR')) {
      const right = this.parseAndExpression();
      expr = { type: 'OR', left: expr, right };
    }

    return expr;
  }

  private parseAndExpression(): JQLExpression {
    let expr = this.parseUnaryExpression();

    while (this.match('AND')) {
      const right = this.parseUnaryExpression();
      expr = { type: 'AND', left: expr, right };
    }

    return expr;
  }

  private parseUnaryExpression(): JQLExpression {
    if (this.match('NOT')) {
      const expr = this.parsePrimaryExpression();
      return { type: 'NOT', expression: expr };
    }

    return this.parsePrimaryExpression();
  }

  private parsePrimaryExpression(): JQLExpression {
    // Handle parentheses
    if (this.match('(')) {
      const expr = this.parseOrExpression();
      this.consume(')');
      return expr;
    }

    // Parse field comparison
    return this.parseComparison();
  }

  // ... tokenization and helper methods
}
```

#### Query Evaluator

```typescript
// packages/core/src/store/expression-evaluator.ts

export class ExpressionEvaluator {
  constructor(private dataStore: DataStore) {}

  evaluate(expression: JQLExpression, issue: IssueBean): boolean {
    switch (expression.type) {
      case 'AND':
        return this.evaluate(expression.left, issue) && this.evaluate(expression.right, issue);

      case 'OR':
        return this.evaluate(expression.left, issue) || this.evaluate(expression.right, issue);

      case 'NOT':
        return !this.evaluate(expression.expression, issue);

      case 'COMPARISON':
        return this.evaluateComparison(expression, issue);
    }
  }

  private evaluateComparison(expr: ComparisonExpression, issue: IssueBean): boolean {
    // Evaluate field comparison against issue
    // ... implementation
  }
}
```

## Testing Strategy

### Unit Tests

```typescript
// Test each parser function independently
describe('JQL Parser Unit Tests', () => {
  it('should parse != operator', () => { ... });
  it('should parse IN operator', () => { ... });
  it('should parse IS EMPTY', () => { ... });
  it('should parse text search', () => { ... });
  it('should parse date comparisons', () => { ... });
});

// Test query execution
describe('Query Engine Unit Tests', () => {
  it('should filter by != operator', () => { ... });
  it('should filter by IN operator', () => { ... });
  it('should filter by IS EMPTY', () => { ... });
  it('should search text', () => { ... });
  it('should compare dates', () => { ... });
});
```

### Integration Tests

```typescript
// Test complete JQL queries end-to-end
describe('JQL Integration Tests', () => {
  it('should execute complex query with multiple operators', () => {
    const results = queryEngine.executeJQL({
      jql: 'project = TEST AND status != Done AND assignee IS NOT EMPTY',
    });
    // Verify results
  });

  it('should handle OR logic', () => {
    const results = queryEngine.executeJQL({
      jql: 'status = Open OR priority = Highest',
    });
    // Verify results
  });
});
```

## Performance Considerations

### Optimization Strategies

1. **Index commonly filtered fields**

   ```typescript
   // Build indexes for fast lookups
   private statusIndex: Map<string, Set<string>>; // status -> issue IDs
   private assigneeIndex: Map<string, Set<string>>; // assignee -> issue IDs
   ```

2. **Short-circuit evaluation**

   ```typescript
   // For AND: stop if any condition fails
   // For OR: stop if any condition succeeds
   ```

3. **Filter order optimization**

   ```typescript
   // Apply most selective filters first
   // E.g., specific key lookup before broad text search
   ```

4. **Lazy evaluation for pagination**
   ```typescript
   // Don't filter entire dataset if only need first page
   ```

---

These examples provide a concrete starting point for implementing each JQL improvement. The actual implementation may vary based on specific requirements and architecture decisions.
