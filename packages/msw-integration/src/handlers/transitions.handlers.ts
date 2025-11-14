import { http, HttpResponse } from 'msw';
import type { DataStore, DoTransitionInput } from '@jira-mock/core';
import { TransitionGenerator } from '@jira-mock/core';
import { createGenerationContext } from '../utils/generation-context.js';

export function createTransitionsHandlers(dataStore: DataStore, baseUrl: string) {
  const transitionGenerator = new TransitionGenerator();

  return [
    // GET /rest/api/2/issue/:issueIdOrKey/transitions - Get available transitions
    http.get(`${baseUrl}/rest/api/2/issue/:issueIdOrKey/transitions`, ({ params }) => {
      const { issueIdOrKey } = params;

      const issue = dataStore.getIssue(issueIdOrKey as string);
      if (!issue) {
        return HttpResponse.json(
          { errorMessages: ['Issue does not exist'] },
          { status: 404 }
        );
      }

      const currentStatus = issue.fields.status;
      const allStatuses = dataStore.getAllStatuses();
      const context = createGenerationContext();

      const transitions = transitionGenerator.generateTransitions(
        currentStatus,
        allStatuses,
        context
      );

      return HttpResponse.json({
        expand: 'transitions',
        transitions,
      });
    }),

    // POST /rest/api/2/issue/:issueIdOrKey/transitions - Perform a transition
    http.post(`${baseUrl}/rest/api/2/issue/:issueIdOrKey/transitions`, async ({ params, request }) => {
      const { issueIdOrKey } = params;
      const body = (await request.json()) as DoTransitionInput;

      const issue = dataStore.getIssue(issueIdOrKey as string);
      if (!issue) {
        return HttpResponse.json(
          { errorMessages: ['Issue does not exist'] },
          { status: 404 }
        );
      }

      if (!body.transition || !body.transition.id) {
        return HttpResponse.json(
          { errorMessages: ['Transition ID is required'] },
          { status: 400 }
        );
      }

      // Generate available transitions to find the requested one
      const currentStatus = issue.fields.status;
      const allStatuses = dataStore.getAllStatuses();
      const context = createGenerationContext();

      const transitions = transitionGenerator.generateTransitions(
        currentStatus,
        allStatuses,
        context
      );

      const transition = transitions.find((t) => t.id === body.transition.id);
      if (!transition) {
        return HttpResponse.json(
          { errorMessages: ['Transition not available'] },
          { status: 400 }
        );
      }

      // Validate required fields
      if (transition.fields) {
        for (const [fieldKey, fieldDef] of Object.entries(transition.fields)) {
          if (fieldDef.required && (!body.fields || !body.fields[fieldKey])) {
            return HttpResponse.json(
              { errorMessages: [`Field ${fieldKey} is required for this transition`] },
              { status: 400 }
            );
          }
        }
      }

      // Perform the transition
      const updates: any = {
        fields: {
          ...issue.fields,
          status: transition.to,
        },
      };

      // Apply any additional field updates
      if (body.fields) {
        updates.fields = {
          ...updates.fields,
          ...body.fields,
        };
      }

      dataStore.updateIssue(issueIdOrKey as string, updates);

      return HttpResponse.json(null, { status: 204 });
    }),
  ];
}
