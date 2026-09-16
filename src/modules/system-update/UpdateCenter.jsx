// IPZStream update center — 2026-09-16
// Complete administrative update workflow: status, version, changelog, blockers, confirmation and result.

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
  const [confirming, setConfirming] = React.useState(false);
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
    } catch (err) {
      setError(err.message || 'No se pudo comprobar la actualización.');
      setStatus(null);
    } finally { setLoading(false); }
  }, []);

  React.useEffect(() => { check(); }, [check]);

  const install = async () => {
    setConfirming(false);
    setInstalling(true);
    setError('');
    setMessage('Descargando cambios, instalando dependencias y preparando el reinicio…');
    try {
      const response = await fetch('/api/update/install', {
        method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: '{}'
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

  const available = Boolean(status?.available);
  const dirty = Boolean(status?.dirty);
  const canInstall = Boolean(status?.canInstall) && !installing;

  return <div className="modal-backdrop update-backdrop">
    <div className="modal update-modal" role="dialog" aria-modal="true" aria-labelledby="update-title">
      <div className="modal-head update-head">
        <div>
          <div className="update-title-row"><div className="update-app-icon"><RefreshCw size={19}/></div><div><h2 id="update-title">Centro de actualización</h2><p>IPZStream · actualización administrativa controlada</p></div></div>
        </div>
        <button className="icon-button" onClick={close} disabled={installing} aria-label="Cerrar"><X size={18}/></button>
      </div>

      {loading && !status && <div className="update-loading"><RefreshCw size={20} className="spin"/><div><strong>Comprobando el servidor…</strong><span>Consultando la versión instalada y el origen configurado.</span></div></div>}
      {error && <div className="update-error"><AlertTriangle size={18}/><div><strong>No se pudo completar la operación</strong><span>{error}</span></div></div>}

      {status && <>
        <div className={`update-state ${available ? 'available' : 'current'}`}>
          <div className="update-state-icon">{available ? <Download size={21}/> : <CheckCircle2 size={21}/>}</div>
          <div><strong>{available ? 'Hay una actualización disponible' : 'IPZStream está actualizado'}</strong><span>{available ? `${status.commits?.length || 0} cambio(s) pendiente(s) en ${status.branch || 'main'}.` : 'La instalación coincide con la revisión publicada en el origen.'}</span></div>
          <span className="state-pill">{available ? 'Disponible' : 'Actualizado'}</span>
        </div>

        <div className="update-grid">
          <div className="update-card"><span>Versión instalada</span><strong>{status.version || '—'}</strong><small>Commit {shortCommit(status.currentShort || status.current)}</small></div>
          <div className="update-card"><span>Versión en origen</span><strong>{available ? 'Nueva revisión' : status.version || '—'}</strong><small>Commit {shortCommit(status.remoteShort || status.remote)}</small></div>
          <div className="update-card"><span>Rama</span><strong>{status.branch || '—'}</strong><small>Remote: {status.remoteName || 'origin'}</small></div>
          <div className="update-card"><span>Última comprobación</span><strong>{formatDate(status.checkedAt)}</strong><small>Servicio: {status.service || 'ipztream-api'}</small></div>
        </div>

        <div className="update-meta"><span><Server size={14}/> {status.application || 'ipztream'}</span><span><ShieldCheck size={14}/> Solo administradores</span></div>

        {dirty && <div className="update-warning"><AlertTriangle size={18}/><div><strong>Actualización bloqueada por cambios locales</strong><span>El servidor tiene archivos modificados fuera de Git. Revisa estos archivos antes de actualizar:</span><ul>{(status.dirtyFiles || []).map((file) => <li key={file}><code>{file}</code></li>)}</ul></div></div>}

        {available && <div className="update-changelog">
          <div className="section-heading"><div><h3>Cambios disponibles</h3><span>Se muestran antes de instalar</span></div><span className="change-count">{status.commits?.length || 0}</span></div>
          <div className="commit-list">{(status.commits || []).map((commit) => <div className="commit-row" key={commit.sha}><div className="commit-icon"><GitCommitHorizontal size={16}/></div><div className="commit-main"><strong>{commit.title}</strong><span>{commit.author || 'Autor desconocido'} · {formatDate(commit.date)}</span></div><code>{commit.shortSha || shortCommit(commit.sha)}</code></div>)}</div>
        </div>}
      </>}

      {message && <div className="update-success"><CheckCircle2 size={18}/><div><strong>Operación en curso</strong><span>{message}</span></div></div>}

      {confirming && <div className="update-confirm"><div><strong>¿Instalar esta actualización?</strong><span>Se descargará la revisión indicada, se instalarán dependencias, se ejecutará el build y se reiniciará <code>{status?.service || 'ipztream-api'}</code>.</span></div><div className="modal-actions"><button className="secondary-button" onClick={() => setConfirming(false)}>Cancelar</button><button className="primary-button" onClick={install}><Download size={15}/> Confirmar actualización</button></div></div>}

      <div className="modal-actions update-actions">
        <button className="secondary-button" onClick={check} disabled={loading || installing}><RefreshCw size={15} className={loading ? 'spin' : ''}/>{loading ? 'Comprobando…' : 'Comprobar de nuevo'}</button>
        <button className="primary-button" onClick={() => setConfirming(true)} disabled={!canInstall || confirming}><Download size={15}/>{installing ? 'Actualizando…' : 'Actualizar ahora'}</button>
      </div>
    </div>
  </div>;
}
