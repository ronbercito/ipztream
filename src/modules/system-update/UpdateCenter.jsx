// IPZStream update center — 2026-09-15
// Purpose: provide the administrator with real version checks and a controlled installation action.
// Receives the authenticated browser session through same-origin requests and calls /api/update/*.

import React from 'react';
import { AlertTriangle, CheckCircle2, Download, RefreshCw, X } from 'lucide-react';

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
      const response = await fetch('/api/update/status', { credentials: 'same-origin' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'No se pudo comprobar la actualización.');
      setStatus(data);
    } catch (err) {
      setError(err.message || 'No se pudo comprobar la actualización.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { check(); }, [check]);

  const install = async () => {
    setInstalling(true);
    setError('');
    setMessage('');
    try {
      const response = await fetch('/api/update/install', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: '{}'
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || 'No se pudo instalar la actualización.');
      setStatus((current) => current ? { ...current, available: false, current: data.installedRevision || current.current, currentShort: data.installedShort || current.currentShort, remote: data.installedRevision || current.remote, remoteShort: data.installedShort || current.remoteShort, commits: [] } : current);
      setMessage(data.message || 'Actualización instalada.');
      if (data.restartScheduled) {
        window.setTimeout(() => window.location.reload(), 4500);
      }
    } catch (err) {
      setError(err.message || 'No se pudo instalar la actualización.');
    } finally {
      setInstalling(false);
    }
  };

  const hasLocalChanges = Boolean(status?.dirty);
  const available = Boolean(status?.available);

  return <div className="modal-backdrop">
    <div className="modal update-modal">
      <div className="modal-head">
        <div><h2>Actualización de IPZStream</h2><p>Comprobación y actualización controlada</p></div>
        <button className="icon-button" onClick={close} disabled={installing}><X size={18}/></button>
      </div>

      <div className="version-box">
        <div><span>Versión / commit instalado</span><strong>{status?.currentShort || 'Comprobando...'}</strong></div>
        <span className={`status-badge ${status && !available ? 'success' : 'warning'}`}>{status ? (available ? 'Actualización disponible' : 'Actualizado') : 'Comprobando'}</span>
      </div>

      {status && <div className="update-summary">
        <div><span>Origen</span><strong>{status.remoteShort || '—'}</strong></div>
        <div><span>Cambios</span><strong>{status.commits?.length || 0}</strong></div>
      </div>}

      {hasLocalChanges && <div className="update-warning"><AlertTriangle size={18}/><div><strong>Actualización bloqueada</strong><p>El servidor tiene cambios locales. Deben revisarse antes de actualizar.</p></div></div>}
      {error && <div className="update-error"><AlertTriangle size={18}/><span>{error}</span></div>}
      {message && <div className="update-success"><CheckCircle2 size={18}/><span>{message}</span></div>}

      {available && !hasLocalChanges && <div className="update-list">
        <h3>Cambios disponibles</h3>
        {status.commits.map((commit) => <div className="update-commit" key={commit.sha}><code>{commit.shortSha}</code><span>{commit.title}</span></div>)}
      </div>}

      <div className="modal-actions">
        <button className="secondary-button" onClick={check} disabled={loading || installing}><RefreshCw size={15}/>{loading ? 'Comprobando...' : 'Comprobar de nuevo'}</button>
        <button className="primary-button" onClick={install} disabled={!available || hasLocalChanges || loading || installing}><Download size={15}/>{installing ? 'Instalando...' : 'Instalar actualización'}</button>
      </div>
    </div>
  </div>;
}
