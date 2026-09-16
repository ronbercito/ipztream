// IPZStream update center — 2026-09-16
// One-button administrative update workflow. Status is checked automatically;
// the same button checks again when needed and installs the approved revision.

import React from 'react';
import { AlertTriangle, CheckCircle2, Download, GitCommitHorizontal, RefreshCw, Server, ShieldCheck, X } from 'lucide-react';
import './UpdateCenter.css';

function formatDate(value) {
  if (!value) return '—';
  try { return new Intl.DateTimeFormat('es-PE', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)); }
  catch { return value; }
}

function shortCommit(value) { return value ? String(value).slice(0, 12) : '—'; }

export default function UpdateCenter({ close }) {
  const [loading, setLoading] = React.useState(false);
  const [installing, setInstalling] = React.useState(false);
  const [status, setStatus] = React.useState(null);
  const [error, setError] = React.useState('');
  const [message, setMessage] = React.useState('');

  const check = React.useCallback(async () => {
    setLoading(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/update/status', { credentials: 'same-origin', cache: 'no-store' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `No se pudo comprobar la actualización (${response.status}).`);
      setStatus(data);
      return data;
    } catch (err) {
      setError(err.message || 'No se pudo comprobar la actualización.');
      setStatus(null);
      return null;
    } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { check(); }, [check]);

  const install = async (currentStatus) => {
    if (!currentStatus?.canInstall || installing) return;
    if (!window.confirm(`¿Actualizar IPZStream a la revisión ${shortCommit(currentStatus.remote)}?\n\nSe instalarán los cambios, se ejecutará el build y se reiniciará el servicio.`)) return;

    setInstalling(true);
    setError('');
    setMessage('Descargando cambios, instalando dependencias, compilando y preparando el reinicio…');
    try {
      const response = await fetch('/api/update/install', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `No se pudo instalar la actualización (${response.status}).`);
      setMessage(data.message || 'Actualización instalada correctamente.');
      if (data.installed) {
        window.setTimeout(() => window.location.reload(), 5000);
      } else {
        await check();
      }
    } catch (err) {
      setError(err.message || 'No se pudo instalar la actualización.');
      setMessage('');
      await check();
    } finally { setInstalling(false); }
  };

  const handleUpdate = async () => {
    const currentStatus = status || await check();
    if (!currentStatus) return;
    if (!currentStatus.canInstall) {
      if (currentStatus.dirty) setError('La actualización está bloqueada porque existen cambios locales en el servidor.');
      else setMessage('IPZStream ya está actualizado.');
      return;
    }
    await install(currentStatus);
  };

  const available = Boolean(status?.available);
  const dirty = Boolean(status?.dirty);

  return <div className="modal-backdrop update-backdrop">
    <div className="modal update-modal" role="dialog" aria-modal="true" aria-labelledby="update-title">
      <div className="modal-head update-head">
        <div className="update-title-row">
          <div className="update-app-icon"><RefreshCw size={19}/></div>
          <div><h2 id="update-title">Centro de actualización</h2><p>Actualiza IPZStream directamente desde el panel</p></div>
        </div>
        <button className="icon-button" onClick={close} disabled={installing} aria-label="Cerrar"><X size={18}/></button>
      </div>

      {loading && !status && <div className="update-loading"><RefreshCw size={20} className="spin"/><div><strong>Comprobando actualizaciones…</strong><span>Consultando versión instalada y origen.</span></div></div>}
      {error && <div className="update-error"><AlertTriangle size={18}/><div><strong>No se pudo completar la operación</strong><span>{error}</span></div></div>}

      {status && <>
        <div className={`update-state ${available ? 'available' : 'current'}`}>
          <div className="update-state-icon">{available ? <Download size={21}/> : <CheckCircle2 size={21}/>}</div>
          <div>
            <strong>{available ? 'Hay una actualización disponible' : 'IPZStream está actualizado'}</strong>
            <span>{available ? `${status.commits?.length || 0} cambio(s) pendiente(s) en ${status.branch || 'main'}.` : 'La instalación coincide con la revisión publicada en el origen.'}</span>
          </div>
          <span className="state-pill">{available ? 'Disponible' : 'Actualizado'}</span>
        </div>

        <div className="update-grid">
          <div className="update-card"><span>Versión instalada</span><strong>{status.version || '—'}</strong><small>Commit {shortCommit(status.currentShort || status.current)}</small></div>
          <div className="update-card"><span>Revisión disponible</span><strong>{available ? 'Nueva revisión' : status.version || '—'}</strong><small>Commit {shortCommit(status.remoteShort || status.remote)}</small></div>
          <div className="update-card"><span>Rama</span><strong>{status.branch || '—'}</strong><small>Remote: {status.remoteName || 'origin'}</small></div>
          <div className="update-card"><span>Última comprobación</span><strong>{formatDate(status.checkedAt)}</strong><small>Servicio: {status.service || 'ipztream-api'}</small></div>
        </div>

        <div className="update-meta"><span><Server size={14}/> {status.application || 'ipztream'}</span><span><ShieldCheck size={14}/> Solo administradores</span></div>

        {dirty && <div className="update-warning"><AlertTriangle size={18}/><div><strong>Actualización bloqueada por cambios locales</strong><span>El servidor tiene archivos modificados fuera de Git. Revisa estos archivos antes de actualizar.</span><ul>{(status.dirtyFiles || []).map((file) => <li key={file}><code>{file}</code></li>)}</ul></div></div>}

        {available && <div className="update-changelog">
          <div className="section-heading"><div><h3>Cambios disponibles</h3><span>Se muestran antes de instalar</span></div><span className="change-count">{status.commits?.length || 0}</span></div>
          <div className="commit-list">{(status.commits || []).map((commit) => <div className="commit-row" key={commit.sha}><div className="commit-icon"><GitCommitHorizontal size={16}/></div><div className="commit-main"><strong>{commit.title}</strong><span>{commit.author || 'Autor desconocido'} · {formatDate(commit.date)}</span></div><code>{commit.shortSha || shortCommit(commit.sha)}</code></div>)}</div>
        </div>}
      </>}

      {message && <div className="update-success"><CheckCircle2 size={18}/><div><strong>{installing ? 'Actualización en curso' : 'Estado de actualización'}</strong><span>{message}</span></div></div>}

      <div className="modal-actions update-actions">
        <button className="primary-button update-main-action" onClick={handleUpdate} disabled={loading || installing || dirty}>
          <Download size={15}/>{installing ? 'Actualizando…' : available ? 'Actualizar ahora' : loading ? 'Comprobando…' : 'Actualizar'}
        </button>
      </div>
    </div>
  </div>;
}
