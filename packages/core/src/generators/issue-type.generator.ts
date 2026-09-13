import type { IssueType } from '../types/jira-schemas.js';
import type { GenerationContext } from '../types/generator.types.js';
import { generateSelfUrls } from '../utils/response-builder.js';

const ISSUE_TYPES: Omit<IssueType, 'self' | 'id'>[] = [
  {
    name: 'Bug',
    description: 'A problem which impairs or prevents the functions of the product.',
    iconUrl: 'https://your-domain.atlassian.net/images/icons/issuetypes/bug.svg',
    subtask: false,
  },
  {
    name: 'Task',
    description: 'A task that needs to be done.',
    iconUrl: 'https://your-domain.atlassian.net/images/icons/issuetypes/task.svg',
    subtask: false,
  },
  {
    name: 'Story',
    description: 'A user story.',
    iconUrl: 'https://your-domain.atlassian.net/images/icons/issuetypes/story.svg',
    subtask: false,
  },
  {
    name: 'Epic',
    description: 'A big user story that needs to be broken down.',
    iconUrl: 'https://your-domain.atlassian.net/images/icons/issuetypes/epic.svg',
    subtask: false,
  },
  {
    name: 'Sub-task',
    description: 'A subtask of another issue.',
    iconUrl: 'https://your-domain.atlassian.net/images/icons/issuetypes/subtask.svg',
    subtask: true,
  },
];

export class IssueTypeGenerator {
  generateIssueTypes(context: GenerationContext): IssueType[] {
    const urls = generateSelfUrls();

    return ISSUE_TYPES.map((issueType) => {
      const id = context.idGenerator.next('issuetype');
      return {
        self: urls.issueType(id),
        id,
        name: issueType.name,
        description: issueType.description,
        iconUrl: issueType.iconUrl,
        subtask: issueType.subtask,
      };
    });
  }
}
