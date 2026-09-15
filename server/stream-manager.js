import { spawn } from 'node:child_process';
import { mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { getItem, TABLES } from './db.js';

const FFMPEG_BIN = process.env.IPZTREAM_FFMPEG_BIN || 'ffmpeg';
const STREAM_ROOT = path.resolve(process.env.IPZTREAM_STREAM_ROOT || '/var/lib/ipztream/streams');
const HLS_TIME = Math.max(2, Number(process.env.IPZTREAM_HLS_TIME || 4));
const HLS_LIST_SIZE = Math.max(3, Number(process.env.IPZTREAM_HLS_LIST_SIZE || 6));
const processes = new Map();

function safeId(value) {
  return String(value || '').replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 120);
}

function sourceProtocol(value) {
  try {
    const parsed = new URL(String(value));
    return parsed.protocol.toLowerCase();
  } catch {
    return '';
  }
}

function validSourceUrl(value) {
  const protocol = sourceProtocol(value);
  return ['http:', 'https:', 'rtmp:', 'rtmps:', 'rtsp:'].includes(protocol);
}

function publicState(channelId, state) {
  return {
    channelId,
    status: state.status,
    pid: state.process?.pid || null,
    startedAt: state.startedAt || null,
    stoppedAt: state.stoppedAt || null,
    exitCode: state.exitCode ?? null,
    signal: state.signal || null,
    error: state.error || null,
    hlsUrl: state.status === 'running' || state.status === 'starting'
      ? `/streams/${safeId(channelId)}/index.m3u8`
      : null,
    logs: state.logs.slice(-20)
  };
}

function appendLog(state, chunk) {
  const lines = String(chunk || '').split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (!lines.length) return;
  state.logs.push(...lines);
  if (state.logs.length > 100) state.logs.splice(0, state.logs.length - 100);
}

function selectSource(channel) {
  const sources = Array.isArray(channel?.sources) ? channel.sources : [];
  return [...sources]
    .filter((source) => source?.status !== 'Inactiva' && validSourceUrl(source?.url))
    .sort((a, b) => Number(a.priority || 999) - Number(b.priority || 999))[0] || null;
}

function ffmpegArgs(sourceUrl, outputDir) {
  const playlist = path.join(outputDir, 'index.m3u8');
  const segments = path.join(outputDir, 'segment_%06d.ts');
  const reconnect = ['http:', 'https:'].includes(sourceProtocol(sourceUrl))
    ? ['-reconnect', '1', '-reconnect_streamed', '1', '-reconnect_delay_max', '5']
    : [];
  return [
    '-hide_banner',
    '-nostdin',
    '-loglevel', 'warning',
    ...reconnect,
    '-i', sourceUrl,
    '-map', '0:v:0',
    '-map', '0:a:0?',
    '-c:v', 'libx264',
    '-preset', process.env.IPZTREAM_VIDEO_PRESET || 'veryfast',
    '-tune', 'zerolatency',
    '-pix_fmt', 'yuv420p',
    '-c:a', 'aac',
    '-b:a', process.env.IPZTREAM_AUDIO_BITRATE || '128k',
    '-f', 'hls',
    '-hls_time', String(HLS_TIME),
    '-hls_list_size', String(HLS_LIST_SIZE),
    '-hls_flags', 'delete_segments+independent_segments+temp_file',
    '-hls_segment_filename', segments,
    playlist
  ];
}

export async function ensureStreamRoot() {
  await mkdir(STREAM_ROOT, { recursive: true, mode: 0o750 });
}

export function getStream(channelId) {
  const state = processes.get(String(channelId));
  return state ? publicState(String(channelId), state) : {
    channelId: String(channelId),
    status: 'stopped',
    pid: null,
    startedAt: null,
    stoppedAt: null,
    exitCode: null,
    signal: null,
    error: null,
    hlsUrl: null,
    logs: []
  };
}

export function listStreams() {
  return [...processes.entries()].map(([channelId, state]) => publicState(channelId, state));
}

export async function startStream(channelId) {
  const id = String(channelId);
  const existing = processes.get(id);
  if (existing?.process && !existing.process.killed && ['starting', 'running'].includes(existing.status)) {
    return publicState(id, existing);
  }

  const channel = await getItem(TABLES.channels, id);
  if (!channel) {
    const error = new Error('Canal no encontrado.');
    error.status = 404;
    throw error;
  }
  if (channel.status === 'Inactivo') {
    const error = new Error('El canal está inactivo.');
    error.status = 409;
    throw error;
  }

  const source = selectSource(channel);
  if (!source) {
    const error = new Error('El canal no tiene una fuente activa válida. Protocolos permitidos: HTTP, HTTPS, RTMP, RTMPS y RTSP.');
    error.status = 400;
    throw error;
  }

  await ensureStreamRoot();
  const outputDir = path.join(STREAM_ROOT, safeId(id));
  await rm(outputDir, { recursive: true, force: true });
  await mkdir(outputDir, { recursive: true, mode: 0o750 });

  const state = {
    status: 'starting',
    process: null,
    startedAt: new Date().toISOString(),
    stoppedAt: null,
    exitCode: null,
    signal: null,
    error: null,
    logs: []
  };
  processes.set(id, state);

  let child;
  try {
    child = spawn(FFMPEG_BIN, ffmpegArgs(source.url, outputDir), {
      cwd: outputDir,
      env: { ...process.env },
      stdio: ['ignore', 'ignore', 'pipe']
    });
  } catch (error) {
    state.status = 'error';
    state.error = error.message;
    throw error;
  }

  state.process = child;
  child.stderr.on('data', (chunk) => appendLog(state, chunk));
  child.on('spawn', () => {
    state.status = 'running';
  });
  child.on('error', (error) => {
    state.status = 'error';
    state.error = error.message;
    appendLog(state, error.message);
  });
  child.on('exit', (code, signal) => {
    state.exitCode = code;
    state.signal = signal;
    state.stoppedAt = new Date().toISOString();
    if (state.status !== 'stopping') {
      state.status = code === 0 ? 'stopped' : 'error';
      if (code !== 0 && !state.error) state.error = `FFmpeg terminó con código ${code ?? 'desconocido'}.`;
    } else {
      state.status = 'stopped';
    }
    state.process = null;
  });

  return publicState(id, state);
}

export async function stopStream(channelId) {
  const id = String(channelId);
  const state = processes.get(id);
  if (!state?.process || state.process.killed) return getStream(id);
  state.status = 'stopping';
  const child = state.process;
  await new Promise((resolve) => {
    const timeout = setTimeout(resolve, 5000);
    child.once('exit', () => {
      clearTimeout(timeout);
      resolve();
    });
    child.kill('SIGTERM');
  });
  return getStream(id);
}

export async function restartStream(channelId) {
  await stopStream(channelId);
  return startStream(channelId);
}

export async function stopAllStreams() {
  const active = [...processes.values()].filter((state) => state.process && !state.process.killed);
  await Promise.all(active.map((state) => {
    state.status = 'stopping';
    return new Promise((resolve) => {
      const timeout = setTimeout(resolve, 5000);
      state.process.once('exit', () => {
        clearTimeout(timeout);
        resolve();
      });
      state.process.kill('SIGTERM');
    });
  }));
}

export function streamRoot() {
  return STREAM_ROOT;
}

export async function assertFfmpeg() {
  return new Promise((resolve, reject) => {
    const child = spawn(FFMPEG_BIN, ['-version'], { stdio: ['ignore', 'pipe', 'pipe'] });
    let output = '';
    child.stdout.on('data', (chunk) => { output += chunk; });
    child.once('error', reject);
    child.once('exit', (code) => code === 0 ? resolve(output.split('\n')[0].trim()) : reject(new Error(`No se pudo ejecutar ${FFMPEG_BIN}.`)));
  });
}

await ensureStreamRoot();
process.once('SIGTERM', () => { stopAllStreams().finally(() => process.exit(0)); });
process.once('SIGINT', () => { stopAllStreams().finally(() => process.exit(0)); });
