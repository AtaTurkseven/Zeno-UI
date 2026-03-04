'use strict';

/**
 * Tests for the theme-manager backend module.
 */

const themeManager = require('../src/backend/modules/theme-manager');

describe('theme-manager', () => {
  test('list() returns an array of theme names', () => {
    const themes = themeManager.list();
    expect(Array.isArray(themes)).toBe(true);
    expect(themes).toContain('default');
    expect(themes).toContain('matrix');
  });

  test('get() returns the default theme object', () => {
    const theme = themeManager.get('default');
    expect(typeof theme).toBe('object');
    expect(theme).toHaveProperty('--color-bg');
    expect(theme).toHaveProperty('--color-accent');
  });

  test('get() returns the matrix theme object', () => {
    const theme = themeManager.get('matrix');
    expect(theme['--color-accent']).toBe('#00ff41');
  });

  test('get() throws on unknown theme', () => {
    expect(() => themeManager.get('nonexistent')).toThrow();
  });
});
