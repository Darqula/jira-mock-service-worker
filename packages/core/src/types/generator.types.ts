import type { Faker } from '@faker-js/faker';
import type { IdGenerator } from '../generators/base/id-generator.js';
import type { DateGenerator } from '../generators/base/date-generator.js';
import type { JiraMockConfig, ProjectConfigWithKey } from '../config/types.js';
import type {
  User,
  Project,
  IssueType,
  Priority,
  Status,
} from './jira-schemas.js';
import type { Sprint } from '../generators/sprint.generator.js';

export interface GenerationContext {
  config: JiraMockConfig;
  faker: Faker;
  idGenerator: IdGenerator;
  dateGenerator: DateGenerator;
  seed: number;
  currentProject?: ProjectConfigWithKey;
  projectIndex?: number;
  issueIndex?: number;
}

export interface ProjectContext extends GenerationContext {
  project: Project;
  projectIndex: number;
}

export interface IssueContext extends ProjectContext {
  issueIndex: number;
  users: User[];
  issueTypes: IssueType[];
  priorities: Priority[];
  statuses: Status[];
  sprints?: Sprint[];
}
