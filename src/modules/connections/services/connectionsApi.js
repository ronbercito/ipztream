const api=async(path,options={})=>{const res=await fetch(path,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.message||'No se pudo completar la operación.');return data;};
export const getConnections=async()=>{const data=await api('/api/connections');return data.connections||[]};
export const closeConnection=id=>api(`/api/connections/${encodeURIComponent(id)}/close`,{method:'POST'});
