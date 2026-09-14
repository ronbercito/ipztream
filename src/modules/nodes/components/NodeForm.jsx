import React from 'react';
import { Save, X } from 'lucide-react';

const empty={name:'',ip:'',region:'',status:'En línea',cpu:'',ram:'',capacity:''};

export default function NodeForm({onCancel,onSave}){
 const [form,setForm]=React.useState(empty),[error,setError]=React.useState(''),[saving,setSaving]=React.useState(false);
 const set=(key,value)=>{setForm(f=>({...f,[key]:value}));if(error)setError('');};
 const submit=async e=>{
   e.preventDefault();
   setError('');
   if(!form.name.trim()||!form.ip.trim()||!form.region.trim()||!form.capacity.trim()){setError('Nombre, IP, región y capacidad son obligatorios.');return;}
   if(!/^((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)$/.test(form.ip.trim())){setError('Ingresa una dirección IPv4 válida.');return;}
   const cpu=form.cpu===''?null:Number(form.cpu),ram=form.ram===''?null:Number(form.ram);
   if((cpu!==null&&(Number.isNaN(cpu)||cpu<0||cpu>100))||(ram!==null&&(Number.isNaN(ram)||ram<0||ram>100))){setError('CPU y RAM deben estar entre 0 y 100.');return;}
   setSaving(true);
   try{
     const result=await onSave({
       ...form,
       name:form.name.trim(),
       ip:form.ip.trim(),
       region:form.region.trim(),
       capacity:form.capacity.trim(),
       cpu:cpu===null?null:Math.round(cpu),
       ram:ram===null?null:Math.round(ram)
     });
     if(result?.error){setError(result.error);return;}
   }catch(error){
     setError(error?.message||'No se pudo guardar el nodo.');
   }finally{
     setSaving(false);
   }
 };
 return <div className="modal-backdrop"><form className="modal" onSubmit={submit} noValidate><div className="modal-head"><div><h2>Agregar nodo</h2><p>Registra un servidor de streaming para el panel.</p></div><button type="button" className="icon-button" onClick={onCancel} disabled={saving}><X size={18}/></button></div>{error&&<div className="form-error" role="alert">{error}</div>}<div className="form-grid node-form-grid"><label>Nombre del nodo<input autoFocus value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Nodo 06 - Cusco" disabled={saving}/></label><label>Dirección IP<input value={form.ip} onChange={e=>set('ip',e.target.value)} placeholder="192.168.10.26" disabled={saving}/></label><label>Región<input value={form.region} onChange={e=>set('region',e.target.value)} placeholder="Cusco" disabled={saving}/></label><label>Estado<select value={form.status} onChange={e=>set('status',e.target.value)} disabled={saving}><option>En línea</option><option>Fuera de línea</option></select></label><label>CPU (%)<input type="number" min="0" max="100" value={form.cpu} onChange={e=>set('cpu',e.target.value)} placeholder="0 - 100" disabled={saving}/></label><label>RAM (%)<input type="number" min="0" max="100" value={form.ram} onChange={e=>set('ram',e.target.value)} placeholder="0 - 100" disabled={saving}/></label><label>Capacidad<input value={form.capacity} onChange={e=>set('capacity',e.target.value)} placeholder="10 Gbps" disabled={saving}/></label></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={onCancel} disabled={saving}>Cancelar</button><button type="submit" className="primary-button" disabled={saving}><Save size={15}/>{saving?'Guardando...':'Guardar'}</button></div></form></div>;
}
