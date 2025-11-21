import type { Faker } from '@faker-js/faker';
import type { IdGenerator } from '../generators/base/id-generator.js';
import type { DateGenerator } from '../generators/base/date-generator.js';
import type { JiraMockConfig } from '../config/types.js';
import type {
  User,
  Project,
  IssueBean,
  IssueType,
  Priority,
  Status,
  StatusCategory,
  Component,
  Version,
  Worklog,
  Field,
} from './jira-schemas.js';
import type { Sprint } from '../generators/sprint.generator.js';

export interface GenerationContext {
  config: JiraMockConfig;
  faker: Faker;
  idGenerator: IdGenerator;
  dateGenerator: DateGenerator;
  seed: number;
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

export interface DataStore {
  users: User[];
  projects: Project[];
  issues: IssueBean[];
  issueTypes: IssueType[];
  priorities: Priority[];
  statuses: Status[];
  statusCategories: StatusCategory[];
  components: Component[];
  versions: Version[];
  worklogs: Worklog[];
  fields: Field[];
}

export interface Generator<T> {
  generate(context: GenerationContext): T;
  generateMany?(count: number, context: GenerationContext): T[];
}
