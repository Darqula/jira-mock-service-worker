import { http, HttpResponse } from 'msw';
import type { DataStore } from '@jira-mock/core';

export function createFiltersHandlers(dataStore: DataStore, baseUrl: string) {
  return [
    // GET /rest/api/2/filter/search - Search for filters
    http.get(`${baseUrl}/rest/api/2/filter/search`, ({ request }) => {
      const url = new URL(request.url);
      const startAt = parseInt(url.searchParams.get('startAt') || '0', 10);
      const maxResults = parseInt(url.searchParams.get('maxResults') || '50', 10);

      const currentUser = dataStore.getCurrentUser();

      // Generate some mock filters
      const mockFilters = currentUser
        ? [
            {
              self: `${baseUrl}/rest/api/2/filter/10000`,
              id: '10000',
              name: 'My Open Issues',
              description: 'All issues assigned to me that are not done',
              owner: currentUser,
              jql: `assignee = currentUser() AND status != Done`,
              viewUrl: `${baseUrl}/issues/?filter=10000`,
              searchUrl: `${baseUrl}/rest/api/2/search?jql=assignee+%3D+currentUser()+AND+status+!%3D+Done`,
              favourite: true,
              sharePermissions: [],
            },
            {
              self: `${baseUrl}/rest/api/2/filter/10001`,
              id: '10001',
              name: 'Recently Updated',
              description: 'Issues updated in the last 7 days',
              owner: currentUser,
              jql: `updated >= -7d ORDER BY updated DESC`,
              viewUrl: `${baseUrl}/issues/?filter=10001`,
              searchUrl: `${baseUrl}/rest/api/2/search?jql=updated+%3E%3D+-7d+ORDER+BY+updated+DESC`,
              favourite: false,
              sharePermissions: [],
            },
          ]
        : [];

      const total = mockFilters.length;
      const paginatedFilters = mockFilters.slice(startAt, startAt + maxResults);

      return HttpResponse.json({
        self: `${baseUrl}/rest/api/2/filter/search`,
        maxResults,
        startAt,
        total,
        isLast: startAt + paginatedFilters.length >= total,
        values: paginatedFilters,
      });
    }),
  ];
}
