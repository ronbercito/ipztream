import React from 'react';
import { Activity, LogOut, RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import { closeConnection, getConnections } from './services/connectionsApi.js';
import './styles/connections.css';

function formatDate(value){
  if(!value)return '—';
  const date=new Date(value);
  return Number.isNaN(date.getTime())?String(value):date.toLocaleString('es-PE',{dateStyle:'short',timeStyle:'medium'});
}
function formatDuration(seconds){
  const total=Math.max(0,Number(seconds||0));
  const h=Math.floor(total/3600),m=Math.floor((total%3600)/60),s=Math.floor(total%60);
  return h?(h+'h '+m+'m'):(m+'m '+s+'s');
}

export default function Connections(){
 const [items,setItems]=React.useState([]),[q,setQ]=React.useState(''),[status,setStatus]=React.useState('Todos'),[error,setError]=React.useState(''),[refreshing,setRefreshing]=React.useState(false);
 const load=React.useCallback(async(silent=false)=>{try{if(!silent)setRefreshing(true);setItems(await getConnections({includeClosed:true}));setError('')}catch(e){setError(e.message)}finally{if(!silent)setRefreshing(false)}},[]);
 React.useEffect(()=>{load();const timer=setInterval(()=>load(true),5000);return()=>clearInterval(timer)},[load]);
 const close=async id=>{if(!window.confirm('¿Cerrar esta conexión IPTV?'))return;try{await closeConnection(id);await load()}catch(e){setError(e.message)}};
 const filtered=items.filter(x=>[x.username,x.device,x.ip,x.content,x.node].join(' ').toLowerCase().includes(q.toLowerCase())&&(status==='Todos'||x.status===status));
 const active=items.filter(x=>x.status==='Activo').length;
 const closed=items.filter(x=>x.status!=='Activo').length;
 return <div className="module-page connections-page"><div className="module-head"><div className="module-title"><div className="module-icon"><Activity size={22}/></div><div><h1>Conexiones IPTV</h1><p>Sesiones reales de reproducción. Actualización automática cada 5 segundos.</p></div></div><button className="secondary-button" onClick={()=>load()} disabled={refreshing}><RefreshCw size={15}/>{refreshing?'Actualizando…':'Actualizar ahora'}</button></div>
 <div className="connection-summary"><div><span>Registradas</span><strong>{items.length}</strong></div><div><span>Activas</span><strong>{active}</strong></div><div><span>Cerradas</span><strong>{closed}</strong></div></div>
 <div className="toolbar"><div className="module-search"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar usuario, IP, app o canal..."/></div><button className="filter-button" onClick={()=>setStatus(status==='Todos'?'Activo':status==='Activo'?'Cerrada':'Todos')}><SlidersHorizontal size={13}/>Estado: {status}<span>⌄</span></button></div>
 {error&&<div className="module-error">{error}</div>}
 <div className="card module-table"><div className="table-info"><span>{filtered.length} registros</span><span>Sesiones reales · MariaDB</span></div><div className="table-scroll"><table><thead><tr><th>Usuario</th><th>App / dispositivo</th><th>IP</th><th>Canal</th><th>Nodo</th><th>Inicio</th><th>Duración</th><th>Última actividad</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{filtered.map(x=><tr key={x.id}><td><strong>{x.username}</strong></td><td title={x.device||''}>{(x.device||'App IPTV').slice(0,42)}</td><td>{x.ip||'—'}</td><td>{x.content||'—'}</td><td>{x.node||'MAIN'}</td><td>{formatDate(x.startedAt)}</td><td>{formatDuration(x.durationSeconds)}</td><td>{formatDate(x.lastActivity)}</td><td><span className={'status-badge '+(x.status==='Activo'?'success':'warning')}>{x.status}</span></td><td>{x.status==='Activo'&&<button className="icon-button danger-icon" title="Cerrar conexión" onClick={()=>close(x.id)}><LogOut size={15}/></button>}</td></tr>)}</tbody></table></div></div></div>
}