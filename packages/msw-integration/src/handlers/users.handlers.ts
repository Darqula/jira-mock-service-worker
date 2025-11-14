import { http, HttpResponse } from 'msw';
import type { DataStore } from '@jira-mock/core';

export function createUsersHandlers(dataStore: DataStore, baseUrl: string) {
  return [
    // GET /rest/api/2/myself - Get current user
    http.get(`${baseUrl}/rest/api/2/myself`, () => {
      const currentUser = dataStore.getCurrentUser();
      if (!currentUser) {
        return HttpResponse.json(
          { errorMessages: ['User not found'] },
          { status: 404 }
        );
      }
      return HttpResponse.json(currentUser);
    }),

    // GET /rest/api/2/user - Get user by accountId
    http.get(`${baseUrl}/rest/api/2/user`, ({ request }) => {
      const url = new URL(request.url);
      const accountId = url.searchParams.get('accountId');

      if (!accountId) {
        return HttpResponse.json(
          { errorMessages: ['accountId parameter is required'] },
          { status: 400 }
        );
      }

      const user = dataStore.getUser(accountId);
      if (!user) {
        return HttpResponse.json(
          { errorMessages: ['User not found'] },
          { status: 404 }
        );
      }

      return HttpResponse.json(user);
    }),

    // GET /rest/api/2/user/search - Search users
    http.get(`${baseUrl}/rest/api/2/user/search`, ({ request }) => {
      const url = new URL(request.url);
      const query = url.searchParams.get('query') || '';
      const maxResults = parseInt(url.searchParams.get('maxResults') || '50', 10);

      const users = dataStore.searchUsers(query, maxResults);
      return HttpResponse.json(users);
    }),
  ];
}
