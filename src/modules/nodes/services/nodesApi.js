const KEY='ipztream-nodes-v1';

export function loadNodes(fallback){
 try{const raw=localStorage.getItem(KEY);if(!raw)return fallback;const parsed=JSON.parse(raw);return Array.isArray(parsed)?parsed:fallback;}catch{return fallback;}
}
export function saveNodes(nodes){try{localStorage.setItem(KEY,JSON.stringify(nodes));}catch{} }
export function createNode(data){return {id:`node-${Date.now()}-${Math.random().toString(36).slice(2,7)}`,...data};}
export function removeNode(nodes,id){return nodes.filter(n=>n.id!==id);}
