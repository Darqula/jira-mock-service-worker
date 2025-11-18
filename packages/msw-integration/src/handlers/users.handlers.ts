import { http, HttpResponse } from 'msw';
import type { DataStore } from '@jira-mock/core';
import { PermissionGenerator } from '@jira-mock/core';
import { createGenerationContext } from '../utils/generation-context.js';

export function createUsersHandlers(dataStore: DataStore, baseUrl: string) {
  const permissionGenerator = new PermissionGenerator();

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

    // GET /rest/api/2/user/assignable/multiProjectSearch - Find assignable users for multiple projects
    http.get(`${baseUrl}/rest/api/2/user/assignable/multiProjectSearch`, ({ request }) => {
      const url = new URL(request.url);
      const query = url.searchParams.get('query') || '';
      // const projectKeys = url.searchParams.get('projectKeys')?.split(',') || [];
      const maxResults = parseInt(url.searchParams.get('maxResults') || '50', 10);

      // For simplicity, return all users that match the query (in real Jira, this would filter by project permissions)
      const users = dataStore.searchUsers(query, maxResults);
      return HttpResponse.json(users);
    }),

    // GET /rest/api/2/user/search/query - Advanced user search
    http.get(`${baseUrl}/rest/api/2/user/search/query`, ({ request }) => {
      const url = new URL(request.url);
      const query = url.searchParams.get('query') || '';
      const maxResults = parseInt(url.searchParams.get('maxResults') || '50', 10);
      const startAt = parseInt(url.searchParams.get('startAt') || '0', 10);

      const allUsers = dataStore.searchUsers(query, 1000); // Get all matching
      const total = allUsers.length;
      const users = allUsers.slice(startAt, startAt + maxResults);

      return HttpResponse.json({
        self: `${baseUrl}/rest/api/2/user/search/query`,
        maxResults,
        startAt,
        total,
        isLast: startAt + users.length >= total,
        values: users,
      });
    }),

    // GET /rest/api/2/mypermissions - Get current user's permissions
    http.get(`${baseUrl}/rest/api/2/mypermissions`, () => {
      const currentUser = dataStore.getCurrentUser();
      if (!currentUser) {
        return HttpResponse.json(
          { errorMessages: ['User not found'] },
          { status: 401 }
        );
      }

      // Check if permissions are already stored
      let permissions = dataStore.getUserPermissions(currentUser.accountId);

      if (permissions.length === 0) {
        // Generate permissions if not already stored
        const context = createGenerationContext();
        permissions = permissionGenerator.generateUserPermissions(currentUser, context);
        dataStore.setUserPermissions(currentUser.accountId, permissions);
      }

      // Convert to the expected format
      const permissionsMap: Record<string, any> = {};
      permissions.forEach(perm => {
        permissionsMap[perm.key] = {
          id: perm.id,
          key: perm.key,
          name: perm.name,
          type: perm.type,
          description: perm.description,
          havePermission: perm.havePermission,
        };
      });

      return HttpResponse.json({
        permissions: permissionsMap,
      });
    }),
  ];
}
