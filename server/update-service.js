// IPZStream update service — 2026-09-16
// Panel-first updater for the development/test installation.
// Browser input never becomes a shell command. Git/npm arguments are fixed here.

import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { cp, mkdir, readFile, readdir, rm } from 'node:fs/promises';

const exec = promisify(execFile);
const ROOT = process.env.IPZTREAM_ROOT || '/opt/ipztream';
const WEB_ROOT = process.env.IPZTREAM_WEB_ROOT || '/var/www/ipztream';
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

async function trackedChanges() {
  // Runtime/build artifacts must never block the updater. Only tracked modifications matter.
  return run('git', ['status', '--porcelain', '--untracked-files=no']);
}

async function buildApplication() {
  await run('npm', ['install', '--no-audit', '--no-fund', '--package-lock=false'], { timeout: 300000 });
  await run('npm', ['run', 'build'], { timeout: 300000 });
  const entries = await readdir(`${ROOT}/dist`);
  if (!entries.length) throw new Error('El build terminó sin generar archivos publicables.');
}

async function publishWebBuild() {
  const source = `${ROOT}/dist`;
  await mkdir(WEB_ROOT, { recursive: true });
  for (const entry of await readdir(WEB_ROOT)) {
    await rm(`${WEB_ROOT}/${entry}`, { recursive: true, force: true });
  }
  await cp(source, WEB_ROOT, { recursive: true, force: true });
}

async function restoreRevision(revisionSha) {
  await run('git', ['reset', '--hard', revisionSha], { timeout: 60000 });
  await buildApplication();
  await publishWebBuild();
}

export async function getUpdateStatus() {
  const checkedAt = new Date().toISOString();
  const [current, git] = await Promise.all([revision('HEAD'), gitInfo()]);
  await run('git', ['fetch', '--quiet', REMOTE, BRANCH], { timeout: 60000 });
  const remote = await revision(`${REMOTE}/${BRANCH}`);
  const dirty = await trackedChanges();
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
    blocker: dirty ? 'El servidor tiene cambios locales en archivos controlados por Git.' : current === remote ? 'No hay cambios disponibles.' : null
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
      const error = new Error('La instalación fue bloqueada porque el servidor tiene cambios locales controlados por Git.');
      error.status = 409;
      error.details = status.dirtyFiles;
      throw error;
    }
    if (!status.available) return { installed: false, message: 'No hay una nueva versión disponible.', status };

    await run('git', ['pull', '--ff-only', REMOTE, BRANCH], { timeout: 120000 });
    const installedRevision = await revision('HEAD');

    try {
      await buildApplication();
      await publishWebBuild();
    } catch (error) {
      try {
        await restoreRevision(oldRevision);
      } catch (rollbackError) {
        throw new Error(`Falló la actualización y también la restauración automática. Revisión anterior ${short(oldRevision)}. Actualización: ${error.stderr || error.message}. Restauración: ${rollbackError.stderr || rollbackError.message}`);
      }
      throw new Error(`La actualización no superó instalación/build/publicación. Se restauró ${short(oldRevision)}. ${error.stderr || error.message}`);
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
      message: `IPZStream ${pkg.version} instalado y publicado correctamente. El servicio se reiniciará automáticamente.`
    };

    // No se usa systemctl desde www-data. Al salir, Restart=always de systemd levanta
    // el servicio con el código nuevo, eliminando la necesidad de privilegios root aquí.
    setTimeout(() => process.exit(0), 1500).unref();
    return result;
  } finally {
    installing = false;
  }
}
