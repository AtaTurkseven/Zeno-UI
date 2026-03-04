'use strict';

/**
 * process-list.js
 * Reads running processes from /proc, similar to `ps aux`.
 * No external dependencies – pure /proc parsing.
 */

const fs = require('fs');
const path = require('path');

const PROC_DIR = '/proc';

/**
 * Read a field from /proc/<pid>/status.
 * @param {string} content – full text of the status file
 * @param {string} field   – field name, e.g. "Name", "VmRSS"
 * @returns {string}
 */
function statusField(content, field) {
  const m = content.match(new RegExp(`^${field}:\\s+(.+)$`, 'm'));
  return m ? m[1].trim() : '';
}

/**
 * Returns an array of process objects, sorted by CPU time descending.
 * Each object: { pid, name, state, memory, cpuTime, user, cmdline }
 */
async function getProcesses() {
  const entries = fs.readdirSync(PROC_DIR);
  const procs = [];

  for (const entry of entries) {
    // Only numeric directories are PIDs
    if (!/^\d+$/.test(entry)) continue;
    const pid = entry;
    const base = path.join(PROC_DIR, pid);

    try {
      const status  = fs.readFileSync(path.join(base, 'status'), 'utf8');
      const statRaw = fs.readFileSync(path.join(base, 'stat'), 'utf8');
      let cmdline = fs.readFileSync(path.join(base, 'cmdline'), 'utf8')
        .replace(/\0/g, ' ').trim();
      if (!cmdline) cmdline = `[${statusField(status, 'Name')}]`;

      // /proc/<pid>/stat fields (space-separated; name may contain spaces so
      // we find it by the surrounding parens)
      const statMatch = statRaw.match(/^\d+ \((.+)\) (\S+) .+ (\d+) (\d+)$/);
      const statParts = statRaw.split(' ');
      const utime  = parseInt(statParts[13] || '0', 10);
      const stime  = parseInt(statParts[14] || '0', 10);
      const cpuTime = utime + stime;

      const vmRSS = parseInt(statusField(status, 'VmRSS'), 10) || 0; // kB

      procs.push({
        pid:     parseInt(pid, 10),
        name:    statusField(status, 'Name'),
        state:   statusField(status, 'State'),
        memory:  vmRSS * 1024, // bytes
        cpuTime,
        cmdline,
      });
    } catch {
      // Process may have exited between readdir and read – skip silently
    }
  }

  // Sort by CPU time descending (approximate CPU usage indicator)
  procs.sort((a, b) => b.cpuTime - a.cpuTime);
  return procs.slice(0, 100); // Return top 100 processes
}

module.exports = { getProcesses };
