import type { IssueLink, IssueLinkType, IssueBean, LinkedIssue } from '../types/jira-schemas.js';
import type { GenerationContext } from '../types/generator.types.js';
import { generateSelfUrls } from '../utils/response-builder.js';

export class IssueLinkGenerator {
  generateIssueLinks(
    issue: IssueBean,
    allIssues: IssueBean[],
    linkTypes: IssueLinkType[],
    context: GenerationContext
  ): IssueLink[] {
    // Generate 0-3 issue links per issue
    const count = context.faker.number.int({ min: 0, max: 3 });
    const links: IssueLink[] = [];

    // Filter out the current issue
    const otherIssues = allIssues.filter(i => i.id !== issue.id);
    if (otherIssues.length === 0) {
      return [];
    }

    for (let i = 0; i < count && i < otherIssues.length; i++) {
      const link = this.generateIssueLink(otherIssues, linkTypes, context, links);
      if (link) {
        links.push(link);
      }
    }

    return links;
  }

  generateIssueLink(
    otherIssues: IssueBean[],
    linkTypes: IssueLinkType[],
    context: GenerationContext,
    existingLinks: IssueLink[]
  ): IssueLink | null {
    // Find issues not already linked
    const linkedIssueIds = new Set(
      existingLinks.flatMap(l => [l.inwardIssue?.id, l.outwardIssue?.id].filter(Boolean))
    );

    const availableIssues = otherIssues.filter(i => !linkedIssueIds.has(i.id));
    if (availableIssues.length === 0) {
      return null;
    }

    const id = context.idGenerator.next('issuelink');
    const linkedIssue = availableIssues[
      context.faker.number.int({ min: 0, max: availableIssues.length - 1 })
    ];
    const linkType = linkTypes[
      context.faker.number.int({ min: 0, max: linkTypes.length - 1 })
    ];

    const urls = generateSelfUrls();

    // Randomly decide if this is an inward or outward link
    const isOutward = context.faker.datatype.boolean();

    const link: IssueLink = {
      id,
      self: urls.issueLink(id),
      type: linkType,
    };

    if (isOutward) {
      link.outwardIssue = this.createLinkedIssue(linkedIssue, urls);
    } else {
      link.inwardIssue = this.createLinkedIssue(linkedIssue, urls);
    }

    return link;
  }

  private createLinkedIssue(issue: IssueBean, urls: ReturnType<typeof generateSelfUrls>): LinkedIssue {
    return {
      id: issue.id,
      key: issue.key,
      self: urls.issue(issue.key),
      fields: {
        summary: issue.fields.summary,
        status: issue.fields.status,
        priority: issue.fields.priority,
        issuetype: issue.fields.issuetype,
      },
    };
  }
}
