import React from 'react';
import { Plus, Search, Server, X, RefreshCw, Activity } from 'lucide-react';
import NodeFilters from './components/NodeFilters.jsx';
import NodeForm from './components/NodeForm.jsx';
import NodeTable from './components/NodeTable.jsx';
import { loadNodes, createNode, removeNode, loadLocalNodes, saveLocalNodes } from './services/nodesApi.js';
import './styles/nodes.css';

const initialNodes = [
  { id:'node-main', name:'Main - Control Central', role:'main', status:'En línea', ip:'127.0.0.1', apiBaseUrl:'http://127.0.0.1:3100', region:'Local', cpu:22, ram:41, disk:38, activeStreams:0, capacity:'Control', capabilities:['live','hls','ffmpeg'] },
  { id:'node-sub-01', name:'Sub Nodo 01 - Lima', role:'sub', status:'Fuera de línea', ip:'192.168.10.21', apiBaseUrl:'http://192.168.10.21:3100', region:'Lima', cpu:null, ram:null, disk:null, activeStreams:0, capacity:'10 Gbps', capabilities:['live','hls','ffmpeg'] }
];

function isOnline(node){return node.status==='En línea'}
function metricAvg(nodes,key){const values=nodes.map(n=>Number(n[key])).filter(Number.isFinite);return values.length?Math.round(values.reduce((a,b)=>a+b,0)/values.length):0}

export default function Nodes(){
  const [nodes,setNodes]=React.useState([]);
  const [query,setQuery]=React.useState('');
  const [filters,setFilters]=React.useState({status:'Todos',region:'Todas'});
  const [formOpen,setFormOpen]=React.useState(false);
  const [notice,setNotice]=React.useState('');
  const [loading,setLoading]=React.useState(true);

  const refresh=React.useCallback(async()=>{
    setLoading(true);
    const localFallback=loadLocalNodes(initialNodes);
    const result=await loadNodes(localFallback);
    setNodes(result);
    setLoading(false);
  },[]);

  React.useEffect(()=>{refresh();},[refresh]);

  const regions=[...new Set(nodes.map(n=>n.region).filter(Boolean))].sort();
  const filtered=nodes.filter(n=>{
    const text=`${n.name} ${n.ip} ${n.region} ${n.status} ${n.role} ${(n.capabilities||[]).join(' ')}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (filters.status==='Todos'||n.status===filters.status) && (filters.region==='Todas'||n.region===filters.region);
  });

  const addNode=async(data)=>{
    try{
      const created=await createNode(data);
      const node=created.node||created;
      const next=[node,...nodes];
      setNodes(next);
      saveLocalNodes(next);
      setFormOpen(false);
      setNotice('Nodo agregado correctamente. Para nodos remotos usa scripts/install-node.sh con el token de registro.');
      return true;
    }catch(error){
      if(error.status===409) return {error:error.message||'Ya existe un nodo con esa dirección IP.'};
      return {error:error.message||'No se pudo guardar el nodo. Verifica que la API esté disponible.'};
    }
  };

  const deleteNode=async(id)=>{
    try{
      await removeNode(id);
      const next=nodes.filter(n=>n.id!==id);
      setNodes(next);
      saveLocalNodes(next);
      setNotice('Nodo eliminado correctamente.');
    }catch(error){
      setNotice(error.message||'No se pudo eliminar el nodo.');
    }
  };

  const copyIp=(ip)=>navigator.clipboard?.writeText(ip).then(()=>setNotice(`IP ${ip} copiada.`)).catch(()=>setNotice('No se pudo copiar la IP.'));
  const online=nodes.filter(isOnline).length;

  return <div className="module-page nodes-page xui-nodes">
    <div className="module-head">
      <div className="module-title"><div className="module-icon"><Server size={22}/></div><div><h1>Servidores / Load Balancers</h1><p>Main/Sub IPZStream, estado, capacidades y heartbeat.</p></div></div>
      <div className="nodes-actions"><button className="secondary-button" onClick={refresh}><RefreshCw size={15}/>Actualizar</button><button className="primary-button" onClick={()=>setFormOpen(true)}><Plus size={16}/>Agregar nodo</button></div>
    </div>
    {notice&&<div className="nodes-notice"><span>{notice}</span><button className="icon-button" onClick={()=>setNotice('')}><X size={15}/></button></div>}
    <div className="node-summary">
      <div><span>Total de nodos</span><strong>{nodes.length}</strong><small>Main/Sub registrados</small></div>
      <div><span>En línea</span><strong>{online}</strong><small>{nodes.length-online} fuera de línea</small></div>
      <div><span>CPU promedio</span><strong>{metricAvg(nodes,'cpu')}%</strong><small>nodos reportando</small></div>
      <div><span>Streams activos</span><strong>{nodes.reduce((a,n)=>a+Number(n.activeStreams||0),0)}</strong><small>heartbeat actual</small></div>
    </div>
    <div className="nodes-hint"><Activity size={15}/><span>Los nodos remotos se registran con <b>IPZTREAM_NODE_REGISTRATION_TOKEN</b> y reportan heartbeat a <b>/api/stream-nodes/:id/heartbeat</b>.</span></div>
    <div className="toolbar"><div className="module-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar nodo, IP, rol, capacidad o región..."/></div><NodeFilters filters={filters} setFilters={setFilters} regions={regions}/></div>
    <div className="card module-table"><div className="table-info"><span>{loading?'Cargando...':`${filtered.length} registros`}</span><span>Fuente: API main/sub</span></div><NodeTable nodes={filtered} onDelete={deleteNode} onCopyIp={copyIp}/></div>
    {formOpen&&<NodeForm onCancel={()=>setFormOpen(false)} onSave={addNode}/>} 
  </div>;
}