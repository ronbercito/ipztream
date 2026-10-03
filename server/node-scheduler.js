import {
  TABLES,
  addAudit,
  getStreamDesiredState,
  listItems,
  listStreamNodes,
  updateItem
} from './db.js';

function numberOr(value,fallback=0){
  const n=Number(value);
  return Number.isFinite(n)?n:fallback;
}
function parseCapacity(value){
  const match=String(value||'').match(/\d+(?:\.\d+)?/);
  return match?Math.max(1,Number(match[0])):null;
}
function supportsLive(node){
  const caps=Array.isArray(node.capabilities)?node.capabilities:[];
  if(!caps.length)return true;
  return caps.some((cap)=>['live','ffmpeg','remux','transcode','hls'].includes(String(cap).toLowerCase()));
}
function supportsChannel(node,channel){
  const caps=(Array.isArray(node.capabilities)?node.capabilities:[]).map((cap)=>String(cap).toLowerCase());
  if(!caps.length)return true;
  const profile=String(channel?.streamProfile||'').toLowerCase();
  if(profile.includes('transcode'))return caps.includes('transcode')||caps.includes('ffmpeg');
  return caps.some((cap)=>['live','ffmpeg','remux','hls'].includes(cap));
}
function hasCapacity(node,plannedCount=0){
  const capacity=parseCapacity(node.capacity);
  if(!capacity)return true;
  return Math.max(0,numberOr(node.activeStreams,0))+plannedCount<capacity;
}
function eligibleNode(node,region=''){
  if(!['main','sub','edge'].includes(node.role))return false;
  if(!['En línea','Degradado'].includes(node.status))return false;
  if(region&&String(node.region||'').toLowerCase()!==String(region).toLowerCase())return false;
  return supportsLive(node);
}
function scoreNode(node,plannedCount=0){
  const cpu=Math.min(100,Math.max(0,numberOr(node.cpu,50)));
  const ram=Math.min(100,Math.max(0,numberOr(node.ram,50)));
  const capacity=parseCapacity(node.capacity);
  const active=Math.max(0,numberOr(node.activeStreams,0))+plannedCount;
  const streamPressure=capacity?Math.min(150,(active/capacity)*100):Math.min(100,active*10);
  const degradedPenalty=node.status==='Degradado'?20:0;
  return Number((cpu*0.4+ram*0.3+streamPressure*0.3+degradedPenalty).toFixed(2));
}
function publicNode(node,plannedCount=0){
  return{
    id:node.id,
    name:node.name,
    role:node.role,
    region:node.region,
    status:node.status,
    cpu:node.cpu,
    ram:node.ram,
    activeStreams:node.activeStreams,
    capacity:node.capacity,
    plannedCount,
    score:scoreNode(node,plannedCount)
  };
}

export async function buildSchedulerPlan({
  channelIds=[],
  region='',
  includeAssigned=false
}={}){
  const allChannels=await listItems(TABLES.channels);
  const wanted=new Set((Array.isArray(channelIds)?channelIds:[]).map(String));
  const selected=wanted.size?allChannels.filter((channel)=>wanted.has(String(channel.id))):allChannels;
  const nodes=(await listStreamNodes()).filter((node)=>eligibleNode(node,region));
  const plannedCounts=new Map(nodes.map((node)=>[node.id,0]));
  const assignments=[];
  const skipped=[];

  for(const channel of selected){
    const channelId=String(channel.id);
    const currentNodeId=String(channel.nodeId||'').trim();
    if(currentNodeId&&!includeAssigned){
      skipped.push({channelId,name:channel.name||channelId,reason:'already-assigned',nodeId:currentNodeId});
      continue;
    }
    if(await getStreamDesiredState(channelId)==='running'){
      skipped.push({channelId,name:channel.name||channelId,reason:'running',nodeId:currentNodeId});
      continue;
    }
    if(!nodes.length){
      skipped.push({channelId,name:channel.name||channelId,reason:'no-eligible-node',nodeId:currentNodeId});
      continue;
    }

    const available=nodes.filter((node)=>supportsChannel(node,channel)&&hasCapacity(node,plannedCounts.get(node.id)||0));
    if(!available.length){
      skipped.push({channelId,name:channel.name||channelId,reason:'no-capacity-or-capability',nodeId:currentNodeId});
      continue;
    }
    const ranked=[...available].sort((a,b)=>{
      const sa=scoreNode(a,plannedCounts.get(a.id)||0);
      const sb=scoreNode(b,plannedCounts.get(b.id)||0);
      return sa-sb||String(a.name).localeCompare(String(b.name));
    });
    const chosen=ranked[0];
    const before=plannedCounts.get(chosen.id)||0;
    plannedCounts.set(chosen.id,before+1);
    assignments.push({
      channelId,
      channelName:channel.name||channelId,
      fromNodeId:currentNodeId||null,
      toNodeId:chosen.id,
      toNodeName:chosen.name,
      region:chosen.region,
      score:scoreNode(chosen,before),
      reason:'lowest-load-score'
    });
  }

  return{
    generatedAt:new Date().toISOString(),
    filters:{region:String(region||''),includeAssigned:Boolean(includeAssigned),requestedChannelIds:[...wanted]},
    eligibleNodes:nodes.map((node)=>publicNode(node,plannedCounts.get(node.id)||0)),
    assignments,
    skipped
  };
}

export async function applySchedulerPlan(assignments,{actor='system'}={}){
  if(!Array.isArray(assignments)||!assignments.length){
    const error=new Error('El plan no contiene asignaciones para aplicar.');
    error.status=400;
    throw error;
  }
  const channels=await listItems(TABLES.channels);
  const channelMap=new Map(channels.map((channel)=>[String(channel.id),channel]));
  const nodes=await listStreamNodes();
  const nodeMap=new Map(nodes.map((node)=>[String(node.id),node]));
  const applied=[];
  const skipped=[];
  const appliedCounts=new Map(nodes.map((node)=>[String(node.id),0]));

  for(const row of assignments){
    const channelId=String(row.channelId||'');
    const nodeId=String(row.toNodeId||'');
    const channel=channelMap.get(channelId);
    const node=nodeMap.get(nodeId);
    if(!channel){skipped.push({channelId,nodeId,reason:'channel-not-found'});continue}
    if(!node||!eligibleNode(node,'')){skipped.push({channelId,nodeId,reason:'node-not-eligible'});continue}
    if(!supportsChannel(node,channel)){skipped.push({channelId,nodeId,reason:'node-capability-mismatch'});continue}
    if(!hasCapacity(node,appliedCounts.get(nodeId)||0)){skipped.push({channelId,nodeId,reason:'node-at-capacity'});continue}
    if(await getStreamDesiredState(channelId)==='running'){
      skipped.push({channelId,nodeId,reason:'running'});
      continue;
    }
    const previousNodeId=String(channel.nodeId||'').trim();
    if(previousNodeId===nodeId){
      skipped.push({channelId,nodeId,reason:'unchanged'});
      continue;
    }
    const updated={...channel,nodeId};
    const saved=await updateItem(TABLES.channels,channelId,updated);
    if(!saved){skipped.push({channelId,nodeId,reason:'update-failed'});continue}
    channelMap.set(channelId,saved);
    appliedCounts.set(nodeId,(appliedCounts.get(nodeId)||0)+1);
    applied.push({channelId,channelName:saved.name||channelId,fromNodeId:previousNodeId||null,toNodeId:nodeId,toNodeName:node.name});
  }

  if(applied.length){
    await addAudit({
      action:'SCHEDULER_APPLY',
      module:'stream-nodes',
      actor,
      detail:`Scheduler aplicó ${applied.length} asignación(es)`,
      metadata:{applied,skipped}
    });
  }
  return{applied,skipped};
}
