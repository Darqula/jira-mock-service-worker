import type { DataStore } from './data-store.js';
import type { IssueFilters, QueryOptions } from './data-store.js';
import type { SearchResults } from '../types/jira-schemas.js';
import { parseDateValue } from '../utils/date-functions.js';

export interface JQLQuery {
  jql: string;
  startAt?: number;
  maxResults?: number;
  fields?: string[];
  expand?: string[];
}

export class QueryEngine {
  constructor(private dataStore: DataStore) {}

  executeJQL(query: JQLQuery): SearchResults {
    const { filters, orderBy, orderDirection } = this.parseJQL(query.jql);
    const options: QueryOptions = {
      startAt: query.startAt || 0,
      maxResults: query.maxResults || 50,
      orderBy,
      orderDirection,
    };

    return this.dataStore.searchIssues(filters, options);
  }

  private parseJQL(jql: string): { filters: IssueFilters; orderBy?: string; orderDirection?: 'asc' | 'desc' } {
    const filters: IssueFilters = {};

    // Parse ORDER BY clause (extract and remove from jql for cleaner parsing)
    let orderBy: string | undefined;
    let orderDirection: 'asc' | 'desc' | undefined;
    const orderByMatch = jql.match(/order\s+by\s+([a-z0-9_]+)\s*(asc|desc)?/i);
    if (orderByMatch) {
      orderBy = orderByMatch[1].toLowerCase();
      orderDirection = orderByMatch[2]?.toLowerCase() === 'desc' ? 'desc' : 'asc';
    }

    // Parse project filters
    this.parseProjectFilters(jql, filters);

    // Parse all field filters with their operators
    this.parseFieldFilter(jql, 'status', filters, 'status', 'statuses', 'statusExclude', 'statusesExclude');
    this.parseFieldFilter(jql, 'issuetype', filters, 'issueType', 'issueTypes', 'issueTypeExclude', 'issueTypesExclude');
    this.parseFieldFilter(jql, 'priority', filters, 'priority', 'priorities', 'priorityExclude', 'prioritiesExclude');
    this.parseFieldFilter(jql, 'resolution', filters, 'resolution', 'resolutions');

    // Parse assignee and reporter with special handling for currentUser()
    this.parseUserField(jql, 'assignee', filters);
    this.parseUserField(jql, 'reporter', filters);

    // Parse labels
    this.parseLabelFilters(jql, filters);

    // Parse key filters
    this.parseKeyFilters(jql, filters);

    // Parse IS EMPTY / IS NOT EMPTY for various fields
    this.parseEmptyFilters(jql, filters);

    // Parse text search (~, !~)
    this.parseTextFilters(jql, filters);

    // Parse date filters
    this.parseDateFilters(jql, filters);

    // Parse component filters
    this.parseComponentFilters(jql, filters);

    // Parse version filters
    this.parseVersionFilters(jql, filters);

    // Parse sprint filters
    this.parseSprintFilters(jql, filters);

    return { filters, orderBy, orderDirection };
  }

  private parseProjectFilters(jql: string, filters: IssueFilters): void {
    // Parse project with IN clause
    const projectInMatch = jql.match(/project\s+in\s*\(([^)]+)\)/i);
    if (projectInMatch) {
      const values = projectInMatch[1]
        .split(',')
        .map((v) => v.trim().replace(/["']/g, ''));

      const ids: string[] = [];
      const keys: string[] = [];

      for (const value of values) {
        if (/^\d+$/.test(value)) {
          ids.push(value);
        } else {
          keys.push(value.toUpperCase());
        }
      }

      if (ids.length > 0) filters.projectIds = ids;
      if (keys.length > 0) filters.projectKeys = keys;
    } else {
      // Parse single project with = operator
      const projectMatch = jql.match(/project\s*=\s*([a-z0-9_-]+)/i);
      if (projectMatch) {
        const value = projectMatch[1];
        if (/^\d+$/.test(value)) {
          filters.projectId = value;
        } else {
          filters.projectKey = value.toUpperCase();
        }
      }
    }
  }

  private parseFieldFilter(
    jql: string,
    fieldName: string,
    filters: IssueFilters,
    singleKey: string,
    multiKey?: string,
    excludeKey?: string,
    excludeMultiKey?: string
  ): void {
    // Check for NOT IN operator
    if (excludeMultiKey) {
      const notInMatch = jql.match(new RegExp(`${fieldName}\\s+not\\s+in\\s*\\(([^)]+)\\)`, 'i'));
      if (notInMatch) {
        const values = notInMatch[1]
          .split(',')
          .map((v) => this.cleanValue(v));
        (filters as any)[excludeMultiKey] = values;
        return;
      }
    }

    // Check for IN operator
    if (multiKey) {
      const inMatch = jql.match(new RegExp(`${fieldName}\\s+in\\s*\\(([^)]+)\\)`, 'i'));
      if (inMatch) {
        const values = inMatch[1]
          .split(',')
          .map((v) => this.cleanValue(v));
        (filters as any)[multiKey] = values;
        return;
      }
    }

    // Check for != operator (with quoted or unquoted value)
    if (excludeKey) {
      // Try quoted first
      const notEqualsQuotedMatch = jql.match(new RegExp(`${fieldName}\\s*!=\\s*["']([^"']+)["']`, 'i'));
      if (notEqualsQuotedMatch) {
        (filters as any)[excludeKey] = notEqualsQuotedMatch[1];
        return;
      }
      // Try unquoted
      const notEqualsMatch = jql.match(new RegExp(`${fieldName}\\s*!=\\s*([^\\s,]+)`, 'i'));
      if (notEqualsMatch) {
        (filters as any)[excludeKey] = notEqualsMatch[1];
        return;
      }
    }

    // Check for = operator (with quoted or unquoted value)
    // Try quoted first (to handle values with spaces)
    const quotedMatch = jql.match(new RegExp(`${fieldName}\\s*=\\s*["']([^"']+)["']`, 'i'));
    if (quotedMatch) {
      (filters as any)[singleKey] = quotedMatch[1];
      return;
    }

    // Try unquoted
    const unquotedMatch = jql.match(new RegExp(`${fieldName}\\s*=\\s*([^\\s,]+)`, 'i'));
    if (unquotedMatch) {
      (filters as any)[singleKey] = unquotedMatch[1];
    }
  }

  private parseUserField(jql: string, fieldName: 'assignee' | 'reporter', filters: IssueFilters): void {
    // Check for NOT IN
    const notInMatch = jql.match(new RegExp(`${fieldName}\\s+not\\s+in\\s*\\(([^)]+)\\)`, 'i'));
    if (notInMatch) {
      const values = notInMatch[1]
        .split(',')
        .map((v) => this.processUserValue(v.trim().replace(/["']/g, '')));
      (filters as any)[`${fieldName}sExclude`] = values;
      return;
    }

    // Check for IN
    const inMatch = jql.match(new RegExp(`${fieldName}\\s+in\\s*\\(([^)]+)\\)`, 'i'));
    if (inMatch) {
      const values = inMatch[1]
        .split(',')
        .map((v) => this.processUserValue(v.trim().replace(/["']/g, '')));
      (filters as any)[`${fieldName}s`] = values;
      return;
    }

    // Check for !=
    const notEqualsMatch = jql.match(new RegExp(`${fieldName}\\s*!=\\s*([^\\s,]+(?:\\([^)]*\\))?)`, 'i'));
    if (notEqualsMatch) {
      const value = this.processUserValue(notEqualsMatch[1]);
      (filters as any)[`${fieldName}Exclude`] = value;
      return;
    }

    // Check for =
    const equalsMatch = jql.match(new RegExp(`${fieldName}\\s*=\\s*([^\\s,]+(?:\\([^)]*\\))?)`, 'i'));
    if (equalsMatch) {
      const value = this.processUserValue(equalsMatch[1]);
      (filters as any)[fieldName] = value;
    }
  }

  private processUserValue(value: string): string {
    if (value.toLowerCase() === 'currentuser()') {
      const currentUser = this.dataStore.getCurrentUser();
      return currentUser?.accountId || value.toLowerCase();
    }
    return value.toLowerCase();
  }

  private parseLabelFilters(jql: string, filters: IssueFilters): void {
    // NOT IN
    const notInMatch = jql.match(/labels\s+not\s+in\s*\(([^)]+)\)/i);
    if (notInMatch) {
      filters.labelsExclude = notInMatch[1]
        .split(',')
        .map((v) => v.trim().replace(/["']/g, '').toLowerCase());
      return;
    }

    // IN
    const inMatch = jql.match(/labels\s+in\s*\(([^)]+)\)/i);
    if (inMatch) {
      filters.labels = inMatch[1]
        .split(',')
        .map((v) => v.trim().replace(/["']/g, '').toLowerCase());
      return;
    }

    // Single =
    const equalsMatch = jql.match(/labels\s*=\s*([^\\s,]+)/i);
    if (equalsMatch) {
      filters.labels = [equalsMatch[1].toLowerCase()];
    }
  }

  private parseKeyFilters(jql: string, filters: IssueFilters): void {
    // NOT IN
    const notInMatch = jql.match(/key\s+not\s+in\s*\(([^)]+)\)/i);
    if (notInMatch) {
      filters.keysExclude = notInMatch[1]
        .split(',')
        .map((k) => k.trim().replace(/["']/g, '').toUpperCase());
      return;
    }

    // IN
    const inMatch = jql.match(/key\s+in\s*\(([^)]+)\)/i);
    if (inMatch) {
      filters.keys = inMatch[1]
        .split(',')
        .map((k) => k.trim().replace(/["']/g, '').toUpperCase());
    }
  }

  private parseEmptyFilters(jql: string, filters: IssueFilters): void {
    // Assignee IS EMPTY / IS NOT EMPTY
    if (/assignee\s+is\s+empty/i.test(jql)) {
      filters.assigneeIsEmpty = true;
    }
    if (/assignee\s+is\s+not\s+empty/i.test(jql)) {
      filters.assigneeIsNotEmpty = true;
    }

    // Reporter IS EMPTY / IS NOT EMPTY
    if (/reporter\s+is\s+empty/i.test(jql)) {
      filters.reporterIsEmpty = true;
    }
    if (/reporter\s+is\s+not\s+empty/i.test(jql)) {
      filters.reporterIsNotEmpty = true;
    }

    // Labels IS EMPTY / IS NOT EMPTY
    if (/labels\s+is\s+empty/i.test(jql)) {
      filters.labelsIsEmpty = true;
    }
    if (/labels\s+is\s+not\s+empty/i.test(jql)) {
      filters.labelsIsNotEmpty = true;
    }

    // Resolution IS EMPTY / IS NOT EMPTY
    if (/resolution\s+is\s+empty/i.test(jql)) {
      filters.resolutionIsEmpty = true;
    }
    if (/resolution\s+is\s+not\s+empty/i.test(jql)) {
      filters.resolutionIsNotEmpty = true;
    }
  }

  private parseTextFilters(jql: string, filters: IssueFilters): void {
    // Summary ~ (contains)
    const summaryContainsMatch = jql.match(/summary\s*~\s*["']([^"']+)["']/i);
    if (summaryContainsMatch) {
      filters.summaryContains = summaryContainsMatch[1];
    }

    // Summary !~ (does not contain)
    const summaryNotContainsMatch = jql.match(/summary\s*!~\s*["']([^"']+)["']/i);
    if (summaryNotContainsMatch) {
      filters.summaryNotContains = summaryNotContainsMatch[1];
    }

    // Description ~ (contains)
    const descContainsMatch = jql.match(/description\s*~\s*["']([^"']+)["']/i);
    if (descContainsMatch) {
      filters.descriptionContains = descContainsMatch[1];
    }

    // Description !~ (does not contain)
    const descNotContainsMatch = jql.match(/description\s*!~\s*["']([^"']+)["']/i);
    if (descNotContainsMatch) {
      filters.descriptionNotContains = descNotContainsMatch[1];
    }

    // Text ~ (full-text search)
    const textContainsMatch = jql.match(/text\s*~\s*["']([^"']+)["']/i);
    if (textContainsMatch) {
      filters.textContains = textContainsMatch[1];
    }
  }

  private parseDateFilters(jql: string, filters: IssueFilters): void {
    // Created date filters
    this.parseDateField(jql, 'created', filters, 'createdAfter', 'createdBefore', 'createdEquals');

    // Updated date filters
    this.parseDateField(jql, 'updated', filters, 'updatedAfter', 'updatedBefore', 'updatedEquals');

    // Resolved date filters
    this.parseDateField(jql, 'resolved', filters, 'resolvedAfter', 'resolvedBefore');

    // Due date filters
    this.parseDateField(jql, 'due', filters, 'dueAfter', 'dueBefore');
    this.parseDateField(jql, 'duedate', filters, 'dueAfter', 'dueBefore');
  }

  private parseDateField(
    jql: string,
    fieldName: string,
    filters: IssueFilters,
    afterKey: string,
    beforeKey: string,
    equalsKey?: string
  ): void {
    // >= operator (after or equals)
    const gteMatch = jql.match(new RegExp(`${fieldName}\\s*>=\\s*([^\\s,)]+(?:\\(\\))?)`, 'i'));
    if (gteMatch) {
      (filters as any)[afterKey] = parseDateValue(gteMatch[1]);
      return;
    }

    // > operator (after)
    const gtMatch = jql.match(new RegExp(`${fieldName}\\s*>\\s*([^\\s,)]+(?:\\(\\))?)`, 'i'));
    if (gtMatch) {
      const date = new Date(parseDateValue(gtMatch[1]));
      date.setMilliseconds(date.getMilliseconds() + 1);
      (filters as any)[afterKey] = date.toISOString();
      return;
    }

    // <= operator (before or equals)
    const lteMatch = jql.match(new RegExp(`${fieldName}\\s*<=\\s*([^\\s,)]+(?:\\(\\))?)`, 'i'));
    if (lteMatch) {
      (filters as any)[beforeKey] = parseDateValue(lteMatch[1]);
      return;
    }

    // < operator (before)
    const ltMatch = jql.match(new RegExp(`${fieldName}\\s*<\\s*([^\\s,)]+(?:\\(\\))?)`, 'i'));
    if (ltMatch) {
      const date = new Date(parseDateValue(ltMatch[1]));
      date.setMilliseconds(date.getMilliseconds() - 1);
      (filters as any)[beforeKey] = date.toISOString();
      return;
    }

    // = operator (equals)
    if (equalsKey) {
      const eqMatch = jql.match(new RegExp(`${fieldName}\\s*=\\s*([^\\s,)]+(?:\\(\\))?)`, 'i'));
      if (eqMatch) {
        (filters as any)[equalsKey] = parseDateValue(eqMatch[1]);
      }
    }
  }

  private cleanValue(value: string): string {
    return value.trim().replace(/["']/g, '');
  }

  private parseComponentFilters(jql: string, filters: IssueFilters): void {
    // Check for IS EMPTY / IS NOT EMPTY
    if (/component\s+is\s+empty/i.test(jql)) {
      filters.componentIsEmpty = true;
      return;
    }
    if (/component\s+is\s+not\s+empty/i.test(jql)) {
      filters.componentIsNotEmpty = true;
      return;
    }

    // Check for IN
    const inMatch = jql.match(/component\s+in\s*\(([^)]+)\)/i);
    if (inMatch) {
      filters.components = inMatch[1]
        .split(',')
        .map((v) => this.cleanValue(v));
      return;
    }

    // Check for =
    const equalsMatch = jql.match(/component\s*=\s*["']?([^"'\s,]+(?:\s+[^"'\s,]+)*)["']?/i);
    if (equalsMatch) {
      const quotedMatch = jql.match(/component\s*=\s*["']([^"']+)["']/i);
      filters.component = quotedMatch ? quotedMatch[1] : equalsMatch[1];
    }
  }

  private parseVersionFilters(jql: string, filters: IssueFilters): void {
    // Fix version filters
    if (/fixversion\s+is\s+empty/i.test(jql)) {
      filters.fixVersionIsEmpty = true;
    }
    if (/fixversion\s+is\s+not\s+empty/i.test(jql)) {
      filters.fixVersionIsNotEmpty = true;
    }

    const fixVersionInMatch = jql.match(/fixversion\s+in\s*\(([^)]+)\)/i);
    if (fixVersionInMatch) {
      filters.fixVersions = fixVersionInMatch[1]
        .split(',')
        .map((v) => this.cleanValue(v));
    } else {
      const fixVersionMatch = jql.match(/fixversion\s*=\s*["']?([^"'\s,]+(?:\s+[^"'\s,]+)*)["']?/i);
      if (fixVersionMatch) {
        const quotedMatch = jql.match(/fixversion\s*=\s*["']([^"']+)["']/i);
        filters.fixVersion = quotedMatch ? quotedMatch[1] : fixVersionMatch[1];
      }
    }

    // Affected version filters
    const affectedVersionInMatch = jql.match(/affectedversion\s+in\s*\(([^)]+)\)/i);
    if (affectedVersionInMatch) {
      filters.affectedVersions = affectedVersionInMatch[1]
        .split(',')
        .map((v) => this.cleanValue(v));
    } else {
      const affectedVersionMatch = jql.match(/affectedversion\s*=\s*["']?([^"'\s,]+(?:\s+[^"'\s,]+)*)["']?/i);
      if (affectedVersionMatch) {
        const quotedMatch = jql.match(/affectedversion\s*=\s*["']([^"']+)["']/i);
        filters.affectedVersion = quotedMatch ? quotedMatch[1] : affectedVersionMatch[1];
      }
    }
  }

  private parseSprintFilters(jql: string, filters: IssueFilters): void {
    // Check for IS EMPTY / IS NOT EMPTY
    if (/sprint\s+is\s+empty/i.test(jql)) {
      filters.sprintIsEmpty = true;
      return;
    }
    if (/sprint\s+is\s+not\s+empty/i.test(jql)) {
      filters.sprintIsNotEmpty = true;
      return;
    }

    // Check for IN
    const inMatch = jql.match(/sprint\s+in\s*\(([^)]+)\)/i);
    if (inMatch) {
      filters.sprints = inMatch[1]
        .split(',')
        .map((v) => this.cleanValue(v));
      return;
    }

    // Check for =
    const equalsMatch = jql.match(/sprint\s*=\s*["']?([^"'\s,]+(?:\s+[^"'\s,]+)*)["']?/i);
    if (equalsMatch) {
      const quotedMatch = jql.match(/sprint\s*=\s*["']([^"']+)["']/i);
      filters.sprint = quotedMatch ? quotedMatch[1] : equalsMatch[1];
    }
  }
}
