import React from 'react';
import { Save, RotateCcw, Settings as SettingsIcon, Shield, Network, HardDrive, FileText, RefreshCw, Monitor, Globe2 } from 'lucide-react';

const STORAGE_KEY = 'ipztream-config';

const defaultConfig = {
  platformName: 'IPZStream',
  timezone: 'America/Lima',
  language: 'Español',
  dateFormat: 'DD/MM/YYYY',
  autoRefresh: true,
  compactTables: false,
  notifications: true,
  sessionTimeout: '30',
  bindAddress: '0.0.0.0',
  httpPort: '80',
  httpsEnabled: false,
  httpsPort: '443',
  apiPort: '3000',
  storagePath: '/var/lib/ipztream',
  recordingsPath: '/var/lib/ipztream/recordings',
  logPath: '/var/log/ipztream',
  maxLogSize: '100',
  logRetention: '30',
  updateChannel: 'stable'
};

const tabs = [
  ['general', 'General', SettingsIcon],
  ['panel', 'Panel', Monitor],
  ['network', 'Red / API', Network],
  ['security', 'Seguridad', Shield],
  ['storage', 'Almacenamiento', HardDrive],
  ['logs', 'Logs', FileText],
  ['updates', 'Actualizaciones', RefreshCw]
];

function loadConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...defaultConfig, ...JSON.parse(saved) } : defaultConfig;
  } catch {
    return defaultConfig;
  }
}

function Field({ label, children, hint }) {
  return <label className="settings-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}

function Settings() {
  const [config, setConfig] = React.useState(loadConfig);
  const [tab, setTab] = React.useState('general');
  const [saved, setSaved] = React.useState(false);

  const update = (key, value) => setConfig(current => ({ ...current, [key]: value }));
  const save = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };
  const reset = () => {
    setConfig(defaultConfig);
    localStorage.removeItem(STORAGE_KEY);
  };

  return <div className="module-page settings-page">
    <div className="module-head">
      <div className="module-title">
        <div className="module-icon"><SettingsIcon size={22}/></div>
        <div><h1>Configuración</h1><p>Parámetros generales y operativos de IPZStream.</p></div>
      </div>
      <div className="settings-actions">
        <button className="secondary-button" onClick={reset}><RotateCcw size={15}/>Restaurar</button>
        <button className="primary-button" onClick={save}><Save size={15}/>{saved ? 'Guardado' : 'Guardar cambios'}</button>
      </div>
    </div>

    <div className="settings-layout">
      <aside className="card settings-nav">
        <div className="settings-nav-title">Configuración del sistema</div>
        {tabs.map(([id, label, Icon]) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon size={17}/><span>{label}</span></button>)}
      </aside>

      <section className="settings-content">
        {tab === 'general' && <>
          <div className="card settings-section"><div className="settings-section-head"><div><h2>General</h2><p>Identidad y preferencias regionales de la plataforma.</p></div><Globe2 size={20}/></div>
            <div className="settings-form-grid">
              <Field label="Nombre de la plataforma"><input value={config.platformName} onChange={e => update('platformName', e.target.value)}/></Field>
              <Field label="Idioma"><select value={config.language} onChange={e => update('language', e.target.value)}><option>Español</option><option>English</option></select></Field>
              <Field label="Zona horaria"><select value={config.timezone} onChange={e => update('timezone', e.target.value)}><option>America/Lima</option><option>America/Bogota</option><option>America/Mexico_City</option><option>UTC</option></select></Field>
              <Field label="Formato de fecha"><select value={config.dateFormat} onChange={e => update('dateFormat', e.target.value)}><option>DD/MM/YYYY</option><option>MM/DD/YYYY</option><option>YYYY-MM-DD</option></select></Field>
            </div>
          </div>
          <div className="card settings-section"><div className="settings-section-head"><div><h2>Sesión</h2><p>Comportamiento básico de las sesiones administrativas.</p></div></div>
            <div className="settings-form-grid"><Field label="Tiempo de sesión (minutos)"><input type="number" min="5" value={config.sessionTimeout} onChange={e => update('sessionTimeout', e.target.value)}/></Field></div>
          </div>
        </>}

        {tab === 'panel' && <div className="card settings-section"><div className="settings-section-head"><div><h2>Panel</h2><p>Preferencias de comportamiento y visualización.</p></div><Monitor size={20}/></div>
          <div className="settings-options">
            <label><input type="checkbox" checked={config.autoRefresh} onChange={e => update('autoRefresh', e.target.checked)}/><span><b>Actualización automática</b><small>Actualizar indicadores y datos periódicamente.</small></span></label>
            <label><input type="checkbox" checked={config.compactTables} onChange={e => update('compactTables', e.target.checked)}/><span><b>Tablas compactas</b><small>Reducir el espacio vertical de las tablas administrativas.</small></span></label>
            <label><input type="checkbox" checked={config.notifications} onChange={e => update('notifications', e.target.checked)}/><span><b>Notificaciones</b><small>Mostrar avisos del sistema en la interfaz.</small></span></label>
          </div>
        </div>}

        {tab === 'network' && <div className="card settings-section"><div className="settings-section-head"><div><h2>Red / API</h2><p>Parámetros preparados para la futura conexión con el backend.</p></div><Network size={20}/></div>
          <div className="settings-form-grid"><Field label="Dirección de escucha" hint="Se aplicará al servicio backend cuando exista la configuración real del servidor."><input value={config.bindAddress} onChange={e => update('bindAddress', e.target.value)}/></Field><Field label="Puerto HTTP"><input type="number" value={config.httpPort} onChange={e => update('httpPort', e.target.value)}/></Field><Field label="Puerto API"><input type="number" value={config.apiPort} onChange={e => update('apiPort', e.target.value)}/></Field><Field label="Puerto HTTPS"><input type="number" value={config.httpsPort} onChange={e => update('httpsPort', e.target.value)}/></Field></div>
          <div className="settings-options"><label><input type="checkbox" checked={config.httpsEnabled} onChange={e => update('httpsEnabled', e.target.checked)}/><span><b>Habilitar HTTPS</b><small>Preparado para TLS cuando se configure el backend.</small></span></label></div>
        </div>}

        {tab === 'security' && <div className="card settings-section"><div className="settings-section-head"><div><h2>Seguridad</h2><p>Base para controles de seguridad, sesiones y acceso administrativo.</p></div><Shield size={20}/></div>
          <div className="security-notice"><Shield size={18}/><div><b>Configuración de seguridad preparada</b><p>La autenticación real, RBAC, tokens, políticas de contraseña y auditoría se conectarán con el backend en las siguientes etapas.</p></div></div>
          <div className="settings-options"><label><input type="checkbox" checked={config.notifications} onChange={e => update('notifications', e.target.checked)}/><span><b>Avisos administrativos</b><small>Mostrar eventos relevantes de seguridad en el panel.</small></span></label></div>
        </div>}

        {tab === 'storage' && <div className="card settings-section"><div className="settings-section-head"><div><h2>Almacenamiento</h2><p>Rutas base para datos y contenido de IPZStream.</p></div><HardDrive size={20}/></div>
          <div className="settings-form-grid"><Field label="Directorio de datos"><input value={config.storagePath} onChange={e => update('storagePath', e.target.value)}/></Field><Field label="Directorio de grabaciones"><input value={config.recordingsPath} onChange={e => update('recordingsPath', e.target.value)}/></Field><Field label="Directorio de logs"><input value={config.logPath} onChange={e => update('logPath', e.target.value)}/></Field></div>
        </div>}

        {tab === 'logs' && <div className="card settings-section"><div className="settings-section-head"><div><h2>Logs</h2><p>Retención y límites de los registros del sistema.</p></div><FileText size={20}/></div>
          <div className="settings-form-grid"><Field label="Retención (días)"><input type="number" min="1" value={config.logRetention} onChange={e => update('logRetention', e.target.value)}/></Field><Field label="Tamaño máximo por archivo (MB)"><input type="number" min="1" value={config.maxLogSize} onChange={e => update('maxLogSize', e.target.value)}/></Field></div>
          <div className="security-notice"><FileText size={18}/><div><b>Auditoría preparada</b><p>La auditoría de acciones administrativas se conectará al backend y PostgreSQL cuando se implemente la capa de servicios.</p></div></div>
        </div>}

        {tab === 'updates' && <div className="card settings-section"><div className="settings-section-head"><div><h2>Actualizaciones</h2><p>Canal y estado de la versión instalada.</p></div><RefreshCw size={20}/></div>
          <div className="version-box"><div><span>Versión instalada</span><strong>0.1.0</strong></div><span className="status-badge success">Estable</span></div>
          <div className="settings-form-grid"><Field label="Canal de actualización"><select value={config.updateChannel} onChange={e => update('updateChannel', e.target.value)}><option value="stable">Estable</option><option value="beta">Beta</option><option value="development">Desarrollo</option></select></Field></div>
          <div className="security-notice"><RefreshCw size={18}/><div><b>Updater real pendiente</b><p>Esta pantalla prepara la configuración. El sistema de releases firmados y actualización controlada se implementará posteriormente.</p></div></div>
        </div>}
      </section>
    </div>
  </div>;
}

export default Settings;
