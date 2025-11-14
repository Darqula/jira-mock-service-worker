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

    // Normalize the JQL string
    const normalized = jql.trim().toLowerCase();

    // Parse project
    const projectMatch = normalized.match(/project\s*=\s*([a-z0-9_-]+)/i);
    if (projectMatch) {
      filters.projectKey = projectMatch[1].toUpperCase();
    }

    // Parse status
    const statusMatch = normalized.match(/status\s*=\s*["']?([^"'\s]+)["']?/i);
    if (statusMatch) {
      filters.status = this.capitalize(statusMatch[1]);
    }

    // Parse assignee
    const assigneeMatch = normalized.match(
      /assignee\s*=\s*["']?([^"'\s]+)["']?/i
    );
    if (assigneeMatch) {
      const assignee = assigneeMatch[1];
      if (assignee === 'currentuser()') {
        const currentUser = this.dataStore.getCurrentUser();
        if (currentUser) {
          filters.assignee = currentUser.accountId;
        }
      } else {
        filters.assignee = assignee;
      }
    }

    // Parse reporter
    const reporterMatch = normalized.match(
      /reporter\s*=\s*["']?([^"'\s]+)["']?/i
    );
    if (reporterMatch) {
      const reporter = reporterMatch[1];
      if (reporter === 'currentuser()') {
        const currentUser = this.dataStore.getCurrentUser();
        if (currentUser) {
          filters.reporter = currentUser.accountId;
        }
      } else {
        filters.reporter = reporter;
      }
    }

    // Parse priority
    const priorityMatch = normalized.match(/priority\s*=\s*["']?([^"'\s]+)["']?/i);
    if (priorityMatch) {
      filters.priority = this.capitalize(priorityMatch[1]);
    }

    // Parse issuetype
    const issueTypeMatch = normalized.match(
      /issuetype\s*=\s*["']?([^"'\s]+)["']?/i
    );
    if (issueTypeMatch) {
      filters.issueType = this.capitalize(issueTypeMatch[1]);
    }

    // Parse labels (simple version - single label)
    const labelMatch = normalized.match(/labels\s*=\s*["']?([^"'\s]+)["']?/i);
    if (labelMatch) {
      filters.labels = [labelMatch[1]];
    }

    // Parse IN clauses for issue keys
    const keysMatch = normalized.match(/key\s+in\s*\(([^)]+)\)/i);
    if (keysMatch) {
      filters.keys = keysMatch[1]
        .split(',')
        .map((k) => k.trim().replace(/["']/g, '').toUpperCase());
    }

    return filters;
  }

  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}
