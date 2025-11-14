import type { IssueLinkType } from '../types/jira-schemas.js';
import type { GenerationContext } from '../types/generator.types.js';
import { generateSelfUrls } from '../utils/response-builder.js';

export class IssueLinkTypeGenerator {
  private static readonly LINK_TYPES = [
    { name: 'Blocks', inward: 'is blocked by', outward: 'blocks' },
    { name: 'Cloners', inward: 'is cloned by', outward: 'clones' },
    { name: 'Duplicate', inward: 'is duplicated by', outward: 'duplicates' },
    { name: 'Relates', inward: 'relates to', outward: 'relates to' },
    { name: 'Caused', inward: 'is caused by', outward: 'causes' },
    { name: 'Parent-Child', inward: 'is parent of', outward: 'is child of' },
  ];

  generateIssueLinkTypes(context: GenerationContext): IssueLinkType[] {
    const urls = generateSelfUrls();

    return IssueLinkTypeGenerator.LINK_TYPES.map((linkType, index) => ({
      id: context.idGenerator.next('issuelinktype'),
      name: linkType.name,
      inward: linkType.inward,
      outward: linkType.outward,
      self: urls.issueLinkType(String(10000 + index)),
    }));
  }
}
