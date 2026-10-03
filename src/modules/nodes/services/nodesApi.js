const API_BASE='/api/nodes';
const STREAM_NODE_BASE='/api/stream-nodes';
const LOCAL_KEY='ipztream-nodes-v1';

async function request(url,options={}){
  const response=await fetch(url,{headers:{'Content-Type':'application/json',...(options.headers||{})},...options});
  let payload=null;
  try{payload=await response.json();}catch{}
  if(!response.ok){
    const error=new Error(payload?.message||'No se pudo completar la operación.');
    error.status=response.status;
    throw error;
  }
  return payload;
}

export async function loadNodes(fallback=[]){
  try{
    const payload=await request(STREAM_NODE_BASE);
    if(Array.isArray(payload?.nodes))return payload.nodes;
  }catch{}
  try{
    const payload=await request(API_BASE);
    return Array.isArray(payload?.nodes)?payload.nodes:fallback;
  }catch{
    return fallback;
  }
}

export async function createNode(data){
  return request(STREAM_NODE_BASE,{method:'POST',body:JSON.stringify(data)});
}

export async function removeNode(id){
  return request(`${STREAM_NODE_BASE}/${encodeURIComponent(id)}`,{method:'DELETE'});
}

export async function loadNodeHeartbeats(id,limit=120){
  return request(`${STREAM_NODE_BASE}/${encodeURIComponent(id)}/heartbeats?limit=${encodeURIComponent(limit)}`);
}

export function loadLocalNodes(fallback){
  try{
    const raw=localStorage.getItem(LOCAL_KEY);
    if(!raw)return fallback;
    const parsed=JSON.parse(raw);
    return Array.isArray(parsed)?parsed:fallback;
  }catch{return fallback;}
}

export function saveLocalNodes(nodes){
  try{localStorage.setItem(LOCAL_KEY,JSON.stringify(nodes));}catch{}
}

export async function planNodeAssignments({channelIds=[],region='',includeAssigned=false}={}){
  const params=new URLSearchParams();
  if(channelIds.length)params.set('channelIds',channelIds.join(','));
  if(region)params.set('region',region);
  if(includeAssigned)params.set('includeAssigned','true');
  const query=params.toString();
  return request(`/api/node-scheduler/plan${query?`?${query}`:''}`);
}

export async function applyNodeAssignments(assignments){
  return request('/api/node-scheduler/apply',{method:'POST',body:JSON.stringify({assignments})});
}
