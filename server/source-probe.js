import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const FFPROBE = process.env.IPZTREAM_FFPROBE || 'ffprobe';
const TIMEOUT_MS = Math.max(3000, Number(process.env.IPZTREAM_PROBE_TIMEOUT_MS || 12000));
const BITRATE_SAMPLE_SECONDS = Math.min(3, Math.max(0.75, Number(process.env.IPZTREAM_BITRATE_SAMPLE_SECONDS || 1.25)));

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

function numberOrZero(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? number : 0;
}

function fpsFromRate(value) {
  const raw = String(value || '');
  if (!raw || raw === '0/0') return null;
  const [a, b = '1'] = raw.split('/').map(Number);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b === 0) return null;
  const fps = a / b;
  return Number.isFinite(fps) && fps > 0 ? Math.round(fps * 100) / 100 : null;
}

function kbps(value) {
  return value ? Math.round(value / 1000) : null;
}

function packetTimestamp(packet) {
  const pts = Number(packet?.pts_time);
  if (Number.isFinite(pts)) return pts;
  const dts = Number(packet?.dts_time);
  return Number.isFinite(dts) ? dts : null;
}

function measurePacketBitrates(packets = [], streams = []) {
  if (!Array.isArray(packets) || packets.length < 2) return null;

  const streamTypes = new Map(streams.map((stream) => [Number(stream.index), String(stream.codec_type || 'other')]));
  let firstTs = Infinity;
  let lastTs = -Infinity;
  let totalBytes = 0;
  const bytesByType = { video: 0, audio: 0, subtitle: 0, data: 0, other: 0 };

  for (const packet of packets) {
    const size = numberOrZero(packet?.size);
    if (!size) continue;

    totalBytes += size;
    const type = streamTypes.get(Number(packet?.stream_index));
    const bucket = Object.prototype.hasOwnProperty.call(bytesByType, type) ? type : 'other';
    bytesByType[bucket] += size;

    const ts = packetTimestamp(packet);
    if (ts === null) continue;
    const duration = Math.max(0, Number(packet?.duration_time) || 0);
    firstTs = Math.min(firstTs, ts);
    lastTs = Math.max(lastTs, ts + duration);
  }

  if (!totalBytes) return null;

  const measuredSeconds = Number.isFinite(firstTs) && Number.isFinite(lastTs) && lastTs > firstTs
    ? lastTs - firstTs
    : null;

  if (!measuredSeconds || measuredSeconds < 0.25) return null;

  const toBps = (bytes) => bytes > 0 ? Math.round((bytes * 8) / measuredSeconds) : null;
  const videoBps = toBps(bytesByType.video);
  const audioBps = toBps(bytesByType.audio);
  const subtitleBps = toBps(bytesByType.subtitle);
  const dataBps = toBps(bytesByType.data);
  const otherBps = toBps(bytesByType.other);

  return {
    measuredSeconds: Math.round(measuredSeconds * 1000) / 1000,
    totalBps: toBps(totalBytes),
    videoBps,
    audioBps,
    subtitleBps,
    dataBps,
    otherBps,
    packetCount: packets.length
  };
}

function declaredBitrates(streams = [], format = {}) {
  const videoBps = streams.filter((stream) => stream.codec_type === 'video').reduce((sum, stream) => sum + numberOrZero(stream.bit_rate), 0) || null;
  const audioBps = streams.filter((stream) => stream.codec_type === 'audio').reduce((sum, stream) => sum + numberOrZero(stream.bit_rate), 0) || null;
  const subtitleBps = streams.filter((stream) => stream.codec_type === 'subtitle').reduce((sum, stream) => sum + numberOrZero(stream.bit_rate), 0) || null;
  const dataBps = streams.filter((stream) => stream.codec_type === 'data').reduce((sum, stream) => sum + numberOrZero(stream.bit_rate), 0) || null;
  const otherBps = streams.filter((stream) => !['video', 'audio', 'subtitle', 'data'].includes(stream.codec_type)).reduce((sum, stream) => sum + numberOrZero(stream.bit_rate), 0) || null;
  const streamsTotalBps = streams.reduce((sum, stream) => sum + numberOrZero(stream.bit_rate), 0) || null;
  const formatBps = numberOrNull(format?.bit_rate);

  let totalBps = formatBps || streamsTotalBps;
  const hasVideo = streams.some((stream) => stream.codec_type === 'video');

  // Evita el falso 128 Kbps típico de HLS cuando ffprobe solo declara el audio
  // pero no entrega bit_rate para la pista de video.
  if (hasVideo && !videoBps && totalBps && audioBps && totalBps <= audioBps * 1.25) {
    totalBps = null;
  }

  return { totalBps, videoBps, audioBps, subtitleBps, dataBps, otherBps };
}

export async function probeSource(input = {}) {
  const url = safeUrl(input.url);
  const started = Date.now();
  try {
    const { stdout } = await exec(FFPROBE, [
      '-v', 'error',
      '-rw_timeout', String(TIMEOUT_MS * 1000),
      '-read_intervals', '%+' + String(BITRATE_SAMPLE_SECONDS),
      '-show_entries', 'format=format_name,duration,bit_rate:stream=index,codec_type,codec_name,width,height,bit_rate,channels,channel_layout,r_frame_rate,avg_frame_rate:packet=stream_index,size,pts_time,dts_time,duration_time',
      '-of', 'json',
      url
    ], { timeout: TIMEOUT_MS + 2500, maxBuffer: 1024 * 1024 * 8, windowsHide: true });

    const elapsedMs = Date.now() - started;
    const parsed = JSON.parse(stdout || '{}');
    const streams = Array.isArray(parsed.streams) ? parsed.streams : [];
    const packets = Array.isArray(parsed.packets) ? parsed.packets : [];
    const formatName = String(parsed.format?.format_name || '');
    const playlist = /hls|m3u/i.test(formatName) || /\.m3u8?(?:$|[?#])/i.test(url);

    if (!streams.length && !playlist) {
      return { ok: false, status: 'no_signal', label: 'Sin señal', responseMs: elapsedMs, message: 'La URL respondió, pero ffprobe no detectó audio, video ni playlist reproducible.' };
    }

    const video = streams.find((stream) => stream.codec_type === 'video') || null;
    const audio = streams.find((stream) => stream.codec_type === 'audio') || null;
    const measured = measurePacketBitrates(packets, streams);
    const declared = declaredBitrates(streams, parsed.format);
    const totalBps = measured?.totalBps || declared.totalBps;
    const videoBps = measured?.videoBps || declared.videoBps;
    const audioBps = measured?.audioBps || declared.audioBps;
    const subtitleBps = measured?.subtitleBps || declared.subtitleBps;
    const dataBps = measured?.dataBps || declared.dataBps;
    const otherBps = measured?.otherBps || declared.otherBps;
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
        bitrateBps: totalBps,
        bitrateKbps: kbps(totalBps),
        totalBitrateBps: totalBps,
        totalBitrateKbps: kbps(totalBps),
        videoBitrateBps: videoBps,
        videoBitrateKbps: kbps(videoBps),
        audioBitrateBps: audioBps,
        audioBitrateKbps: kbps(audioBps),
        subtitleBitrateBps: subtitleBps,
        subtitleBitrateKbps: kbps(subtitleBps),
        dataBitrateBps: dataBps,
        dataBitrateKbps: kbps(dataBps),
        otherBitrateBps: otherBps,
        otherBitrateKbps: kbps(otherBps),
        bitrateSource: measured?.totalBps ? 'measured_all_packets' : totalBps ? 'declared_total' : 'unavailable',
        bitrateSampleSeconds: measured?.measuredSeconds || null,
        bitratePacketCount: measured?.packetCount || 0,
        width: numberOrNull(video?.width),
        height: numberOrNull(video?.height),
        videoCodec: video?.codec_name || null,
        audioCodec: audio?.codec_name || null,
        audioChannels: numberOrNull(audio?.channels),
        audioLayout: audio?.channel_layout || null,
        fps
      },
      streams: streams.map((stream) => ({
        type: stream.codec_type || null,
        codec: stream.codec_name || null,
        width: stream.width || null,
        height: stream.height || null,
        bitRate: numberOrNull(stream.bit_rate),
        channels: numberOrNull(stream.channels),
        channelLayout: stream.channel_layout || null,
        fps: stream.codec_type === 'video' ? (fpsFromRate(stream.avg_frame_rate) || fpsFromRate(stream.r_frame_rate)) : null
      })).slice(0, 8)
    };
  } catch (error) {
    const elapsedMs = Date.now() - started;
    const timedOut = error?.killed || error?.signal === 'SIGTERM' || /timed out/i.test(String(error?.message || ''));
    return { ok: false, status: timedOut ? 'no_signal' : 'error', label: timedOut ? 'Sin señal' : 'Error', responseMs: elapsedMs, message: timedOut ? `La fuente no respondió dentro de ${TIMEOUT_MS / 1000}s.` : compactError(error) };
  }
}
