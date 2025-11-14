import type { Field } from '../types/jira-schemas.js';
import type { GenerationContext } from '../types/generator.types.js';

const SYSTEM_FIELDS: Omit<Field, 'id' | 'clauseNames'>[] = [
  {
    name: 'Summary',
    custom: false,
    orderable: true,
    navigable: true,
    searchable: true,
    schema: { type: 'string', system: 'summary' },
  },
  {
    name: 'Description',
    custom: false,
    orderable: true,
    navigable: true,
    searchable: true,
    schema: { type: 'string', system: 'description' },
  },
  {
    name: 'Issue Type',
    custom: false,
    orderable: true,
    navigable: true,
    searchable: true,
    schema: { type: 'issuetype', system: 'issuetype' },
  },
  {
    name: 'Project',
    custom: false,
    orderable: false,
    navigable: true,
    searchable: false,
    schema: { type: 'project', system: 'project' },
  },
  {
    name: 'Priority',
    custom: false,
    orderable: true,
    navigable: true,
    searchable: true,
    schema: { type: 'priority', system: 'priority' },
  },
  {
    name: 'Status',
    custom: false,
    orderable: false,
    navigable: true,
    searchable: true,
    schema: { type: 'status', system: 'status' },
  },
  {
    name: 'Assignee',
    custom: false,
    orderable: true,
    navigable: true,
    searchable: true,
    schema: { type: 'user', system: 'assignee' },
  },
  {
    name: 'Reporter',
    custom: false,
    orderable: true,
    navigable: true,
    searchable: true,
    schema: { type: 'user', system: 'reporter' },
  },
  {
    name: 'Created',
    custom: false,
    orderable: true,
    navigable: true,
    searchable: true,
    schema: { type: 'datetime', system: 'created' },
  },
  {
    name: 'Updated',
    custom: false,
    orderable: true,
    navigable: true,
    searchable: true,
    schema: { type: 'datetime', system: 'updated' },
  },
  {
    name: 'Labels',
    custom: false,
    orderable: true,
    navigable: true,
    searchable: true,
    schema: { type: 'array', system: 'labels' },
  },
];

export class FieldGenerator {
  generateFields(_context: GenerationContext): Field[] {
    return SYSTEM_FIELDS.map((field, index) => {
      const id = field.schema?.system || `field_${index}`;
      const clauseNames = [id];

      return {
        ...field,
        id,
        clauseNames,
      };
    });
  }
}
