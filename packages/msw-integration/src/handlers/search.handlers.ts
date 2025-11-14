import { http, HttpResponse } from 'msw';
import type { QueryEngine } from '@jira-mock/core';

export function createSearchHandlers(
  queryEngine: QueryEngine,
  baseUrl: string
) {
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

      const results = queryEngine.executeJQL({
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
      const startAt = parseInt(url.searchParams.get('startAt') || '0', 10);
      const maxResults = parseInt(url.searchParams.get('maxResults') || '50', 10);
      const fields = url.searchParams.get('fields')?.split(',');
      const expand = url.searchParams.get('expand')?.split(',');

      const results = queryEngine.executeJQL({
        jql,
        startAt,
        maxResults,
        fields,
        expand,
      });

      return HttpResponse.json(results);
    }),
  ];
}
