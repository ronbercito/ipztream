import React from 'react';
import { Clock3, Edit3, Folder, Gauge, History, Link2, Monitor, MonitorPlay, MoreVertical, Play, Power, RefreshCw, RotateCcw, Server, Square, Trash2, Users } from 'lucide-react';

function uptime(startedAt, now) {
  if (!startedAt) return '—';
  const total = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return h ? h + 'h ' + m + 'm' : m ? m + 'm ' + s + 's' : s + 's';
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
  return media?.width && media?.height ? media.width + '×' + media.height : '—';
}

function runtimeClients(stream) {
  for (const value of [stream?.clients, stream?.clientCount, stream?.viewers]) {
    const number = Number(value);
    if (Number.isFinite(number) && number >= 0) return number;
  }
  return null;
}

function streamState(stream) {
  if (stream?.status === 'running') return { label: 'EN LÍNEA', className: 'live' };
  if (stream?.status === 'starting') return { label: 'INICIANDO', className: 'starting' };
  if (stream?.status === 'recovering') return { label: 'RECUPERANDO', className: 'starting' };
  if (stream?.status === 'error') return { label: 'ERROR', className: 'failed' };
  return { label: 'DETENIDO', className: 'stopped' };
}

export default function ChannelTable({
  channels,
  selected = [],
  onSelected = () => {},
  streams,
  mediaByChannel = {},
  columns = { bitrate: true, resolution: true, clients: true },
  streamBusy,
  loading,
  onEdit,
  onDelete,
  onToggle,
  onStream,
  onClearHistory,
  onInspect
}) {
  const [now, setNow] = React.useState(Date.now());
  const [historyId, setHistoryId] = React.useState(null);
  const [menuId, setMenuId] = React.useState(null);

  React.useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  React.useEffect(() => {
    const close = () => setMenuId(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  if (loading) return <div className="card module-table channel-table"><div className="channel-empty">Cargando canales...</div></div>;

  const extraColumns = Number(Boolean(columns.bitrate)) + Number(Boolean(columns.resolution)) + Number(Boolean(columns.clients));
  const colSpan = 10 + extraColumns;

  return <div className="card module-table channel-table stream-modern-table">
    <div className="table-info"><span>Mostrando {channels.length} stream{channels.length === 1 ? '' : 's'}</span><span>Estado real FFmpeg/HLS · las métricas multimedia se analizan al abrir el detalle</span></div>
    <div className="table-scroll">
      <table>
        <thead><tr>
          <th><input type="checkbox" aria-label="Seleccionar todos" checked={channels.length > 0 && channels.every((channel) => selected.includes(channel.id))} onChange={(event) => onSelected(event.target.checked ? [...new Set([...selected, ...channels.map((channel) => channel.id)])] : selected.filter((id) => !channels.some((channel) => channel.id === id)))}/></th>
          <th>N.º</th>
          <th>Canal</th>
          <th>Categoría</th>
          <th>Origen</th>
          <th>Servidor</th>
          <th>Estado</th>
          {columns.bitrate && <th>Bitrate</th>}
          {columns.resolution && <th>Resolución</th>}
          {columns.clients && <th>Clientes</th>}
          <th>Tiempo activo</th>
          <th>Reinicios</th>
          <th>Acciones</th>
        </tr></thead>
        <tbody>{channels.map((channel) => {
          const source = primarySource(channel);
          const stream = streams[channel.id];
          const state = streamState(stream);
          const running = stream?.status === 'running';
          const media = mediaByChannel[channel.id];
          const clients = runtimeClients(stream);
          const historyOpen = historyId === channel.id;
          const menuOpen = menuId === channel.id;

          return <React.Fragment key={channel.id}>
            <tr className={(selected.includes(channel.id) ? 'selected-row ' : '') + (running ? 'stream-row-live' : '')}>
              <td><input type="checkbox" aria-label={'Seleccionar ' + channel.name} checked={selected.includes(channel.id)} onChange={(event) => onSelected(event.target.checked ? [...selected, channel.id] : selected.filter((id) => id !== channel.id))}/></td>
              <td><b className="channel-number">{channel.number}</b></td>
              <td>
                <button className="channel-identity-button" onClick={() => onInspect(channel, false)} title="Abrir detalle">
                  <span className="channel-logo">{channel.logo ? <img src={channel.logo} alt=""/> : <span>{channel.name.slice(0, 1)}</span>}</span>
                  <span className="channel-name-stack"><strong>{channel.name}</strong><span>{channel.status}{channel.outputFormat ? ' · ' + channel.outputFormat : ''}</span></span>
                </button>
              </td>
              <td><span className="channel-category-badge"><Folder size={12}/>{channel.category || 'General'}</span></td>
              <td><div className="stream-origin-cell"><Link2 size={13}/><span>{source?.originType === 'ASTRA' ? 'Astra Cesbo' : source?.originType === 'M3U' ? 'M3U / M3U8' : 'HTTP directo'}</span></div></td>
              <td><div className="stream-server-cell"><Server size={13}/><div><strong>{stream?.nodeName || channel.nodeId || 'Main local'}</strong><span>{stream?.execution === 'remote' ? 'SUB / remoto' : 'Main / local'} · {source ? (source.protocol || '—') + ' · P' + (source.priority || 1) : 'Sin fuente'}</span></div></div></td>
              <td><div className={'stream-state-cell ' + state.className}><span className="stream-state-badge"><i></i>{state.label}</span><small>{running ? (stream?.execution === 'remote' ? 'FFmpeg remoto' : 'FFmpeg local') + ' · PID ' + (stream?.pid || '—') : stream?.error || stream?.lastError || 'Sin emisión activa'}</small></div></td>
              {columns.bitrate && <td><div className="stream-metric-cell"><Gauge size={13}/><strong>{formatBitrate(media)}</strong>{media?.bitrateKbps ? <span className="metric-bars"><i></i><i></i><i></i><i></i></span> : <small>al abrir detalle</small>}</div></td>}
              {columns.resolution && <td><div className="stream-resolution-cell"><Monitor size={13}/><strong>{formatResolution(media)}</strong><span>{media?.fps ? media.fps.toFixed(2) + ' FPS' : '—'}</span></div></td>}
              {columns.clients && <td><div className="stream-clients-cell"><Users size={14}/><strong>{clients === null ? '—' : clients}</strong></div></td>}
              <td><div className="stream-uptime"><Clock3 size={14}/><strong>{running ? uptime(stream?.startedAt, now) : '—'}</strong></div></td>
              <td><button className="restart-summary" title="Ver historial de inicios y reinicios" onClick={() => setHistoryId(historyOpen ? null : channel.id)}><RotateCcw size={14}/><b>{stream?.restartCount || 0}</b><span>{stream?.startCount || 0} inicio(s)</span><History size={13}/></button></td>
              <td>
                <div className="row-actions stream-row-actions">
                  <button className="icon-button action-play" title="Iniciar emisión" disabled={running || streamBusy === channel.id || channel.status !== 'Activo'} onClick={() => onStream(channel, 'start')}><Play size={15}/></button>
                  <button className="icon-button action-stop" title="Detener emisión" disabled={!running || streamBusy === channel.id} onClick={() => onStream(channel, 'stop')}><Square size={15}/></button>
                  <button className="icon-button action-restart" title="Reiniciar stream" disabled={streamBusy === channel.id || channel.status !== 'Activo'} onClick={() => onStream(channel, 'restart')}><RefreshCw size={15}/></button>
                  <button className="icon-button action-preview" title="Abrir detalle y preview" onClick={() => onInspect(channel, true)}><MonitorPlay size={16}/></button>
                  <div className="stream-more-wrap">
                    <button className="icon-button action-more" title="Más acciones" onClick={(event) => { event.stopPropagation(); setMenuId(menuOpen ? null : channel.id); }}><MoreVertical size={16}/></button>
                    {menuOpen && <div className="stream-row-menu" onClick={(event) => event.stopPropagation()}>
                      <button onClick={() => { setMenuId(null); onEdit(channel); }}><Edit3 size={14}/> Editar stream</button>
                      <button onClick={() => { setMenuId(null); onToggle(channel); }}><Power size={14}/> {channel.status === 'Activo' ? 'Desactivar canal' : 'Activar canal'}</button>
                      <button onClick={() => { setMenuId(null); setHistoryId(historyOpen ? null : channel.id); }}><History size={14}/> Historial operativo</button>
                      <button className="danger" onClick={() => { setMenuId(null); onDelete(channel); }}><Trash2 size={14}/> Eliminar</button>
                    </div>}
                  </div>
                </div>
              </td>
            </tr>
            {historyOpen && <tr className="restart-history-row"><td colSpan={colSpan}><div className="restart-history"><div className="restart-history-head"><div><strong>Historial operativo · {channel.name}</strong><span>Inicios y reinicios registrados por el runtime</span></div><div><button className="history-clear" onClick={() => onClearHistory(channel)}>Borrar historial</button><button className="history-close" onClick={() => setHistoryId(null)} title="Cerrar historial">×</button></div></div><div className="history-list">{stream?.history?.length ? stream.history.map((item, index) => <div className="history-event" key={(item.at || index) + '-' + index}><span className={item.type === 'Reinicio' ? 'restart' : 'start'}>{item.type}{item.automatic ? ' automático' : ''}</span><strong>{item.at ? new Date(item.at).toLocaleString('es-PE', { dateStyle: 'short', timeStyle: 'medium' }) : '—'}</strong></div>) : <div className="history-empty">No hay registros.</div>}</div></div></td></tr>}
          </React.Fragment>;
        })}</tbody>
      </table>
    </div>
  </div>;
}
