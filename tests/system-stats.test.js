'use strict';

/**
 * Tests for the system-stats backend module.
 * We run these on Linux (CI) where /proc is available.
 */

const systemStats = require('../src/backend/modules/system-stats');

describe('system-stats', () => {
  test('getStats() returns cpu and memory objects', async () => {
    const stats = await systemStats.getStats();
    expect(stats).toHaveProperty('cpu');
    expect(stats).toHaveProperty('memory');
  });

  test('cpu.aggregate is a number 0–100', async () => {
    // Call twice so the second call can diff against the first
    await systemStats.getStats();
    const { cpu } = await systemStats.getStats();
    expect(typeof cpu.aggregate).toBe('number');
    expect(cpu.aggregate).toBeGreaterThanOrEqual(0);
    expect(cpu.aggregate).toBeLessThanOrEqual(100);
  });

  test('memory fields are non-negative numbers', async () => {
    const { memory } = await systemStats.getStats();
    expect(memory.total).toBeGreaterThan(0);
    expect(memory.used).toBeGreaterThanOrEqual(0);
    expect(memory.usedPct).toBeGreaterThanOrEqual(0);
    expect(memory.usedPct).toBeLessThanOrEqual(100);
  });
});
