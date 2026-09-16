// IPZStream update service — 2026-09-16
// Purpose: provide a complete, authenticated update workflow for the development/test installation.
// Browser input never becomes a shell command. Git/npm/systemctl arguments are fixed here.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { readFile } from 'node:fs/promises';

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
    windowsHide: true,
    env: process.env
  });
  return String(result.stdout || '').trim();
}

async function revision(ref) { return run('git', ['rev-parse', ref]); }
function short(sha) { return String(sha || '').slice(0, 12); }

async function packageInfo() {
  try {
    const pkg = JSON.parse(await readFile(`${ROOT}/package.json`, 'utf8'));
    return { name: pkg.name || 'ipztream', version: pkg.version || '0.0.0' };
  } catch {
    return { name: 'ipztream', version: 'desconocida' };
  }
}

async function gitInfo() {
  const [branch, remoteUrl] = await Promise.all([
    run('git', ['branch', '--show-current']),
    run('git', ['config', '--get', `remote.${REMOTE}.url`]).catch(() => '')
  ]);
  return { branch: branch || BRANCH, remoteUrl: remoteUrl || '' };
}

export async function getUpdateStatus() {
  const checkedAt = new Date().toISOString();
  const [current, git] = await Promise.all([revision('HEAD'), gitInfo()]);
  await run('git', ['fetch', '--quiet', REMOTE, BRANCH], { timeout: 60000 });
  const remote = await revision(`${REMOTE}/${BRANCH}`);
  const dirty = await run('git', ['status', '--porcelain']);
  const commitsRaw = current === remote
    ? ''
    : await run('git', ['log', '--format=%H%x09%h%x09%an%x09%ad%x09%s', '--date=iso-strict', `${current}..${REMOTE}/${BRANCH}`, '--max-count=20']);

  const commits = commitsRaw.split('\n').filter(Boolean).map((line) => {
    const [sha, shortSha, author, date, ...title] = line.split('\t');
    return { sha, shortSha: shortSha || short(sha), author, date, title: title.join('\t') };
  });
  const pkg = await packageInfo();

  return {
    ok: true,
    checkedAt,
    application: pkg.name,
    version: pkg.version,
    branch: git.branch,
    remoteName: REMOTE,
    remoteUrl: git.remoteUrl,
    service: SERVICE,
    current,
    currentShort: short(current),
    remote,
    remoteShort: short(remote),
    available: current !== remote,
    dirty: Boolean(dirty),
    dirtyFiles: dirty ? dirty.split('\n').filter(Boolean).slice(0, 30) : [],
    commits,
    canInstall: current !== remote && !dirty,
    blocker: dirty ? 'El servidor tiene cambios locales.' : current === remote ? 'No hay cambios disponibles.' : null
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
    if (!status.available) return { installed: false, message: 'No hay una nueva versión disponible.', status };

    await run('git', ['pull', '--ff-only', REMOTE, BRANCH], { timeout: 120000 });
    const installedRevision = await revision('HEAD');

    try {
      await run('npm', ['install', '--no-audit', '--no-fund'], { timeout: 300000 });
      await run('npm', ['run', 'build'], { timeout: 300000 });
    } catch (error) {
      await run('git', ['reset', '--hard', oldRevision], { timeout: 60000 });
      throw new Error(`La actualización descargada no superó la instalación/build. Se revirtió a ${short(oldRevision)}. ${error.stderr || error.message}`);
    }

    const pkg = await packageInfo();
    const result = {
      installed: true,
      restartScheduled: true,
      previousRevision: oldRevision,
      installedRevision,
      previousShort: short(oldRevision),
      installedShort: short(installedRevision),
      version: pkg.version,
      service: SERVICE,
      message: `IPZStream ${pkg.version} instalado correctamente. Se reiniciará el servicio ${SERVICE}.`
    };

    setTimeout(() => {
      execFile('systemctl', ['restart', SERVICE], { cwd: ROOT, timeout: 60000, env: process.env }, (error) => {
        if (error) console.error(`No se pudo reiniciar ${SERVICE}:`, error.message);
      });
    }, 1200).unref();

    return result;
  } finally {
    installing = false;
  }
}
