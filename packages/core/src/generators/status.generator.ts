import type { Status, StatusCategory } from '../types/jira-schemas.js';
import type { GenerationContext } from '../types/generator.types.js';
import { generateSelfUrls } from '../utils/response-builder.js';

const STATUS_CATEGORIES: Omit<StatusCategory, 'self'>[] = [
  { id: 2, key: 'new', name: 'To Do', colorName: 'blue-gray' },
  { id: 4, key: 'indeterminate', name: 'In Progress', colorName: 'yellow' },
  { id: 3, key: 'done', name: 'Done', colorName: 'green' },
];

const STATUSES: Array<Omit<Status, 'self' | 'id' | 'statusCategory'> & { categoryKey: string }> = [
  {
    name: 'To Do',
    description: 'The issue is open and ready for the assignee to start work on it.',
    iconUrl: 'https://your-domain.atlassian.net/images/icons/statuses/open.png',
    categoryKey: 'new',
  },
  {
    name: 'In Progress',
    description: 'This issue is being actively worked on at the moment by the assignee.',
    iconUrl: 'https://your-domain.atlassian.net/images/icons/statuses/inprogress.png',
    categoryKey: 'indeterminate',
  },
  {
    name: 'Done',
    description: 'The issue is considered finished, the resolution is correct.',
    iconUrl: 'https://your-domain.atlassian.net/images/icons/statuses/closed.png',
    categoryKey: 'done',
  },
  {
    name: 'Backlog',
    description: 'The issue is waiting to be picked up.',
    iconUrl: 'https://your-domain.atlassian.net/images/icons/statuses/backlog.png',
    categoryKey: 'new',
  },
  {
    name: 'In Review',
    description: 'The issue is being reviewed.',
    iconUrl: 'https://your-domain.atlassian.net/images/icons/statuses/review.png',
    categoryKey: 'indeterminate',
  },
  {
    name: 'Closed',
    description: 'The issue is closed.',
    iconUrl: 'https://your-domain.atlassian.net/images/icons/statuses/closed.png',
    categoryKey: 'done',
  },
];

export class StatusGenerator {
  generateStatusCategories(_context: GenerationContext): StatusCategory[] {
    const urls = generateSelfUrls();
    return STATUS_CATEGORIES.map((cat) => ({
      ...cat,
      self: urls.statusCategory(cat.id.toString()),
    }));
  }

  generateStatuses(context: GenerationContext, categories: StatusCategory[]): Status[] {
    const urls = generateSelfUrls();
    const categoriesMap = new Map(categories.map((c) => [c.key, c]));

    return STATUSES.map((status) => {
      const id = context.idGenerator.next('status');
      const category = categoriesMap.get(status.categoryKey)!;

      return {
        self: urls.status(id),
        id,
        name: status.name,
        description: status.description,
        iconUrl: status.iconUrl,
        statusCategory: category,
      };
    });
  }
}
