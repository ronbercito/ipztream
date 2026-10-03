import {
  clearStreamHistory,
  getStream,
  restartStream,
  startStream,
  stopStream
} from './stream-manager.js';
import {
  listDesiredRunningStreams,
  setStreamDesiredState
} from './db.js';
import {
  getRemoteStream,
  resolveChannelTarget,
  restartRemoteStream,
  startRemoteStream,
  stopRemoteStream
} from './node-client.js';

function localDecorate(stream,target){
  return{...stream,nodeId:target.node?.id||'',nodeName:target.node?.name||'Main',execution:'local'};
}
export async function getDistributedStream(channelId){
  const target=await resolveChannelTarget(channelId);
  if(target.type==='local')return localDecorate(getStream(channelId),target);
  return getRemoteStream(target.node,channelId);
}
export async function startDistributedStream(channelId,{persist=true}={}){
  const target=await resolveChannelTarget(channelId);
  if(target.type==='local')return localDecorate(await startStream(channelId,{persist}),target);
  if(persist)await setStreamDesiredState(channelId,'running');
  try{return await startRemoteStream(target.node,target.channel)}
  catch(error){if(persist)await setStreamDesiredState(channelId,'stopped');throw error}
}
export async function stopDistributedStream(channelId,{persist=true}={}){
  const target=await resolveChannelTarget(channelId);
  if(target.type==='local')return localDecorate(await stopStream(channelId),target);
  if(persist)await setStreamDesiredState(channelId,'stopped');
  return stopRemoteStream(target.node,channelId);
}
export async function restartDistributedStream(channelId){
  const target=await resolveChannelTarget(channelId);
  await setStreamDesiredState(channelId,'running');
  if(target.type==='local')return localDecorate(await restartStream(channelId),target);
  return restartRemoteStream(target.node,target.channel);
}
export async function clearDistributedStreamHistory(channelId){
  const target=await resolveChannelTarget(channelId);
  if(target.type==='local')return localDecorate(clearStreamHistory(channelId),target);
  return getRemoteStream(target.node,channelId);
}
export async function restoreDistributedDesiredStreams(){
  const ids=await listDesiredRunningStreams();
  let restored=0;
  for(const id of ids){
    try{await startDistributedStream(id,{persist:false});restored++}
    catch(error){console.error(`No se pudo restaurar stream ${id}: ${error.message}`)}
  }
  return{requested:ids.length,restored};
}
