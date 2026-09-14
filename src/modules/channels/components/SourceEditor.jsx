import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const blank=()=>({id:`source-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,url:'',protocol:'HLS',status:'Activa',priority:1});

export default function SourceEditor({sources,onChange,disabled}){
  const add=()=>onChange([...sources,blank()]);
  const update=(index,key,value)=>onChange(sources.map((source,i)=>i===index?{...source,[key]:key==='priority'?Number(value):value}:source));
  const remove=index=>onChange(sources.filter((_,i)=>i!==index));
  return <div className="source-editor">
    <div className="source-head"><div><h3>Fuentes de streaming</h3><p>La prioridad menor se intenta primero.</p></div><button type="button" className="secondary-button" onClick={add} disabled={disabled}><Plus size={14}/>Agregar fuente</button></div>
    {sources.length===0&&<div className="source-empty">Agrega al menos una fuente para poder emitir el canal.</div>}
    {sources.map((source,index)=><div className="source-row" key={source.id||index}>
      <div className="source-index">{index+1}</div>
      <label>URL<input disabled={disabled} value={source.url} onChange={e=>update(index,'url',e.target.value)} placeholder="https://servidor/stream.m3u8"/></label>
      <label>Protocolo<select disabled={disabled} value={source.protocol} onChange={e=>update(index,'protocol',e.target.value)}><option>HLS</option><option>HTTP</option><option>HTTPS</option><option>RTMP</option><option>UDP</option><option>Otro</option></select></label>
      <label>Estado<select disabled={disabled} value={source.status} onChange={e=>update(index,'status',e.target.value)}><option>Activa</option><option>Inactiva</option></select></label>
      <label>Prioridad<input disabled={disabled} type="number" min="1" max="99" value={source.priority} onChange={e=>update(index,'priority',e.target.value)}/></label>
      <button type="button" className="icon-button danger-icon" onClick={()=>remove(index)} disabled={disabled} title="Eliminar fuente"><Trash2 size={16}/></button>
    </div>)}
  </div>;
}
