import React from 'react';
import { Save, X } from 'lucide-react';

const empty={name:'',role:'sub',ip:'',apiBaseUrl:'',region:'',status:'Fuera de línea',cpu:'',ram:'',disk:'',capacity:'10 Gbps',capabilities:'live,hls,ffmpeg,remux,transcode'};
const hostOk=value=>/^((25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(25[0-5]|2[0-4]\d|1?\d?\d)$/.test(value)||/^[a-z0-9.-]+$/i.test(value);

export default function NodeForm({onCancel,onSave}){
 const [form,setForm]=React.useState(empty),[error,setError]=React.useState(''),[saving,setSaving]=React.useState(false);
 const set=(key,value)=>{setForm(f=>({...f,[key]:value}));if(error)setError('');};
 const submit=async e=>{
   e.preventDefault();
   setError('');
   if(!form.name.trim()||!form.ip.trim()||!form.region.trim()||!form.capacity.trim()){setError('Nombre, IP/host, región y capacidad son obligatorios.');return;}
   if(!hostOk(form.ip.trim())){setError('Ingresa una IP o hostname válido.');return;}
   const cpu=form.cpu===''?null:Number(form.cpu),ram=form.ram===''?null:Number(form.ram),disk=form.disk===''?null:Number(form.disk);
   if([cpu,ram,disk].some(v=>v!==null&&(Number.isNaN(v)||v<0||v>100))){setError('CPU, RAM y disco deben estar entre 0 y 100.');return;}
   setSaving(true);
   try{
     const result=await onSave({
       ...form,
       name:form.name.trim(),
       ip:form.ip.trim(),
       apiBaseUrl:form.apiBaseUrl.trim(),
       region:form.region.trim(),
       capacity:form.capacity.trim(),
       cpu:cpu===null?null:Math.round(cpu),
       ram:ram===null?null:Math.round(ram),
       disk:disk===null?null:Math.round(disk),
       capabilities:form.capabilities.split(',').map(x=>x.trim()).filter(Boolean)
     });
     if(result?.error){setError(result.error);return;}
   }catch(error){
     setError(error?.message||'No se pudo guardar el nodo.');
   }finally{
     setSaving(false);
   }
 };
 return <div className="modal-backdrop"><form className="modal nodes-modal" onSubmit={submit} noValidate><div className="modal-head"><div><h2>Agregar nodo</h2><p>Registra un servidor main/sub para IPZStream.</p></div><button type="button" className="icon-button" onClick={onCancel} disabled={saving}><X size={18}/></button></div>{error&&<div className="form-error" role="alert">{error}</div>}<div className="form-grid node-form-grid"><label>Nombre del nodo<input autoFocus value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Sub Nodo 02 - Trujillo" disabled={saving}/></label><label>Rol<select value={form.role} onChange={e=>set('role',e.target.value)} disabled={saving}><option value="sub">Sub / Streaming</option><option value="main">Main / Control</option><option value="edge">Edge / CDN</option></select></label><label>IP o hostname<input value={form.ip} onChange={e=>set('ip',e.target.value)} placeholder="192.168.10.26" disabled={saving}/></label><label>API base URL<input value={form.apiBaseUrl} onChange={e=>set('apiBaseUrl',e.target.value)} placeholder="http://192.168.10.26:3200" disabled={saving}/></label><label>Región<input value={form.region} onChange={e=>set('region',e.target.value)} placeholder="Trujillo" disabled={saving}/></label><label>Estado inicial<select value={form.status} onChange={e=>set('status',e.target.value)} disabled={saving}><option>Fuera de línea</option><option>Mantenimiento</option></select></label><label>CPU (%)<input type="number" min="0" max="100" value={form.cpu} onChange={e=>set('cpu',e.target.value)} placeholder="0 - 100" disabled={saving}/></label><label>RAM (%)<input type="number" min="0" max="100" value={form.ram} onChange={e=>set('ram',e.target.value)} placeholder="0 - 100" disabled={saving}/></label><label>Disco (%)<input type="number" min="0" max="100" value={form.disk} onChange={e=>set('disk',e.target.value)} placeholder="0 - 100" disabled={saving}/></label><label>Capacidad<input value={form.capacity} onChange={e=>set('capacity',e.target.value)} placeholder="10 Gbps" disabled={saving}/></label><label className="wide">Capacidades<input value={form.capabilities} onChange={e=>set('capabilities',e.target.value)} placeholder="live,hls,ffmpeg" disabled={saving}/></label></div><div className="modal-actions"><button type="button" className="secondary-button" onClick={onCancel} disabled={saving}>Cancelar</button><button type="submit" className="primary-button" disabled={saving}><Save size={15}/>{saving?'Guardando...':'Guardar'}</button></div></form></div>;
}