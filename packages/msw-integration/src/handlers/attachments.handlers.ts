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

      const contentType = request.headers.get('content-type') || '';

      if (!contentType.includes('multipart/form-data')) {
        return HttpResponse.json(
          { errorMessages: ['Content-Type must be multipart/form-data'] },
          { status: 400 }
        );
      }

      // Parse the uploaded files so real filename/size/type are echoed back
      // (Jira returns one attachment per uploaded file). An invented mock
      // file remains as a fallback for well-formed multipart requests that
      // carry no parseable File entries.
      const files: { name: string; size: number; type: string }[] = [];
      try {
        const formData = await request.formData();
        for (const [, value] of formData.entries()) {
          if (value instanceof File) {
            files.push({ name: value.name, size: value.size, type: value.type || 'application/octet-stream' });
          }
        }
      } catch {
        // Body not parseable as multipart form data - fall through to the mock file.
      }

      if (files.length === 0) {
        files.push({
          name: `mock-file-${Date.now()}.txt`,
          size: Math.floor(Math.random() * 100000) + 1000,
          type: 'text/plain',
        });
      }

      const now = new Date().toISOString();
      const attachments = files.map((file, index) => {
        const attachmentId = `${Date.now()}${Math.floor(Math.random() * 1000)}${index}`;

        return {
          self: `${baseUrl}/rest/api/2/attachment/${attachmentId}`,
          id: attachmentId,
          filename: file.name,
          author: currentUser,
          created: now,
          size: file.size,
          mimeType: file.type,
          content: `${baseUrl}/secure/attachment/${attachmentId}/${file.name}`,
        };
      });

      attachments.forEach((attachment) => dataStore.addAttachment(attachment, issueIdOrKey as string));

      return HttpResponse.json(attachments, { status: 200 });
    }),
  ];
}
