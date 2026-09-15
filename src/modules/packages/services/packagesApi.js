const api=async(path,options={})=>{const res=await fetch(path,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options});const data=await res.json().catch(()=>({}));if(!res.ok)throw new Error(data.message||'No se pudo completar la operación.');return data;};
export const getPackages=async()=>{const data=await api('/api/packages');return data.packages||[]};
export const createPackage=payload=>api('/api/packages',{method:'POST',body:JSON.stringify(payload)});
export const updatePackage=(id,payload)=>api(`/api/packages/${encodeURIComponent(id)}`,{method:'PUT',body:JSON.stringify(payload)});
export const deletePackage=id=>api(`/api/packages/${encodeURIComponent(id)}`,{method:'DELETE'});
