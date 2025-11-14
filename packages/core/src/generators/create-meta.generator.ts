import type {
  CreateMeta,
  CreateMetaProject,
  CreateMetaIssueType,
  FieldMeta,
  Project,
  IssueType,
  Priority,
  User,
  Component,
  Version,
} from '../types/jira-schemas.js';
import type { GenerationContext } from '../types/generator.types.js';
import { generateSelfUrls } from '../utils/response-builder.js';

export class CreateMetaGenerator {
  generateCreateMeta(
    projects: Project[],
    issueTypes: IssueType[],
    priorities: Priority[],
    users: User[],
    allComponents: Component[],
    allVersions: Version[],
    context: GenerationContext
  ): CreateMeta {
    const urls = generateSelfUrls();

    const metaProjects: CreateMetaProject[] = projects.map(project => {
      // Filter components and versions for this project
      const projectComponents = allComponents.filter(c =>
        c.project === project.key || c.projectId?.toString() === project.id
      );
      const projectVersions = allVersions.filter(v => v.projectId.toString() === project.id);

      return {
        self: urls.project(project.key),
        id: project.id,
        key: project.key,
        name: project.name,
        avatarUrls: project.avatarUrls,
        issuetypes: issueTypes.map(issueType =>
          this.generateIssueTypeFields(
            issueType,
            project,
            priorities,
            users,
            projectComponents,
            projectVersions,
            context
          )
        ),
      };
    });

    return {
      expand: 'projects',
      projects: metaProjects,
    };
  }

  generateIssueTypeFields(
    issueType: IssueType,
    project: Project,
    priorities: Priority[],
    _users: User[],
    components: Component[],
    versions: Version[],
    _context: GenerationContext
  ): CreateMetaIssueType {
    const urls = generateSelfUrls();

    const fields: Record<string, FieldMeta> = {
      summary: {
        required: true,
        schema: { type: 'string', system: 'summary' },
        name: 'Summary',
        key: 'summary',
        operations: ['set'],
      },
      issuetype: {
        required: true,
        schema: { type: 'issuetype', system: 'issuetype' },
        name: 'Issue Type',
        key: 'issuetype',
        operations: ['set'],
        allowedValues: [issueType],
      },
      project: {
        required: true,
        schema: { type: 'project', system: 'project' },
        name: 'Project',
        key: 'project',
        operations: ['set'],
        allowedValues: [project],
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
        hasDefaultValue: true,
        operations: ['set'],
        allowedValues: priorities,
        defaultValue: priorities[2], // Medium priority
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
        required: true,
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
        autoCompleteUrl: `${urls.project(project.key)}/labels`,
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
    if (!issueType.subtask) {
      fields.duedate = {
        required: false,
        schema: { type: 'date', system: 'duedate' },
        name: 'Due Date',
        key: 'duedate',
        operations: ['set'],
      };
    }

    // Add parent field for subtasks
    if (issueType.subtask) {
      fields.parent = {
        required: true,
        schema: { type: 'issuelink', system: 'parent' },
        name: 'Parent',
        key: 'parent',
        operations: ['set'],
      };
    }

    return {
      self: urls.issueType(issueType.id),
      id: issueType.id,
      name: issueType.name,
      description: issueType.description,
      iconUrl: issueType.iconUrl,
      subtask: issueType.subtask,
      expand: 'fields',
      fields,
    };
  }
}
