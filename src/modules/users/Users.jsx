import React from 'react';
import { Plus, Users } from 'lucide-react';
import UserFilters from './components/UserFilters';
import UserTable from './components/UserTable';
import UserForm from './components/UserForm';
import './styles/users.css';

const initialUsers=[
  {id:1,username:'cliente01',name:'Cliente 01',status:'Activo',package:'Premium',activeConnections:2,maxConnections:3,expiresAt:'30/10/2026'},
  {id:2,username:'cliente02',name:'Cliente 02',status:'Activo',package:'Básico',activeConnections:1,maxConnections:1,expiresAt:'15/11/2026'},
  {id:3,username:'cliente03',name:'Cliente 03',status:'Suspendido',package:'Premium',activeConnections:0,maxConnections:3,expiresAt:'02/09/2026'},
  {id:4,username:'cliente04',name:'Cliente 04',status:'Activo',package:'Familia',activeConnections:3,maxConnections:5,expiresAt:'12/12/2026'}
];

export default function UsersPage(){
  const [users,setUsers]=React.useState(initialUsers);
  const [query,setQuery]=React.useState('');
  const [status,setStatus]=React.useState('Todos');
  const [packageFilter,setPackageFilter]=React.useState('Todos');
  const [editing,setEditing]=React.useState(null);
  const [confirming,setConfirming]=React.useState(null);
  const filtered=users.filter(user=>{
    const text=[user.username,user.name,user.package,user.status].join(' ').toLowerCase();
    return text.includes(query.toLowerCase()) && (status==='Todos'||user.status===status) && (packageFilter==='Todos'||user.package===packageFilter);
  });
  const save=user=>{
    const normalized={...user,id:user.id||Date.now(),activeConnections:user.activeConnections||0,expiresAt:user.expiresAtISO?new Date(user.expiresAtISO+'T00:00:00').toLocaleDateString('es-PE'):user.expiresAt||'—'};
    setUsers(current=>user.id?current.map(item=>item.id===user.id?normalized:item):[normalized,...current]);
    setEditing(null);
  };
  const remove=()=>{if(confirming)setUsers(current=>current.filter(user=>user.id!==confirming.id));setConfirming(null)};
  return <div className="module-page">
    <div className="module-head"><div className="module-title"><div className="module-icon"><Users size={22}/></div><div><h1>Usuarios</h1><p>Gestiona clientes, cuentas, paquetes, conexiones y vencimientos.</p></div></div><button className="primary-button" onClick={()=>setEditing({})}><Plus size={16}/>Nuevo usuario</button></div>
    <UserFilters query={query} setQuery={setQuery} status={status} setStatus={setStatus} packageFilter={packageFilter} setPackageFilter={setPackageFilter}/>
    <UserTable users={filtered} onEdit={setEditing} onDelete={setConfirming}/>
    {editing!==null&&<UserForm user={editing.id?editing:null} onSave={save} onClose={()=>setEditing(null)}/>} 
    {confirming&&<div className="modal-backdrop"><div className="modal"><div className="modal-head"><h2>Eliminar usuario</h2></div><p>¿Seguro que deseas eliminar <strong>{confirming.username}</strong>? Esta acción solo afecta los datos de demostración por ahora.</p><div className="modal-actions"><button className="secondary-button" onClick={()=>setConfirming(null)}>Cancelar</button><button className="primary-button danger-button" onClick={remove}>Eliminar</button></div></div></div>}
  </div>;
}
