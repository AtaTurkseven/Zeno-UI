'use strict';

/**
 * system-stats.js
 * Reads CPU, RAM, disk, and network statistics directly from /proc and /sys.
 * Falls back to the `systeminformation` library for data not easily parsed
 * from /proc (e.g. per-interface network counters).
 */

const fs   = require('fs');
const si   = require('systeminformation');

// ── CPU ──────────────────────────────────────────────────────────────────────

let _prevCpu = null;

/**
 * Parse /proc/stat and return raw CPU tick fields for all cores.
 * @returns {{ user, nice, system, idle, iowait, irq, softirq }[]}
 */
function parseProcStat() {
  const raw  = fs.readFileSync('/proc/stat', 'utf8');
  const lines = raw.split('\n').filter((l) => l.startsWith('cpu'));
  return lines.map((line) => {
    const [, user, nice, system, idle, iowait, irq, softirq] = line
      .split(/\s+/)
      .map(Number);
    return { user, nice, system, idle, iowait: iowait || 0, irq: irq || 0, softirq: softirq || 0 };
  });
}

/**
 * Calculate CPU usage % between two /proc/stat snapshots.
 * Returns an array where index 0 is aggregate and 1+ are per-core.
 */
function calcCpuUsage(prev, curr) {
  return curr.map((c, i) => {
    const p = prev[i] || c;
    const prevIdle  = p.idle + p.iowait;
    const currIdle  = c.idle + c.iowait;
    const prevTotal = p.user + p.nice + p.system + p.idle + p.iowait + p.irq + p.softirq;
    const currTotal = c.user + c.nice + c.system + c.idle + c.iowait + c.irq + c.softirq;
    const diffTotal = currTotal - prevTotal;
    const diffIdle  = currIdle  - prevIdle;
    if (diffTotal === 0) return 0;
    return Math.round(((diffTotal - diffIdle) / diffTotal) * 100);
  });
}

// ── Memory ───────────────────────────────────────────────────────────────────

/**
 * Parse /proc/meminfo and return key fields in bytes.
 */
function parseProcMeminfo() {
  const raw = fs.readFileSync('/proc/meminfo', 'utf8');
  const fields = {};
  for (const line of raw.split('\n')) {
    const m = line.match(/^(\w+):\s+(\d+)/);
    if (m) fields[m[1]] = parseInt(m[2], 10) * 1024; // kB → bytes
  }
  return {
    total:     fields.MemTotal     || 0,
    free:      fields.MemFree      || 0,
    available: fields.MemAvailable || 0,
    buffers:   fields.Buffers      || 0,
    cached:    (fields.Cached || 0) + (fields.SReclaimable || 0),
    swapTotal: fields.SwapTotal    || 0,
    swapFree:  fields.SwapFree     || 0,
  };
}

// ── Main export ──────────────────────────────────────────────────────────────

async function getStats() {
  const curr = parseProcStat();
  const cpu = _prevCpu ? calcCpuUsage(_prevCpu, curr) : curr.map(() => 0);
  _prevCpu = curr;

  const mem = parseProcMeminfo();
  const used = mem.total - mem.available;

  return {
    cpu: {
      aggregate: cpu[0] || 0,
      cores:     cpu.slice(1),
    },
    memory: {
      total:     mem.total,
      used,
      free:      mem.available,
      usedPct:   mem.total ? Math.round((used / mem.total) * 100) : 0,
      swapTotal: mem.swapTotal,
      swapUsed:  mem.swapTotal - mem.swapFree,
    },
  };
}

async function getDisk() {
  const data = await si.fsSize();
  return data.map((d) => ({
    fs:      d.fs,
    mount:   d.mount,
    size:    d.size,
    used:    d.used,
    usedPct: d.use,
  }));
}

async function getNetwork() {
  const stats = await si.networkStats();
  return stats.map((iface) => ({
    iface:   iface.iface,
    rxSec:   iface.rx_sec,
    txSec:   iface.tx_sec,
    rxTotal: iface.rx_bytes,
    txTotal: iface.tx_bytes,
  }));
}

module.exports = { getStats, getDisk, getNetwork };
