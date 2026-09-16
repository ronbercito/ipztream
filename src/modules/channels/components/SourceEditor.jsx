import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

const blank=()=>({id:`source-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,url:'',originType:'HTTP',protocol:'HLS',status:'Activa',priority:1});

export default function SourceEditor({sources,onChange,disabled}){
  const add=()=>onChange([...sources,blank()]);
  const update=(index,key,value)=>onChange(sources.map((source,i)=>i===index?{...source,[key]:key==='priority'?Number(value):value}:source));
  const remove=index=>onChange(sources.filter((_,i)=>i!==index));
  return <div className="source-editor">
    <div className="source-head"><div><h3>Fuentes reales</h3><p>HTTP/HLS directo o stream HTTP publicado por Astra Cesbo. M3U queda identificado para importación.</p></div><button type="button" className="secondary-button" onClick={add} disabled={disabled}><Plus size={14}/>Agregar fuente</button></div>
    {sources.length===0&&<div className="source-empty">Agrega al menos una fuente para poder emitir el canal.</div>}
    {sources.map((source,index)=><div className="source-row" key={source.id||index}>
      <div className="source-index">{index+1}</div>
      <label>Origen<select disabled={disabled} value={source.originType||'HTTP'} onChange={e=>update(index,'originType',e.target.value)}><option value="HTTP">HTTP / URL directa</option><option value="ASTRA">Astra Cesbo</option><option value="M3U">M3U / M3U8</option></select></label>
      <label>URL<input disabled={disabled} value={source.url} onChange={e=>update(index,'url',e.target.value)} placeholder={source.originType==='ASTRA'?'http://astra:8000/canal':source.originType==='M3U'?'https://servidor/lista.m3u8':'https://servidor/stream.m3u8'}/></label>
      <label>Protocolo<select disabled={disabled} value={source.protocol||'HLS'} onChange={e=>update(index,'protocol',e.target.value)}><option>HLS</option><option>HTTP</option><option>HTTPS</option><option>MPEG-TS</option><option>RTMP</option><option>RTSP</option><option>Otro</option></select></label>
      <label>Estado<select disabled={disabled} value={source.status} onChange={e=>update(index,'status',e.target.value)}><option>Activa</option><option>Inactiva</option></select></label>
      <label>Prioridad<input disabled={disabled} type="number" min="1" max="99" value={source.priority} onChange={e=>update(index,'priority',e.target.value)}/></label>
      <button type="button" className="icon-button danger-icon" onClick={()=>remove(index)} disabled={disabled} title="Eliminar fuente"><Trash2 size={16}/></button>
    </div>)}
  </div>;
}
