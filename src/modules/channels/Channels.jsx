import React from 'react';
import { Plus, Radio, RefreshCw } from 'lucide-react';
import ChannelFilters from './components/ChannelFilters.jsx';
import ChannelForm from './components/ChannelForm.jsx';
import ChannelTable from './components/ChannelTable.jsx';
import { createChannel, deleteChannel, loadChannels, updateChannel } from './services/channelsApi.js';
import './styles/channels.css';

const seedChannels=[
  {id:'channel-espn',number:1,name:'ESPN',category:'Deportes',status:'Activo',logo:'',sources:[{id:'src-espn-1',url:'https://example.com/espn.m3u8',protocol:'HLS',status:'Activa',priority:1}]},
  {id:'channel-hbo',number:2,name:'HBO Max',category:'Entretenimiento',status:'Activo',logo:'',sources:[{id:'src-hbo-1',url:'https://example.com/hbo.m3u8',protocol:'HLS',status:'Activa',priority:1}]},
  {id:'channel-tudn',number:3,name:'TUDN',category:'Deportes',status:'Activo',logo:'',sources:[{id:'src-tudn-1',url:'https://example.com/tudn.m3u8',protocol:'HLS',status:'Activa',priority:1}]}
];

export default function Channels(){
  const [channels,setChannels]=React.useState([]);
  const [loading,setLoading]=React.useState(true);
  const [saving,setSaving]=React.useState(false);
  const [notice,setNotice]=React.useState('');
  const [error,setError]=React.useState('');
  const [formOpen,setFormOpen]=React.useState(false);
  const [editing,setEditing]=React.useState(null);
  const [query,setQuery]=React.useState('');
  const [status,setStatus]=React.useState('Todos');
  const [category,setCategory]=React.useState('Todas');

  const refresh=React.useCallback(async()=>{
    setLoading(true);setError('');
    try{setChannels(await loadChannels(seedChannels));}
    catch{setChannels(seedChannels);setError('No se pudo consultar la API de canales. Se muestran datos temporales.');}
    finally{setLoading(false);}
  },[]);

  React.useEffect(()=>{refresh();},[refresh]);

  const categories=React.useMemo(()=>['Todas',...Array.from(new Set(channels.map(channel=>channel.category).filter(Boolean)))],[channels]);
  const filtered=React.useMemo(()=>channels.filter(channel=>{
    const text=[channel.number,channel.name,channel.category,channel.status,...(channel.sources||[]).map(source=>source.url)].join(' ').toLowerCase();
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

  React.useEffect(()=>{if(!notice)return;const timer=setTimeout(()=>setNotice(''),3500);return()=>clearTimeout(timer);},[notice]);

  return <div className="channels-page">
    <div className="module-head">
      <div className="module-title"><div className="module-icon"><Radio size={22}/></div><div><h1>Canales / Fuentes</h1><p>Administra canales en vivo, fuentes, prioridades y estado de emisión.</p></div></div>
      <button className="primary-button" onClick={openNew}><Plus size={16}/>Nuevo canal</button>
    </div>

    {(notice||error)&&<div className={`channels-notice ${error?'error':'success'}`}>{error||notice}</div>}

    <ChannelFilters query={query} setQuery={setQuery} status={status} setStatus={setStatus} category={category} setCategory={setCategory} categories={categories}/>

    <div className="channels-summary"><div><strong>{channels.length}</strong><span>Canales</span></div><div><strong>{channels.filter(c=>c.status==='Activo').length}</strong><span>Activos</span></div><div><strong>{channels.reduce((sum,c)=>sum+(c.sources?.length||0),0)}</strong><span>Fuentes</span></div><div><strong>{channels.filter(c=>(c.sources||[]).some(s=>s.status==='Activa')).length}</strong><span>Con fuente activa</span></div><button className="secondary-button" onClick={refresh} disabled={loading}><RefreshCw size={15}/>{loading?'Cargando...':'Actualizar'}</button></div>

    <ChannelTable channels={filtered} loading={loading} onEdit={openEdit} onDelete={remove} onToggle={toggle}/>

    {formOpen&&<ChannelForm initial={editing} categories={categories.filter(c=>c!=='Todas')} saving={saving} externalError={error} onSave={save} onCancel={()=>{if(!saving){setFormOpen(false);setEditing(null);setError('');}}}/>} 
  </div>;
}
