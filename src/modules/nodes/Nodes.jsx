import React from 'react';
import { Plus, Search, Server, X } from 'lucide-react';
import NodeFilters from './components/NodeFilters.jsx';
import NodeForm from './components/NodeForm.jsx';
import NodeTable from './components/NodeTable.jsx';
import { loadNodes, createNode, removeNode, loadLocalNodes, saveLocalNodes } from './services/nodesApi.js';
import './styles/nodes.css';

const initialNodes = [
  { id:'node-01', name:'Nodo 01 - Lima', status:'En línea', ip:'192.168.10.21', region:'Lima', cpu:22, ram:41, capacity:'10 Gbps' },
  { id:'node-02', name:'Nodo 02 - Arequipa', status:'En línea', ip:'192.168.10.22', region:'Arequipa', cpu:18, ram:36, capacity:'10 Gbps' },
  { id:'node-03', name:'Nodo 03 - Trujillo', status:'En línea', ip:'192.168.10.23', region:'Trujillo', cpu:27, ram:48, capacity:'5 Gbps' },
  { id:'node-05', name:'Nodo 05 - Piura', status:'Fuera de línea', ip:'192.168.10.25', region:'Piura', cpu:null, ram:null, capacity:'5 Gbps' }
];

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

  const regions=[...new Set(nodes.map(n=>n.region))].sort();
  const filtered=nodes.filter(n=>{
    const text=`${n.name} ${n.ip} ${n.region} ${n.status}`.toLowerCase();
    return text.includes(query.toLowerCase()) && (filters.status==='Todos'||n.status===filters.status) && (filters.region==='Todas'||n.region===filters.region);
  });

  const addNode=async(data)=>{
    try{
      const created=await createNode(data);
      setNodes(prev=>[created,...prev]);
      saveLocalNodes([created,...nodes]);
      setFormOpen(false);
      setNotice('Nodo agregado correctamente. El cambio ya está disponible para los demás navegadores.');
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

  return <div className="module-page nodes-page">
    <div className="module-head">
      <div className="module-title"><div className="module-icon"><Server size={22}/></div><div><h1>Servidores / Nodos</h1><p>Administra servidores de streaming, estado y capacidad.</p></div></div>
      <button className="primary-button" onClick={()=>setFormOpen(true)}><Plus size={16}/>Agregar nodo</button>
    </div>
    {notice&&<div className="nodes-notice"><span>{notice}</span><button className="icon-button" onClick={()=>setNotice('')}><X size={15}/></button></div>}
    <div className="node-summary">
      <div><span>Total de nodos</span><strong>{nodes.length}</strong></div>
      <div><span>En línea</span><strong>{nodes.filter(n=>n.status==='En línea').length}</strong></div>
      <div><span>Fuera de línea</span><strong>{nodes.filter(n=>n.status==='Fuera de línea').length}</strong></div>
      <div><span>Capacidad total</span><strong>{nodes.reduce((a,n)=>a+(parseFloat(n.capacity)||0),0)} Gbps</strong></div>
    </div>
    <div className="toolbar"><div className="module-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar nodo, IP o región..."/></div><NodeFilters filters={filters} setFilters={setFilters} regions={regions}/></div>
    <div className="card module-table"><div className="table-info"><span>{loading?'Cargando...':`${filtered.length} registros`}</span><span>Fuente compartida por API</span></div><NodeTable nodes={filtered} onDelete={deleteNode} onCopyIp={copyIp}/></div>
    {formOpen&&<NodeForm onCancel={()=>setFormOpen(false)} onSave={addNode}/>} 
  </div>;
}
