import React from 'react';
import { Save, X } from 'lucide-react';
import SourceEditor from './SourceEditor.jsx';

const empty={number:'',name:'',category:'',status:'Activo',logo:'',sources:[]};

export default function ChannelForm({initial,categories,saving,externalError,onSave,onCancel}){
  const [form,setForm]=React.useState({...empty,...initial,sources:(initial?.sources||[]).map(source=>({...source}))});
  const [error,setError]=React.useState('');
  const set=(key,value)=>setForm(prev=>({...prev,[key]:value}));
  const submit=async event=>{
    event.preventDefault();setError('');
    const number=Number(form.number);
    if(!Number.isInteger(number)||number<1||number>99999){setError('El número de canal debe ser un entero entre 1 y 99999.');return;}
    if(!form.name.trim()){setError('El nombre del canal es obligatorio.');return;}
    if(!form.category.trim()){setError('La categoría es obligatoria.');return;}
    if(!form.sources.length){setError('Agrega al menos una fuente.');return;}
    if(form.sources.some(source=>!source.url.trim())){setError('Todas las fuentes deben tener una URL.');return;}
    const priorities=form.sources.map(source=>Number(source.priority));
    if(priorities.some(value=>!Number.isInteger(value)||value<1||value>99)){setError('La prioridad de cada fuente debe estar entre 1 y 99.');return;}
    const result=await onSave({...form,number,name:form.name.trim(),category:form.category.trim(),logo:form.logo.trim(),sources:form.sources.map(source=>({...source,url:source.url.trim()}))});
    if(!result)setError('No se pudo guardar. Revisa el mensaje y los datos del formulario.');
  };
  return <div className="modal-backdrop"><form className="modal channel-modal" onSubmit={submit}>
    <div className="modal-head"><div><h2>{initial?'Editar canal':'Nuevo canal'}</h2><p>Define la identidad y las fuentes del canal.</p></div><button type="button" className="icon-button" onClick={onCancel} disabled={saving}><X size={18}/></button></div>
    {(error||externalError)&&<div className="form-error" role="alert">{error||externalError}</div>}
    <div className="form-grid channel-main-form">
      <label>Número<input type="number" min="1" max="99999" value={form.number} onChange={e=>set('number',e.target.value)} disabled={saving}/></label>
      <label>Nombre<input autoFocus value={form.name} onChange={e=>set('name',e.target.value)} placeholder="ESPN" disabled={saving}/></label>
      <label>Categoría<input list="channel-categories" value={form.category} onChange={e=>set('category',e.target.value)} placeholder="Deportes" disabled={saving}/><datalist id="channel-categories">{categories.map(item=><option key={item} value={item}/>)}</datalist></label>
      <label>Estado<select value={form.status} onChange={e=>set('status',e.target.value)} disabled={saving}><option>Activo</option><option>Inactivo</option></select></label>
      <label className="full-field">Logo URL<input value={form.logo} onChange={e=>set('logo',e.target.value)} placeholder="https://.../logo.png" disabled={saving}/></label>
    </div>
    <SourceEditor sources={form.sources} onChange={sources=>set('sources',sources)} disabled={saving}/>
    <div className="modal-actions"><button type="button" className="secondary-button" onClick={onCancel} disabled={saving}>Cancelar</button><button type="submit" className="primary-button" disabled={saving}><Save size={15}/>{saving?'Guardando...':'Guardar canal'}</button></div>
  </form></div>;
}
