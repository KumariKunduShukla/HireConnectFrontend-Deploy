import { describe, it, expect } from 'vitest';
import { getErrorMessage } from './errorMessage';

describe('getErrorMessage utility', () => {
  it('returns data if data is a string', () => {
    const err = { response: { data: 'API Error' } };
    expect(getErrorMessage(err)).toBe('API Error');
  });

  it('returns data.message if available', () => {
    const err = { response: { data: { message: 'Nested Error' } } };
    expect(getErrorMessage(err)).toBe('Nested Error');
  });

  it('returns fallback when no error info', () => {
    expect(getErrorMessage({})).toBe('Something went wrong');
    expect(getErrorMessage(null, 'Custom Fallback')).toBe('Custom Fallback');
  });

  it('handles array of errors', () => {
    const err = { response: { data: ['Error 1', 'Error 2'] } };
    expect(getErrorMessage(err)).toBe('Error 1, Error 2');
  });
});
