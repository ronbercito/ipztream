import React from 'react';
import { Save, X, Radio, Hash, Folder, CircleCheck, Image as ImageIcon } from 'lucide-react';
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
  return <div className="modal-backdrop"><form className="modal channel-modal channel-modal-v2" onSubmit={submit}>
    <div className="channel-modal-head"><div className="channel-modal-title"><div className="channel-title-icon"><Radio size={22}/></div><div><h2>{initial?'Editar canal':'Agregar canal'}</h2><p>Define la información del canal y sus fuentes de transmisión.</p></div></div><button type="button" className="icon-button" onClick={onCancel} disabled={saving}><X size={19}/></button></div>
    {(error||externalError)&&<div className="form-error channel-form-error" role="alert">{error||externalError}</div>}
    <div className="channel-editor-grid">
      <section className="channel-editor-panel channel-info-panel">
        <div className="channel-section-title"><span>1</span><div><h3>Información del canal</h3><p>Datos básicos y apariencia.</p></div></div>
        <label className="channel-field channel-name-field">Nombre del canal <b>*</b><div className="input-with-icon"><Radio size={16}/><input autoFocus value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Nombre del canal" disabled={saving}/></div></label>
        <div className="channel-three-fields">
          <label className="channel-field">Número<div className="input-with-icon"><Hash size={16}/><input type="number" min="1" max="99999" value={form.number} onChange={e=>set('number',e.target.value)} disabled={saving}/></div></label>
          <label className="channel-field">Categoría<div className="input-with-icon"><Folder size={16}/><input list="channel-categories" value={form.category} onChange={e=>set('category',e.target.value)} placeholder="Deportes" disabled={saving}/></div><datalist id="channel-categories">{categories.map(item=><option key={item} value={item}/>)}</datalist></label>
          <label className="channel-field">Estado<div className="input-with-icon"><CircleCheck size={16}/><select value={form.status} onChange={e=>set('status',e.target.value)} disabled={saving}><option>Activo</option><option>Inactivo</option></select></div></label>
        </div>
        <div className="channel-logo-block"><div><h4><ImageIcon size={16}/> Logo del canal</h4><p>Pega una URL de imagen. Si no colocas una, mostraremos la inicial del canal.</p></div><label className="channel-field">URL del logo<input value={form.logo} onChange={e=>set('logo',e.target.value)} placeholder="https://servidor/logo.png" disabled={saving}/></label><div className="channel-logo-preview">{form.logo?<img src={form.logo} alt="Vista previa"/>:<><ImageIcon size={32}/><span>Sin logo</span></>}</div></div>
      </section>
      <section className="channel-editor-panel channel-source-panel"><SourceEditor sources={form.sources} onChange={sources=>set('sources',sources)} disabled={saving}/></section>
    </div>
    <div className="channel-modal-footer"><div className="channel-help"><strong>Fuentes compatibles</strong><span>HTTP/HLS directo · Astra Cesbo por HTTP · M3U/M3U8 para importación.</span></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={onCancel} disabled={saving}>Cancelar</button><button type="submit" className="primary-button" disabled={saving}><Save size={15}/>{saving?'Guardando...':'Guardar canal'}</button></div></div>
  </form></div>;
}
