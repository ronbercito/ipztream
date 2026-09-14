const API_BASE='/api/channels';

async function request(url,options={}){
  const response=await fetch(url,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
  let payload={};
  try{payload=await response.json();}catch{}
  if(!response.ok){const error=new Error(payload?.message||'No se pudo completar la operación.');error.status=response.status;throw error;}
  return payload;
}

export async function loadChannels(fallback=[]){
  const payload=await request(API_BASE);
  return Array.isArray(payload?.channels)?payload.channels:fallback;
}

export async function createChannel(data){return request(API_BASE,{method:'POST',body:JSON.stringify(data)});}
export async function updateChannel(id,data){return request(`${API_BASE}/${encodeURIComponent(id)}`,{method:'PUT',body:JSON.stringify(data)});}
export async function deleteChannel(id){return request(`${API_BASE}/${encodeURIComponent(id)}`,{method:'DELETE'});}
