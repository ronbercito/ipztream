import React from 'react';
import { Search, SlidersHorizontal, ChevronDown } from 'lucide-react';

export default function UserFilters({ packages = [], query, setQuery, status, setStatus, packageFilter, setPackageFilter }) {
  return (
    <div className="toolbar users-toolbar">
      <div className="module-search">
        <Search size={16} />
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Buscar usuario, nombre o paquete..." />
      </div>
      <div className="filters">
        <label className="filter-select"><SlidersHorizontal size={13}/><select value={status} onChange={e=>setStatus(e.target.value)}><option>Todos</option><option>Activo</option><option>Suspendido</option><option>Vencido</option></select><ChevronDown size={13}/></label>
        <label className="filter-select"><SlidersHorizontal size={13}/><select value={packageFilter} onChange={e=>setPackageFilter(e.target.value)}><option>Todos</option>{packages.map(item => <option key={item.id} value={item.name}>{item.name}</option>)}</select><ChevronDown size={13}/></label>
      </div>
    </div>
  );
}
