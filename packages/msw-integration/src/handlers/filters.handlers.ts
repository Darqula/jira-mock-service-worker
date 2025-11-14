import { http, HttpResponse } from 'msw';
import type { DataStore } from '@jira-mock/core';

export function createFiltersHandlers(dataStore: DataStore, baseUrl: string) {
  // Helper to get mock filters
  const getMockFilters = (currentUser: any) => {
    return currentUser
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
          {
            self: `${baseUrl}/rest/api/2/filter/10002`,
            id: '10002',
            name: 'High Priority Bugs',
            description: 'All high priority bugs',
            owner: currentUser,
            jql: `type = Bug AND priority in (High, Highest)`,
            viewUrl: `${baseUrl}/issues/?filter=10002`,
            searchUrl: `${baseUrl}/rest/api/2/search?jql=type+%3D+Bug+AND+priority+in+(High%2C+Highest)`,
            favourite: false,
            sharePermissions: [],
          },
        ]
      : [];
  };

  return [
    // GET /rest/api/2/filter/:filterId - Get filter by ID
    http.get(`${baseUrl}/rest/api/2/filter/:filterId`, ({ params }) => {
      const { filterId } = params;
      const currentUser = dataStore.getCurrentUser();

      const mockFilters = getMockFilters(currentUser);
      const filter = mockFilters.find((f) => f.id === filterId);

      if (!filter) {
        return HttpResponse.json(
          { errorMessages: ['Filter not found'] },
          { status: 404 }
        );
      }

      return HttpResponse.json(filter);
    }),

    // GET /rest/api/2/filter/search - Search for filters
    http.get(`${baseUrl}/rest/api/2/filter/search`, ({ request }) => {
      const url = new URL(request.url);
      const startAt = parseInt(url.searchParams.get('startAt') || '0', 10);
      const maxResults = parseInt(url.searchParams.get('maxResults') || '50', 10);

      const currentUser = dataStore.getCurrentUser();
      const mockFilters = getMockFilters(currentUser);

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
