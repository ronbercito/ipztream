import React from 'react';
import { MoreVertical, Trash2, Copy } from 'lucide-react';

const badge=v=>/en línea/i.test(v)?'success':/fuera/i.test(v)?'danger':'';
export default function NodeTable({nodes,onDelete,onCopyIp}){
 return <div className="table-scroll"><table><thead><tr><th>Nodo</th><th>Estado</th><th>IP</th><th>Región</th><th>CPU</th><th>RAM</th><th>Capacidad</th><th>Acciones</th></tr></thead><tbody>{nodes.length?nodes.map(n=><tr key={n.id}><td><strong>{n.name}</strong></td><td><span className={`status-badge ${badge(n.status)}`}>{n.status}</span></td><td><span className="node-ip">{n.ip}<button className="copy-user" title="Copiar IP" onClick={()=>onCopyIp(n.ip)}><Copy size={13}/></button></span></td><td>{n.region}</td><td>{n.cpu===null?'—':`${n.cpu}%`}</td><td>{n.ram===null?'—':`${n.ram}%`}</td><td>{n.capacity}</td><td><div className="user-actions"><button className="icon-button danger-icon" title="Eliminar" onClick={()=>onDelete(n.id)}><Trash2 size={15}/></button><button className="icon-button"><MoreVertical size={16}/></button></div></td></tr>):<tr><td colSpan="8" className="empty-cell">No se encontraron nodos.</td></tr>}</tbody></table></div>;
}
