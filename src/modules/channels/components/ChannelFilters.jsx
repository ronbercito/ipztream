import React from 'react';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';

export default function ChannelFilters({query,setQuery,status,setStatus,category,setCategory,categories}){
  return <div className="toolbar channels-toolbar">
    <div className="module-search"><Search size={16}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar canal, número, categoría o fuente..."/></div>
    <div className="filters">
      <button className="filter-button" onClick={()=>setStatus(status==='Todos'?'Activo':status==='Activo'?'Inactivo':'Todos')}><SlidersHorizontal size={13}/>Estado: {status}<ChevronDown size={13}/></button>
      <button className="filter-button" onClick={()=>{const index=categories.indexOf(category);setCategory(categories[(index+1)%categories.length]||'Todas')}}>Categoría: {category}<ChevronDown size={13}/></button>
    </div>
  </div>;
}
