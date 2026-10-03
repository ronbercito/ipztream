import React from'react';
import{Search,SlidersHorizontal,ListFilter}from'lucide-react';

export default function ChannelFilters({query,setQuery,status,setStatus,category,setCategory,categories}){
 return <div className="xui-stream-toolbar modern-stream-toolbar">
   <label className="stream-search-box"><Search size={17}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar canal, categoría, servidor..."/></label>
   <div className="stream-filter-control"><span><SlidersHorizontal size={14}/> Estado</span><select value={status} onChange={e=>setStatus(e.target.value)}><option>Todos</option><option>Activo</option><option>Inactivo</option></select></div>
   <div className="stream-filter-control"><span><ListFilter size={14}/> Categoría</span><select value={category} onChange={e=>setCategory(e.target.value)}>{categories.map(c=><option key={c}>{c}</option>)}</select></div>
   <div className="stream-page-size"><span>Mostrar</span><select defaultValue="25"><option>10</option><option>25</option><option>50</option><option>100</option></select><span>filas</span></div>
 </div>
}
