export class IdGenerator {
  private counters: Map<string, number> = new Map();

  constructor(private seed: number = 1000) {}

  next(prefix: string): string {
    const current = this.counters.get(prefix) || this.seed;
    this.counters.set(prefix, current + 1);
    return `${current}`;
  }

  issueKey(projectKey: string, issueNumber: number): string {
    return `${projectKey}-${issueNumber}`;
  }

  accountId(): string {
    const id = this.next('account');
    return `5b10ac8d82e05b22cc7d${id.padStart(4, '0')}`;
  }
}
