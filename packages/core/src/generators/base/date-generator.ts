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

  // Generate issue created date (within project timeframe)
  issueCreated(projectCreatedDate: Date, endDate?: Date): Date {
    return this.between(projectCreatedDate, endDate || this.baseDate);
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
}
