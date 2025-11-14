import type {
  EditMeta,
  FieldMeta,
  IssueBean,
  Priority,
  User,
  Component,
  Version,
  Status,
} from '../types/jira-schemas.js';
import type { GenerationContext } from '../types/generator.types.js';
import { generateSelfUrls } from '../utils/response-builder.js';

export class EditMetaGenerator {
  generateEditMeta(
    issue: IssueBean,
    priorities: Priority[],
    users: User[],
    components: Component[],
    versions: Version[],
    statuses: Status[],
    context: GenerationContext
  ): EditMeta {
    const urls = generateSelfUrls();

    const fields: Record<string, FieldMeta> = {
      summary: {
        required: true,
        schema: { type: 'string', system: 'summary' },
        name: 'Summary',
        key: 'summary',
        operations: ['set'],
      },
      description: {
        required: false,
        schema: { type: 'string', system: 'description' },
        name: 'Description',
        key: 'description',
        operations: ['set'],
      },
      priority: {
        required: false,
        schema: { type: 'priority', system: 'priority' },
        name: 'Priority',
        key: 'priority',
        operations: ['set'],
        allowedValues: priorities,
      },
      assignee: {
        required: false,
        schema: { type: 'user', system: 'assignee' },
        name: 'Assignee',
        key: 'assignee',
        autoCompleteUrl: urls.user(''),
        operations: ['set'],
      },
      reporter: {
        required: false,
        schema: { type: 'user', system: 'reporter' },
        name: 'Reporter',
        key: 'reporter',
        autoCompleteUrl: urls.user(''),
        operations: ['set'],
      },
      labels: {
        required: false,
        schema: { type: 'array', items: 'string', system: 'labels' },
        name: 'Labels',
        key: 'labels',
        autoCompleteUrl: `${urls.project(issue.fields.project.key)}/labels`,
        operations: ['add', 'set', 'remove'],
      },
    };

    // Add components field if project has components
    if (components.length > 0) {
      fields.components = {
        required: false,
        schema: { type: 'array', items: 'component', system: 'components' },
        name: 'Component/s',
        key: 'components',
        operations: ['add', 'set', 'remove'],
        allowedValues: components,
      };
    }

    // Add versions fields if project has versions
    if (versions.length > 0) {
      fields.versions = {
        required: false,
        schema: { type: 'array', items: 'version', system: 'versions' },
        name: 'Affects Version/s',
        key: 'versions',
        operations: ['add', 'set', 'remove'],
        allowedValues: versions,
      };

      fields.fixVersions = {
        required: false,
        schema: { type: 'array', items: 'version', system: 'fixVersions' },
        name: 'Fix Version/s',
        key: 'fixVersions',
        operations: ['add', 'set', 'remove'],
        allowedValues: versions,
      };
    }

    // Add duedate for non-subtask issues
    if (!issue.fields.issuetype.subtask) {
      fields.duedate = {
        required: false,
        schema: { type: 'date', system: 'duedate' },
        name: 'Due Date',
        key: 'duedate',
        operations: ['set'],
      };
    }

    // Add resolution field if issue can be resolved
    const canBeResolved = issue.fields.status.statusCategory.key !== 'done';
    if (canBeResolved) {
      fields.resolution = {
        required: false,
        schema: { type: 'resolution', system: 'resolution' },
        name: 'Resolution',
        key: 'resolution',
        operations: ['set'],
        allowedValues: [
          { id: '1', name: 'Fixed', description: 'A fix for this issue is checked into the tree and tested.' },
          { id: '2', name: 'Won\'t Fix', description: 'The problem described is an issue which will never be fixed.' },
          { id: '3', name: 'Duplicate', description: 'The problem is a duplicate of an existing issue.' },
          { id: '4', name: 'Incomplete', description: 'The problem is not completely described.' },
          { id: '5', name: 'Cannot Reproduce', description: 'All attempts at reproducing this issue failed.' },
        ],
      };
    }

    return {
      fields,
    };
  }
}
