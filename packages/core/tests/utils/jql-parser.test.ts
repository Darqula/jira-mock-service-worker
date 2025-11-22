import { describe, it, expect } from 'vitest';
import { parseJQL } from '../../src/utils/jql-parser.js';

describe('JQL Parser', () => {
  describe('Project parsing', () => {
    it('should parse project with equals', () => {
      const result = parseJQL('project = TEST');
      expect(result.project).toBe('TEST');
    });

    it('should parse project case-insensitively', () => {
      const result = parseJQL('PROJECT = test');
      expect(result.project).toBe('TEST');
    });

    it('should parse project with hyphen and underscore', () => {
      const result = parseJQL('project = TEST-123_ABC');
      expect(result.project).toBe('TEST-123_ABC');
    });
  });

  describe('Status parsing', () => {
    it('should parse status with quotes', () => {
      const result = parseJQL('status = "To Do"');
      expect(result.status).toBe('To Do'); // Quoted values preserve exact case
    });

    it('should parse status without quotes', () => {
      const result = parseJQL('status = Done');
      expect(result.status).toBe('Done');
    });

    it('should capitalize status', () => {
      const result = parseJQL('status = IN_PROGRESS');
      expect(result.status).toBe('In_progress'); // Capitalized, preserving underscore
    });
  });

  describe('Assignee parsing', () => {
    it('should parse assignee with currentUser()', () => {
      const result = parseJQL('assignee = currentUser()');
      expect(result.assignee).toBe('currentuser()');
    });

    it('should parse assignee with username', () => {
      const result = parseJQL('assignee = john.doe');
      expect(result.assignee).toBe('john.doe');
    });

    it('should parse UNASSIGNED', () => {
      const result = parseJQL('assignee = UNASSIGNED');
      expect(result.assignee).toBe('unassigned');
    });
  });

  describe('Reporter parsing', () => {
    it('should parse reporter', () => {
      const result = parseJQL('reporter = jane.doe');
      expect(result.reporter).toBe('jane.doe');
    });
  });

  describe('Priority parsing', () => {
    it('should parse priority', () => {
      const result = parseJQL('priority = High');
      expect(result.priority).toBe('High');
    });

    it('should capitalize priority', () => {
      const result = parseJQL('priority = HIGHEST');
      expect(result.priority).toBe('Highest');
    });
  });

  describe('Issue type parsing', () => {
    it('should parse issuetype', () => {
      const result = parseJQL('issuetype = Bug');
      expect(result.issueType).toBe('Bug');
    });

    it('should capitalize issue type', () => {
      const result = parseJQL('issuetype = task');
      expect(result.issueType).toBe('Task');
    });
  });

  describe('Labels parsing', () => {
    it('should parse single label', () => {
      const result = parseJQL('labels = frontend');
      expect(result.labels).toEqual(['frontend']);
    });
  });

  describe('Key IN clause parsing', () => {
    it('should parse multiple keys', () => {
      const result = parseJQL('key IN (TEST-1, TEST-2, TEST-3)');
      expect(result.keys).toEqual(['TEST-1', 'TEST-2', 'TEST-3']);
    });

    it('should parse keys with quotes', () => {
      const result = parseJQL('key IN ("TEST-1", "TEST-2")');
      expect(result.keys).toEqual(['TEST-1', 'TEST-2']);
    });

    it('should uppercase keys', () => {
      const result = parseJQL('key in (test-1, test-2)');
      expect(result.keys).toEqual(['TEST-1', 'TEST-2']);
    });
  });

  describe('ORDER BY parsing', () => {
    it('should parse order by with ASC', () => {
      const result = parseJQL('project = TEST ORDER BY created ASC');
      expect(result.orderBy).toBe('created');
      expect(result.orderDirection).toBe('asc');
    });

    it('should parse order by with DESC', () => {
      const result = parseJQL('project = TEST ORDER BY updated DESC');
      expect(result.orderBy).toBe('updated');
      expect(result.orderDirection).toBe('desc');
    });

    it('should default to ASC when no direction specified', () => {
      const result = parseJQL('project = TEST ORDER BY priority');
      expect(result.orderBy).toBe('priority');
      expect(result.orderDirection).toBe('asc');
    });
  });

  describe('Complex JQL queries', () => {
    it('should parse multiple conditions', () => {
      const result = parseJQL(
        'project = TEST AND status = "In Progress" AND assignee = currentUser()'
      );
      expect(result.project).toBe('TEST');
      expect(result.status).toBe('In Progress'); // Quoted value preserves case
      expect(result.assignee).toBe('currentuser()');
    });

    it('should parse query with all fields', () => {
      const result = parseJQL(
        'project = ABC AND status = Done AND assignee = john AND reporter = jane AND priority = High AND issuetype = Bug AND labels = backend ORDER BY created DESC'
      );
      expect(result).toEqual({
        project: 'ABC',
        status: 'Done',
        assignee: 'john', // Lowercase for assignee
        reporter: 'jane', // Lowercase for reporter
        priority: 'High',
        issueType: 'Bug',
        labels: ['backend'], // Lowercase for labels
        orderBy: 'created',
        orderDirection: 'desc',
      });
    });

    it('should handle extra whitespace', () => {
      const result = parseJQL('  project   =   TEST  ');
      expect(result.project).toBe('TEST');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty JQL', () => {
      const result = parseJQL('');
      expect(result).toEqual({});
    });

    it('should handle invalid JQL gracefully', () => {
      const result = parseJQL('random text without valid JQL');
      expect(result).toEqual({});
    });

    it('should handle partial matches', () => {
      const result = parseJQL('project = TEST AND invalidField = value');
      expect(result.project).toBe('TEST');
      expect(result).not.toHaveProperty('invalidField');
    });
  });
});
