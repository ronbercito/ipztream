import React from 'react';
import { Plus, Trash2, Link2, Info, Server, ListVideo } from 'lucide-react';

const blank=(priority=1)=>({id:`source-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,url:'',originType:'HTTP',protocol:'HLS',status:'Activa',priority});

export default function SourceEditor({sources,onChange,disabled}){
  const add=()=>onChange([...sources,blank(sources.length+1)]);
  const update=(index,key,value)=>onChange(sources.map((source,i)=>i===index?{...source,[key]:key==='priority'?Number(value):value}:source));
  const remove=index=>onChange(sources.filter((_,i)=>i!==index));
  return <div className="source-editor-v2">
    <div className="source-head-v2"><div className="channel-section-title source-section-title"><span>2</span><div><h3>Fuentes de transmisión</h3><p>Añade una o más fuentes para este canal.</p></div></div><button type="button" className="primary-button compact" onClick={add} disabled={disabled}><Plus size={15}/>Agregar fuente</button></div>
    <div className="source-tip"><Info size={17}/><span>La fuente con prioridad <strong>1</strong> será la principal. Las demás quedan como respaldo.</span></div>
    {sources.length===0&&<div className="source-empty-v2"><Link2 size={25}/><strong>Sin fuentes</strong><span>Agrega una URL HTTP/HLS o un stream HTTP publicado por Astra Cesbo.</span><button type="button" className="secondary-button" onClick={add} disabled={disabled}><Plus size={14}/>Agregar primera fuente</button></div>}
    <div className="source-card-list">{sources.map((source,index)=><div className="source-card" key={source.id||index}>
      <div className="source-card-head"><div className="source-card-number">{index+1}</div><div className="source-card-state"><span className={source.status==='Activa'?'dot-live':'dot-off'}></span>{source.status}</div><button type="button" className="source-delete" onClick={()=>remove(index)} disabled={disabled}><Trash2 size={15}/>Eliminar</button></div>
      <div className="source-card-grid">
        <label className="channel-field full-source-field">Tipo de fuente<div className="input-with-icon">{source.originType==='ASTRA'?<Server size={16}/>:source.originType==='M3U'?<ListVideo size={16}/>:<Link2 size={16}/>}<select disabled={disabled} value={source.originType||'HTTP'} onChange={e=>update(index,'originType',e.target.value)}><option value="HTTP">HTTP / URL directa</option><option value="ASTRA">Astra Cesbo</option><option value="M3U">M3U / M3U8</option></select></div></label>
        <label className="channel-field full-source-field">URL del stream <b>*</b><div className="input-with-icon"><Link2 size={16}/><input disabled={disabled} value={source.url} onChange={e=>update(index,'url',e.target.value)} placeholder={source.originType==='ASTRA'?'http://IP_ASTRA:8000/canal':source.originType==='M3U'?'https://servidor/lista.m3u8':'https://servidor/stream.m3u8'}/></div></label>
        <label className="channel-field">Protocolo<select disabled={disabled} value={source.protocol||'HLS'} onChange={e=>update(index,'protocol',e.target.value)}><option>HLS</option><option>HTTP</option><option>HTTPS</option><option>MPEG-TS</option><option>RTMP</option><option>RTSP</option><option>Otro</option></select></label>
        <label className="channel-field">Prioridad<input disabled={disabled} type="number" min="1" max="99" value={source.priority} onChange={e=>update(index,'priority',e.target.value)}/><small>{Number(source.priority)===1?'Fuente principal':'Fuente de respaldo'}</small></label>
        <label className="channel-field">Estado<select disabled={disabled} value={source.status} onChange={e=>update(index,'status',e.target.value)}><option>Activa</option><option>Inactiva</option></select></label>
      </div>
    </div>)}</div>
    <div className="source-examples"><strong><Link2 size={15}/> Ejemplos de URL</strong><span><b>HLS:</b> https://servidor/canal.m3u8</span><span><b>HTTP:</b> http://servidor/canal.ts</span><span><b>Astra:</b> http://IP_ASTRA:8000/canal</span></div>
  </div>;
}
