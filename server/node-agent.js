import http from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { timingSafeEqual } from 'node:crypto';
import {
  assertNodeFfmpeg,
  getNodeStream,
  listNodeStreams,
  nodeStreamRoot,
  restartNodeStream,
  restoreNodeStreams,
  safeStreamId,
  startNodeStream,
  stopAllNodeStreams,
  stopNodeStream
} from './node-stream-runtime.js';

const HOST=process.env.IPZTREAM_NODE_AGENT_HOST||'0.0.0.0';
const PORT=Number(process.env.IPZTREAM_NODE_AGENT_PORT||3200);
const NODE_ID=String(process.env.IPZTREAM_NODE_ID||'').trim();
const TOKEN=String(process.env.IPZTREAM_NODE_REGISTRATION_TOKEN||'');
const MAIN_URL=String(process.env.IPZTREAM_MAIN_URL||'').replace(/\/$/,'');
const SYNC_INTERVAL_MS=Math.max(5000,Number(process.env.IPZTREAM_NODE_SYNC_INTERVAL_MS||15000));
const STREAM_ROOT=nodeStreamRoot();

function send(res,status,payload,extra={}){
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','Access-Control-Allow-Origin':'*',...extra});
  res.end(JSON.stringify(payload));
}
async function readBody(req){
  let body='';
  for await(const chunk of req){
    body+=chunk;
    if(body.length>1024*512)throw Object.assign(new Error('Solicitud demasiado grande.'),{status:413});
  }
  if(!body)return{};
  try{return JSON.parse(body)}catch{throw Object.assign(new Error('JSON inválido.'),{status:400})}
}
function tokenEqual(received){
  const a=Buffer.from(String(received||'')),b=Buffer.from(TOKEN);
  return a.length===b.length&&a.length>0&&timingSafeEqual(a,b);
}
function requireToken(req){
  if(!TOKEN)throw Object.assign(new Error('Token del agente no configurado.'),{status:503});
  if(!tokenEqual(req.headers['x-ipztream-node-token']))throw Object.assign(new Error('Token de nodo inválido.'),{status:401});
}
function mediaType(file){
  if(file.endsWith('.m3u8'))return'application/vnd.apple.mpegurl';
  if(file.endsWith('.ts'))return'video/mp2t';
  return'application/octet-stream';
}
async function serveStreamMedia(req,res,pathname){
  const match=pathname.match(/^\/streams\/([^/]+)\/(index\.m3u8|segment_[0-9]+\.ts)$/);
  if(!match)return false;
  const id=safeStreamId(decodeURIComponent(match[1])),file=match[2];
  const root=path.resolve(STREAM_ROOT,id),target=path.resolve(root,file);
  if(!target.startsWith(root+path.sep))return send(res,403,{message:'Ruta no permitida.'});
  try{
    const info=await stat(target);
    res.writeHead(200,{'Content-Type':mediaType(file),'Content-Length':String(info.size),'Cache-Control':file.endsWith('.m3u8')?'no-cache, no-store':'public, max-age=15','Access-Control-Allow-Origin':'*'});
    return req.method==='HEAD'?res.end():createReadStream(target).pipe(res);
  }catch{return send(res,404,{message:'Segmento HLS no encontrado.'})}
}
async function handle(req,res){
  const url=new URL(req.url,`http://${req.headers.host||'localhost'}`),pathname=url.pathname;
  if(req.method==='OPTIONS'){
    res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS','Access-Control-Allow-Headers':'Content-Type,X-IPZStream-Node-Token'});
    return res.end();
  }
  if(pathname.startsWith('/streams/')){
    const served=await serveStreamMedia(req,res,pathname);
    if(served!==false)return;
  }
  if(pathname==='/health'&&req.method==='GET'){
    let ffmpeg='unavailable';
    try{ffmpeg=await assertNodeFfmpeg()}catch(error){ffmpeg=error.message}
    return send(res,200,{ok:true,nodeId:NODE_ID,role:'sub-agent',ffmpeg,streams:listNodeStreams().length});
  }

  if(!pathname.startsWith('/v1/'))return send(res,404,{message:'Ruta no encontrada.'});
  requireToken(req);

  if(pathname==='/v1/streams'&&req.method==='GET')return send(res,200,{streams:listNodeStreams()});
  const match=pathname.match(/^\/v1\/streams\/([^/]+)(?:\/(start|stop|restart|status))?$/);
  if(!match)return send(res,404,{message:'Ruta del agente no encontrada.'});
  const channelId=decodeURIComponent(match[1]),action=match[2]||'status';

  if(action==='status'&&req.method==='GET')return send(res,200,{stream:getNodeStream(channelId)});
  if(action==='stop'&&req.method==='POST')return send(res,200,{stream:await stopNodeStream(channelId)});
  if((action==='start'||action==='restart')&&req.method==='POST'){
    const body=await readBody(req),channel=body.channel;
    if(!channel||String(channel.id)!==String(channelId))return send(res,400,{message:'El payload debe incluir el canal solicitado.'});
    const stream=action==='start'?await startNodeStream(channel):await restartNodeStream(channel);
    return send(res,200,{stream});
  }
  return send(res,405,{message:'Método no permitido.'});
}

async function syncAssignments(){
  if(!MAIN_URL||!NODE_ID||!TOKEN)return{skipped:true};
  let response;
  try{
    response=await fetch(`${MAIN_URL}/api/stream-nodes/${encodeURIComponent(NODE_ID)}/assignments`,{
      headers:{'X-IPZStream-Node-Token':TOKEN},
      signal:AbortSignal.timeout(8000)
    });
  }catch(error){
    throw new Error(`No se pudo sincronizar con Main: ${error.message}`);
  }
  let payload={};
  try{payload=await response.json()}catch{}
  if(!response.ok)throw new Error(payload?.message||`Main respondió HTTP ${response.status}`);
  const assignments=Array.isArray(payload.assignments)?payload.assignments:[];
  const assignedIds=new Set(assignments.map(item=>String(item?.channel?.id||'')).filter(Boolean));
  for(const item of assignments){
    const channel=item?.channel,id=String(channel?.id||'');
    if(!id)continue;
    const current=getNodeStream(id);
    if(item.desiredState==='running'&&channel.status!=='Inactivo'){
      if(current.desiredState!=='running'||!['running','starting','recovering'].includes(current.status))await startNodeStream(channel);
    }else if(current.desiredState==='running'){
      await stopNodeStream(id);
    }
  }
  for(const current of listNodeStreams()){
    if(current.desiredState==='running'&&!assignedIds.has(String(current.channelId)))await stopNodeStream(current.channelId);
  }
  return{assignments:assignments.length};
}

if(!NODE_ID)console.warn('IPZTREAM_NODE_ID no configurado en agente.');
const restored=await restoreNodeStreams();
if(restored)console.log(`IPZStream Node Agent restauró ${restored} stream(s) deseados.`);
const server=http.createServer((req,res)=>handle(req,res).catch(error=>send(res,error.status||500,{message:error.message||'Error interno del agente.'})));
server.listen(PORT,HOST,()=>{
  console.log(`IPZStream Node Agent ${NODE_ID||'sin-id'} escuchando en http://${HOST}:${PORT}`);
  syncAssignments().catch(error=>console.error(error.message));
});
const syncTimer=setInterval(()=>syncAssignments().catch(error=>console.error(error.message)),SYNC_INTERVAL_MS);
syncTimer.unref?.();

async function shutdown(){
  clearInterval(syncTimer);
  server.close();
  await stopAllNodeStreams({preserveDesired:true}).catch(()=>{});
  process.exit(0);
}
process.once('SIGTERM',shutdown);
process.once('SIGINT',shutdown);
