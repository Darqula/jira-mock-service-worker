import type { DataStore } from './data-store.js';
import type { IssueFilters, QueryOptions } from './data-store.js';
import type { SearchResults } from '../types/jira-schemas.js';

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
    const filters = this.parseJQL(query.jql);
    const options: QueryOptions = {
      startAt: query.startAt || 0,
      maxResults: query.maxResults || 50,
    };

    return this.dataStore.searchIssues(filters, options);
  }

  private parseJQL(jql: string): IssueFilters {
    const filters: IssueFilters = {};

    // Parse project (case-insensitive)
    const projectMatch = jql.match(/project\s*=\s*([a-z0-9_-]+)/i);
    if (projectMatch) {
      filters.projectKey = projectMatch[1].toUpperCase();
    }

    // Parse status
    const statusValue = this.extractFieldValue(jql, 'status');
    if (statusValue !== null) {
      filters.status = statusValue;
    }

    // Parse assignee
    const assigneeValue = this.extractFieldValue(jql, 'assignee');
    if (assigneeValue !== null) {
      if (assigneeValue.toLowerCase() === 'currentuser()') {
        const currentUser = this.dataStore.getCurrentUser();
        if (currentUser) {
          filters.assignee = currentUser.accountId;
        }
      } else {
        filters.assignee = assigneeValue;
      }
    }

    // Parse reporter
    const reporterValue = this.extractFieldValue(jql, 'reporter');
    if (reporterValue !== null) {
      if (reporterValue.toLowerCase() === 'currentuser()') {
        const currentUser = this.dataStore.getCurrentUser();
        if (currentUser) {
          filters.reporter = currentUser.accountId;
        }
      } else {
        filters.reporter = reporterValue;
      }
    }

    // Parse priority
    const priorityValue = this.extractFieldValue(jql, 'priority');
    if (priorityValue !== null) {
      filters.priority = priorityValue;
    }

    // Parse issuetype
    const issueTypeValue = this.extractFieldValue(jql, 'issuetype');
    if (issueTypeValue !== null) {
      filters.issueType = issueTypeValue;
    }

    // Parse labels
    const labelValue = this.extractFieldValue(jql, 'labels');
    if (labelValue !== null) {
      filters.labels = [labelValue];
    }

    // Parse IN clauses for issue keys
    const keysMatch = jql.match(/key\s+in\s*\(([^)]+)\)/i);
    if (keysMatch) {
      filters.keys = keysMatch[1]
        .split(',')
        .map((k) => k.trim().replace(/["']/g, '').toUpperCase());
    }

    return filters;
  }

  /**
   * Extracts a field value from JQL, handling both quoted and unquoted values
   * Quoted values preserve their case, unquoted values may be capitalized depending on field type
   */
  private extractFieldValue(jql: string, field: string): string | null {
    // Try to match quoted string first (preserves spaces and case)
    const quotedRegex = new RegExp(`${field}\\s*=\\s*"([^"]+)"`, 'i');
    const quotedMatch = jql.match(quotedRegex);
    if (quotedMatch) {
      return quotedMatch[1]; // Return with original case
    }

    const singleQuotedRegex = new RegExp(`${field}\\s*=\\s*'([^']+)'`, 'i');
    const singleQuotedMatch = jql.match(singleQuotedRegex);
    if (singleQuotedMatch) {
      return singleQuotedMatch[1]; // Return with original case
    }

    // Match unquoted value (including function calls like currentUser())
    const unquotedRegex = new RegExp(`${field}\\s*=\\s*([^\\s,]+(?:\\([^)]*\\))?)`, 'i');
    const unquotedMatch = jql.match(unquotedRegex);
    if (unquotedMatch) {
      const value = unquotedMatch[1];

      // Don't capitalize certain field types (assignee, reporter, labels) or function calls
      if (field === 'assignee' || field === 'reporter' || field === 'labels' || value.includes('(')) {
        return value.toLowerCase();
      }

      return this.capitalize(value);
    }

    return null;
  }

  private capitalize(str: string): string {
    return str
      .split(' ') // Split only on spaces, preserve hyphens and underscores
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }
}
