export class IdGenerator {
  private counters: Map<string, number> = new Map();

  constructor(private seed: number = 1000) {}

  next(prefix: string): string {
    const current = this.counters.get(prefix) || this.seed;
    this.counters.set(prefix, current + 1);
    return `${current}`;
  }

  nextNumeric(prefix: string): number {
    const current = this.counters.get(prefix) || this.seed;
    this.counters.set(prefix, current + 1);
    return current;
  }

  reset(prefix?: string): void {
    if (prefix) {
      this.counters.delete(prefix);
    } else {
      this.counters.clear();
    }
  }

  // Generate Jira-style project keys (e.g., PROJ, TEST, DEV)
  projectKey(index: number): string {
    const keys = [
      'PROJ',
      'TEST',
      'DEV',
      'DEMO',
      'PROD',
      'WORK',
      'TASK',
      'BUG',
      'EPIC',
      'STORY',
    ];
    if (index < keys.length) {
      return keys[index];
    }
    return `PRJ${index}`;
  }

  // Generate issue keys (e.g., PROJ-123)
  issueKey(projectKey: string, issueNumber: number): string {
    return `${projectKey}-${issueNumber}`;
  }

  // Generate account IDs (Jira Cloud format)
  accountId(): string {
    const id = this.next('account');
    return `5b10ac8d82e05b22cc7d${id.padStart(4, '0')}`;
  }

  // Generate UUIDs (simple deterministic version)
  uuid(prefix: string): string {
    const id = this.next(prefix);
    const padded = id.padStart(12, '0');
    return `${padded.substring(0, 8)}-${padded.substring(8, 12)}-4000-8000-000000000000`;
  }
}
