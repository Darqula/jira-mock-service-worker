import type { Version, Project } from '../types/jira-schemas.js';
import type { GenerationContext } from '../types/generator.types.js';
import { generateSelfUrls } from '../utils/response-builder.js';
import { getBuiltInDefaults } from '../config/defaults.js';

export class VersionGenerator {
  generateVersions(project: Project, context: GenerationContext): Version[] {
    const projectConfig = context.currentProject || getBuiltInDefaults();
    const versionConfig = projectConfig.versions!;
    const count = versionConfig.count!;
    const versions: Version[] = [];

    for (let i = 0; i < count; i++) {
      versions.push(this.generateVersion(project, i, context));
    }

    return versions;
  }

  generateVersion(project: Project, index: number, context: GenerationContext): Version {
    const projectConfig = context.currentProject || getBuiltInDefaults();
    const versionConfig = projectConfig.versions!;
    const startNumber = versionConfig.startNumber!;

    const id = context.idGenerator.next('version');
    const versionNumber = startNumber + index;

    // Generate version name (supports different formats)
    const name = this.generateVersionName(versionNumber, context);
    const isReleased = context.faker.datatype.boolean();
    const urls = generateSelfUrls();

    return {
      self: urls.version(id),
      id,
      name,
      description: `Release ${name}`,
      archived: false,
      released: isReleased,
      releaseDate: isReleased
        ? context.dateGenerator.past(1).toISOString().split('T')[0]
        : undefined,
      projectId: parseInt(project.id),
    };
  }

  /**
   * Generates a version name (supports multiple formats)
   */
  private generateVersionName(versionNumber: number, context: GenerationContext): string {
    // Choose from different version formats
    const formats = [
      `${versionNumber}.0`,           // Simple: 1.0, 2.0, 3.0
      `${versionNumber}.0.0`,         // Semantic: 1.0.0, 2.0.0, 3.0.0
      `v${versionNumber}`,            // Prefixed: v1, v2, v3
      `${versionNumber}.${context.faker.number.int({ min: 0, max: 9 })}`, // With minor: 1.5, 2.3
    ];

    return context.faker.helpers.arrayElement(formats);
  }
}
