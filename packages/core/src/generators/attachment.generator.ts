import type { Attachment, IssueBean, User } from '../types/jira-schemas.js';
import type { GenerationContext } from '../types/generator.types.js';
import { generateSelfUrls } from '../utils/response-builder.js';

export class AttachmentGenerator {
  private static readonly COMMON_FILE_TYPES = [
    { ext: 'png', mime: 'image/png', size: [50000, 500000] },
    { ext: 'jpg', mime: 'image/jpeg', size: [40000, 400000] },
    { ext: 'pdf', mime: 'application/pdf', size: [100000, 2000000] },
    {
      ext: 'docx',
      mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      size: [20000, 500000],
    },
    {
      ext: 'xlsx',
      mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: [15000, 300000],
    },
    { ext: 'txt', mime: 'text/plain', size: [1000, 50000] },
    { ext: 'log', mime: 'text/plain', size: [5000, 200000] },
    { ext: 'zip', mime: 'application/zip', size: [100000, 5000000] },
  ];

  generateAttachments(issue: IssueBean, users: User[], context: GenerationContext): Attachment[] {
    // Generate 0-5 attachments per issue
    const count = context.faker.number.int({ min: 0, max: 5 });
    const attachments: Attachment[] = [];

    for (let i = 0; i < count; i++) {
      attachments.push(this.generateAttachment(issue, users, context));
    }

    return attachments;
  }

  generateAttachment(issue: IssueBean, users: User[], context: GenerationContext): Attachment {
    const id = context.idGenerator.next('attachment');
    const author = users[context.faker.number.int({ min: 0, max: users.length - 1 })];

    const issueCreated = new Date(issue.fields.created);
    const issueUpdated = new Date(issue.fields.updated);

    // Attachments are created between issue creation and last update
    const timeDiff = issueUpdated.getTime() - issueCreated.getTime();
    const createdOffset = context.faker.number.int({ min: 0, max: timeDiff });
    const created = new Date(issueCreated.getTime() + createdOffset);

    const fileType =
      AttachmentGenerator.COMMON_FILE_TYPES[
        context.faker.number.int({ min: 0, max: AttachmentGenerator.COMMON_FILE_TYPES.length - 1 })
      ];

    const size = context.faker.number.int({
      min: fileType.size[0],
      max: fileType.size[1],
    });

    const filename = this.generateFilename(context, fileType.ext);
    const urls = generateSelfUrls();

    const attachment: Attachment = {
      self: urls.attachment(id),
      id,
      filename,
      author,
      created: created.toISOString(),
      size,
      mimeType: fileType.mime,
      content: urls.attachmentContent(id, filename),
    };

    // Add thumbnail for images
    if (fileType.mime.startsWith('image/')) {
      attachment.thumbnail = urls.attachmentThumbnail(id);
    }

    return attachment;
  }

  private generateFilename(context: GenerationContext, ext: string): string {
    const templates = [
      () => `${context.faker.system.fileName().replace(/\.[^.]+$/, '')}.${ext}`,
      () => `screenshot-${context.faker.string.alphanumeric(8)}.${ext}`,
      () => `${context.faker.lorem.words(2).replace(/\s+/g, '-')}.${ext}`,
      () => `${context.faker.word.noun()}-${context.faker.string.alphanumeric(6)}.${ext}`,
      () => `document-${context.faker.date.past().getTime()}.${ext}`,
      () => `attachment-${context.faker.string.numeric(6)}.${ext}`,
    ];

    const template = templates[context.faker.number.int({ min: 0, max: templates.length - 1 })];
    return template();
  }
}
