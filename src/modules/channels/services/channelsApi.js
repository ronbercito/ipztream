const API_BASE='/api/channels';
async function request(url,options={}){const response=await fetch(url,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options});let payload={};try{payload=await response.json();}catch{}if(!response.ok){const error=new Error(payload?.message||'No se pudo completar la operación.');error.status=response.status;throw error;}return payload;}
export async function loadChannels(){const payload=await request(API_BASE);return Array.isArray(payload?.channels)?payload.channels:[];}
export async function createChannel(data){return request(API_BASE,{method:'POST',body:JSON.stringify(data)});}
export async function updateChannel(id,data){return request(`${API_BASE}/${encodeURIComponent(id)}`,{method:'PUT',body:JSON.stringify(data)});}
export async function deleteChannel(id){return request(`${API_BASE}/${encodeURIComponent(id)}`,{method:'DELETE'});}
export async function probeChannelSource(source){const payload=await request('/api/source-probe',{method:'POST',body:JSON.stringify({url:source.url,originType:source.originType,protocol:source.protocol})});return payload.result;}
export async function loadStream(id){const payload=await request(`/api/streams/${encodeURIComponent(id)}`);return payload.stream;}
export async function startChannelStream(id){const payload=await request(`/api/streams/${encodeURIComponent(id)}/start`,{method:'POST'});return payload.stream;}
export async function stopChannelStream(id){const payload=await request(`/api/streams/${encodeURIComponent(id)}/stop`,{method:'POST'});return payload.stream;}
