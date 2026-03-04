'use strict';

/**
 * filesystem.js
 * Safe filesystem operations for the renderer: directory listing and file reading.
 * File reads are capped at 1 MB to prevent memory pressure.
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const MAX_READ_BYTES = 1024 * 1024; // 1 MB

/**
 * Sanitise and resolve a user-supplied path.
 * Returns an absolute path; defaults to the user's home directory.
 * @param {string|undefined} inputPath
 * @returns {string}
 */
function resolveSafe(inputPath) {
  if (!inputPath || typeof inputPath !== 'string') return os.homedir();
  // Resolve relative paths against home directory
  const resolved = path.isAbsolute(inputPath)
    ? path.normalize(inputPath)
    : path.join(os.homedir(), inputPath);
  return resolved;
}

/**
 * List contents of a directory.
 * @param {string} dirPath
 * @returns {Promise<{name:string, type:'file'|'directory'|'symlink', size:number, mtime:number}[]>}
 */
async function listDirectory(dirPath) {
  const target = resolveSafe(dirPath);
  const entries = fs.readdirSync(target, { withFileTypes: true });

  return entries.map((e) => {
    let size = 0;
    let mtime = 0;
    try {
      const st = fs.statSync(path.join(target, e.name));
      size  = st.size;
      mtime = st.mtimeMs;
    } catch { /* ignore stat errors */ }

    return {
      name: e.name,
      path: path.join(target, e.name),
      type: e.isDirectory() ? 'directory' : e.isSymbolicLink() ? 'symlink' : 'file',
      size,
      mtime,
    };
  });
}

/**
 * Read a text file (up to MAX_READ_BYTES).
 * Binary files are returned as a base64 string with a flag set.
 * @param {string} filePath
 * @returns {Promise<{content:string, binary:boolean, truncated:boolean}>}
 */
async function readFile(filePath) {
  const target = resolveSafe(filePath);
  const buf    = Buffer.allocUnsafe(MAX_READ_BYTES);
  const fd     = fs.openSync(target, 'r');
  const bytesRead = fs.readSync(fd, buf, 0, MAX_READ_BYTES, 0);
  fs.closeSync(fd);

  const slice     = buf.slice(0, bytesRead);
  const truncated = bytesRead === MAX_READ_BYTES;

  // Heuristic: if >30% of bytes are non-printable, treat as binary
  let nonPrintable = 0;
  for (let i = 0; i < Math.min(512, bytesRead); i++) {
    const b = slice[i];
    if (b < 9 || (b > 13 && b < 32)) nonPrintable++;
  }
  const binary = bytesRead > 0 && nonPrintable / Math.min(512, bytesRead) > 0.3;

  return {
    content:   binary ? slice.toString('base64') : slice.toString('utf8'),
    binary,
    truncated,
  };
}

module.exports = { listDirectory, readFile };
