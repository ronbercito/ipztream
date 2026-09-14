import React from 'react';
import { SlidersHorizontal, ChevronDown } from 'lucide-react';

export default function NodeFilters({filters,setFilters,regions}){
  return <div className="filters">
    <label className="filter-select"><SlidersHorizontal size={13}/><select value={filters.status} onChange={e=>setFilters({...filters,status:e.target.value})}><option>Todos</option><option>En línea</option><option>Fuera de línea</option></select><ChevronDown size={13}/></label>
    <label className="filter-select"><SlidersHorizontal size={13}/><select value={filters.region} onChange={e=>setFilters({...filters,region:e.target.value})}><option>Todas</option>{regions.map(r=><option key={r}>{r}</option>)}</select><ChevronDown size={13}/></label>
  </div>;
}
