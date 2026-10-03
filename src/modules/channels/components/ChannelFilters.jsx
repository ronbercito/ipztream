import React from 'react';
import { Columns3, Layers3, ListFilter, Plus, RefreshCw, Search, Server, SlidersHorizontal, Tv2 } from 'lucide-react';

export default function ChannelFilters({
  query,
  setQuery,
  status,
  setStatus,
  server,
  setServer,
  type,
  setType,
  category,
  setCategory,
  servers,
  types,
  categories,
  columns,
  metricsBusy = false,
  onRefresh,
  onMassAdd,
  onAdd,
  onToggleColumn
}) {
  const [columnsOpen, setColumnsOpen] = React.useState(false);

  React.useEffect(() => {
    const close = () => setColumnsOpen(false);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  return <div className="xui-stream-toolbar modern-stream-toolbar">
    <label className="stream-search-box"><Search size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar canal, categoría, servidor..."/></label>

    <div className="stream-filter-control"><span><SlidersHorizontal size={13}/> Estado</span><select value={status} onChange={(event) => setStatus(event.target.value)}><option>Todos</option><option>Activo</option><option>Inactivo</option></select></div>
    <div className="stream-filter-control"><span><Server size={13}/> Servidor</span><select value={server} onChange={(event) => setServer(event.target.value)}>{servers.map((value) => <option key={value}>{value}</option>)}</select></div>
    <div className="stream-filter-control"><span><Tv2 size={13}/> Tipo</span><select value={type} onChange={(event) => setType(event.target.value)}>{types.map((value) => <option key={value}>{value}</option>)}</select></div>
    <div className="stream-filter-control"><span><ListFilter size={13}/> Categoría</span><select value={category} onChange={(event) => setCategory(event.target.value)}>{categories.map((value) => <option key={value}>{value}</option>)}</select></div>

    <div className="stream-toolbar-actions">
      <button className="stream-tool-icon" onClick={onMassAdd} title="Añadir múltiples"><Layers3 size={16}/></button>
      <button className={'stream-tool-icon stream-refresh-solid' + (metricsBusy ? ' is-busy' : '')} onClick={onRefresh} title="Actualizar ahora"><RefreshCw size={16}/></button>
      <div className="stream-columns-wrap" onClick={(event) => event.stopPropagation()}>
        <button className="stream-columns-button" onClick={() => setColumnsOpen((value) => !value)}><Columns3 size={15}/> Columnas</button>
        {columnsOpen && <div className="stream-columns-menu">
          <strong>Columnas opcionales</strong>
          <label><input type="checkbox" checked={columns.bitrate} onChange={() => onToggleColumn('bitrate')}/> Bitrate</label>
          <label><input type="checkbox" checked={columns.resolution} onChange={() => onToggleColumn('resolution')}/> Resolución</label>
          <label><input type="checkbox" checked={columns.clients} onChange={() => onToggleColumn('clients')}/> Clientes</label>
        </div>}
      </div>
      <button className="stream-add-button" onClick={onAdd}><Plus size={16}/> Añadir Stream</button>
    </div>
  </div>;
}
