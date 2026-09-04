import type { Comment, IssueBean, User } from '../types/jira-schemas.js';
import type { GenerationContext } from '../types/generator.types.js';
import { generateSelfUrls } from '../utils/response-builder.js';

export class CommentGenerator {
  generateComments(issue: IssueBean, users: User[], context: GenerationContext): Comment[] {
    // Generate 0-8 comments per issue
    const count = context.faker.number.int({ min: 0, max: 8 });
    const comments: Comment[] = [];

    for (let i = 0; i < count; i++) {
      comments.push(this.generateComment(issue, users, context, i, count));
    }

    return comments;
  }

  generateComment(
    issue: IssueBean,
    users: User[],
    context: GenerationContext,
    index: number,
    totalCount: number
  ): Comment {
    const id = context.idGenerator.next('comment');
    const author = users[context.faker.number.int({ min: 0, max: users.length - 1 })];
    const updateAuthor = context.faker.datatype.boolean({ probability: 0.7 })
      ? author
      : users[context.faker.number.int({ min: 0, max: users.length - 1 })];

    const issueCreated = new Date(issue.fields.created);
    const issueUpdated = new Date(issue.fields.updated);

    // Comments are created between issue creation and last update
    const timeDiff = issueUpdated.getTime() - issueCreated.getTime();
    const commentOffset = (timeDiff / (totalCount || 1)) * index;
    const created = new Date(issueCreated.getTime() + commentOffset);

    // Updated time is between created and issue updated
    const updateOffset = context.faker.number.int({
      min: 0,
      max: issueUpdated.getTime() - created.getTime(),
    });
    const updated = new Date(created.getTime() + updateOffset);

    const urls = generateSelfUrls();

    // Generate realistic comment body
    const body = this.generateCommentBody(context);

    return {
      self: urls.comment(issue.key, id),
      id,
      author,
      body,
      updateAuthor,
      created: created.toISOString(),
      updated: updated.toISOString(),
      jsdPublic: context.faker.datatype.boolean({ probability: 0.8 }),
    };
  }

  private generateCommentBody(context: GenerationContext): string {
    const templates = [
      () => context.faker.lorem.paragraph(),
      () => `${context.faker.lorem.sentence()}\n\n${context.faker.lorem.paragraph()}`,
      () => `Thanks for reporting this issue. ${context.faker.lorem.sentence()}`,
      () => `I've reviewed this and ${context.faker.lorem.sentence()}`,
      () => `Update: ${context.faker.lorem.paragraph()}`,
      () => `Question: ${context.faker.lorem.sentence()}`,
      () => `Resolved: ${context.faker.lorem.sentence()}`,
      () => `This is related to ${context.faker.lorem.words(3)}. ${context.faker.lorem.sentence()}`,
      () => `As discussed, ${context.faker.lorem.paragraph()}`,
      () =>
        `${context.faker.lorem.sentence()}\n\nSteps taken:\n1. ${context.faker.lorem.sentence()}\n2. ${context.faker.lorem.sentence()}`,
    ];

    const template = templates[context.faker.number.int({ min: 0, max: templates.length - 1 })];
    return template();
  }
}
