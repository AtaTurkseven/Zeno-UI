'use strict';

/**
 * Tests for the process-list backend module.
 */

const processList = require('../src/backend/modules/process-list');

describe('process-list', () => {
  test('getProcesses() returns an array', async () => {
    const procs = await processList.getProcesses();
    expect(Array.isArray(procs)).toBe(true);
  });

  test('each process has required fields', async () => {
    const procs = await processList.getProcesses();
    expect(procs.length).toBeGreaterThan(0);
    const p = procs[0];
    expect(typeof p.pid).toBe('number');
    expect(typeof p.name).toBe('string');
    expect(typeof p.memory).toBe('number');
    expect(typeof p.cpuTime).toBe('number');
  });

  test('returns at most 100 processes', async () => {
    const procs = await processList.getProcesses();
    expect(procs.length).toBeLessThanOrEqual(100);
  });
});
