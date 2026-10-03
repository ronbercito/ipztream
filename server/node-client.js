import { isIP } from 'node:net';
import { getItem, getStreamNode, TABLES } from './db.js';

const TOKEN=String(process.env.IPZTREAM_NODE_REGISTRATION_TOKEN||'');
const TIMEOUT_MS=Math.max(2000,Number(process.env.IPZTREAM_NODE_COMMAND_TIMEOUT_MS||8000));

function hostForUrl(host){
  const value=String(host||'').trim();
  return isIP(value)===6?`[${value}]`:value;
}
function normalizeHost(value){return String(value||'').replace(/^\[|\]$/g,'').toLowerCase()}
export function validatedNodeApiBase(node){
  if(!node?.ip)throw Object.assign(new Error('El nodo no tiene IP/host configurado.'),{status:409});
  const raw=String(node.apiBaseUrl||`http://${hostForUrl(node.ip)}:3200`).trim();
  let url;
  try{url=new URL(raw)}catch{throw Object.assign(new Error('apiBaseUrl del nodo no es válido.'),{status:409})}
  if(!['http:','https:'].includes(url.protocol))throw Object.assign(new Error('El agente del nodo debe usar HTTP o HTTPS.'),{status:409});
  if(normalizeHost(url.hostname)!==normalizeHost(node.ip))throw Object.assign(new Error('apiBaseUrl no coincide con la IP/host registrado del nodo.'),{status:409});
  if(url.username||url.password)throw Object.assign(new Error('apiBaseUrl no debe incluir credenciales.'),{status:409});
  url.pathname='/';
  url.search='';
  url.hash='';
  return url.toString().replace(/\/$/,'');
}
async function request(node,path,{method='GET',body}={}){
  if(!TOKEN)throw Object.assign(new Error('Token de control de nodos no configurado en Main.'),{status:503});
  const base=validatedNodeApiBase(node);
  let response;
  try{
    response=await fetch(base+path,{
      method,
      headers:{'Content-Type':'application/json','X-IPZStream-Node-Token':TOKEN},
      body:body===undefined?undefined:JSON.stringify(body),
      signal:AbortSignal.timeout(TIMEOUT_MS)
    });
  }catch(error){
    throw Object.assign(new Error(`Nodo ${node.name||node.id} no responde: ${error.message}`),{status:502});
  }
  let payload={};
  try{payload=await response.json()}catch{}
  if(!response.ok)throw Object.assign(new Error(payload?.message||`Nodo remoto respondió HTTP ${response.status}.`),{status:response.status>=500?502:response.status});
  return payload;
}
export async function resolveChannelTarget(channelId,{allowOffline=false}={}){
  const channel=await getItem(TABLES.channels,String(channelId));
  if(!channel)throw Object.assign(new Error('Canal no encontrado.'),{status:404});
  const nodeId=String(channel.nodeId||'').trim();
  if(!nodeId)return{type:'local',channel,node:null};
  const node=await getStreamNode(nodeId);
  if(!node)throw Object.assign(new Error(`El nodo asignado ${nodeId} no existe.`),{status:409});
  if(node.role==='main')return{type:'local',channel,node};
  if(!['sub','edge'].includes(node.role))throw Object.assign(new Error('El nodo asignado no puede procesar streams.'),{status:409});
  if(node.status==='Fuera de línea'&&!allowOffline)throw Object.assign(new Error(`El nodo ${node.name} está fuera de línea.`),{status:409});
  return{type:'remote',channel,node};
}
function remotePath(id,action){return`/v1/streams/${encodeURIComponent(String(id))}/${action}`}
function absoluteHls(node,hlsUrl){
  if(!hlsUrl)return null;
  if(/^https?:\/\//i.test(hlsUrl))return hlsUrl;
  return validatedNodeApiBase(node)+('/'+String(hlsUrl).replace(/^\//,''));
}
function decorate(node,stream){
  return{...stream,nodeId:node.id,nodeName:node.name,execution:'remote',hlsUrl:absoluteHls(node,stream?.hlsUrl)};
}
export async function getRemoteStream(node,channelId){
  const payload=await request(node,remotePath(channelId,'status'));
  return decorate(node,payload.stream||{channelId,status:'stopped'});
}
export async function startRemoteStream(node,channel){
  const payload=await request(node,remotePath(channel.id,'start'),{method:'POST',body:{channel}});
  return decorate(node,payload.stream);
}
export async function stopRemoteStream(node,channelId){
  const payload=await request(node,remotePath(channelId,'stop'),{method:'POST',body:{}});
  return decorate(node,payload.stream);
}
export async function restartRemoteStream(node,channel){
  const payload=await request(node,remotePath(channel.id,'restart'),{method:'POST',body:{channel}});
  return decorate(node,payload.stream);
}
export async function clearRemoteStreamHistory(node,channelId){
  const payload=await request(node,remotePath(channelId,'history'),{method:'DELETE'});
  return decorate(node,payload.stream);
}
