import type { Version, Project } from '../types/jira-schemas.js';
import type { GenerationContext } from '../types/generator.types.js';
import { generateSelfUrls } from '../utils/response-builder.js';

export class VersionGenerator {
  generateVersions(project: Project, context: GenerationContext): Version[] {
    const count = context.faker.number.int({ min: 3, max: 8 });
    const versions: Version[] = [];

    for (let i = 0; i < count; i++) {
      versions.push(this.generateVersion(project, i, context));
    }

    return versions;
  }

  generateVersion(project: Project, index: number, context: GenerationContext): Version {
    const id = context.idGenerator.next('version');
    const major = context.faker.number.int({ min: 1, max: 3 });
    const minor = context.faker.number.int({ min: 0, max: 9 });
    const patch = index;
    const name = `${major}.${minor}.${patch}`;
    const isReleased = context.faker.datatype.boolean();
    const urls = generateSelfUrls();

    return {
      self: urls.version(id),
      id,
      name,
      description: `Release ${name}`,
      archived: false,
      released: isReleased,
      releaseDate: isReleased ? context.dateGenerator.past(1) .toISOString().split('T')[0] : undefined,
      projectId: parseInt(project.id),
    };
  }
}
