import { http, HttpResponse } from 'msw';
import type { DataStore } from '@jira-mock/core';

export function createMetadataHandlers(dataStore: DataStore, baseUrl: string) {
  return [
    // GET /rest/api/2/issuetype - Get all issue types
    http.get(`${baseUrl}/rest/api/2/issuetype`, () => {
      const issueTypes = dataStore.getAllIssueTypes();
      return HttpResponse.json(issueTypes);
    }),

    // GET /rest/api/2/field - Get all fields
    http.get(`${baseUrl}/rest/api/2/field`, () => {
      const fields = dataStore.getAllFields();
      return HttpResponse.json(fields);
    }),

    // GET /rest/api/2/priority - Get all priorities
    http.get(`${baseUrl}/rest/api/2/priority`, () => {
      const priorities = dataStore.getAllPriorities();
      return HttpResponse.json(priorities);
    }),

    // GET /rest/api/2/status - Get all statuses
    http.get(`${baseUrl}/rest/api/2/status`, () => {
      const statuses = dataStore.getAllStatuses();
      return HttpResponse.json(statuses);
    }),

    // GET /rest/api/2/statuscategory - Get all status categories
    http.get(`${baseUrl}/rest/api/2/statuscategory`, () => {
      const statusCategories = dataStore.getAllStatusCategories();
      return HttpResponse.json(statusCategories);
    }),

    // GET /rest/api/2/label - Get all labels
    http.get(`${baseUrl}/rest/api/2/label`, ({ request }) => {
      const url = new URL(request.url);
      const startAt = parseInt(url.searchParams.get('startAt') || '0', 10);
      const maxResults = parseInt(url.searchParams.get('maxResults') || '50', 10);

      // Collect all unique labels from issues
      const issues = dataStore.getAllIssues();
      const labelsSet = new Set<string>();

      issues.forEach((issue) => {
        issue.fields.labels?.forEach((label) => labelsSet.add(label));
      });

      const labels = Array.from(labelsSet).sort();
      const total = labels.length;
      const paginatedLabels = labels.slice(startAt, startAt + maxResults);

      return HttpResponse.json({
        maxResults,
        startAt,
        total,
        isLast: startAt + paginatedLabels.length >= total,
        values: paginatedLabels,
      });
    }),
  ];
}
