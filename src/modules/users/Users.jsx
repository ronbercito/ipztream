import React from 'react';
import { Plus, Users } from 'lucide-react';
import UserFilters from './components/UserFilters';
import UserTable from './components/UserTable';
import UserForm from './components/UserForm';
import { listUsers, listPackages, saveUser, deleteUser } from './services/usersApi';
import './styles/users.css';

export default function UsersPage() {
  const [users, setUsers] = React.useState([]);
  const [packages, setPackages] = React.useState([]);
  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState('Todos');
  const [packageFilter, setPackageFilter] = React.useState('Todos');
  const [editing, setEditing] = React.useState(null);
  const [confirming, setConfirming] = React.useState(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState('');

  const load = React.useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [userData, packageData] = await Promise.all([listUsers(), listPackages()]);
      setUsers(userData);
      setPackages(packageData.filter((item) => item.status !== 'Inactivo'));
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los usuarios.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  const filtered = users.filter(user => {
    const text = [user.username, user.name, user.package, user.status].join(' ').toLowerCase();
    return text.includes(query.toLowerCase())
      && (status === 'Todos' || user.status === status)
      && (packageFilter === 'Todos' || user.package === packageFilter);
  });

  const save = async (user) => {
    try {
      setError('');
      await saveUser(user);
      setEditing(null);
      await load();
      return true;
    } catch (err) {
      setError(err.message || 'No se pudo guardar el usuario.');
      return false;
    }
  };

  const remove = async () => {
    if (!confirming) return;
    try {
      setError('');
      await deleteUser(confirming.id);
      setConfirming(null);
      await load();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el usuario.');
    }
  };

  return <div className="module-page">
    <div className="module-head">
      <div className="module-title">
        <div className="module-icon"><Users size={22}/></div>
        <div><h1>Usuarios IPTV</h1><p>Gestiona clientes, cuentas, paquetes, conexiones y vencimientos.</p></div>
      </div>
      <button className="primary-button" onClick={() => setEditing({})}><Plus size={16}/>Nuevo cliente</button>
    </div>

    {error && <div className="form-error" role="alert">{error}</div>}
    <UserFilters packages={packages} query={query} setQuery={setQuery} status={status} setStatus={setStatus} packageFilter={packageFilter} setPackageFilter={setPackageFilter}/>

    {loading ? <div className="empty-state">Cargando clientes…</div> : <UserTable users={filtered} onEdit={setEditing} onDelete={setConfirming}/>} 

    {editing !== null && <UserForm user={editing.id ? editing : null} packages={packages} onSave={save} onClose={() => setEditing(null)}/>} 

    {confirming && <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-head"><h2>Eliminar cliente</h2></div>
        <p>¿Seguro que deseas eliminar <strong>{confirming.username}</strong>? También se eliminarán sus credenciales y se desasociarán sus dispositivos.</p>
        <div className="modal-actions">
          <button className="secondary-button" onClick={() => setConfirming(null)}>Cancelar</button>
          <button className="primary-button danger-button" onClick={remove}>Eliminar</button>
        </div>
      </div>
    </div>}
  </div>;
}
