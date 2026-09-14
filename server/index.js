import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname=path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR=path.resolve(__dirname,'../data');
const DATA_FILE=path.join(DATA_DIR,'nodes.json');
const PORT=Number(process.env.IPZTREAM_API_PORT||3100);
const HOST=process.env.IPZTREAM_API_HOST||'127.0.0.1';

const seedNodes=[
  { id:'node-01', name:'Nodo 01 - Lima', status:'En línea', ip:'192.168.10.21', region:'Lima', cpu:22, ram:41, capacity:'10 Gbps' },
  { id:'node-02', name:'Nodo 02 - Arequipa', status:'En línea', ip:'192.168.10.22', region:'Arequipa', cpu:18, ram:36, capacity:'10 Gbps' },
  { id:'node-03', name:'Nodo 03 - Trujillo', status:'En línea', ip:'192.168.10.23', region:'Trujillo', cpu:27, ram:48, capacity:'5 Gbps' },
  { id:'node-05', name:'Nodo 05 - Piura', status:'Fuera de línea', ip:'192.168.10.25', region:'Piura', cpu:null, ram:null, capacity:'5 Gbps' }
];

let writeQueue=Promise.resolve();

async function ensureStore(){
  await fs.mkdir(DATA_DIR,{recursive:true});
  try{await fs.access(DATA_FILE);}catch{await fs.writeFile(DATA_FILE,JSON.stringify(seedNodes,null,2));}
}

async function readNodes(){
  await ensureStore();
  return JSON.parse(await fs.readFile(DATA_FILE,'utf8'));
}

function writeNodes(nodes){
  writeQueue=writeQueue.then(async()=>{
    await fs.mkdir(DATA_DIR,{recursive:true});
    await fs.writeFile(DATA_FILE,JSON.stringify(nodes,null,2));
  });
  return writeQueue;
}

function send(res,status,payload){
  const body=JSON.stringify(payload);
  res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  res.end(body);
}

async function readBody(req){
  let body='';
  for await(const chunk of req) body+=chunk;
  if(body.length>1024*64) throw new Error('Solicitud demasiado grande.');
  return body?JSON.parse(body):{};
}

function normalizeNode(input){
  return {
    id:`node-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,
    name:String(input.name||'').trim(),
    status:input.status==='Fuera de línea'?'Fuera de línea':'En línea',
    ip:String(input.ip||'').trim(),
    region:String(input.region||'').trim(),
    cpu:input.cpu===null||input.cpu===''?null:Number(input.cpu),
    ram:input.ram===null||input.ram===''?null:Number(input.ram),
    capacity:String(input.capacity||'').trim()
  };
}

function validIPv4(ip){
  const parts=ip.split('.');
  return parts.length===4&&parts.every(part=>/^\d{1,3}$/.test(part)&&Number(part)>=0&&Number(part)<=255);
}

async function handler(req,res){
  try{
    const url=new URL(req.url,`http://${req.headers.host||'localhost'}`);
    if(req.method==='GET'&&url.pathname==='/api/health') return send(res,200,{ok:true});
    if(url.pathname==='/api/nodes'&&req.method==='GET') return send(res,200,{nodes:await readNodes()});

    if(url.pathname==='/api/nodes'&&req.method==='POST'){
      const input=normalizeNode(await readBody(req));
      if(!input.name||!input.ip||!input.region||!input.capacity) return send(res,400,{message:'Nombre, IP, región y capacidad son obligatorios.'});
      if(!validIPv4(input.ip)) return send(res,400,{message:'Ingresa una dirección IPv4 válida.'});
      if((input.cpu!==null&&(Number.isNaN(input.cpu)||input.cpu<0||input.cpu>100))||(input.ram!==null&&(Number.isNaN(input.ram)||input.ram<0||input.ram>100))) return send(res,400,{message:'CPU y RAM deben estar entre 0 y 100.'});
      const nodes=await readNodes();
      if(nodes.some(node=>node.ip.toLowerCase()===input.ip.toLowerCase())) return send(res,409,{message:`La IP ${input.ip} ya está registrada en otro nodo.`});
      nodes.unshift(input);
      await writeNodes(nodes);
      return send(res,201,input);
    }

    const match=url.pathname.match(/^\/api\/nodes\/([^/]+)$/);
    if(match&&req.method==='DELETE'){
      const id=decodeURIComponent(match[1]);
      const nodes=await readNodes();
      const next=nodes.filter(node=>node.id!==id);
      if(next.length===nodes.length) return send(res,404,{message:'Nodo no encontrado.'});
      await writeNodes(next);
      return send(res,200,{ok:true});
    }

    return send(res,404,{message:'Ruta no encontrada.'});
  }catch(error){
    console.error(error);
    return send(res,500,{message:error.message||'Error interno del servidor.'});
  }
}

await ensureStore();
http.createServer(handler).listen(PORT,HOST,()=>console.log(`IPZStream API escuchando en http://${HOST}:${PORT}`));
