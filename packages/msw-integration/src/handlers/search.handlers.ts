import { http, HttpResponse } from 'msw';
import type { QueryEngine } from '@jira-mock/core';

export function createSearchHandlers(
  queryEngine: QueryEngine,
  baseUrl: string
) {
  const runSearch = (params: {
    jql: string;
    startAt: number;
    maxResults: number;
    fields?: string[];
    expand?: string[];
  }) =>
    queryEngine.executeJQL({
      jql: params.jql,
      startAt: params.startAt,
      maxResults: params.maxResults,
      fields: params.fields,
      expand: params.expand,
    });

  return [
    // POST /rest/api/2/search/jql - Search for issues using JQL
    http.post(`${baseUrl}/rest/api/2/search/jql`, async ({ request }) => {
      const body = (await request.json()) as {
        jql: string;
        startAt?: number;
        maxResults?: number;
        fields?: string[];
        expand?: string[];
      };

      if (!body.jql) {
        return HttpResponse.json(
          { errorMessages: ['JQL query is required'] },
          { status: 400 }
        );
      }

      const results = runSearch({
        jql: body.jql,
        startAt: body.startAt || 0,
        maxResults: body.maxResults || 50,
        fields: body.fields,
        expand: body.expand,
      });

      return HttpResponse.json(results);
    }),

    // GET /rest/api/2/search - Search for issues using JQL (query param version)
    http.get(`${baseUrl}/rest/api/2/search`, ({ request }) => {
      const url = new URL(request.url);
      const jql = url.searchParams.get('jql') || '';

      const results = runSearch({
        jql,
        startAt: parseInt(url.searchParams.get('startAt') || '0', 10),
        maxResults: parseInt(url.searchParams.get('maxResults') || '50', 10),
        fields: url.searchParams.get('fields')?.split(','),
        expand: url.searchParams.get('expand')?.split(','),
      });

      return HttpResponse.json(results);
    }),

    // POST /rest/api/2/search - Search for issues using JQL (JSON body version,
    // used by many Jira client libraries)
    http.post(`${baseUrl}/rest/api/2/search`, async ({ request }) => {
      const body = (await request.json()) as {
        jql?: string;
        startAt?: number;
        maxResults?: number;
        fields?: string[];
        expand?: string | string[];
      };

      const results = runSearch({
        jql: body.jql || '',
        startAt: body.startAt || 0,
        maxResults: body.maxResults || 50,
        fields: body.fields,
        expand: typeof body.expand === 'string' ? body.expand.split(',') : body.expand,
      });

      return HttpResponse.json(results);
    }),

    // POST /rest/api/2/search/approximate-count - Get approximate count of search results
    http.post(`${baseUrl}/rest/api/2/search/approximate-count`, async ({ request }) => {
      const body = (await request.json()) as {
        jql: string;
      };

      if (!body.jql) {
        return HttpResponse.json(
          { errorMessages: ['JQL query is required'] },
          { status: 400 }
        );
      }

      // Execute JQL to get actual count (in a real API this would be approximate)
      const results = queryEngine.executeJQL({
        jql: body.jql,
        startAt: 0,
        maxResults: 0,
      });

      return HttpResponse.json({
        count: results.total,
        isApproximate: false, // Mock always returns exact count
      });
    }),

    // POST /rest/api/2/jql/match - Check if issues match JQL query
    http.post(`${baseUrl}/rest/api/2/jql/match`, async ({ request }) => {
      const body = (await request.json()) as {
        issueIds: string[];
        jql: string;
      };

      if (!body.issueIds || !Array.isArray(body.issueIds)) {
        return HttpResponse.json(
          { errorMessages: ['issueIds array is required'] },
          { status: 400 }
        );
      }

      if (!body.jql) {
        return HttpResponse.json(
          { errorMessages: ['JQL query is required'] },
          { status: 400 }
        );
      }

      // Execute JQL to get matching issues
      const results = queryEngine.executeJQL({
        jql: body.jql,
        startAt: 0,
        maxResults: 1000,
      });

      const matchingIssueIds = new Set(results.issues.map((issue: any) => issue.id));

      // Build result map
      const matches: Record<string, boolean> = {};
      body.issueIds.forEach((issueId) => {
        matches[issueId] = matchingIssueIds.has(issueId);
      });

      return HttpResponse.json({
        matches,
      });
    }),

    // GET /rest/api/2/jql/autocompletedata/suggestions - Get JQL autocomplete suggestions
    http.get(`${baseUrl}/rest/api/2/jql/autocompletedata/suggestions`, ({ request }) => {
      const url = new URL(request.url);
      const fieldName = url.searchParams.get('fieldName') || '';
      const fieldValue = url.searchParams.get('fieldValue') || '';

      // Return basic autocomplete suggestions based on field name
      const suggestions: any[] = [];

      if (fieldName.toLowerCase() === 'status') {
        suggestions.push(
          { value: 'To Do', displayName: 'To Do' },
          { value: 'In Progress', displayName: 'In Progress' },
          { value: 'Done', displayName: 'Done' },
          { value: 'Open', displayName: 'Open' },
          { value: 'Closed', displayName: 'Closed' }
        );
      } else if (fieldName.toLowerCase() === 'priority') {
        suggestions.push(
          { value: 'Highest', displayName: 'Highest' },
          { value: 'High', displayName: 'High' },
          { value: 'Medium', displayName: 'Medium' },
          { value: 'Low', displayName: 'Low' },
          { value: 'Lowest', displayName: 'Lowest' }
        );
      } else if (fieldName.toLowerCase() === 'issuetype') {
        suggestions.push(
          { value: 'Bug', displayName: 'Bug' },
          { value: 'Task', displayName: 'Task' },
          { value: 'Story', displayName: 'Story' },
          { value: 'Epic', displayName: 'Epic' },
          { value: 'Subtask', displayName: 'Subtask' }
        );
      } else if (fieldName.toLowerCase() === 'resolution') {
        suggestions.push(
          { value: 'Fixed', displayName: 'Fixed' },
          { value: "Won't Fix", displayName: "Won't Fix" },
          { value: 'Duplicate', displayName: 'Duplicate' },
          { value: 'Incomplete', displayName: 'Incomplete' },
          { value: 'Cannot Reproduce', displayName: 'Cannot Reproduce' }
        );
      }

      // Filter by field value if provided
      let filteredSuggestions = suggestions;
      if (fieldValue) {
        const lowerValue = fieldValue.toLowerCase();
        filteredSuggestions = suggestions.filter((s) =>
          s.value.toLowerCase().includes(lowerValue) ||
          s.displayName.toLowerCase().includes(lowerValue)
        );
      }

      return HttpResponse.json({
        results: filteredSuggestions,
      });
    }),
  ];
}
