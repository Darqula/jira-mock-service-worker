import { Faker } from '@faker-js/faker';

export class DateGenerator {
  private baseDate: Date;

  constructor(
    private faker: Faker,
    baseDate?: Date
  ) {
    this.baseDate = baseDate || new Date();
  }

  // Generate a date in the past (for created dates, etc.)
  past(years: number = 1, refDate?: Date): Date {
    return this.faker.date.past({ years, refDate: refDate || this.baseDate });
  }

  // Generate a date between two dates
  between(from: Date, to: Date): Date {
    return this.faker.date.between({ from, to });
  }

  // Generate a recent date (within last 30 days)
  recent(days: number = 30, refDate?: Date): Date {
    return this.faker.date.recent({ days, refDate: refDate || this.baseDate });
  }

  // Generate a future date (for due dates, etc.)
  future(years: number = 1, refDate?: Date): Date {
    return this.faker.date.future({ years, refDate: refDate || this.baseDate });
  }

  // Generate project created date (1-3 years ago)
  projectCreated(): Date {
    return this.past(3);
  }

  // Generate issue created date (within project timeframe)
  issueCreated(projectCreatedDate: Date): Date {
    return this.between(projectCreatedDate, this.baseDate);
  }

  // Generate issue updated date (after created date)
  issueUpdated(createdDate: Date): Date {
    const updated = this.between(createdDate, this.baseDate);
    return updated > createdDate ? updated : createdDate;
  }

  // Generate worklog date (after issue created)
  worklogDate(issueCreatedDate: Date): Date {
    return this.between(issueCreatedDate, this.baseDate);
  }

  // Format date as ISO string (Jira format)
  toISOString(date: Date): string {
    return date.toISOString();
  }

  // Format date as Jira date string (YYYY-MM-DD)
  toJiraDateString(date: Date): string {
    return date.toISOString().split('T')[0];
  }
}
