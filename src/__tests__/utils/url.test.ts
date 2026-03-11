import { describe, it, expect } from 'vitest';
import { isUrl, normalizeUrl, getOrigin } from '../../utils/url';

describe('URL Utilities', () => {
  describe('isUrl', () => {
    it('should return true for valid http URLs', () => {
      expect(isUrl('http://example.com')).toBe(true);
      expect(isUrl('https://example.com')).toBe(true);
      expect(isUrl('https://example.com/path')).toBe(true);
    });

    it('should return true for domain-like strings', () => {
      expect(isUrl('example.com')).toBe(true);
      expect(isUrl('www.example.com')).toBe(true);
    });

    it('should return false for non-URLs', () => {
      expect(isUrl('hello')).toBe(false);
      expect(isUrl('--help')).toBe(false);
      expect(isUrl('')).toBe(false);
    });
  });

  describe('normalizeUrl', () => {
    it('should add https:// to URLs without protocol', () => {
      expect(normalizeUrl('example.com')).toBe('https://example.com');
    });

    it('should not modify URLs with protocol', () => {
      expect(normalizeUrl('https://example.com')).toBe('https://example.com');
      expect(normalizeUrl('http://example.com')).toBe('http://example.com');
    });
  });

  describe('getOrigin', () => {
    it('should extract origin from URL', () => {
      expect(getOrigin('https://example.com/path')).toBe('https://example.com');
      expect(getOrigin('http://sub.example.com:8080/api')).toBe(
        'http://sub.example.com:8080'
      );
    });
  });
});
