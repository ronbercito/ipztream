const api=async(path,options={})=>{const res=await fetch(path,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.message||'No se pudo completar la operación.');return data;};
export const getDevices=async()=>{const data=await api('/api/devices');return data.devices||[]};
export const unlinkDevice=id=>api(`/api/devices/${encodeURIComponent(id)}/unlink`,{method:'POST'});
