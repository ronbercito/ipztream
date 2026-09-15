import React from 'react';
import { Activity, BarChart3, Database, Server, Smartphone, Users } from 'lucide-react';
import './styles/statistics.css';

async function getJson(url,key){const res=await fetch(url,{cache:'no-store'});if(!res.ok)throw new Error(`No se pudo consultar ${url}`);const data=await res.json();return key?data[key]||[]:data;}

export default function Statistics(){
  const [data,setData]=React.useState({users:0,connections:0,devices:0,nodes:0,channels:0,vod:0,series:0});
  const [loading,setLoading]=React.useState(true);
  const [error,setError]=React.useState('');
  const load=React.useCallback(async()=>{setLoading(true);setError('');try{const [users,connections,devices,nodes,channels,vod,series]=await Promise.all([getJson('/api/users','users').catch(()=>[]),getJson('/api/connections','connections'),getJson('/api/devices','devices'),getJson('/api/nodes','nodes'),getJson('/api/channels','channels'),getJson('/api/vod'),getJson('/api/series')]);setData({users:users.length,connections:connections.filter(x=>x.status==='Activo').length,devices:devices.length,nodes:nodes.filter(x=>x.status==='En línea').length,channels:channels.length,vod:vod.length,series:series.length});}catch(e){setError(e.message||'No se pudieron cargar las estadísticas.');}finally{setLoading(false);}},[]);
  React.useEffect(()=>{load();},[load]);
  const cards=[['Usuarios registrados',data.users,Users],['Conexiones activas',data.connections,Activity],['Dispositivos',data.devices,Smartphone],['Nodos en línea',data.nodes,Server],['Canales',data.channels,BarChart3],['VOD',data.vod,Database],['Series',data.series,BarChart3]];
  return <div className="statistics-page"><div className="module-head"><div className="module-title"><div className="module-icon"><BarChart3 size={22}/></div><div><h1>Estadísticas</h1><p>Indicadores administrativos derivados de los datos disponibles.</p></div></div><button className="secondary-button" onClick={load}>Actualizar</button></div>{error&&<div className="stats-error">{error}</div>}<div className="stats-grid">{cards.map(([title,value,Icon])=><div className="stat-card" key={title}><div className="stat-icon"><Icon size={19}/></div><span>{title}</span><strong>{loading?'—':value.toLocaleString('es-PE')}</strong></div>)}</div><div className="card stats-note"><h2>Estado de los datos</h2><p>Estas métricas son administrativas. En esta etapa no representan bitrate, tráfico real, horas de reproducción ni disponibilidad de streaming.</p><div className="stats-breakdown"><div><b>{data.channels}</b><span>Canales registrados</span></div><div><b>{data.vod+data.series}</b><span>Contenidos VOD / Series</span></div><div><b>{data.devices}</b><span>Dispositivos registrados</span></div></div></div></div>;
}
