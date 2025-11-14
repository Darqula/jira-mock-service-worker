export interface JQLParseResult {
  project?: string;
  status?: string;
  assignee?: string;
  reporter?: string;
  priority?: string;
  issueType?: string;
  labels?: string[];
  keys?: string[];
  orderBy?: string;
  orderDirection?: 'asc' | 'desc';
}

export function parseJQL(jql: string): JQLParseResult {
  const result: JQLParseResult = {};
  const normalized = jql.trim().toLowerCase();

  // Parse project
  const projectMatch = normalized.match(/project\s*=\s*([a-z0-9_-]+)/i);
  if (projectMatch) {
    result.project = projectMatch[1].toUpperCase();
  }

  // Parse status
  const statusMatch = normalized.match(/status\s*=\s*["']?([^"'\s]+)["']?/i);
  if (statusMatch) {
    result.status = capitalize(statusMatch[1]);
  }

  // Parse assignee
  const assigneeMatch = normalized.match(/assignee\s*=\s*["']?([^"'\s]+)["']?/i);
  if (assigneeMatch) {
    result.assignee = assigneeMatch[1];
  }

  // Parse reporter
  const reporterMatch = normalized.match(/reporter\s*=\s*["']?([^"'\s]+)["']?/i);
  if (reporterMatch) {
    result.reporter = reporterMatch[1];
  }

  // Parse priority
  const priorityMatch = normalized.match(/priority\s*=\s*["']?([^"'\s]+)["']?/i);
  if (priorityMatch) {
    result.priority = capitalize(priorityMatch[1]);
  }

  // Parse issuetype
  const issueTypeMatch = normalized.match(/issuetype\s*=\s*["']?([^"'\s]+)["']?/i);
  if (issueTypeMatch) {
    result.issueType = capitalize(issueTypeMatch[1]);
  }

  // Parse labels
  const labelMatch = normalized.match(/labels\s*=\s*["']?([^"'\s]+)["']?/i);
  if (labelMatch) {
    result.labels = [labelMatch[1]];
  }

  // Parse IN clauses for issue keys
  const keysMatch = normalized.match(/key\s+in\s*\(([^)]+)\)/i);
  if (keysMatch) {
    result.keys = keysMatch[1]
      .split(',')
      .map((k) => k.trim().replace(/["']/g, '').toUpperCase());
  }

  // Parse ORDER BY
  const orderByMatch = normalized.match(/order\s+by\s+([a-z0-9_]+)\s*(asc|desc)?/i);
  if (orderByMatch) {
    result.orderBy = orderByMatch[1];
    result.orderDirection = orderByMatch[2]?.toLowerCase() === 'desc' ? 'desc' : 'asc';
  }

  return result;
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
