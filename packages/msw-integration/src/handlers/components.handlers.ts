import { http, HttpResponse } from 'msw';
import type { DataStore, Component } from '@jira-mock/core';

interface CreateComponentInput {
  name: string;
  description?: string;
  leadAccountId?: string;
  assigneeType?: 'PROJECT_DEFAULT' | 'COMPONENT_LEAD' | 'PROJECT_LEAD' | 'UNASSIGNED';
  project: string;
}

interface UpdateComponentInput {
  name?: string;
  description?: string;
  leadAccountId?: string;
  assigneeType?: 'PROJECT_DEFAULT' | 'COMPONENT_LEAD' | 'PROJECT_LEAD' | 'UNASSIGNED';
}

export function createComponentsHandlers(dataStore: DataStore, baseUrl: string) {
  return [
    // GET /rest/api/2/project/:projectIdOrKey/components - Get project components
    http.get(`${baseUrl}/rest/api/2/project/:projectIdOrKey/components`, ({ params }) => {
      const { projectIdOrKey } = params;

      const project = dataStore.getProject(projectIdOrKey as string);
      if (!project) {
        return HttpResponse.json(
          { errorMessages: ['Project not found'] },
          { status: 404 }
        );
      }

      const components = dataStore.getComponentsByProject(projectIdOrKey as string);
      return HttpResponse.json(components);
    }),

    // GET /rest/api/2/component/:id - Get component by ID
    http.get(`${baseUrl}/rest/api/2/component/:id`, ({ params }) => {
      const { id } = params;

      const component = dataStore.getComponent(id as string);
      if (!component) {
        return HttpResponse.json(
          { errorMessages: ['Component not found'] },
          { status: 404 }
        );
      }

      return HttpResponse.json(component);
    }),

    // POST /rest/api/2/component - Create a component
    http.post(`${baseUrl}/rest/api/2/component`, async ({ request }) => {
      const body = (await request.json()) as CreateComponentInput;

      if (!body.name || body.name.trim() === '') {
        return HttpResponse.json(
          { errorMessages: ['Component name is required'] },
          { status: 400 }
        );
      }

      if (!body.project) {
        return HttpResponse.json(
          { errorMessages: ['Project is required'] },
          { status: 400 }
        );
      }

      const project = dataStore.getProject(body.project);
      if (!project) {
        return HttpResponse.json(
          { errorMessages: ['Project not found'] },
          { status: 404 }
        );
      }

      let lead;
      if (body.leadAccountId) {
        lead = dataStore.getUser(body.leadAccountId);
        if (!lead) {
          return HttpResponse.json(
            { errorMessages: ['Lead user not found'] },
            { status: 404 }
          );
        }
      }

      const componentId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const component: Component = {
        self: `${baseUrl}/rest/api/2/component/${componentId}`,
        id: componentId,
        name: body.name,
        description: body.description,
        lead,
        assigneeType: body.assigneeType || 'PROJECT_DEFAULT',
        assignee: lead,
        project: project.key,
        projectId: parseInt(project.id, 10),
      };

      dataStore.addComponent(component);

      return HttpResponse.json(component, { status: 201 });
    }),

    // PUT /rest/api/2/component/:id - Update a component
    http.put(`${baseUrl}/rest/api/2/component/:id`, async ({ params, request }) => {
      const { id } = params;
      const body = (await request.json()) as UpdateComponentInput;

      const component = dataStore.getComponent(id as string);
      if (!component) {
        return HttpResponse.json(
          { errorMessages: ['Component not found'] },
          { status: 404 }
        );
      }

      let lead = component.lead;
      if (body.leadAccountId) {
        lead = dataStore.getUser(body.leadAccountId);
        if (!lead) {
          return HttpResponse.json(
            { errorMessages: ['Lead user not found'] },
            { status: 404 }
          );
        }
      }

      const updatedComponent: Component = {
        ...component,
        name: body.name ?? component.name,
        description: body.description ?? component.description,
        lead: lead ?? component.lead,
        assigneeType: body.assigneeType ?? component.assigneeType,
        assignee: lead ?? component.assignee,
      };

      dataStore.addComponent(updatedComponent); // This will overwrite

      return HttpResponse.json(updatedComponent);
    }),

    // DELETE /rest/api/2/component/:id - Delete a component
    http.delete(`${baseUrl}/rest/api/2/component/:id`, ({ params }) => {
      const { id } = params;

      const component = dataStore.getComponent(id as string);
      if (!component) {
        return HttpResponse.json(
          { errorMessages: ['Component not found'] },
          { status: 404 }
        );
      }

      // Note: In the real API, you might want to check if the component is in use
      // For now, we'll just return success
      // A proper implementation would need a deleteComponent method in DataStore

      return HttpResponse.json(null, { status: 204 });
    }),
  ];
}
