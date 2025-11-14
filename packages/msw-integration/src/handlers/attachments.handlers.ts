import { http, HttpResponse } from 'msw';
import type { DataStore } from '@jira-mock/core';

export function createAttachmentsHandlers(dataStore: DataStore, baseUrl: string) {
  return [
    // GET /rest/api/2/attachment/:id - Get attachment metadata
    http.get(`${baseUrl}/rest/api/2/attachment/:id`, ({ params }) => {
      const { id } = params;

      const attachment = dataStore.getAttachment(id as string);
      if (!attachment) {
        return HttpResponse.json(
          { errorMessages: ['Attachment not found'] },
          { status: 404 }
        );
      }

      return HttpResponse.json(attachment);
    }),

    // DELETE /rest/api/2/attachment/:id - Delete an attachment
    http.delete(`${baseUrl}/rest/api/2/attachment/:id`, ({ params }) => {
      const { id } = params;

      const deleted = dataStore.deleteAttachment(id as string);
      if (!deleted) {
        return HttpResponse.json(
          { errorMessages: ['Attachment not found'] },
          { status: 404 }
        );
      }

      return HttpResponse.json(null, { status: 204 });
    }),

    // POST /rest/api/2/issue/:issueIdOrKey/attachments - Add attachment(s) to an issue
    http.post(`${baseUrl}/rest/api/2/issue/:issueIdOrKey/attachments`, async ({ params, request }) => {
      const { issueIdOrKey } = params;

      const issue = dataStore.getIssue(issueIdOrKey as string);
      if (!issue) {
        return HttpResponse.json(
          { errorMessages: ['Issue does not exist'] },
          { status: 404 }
        );
      }

      const currentUser = dataStore.getCurrentUser();
      if (!currentUser) {
        return HttpResponse.json(
          { errorMessages: ['Current user not found'] },
          { status: 401 }
        );
      }

      // In a real implementation, we would handle multipart/form-data
      // For mocking purposes, we'll create a mock attachment
      const contentType = request.headers.get('content-type') || '';

      if (!contentType.includes('multipart/form-data')) {
        return HttpResponse.json(
          { errorMessages: ['Content-Type must be multipart/form-data'] },
          { status: 400 }
        );
      }

      // Mock file processing - in reality would parse FormData
      const now = new Date().toISOString();
      const attachmentId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const filename = `mock-file-${Date.now()}.txt`;
      const size = Math.floor(Math.random() * 100000) + 1000;

      const attachment = {
        self: `${baseUrl}/rest/api/2/attachment/${attachmentId}`,
        id: attachmentId,
        filename,
        author: currentUser,
        created: now,
        size,
        mimeType: 'text/plain',
        content: `${baseUrl}/secure/attachment/${attachmentId}/${filename}`,
      };

      dataStore.addAttachment(attachment, issueIdOrKey as string);

      return HttpResponse.json([attachment], { status: 200 });
    }),
  ];
}
