import React from 'react';
import { Link2Off, Search, SlidersHorizontal } from 'lucide-react';
import { getDevices, unlinkDevice } from './services/devicesApi.js';
import './styles/devices.css';

export default function Devices(){
 const [items,setItems]=React.useState([]),[q,setQ]=React.useState(''),[status,setStatus]=React.useState('Todos'),[error,setError]=React.useState('');
 const load=React.useCallback(async()=>{try{setItems(await getDevices())}catch(e){setError(e.message)}},[]); React.useEffect(()=>{load()},[load]);
 const unlink=async id=>{if(!window.confirm('¿Desvincular este dispositivo del usuario?'))return;try{await unlinkDevice(id);await load()}catch(e){setError(e.message)}};
 const filtered=items.filter(x=>[x.name,x.username,x.type,x.ip,x.node].join(' ').toLowerCase().includes(q.toLowerCase())&&(status==='Todos'||x.status===status));
 return <div className="module-page devices-page"><div className="module-head"><div className="module-title"><div className="module-icon"><Link2Off size={22}/></div><div><h1>Dispositivos</h1><p>Controla equipos autorizados y sus asociaciones.</p></div></div><button className="secondary-button" onClick={load}>Actualizar dispositivos</button></div>
 <div className="device-summary"><div><span>Dispositivos</span><strong>{items.length}</strong></div><div><span>Activos</span><strong>{items.filter(x=>x.status==='Activo').length}</strong></div><div><span>Tipos</span><strong>{new Set(items.map(x=>x.type)).size}</strong></div></div>
 <div className="toolbar"><div className="module-search"><Search size={16}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar dispositivo, usuario, IP..."/></div><button className="filter-button" onClick={()=>setStatus(status==='Todos'?'Activo':'Todos')}><SlidersHorizontal size={13}/>Estado: {status}<span>⌄</span></button></div>
 {error&&<div className="module-error">{error}</div>}
 <div className="card module-table"><div className="table-info"><span>{filtered.length} registros</span><span>Inventario administrativo de prueba</span></div><div className="table-scroll"><table><thead><tr><th>Dispositivo</th><th>Usuario</th><th>Tipo</th><th>IP</th><th>Nodo</th><th>Última actividad</th><th>Estado</th><th>Acción</th></tr></thead><tbody>{filtered.map(x=><tr key={x.id}><td><strong>{x.name}</strong><div className="muted">{x.identifier}</div></td><td>{x.username||'Sin asociar'}</td><td>{x.type}</td><td>{x.ip||'—'}</td><td>{x.node||'—'}</td><td>{x.lastActivity||'—'}</td><td><span className={`status-badge ${x.status==='Activo'?'success':'warning'}`}>{x.status}</span></td><td>{x.username&&<button className="icon-button danger-icon" title="Desvincular" onClick={()=>unlink(x.id)}><Link2Off size={15}/></button>}</td></tr>)}</tbody></table></div></div></div>
}
