import React from 'react';
import { AlertTriangle, CheckCircle2, FolderOpen, Layers3, PauseCircle, Play, Plus, Radio, RadioTower, RefreshCw, RotateCw, Square, Trash2 } from 'lucide-react';
import ChannelDetailDrawer from './components/ChannelDetailDrawer.jsx';
import ChannelFilters from './components/ChannelFilters.jsx';
import ChannelForm from './components/ChannelForm.jsx';
import ChannelTable from './components/ChannelTable.jsx';
import { bulkChannelAction, clearChannelStreamHistory, createChannel, createChannelsBulk, deleteChannel, loadChannels, loadStream, restartChannelStream, startChannelStream, stopChannelStream, updateChannel } from './services/channelsApi.js';
import { loadNodes } from '../nodes/services/nodesApi.js';
import './styles/channels.css';

function primarySource(channel) {
  const sources = channel?.sources || [];
  const active = sources.filter((source) => source.status === 'Activa');
  return [...(active.length ? active : sources)].sort((a, b) => Number(a.priority || 99) - Number(b.priority || 99))[0] || null;
}

function sourceType(channel) {
  return primarySource(channel)?.originType || 'HTTP';
}

export default function Channels() {
  const [channels, setChannels] = React.useState([]);
  const [nodes, setNodes] = React.useState([]);
  const [selected, setSelected] = React.useState([]);
  const [streams, setStreams] = React.useState({});
  const [mediaByChannel, setMediaByChannel] = React.useState({});
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [streamBusy, setStreamBusy] = React.useState('');
  const [notice, setNotice] = React.useState('');
  const [error, setError] = React.useState('');
  const [formOpen, setFormOpen] = React.useState(false);
  const [editing, setEditing] = React.useState(null);
  const [massOpen, setMassOpen] = React.useState(false);
  const [massText, setMassText] = React.useState('');
  const [detail, setDetail] = React.useState(null);
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState('Todos');
  const [server, setServer] = React.useState('Todos');
  const [type, setType] = React.useState('Todos');
  const [category, setCategory] = React.useState('Todas');
  const [columns, setColumns] = React.useState({ bitrate: true, resolution: true, clients: true });

  const refreshStreams = React.useCallback(async (list) => {
    const target = list || channels;
    if (!target.length) {
      setStreams({});
      return;
    }
    const entries = await Promise.all(target.map(async (channel) => {
      try {
        return [channel.id, await loadStream(channel.id)];
      } catch {
        return [channel.id, null];
      }
    }));
    setStreams(Object.fromEntries(entries));
  }, [channels]);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const [list, nodeList] = await Promise.all([loadChannels(), loadNodes([])]);
      setChannels(list);
      setNodes(nodeList);
      await refreshStreams(list);
    } catch (refreshError) {
      setError(refreshError.message);
    } finally {
      setLoading(false);
    }
  }, [refreshStreams]);

  React.useEffect(() => {
    refresh();
  }, []);

  React.useEffect(() => {
    if (!channels.length) return undefined;
    const timer = setInterval(() => refreshStreams(), 3000);
    return () => clearInterval(timer);
  }, [channels, refreshStreams]);

  const categories = React.useMemo(() => ['Todas', ...new Set(channels.map((channel) => channel.category).filter(Boolean))], [channels]);
  const servers = React.useMemo(() => ['Todos', ...new Set(channels.map((channel) => channel.nodeId || 'Local'))], [channels]);
  const types = React.useMemo(() => ['Todos', ...new Set(channels.map(sourceType).filter(Boolean))], [channels]);

  const filtered = React.useMemo(() => channels.filter((channel) => {
    const haystack = [channel.number, channel.name, channel.category, channel.status, channel.nodeId, channel.bouquet, channel.epgId, ...(channel.sources || []).flatMap((source) => [source.url, source.originType, source.protocol])].join(' ').toLowerCase();
    const matchesQuery = haystack.includes(query.toLowerCase());
    const matchesStatus = status === 'Todos' || channel.status === status;
    const matchesCategory = category === 'Todas' || channel.category === category;
    const matchesServer = server === 'Todos' || (channel.nodeId || 'Local') === server;
    const matchesType = type === 'Todos' || sourceType(channel) === type;
    return matchesQuery && matchesStatus && matchesCategory && matchesServer && matchesType;
  }).sort((a, b) => Number(a.sortOrder || a.number) - Number(b.sortOrder || b.number)), [channels, query, status, category, server, type]);

  const streamStats = React.useMemo(() => {
    let running = 0;
    let errors = 0;
    let stopped = 0;
    for (const channel of channels) {
      const streamStatus = streams[channel.id]?.status;
      if (streamStatus === 'running') running += 1;
      else if (streamStatus === 'error') errors += 1;
      else if (!['starting', 'recovering'].includes(streamStatus)) stopped += 1;
    }
    return { running, errors, stopped };
  }, [channels, streams]);

  const detailChannel = detail ? channels.find((channel) => channel.id === detail.id) || null : null;
  const closeDetail = React.useCallback(() => setDetail(null), []);
  const handleMedia = React.useCallback((id, media) => setMediaByChannel((previous) => ({ ...previous, [id]: media })), []);

  const openEdit = React.useCallback((channel) => {
    setDetail(null);
    setEditing(channel);
    setFormOpen(true);
  }, []);

  const save = async (data) => {
    setSaving(true);
    setError('');
    const edit = Boolean(editing);
    const old = edit ? streams[editing.id] : null;
    const wasRunning = edit && ['running', 'starting', 'recovering'].includes(old?.status);
    let stoppedForEdit = false;
    try {
      if (wasRunning) {
        await stopChannelStream(editing.id);
        stoppedForEdit = true;
      }
      const result = edit ? await updateChannel(editing.id, data) : await createChannel(data);
      setChannels((previous) => edit ? previous.map((item) => item.id === editing.id ? result : item) : [result, ...previous]);
      setMediaByChannel((previous) => {
        if (!edit) return previous;
        const next = { ...previous };
        delete next[editing.id];
        return next;
      });
      let stream = null;
      let runtimeError = '';
      if (result.status === 'Activo') {
        try { stream = await startChannelStream(result.id); } catch (startError) { runtimeError = startError.message; }
      } else if (wasRunning) {
        try { stream = await loadStream(result.id); } catch {}
      }
      if (stream) setStreams((previous) => ({ ...previous, [result.id]: stream }));
      setFormOpen(false);
      setEditing(null);
      setNotice(runtimeError ? result.name + ' guardado. No se pudo iniciar: ' + runtimeError : result.status === 'Activo' ? result.name + ' guardado. Emisión iniciada.' : result.name + ' guardado como inactivo.');
      setTimeout(() => refreshStreams(), 1200);
      return true;
    } catch (saveError) {
      if (stoppedForEdit && edit) startChannelStream(editing.id).catch(() => {});
      setError(saveError.message);
      return false;
    } finally {
      setSaving(false);
    }
  };

  const remove = async (channel) => {
    if (!confirm('¿Eliminar el stream ' + channel.name + '?')) return;
    try {
      if (['running', 'starting', 'recovering'].includes(streams[channel.id]?.status)) await stopChannelStream(channel.id);
      await deleteChannel(channel.id);
      setChannels((previous) => previous.filter((item) => item.id !== channel.id));
      setSelected((previous) => previous.filter((id) => id !== channel.id));
      setMediaByChannel((previous) => {
        const next = { ...previous };
        delete next[channel.id];
        return next;
      });
      if (detail?.id === channel.id) setDetail(null);
    } catch (removeError) {
      setError(removeError.message);
    }
  };

  const toggle = async (channel) => {
    try {
      const active = channel.status !== 'Activo';
      const current = streams[channel.id];
      const wasRunning = ['running', 'starting', 'recovering'].includes(current?.status);
      let stopped = false;
      if (!active && wasRunning) {
        await stopChannelStream(channel.id);
        stopped = true;
      }
      const result = await updateChannel(channel.id, { ...channel, status: active ? 'Activo' : 'Inactivo' });
      setChannels((previous) => previous.map((item) => item.id === channel.id ? result : item));
      let stream = null;
      if (active) {
        try { stream = await startChannelStream(channel.id); } catch (startError) { setNotice(result.name + ' activado, pero no pudo iniciar: ' + startError.message); }
      } else if (stopped) {
        try { stream = await loadStream(channel.id); } catch {}
      }
      if (stream) setStreams((previous) => ({ ...previous, [channel.id]: stream }));
    } catch (toggleError) {
      setError(toggleError.message);
    }
  };

  const streamAction = async (channel, action) => {
    setStreamBusy(channel.id);
    try {
      const stream = action === 'start' ? await startChannelStream(channel.id) : action === 'restart' ? await restartChannelStream(channel.id) : await stopChannelStream(channel.id);
      setStreams((previous) => ({ ...previous, [channel.id]: stream }));
      setNotice(action === 'restart' ? 'Stream reiniciado.' : action === 'start' ? 'Stream iniciado.' : 'Stream detenido.');
      return stream;
    } catch (streamError) {
      setError(streamError.message);
      return null;
    } finally {
      setStreamBusy('');
    }
  };

  const bulk = async (action) => {
    if (!selected.length) return;
    let payload = {};
    if (action === 'category') {
      const value = prompt('Nueva categoría:');
      if (value === null) return;
      payload.category = value;
    }
    if (action === 'bouquet') {
      const value = prompt('Bouquet / paquete:');
      if (value === null) return;
      payload.bouquet = value;
    }
    if (action === 'delete' && !confirm('¿Eliminar ' + selected.length + ' stream(s)?')) return;
    try {
      if (['start', 'stop', 'restart'].includes(action)) {
        for (const id of selected) {
          const channel = channels.find((item) => item.id === id);
          if (channel) await streamAction(channel, action);
        }
        setSelected([]);
        return;
      }
      if (['deactivate', 'delete'].includes(action)) {
        for (const id of selected) {
          const current = streams[id];
          if (['running', 'starting', 'recovering'].includes(current?.status)) await stopChannelStream(id);
        }
      }
      await bulkChannelAction(selected, action, payload);
      if (action === 'activate') {
        for (const id of selected) {
          try { await startChannelStream(id); } catch {}
        }
      }
      setSelected([]);
      await refresh();
      setNotice('Operación masiva completada.');
    } catch (bulkError) {
      setError(bulkError.message);
    }
  };

  const massCreate = async () => {
    const rows = massText.split(/\r?\n/).map((value) => value.trim()).filter(Boolean);
    if (!rows.length) return;
    const items = rows.map((line, index) => {
      const parts = line.split('|').map((value) => value.trim());
      return { number: Number(parts[0]) || index + 1, name: parts[1] || 'Canal ' + (index + 1), category: parts[2] || 'General', status: 'Activo', sources: [{ url: parts[3] || '', protocol: 'HLS', status: 'Activa', priority: 1 }] };
    });
    try {
      const result = await createChannelsBulk(items);
      setMassOpen(false);
      setMassText('');
      await refresh();
      setNotice((result.created?.length || 0) + ' stream(s) creados; ' + (result.errors?.length || 0) + ' omitidos.');
    } catch (massError) {
      setError(massError.message);
    }
  };

  const clearHistory = async (channel) => {
    try {
      const stream = await clearChannelStreamHistory(channel.id);
      setStreams((previous) => ({ ...previous, [channel.id]: stream }));
      setNotice('Historial de ' + channel.name + ' borrado.');
    } catch (historyError) {
      setError(historyError.message);
    }
  };

  return <div className={'channels-page xui-streams modern-streams' + (detailChannel ? ' details-open' : '')}>
    <div className="stream-page-hero">
      <div className="stream-page-title"><span className="stream-page-icon"><RadioTower size={26}/></span><div><h1>Streams / Canales</h1><span>Administra, monitorea y controla tus señales en tiempo real</span></div></div>
      <div className="xui-title-actions modern-title-actions">
        <button className="stream-refresh-button" onClick={refresh} title="Actualizar ahora"><RefreshCw size={15}/> Actualizar</button>
        <button onClick={() => setMassOpen(true)}><Layers3 size={15}/> Añadir múltiples</button>
        <button className="xui-primary" onClick={() => { setEditing(null); setFormOpen(true); }}><Plus size={15}/> Añadir Stream</button>
      </div>
    </div>

    <div className="stream-summary-grid">
      <div className="stream-summary-card tone-blue"><span className="stream-summary-icon"><Radio size={22}/></span><div><span>Total de Streams</span><strong>{channels.length}</strong><small>Canales configurados</small></div><i className="summary-signal"><b></b><b></b><b></b></i></div>
      <div className="stream-summary-card tone-green"><span className="stream-summary-icon"><CheckCircle2 size={22}/></span><div><span>Funcionando</span><strong>{streamStats.running}</strong><small>{channels.length ? Math.round(streamStats.running / channels.length * 100) : 0}% del total</small></div><i className="summary-signal"><b></b><b></b><b></b></i></div>
      <div className="stream-summary-card tone-red"><span className="stream-summary-icon"><AlertTriangle size={22}/></span><div><span>Con error</span><strong>{streamStats.errors}</strong><small>{channels.length ? Math.round(streamStats.errors / channels.length * 100) : 0}% del total</small></div><i className="summary-signal"><b></b><b></b><b></b></i></div>
      <div className="stream-summary-card tone-orange"><span className="stream-summary-icon"><PauseCircle size={22}/></span><div><span>Detenidos</span><strong>{streamStats.stopped}</strong><small>Sin emisión activa</small></div><i className="summary-signal"><b></b><b></b><b></b></i></div>
    </div>

    {(notice || error) && <div className={'channels-notice ' + (error ? 'error' : 'success')} onClick={() => { setNotice(''); setError(''); }}>{error || notice}</div>}

    <div className="xui-panel modern-stream-panel">
      <ChannelFilters
        query={query}
        setQuery={setQuery}
        status={status}
        setStatus={setStatus}
        server={server}
        setServer={setServer}
        type={type}
        setType={setType}
        category={category}
        setCategory={setCategory}
        servers={servers}
        types={types}
        categories={categories}
        columns={columns}
        onToggleColumn={(name) => setColumns((previous) => ({ ...previous, [name]: !previous[name] }))}
      />

      {selected.length > 0 && <div className="xui-bulkbar">
        <b>{selected.length} seleccionados</b>
        <button onClick={() => bulk('start')}><Play size={13}/> Iniciar</button>
        <button onClick={() => bulk('stop')}><Square size={13}/> Detener</button>
        <button onClick={() => bulk('restart')}><RotateCw size={13}/> Reiniciar</button>
        <button onClick={() => bulk('activate')}>Activar</button>
        <button onClick={() => bulk('deactivate')}>Desactivar</button>
        <button onClick={() => bulk('category')}><FolderOpen size={13}/> Categoría</button>
        <button onClick={() => bulk('bouquet')}><Layers3 size={13}/> Bouquet</button>
        <button className="danger" onClick={() => bulk('delete')}><Trash2 size={13}/> Eliminar</button>
      </div>}

      <ChannelTable
        selected={selected}
        onSelected={setSelected}
        channels={filtered}
        streams={streams}
        mediaByChannel={mediaByChannel}
        columns={columns}
        streamBusy={streamBusy}
        loading={loading}
        onEdit={openEdit}
        onDelete={remove}
        onToggle={toggle}
        onStream={streamAction}
        onClearHistory={clearHistory}
        onInspect={(channel, autoPreview) => setDetail({ id: channel.id, autoPreview: Boolean(autoPreview) })}
      />
    </div>

    {detailChannel && <ChannelDetailDrawer
      channel={detailChannel}
      stream={streams[detailChannel.id]}
      media={mediaByChannel[detailChannel.id]}
      autoPreview={detail.autoPreview}
      onClose={closeDetail}
      onMedia={handleMedia}
      onEdit={openEdit}
      onStream={streamAction}
    />}

    {formOpen && <ChannelForm initial={editing} stream={editing ? streams[editing.id] : null} nodes={nodes} categories={categories.filter((value) => value !== 'Todas')} saving={saving} externalError={error} onSave={save} onCancel={() => { setFormOpen(false); setEditing(null); }}/>}
    {massOpen && <div className="modal-backdrop"><div className="modal xui-mass-modal"><div className="xui-modal-head"><div><Layers3 size={17}/><strong>Añadir múltiples Streams</strong></div><button onClick={() => setMassOpen(false)}>×</button></div><div className="xui-modal-body"><p>Un stream por línea. Formato: <b>NÚMERO | NOMBRE | CATEGORÍA | URL</b></p><textarea value={massText} onChange={(event) => setMassText(event.target.value)} placeholder={'1 | Canal Uno | TV | http://servidor/stream.m3u8\n2 | Canal Dos | Deportes | http://servidor/stream2.m3u8'}/></div><div className="xui-modal-foot"><button onClick={() => setMassOpen(false)}>Cancelar</button><button className="xui-primary" onClick={massCreate}><Plus size={14}/> Añadir Streams</button></div></div></div>}
  </div>;
}
