import type { IssueBean } from '../types/jira-schemas.js';

export interface ExpandOptions {
  expand?: string;
}

export function buildIssueResponse(
  issue: IssueBean,
  _options: ExpandOptions = {}
): IssueBean {
  // For now, return the issue as-is
  // In the future, we can handle expand parameters to include/exclude fields
  return issue;
}

export function buildSelfUrl(baseUrl: string, path: string): string {
  return `${baseUrl}${path}`;
}

export const DEFAULT_BASE_URL = 'https://your-domain.atlassian.net';

export function generateSelfUrls(baseUrl: string = DEFAULT_BASE_URL) {
  return {
    user: (accountId: string) => `${baseUrl}/rest/api/2/user?accountId=${accountId}`,
    project: (projectIdOrKey: string) =>
      `${baseUrl}/rest/api/2/project/${projectIdOrKey}`,
    issue: (issueIdOrKey: string) => `${baseUrl}/rest/api/2/issue/${issueIdOrKey}`,
    issueType: (id: string) => `${baseUrl}/rest/api/2/issuetype/${id}`,
    priority: (id: string) => `${baseUrl}/rest/api/2/priority/${id}`,
    status: (id: string) => `${baseUrl}/rest/api/2/status/${id}`,
    statusCategory: (id: string) => `${baseUrl}/rest/api/2/statuscategory/${id}`,
    component: (id: string) => `${baseUrl}/rest/api/2/component/${id}`,
    version: (id: string) => `${baseUrl}/rest/api/2/version/${id}`,
    worklog: (issueIdOrKey: string, worklogId: string) =>
      `${baseUrl}/rest/api/2/issue/${issueIdOrKey}/worklog/${worklogId}`,
    field: (fieldId: string) => `${baseUrl}/rest/api/2/field/${fieldId}`,
    filter: (filterId: string) => `${baseUrl}/rest/api/2/filter/${filterId}`,
    avatar: (size: string) =>
      `${baseUrl}/secure/useravatar?size=${size}&avatarId=10338`,
  };
}
