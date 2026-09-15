import React from 'react';
import { Activity, LogOut, Search, SlidersHorizontal } from 'lucide-react';
import { closeConnection, getConnections } from './services/connectionsApi.js';
import './styles/connections.css';

export default function Connections(){
 const [items,setItems]=React.useState([]),[q,setQ]=React.useState(''),[status,setStatus]=React.useState('Todos'),[error,setError]=React.useState('');
 const load=React.useCallback(async()=>{try{setItems(await getConnections())}catch(e){setError(e.message)}},[]); React.useEffect(()=>{load()},[load]);
 const close=async id=>{if(!window.confirm('¿Cerrar esta conexión?'))return;try{await closeConnection(id);await load()}catch(e){setError(e.message)}};
 const filtered=items.filter(x=>[x.username,x.device,x.ip,x.content,x.node].join(' ').toLowerCase().includes(q.toLowerCase())&&(status==='Todos'||x.status===status));
 return <div className="module-page connections-page"><div className="module-head"><div className="module-title"><div className="module-icon"><Activity size={22}/></div><div><h1>Conexiones Activas</h1><p>Supervisa sesiones y consumo de los usuarios.</p></div></div><button className="secondary-button" onClick={load}>Actualizar sesiones</button></div>
 <div className="connection-summary"><div><span>Conexiones</span><strong>{items.length}</strong></div><div><span>Activas</span><strong>{items.filter(x=>x.status==='Activo').length}</strong></div><div><span>Cerradas</span><strong>{items.filter(x=>x.status!=='Activo').length}</strong></div></div>
 <div className="toolbar"><div className="module-search"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar usuario, IP, dispositivo..."/></div><button className="filter-button" onClick={()=>setStatus(status==='Todos'?'Activo':'Todos')}><SlidersHorizontal size={13}/>Estado: {status}<span>⌄</span></button></div>
 {error&&<div className="module-error">{error}</div>}
 <div className="card module-table"><div className="table-info"><span>{filtered.length} registros</span><span>Sesiones administrativas de prueba</span></div><div className="table-scroll"><table><thead><tr><th>Usuario</th><th>Dispositivo</th><th>IP</th><th>Canal / Contenido</th><th>Nodo</th><th>Inicio</th><th>Última actividad</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{filtered.map(x=><tr key={x.id}><td><strong>{x.username}</strong></td><td>{x.device}</td><td>{x.ip}</td><td>{x.content||'—'}</td><td>{x.node}</td><td>{x.startedAt}</td><td>{x.lastActivity}</td><td><span className={`status-badge ${x.status==='Activo'?'success':'warning'}`}>{x.status}</span></td><td>{x.status==='Activo'&&<button className="icon-button danger-icon" title="Cerrar conexión" onClick={()=>close(x.id)}><LogOut size={15}/></button>}</td></tr>)}</tbody></table></div></div></div>
}
