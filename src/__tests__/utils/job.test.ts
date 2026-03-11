import { describe, it, expect } from 'vitest';
import { isJobId } from '../../utils/job';

describe('isJobId', () => {
  it('should return true for valid UUID formats', () => {
    expect(isJobId('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    expect(isJobId('123e4567-e89b-42d3-a456-426614174000')).toBe(true);
  });

  it('should return false for invalid UUID formats', () => {
    expect(isJobId('not-a-uuid')).toBe(false);
    expect(isJobId('https://example.com')).toBe(false);
    expect(isJobId('')).toBe(false);
  });
});
