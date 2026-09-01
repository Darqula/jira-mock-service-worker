/**
 * Date utility functions for JQL date queries
 */

export type DateFunction =
  | 'now()'
  | 'startOfDay()'
  | 'endOfDay()'
  | 'startOfWeek()'
  | 'endOfWeek()'
  | 'startOfMonth()'
  | 'endOfMonth()'
  | 'startOfYear()'
  | 'endOfYear()';

export function isDateFunction(value: string): value is DateFunction {
  const functions: DateFunction[] = [
    'now()',
    'startOfDay()',
    'endOfDay()',
    'startOfWeek()',
    'endOfWeek()',
    'startOfMonth()',
    'endOfMonth()',
    'startOfYear()',
    'endOfYear()',
  ];
  return functions.includes(value as DateFunction);
}

export function evaluateDateFunction(func: DateFunction, baseDate?: Date): string {
  const now = baseDate || new Date();

  switch (func) {
    case 'now()':
      return now.toISOString();

    case 'startOfDay()': {
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);
      return startOfDay.toISOString();
    }

    case 'endOfDay()': {
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999);
      return endOfDay.toISOString();
    }

    case 'startOfWeek()': {
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Monday
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      return startOfWeek.toISOString();
    }

    case 'endOfWeek()': {
      const endOfWeek = new Date(now);
      const dayEnd = endOfWeek.getDay();
      const diffEnd = endOfWeek.getDate() - dayEnd + 7; // Sunday
      endOfWeek.setDate(diffEnd);
      endOfWeek.setHours(23, 59, 59, 999);
      return endOfWeek.toISOString();
    }

    case 'startOfMonth()': {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      startOfMonth.setHours(0, 0, 0, 0);
      return startOfMonth.toISOString();
    }

    case 'endOfMonth()': {
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endOfMonth.setHours(23, 59, 59, 999);
      return endOfMonth.toISOString();
    }

    case 'startOfYear()': {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      startOfYear.setHours(0, 0, 0, 0);
      return startOfYear.toISOString();
    }

    case 'endOfYear()': {
      const endOfYear = new Date(now.getFullYear(), 11, 31);
      endOfYear.setHours(23, 59, 59, 999);
      return endOfYear.toISOString();
    }

    default:
      return now.toISOString();
  }
}

/**
 * Parse a date value that might be a function or a date string
 */
export function parseDateValue(value: string): string {
  if (isDateFunction(value)) {
    return evaluateDateFunction(value);
  }
  // Remove quotes if present
  return value.replace(/["']/g, '');
}
