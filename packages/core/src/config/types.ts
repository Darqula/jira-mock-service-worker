export interface JiraMockConfig {
  version: '1.0';
  seed?: number;
  projects: {
    count: number;
    issuesPerProject: number;
  };
}

export interface GenerationContext {
  config: JiraMockConfig;
  seed: number;
  projectIndex?: number;
  issueIndex?: number;
}
