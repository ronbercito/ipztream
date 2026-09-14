import React from 'react';
import { Save, X } from 'lucide-react';

const empty = { username:'', name:'', status:'Activo', package:'Básico', maxConnections:'1', expiresAt:'' };

export default function UserForm({ user, onSave, onClose }) {
  const [form,setForm] = React.useState(user || empty);
  const set=(key,value)=>setForm(current=>({...current,[key]:value}));
  const submit=e=>{e.preventDefault(); if(!form.username.trim() || !form.name.trim()) return; onSave({...form,maxConnections:Number(form.maxConnections)||1});};
  return <div className="modal-backdrop"><form className="modal user-modal" onSubmit={submit}>
    <div className="modal-head"><div><h2>{user?'Editar usuario':'Nuevo usuario'}</h2><p className="modal-subtitle">Datos básicos de acceso y servicio.</p></div><button type="button" className="icon-button" onClick={onClose}><X size={18}/></button></div>
    <div className="form-grid user-form-grid">
      <label>Usuario<input autoFocus value={form.username} onChange={e=>set('username',e.target.value)} placeholder="cliente01"/></label>
      <label>Nombre<input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Nombre del cliente"/></label>
      <label>Estado<select value={form.status} onChange={e=>set('status',e.target.value)}><option>Activo</option><option>Suspendido</option><option>Vencido</option></select></label>
      <label>Paquete<select value={form.package} onChange={e=>set('package',e.target.value)}><option>Básico</option><option>Premium</option><option>Familia</option></select></label>
      <label>Máximo de conexiones<input type="number" min="1" max="99" value={form.maxConnections} onChange={e=>set('maxConnections',e.target.value)}/></label>
      <label>Vencimiento<input type="date" value={form.expiresAtISO || ''} onChange={e=>set('expiresAtISO',e.target.value)}/></label>
    </div>
    <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button type="submit" className="primary-button"><Save size={15}/>Guardar</button></div>
  </form></div>;
}
