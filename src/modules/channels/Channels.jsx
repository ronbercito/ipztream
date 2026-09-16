import React from 'react';
import { Plus, Radio, RefreshCw } from 'lucide-react';
import ChannelFilters from './components/ChannelFilters.jsx';
import ChannelForm from './components/ChannelForm.jsx';
import ChannelTable from './components/ChannelTable.jsx';
import { createChannel, deleteChannel, loadChannels, loadStream, startChannelStream, stopChannelStream, updateChannel } from './services/channelsApi.js';
import './styles/channels.css';

export default function Channels(){
  const [channels,setChannels]=React.useState([]);
  const [streams,setStreams]=React.useState({});
  const [loading,setLoading]=React.useState(true);
  const [saving,setSaving]=React.useState(false);
  const [streamBusy,setStreamBusy]=React.useState('');
  const [notice,setNotice]=React.useState('');
  const [error,setError]=React.useState('');
  const [formOpen,setFormOpen]=React.useState(false);
  const [editing,setEditing]=React.useState(null);
  const [query,setQuery]=React.useState('');
  const [status,setStatus]=React.useState('Todos');
  const [category,setCategory]=React.useState('Todas');

  const refresh=React.useCallback(async()=>{
    setLoading(true);setError('');
    try{
      const list=await loadChannels();
      setChannels(list);
      const states=await Promise.all(list.map(async channel=>{
        try{return [channel.id,await loadStream(channel.id)];}catch{return [channel.id,null];}
      }));
      setStreams(Object.fromEntries(states));
    }catch(err){setChannels([]);setError(err.message||'No se pudo consultar la API de canales.');}
    finally{setLoading(false);}
  },[]);

  React.useEffect(()=>{refresh();},[refresh]);

  const categories=React.useMemo(()=>['Todas',...Array.from(new Set(channels.map(channel=>channel.category).filter(Boolean)))],[channels]);
  const filtered=React.useMemo(()=>channels.filter(channel=>{
    const text=[channel.number,channel.name,channel.category,channel.status,...(channel.sources||[]).flatMap(source=>[source.url,source.originType,source.protocol])].join(' ').toLowerCase();
    return text.includes(query.toLowerCase())&&(status==='Todos'||channel.status===status)&&(category==='Todas'||channel.category===category);
  }),[channels,query,status,category]);

  const openNew=()=>{setEditing(null);setError('');setFormOpen(true);};
  const openEdit=channel=>{setEditing(channel);setError('');setFormOpen(true);};

  const save=async data=>{
    setSaving(true);setError('');
    try{
      const result=editing?await updateChannel(editing.id,data):await createChannel(data);
      setChannels(prev=>editing?prev.map(item=>item.id===editing.id?result:item):[result,...prev]);
      setFormOpen(false);setEditing(null);setNotice(editing?'Canal actualizado correctamente.':'Canal creado correctamente.');
      return true;
    }catch(err){setError(err.message||'No se pudo guardar el canal.');return false;}
    finally{setSaving(false);}
  };

  const remove=async channel=>{
    if(!window.confirm(`¿Eliminar el canal ${channel.name}?`)) return;
    try{await deleteChannel(channel.id);setChannels(prev=>prev.filter(item=>item.id!==channel.id));setNotice('Canal eliminado correctamente.');}
    catch(err){setError(err.message||'No se pudo eliminar el canal.');}
  };

  const toggle=async channel=>{
    const next={...channel,status:channel.status==='Activo'?'Inactivo':'Activo'};
    try{const result=await updateChannel(channel.id,next);setChannels(prev=>prev.map(item=>item.id===channel.id?result:item));setNotice(`Canal ${result.status.toLowerCase()}.`);}
    catch(err){setError(err.message||'No se pudo cambiar el estado del canal.');}
  };

  const streamAction=async(channel,action)=>{
    setStreamBusy(channel.id);setError('');
    try{
      const stream=action==='start'?await startChannelStream(channel.id):await stopChannelStream(channel.id);
      setStreams(prev=>({...prev,[channel.id]:stream}));
      setNotice(action==='start'?`Emisión de ${channel.name} iniciada.`:`Emisión de ${channel.name} detenida.`);
    }catch(err){setError(err.message||'No se pudo controlar la emisión.');}
    finally{setStreamBusy('');}
  };

  React.useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),3500);return()=>clearTimeout(timer);},[notice]);

  return <div className="channels-page">
    <div className="module-head">
      <div className="module-title"><div className="module-icon"><Radio size={22}/></div><div><h1>Canales / Fuentes</h1><p>Entradas HTTP/HLS, listas M3U y streams HTTP publicados por Astra Cesbo.</p></div></div>
      <button className="primary-button" onClick={openNew}><Plus size={16}/>Nuevo canal</button>
    </div>

    {(notice||error)&&<div className={`channels-notice ${error?'error':'success'}`}>{error||notice}</div>}
    <ChannelFilters query={query} setQuery={setQuery} status={status} setStatus={setStatus} category={category} setCategory={setCategory} categories={categories}/>
    <div className="channels-summary"><div><strong>{channels.length}</strong><span>Canales reales</span></div><div><strong>{channels.filter(c=>c.status==='Activo').length}</strong><span>Activos</span></div><div><strong>{channels.reduce((sum,c)=>sum+(c.sources?.length||0),0)}</strong><span>Fuentes</span></div><div><strong>{Object.values(streams).filter(s=>['running','starting'].includes(s?.status)).length}</strong><span>Emitiendo</span></div><button className="secondary-button" onClick={refresh} disabled={loading}><RefreshCw size={15}/>{loading?'Cargando...':'Actualizar'}</button></div>
    <ChannelTable channels={filtered} streams={streams} streamBusy={streamBusy} loading={loading} onEdit={openEdit} onDelete={remove} onToggle={toggle} onStream={streamAction}/>
    {formOpen&&<ChannelForm initial={editing} categories={categories.filter(c=>c!=='Todas')} saving={saving} externalError={error} onSave={save} onCancel={()=>{if(!saving){setFormOpen(false);setEditing(null);setError('');}}}/>} 
  </div>;
}
