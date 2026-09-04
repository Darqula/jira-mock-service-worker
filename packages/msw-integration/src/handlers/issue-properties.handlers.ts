import { http, HttpResponse } from 'msw';
import type { DataStore } from '@jira-mock/core';

export function createIssuePropertiesHandlers(dataStore: DataStore, baseUrl: string) {
  return [
    // PUT /rest/api/2/issue/:issueIdOrKey/properties/:propertyKey - Set issue property
    http.put(
      `${baseUrl}/rest/api/2/issue/:issueIdOrKey/properties/:propertyKey`,
      async ({ params, request }) => {
        const { issueIdOrKey, propertyKey } = params;

        const issue = dataStore.getIssue(issueIdOrKey as string);
        if (!issue) {
          return HttpResponse.json({ errorMessages: ['Issue not found'] }, { status: 404 });
        }

        const value = await request.json();
        dataStore.setIssueProperty(issue.id, propertyKey as string, value);

        return HttpResponse.json(null, { status: 201 });
      }
    ),

    // POST /rest/api/2/issue/properties/multi - Get properties for multiple issues
    http.post(`${baseUrl}/rest/api/2/issue/properties/multi`, async ({ request }) => {
      const body = (await request.json()) as {
        issueIds: string[];
        propertyKeys?: string[];
      };

      if (!body.issueIds || !Array.isArray(body.issueIds)) {
        return HttpResponse.json(
          { errorMessages: ['issueIds array is required'] },
          { status: 400 }
        );
      }

      const result: any = {};

      // Convert propertyKeys to Set for O(1) lookup
      const propertyKeySet =
        body.propertyKeys && body.propertyKeys.length > 0 ? new Set(body.propertyKeys) : null;

      body.issueIds.forEach((issueId) => {
        const issue = dataStore.getIssue(issueId);
        if (issue) {
          const allProperties = dataStore.getAllIssueProperties(issue.id);

          // Filter by property keys if provided (using Set for O(1) lookup)
          let properties = allProperties;
          if (propertyKeySet) {
            properties = allProperties.filter((p) => propertyKeySet.has(p.key));
          }

          if (properties.length > 0) {
            result[issue.id] = {
              self: `${baseUrl}/rest/api/2/issue/${issue.key}/properties`,
              properties: properties.reduce((acc: any, prop) => {
                acc[prop.key] = prop.value;
                return acc;
              }, {}),
            };
          }
        }
      });

      return HttpResponse.json(result);
    }),
  ];
}
