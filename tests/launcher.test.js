'use strict';

/**
 * Tests for the launcher backend module.
 */

const launcher = require('../src/backend/modules/launcher');

describe('launcher', () => {
  test('search() returns an array', () => {
    const results = launcher.search('');
    expect(Array.isArray(results)).toBe(true);
  });

  test('search() filters by query', () => {
    const results = launcher.search('bash');
    results.forEach((r) => {
      expect(r.toLowerCase()).toContain('bash');
    });
  });

  test('launch() rejects commands with shell metacharacters', () => {
    const r = launcher.launch('bash; rm -rf /');
    expect(r.ok).toBe(false);
    expect(r.error).toBeTruthy();
  });

  test('launch() rejects empty input', () => {
    const r = launcher.launch('');
    expect(r.ok).toBe(false);
  });
});
