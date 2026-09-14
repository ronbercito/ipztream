import React from 'react';
import { MoreVertical, Copy, Edit3, Trash2 } from 'lucide-react';

const statusClass = value => /activo/i.test(value) ? 'success' : /vencido/i.test(value) ? 'danger' : 'warning';

export default function UserTable({ users, onEdit, onDelete }) {
  return (
    <div className="card module-table users-table-card">
      <div className="table-info"><span>{users.length} registros</span><span>Datos de demostración</span></div>
      <div className="table-scroll">
        <table>
          <thead><tr><th>Usuario</th><th>Nombre</th><th>Estado</th><th>Paquete</th><th>Conexiones</th><th>Vencimiento</th><th>Acciones</th></tr></thead>
          <tbody>
            {users.map(user => <tr key={user.id}>
              <td><div className="user-cell"><strong>{user.username}</strong><button className="copy-user" title="Copiar usuario" onClick={()=>navigator.clipboard?.writeText(user.username)}><Copy size={13}/></button></div></td>
              <td>{user.name}</td>
              <td><span className={`status-badge ${statusClass(user.status)}`}>{user.status}</span></td>
              <td><span className="user-package">{user.package}</span></td>
              <td>{user.activeConnections} / {user.maxConnections}</td>
              <td>{user.expiresAt}</td>
              <td><div className="user-actions"><button className="icon-button" title="Editar" onClick={()=>onEdit(user)}><Edit3 size={15}/></button><button className="icon-button danger-icon" title="Eliminar" onClick={()=>onDelete(user)}><Trash2 size={15}/></button><button className="icon-button" title="Más acciones"><MoreVertical size={15}/></button></div></td>
            </tr>)}
            {!users.length && <tr><td colSpan="7" className="empty-cell">No se encontraron usuarios.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
