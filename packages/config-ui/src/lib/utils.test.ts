import { cn } from '@/lib/utils';

describe('cn', () => {
  it('keeps non-conflicting classes from all arguments', () => {
    expect(cn('px-2', 'py-1', 'bg-card')).toBe('px-2 py-1 bg-card');
  });

  it('merges conflicting utilities, keeping the last one', () => {
    expect(cn('p-6', 'p-4')).toBe('p-4');
    expect(cn('px-4', 'px-2')).toBe('px-2');
  });

  it('drops falsy inputs (conditional class arguments)', () => {
    expect(cn('p-6', undefined, false, 'text-sm')).toBe('p-6 text-sm');
  });

  it('merges conflicting custom theme tokens, keeping the last one', () => {
    expect(cn('bg-card', 'bg-background')).toBe('bg-background');
  });
});
