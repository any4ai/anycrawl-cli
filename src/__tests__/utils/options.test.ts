import { describe, it, expect } from 'vitest';
import { parseFormats } from '../../utils/options';

describe('parseFormats', () => {
  it('should parse single format', () => {
    expect(parseFormats('markdown')).toEqual(['markdown']);
    expect(parseFormats('html')).toEqual(['html']);
  });

  it('should parse comma-separated formats', () => {
    expect(parseFormats('markdown,html')).toEqual(['markdown', 'html']);
  });

  it('should normalize screenshot@fullpage to screenshot@fullPage', () => {
    expect(parseFormats('screenshot@fullpage')).toEqual(['screenshot@fullPage']);
  });

  it('should throw for invalid format', () => {
    expect(() => parseFormats('invalid')).toThrow('Invalid format');
  });
});
