'use strict';

/**
 * Tests for the filesystem backend module.
 */

const fs         = require('fs');
const path       = require('path');
const os         = require('os');
const filesystem = require('../src/backend/modules/filesystem');

describe('filesystem', () => {
  test('listDirectory() lists home directory', async () => {
    const entries = await filesystem.listDirectory(os.homedir());
    expect(Array.isArray(entries)).toBe(true);
    // Each entry has name, path, type
    if (entries.length > 0) {
      expect(entries[0]).toHaveProperty('name');
      expect(entries[0]).toHaveProperty('path');
      expect(['file', 'directory', 'symlink']).toContain(entries[0].type);
    }
  });

  test('listDirectory() with null defaults to home', async () => {
    const entries = await filesystem.listDirectory(null);
    expect(Array.isArray(entries)).toBe(true);
  });

  test('readFile() reads a text file', async () => {
    // Write a temp file and read it back
    const tmp = path.join(os.tmpdir(), 'zeno-test-' + Date.now() + '.txt');
    fs.writeFileSync(tmp, 'hello zeno');
    const result = await filesystem.readFile(tmp);
    expect(result.content).toContain('hello zeno');
    expect(result.binary).toBe(false);
    fs.unlinkSync(tmp);
  });
});
