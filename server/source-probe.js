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

function numberOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : null;
}

function fpsFromRate(value) {
  const raw = String(value || '');
  if (!raw || raw === '0/0') return null;
  const [a, b = '1'] = raw.split('/').map(Number);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  const fps = a / b;
  return Number.isFinite(fps) && fps > 0 ? Math.round(fps * 100) / 100 : null;
}

export async function probeSource(input = {}) {
  const url = safeUrl(input.url);
  const started = Date.now();
  try {
    const { stdout } = await exec(FFPROBE, [
      '-v', 'error',
      '-rw_timeout', String(TIMEOUT_MS * 1000),
      '-show_entries', 'format=format_name,duration,bit_rate:stream=index,codec_type,codec_name,width,height,bit_rate,channels,channel_layout,r_frame_rate,avg_frame_rate',
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

    const video = streams.find(stream => stream.codec_type === 'video') || null;
    const audio = streams.find(stream => stream.codec_type === 'audio') || null;
    const streamBitrate = streams.reduce((sum, stream) => sum + (numberOrNull(stream.bit_rate) || 0), 0) || null;
    const bitrate = numberOrNull(parsed.format?.bit_rate) || streamBitrate;
    const fps = fpsFromRate(video?.avg_frame_rate) || fpsFromRate(video?.r_frame_rate);

    return {
      ok: true,
      status: 'active',
      label: 'Activa',
      responseMs: elapsedMs,
      message: playlist && !streams.length ? 'Playlist M3U/M3U8 accesible.' : 'Fuente multimedia reconocida correctamente.',
      format: formatName || null,
      playlist,
      media: {
        bitrateBps: bitrate,
        bitrateKbps: bitrate ? Math.round(bitrate / 1000) : null,
        width: numberOrNull(video?.width),
        height: numberOrNull(video?.height),
        videoCodec: video?.codec_name || null,
        audioCodec: audio?.codec_name || null,
        audioChannels: numberOrNull(audio?.channels),
        audioLayout: audio?.channel_layout || null,
        fps
      },
      streams: streams.map(s => ({
        type: s.codec_type || null,
        codec: s.codec_name || null,
        width: s.width || null,
        height: s.height || null,
        bitRate: numberOrNull(s.bit_rate),
        channels: numberOrNull(s.channels),
        channelLayout: s.channel_layout || null,
        fps: s.codec_type === 'video' ? (fpsFromRate(s.avg_frame_rate) || fpsFromRate(s.r_frame_rate)) : null
      })).slice(0, 8)
    };
  } catch (error) {
    const elapsedMs = Date.now() - started;
    const timedOut = error?.killed || error?.signal === 'SIGTERM' || /timed out/i.test(String(error?.message || ''));
    return { ok: false, status: timedOut ? 'no_signal' : 'error', label: timedOut ? 'Sin señal' : 'Error', responseMs: elapsedMs, message: timedOut ? `La fuente no respondió dentro de ${TIMEOUT_MS / 1000}s.` : compactError(error) };
  }
}
