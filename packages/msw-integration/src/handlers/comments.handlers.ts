import { http, HttpResponse } from 'msw';
import type { DataStore, CreateCommentInput, UpdateCommentInput } from '@jira-mock/core';

export function createCommentsHandlers(dataStore: DataStore, baseUrl: string) {
  return [
    // GET /rest/api/2/issue/:issueIdOrKey/comment - Get all comments for an issue
    http.get(`${baseUrl}/rest/api/2/issue/:issueIdOrKey/comment`, ({ params, request }) => {
      const { issueIdOrKey } = params;
      const url = new URL(request.url);
      const startAt = parseInt(url.searchParams.get('startAt') || '0', 10);
      const maxResults = parseInt(url.searchParams.get('maxResults') || '50', 10);

      const issue = dataStore.getIssue(issueIdOrKey as string);
      if (!issue) {
        return HttpResponse.json(
          { errorMessages: ['Issue does not exist'] },
          { status: 404 }
        );
      }

      const allComments = dataStore.getCommentsByIssue(issueIdOrKey as string);
      const total = allComments.length;
      const comments = allComments.slice(startAt, startAt + maxResults);

      return HttpResponse.json({
        startAt,
        maxResults,
        total,
        comments,
      });
    }),

    // POST /rest/api/2/issue/:issueIdOrKey/comment - Add a comment to an issue
    http.post(`${baseUrl}/rest/api/2/issue/:issueIdOrKey/comment`, async ({ params, request }) => {
      const { issueIdOrKey } = params;
      const body = (await request.json()) as CreateCommentInput;

      const issue = dataStore.getIssue(issueIdOrKey as string);
      if (!issue) {
        return HttpResponse.json(
          { errorMessages: ['Issue does not exist'] },
          { status: 404 }
        );
      }

      if (!body.body || body.body.trim() === '') {
        return HttpResponse.json(
          { errorMessages: ['Comment body is required'] },
          { status: 400 }
        );
      }

      const currentUser = dataStore.getCurrentUser();
      if (!currentUser) {
        return HttpResponse.json(
          { errorMessages: ['Current user not found'] },
          { status: 401 }
        );
      }

      const now = new Date().toISOString();
      const commentId = `${Date.now()}${Math.floor(Math.random() * 1000)}`;
      const comment = {
        self: `${baseUrl}/rest/api/2/issue/${issueIdOrKey}/comment/${commentId}`,
        id: commentId,
        author: currentUser,
        body: body.body,
        updateAuthor: currentUser,
        created: now,
        updated: now,
        jsdPublic: body.jsdPublic ?? true,
      };

      dataStore.addComment(comment, issueIdOrKey as string);

      return HttpResponse.json(comment, { status: 201 });
    }),

    // GET /rest/api/2/issue/:issueIdOrKey/comment/:id - Get a comment by ID
    http.get(`${baseUrl}/rest/api/2/issue/:issueIdOrKey/comment/:id`, ({ params }) => {
      const { issueIdOrKey, id } = params;

      const issue = dataStore.getIssue(issueIdOrKey as string);
      if (!issue) {
        return HttpResponse.json(
          { errorMessages: ['Issue does not exist'] },
          { status: 404 }
        );
      }

      const comment = dataStore.getComment(id as string);
      if (!comment) {
        return HttpResponse.json(
          { errorMessages: ['Comment does not exist'] },
          { status: 404 }
        );
      }

      return HttpResponse.json(comment);
    }),

    // PUT /rest/api/2/issue/:issueIdOrKey/comment/:id - Update a comment
    http.put(`${baseUrl}/rest/api/2/issue/:issueIdOrKey/comment/:id`, async ({ params, request }) => {
      const { issueIdOrKey, id } = params;
      const body = (await request.json()) as UpdateCommentInput;

      const issue = dataStore.getIssue(issueIdOrKey as string);
      if (!issue) {
        return HttpResponse.json(
          { errorMessages: ['Issue does not exist'] },
          { status: 404 }
        );
      }

      const comment = dataStore.getComment(id as string);
      if (!comment) {
        return HttpResponse.json(
          { errorMessages: ['Comment does not exist'] },
          { status: 404 }
        );
      }

      if (!body.body || body.body.trim() === '') {
        return HttpResponse.json(
          { errorMessages: ['Comment body is required'] },
          { status: 400 }
        );
      }

      const currentUser = dataStore.getCurrentUser();
      const updatedComment = dataStore.updateComment(id as string, {
        body: body.body,
        updateAuthor: currentUser || comment.author,
      });

      return HttpResponse.json(updatedComment);
    }),

    // DELETE /rest/api/2/issue/:issueIdOrKey/comment/:id - Delete a comment
    http.delete(`${baseUrl}/rest/api/2/issue/:issueIdOrKey/comment/:id`, ({ params }) => {
      const { issueIdOrKey, id } = params;

      const issue = dataStore.getIssue(issueIdOrKey as string);
      if (!issue) {
        return HttpResponse.json(
          { errorMessages: ['Issue does not exist'] },
          { status: 404 }
        );
      }

      const deleted = dataStore.deleteComment(id as string, issueIdOrKey as string);
      if (!deleted) {
        return HttpResponse.json(
          { errorMessages: ['Comment does not exist'] },
          { status: 404 }
        );
      }

      return HttpResponse.json(null, { status: 204 });
    }),
  ];
}
