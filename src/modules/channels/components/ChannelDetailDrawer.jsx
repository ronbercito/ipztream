import React from 'react';
import Hls from 'hls.js';
import { Activity, Clock3, Edit3, Gauge, Link2, LoaderCircle, Monitor, Play, RefreshCw, RotateCw, Server, Square, Users, Video, Volume2, X } from 'lucide-react';
import { probeChannelSource, startChannelPreview, stopChannelPreview } from '../services/channelsApi.js';

function uptime(startedAt, now = Date.now()) {
  if (!startedAt) return '—';
  const total = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h ? h + 'h ' + m + 'm ' + s + 's' : m ? m + 'm ' + s + 's' : s + 's';
}

function primarySource(channel) {
  const sources = channel?.sources || [];
  const active = sources.filter((source) => source.status === 'Activa');
  return [...(active.length ? active : sources)].sort((a, b) => Number(a.priority || 99) - Number(b.priority || 99))[0] || null;
}

function formatBitrate(media) {
  const kbps = Number(media?.bitrateKbps || 0);
  if (!kbps) return '—';
  return kbps >= 1000 ? (kbps / 1000).toFixed(1) + ' Mbps' : Math.round(kbps) + ' Kbps';
}

function formatResolution(media) {
  return media?.width && media?.height ? media.width + ' × ' + media.height : '—';
}

function formatCodec(value) {
  if (!value) return '—';
  return String(value).toUpperCase().replace('H264', 'H.264').replace('HEVC', 'H.265');
}

function runtimeClients(stream) {
  for (const value of [stream?.clients, stream?.clientCount, stream?.viewers]) {
    const number = Number(value);
    if (Number.isFinite(number) && number >= 0) return number;
  }
  return null;
}

function stateFor(stream) {
  if (stream?.status === 'running') return { label: 'EN LÍNEA', className: 'online' };
  if (stream?.status === 'starting') return { label: 'INICIANDO', className: 'starting' };
  if (stream?.status === 'recovering') return { label: 'RECUPERANDO', className: 'starting' };
  if (stream?.status === 'error') return { label: 'ERROR', className: 'error' };
  return { label: 'DETENIDO', className: 'stopped' };
}

function StreamVideo({ preview, onReady, onError }) {
  const videoRef = React.useRef(null);

  React.useEffect(() => {
    if (!preview?.hlsUrl || !videoRef.current) return undefined;
    const video = videoRef.current;
    let hls = null;
    let retryTimer = null;
    let disposed = false;
    let attempt = 0;

    const play = () => video.play().catch(() => {});
    const sourceUrl = () => {
      const url = new URL(preview.hlsUrl, window.location.origin);
      url.searchParams.set('t', String(Date.now()));
      return url.pathname + url.search;
    };

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = sourceUrl();
      video.addEventListener('loadedmetadata', play, { once: true });
      return () => {
        video.removeAttribute('src');
        video.load();
      };
    }

    if (!Hls.isSupported()) {
      onError('Este navegador no soporta reproducción HLS.');
      return undefined;
    }

    hls = new Hls({
      enableWorker: true,
      lowLatencyMode: false,
      manifestLoadingMaxRetry: 12,
      manifestLoadingRetryDelay: 500,
      manifestLoadingMaxRetryTimeout: 4000,
      levelLoadingMaxRetry: 8,
      fragLoadingMaxRetry: 8
    });

    const attach = () => {
      if (disposed) return;
      attempt += 1;
      hls.loadSource(sourceUrl());
      hls.attachMedia(video);
    };

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      onReady();
      play();
    });

    hls.on(Hls.Events.ERROR, (_event, data) => {
      if (!data.fatal) return;
      if (data.type === Hls.ErrorTypes.NETWORK_ERROR && attempt < 12) {
        hls.stopLoad();
        retryTimer = setTimeout(() => {
          if (!disposed) {
            hls.detachMedia();
            attach();
          }
        }, Math.min(3000, 500 + attempt * 250));
        return;
      }
      onError('No se pudo reproducir la vista previa' + (data.details ? ': ' + data.details : '') + '.');
    });

    attach();
    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      hls?.destroy();
    };
  }, [preview?.hlsUrl, onError, onReady]);

  return <video ref={videoRef} controls autoPlay playsInline preload="auto">Tu navegador no puede reproducir esta vista previa HLS.</video>;
}

export default function ChannelDetailDrawer({
  channel,
  stream,
  media: cachedMedia,
  autoPreview = false,
  onClose,
  onMedia,
  onEdit,
  onStream
}) {
  const [tab, setTab] = React.useState('summary');
  const [now, setNow] = React.useState(Date.now());
  const [probe, setProbe] = React.useState(null);
  const [probeBusy, setProbeBusy] = React.useState(false);
  const [preview, setPreview] = React.useState(null);
  const [previewBusy, setPreviewBusy] = React.useState(false);
  const [previewReady, setPreviewReady] = React.useState(false);
  const [previewError, setPreviewError] = React.useState('');
  const previewStarted = React.useRef(false);
  const autoStarted = React.useRef(false);
  const source = React.useMemo(() => primarySource(channel), [channel]);

  const runProbe = React.useCallback(async () => {
    if (!source?.url) {
      setProbe(null);
      return;
    }
    setProbeBusy(true);
    try {
      const result = await probeChannelSource(source);
      setProbe(result);
      if (result?.media) onMedia?.(channel.id, result.media);
    } catch (error) {
      setProbe({ ok: false, message: error?.message || 'No se pudo analizar la fuente.' });
    } finally {
      setProbeBusy(false);
    }
  }, [channel.id, onMedia, source]);

  const startPreview = React.useCallback(async () => {
    if (previewBusy || preview) return;
    setPreviewBusy(true);
    setPreviewError('');
    setPreviewReady(false);
    try {
      const result = await startChannelPreview(channel.id);
      previewStarted.current = true;
      setPreview(result);
    } catch (error) {
      setPreviewError(error?.message || 'No se pudo preparar la vista previa.');
    } finally {
      setPreviewBusy(false);
    }
  }, [channel.id, preview, previewBusy]);

  React.useEffect(() => {
    setTab('summary');
    setProbe(null);
    setPreview(null);
    setPreviewError('');
    setPreviewReady(false);
    previewStarted.current = false;
    autoStarted.current = false;
    runProbe();
    return () => {
      if (previewStarted.current) stopChannelPreview(channel.id).catch(() => {});
    };
  }, [channel.id, runProbe]);

  React.useEffect(() => {
    if (autoPreview && stream?.status === 'running' && !autoStarted.current) {
      autoStarted.current = true;
      startPreview();
    }
  }, [autoPreview, startPreview, stream?.status]);

  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const key = (event) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [onClose]);

  const markPreviewReady = React.useCallback(() => setPreviewReady(true), []);
  const media = cachedMedia || probe?.media || null;
  const state = stateFor(stream);
  const clients = runtimeClients(stream);
  const running = stream?.status === 'running';
  const history = Array.isArray(stream?.history) ? stream.history : [];
  const audioText = media?.audioCodec ? formatCodec(media.audioCodec) + (media.audioChannels ? ' · ' + media.audioChannels + ' ch' : '') : '—';

  return <aside className="channel-detail-drawer" aria-label={'Detalle de ' + channel.name}>
    <div className="drawer-head">
      <div className="drawer-channel">
        <div className="drawer-logo">{channel.logo ? <img src={channel.logo} alt=""/> : <span>{channel.name.slice(0, 1)}</span>}</div>
        <div><strong>{channel.name}</strong><span>{channel.category || 'Sin categoría'} · #{channel.number}</span></div>
      </div>
      <span className={'drawer-state ' + state.className}>{state.label}</span>
      <button className="drawer-close" onClick={onClose} title="Cerrar"><X size={18}/></button>
    </div>

    <div className="drawer-tabs">
      <button className={tab === 'summary' ? 'active' : ''} onClick={() => setTab('summary')}>Resumen</button>
      <button className={tab === 'stats' ? 'active' : ''} onClick={() => setTab('stats')}>Estadísticas</button>
      <button className={tab === 'clients' ? 'active' : ''} onClick={() => setTab('clients')}>Clientes</button>
      <button className={tab === 'logs' ? 'active' : ''} onClick={() => setTab('logs')}>Logs</button>
    </div>

    <div className="drawer-scroll">
      <div className="drawer-player">
        {preview
          ? <StreamVideo preview={preview} onReady={markPreviewReady} onError={setPreviewError}/>
          : <div className="drawer-player-empty"><Video size={34}/><strong>Vista previa del stream</strong><span>{running ? 'H.264 / AAC · HLS temporal' : 'El stream debe estar en línea para reproducirse.'}</span><button disabled={!running || previewBusy} onClick={startPreview}>{previewBusy ? <LoaderCircle className="spin" size={16}/> : <Play size={16}/>} {previewBusy ? 'Preparando...' : 'Ver stream'}</button></div>}
        {preview && <span className={'drawer-live-chip ' + (previewReady ? 'ready' : '')}>{previewReady ? 'LIVE' : 'PREPARANDO'}</span>}
      </div>
      {previewError && <div className="drawer-inline-error">{previewError}</div>}

      {tab === 'summary' && <>
        <section className="drawer-section">
          <div className="drawer-section-title"><strong>Información general</strong><button onClick={runProbe} disabled={probeBusy}><RefreshCw className={probeBusy ? 'spin' : ''} size={14}/>{probeBusy ? 'Analizando' : 'Actualizar media'}</button></div>
          <div className="drawer-info-list">
            <div><Server size={15}/><span>Servidor</span><b>{channel.nodeId || 'Local / Main'}</b></div>
            <div><Link2 size={15}/><span>Origen</span><b>{source?.originType === 'ASTRA' ? 'Astra Cesbo' : source?.originType === 'M3U' ? 'M3U / M3U8' : 'HTTP directo'}</b></div>
            <div><Activity size={15}/><span>Estado</span><b className={'value-' + state.className}>{state.label}</b></div>
            <div><Clock3 size={15}/><span>Tiempo activo</span><b>{running ? uptime(stream?.startedAt, now) : '—'}</b></div>
            <div><RotateCw size={15}/><span>Reinicios</span><b>{stream?.restartCount || 0}</b></div>
            <div><Users size={15}/><span>Clientes conectados</span><b>{clients === null ? '—' : clients}</b></div>
            <div><Gauge size={15}/><span>Bitrate total</span><b>{formatBitrate(media)}</b></div>
            <div><Monitor size={15}/><span>Resolución</span><b>{formatResolution(media)}{media?.fps ? ' · ' + media.fps.toFixed(2) + ' FPS' : ''}</b></div>
            <div><Volume2 size={15}/><span>Audio</span><b>{audioText}</b></div>
            <div><Video size={15}/><span>PID FFmpeg</span><b>{stream?.pid || '—'}</b></div>
          </div>
        </section>
        {probe && <div className={'drawer-probe ' + (probe.ok ? 'ok' : 'bad')}><span>{probe.ok ? 'Fuente comprobada' : 'Comprobación de fuente'}</span><strong>{probe.ok ? (probe.responseMs || 0) + ' ms' : probe.message || 'Sin datos'}</strong></div>}
      </>}

      {tab === 'stats' && <section className="drawer-section">
        <div className="drawer-section-title"><strong>Medición actual</strong><span>ffprobe bajo demanda</span></div>
        <div className="drawer-metric-grid">
          <div><Gauge size={19}/><span>Bitrate total</span><strong>{formatBitrate(media)}</strong></div>
          <div><Monitor size={19}/><span>Resolución</span><strong>{formatResolution(media)}</strong></div>
          <div><Activity size={19}/><span>FPS</span><strong>{media?.fps ? media.fps.toFixed(2) : '—'}</strong></div>
          <div><Video size={19}/><span>Video</span><strong>{formatCodec(media?.videoCodec)}</strong></div>
          <div><Gauge size={19}/><span>Bitrate video</span><strong>{media?.videoBitrateKbps ? formatBitrate({ bitrateKbps: media.videoBitrateKbps }) : '—'}</strong></div>
          <div><Volume2 size={19}/><span>Bitrate audio</span><strong>{media?.audioBitrateKbps ? formatBitrate({ bitrateKbps: media.audioBitrateKbps }) : '—'}</strong></div>
        </div>
        <div className="drawer-note">El bitrate total se calcula con todos los paquetes recibidos durante la muestra: video + audio + subtítulos/datos. Las métricas se actualizan automáticamente cada 5 s.</div>
      </section>}

      {tab === 'clients' && <section className="drawer-section">
        <div className="drawer-section-title"><strong>Clientes conectados</strong><span>Telemetría del runtime</span></div>
        {clients === null
          ? <div className="drawer-empty"><Users size={28}/><strong>Sin telemetría de clientes</strong><span>El motor actual todavía no entrega el detalle de viewers por stream.</span></div>
          : <div className="drawer-client-total"><Users size={22}/><div><span>Conectados ahora</span><strong>{clients}</strong></div></div>}
      </section>}

      {tab === 'logs' && <section className="drawer-section">
        <div className="drawer-section-title"><strong>Historial operativo</strong><span>{history.length} eventos</span></div>
        <div className="drawer-log-list">
          {history.length ? history.slice().reverse().map((item, index) => <div key={(item.at || index) + '-' + index}><span className={item.type === 'Reinicio' ? 'restart' : 'start'}>{item.type || 'Evento'}{item.automatic ? ' automático' : ''}</span><strong>{item.at ? new Date(item.at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'medium' }) : '—'}</strong></div>) : <div className="drawer-empty"><Activity size={28}/><strong>Sin eventos registrados</strong><span>Los inicios y reinicios aparecerán aquí.</span></div>}
        </div>
      </section>}
    </div>

    <div className="drawer-actions">
      <button className="preview" disabled={!running || previewBusy} onClick={startPreview}><Play size={15}/> Preview</button>
      <button className="restart" disabled={stream?.status === 'starting'} onClick={() => onStream(channel, 'restart')}><RefreshCw size={15}/> Reiniciar</button>
      <button className="edit" onClick={() => onEdit(channel)}><Edit3 size={15}/> Editar</button>
      <button className={running ? 'stop wide' : 'start wide'} onClick={() => onStream(channel, running ? 'stop' : 'start')}>{running ? <Square size={15}/> : <Play size={15}/>} {running ? 'Detener emisión' : 'Iniciar emisión'}</button>
    </div>
  </aside>;
}
