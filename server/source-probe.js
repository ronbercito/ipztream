import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const FFPROBE = process.env.IPZTREAM_FFPROBE || 'ffprobe';
const TIMEOUT_MS = Math.max(3000, Number(process.env.IPZTREAM_PROBE_TIMEOUT_MS || 12000));

function safeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) throw Object.assign(new Error('La URL de la fuente es obligatoria.'), { status: 400 });
  let parsed;
  try { parsed = new URL(raw); } catch { throw Object.assign(new Error('La URL de la fuente no es válida.'), { status: 400 }); }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw Object.assign(new Error('Solo se permiten fuentes HTTP o HTTPS en esta prueba.'), { status: 400 });
  return parsed.toString();
}

function compactError(error) {
  const text = String(error?.stderr || error?.message || 'No se pudo reconocer la fuente.').replace(/\s+/g, ' ').trim();
  return text.slice(0, 300);
}

export async function probeSource(input = {}) {
  const url = safeUrl(input.url);
  const started = Date.now();
  try {
    const { stdout } = await exec(FFPROBE, [
      '-v', 'error',
      '-rw_timeout', String(TIMEOUT_MS * 1000),
      '-show_entries', 'format=format_name,duration:stream=index,codec_type,codec_name,width,height',
      '-of', 'json',
      url
    ], { timeout: TIMEOUT_MS + 2000, maxBuffer: 1024 * 1024 * 2, windowsHide: true });
    const elapsedMs = Date.now() - started;
    const parsed = JSON.parse(stdout || '{}');
    const streams = Array.isArray(parsed.streams) ? parsed.streams : [];
    const formatName = String(parsed.format?.format_name || '');
    const playlist = /hls|m3u/i.test(formatName) || /\.m3u8?(?:$|[?#])/i.test(url);
    if (!streams.length && !playlist) {
      return { ok: false, status: 'no_signal', label: 'Sin señal', responseMs: elapsedMs, message: 'La URL respondió, pero ffprobe no detectó audio, video ni playlist reproducible.' };
    }
    return {
      ok: true,
      status: 'active',
      label: 'Activa',
      responseMs: elapsedMs,
      message: playlist && !streams.length ? 'Playlist M3U/M3U8 accesible.' : 'Fuente multimedia reconocida correctamente.',
      format: formatName || null,
      playlist,
      streams: streams.map(s => ({ type: s.codec_type || null, codec: s.codec_name || null, width: s.width || null, height: s.height || null })).slice(0, 8)
    };
  } catch (error) {
    const elapsedMs = Date.now() - started;
    const timedOut = error?.killed || error?.signal === 'SIGTERM' || /timed out/i.test(String(error?.message || ''));
    return { ok: false, status: timedOut ? 'no_signal' : 'error', label: timedOut ? 'Sin señal' : 'Error', responseMs: elapsedMs, message: timedOut ? `La fuente no respondió dentro de ${TIMEOUT_MS / 1000}s.` : compactError(error) };
  }
}
