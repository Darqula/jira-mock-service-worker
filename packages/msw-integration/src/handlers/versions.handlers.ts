import { http, HttpResponse } from 'msw';
import type { DataStore, Version } from '@jira-mock/core';

interface CreateVersionInput {
  name: string;
  description?: string;
  archived?: boolean;
  released?: boolean;
  releaseDate?: string;
  projectId: number;
}

interface UpdateVersionInput {
  name?: string;
  description?: string;
  archived?: boolean;
  released?: boolean;
  releaseDate?: string;
}

export function createVersionsHandlers(dataStore: DataStore, baseUrl: string) {
  return [
    // GET /rest/api/2/project/:projectIdOrKey/versions - Get project versions
    http.get(`${baseUrl}/rest/api/2/project/:projectIdOrKey/versions`, ({ params }) => {
      const { projectIdOrKey } = params;

      const project = dataStore.getProject(projectIdOrKey as string);
      if (!project) {
        return HttpResponse.json(
          { errorMessages: ['Project not found'] },
          { status: 404 }
        );
      }

      const versions = dataStore.getVersionsByProject(project.id);
      return HttpResponse.json(versions);
    }),

    // GET /rest/api/2/version/:id - Get version by ID
    http.get(`${baseUrl}/rest/api/2/version/:id`, ({ params }) => {
      const { id } = params;

      const version = dataStore.getVersion(id as string);
      if (!version) {
        return HttpResponse.json(
          { errorMessages: ['Version not found'] },
          { status: 404 }
        );
      }

      return HttpResponse.json(version);
    }),

    // POST /rest/api/2/version - Create a version
    http.post(`${baseUrl}/rest/api/2/version`, async ({ request }) => {
      const body = (await request.json()) as CreateVersionInput;

      if (!body.name || body.name.trim() === '') {
        return HttpResponse.json(
          { errorMessages: ['Version name is required'] },
          { status: 400 }
        );
      }

      if (!body.projectId) {
        return HttpResponse.json(
          { errorMessages: ['Project ID is required'] },
          { status: 400 }
        );
      }

      const project = dataStore.getProject(body.projectId.toString());
      if (!project) {
        return HttpResponse.json(
          { errorMessages: ['Project not found'] },
          { status: 404 }
        );
      }

      const versionId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const version: Version = {
        self: `${baseUrl}/rest/api/2/version/${versionId}`,
        id: versionId,
        name: body.name,
        description: body.description,
        archived: body.archived ?? false,
        released: body.released ?? false,
        releaseDate: body.releaseDate,
        projectId: body.projectId,
      };

      dataStore.addVersion(version);

      return HttpResponse.json(version, { status: 201 });
    }),

    // PUT /rest/api/2/version/:id - Update a version
    http.put(`${baseUrl}/rest/api/2/version/:id`, async ({ params, request }) => {
      const { id } = params;
      const body = (await request.json()) as UpdateVersionInput;

      const version = dataStore.getVersion(id as string);
      if (!version) {
        return HttpResponse.json(
          { errorMessages: ['Version not found'] },
          { status: 404 }
        );
      }

      const updatedVersion: Version = {
        ...version,
        name: body.name ?? version.name,
        description: body.description ?? version.description,
        archived: body.archived ?? version.archived,
        released: body.released ?? version.released,
        releaseDate: body.releaseDate ?? version.releaseDate,
      };

      dataStore.addVersion(updatedVersion); // This will overwrite

      return HttpResponse.json(updatedVersion);
    }),

    // DELETE /rest/api/2/version/:id - Delete a version
    http.delete(`${baseUrl}/rest/api/2/version/:id`, ({ params }) => {
      const { id } = params;

      const version = dataStore.getVersion(id as string);
      if (!version) {
        return HttpResponse.json(
          { errorMessages: ['Version not found'] },
          { status: 404 }
        );
      }

      // Note: In the real API, you might want to check if the version is in use
      // For now, we'll just return success
      // A proper implementation would need a deleteVersion method in DataStore

      return HttpResponse.json(null, { status: 204 });
    }),
  ];
}
