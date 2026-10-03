import React from 'react';
import { Edit3, Plus, Search, SlidersHorizontal, Trash2, X, Save } from 'lucide-react';
import { createPackage, deletePackage, getPackages, getPackageChannels, updatePackage } from './services/packagesApi.js';
import './styles/packages.css';

const empty={name:'',description:'',price:'',duration:30,maxConnections:1,status:'Activo',channelIds:[],bouquets:[]};

export default function Packages(){
  const [items,setItems]=React.useState([]);
  const [q,setQ]=React.useState('');
  const [status,setStatus]=React.useState('Todos');
  const [editing,setEditing]=React.useState(false);
  const [form,setForm]=React.useState(empty);
  const [error,setError]=React.useState('');
  const [channels,setChannels]=React.useState([]);
  const [channelQuery,setChannelQuery]=React.useState('');

  const load=React.useCallback(async()=>{
    try{
      const [packages,available]=await Promise.all([getPackages(),getPackageChannels()]);
      setItems(packages);setChannels(available);setError('');
    }catch(e){setError(e.message)}
  },[]);

  React.useEffect(()=>{load()},[load]);

  const open=(item=null)=>{
    setEditing(item||null);
    setForm(item?{...empty,...item,channelIds:Array.isArray(item.channelIds)?item.channelIds:[]}:empty);
    setChannelQuery('');
    setError('');
  };

  const save=async()=>{
    try{
      setError('');
      const payload={...form,price:Number(form.price),duration:Number(form.duration),maxConnections:Number(form.maxConnections)};
      if(!payload.name.trim())throw new Error('El nombre del paquete es obligatorio.');
      if(payload.price<0)throw new Error('El precio no puede ser negativo.');
      if(payload.duration<1)throw new Error('La duración debe ser mayor a 0 días.');
      if(payload.maxConnections<1||payload.maxConnections>99)throw new Error('Las conexiones deben estar entre 1 y 99.');
      if(editing?.id)await updatePackage(editing.id,payload);else await createPackage(payload);
      await load();
      setEditing(false);
    }catch(e){setError(e.message)}
  };

  const remove=async id=>{
    if(!window.confirm('¿Eliminar este paquete?'))return;
    try{await deletePackage(id);await load()}catch(e){setError(e.message)}
  };

  const filtered=items.filter(x=>x.name.toLowerCase().includes(q.toLowerCase())&&(status==='Todos'||x.status===status));
  const visibleChannels=channels.filter(channel=>[channel.name,channel.category,channel.number].join(' ').toLowerCase().includes(channelQuery.toLowerCase()));
  const selected=new Set((form.channelIds||[]).map(String));
  const selectVisible=()=>setForm(current=>({...current,channelIds:[...new Set([...(current.channelIds||[]),...visibleChannels.map(channel=>String(channel.id))])]}));
  const clearVisible=()=>{const visible=new Set(visibleChannels.map(channel=>String(channel.id)));setForm(current=>({...current,channelIds:(current.channelIds||[]).filter(id=>!visible.has(String(id)))}))};

  return <div className="module-page packages-page">
    <div className="module-head">
      <div className="module-title"><div className="module-icon"><Plus size={22}/></div><div><h1>Paquetes / Perfiles IPTV</h1><p>Define límites y exactamente qué canales puede ver cada usuario.</p></div></div>
      <button className="primary-button" onClick={()=>open()}><Plus size={16}/>Nuevo paquete</button>
    </div>

    <div className="package-summary">
      <div><span>Paquetes</span><strong>{items.length}</strong></div>
      <div><span>Activos</span><strong>{items.filter(x=>x.status==='Activo').length}</strong></div>
      <div><span>Canales disponibles</span><strong>{channels.length}</strong></div>
    </div>

    <div className="toolbar">
      <div className="module-search"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar paquete..."/></div>
      <button className="filter-button" onClick={()=>setStatus(status==='Todos'?'Activo':'Todos')}><SlidersHorizontal size={13}/>Estado: {status}<span>⌄</span></button>
    </div>

    {error&&<div className="module-error">{error}</div>}

    <div className="card module-table">
      <div className="table-info"><span>{filtered.length} registros</span><span>Acceso real por paquete</span></div>
      <div className="table-scroll"><table>
        <thead><tr><th>Paquete</th><th>Descripción</th><th>Precio</th><th>Duración</th><th>Conexiones</th><th>Canales</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>{filtered.map(x=><tr key={x.id}>
          <td><strong>{x.name}</strong></td>
          <td>{x.description||'—'}</td>
          <td>$ {Number(x.price).toFixed(2)}</td>
          <td>{x.duration} días</td>
          <td>{x.maxConnections}</td>
          <td>{Array.isArray(x.channelIds)&&x.channelIds.length?x.channelIds.length+' seleccionados':'Todos'}</td>
          <td><span className={'status-badge '+(x.status==='Activo'?'success':'warning')}>{x.status}</span></td>
          <td><button className="icon-button" onClick={()=>open(x)} title="Editar"><Edit3 size={15}/></button><button className="icon-button danger-icon" onClick={()=>remove(x.id)} title="Eliminar"><Trash2 size={15}/></button></td>
        </tr>)}</tbody>
      </table></div>
    </div>

    {editing!==false&&<div className="modal-backdrop"><div className="modal">
      <div className="modal-head"><div><h2>{editing?.id?'Editar paquete':'Nuevo paquete'}</h2><p>Configura conexiones y canales autorizados.</p></div><button className="icon-button" onClick={()=>setEditing(false)}><X size={18}/></button></div>
      <div className="form-grid">
        <label>Nombre<input value={form.name} onChange={e=>setForm({...form,name:e.target.value})}/></label>
        <label>Precio<input type="number" min="0" step="0.01" value={form.price} onChange={e=>setForm({...form,price:e.target.value})}/></label>
        <label>Duración (días)<input type="number" min="1" value={form.duration} onChange={e=>setForm({...form,duration:e.target.value})}/></label>
        <label>Máx. conexiones<input type="number" min="1" max="99" value={form.maxConnections} onChange={e=>setForm({...form,maxConnections:e.target.value})}/></label>
        <label className="full">Descripción<textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></label>

        <label className="full">Canales permitidos <span style={{fontWeight:400,opacity:.7}}>(ninguno seleccionado = todos)</span>
          <div style={{display:'flex',gap:8,margin:'8px 0'}}>
            <div className="module-search" style={{flex:1}}><Search size={14}/><input value={channelQuery} onChange={e=>setChannelQuery(e.target.value)} placeholder="Buscar canal o categoría..."/></div>
            <button type="button" className="secondary-button" onClick={selectVisible}>Todos visibles</button>
            <button type="button" className="secondary-button" onClick={clearVisible}>Ninguno visible</button>
          </div>
          <div style={{fontSize:12,marginBottom:6,opacity:.75}}>{selected.size} seleccionados de {channels.length}</div>
          <div style={{maxHeight:240,overflow:'auto',border:'1px solid #dfe7ef',borderRadius:10,padding:10,display:'grid',gap:6}}>
            {visibleChannels.map(channel=><label key={channel.id} style={{display:'flex',alignItems:'center',gap:8,fontWeight:500}}>
              <input type="checkbox" checked={selected.has(String(channel.id))} onChange={e=>{const id=String(channel.id),next=new Set(form.channelIds||[]);e.target.checked?next.add(id):next.delete(id);setForm({...form,channelIds:[...next]})}}/>
              <span>{channel.number?channel.number+' · ':''}{channel.name}</span><small style={{opacity:.65}}>{channel.category||''}</small>
            </label>)}
            {!visibleChannels.length&&<div className="empty-state">No hay canales que coincidan.</div>}
          </div>
        </label>

        <label>Estado<select value={form.status} onChange={e=>setForm({...form,status:e.target.value})}><option>Activo</option><option>Inactivo</option></select></label>
      </div>
      {error&&<div className="form-error">{error}</div>}
      <div className="modal-actions"><button className="secondary-button" onClick={()=>setEditing(false)}>Cancelar</button><button className="primary-button" onClick={save}><Save size={15}/>Guardar</button></div>
    </div></div>}
  </div>
}