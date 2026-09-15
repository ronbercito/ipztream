import React from 'react';
import { FileText, Search, SlidersHorizontal, RefreshCw, ShieldCheck } from 'lucide-react';
import './styles/logs.css';

const seedLogs=[
  {id:'log-1',timestamp:'2026-09-14T14:32:10',level:'INFO',module:'Usuarios',event:'Inicio de sesión administrativo',user:'admin',detail:'Acceso al panel de administración.'},
  {id:'log-2',timestamp:'2026-09-14T14:30:42',level:'INFO',module:'Nodos',event:'Heartbeat recibido de Nodo 03',user:'system',detail:'Nodo reportó estado operativo.'},
  {id:'log-3',timestamp:'2026-09-14T14:15:31',level:'ERROR',module:'Nodos',event:'Nodo 05 no responde',user:'system',detail:'No se recibió respuesta durante la ventana de comprobación.'},
  {id:'log-4',timestamp:'2026-09-14T14:10:08',level:'AUDIT',module:'Paquetes',event:'Paquete actualizado',user:'admin',detail:'Se modificó la configuración del paquete Premium.'}
];

function loadLogs(){try{const saved=JSON.parse(localStorage.getItem('ipztream.logs')||'null');return Array.isArray(saved)&&saved.length?saved:seedLogs;}catch{return seedLogs;}}
function formatDate(value){return new Date(value).toLocaleString('es-PE',{dateStyle:'short',timeStyle:'medium'});}
function levelClass(level){return level==='ERROR'?'danger':level==='WARN'?'warning':level==='AUDIT'?'audit':'success';}

export default function Logs(){
  const [logs,setLogs]=React.useState(loadLogs);
  const [query,setQuery]=React.useState('');
  const [level,setLevel]=React.useState('Todos');
  const [module,setModule]=React.useState('Todos');
  const [refresh,setRefresh]=React.useState(false);
  React.useEffect(()=>{localStorage.setItem('ipztream.logs',JSON.stringify(logs));},[logs]);
  const modules=['Todos',...Array.from(new Set(logs.map(item=>item.module)))];
  const data=logs.filter(item=>{
    const text=[item.event,item.user,item.module,item.detail].join(' ').toLowerCase();
    return text.includes(query.toLowerCase())&&(level==='Todos'||item.level===level)&&(module==='Todos'||item.module===module);
  });
  const reload=()=>{setRefresh(true);setTimeout(()=>{setLogs(loadLogs());setRefresh(false);},350)};
  return <div className="logs-page">
    <div className="module-head"><div className="module-title"><div className="module-icon"><FileText size={22}/></div><div><h1>Logs / Auditoría</h1><p>Consulta eventos del sistema y acciones administrativas.</p></div></div><button className="secondary-button" onClick={reload} disabled={refresh}><RefreshCw size={15}/>{refresh?'Actualizando...':'Actualizar'}</button></div>
    <div className="logs-summary"><div><ShieldCheck size={18}/><span>Registros administrativos</span><strong>{logs.length}</strong></div><div><span>Errores</span><strong>{logs.filter(x=>x.level==='ERROR').length}</strong></div><div><span>Auditorías</span><strong>{logs.filter(x=>x.level==='AUDIT').length}</strong></div></div>
    <div className="toolbar"><div className="module-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar evento, usuario o detalle..."/></div><div className="filters"><select value={level} onChange={e=>setLevel(e.target.value)}><option>Todos</option><option>INFO</option><option>WARN</option><option>ERROR</option><option>AUDIT</option></select><select value={module} onChange={e=>setModule(e.target.value)}>{modules.map(item=><option key={item}>{item}</option>)}</select><SlidersHorizontal size={15}/></div></div>
    <div className="card module-table"><div className="table-info"><span>{data.length} registros</span><span>Auditoría administrativa inicial</span></div><div className="table-scroll"><table><thead><tr><th>Fecha / Hora</th><th>Nivel</th><th>Módulo</th><th>Evento</th><th>Usuario</th><th>Detalle</th></tr></thead><tbody>{data.map(item=><tr key={item.id}><td>{formatDate(item.timestamp)}</td><td><span className={`status-badge ${levelClass(item.level)}`}>{item.level}</span></td><td>{item.module}</td><td><strong>{item.event}</strong></td><td>{item.user}</td><td>{item.detail}</td></tr>)}</tbody></table></div></div>
  </div>;
}
