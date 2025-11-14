import { http, HttpResponse } from 'msw';
import type { DataStore } from '@jira-mock/core';

export function createUserPropertiesHandlers(dataStore: DataStore, baseUrl: string) {
  return [
    // GET /rest/api/2/user/properties/{propertyKey} - Get user property
    http.get(`${baseUrl}/rest/api/2/user/properties/:propertyKey`, ({ params, request }) => {
      const { propertyKey } = params;
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

      const property = dataStore.getUserProperty(accountId, propertyKey as string);
      if (!property) {
        return HttpResponse.json(
          { errorMessages: ['Property not found'] },
          { status: 404 }
        );
      }

      return HttpResponse.json(property);
    }),

    // PUT /rest/api/2/user/properties/{propertyKey} - Set user property
    http.put(`${baseUrl}/rest/api/2/user/properties/:propertyKey`, async ({ params, request }) => {
      const { propertyKey } = params;
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

      const value = await request.json();
      dataStore.setUserProperty(accountId, propertyKey as string, value);

      return HttpResponse.json(null, { status: 201 });
    }),

    // DELETE /rest/api/2/user/properties/{propertyKey} - Delete user property
    http.delete(`${baseUrl}/rest/api/2/user/properties/:propertyKey`, ({ params, request }) => {
      const { propertyKey } = params;
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

      const deleted = dataStore.deleteUserProperty(accountId, propertyKey as string);
      if (!deleted) {
        return HttpResponse.json(
          { errorMessages: ['Property not found'] },
          { status: 404 }
        );
      }

      return HttpResponse.json(null, { status: 204 });
    }),
  ];
}
