import type { Worklog, IssueBean, User } from '../types/jira-schemas.js';
import type { GenerationContext } from '../types/generator.types.js';
import { generateSelfUrls } from '../utils/response-builder.js';
import { getBuiltInDefaults } from '../config/defaults.js';
import { shouldApply, randomInRange } from './utils/probability.js';

export class WorklogGenerator {
  generateWorklogs(
    issue: IssueBean,
    users: User[],
    context: GenerationContext
  ): Worklog[] {
    const projectConfig = context.currentProject || getBuiltInDefaults();
    const worklogConfig = projectConfig.worklogs!;

    // Check if we should generate worklogs based on probability
    if (!shouldApply(context.faker, worklogConfig.probability!)) {
      return [];
    }

    // Generate configurable number of worklogs
    const count = context.faker.number.int({
      min: worklogConfig.countMin!,
      max: worklogConfig.countMax!,
    });

    const worklogs: Worklog[] = [];

    for (let i = 0; i < count; i++) {
      worklogs.push(this.generateWorklog(issue, users, context));
    }

    return worklogs;
  }

  generateWorklog(
    issue: IssueBean,
    users: User[],
    context: GenerationContext
  ): Worklog {
    const projectConfig = context.currentProject || getBuiltInDefaults();
    const worklogConfig = projectConfig.worklogs!;

    const id = context.idGenerator.next('worklog');
    const author = users[context.faker.number.int({ min: 0, max: users.length - 1 })];
    const updateAuthor = author;
    const issueCreated = new Date(issue.fields.created);
    const started = context.dateGenerator.worklogDate(issueCreated);
    const created = started;
    const updated = started;

    // Generate time spent in hours based on config
    const hours = randomInRange(
      context.faker,
      worklogConfig.hoursMin!,
      worklogConfig.hoursMax!
    );
    const timeSpentSeconds = Math.floor(hours * 3600);
    const timeSpent = this.formatTimeSpent(timeSpentSeconds);
    const urls = generateSelfUrls();

    return {
      self: urls.worklog(issue.key, id),
      id,
      issueId: issue.id,
      author,
      updateAuthor,
      comment: context.faker.datatype.boolean()
        ? context.faker.lorem.sentence()
        : undefined,
      created: created.toISOString(),
      updated: updated.toISOString(),
      started: started.toISOString(),
      timeSpent,
      timeSpentSeconds,
    };
  }

  private formatTimeSpent(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0 && minutes > 0) {
      return `${hours}h ${minutes}m`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}m`;
    }
  }
}
