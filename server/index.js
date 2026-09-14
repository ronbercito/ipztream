import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR=path.resolve(__dirname,'../data');
const NODES_FILE=path.join(DATA_DIR,'nodes.json');
const CHANNELS_FILE=path.join(DATA_DIR,'channels.json');
const PORT=Number(process.env.IPZTREAM_API_PORT||3100);
const HOST=process.env.IPZTREAM_API_HOST||'127.0.0.1';

const seedNodes=[
  {id:'node-01',name:'Nodo 01 - Lima',status:'En línea',ip:'192.168.10.21',region:'Lima',cpu:22,ram:41,capacity:'10 Gbps'},
  {id:'node-02',name:'Nodo 02 - Arequipa',status:'En línea',ip:'192.168.10.22',region:'Arequipa',cpu:18,ram:36,capacity:'10 Gbps'},
  {id:'node-03',name:'Nodo 03 - Trujillo',status:'En línea',ip:'192.168.10.23',region:'Trujillo',cpu:27,ram:48,capacity:'5 Gbps'},
  {id:'node-05',name:'Nodo 05 - Piura',status:'Fuera de línea',ip:'192.168.10.25',region:'Piura',cpu:null,ram:null,capacity:'5 Gbps'}
];
const seedChannels=[
  {id:'channel-espn',number:1,name:'ESPN',category:'Deportes',status:'Activo',logo:'',sources:[{id:'src-espn-1',url:'https://example.com/espn.m3u8',protocol:'HLS',status:'Activa',priority:1}]},
  {id:'channel-hbo',number:2,name:'HBO Max',category:'Entretenimiento',status:'Activo',logo:'',sources:[{id:'src-hbo-1',url:'https://example.com/hbo.m3u8',protocol:'HLS',status:'Activa',priority:1}]},
  {id:'channel-tudn',number:3,name:'TUDN',category:'Deportes',status:'Activo',logo:'',sources:[{id:'src-tudn-1',url:'https://example.com/tudn.m3u8',protocol:'HLS',status:'Activa',priority:1}]}
];

let writeQueue=Promise.resolve();
async function ensureStore(file,seed){await fs.mkdir(DATA_DIR,{recursive:true});try{await fs.access(file);}catch{await fs.writeFile(file,JSON.stringify(seed,null,2));}}
async function readStore(file,seed){await ensureStore(file,seed);return JSON.parse(await fs.readFile(file,'utf8'));}
function writeStore(file,data){writeQueue=writeQueue.then(async()=>{await fs.mkdir(DATA_DIR,{recursive:true});await fs.writeFile(file,JSON.stringify(data,null,2));});return writeQueue;}
function send(res,status,payload){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});res.end(JSON.stringify(payload));}
async function readBody(req){let body='';for await(const chunk of req)body+=chunk;if(body.length>1024*64)throw new Error('Solicitud demasiado grande.');return body?JSON.parse(body):{};}
function validIPv4(ip){const parts=ip.split('.');return parts.length===4&&parts.every(part=>/^\d{1,3}$/.test(part)&&Number(part)>=0&&Number(part)<=255);}
function normalizeNode(input,current={}){return {id:current.id||`node-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,name:String(input.name??current.name??'').trim(),status:input.status==='Fuera de línea'?'Fuera de línea':'En línea',ip:String(input.ip??current.ip??'').trim(),region:String(input.region??current.region??'').trim(),cpu:input.cpu===null||input.cpu===''?null:Number(input.cpu),ram:input.ram===null||input.ram===''?null:Number(input.ram),capacity:String(input.capacity??current.capacity??'').trim()};}
function normalizeSource(input,index=0){return {id:String(input.id||`source-${Date.now()}-${Math.random().toString(36).slice(2,7)}-${index}`),url:String(input.url||'').trim(),protocol:String(input.protocol||'HLS').trim(),status:input.status==='Inactiva'?'Inactiva':'Activa',priority:Number(input.priority||index+1)};}
function normalizeChannel(input,current={}){return {id:current.id||`channel-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,number:Number(input.number??current.number),name:String(input.name??current.name??'').trim(),category:String(input.category??current.category??'').trim(),status:input.status==='Inactivo'?'Inactivo':'Activo',logo:String(input.logo??current.logo??'').trim(),sources:Array.isArray(input.sources)?input.sources.map(normalizeSource):Array.isArray(current.sources)?current.sources.map(normalizeSource):[]};}
function validateChannel(channel,channels,id=null){if(!Number.isInteger(channel.number)||channel.number<1||channel.number>99999)return 'El número de canal debe ser un entero entre 1 y 99999.';if(!channel.name||!channel.category)return 'Nombre y categoría son obligatorios.';if(!channel.sources.length)return 'El canal debe tener al menos una fuente.';if(channel.sources.some(source=>!source.url))return 'Todas las fuentes deben tener una URL.';if(channel.sources.some(source=>!Number.isInteger(source.priority)||source.priority<1||source.priority>99))return 'La prioridad de cada fuente debe estar entre 1 y 99.';if(channels.some(item=>item.number===channel.number&&item.id!==id))return `El número ${channel.number} ya está asignado a otro canal.`;return null;}

async function handler(req,res){
  try{
    const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
    if(req.method==='GET'&&url.pathname==='/api/health')return send(res,200,{ok:true});

    if(url.pathname==='/api/nodes'&&req.method==='GET')return send(res,200,{nodes:await readStore(NODES_FILE,seedNodes)});
    if(url.pathname==='/api/nodes'&&req.method==='POST'){
      const input=normalizeNode(await readBody(req));
      if(!input.name||!input.ip||!input.region||!input.capacity)return send(res,400,{message:'Nombre, IP, región y capacidad son obligatorios.'});
      if(!validIPv4(input.ip))return send(res,400,{message:'Ingresa una dirección IPv4 válida.'});
      if((input.cpu!==null&&(Number.isNaN(input.cpu)||input.cpu<0||input.cpu>100))||(input.ram!==null&&(Number.isNaN(input.ram)||input.ram<0||input.ram>100)))return send(res,400,{message:'CPU y RAM deben estar entre 0 y 100.'});
      const nodes=await readStore(NODES_FILE,seedNodes);if(nodes.some(node=>node.ip.toLowerCase()===input.ip.toLowerCase()))return send(res,409,{message:`La IP ${input.ip} ya está registrada en otro nodo.`});nodes.unshift(input);await writeStore(NODES_FILE,nodes);return send(res,201,input);
    }
    const nodeMatch=url.pathname.match(/^\/api\/nodes\/([^/]+)$/);
    if(nodeMatch&&req.method==='DELETE'){const id=decodeURIComponent(nodeMatch[1]);const nodes=await readStore(NODES_FILE,seedNodes);const next=nodes.filter(node=>node.id!==id);if(next.length===nodes.length)return send(res,404,{message:'Nodo no encontrado.'});await writeStore(NODES_FILE,next);return send(res,200,{ok:true});}

    if(url.pathname==='/api/channels'&&req.method==='GET')return send(res,200,{channels:await readStore(CHANNELS_FILE,seedChannels)});
    if(url.pathname==='/api/channels'&&req.method==='POST'){
      const channels=await readStore(CHANNELS_FILE,seedChannels);const channel=normalizeChannel(await readBody(req));const validation=validateChannel(channel,channels);if(validation)return send(res,400,{message:validation});channels.unshift(channel);await writeStore(CHANNELS_FILE,channels);return send(res,201,channel);
    }
    const channelMatch=url.pathname.match(/^\/api\/channels\/([^/]+)$/);
    if(channelMatch){
      const id=decodeURIComponent(channelMatch[1]);const channels=await readStore(CHANNELS_FILE,seedChannels);const index=channels.findIndex(channel=>channel.id===id);if(index<0)return send(res,404,{message:'Canal no encontrado.'});
      if(req.method==='PUT'){const channel=normalizeChannel(await readBody(req),channels[index]);const validation=validateChannel(channel,channels,id);if(validation)return send(res,400,{message:validation});channels[index]=channel;await writeStore(CHANNELS_FILE,channels);return send(res,200,channel);}
      if(req.method==='DELETE'){channels.splice(index,1);await writeStore(CHANNELS_FILE,channels);return send(res,200,{ok:true});}
    }
    return send(res,404,{message:'Ruta no encontrada.'});
  }catch(error){console.error(error);return send(res,500,{message:error.message||'Error interno del servidor.'});}
}

await ensureStore(NODES_FILE,seedNodes);await ensureStore(CHANNELS_FILE,seedChannels);http.createServer(handler).listen(PORT,HOST,()=>console.log(`IPZStream API escuchando en http://${HOST}:${PORT}`));
