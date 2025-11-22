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

  // Parse project (case-insensitive)
  const projectMatch = jql.match(/project\s*=\s*([a-z0-9_-]+)/i);
  if (projectMatch) {
    result.project = projectMatch[1].toUpperCase();
  }

  // Parse status
  const statusValue = extractFieldValue(jql, 'status');
  if (statusValue !== null) {
    result.status = statusValue;
  }

  // Parse assignee
  const assigneeValue = extractFieldValue(jql, 'assignee');
  if (assigneeValue !== null) {
    result.assignee = assigneeValue;
  }

  // Parse reporter
  const reporterValue = extractFieldValue(jql, 'reporter');
  if (reporterValue !== null) {
    result.reporter = reporterValue;
  }

  // Parse priority
  const priorityValue = extractFieldValue(jql, 'priority');
  if (priorityValue !== null) {
    result.priority = priorityValue;
  }

  // Parse issuetype
  const issueTypeValue = extractFieldValue(jql, 'issuetype');
  if (issueTypeValue !== null) {
    result.issueType = issueTypeValue;
  }

  // Parse labels
  const labelValue = extractFieldValue(jql, 'labels');
  if (labelValue !== null) {
    result.labels = [labelValue];
  }

  // Parse IN clauses for issue keys
  const keysMatch = jql.match(/key\s+in\s*\(([^)]+)\)/i);
  if (keysMatch) {
    result.keys = keysMatch[1]
      .split(',')
      .map((k) => k.trim().replace(/["']/g, '').toUpperCase());
  }

  // Parse ORDER BY
  const orderByMatch = jql.match(/order\s+by\s+([a-z0-9_]+)\s*(asc|desc)?/i);
  if (orderByMatch) {
    result.orderBy = orderByMatch[1].toLowerCase();
    result.orderDirection = orderByMatch[2]?.toLowerCase() === 'desc' ? 'desc' : 'asc';
  }

  return result;
}

/**
 * Extracts a field value from JQL, handling both quoted and unquoted values
 * Quoted values preserve their case, unquoted values may be capitalized depending on field type
 */
function extractFieldValue(jql: string, field: string): string | null {
  // Try to match quoted string first (preserves spaces and case)
  const quotedRegex = new RegExp(`${field}\\s*=\\s*"([^"]+)"`, 'i');
  const quotedMatch = jql.match(quotedRegex);
  if (quotedMatch) {
    return quotedMatch[1]; // Return with original case
  }

  const singleQuotedRegex = new RegExp(`${field}\\s*=\\s*'([^']+)'`, 'i');
  const singleQuotedMatch = jql.match(singleQuotedRegex);
  if (singleQuotedMatch) {
    return singleQuotedMatch[1]; // Return with original case
  }

  // Match unquoted value (including function calls like currentUser())
  const unquotedRegex = new RegExp(`${field}\\s*=\\s*([^\\s,]+(?:\\([^)]*\\))?)`, 'i');
  const unquotedMatch = jql.match(unquotedRegex);
  if (unquotedMatch) {
    const value = unquotedMatch[1];

    // Don't capitalize certain field types (assignee, reporter, labels) or function calls
    if (field === 'assignee' || field === 'reporter' || field === 'labels' || value.includes('(')) {
      return value.toLowerCase();
    }

    return capitalize(value);
  }

  return null;
}

function capitalize(str: string): string {
  return str
    .split(' ') // Split only on spaces, preserve hyphens and underscores
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}
