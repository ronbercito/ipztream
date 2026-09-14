import React from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity, BarChart3, Bell, CalendarDays, ChevronDown, Clapperboard, Copy, Cpu, Database, FileText, Gauge, HardDrive,
  Home, ListVideo, LogOut, Menu, Monitor, MoreVertical, Network, Package, PlaySquare, Radio, RefreshCw, Search,
  Server, Settings, Shield, Smartphone, Users, Video, Wifi, X
} from 'lucide-react';
import './styles.css';

const nav = [
  ['Dashboard', Home], ['Usuarios', Users], ['Servidores / Nodos', Server],
  ['Canales', Radio], ['VOD / Series', PlaySquare], ['EPG', CalendarDays],
  ['Listas M3U', ListVideo], ['Paquetes / Perfiles', Package],
  ['Conexiones Activas', Activity], ['Dispositivos', Smartphone],
  ['Logs / Auditoría', FileText], ['Estadísticas', BarChart3], ['Configuración', Settings]
];

const connections = [
  ['cliente01', 'Smart TV (Samsung)', '192.168.1.45', 'ESPN', 'Nodo 01', '14:28'],
  ['cliente02', 'Android TV', '192.168.1.78', 'HBO Max', 'Nodo 02', '14:26'],
  ['cliente03', 'Fire TV', '192.168.1.92', 'Discovery Channel', 'Nodo 03', '14:24'],
  ['cliente04', 'iOS (iPhone)', '192.168.1.103', 'TUDN', 'Nodo 01', '14:22'],
  ['cliente05', 'Web Player', '190.235.12.45', 'VOD - Película', 'Nodo 04', '14:20']
];

const nodes = [
  ['Nodo 01 - Lima', 'En línea', '22%', '41%', true],
  ['Nodo 02 - Arequipa', 'En línea', '18%', '36%', true],
  ['Nodo 03 - Trujillo', 'En línea', '27%', '48%', true],
  ['Nodo 04 - Cusco', 'En línea', '31%', '55%', true],
  ['Nodo 05 - Piura', 'Fuera de línea', '—', '—', false]
];

function Kpi({ icon: Icon, title, value, trend, tone }) {
  return <div className="kpi-card">
    <div className={`kpi-icon ${tone}`}><Icon size={24}/></div>
    <div><div className="kpi-title">{title}</div><div className="kpi-value">{value}</div>
      <div className="kpi-trend"><span>↑ {trend}</span><small>vs. mes anterior</small></div>
    </div>
  </div>;
}

function Sidebar({ open, onClose }) {
  return <aside className={`sidebar ${open ? 'open' : ''}`}>
    <div className="brand"><div className="brand-mark"><PlaySquare size={23}/></div><div><strong>IPZSTREAM</strong><span>IPTV Management Platform</span></div></div>
    <button className="mobile-close" onClick={onClose}><X size={20}/></button>
    <nav>{nav.map(([label, Icon], i) => <button className={i === 0 ? 'active' : ''} key={label}><Icon size={17}/><span>{label}</span></button>)}</nav>
    <div className="sidebar-bottom"><div>Versión 0.1.0</div><div className="online"><i/> Sistema en línea</div></div>
  </aside>;
}

function BandwidthChart() {
  return <div className="chart-wrap">
    <div className="chart-axis"><span>800 Mbps</span><span>600 Mbps</span><span>400 Mbps</span><span>200 Mbps</span><span>0 Mbps</span></div>
    <svg className="line-chart" viewBox="0 0 700 260" preserveAspectRatio="none" aria-label="Uso de ancho de banda">
      <defs><linearGradient id="areaBlue" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopOpacity=".30"/><stop offset="1" stopOpacity="0"/></linearGradient></defs>
      {[35,82,129,176,223].map(y => <line key={y} x1="0" x2="700" y1={y} y2={y} className="grid-line"/>)}
      <path d="M0 160 C60 168 70 170 115 156 S190 125 235 130 S300 132 350 92 S420 120 470 102 S540 55 585 74 S650 84 700 92 L700 223 L0 223 Z" className="area-blue"/>
      <path d="M0 160 C60 168 70 170 115 156 S190 125 235 130 S300 132 350 92 S420 120 470 102 S540 55 585 74 S650 84 700 92" className="series-blue"/>
      <path d="M0 191 C60 193 80 188 115 189 S190 171 235 178 S300 175 350 160 S420 171 470 153 S540 126 585 142 S650 135 700 142" className="series-green"/>
    </svg>
    <div className="chart-labels"><span>6 Sep</span><span>7 Sep</span><span>8 Sep</span><span>9 Sep</span><span>10 Sep</span><span>11 Sep</span><span>12 Sep</span><span>13 Sep</span></div>
  </div>;
}

function Distribution() {
  return <div className="distribution">
    <div className="donut"><div><strong>1,248</strong><span>Total de usuarios</span></div></div>
    <div className="legend"><div><i className="dot blue"/>TV en Vivo <b>52%</b></div><div><i className="dot purple"/>VOD <b>28%</b></div><div><i className="dot green"/>Series <b>12%</b></div><div><i className="dot orange"/>Otros <b>8%</b></div></div>
  </div>;
}

function App() {
  const [sidebar, setSidebar] = React.useState(false);
  const handleUpdate = () => window.location.reload();

  return <div className="app">
    <Sidebar open={sidebar} onClose={() => setSidebar(false)}/>
    {sidebar && <div className="backdrop" onClick={() => setSidebar(false)}/>} 
    <main className="main">
      <header className="topbar"><button className="menu-button" onClick={() => setSidebar(true)}><Menu size={21}/></button><div className="global-search"><Search size={18}/><span>Buscar usuarios, canales, dispositivos...</span><kbd>Ctrl + K</kbd></div><div className="top-actions"><button className="update-button" type="button" onClick={handleUpdate} title="Actualizar panel"><RefreshCw size={15}/><span>Actualizar</span></button><Bell size={19}/><span className="bell-dot">3</span><div className="avatar">RA</div><span className="admin">Administrador</span><ChevronDown size={15}/></div></header>
      <section className="content">
        <div className="page-heading"><div><h1>Dashboard</h1><p>Bienvenido al panel de administración de IPZStream</p></div><div className="date"><CalendarDays size={17}/><div><strong>13 de septiembre de 2026</strong><span>14:32 (GMT-05:00)</span></div></div></div>
        <div className="kpis"><Kpi icon={Users} title="Usuarios Activos" value="1,248" trend="12%" tone="blue"/><Kpi icon={PlaySquare} title="Conexiones Activas" value="2,486" trend="8%" tone="green"/><Kpi icon={Server} title="Nodos en Línea" value="4 / 5" trend="0%" tone="purple"/><Kpi icon={Database} title="Ingresos (Este mes)" value="$ 3,482.50" trend="15%" tone="orange"/></div>
        <div className="dashboard-grid"><section className="card bandwidth"><div className="card-head"><div><h2>Uso de Ancho de Banda</h2></div><div className="chart-legend"><span><i className="blue-line"/>Entrada</span><span><i className="green-line"/>Salida</span></div></div><BandwidthChart/></section>
          <section className="card"><div className="card-head"><h2>Distribución de Contenido</h2></div><Distribution/></section>
          <section className="card nodes"><div className="card-head"><h2>Estado de Nodos</h2><a>Ver todos →</a></div>{nodes.map(n => <div className="node" key={n[0]}><div className={`status ${n[4] ? '' : 'off'}`}/><div className="node-name"><strong>{n[0]}</strong><span className={n[4] ? '' : 'red'}>{n[1]}</span></div><div className="node-metric">CPU <b>{n[2]}</b></div><div className="node-metric">RAM <b>{n[3]}</b></div></div>)}</section>
        </div>
        <section className="card recent"><div className="card-head"><h2>Últimas Conexiones</h2><a>Ver todas →</a></div><div className="table-scroll"><table><thead><tr><th>Usuario</th><th>Dispositivo</th><th>IP</th><th>Canal / Contenido</th><th>Nodo</th><th>Hora</th><th/></tr></thead><tbody>{connections.map(c => <tr key={c[0]}><td><span className="user-avatar"><Users size={14}/></span><b>{c[0]}</b></td><td>{c[1]}</td><td className="mono">{c[2]}</td><td>{c[3]}</td><td>{c[4]}</td><td>{c[5]}</td><td><span className="live-dot"/><MoreVertical size={16}/></td></tr>)}</tbody></table></div></section>
      </section>
    </main>
  </div>;
}

createRoot(document.getElementById('root')).render(<App />);
