import { describe, expect, it } from 'vitest';
import { dateInputValue, dateOnlyToUtc, formatCurrency, getCurrency, initials } from './format';

describe('format helpers', () => {
  it('formats a currency with the requested ISO currency code', () => {
    expect(formatCurrency(1234.5, 'INR')).toContain('1,234.50');
  });

  it('keeps a date-only value on its original calendar date', () => {
    expect(dateOnlyToUtc('2026-10-15')).toBe('2026-10-15T00:00:00.000Z');
    expect(dateInputValue('2026-10-15T00:00:00Z')).toBe('2026-10-15');
  });

  it('creates compact initials for the app shell', () => {
    expect(initials('Katkuri Raju')).toBe('KR');
    expect(initials('')).toBe('HB');
  });

  it('uses the API settings default currency when no preference is cached', () => {
    window.localStorage.removeItem('homebudgetai.currency');
    expect(getCurrency()).toBe('USD');
  });
});
