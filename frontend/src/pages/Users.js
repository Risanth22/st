import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Users, Shield, CheckCircle, XCircle } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const PERMISSIONS_MATRIX = [
  { feature: 'Dashboard', owner: true, manager: true, cashier: true },
  { feature: 'Inventory Management', owner: true, manager: true, cashier: false },
  { feature: 'Billing / POS', owner: true, manager: true, cashier: true },
  { feature: 'Supplier Management', owner: true, manager: true, cashier: false },
  { feature: 'Purchase Orders', owner: true, manager: true, cashier: false },
  { feature: 'Sales Reports', owner: true, manager: true, cashier: false },
  { feature: 'Profit & Loss', owner: true, manager: false, cashier: false },
  { feature: 'Expiry Alerts', owner: true, manager: true, cashier: false },
  { feature: 'Notifications', owner: true, manager: false, cashier: false },
  { feature: 'User Management', owner: true, manager: false, cashier: false },
  { feature: 'Delete Products', owner: true, manager: false, cashier: false },
  { feature: 'Financial Reports', owner: true, manager: false, cashier: false },
];

function UserModal({ user, onClose, onSave }) {
  const [form, setForm] = useState(user || { name: '', email: '', password: '', role: 'cashier', phone: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (user?.id) { await api.put(`/users/${user.id}`, form); toast.success('User updated'); }
      else { await api.post('/users', form); toast.success('User created'); }
      onSave();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 style={{ fontSize: 18 }}>{user?.id ? 'Edit User' : 'Add User'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group"><label>Full Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} required /></div>
              <div className="form-group"><label>Phone</label><input value={form.phone || ''} onChange={e => set('phone', e.target.value)} /></div>
            </div>
            <div className="form-group"><label>Email *</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} required /></div>
            {!user?.id && <div className="form-group"><label>Password *</label><input type="password" value={form.password || ''} onChange={e => set('password', e.target.value)} required minLength={6} /></div>}
            <div className="form-group">
              <label>Role *</label>
              <select value={form.role} onChange={e => set('role', e.target.value)}>
                <option value="owner">Owner (Full Access)</option>
                <option value="manager">Manager (No Financials)</option>
                <option value="cashier">Cashier (Billing Only)</option>
              </select>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save User'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [tab, setTab] = useState('users');
  const { user: currentUser } = useAuth();

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch { toast.error('Failed to load users'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id) => {
    if (id === currentUser.id) { toast.error("Can't delete yourself"); return; }
    if (!window.confirm('Deactivate this user?')) return;
    try { await api.delete(`/users/${id}`); toast.success('User deactivated'); load(); }
    catch { toast.error('Failed'); }
  };

  const roleBadge = (role) => {
    const map = { owner: 'badge-purple', manager: 'badge-blue', cashier: 'badge-gray' };
    return <span className={`badge ${map[role] || 'badge-gray'}`} style={{ textTransform: 'capitalize' }}>{role}</span>;
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Users & Roles</h1>
          <p className="page-subtitle">{users.length} staff members</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}><Plus size={15} /> Add User</button>
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'users' ? 'active' : ''}`} onClick={() => setTab('users')}>
          <Users size={14} style={{ marginRight: 6 }} />Staff Members
        </button>
        <button className={`tab-btn ${tab === 'permissions' ? 'active' : ''}`} onClick={() => setTab('permissions')}>
          <Shield size={14} style={{ marginRight: 6 }} />Permissions Matrix
        </button>
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <>
          {tab === 'users' && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Status</th><th>Joined</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: '50%',
                            background: 'linear-gradient(135deg, var(--accent), var(--pink))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0
                          }}>{u.name[0]?.toUpperCase()}</div>
                          <div>
                            <div style={{ fontWeight: 500 }}>{u.name}</div>
                            {u.id === currentUser.id && <div style={{ fontSize: 11, color: 'var(--accent)' }}>You</div>}
                          </div>
                        </div>
                      </td>
                      <td style={{ color: 'var(--text2)', fontSize: 13 }}>{u.email}</td>
                      <td style={{ color: 'var(--text2)', fontSize: 13 }}>{u.phone || '—'}</td>
                      <td>{roleBadge(u.role)}</td>
                      <td>
                        {u.is_active
                          ? <span className="badge badge-green"><CheckCircle size={10} style={{ marginRight: 4 }} />Active</span>
                          : <span className="badge badge-red"><XCircle size={10} style={{ marginRight: 4 }} />Inactive</span>}
                      </td>
                      <td style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setModal(u)} title="Edit"><Edit2 size={13} /></button>
                          {u.id !== currentUser.id && (
                            <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(u.id)} title="Deactivate"><Trash2 size={13} /></button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'permissions' && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th style={{ textAlign: 'center' }}>
                      <span className="badge badge-purple">Owner</span>
                    </th>
                    <th style={{ textAlign: 'center' }}>
                      <span className="badge badge-blue">Manager</span>
                    </th>
                    <th style={{ textAlign: 'center' }}>
                      <span className="badge badge-gray">Cashier</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {PERMISSIONS_MATRIX.map((row, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 500 }}>{row.feature}</td>
                      {['owner', 'manager', 'cashier'].map(role => (
                        <td key={role} style={{ textAlign: 'center' }}>
                          {row[role]
                            ? <CheckCircle size={18} color="var(--green)" />
                            : <XCircle size={18} color="var(--border2)" />}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {modal && (
        <UserModal user={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />
      )}
    </div>
  );
}
