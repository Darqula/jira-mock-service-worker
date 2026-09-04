import { http, HttpResponse } from 'msw';
import type { DataStore } from '@jira-mock/core';

export function createProjectPropertiesHandlers(dataStore: DataStore, baseUrl: string) {
  return [
    // GET /rest/api/2/project/{projectIdOrKey}/properties - Get all property keys
    http.get(`${baseUrl}/rest/api/2/project/:projectIdOrKey/properties`, ({ params }) => {
      const { projectIdOrKey } = params;

      const project = dataStore.getProject(projectIdOrKey as string);
      if (!project) {
        return HttpResponse.json({ errorMessages: ['Project not found'] }, { status: 404 });
      }

      const properties = dataStore.getAllProjectProperties(project.id);

      return HttpResponse.json({
        keys: properties.map((prop) => ({
          self: `${baseUrl}/rest/api/2/project/${project.id}/properties/${prop.key}`,
          key: prop.key,
        })),
      });
    }),

    // GET /rest/api/2/project/{projectIdOrKey}/properties/{propertyKey} - Get project property
    http.get(
      `${baseUrl}/rest/api/2/project/:projectIdOrKey/properties/:propertyKey`,
      ({ params }) => {
        const { projectIdOrKey, propertyKey } = params;

        const project = dataStore.getProject(projectIdOrKey as string);
        if (!project) {
          return HttpResponse.json({ errorMessages: ['Project not found'] }, { status: 404 });
        }

        const property = dataStore.getProjectProperty(project.id, propertyKey as string);
        if (!property) {
          return HttpResponse.json({ errorMessages: ['Property not found'] }, { status: 404 });
        }

        return HttpResponse.json(property);
      }
    ),

    // PUT /rest/api/2/project/{projectIdOrKey}/properties/{propertyKey} - Set project property
    http.put(
      `${baseUrl}/rest/api/2/project/:projectIdOrKey/properties/:propertyKey`,
      async ({ params, request }) => {
        const { projectIdOrKey, propertyKey } = params;

        const project = dataStore.getProject(projectIdOrKey as string);
        if (!project) {
          return HttpResponse.json({ errorMessages: ['Project not found'] }, { status: 404 });
        }

        const value = await request.json();
        dataStore.setProjectProperty(project.id, propertyKey as string, value);

        return HttpResponse.json(null, { status: 201 });
      }
    ),

    // DELETE /rest/api/2/project/{projectIdOrKey}/properties/{propertyKey} - Delete project property
    http.delete(
      `${baseUrl}/rest/api/2/project/:projectIdOrKey/properties/:propertyKey`,
      ({ params }) => {
        const { projectIdOrKey, propertyKey } = params;

        const project = dataStore.getProject(projectIdOrKey as string);
        if (!project) {
          return HttpResponse.json({ errorMessages: ['Project not found'] }, { status: 404 });
        }

        const deleted = dataStore.deleteProjectProperty(project.id, propertyKey as string);
        if (!deleted) {
          return HttpResponse.json({ errorMessages: ['Property not found'] }, { status: 404 });
        }

        return HttpResponse.json(null, { status: 204 });
      }
    ),
  ];
}
