// IPZStream update service — 2026-09-15
// Purpose: expose a fixed, authenticated update workflow for the test/development installation.
// It receives no shell commands or executable paths from the browser and does not alter application data.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const ROOT = process.env.IPZTREAM_ROOT || '/opt/ipztream';
const REMOTE = process.env.IPZTREAM_UPDATE_REMOTE || 'origin';
const BRANCH = process.env.IPZTREAM_UPDATE_BRANCH || 'main';
const SERVICE = process.env.IPZTREAM_SERVICE || 'ipztream-api';
let installing = false;

async function run(command, args, options = {}) {
  const result = await exec(command, args, {
    cwd: ROOT,
    timeout: options.timeout || 120000,
    maxBuffer: 1024 * 1024 * 4,
    windowsHide: true
  });
  return String(result.stdout || '').trim();
}

async function revision(ref) {
  return run('git', ['rev-parse', ref]);
}

function short(sha) {
  return String(sha || '').slice(0, 12);
}

export async function getUpdateStatus() {
  await run('git', ['fetch', '--quiet', REMOTE, BRANCH], { timeout: 60000 });
  const current = await revision('HEAD');
  const remote = await revision(`${REMOTE}/${BRANCH}`);
  const dirty = await run('git', ['status', '--porcelain']);
  const commitsRaw = current === remote
    ? ''
    : await run('git', ['log', '--format=%H%x09%s', `${current}..${REMOTE}/${BRANCH}`, '--max-count=20']);

  const commits = commitsRaw
    .split('\n')
    .filter(Boolean)
    .map((line) => {
      const [sha, ...title] = line.split('\t');
      return { sha, shortSha: short(sha), title: title.join('\t') };
    });

  return {
    current,
    currentShort: short(current),
    remote,
    remoteShort: short(remote),
    available: current !== remote,
    dirty: Boolean(dirty),
    dirtyFiles: dirty ? dirty.split('\n').filter(Boolean).slice(0, 30) : [],
    commits
  };
}

export async function installUpdate() {
  if (installing) {
    const error = new Error('Ya hay una actualización en curso.');
    error.status = 409;
    throw error;
  }

  installing = true;
  const oldRevision = await revision('HEAD');

  try {
    const status = await getUpdateStatus();
    if (status.dirty) {
      const error = new Error('La instalación fue bloqueada porque el servidor tiene cambios locales.');
      error.status = 409;
      error.details = status.dirtyFiles;
      throw error;
    }
    if (!status.available) return { installed: false, message: 'No hay una nueva versión disponible.', ...status };

    await run('git', ['pull', '--ff-only', REMOTE, BRANCH], { timeout: 120000 });
    const installedRevision = await revision('HEAD');

    try {
      await run('npm', ['install', '--no-audit', '--no-fund'], { timeout: 300000 });
      await run('npm', ['run', 'build'], { timeout: 300000 });
    } catch (error) {
      await run('git', ['reset', '--hard', oldRevision], { timeout: 60000 });
      throw new Error(`La actualización se descargó, pero la instalación/build falló. Se revirtió a ${short(oldRevision)}. ${error.stderr || error.message}`);
    }

    setTimeout(() => {
      execFile('systemctl', ['restart', SERVICE], { cwd: ROOT, timeout: 60000 }, (error) => {
        if (error) console.error(`No se pudo reiniciar ${SERVICE}:`, error.message);
      });
    }, 1000).unref();

    return {
      installed: true,
      restartScheduled: true,
      previousRevision: oldRevision,
      installedRevision,
      previousShort: short(oldRevision),
      installedShort: short(installedRevision),
      message: 'Actualización instalada. Reinicio del servicio programado.'
    };
  } finally {
    installing = false;
  }
}
