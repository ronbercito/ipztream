import React from 'react';
import { Eye, EyeOff, Save, X } from 'lucide-react';

const empty = { username:'', name:'', status:'Activo', packageId:'', maxConnections:'1', expiresAt:'', password:'' };

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function UserForm({ user, packages = [], onSave, onClose }) {
  const [form, setForm] = React.useState(user ? { ...user, password:'' } : empty);
  const [error, setError] = React.useState('');
  const [showPassword, setShowPassword] = React.useState(false);
  const set = (key, value) => setForm(current => ({ ...current, [key]: value }));

  const selectedPackage = packages.find((item) => item.id === form.packageId);
  const packageMax = Math.max(1, Number(selectedPackage?.maxConnections || form.maxConnections || 1));

  React.useEffect(() => {
    if (!form.packageId && packages[0]) set('packageId', packages[0].id);
  }, [packages, form.packageId]);

  React.useEffect(() => {
    if (selectedPackage && (!form.maxConnections || Number(form.maxConnections) > packageMax)) set('maxConnections', String(packageMax));
  }, [selectedPackage, packageMax, form.maxConnections]);

  const handleExpirationChange = (value) => {
    setForm(current => {
      const nextStatus = current.status === 'Suspendido'
        ? 'Suspendido'
        : (value && value >= todayIso() ? 'Activo' : 'Vencido');
      return { ...current, expiresAt: value, status: nextStatus };
    });
  };

  const submit = async (e) => {
    e.preventDefault();
    const username = String(form.username || '').trim().toLowerCase();
    const name = String(form.name || '').trim();
    const maxConnections = Number(form.maxConnections);
    const password = String(form.password || '');

    if (!username || !name || !form.packageId || !form.expiresAt) {
      setError('Usuario, nombre, paquete y vencimiento son obligatorios.');
      return;
    }
    if (username.length < 3) {
      setError('El usuario debe tener al menos 3 caracteres.');
      return;
    }
    if (maxConnections < 1 || maxConnections > packageMax) {
      setError(`El máximo de conexiones debe estar entre 1 y ${packageMax}.`);
      return;
    }
    if (!user && password.length < 1) {
      setError('La contraseña es obligatoria y debe tener al menos 1 carácter.');
      return;
    }
    if (user && password && password.length < 1) {
      setError('La nueva contraseña debe tener al menos 1 carácter.');
      return;
    }

    setError('');
    const payload = { ...form, username, name, maxConnections, password };
    const saved = await onSave(payload);
    if (saved !== true) setError(saved?.error || 'No se pudo guardar el cliente. Revisa los datos.');
  };

  return <div className="modal-backdrop"><form className="modal user-modal" onSubmit={submit}>
    <div className="modal-head">
      <div><h2>{user?'Editar cliente':'Nuevo cliente IPTV'}</h2><p className="modal-subtitle">Cuenta de cliente, seguridad y servicio contratado.</p></div>
      <button type="button" className="icon-button" onClick={onClose}><X size={18}/></button>
    </div>

    {error && <div className="form-error" role="alert">{error}</div>}

    <div className="form-grid user-form-grid">
      <label>Usuario<input autoFocus required maxLength="64" value={form.username} onChange={e=>set('username',e.target.value)} placeholder="cliente01" disabled={Boolean(user)}/></label>
      <label>Nombre<input required maxLength="120" value={form.name} onChange={e=>set('name',e.target.value)} placeholder="Nombre del cliente"/></label>
      <label>Estado<select value={form.status} onChange={e=>set('status',e.target.value)}><option>Activo</option><option>Suspendido</option><option>Vencido</option></select></label>
      <label>Paquete<select value={form.packageId} onChange={e=>set('packageId',e.target.value)} required><option value="">Seleccionar…</option>{packages.map(item => <option key={item.id} value={item.id}>{item.name} · {item.maxConnections} conexión(es)</option>)}</select></label>
      <label>Máximo de conexiones<input type="number" min="1" max={packageMax} value={form.maxConnections} onChange={e=>set('maxConnections',e.target.value)}/></label>
      <label>Vencimiento<input type="date" value={form.expiresAt || ''} onChange={e=>handleExpirationChange(e.target.value)} required/></label>
      <label className="full-width">{user ? 'Nueva contraseña (opcional)' : 'Contraseña'}<div className="password-field"><input type={showPassword ? 'text' : 'password'} minLength="1" autoComplete="new-password" value={form.password} onChange={e=>set('password',e.target.value)} placeholder={user ? 'Dejar vacío para conservar la actual' : 'Mínimo 1 carácter'} required={!user}/><button type="button" className="password-toggle" onClick={()=>setShowPassword(current=>!current)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}>{showPassword ? <EyeOff size={17}/> : <Eye size={17}/>}</button></div></label>
    </div>

    <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>Cancelar</button><button type="submit" className="primary-button"><Save size={15}/>Guardar cliente</button></div>
  </form></div>;
}
