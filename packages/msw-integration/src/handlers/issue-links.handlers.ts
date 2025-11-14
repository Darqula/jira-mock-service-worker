import { http, HttpResponse } from 'msw';
import type { DataStore, CreateIssueLinkInput } from '@jira-mock/core';

export function createIssueLinksHandlers(dataStore: DataStore, baseUrl: string) {
  return [
    // GET /rest/api/2/issueLinkType - Get all issue link types
    http.get(`${baseUrl}/rest/api/2/issueLinkType`, () => {
      const linkTypes = dataStore.getAllIssueLinkTypes();

      return HttpResponse.json({
        issueLinkTypes: linkTypes,
      });
    }),

    // GET /rest/api/2/issueLink/:linkId - Get issue link by ID
    http.get(`${baseUrl}/rest/api/2/issueLink/:linkId`, ({ params }) => {
      const { linkId } = params;

      const link = dataStore.getIssueLink(linkId as string);
      if (!link) {
        return HttpResponse.json(
          { errorMessages: ['Issue link not found'] },
          { status: 404 }
        );
      }

      return HttpResponse.json(link);
    }),

    // POST /rest/api/2/issueLink - Create an issue link
    http.post(`${baseUrl}/rest/api/2/issueLink`, async ({ request }) => {
      const body = (await request.json()) as CreateIssueLinkInput;

      // Validate required fields
      if (!body.type) {
        return HttpResponse.json(
          { errorMessages: ['Link type is required'] },
          { status: 400 }
        );
      }

      if (!body.inwardIssue || (!body.inwardIssue.id && !body.inwardIssue.key)) {
        return HttpResponse.json(
          { errorMessages: ['Inward issue is required'] },
          { status: 400 }
        );
      }

      if (!body.outwardIssue || (!body.outwardIssue.id && !body.outwardIssue.key)) {
        return HttpResponse.json(
          { errorMessages: ['Outward issue is required'] },
          { status: 400 }
        );
      }

      // Find link type
      let linkType;
      if (body.type.id) {
        linkType = dataStore.getIssueLinkType(body.type.id);
      } else if (body.type.name) {
        linkType = dataStore.getIssueLinkTypeByName(body.type.name);
      }

      if (!linkType) {
        return HttpResponse.json(
          { errorMessages: ['Issue link type not found'] },
          { status: 404 }
        );
      }

      // Find inward issue
      const inwardIssueId = body.inwardIssue.id || body.inwardIssue.key;
      const inwardIssue = inwardIssueId ? dataStore.getIssue(inwardIssueId) : undefined;

      if (!inwardIssue) {
        return HttpResponse.json(
          { errorMessages: ['Inward issue not found'] },
          { status: 404 }
        );
      }

      // Find outward issue
      const outwardIssueId = body.outwardIssue.id || body.outwardIssue.key;
      const outwardIssue = outwardIssueId ? dataStore.getIssue(outwardIssueId) : undefined;

      if (!outwardIssue) {
        return HttpResponse.json(
          { errorMessages: ['Outward issue not found'] },
          { status: 404 }
        );
      }

      // Create the link
      const linkId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const link = {
        id: linkId,
        self: `${baseUrl}/rest/api/2/issueLink/${linkId}`,
        type: linkType,
        inwardIssue: {
          id: inwardIssue.id,
          key: inwardIssue.key,
          self: inwardIssue.self,
          fields: {
            summary: inwardIssue.fields.summary,
            status: inwardIssue.fields.status,
            priority: inwardIssue.fields.priority,
            issuetype: inwardIssue.fields.issuetype,
          },
        },
        outwardIssue: {
          id: outwardIssue.id,
          key: outwardIssue.key,
          self: outwardIssue.self,
          fields: {
            summary: outwardIssue.fields.summary,
            status: outwardIssue.fields.status,
            priority: outwardIssue.fields.priority,
            issuetype: outwardIssue.fields.issuetype,
          },
        },
      };

      dataStore.addIssueLink(link);

      // Optionally add a comment to the inward issue
      if (body.comment && body.comment.body) {
        const currentUser = dataStore.getCurrentUser();
        if (currentUser) {
          const now = new Date().toISOString();
          const commentId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
          const comment = {
            self: `${baseUrl}/rest/api/2/issue/${inwardIssue.key}/comment/${commentId}`,
            id: commentId,
            author: currentUser,
            body: body.comment.body,
            updateAuthor: currentUser,
            created: now,
            updated: now,
            jsdPublic: true,
          };
          dataStore.addComment(comment, inwardIssue.key);
        }
      }

      return HttpResponse.json(null, { status: 201 });
    }),

    // DELETE /rest/api/2/issueLink/:linkId - Delete an issue link
    http.delete(`${baseUrl}/rest/api/2/issueLink/:linkId`, ({ params }) => {
      const { linkId } = params;

      const deleted = dataStore.deleteIssueLink(linkId as string);
      if (!deleted) {
        return HttpResponse.json(
          { errorMessages: ['Issue link not found'] },
          { status: 404 }
        );
      }

      return HttpResponse.json(null, { status: 204 });
    }),
  ];
}
