import { spawn } from 'node:child_process';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const FFMPEG_BIN=process.env.IPZTREAM_FFMPEG_BIN||'ffmpeg';
const STREAM_ROOT=path.resolve(process.env.IPZTREAM_NODE_STREAM_ROOT||'/var/lib/ipztream-node/streams');
const STATE_FILE=path.resolve(process.env.IPZTREAM_NODE_STATE_FILE||'/var/lib/ipztream-node/desired-streams.json');
const HLS_TIME=Math.max(2,Number(process.env.IPZTREAM_HLS_TIME||4));
const HLS_LIST_SIZE=Math.max(3,Number(process.env.IPZTREAM_HLS_LIST_SIZE||6));
const RETRY_MS=Math.max(3000,Number(process.env.IPZTREAM_STREAM_RETRY_MS||10000));
const processes=new Map();
const desired=new Map();
const counters=new Map();
const retryTimers=new Map();
const sourceOffsets=new Map();
let shuttingDown=false;

export function safeStreamId(value){return String(value||'').replace(/[^a-zA-Z0-9_-]/g,'_').slice(0,120)}
function protocol(value){try{return new URL(String(value)).protocol.toLowerCase()}catch{return''}}
function validSource(value){return['http:','https:','rtmp:','rtmps:','rtsp:'].includes(protocol(value))}
function availableSources(channel){return[...(Array.isArray(channel?.sources)?channel.sources:[])].filter(s=>s?.status!=='Inactiva'&&validSource(s?.url)).sort((a,b)=>Number(a.priority||999)-Number(b.priority||999))}
function chooseSource(channel,id){const list=availableSources(channel);if(!list.length)return null;const offset=Math.max(0,Number(sourceOffsets.get(String(id))||0))%list.length;return list[offset]}
function advanceSource(channel,id){const list=availableSources(channel);if(list.length>1)sourceOffsets.set(String(id),(Number(sourceOffsets.get(String(id))||0)+1)%list.length)}
function inputArgs(url){return['http:','https:'].includes(protocol(url))?['-reconnect','1','-reconnect_streamed','1','-reconnect_delay_max','5']:[]}
function ffmpegArgs(channel,url,dir){
  const common=['-hide_banner','-nostdin','-loglevel','warning','-fflags','+genpts+discardcorrupt',...inputArgs(url),'-i',url,'-map','0:v:0','-map','0:a:0?'];
  const codec=channel?.streamProfile==='transcode-h264-aac'
    ?['-c:v','libx264','-preset','veryfast','-tune','zerolatency','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-ac','2','-ar','48000']
    :['-c:v','copy','-c:a','copy','-copyts','-start_at_zero'];
  return[...common,...codec,'-avoid_negative_ts','make_zero','-max_interleave_delta','0','-f','hls','-hls_segment_type','mpegts','-hls_time',String(HLS_TIME),'-hls_list_size',String(HLS_LIST_SIZE),'-hls_flags','delete_segments+independent_segments+temp_file+program_date_time','-hls_segment_filename',path.join(dir,'segment_%06d.ts'),path.join(dir,'index.m3u8')];
}
function state(id,entry){
  const stats=counter(id);
  return{
    channelId:id,
    nodeRuntime:true,
    status:entry?.status||'stopped',
    pid:entry?.process?.pid||null,
    startedAt:entry?.startedAt||null,
    stoppedAt:entry?.stoppedAt||null,
    error:entry?.error||null,
    exitCode:entry?.exitCode??null,
    signal:entry?.signal||null,
    retrying:retryTimers.has(id),
    desiredState:desired.has(id)?'running':'stopped',
    profile:entry?.profile||desired.get(id)?.streamProfile||'remux-copy',
    hlsUrl:['running','starting','recovering'].includes(entry?.status)?`/streams/${safeStreamId(id)}/index.m3u8`:null,
    startCount:stats.startCount,
    restartCount:stats.restartCount,
    history:stats.history.slice(-50).reverse(),
    logs:(entry?.logs||[]).slice(-30)
  };
}
function counter(id){
  if(!counters.has(id))counters.set(id,{startCount:0,restartCount:0,history:[]});
  return counters.get(id);
}
export function clearNodeStreamHistory(channelId){
  const id=String(channelId),item=counter(id);
  item.startCount=0;item.restartCount=0;item.history=[];
  return getNodeStream(id);
}
function addLog(entry,value){const lines=String(value||'').split(/\r?\n/).map(x=>x.trim()).filter(Boolean);entry.logs.push(...lines);if(entry.logs.length>150)entry.logs.splice(0,entry.logs.length-150)}
async function persistDesired(){
  await mkdir(path.dirname(STATE_FILE),{recursive:true,mode:0o750});
  await writeFile(STATE_FILE,JSON.stringify([...desired.values()],null,2),{mode:0o640});
}
function cancelRetry(id){const timer=retryTimers.get(id);if(timer)clearTimeout(timer);retryTimers.delete(id)}
function scheduleRetry(id){
  if(shuttingDown||!desired.has(id)||retryTimers.has(id))return;
  const current=processes.get(id);
  if(current){current.status='recovering';current.error=current.error||`Sin señal. Reintentando en ${Math.round(RETRY_MS/1000)}s.`}
  const timer=setTimeout(async()=>{retryTimers.delete(id);const channel=desired.get(id);if(!channel||shuttingDown)return;try{await startNodeStream(channel,{restart:true,persist:false,automatic:true})}catch(error){const item=processes.get(id);if(item){item.status='recovering';item.error=error.message}scheduleRetry(id)}},RETRY_MS);
  timer.unref?.();
  retryTimers.set(id,timer);
}
async function terminate(entry){
  if(!entry?.process||entry.process.killed)return;
  entry.status='stopping';
  await new Promise(resolve=>{
    const timer=setTimeout(()=>{try{entry.process?.kill('SIGKILL')}catch{}resolve()},5000);
    entry.process.once('exit',()=>{clearTimeout(timer);resolve()});
    entry.process.kill('SIGTERM');
  });
}
export async function ensureNodeStreamRoot(){await mkdir(STREAM_ROOT,{recursive:true,mode:0o750})}
export function nodeStreamRoot(){return STREAM_ROOT}
export function getNodeStream(channelId){const id=String(channelId);return state(id,processes.get(id))}
export function listNodeStreams(){const ids=new Set([...desired.keys(),...processes.keys()]);return[...ids].map(id=>getNodeStream(id))}
export async function startNodeStream(channel,options={}){
  const id=String(channel?.id||'').trim();
  if(!id)throw Object.assign(new Error('El canal requiere id.'),{status:400});
  if(channel?.status==='Inactivo')throw Object.assign(new Error('El canal está inactivo.'),{status:409});
  const source=chooseSource(channel,id);
  if(!source)throw Object.assign(new Error('El canal no tiene una fuente activa válida.'),{status:409});
  desired.set(id,JSON.parse(JSON.stringify(channel)));
  if(options.persist!==false)await persistDesired();
  cancelRetry(id);
  const old=processes.get(id);
  if(old?.process&&!old.process.killed&&['starting','running'].includes(old.status)&&!options.restart)return state(id,old);
  if(old?.process&&!old.process.killed)await terminate(old);
  await ensureNodeStreamRoot();
  const dir=path.join(STREAM_ROOT,safeStreamId(id));
  await rm(dir,{recursive:true,force:true});
  await mkdir(dir,{recursive:true,mode:0o750});
  const startedAt=new Date().toISOString();
  const entry={status:'starting',process:null,startedAt,stoppedAt:null,error:null,exitCode:null,signal:null,logs:[],profile:channel.streamProfile||'remux-copy'};
  processes.set(id,entry);
  const stats=counter(id);
  stats.startCount+=1;
  if(options.restart)stats.restartCount+=1;
  stats.history.push({type:options.restart?'Reinicio':'Inicio',at:startedAt,automatic:Boolean(options.automatic),profile:entry.profile});
  if(stats.history.length>100)stats.history.splice(0,stats.history.length-100);
  let child;
  try{child=spawn(FFMPEG_BIN,ffmpegArgs(channel,source.url,dir),{cwd:dir,env:{...process.env},stdio:['ignore','ignore','pipe']})}
  catch(error){entry.status='recovering';entry.error=error.message;scheduleRetry(id);return state(id,entry)}
  entry.process=child;
  child.stderr.on('data',data=>addLog(entry,data));
  child.on('spawn',()=>{entry.status='running';entry.error=null});
  child.on('error',error=>{entry.status='recovering';entry.error=error.message;addLog(entry,error.message)});
  child.on('exit',(code,signal)=>{
    entry.exitCode=code;entry.signal=signal;entry.stoppedAt=new Date().toISOString();entry.process=null;
    if(shuttingDown||entry.status==='stopping'||!desired.has(id)){entry.status='stopped';return}
    entry.status='recovering';advanceSource(channel,id);entry.error=code===0?'La fuente dejó de entregar señal.':`FFmpeg terminó con código ${code??'desconocido'}. Probando siguiente fuente.`;scheduleRetry(id);
  });
  return state(id,entry);
}
export async function stopNodeStream(channelId,{persist=true}={}){
  const id=String(channelId);
  desired.delete(id);
  sourceOffsets.delete(id);
  if(persist)await persistDesired();
  cancelRetry(id);
  const entry=processes.get(id);
  if(entry?.process&&!entry.process.killed)await terminate(entry);
  if(entry)entry.status='stopped';
  return state(id,entry);
}
export async function restartNodeStream(channel){
  const id=String(channel?.id||'');
  await stopNodeStream(id,{persist:false});
  return startNodeStream(channel,{restart:true,persist:true});
}
export async function restoreNodeStreams(){
  await ensureNodeStreamRoot();
  let rows=[];
  try{const parsed=JSON.parse(await readFile(STATE_FILE,'utf8'));rows=Array.isArray(parsed)?parsed:[]}catch{}
  for(const channel of rows){if(!channel?.id)continue;desired.set(String(channel.id),channel)}
  for(const channel of rows){try{await startNodeStream(channel,{persist:false,automatic:true})}catch(error){const id=String(channel.id);processes.set(id,{status:'recovering',process:null,startedAt:null,stoppedAt:null,error:error.message,exitCode:null,signal:null,logs:[],profile:channel.streamProfile||'remux-copy'});scheduleRetry(id)}}
  return rows.length;
}
export async function stopAllNodeStreams({preserveDesired=true}={}){
  shuttingDown=true;
  for(const id of retryTimers.keys())cancelRetry(id);
  if(!preserveDesired){desired.clear();await persistDesired()}
  await Promise.all([...processes.values()].map(entry=>terminate(entry).catch(()=>{})));
}
export async function assertNodeFfmpeg(){
  return new Promise((resolve,reject)=>{
    const child=spawn(FFMPEG_BIN,['-version'],{stdio:['ignore','pipe','pipe']});let out='';
    child.stdout.on('data',data=>out+=data);
    child.once('error',reject);
    child.once('exit',code=>code===0?resolve(out.split('\n')[0].trim()):reject(new Error(`No se pudo ejecutar ${FFMPEG_BIN}.`)));
  });
}
await ensureNodeStreamRoot();
