import React, { useState, useEffect } from 'react';
import '../styles/AdminAdminsPage.css';
import { FaPencilAlt, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';
import Toast from '../../../shared/components/Toast';

const initialAdmins = [
  { id: 1, name: 'Super Admin', email: 'super@admin.com', mobile: '0711111111', password: 'admin123' },
  { id: 2, name: 'John Doe', email: 'john@admin.com', mobile: '0722222222', password: 'johnpass' },
];

const emptyAdmin = { name: '', email: '', mobile: '', password: '' };

const AdminAdminsPage = () => {
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [adminForm, setAdminForm] = useState(emptyAdmin);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [search, setSearch] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPasswordTable, setShowPasswordTable] = useState({});
  const [toastMessage, setToastMessage] = useState('');
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);

  // Fetch admins from backend
  useEffect(() => {
    setLoading(true);
    fetch('/api/admins', { credentials: 'include' })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => {
        setAdmins(data.admins || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load admins');
        setLoading(false);
      });
  }, []);

  // Modal open/close helpers
  const openAddModal = () => {
    setModalMode('add');
    setAdminForm(emptyAdmin);
    setShowModal(true);
    setShowPasswordModal(false);
  };
  const openEditModal = (admin) => {
    setModalMode('edit');
    setAdminForm({ ...admin, password: '' }); // Always blank password field
    setSelectedAdmin(admin);
    setShowModal(true);
    setShowPasswordModal(false);
  };
  const closeModal = () => {
    setShowModal(false);
    setSelectedAdmin(null);
    setAdminForm(emptyAdmin);
    setShowPasswordModal(false);
  };

  // Form changes
  const handleAdminFormChange = (e) => {
    const { name, value } = e.target;
    setAdminForm({ ...adminForm, [name]: value });
  };

  // Add/Edit Admin
  const handleAdminFormSubmit = async (e) => {
    e.preventDefault();
    if (!adminForm.name.trim() || !adminForm.email.trim() || !adminForm.mobile.trim() || !adminForm.password.trim()) return;
    if (modalMode === 'edit') {
      setShowUpdateConfirm(true);
      return;
    }
    try {
      if (modalMode === 'add') {
        const res = await fetch('/api/admins', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(adminForm)
        });
        if (res.ok) {
          const newAdmin = await res.json();
          setAdmins([newAdmin, ...admins]);
        } else {
          setError('Failed to add admin');
        }
      } else if (modalMode === 'edit' && selectedAdmin) {
        const res = await fetch(`/api/admins/${selectedAdmin._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify(adminForm)
        });
        if (res.ok) {
          const updatedAdmin = await res.json();
          setAdmins(admins.map(a => a._id === updatedAdmin._id ? updatedAdmin : a));
          setToastMessage('Admin updated successfully!');
          setTimeout(() => setToastMessage(''), 3000);
        } else {
          setError('Failed to update admin');
        }
      }
    } catch {
      setError('Server error');
    }
    closeModal();
  };

  const confirmUpdateAdmin = async () => {
    setShowUpdateConfirm(false);
    try {
      const res = await fetch(`/api/admins/${selectedAdmin._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(adminForm)
      });
      if (res.ok) {
        const updatedAdmin = await res.json();
        // Set password to blank in the list after update
        setAdmins(admins.map(a => a._id === updatedAdmin._id ? { ...updatedAdmin, password: '' } : a));
        setToastMessage('Admin updated successfully!');
        setTimeout(() => setToastMessage(''), 3000);
      } else {
        setError('Failed to update admin');
      }
    } catch {
      setError('Server error');
    }
    closeModal();
  };

  // Delete Admin
  const handleDeleteAdmin = (admin) => {
    setSelectedAdmin(admin);
    setShowDeleteDialog(true);
  };
  const confirmDeleteAdmin = async () => {
    try {
      const res = await fetch(`/api/admins/${selectedAdmin._id}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      if (res.ok) {
        setAdmins(admins.filter(a => a._id !== selectedAdmin._id));
      } else {
        setError('Failed to delete admin');
      }
    } catch {
      setError('Server error');
    }
    setShowDeleteDialog(false);
    setSelectedAdmin(null);
  };

  // Password show/hide
  const toggleShowPasswordModal = () => {
    setShowPasswordModal(v => !v);
  };
  const toggleShowPasswordTable = (id) => {
    setShowPasswordTable(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="admins-admin-page full-width">
      <h2>Admins Management</h2>
      <div className="admins-table-actions" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <input
          className="admins-search-bar"
          type="text"
          placeholder="Search admins..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button className="admins-add-btn" onClick={openAddModal}>+ Add Admin</button>
      </div>
      <div className="admins-table-wrapper">
        <table className="admins-table styled">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Password</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {admins.filter(a => {
              const q = search.toLowerCase();
              return (
                (a.name || '').toLowerCase().includes(q) ||
                (a.email || '').toLowerCase().includes(q) ||
                (a.mobile || '').toLowerCase().includes(q)
              );
            }).map(a => (
              <tr key={a._id || a.id} className="admins-row">
                <td>{a.name}</td>
                <td>{a.email}</td>
                <td>{a.mobile}</td>
                <td style={{ position: 'relative' }}>
                  {/* Never show the real or hashed password. Always show dots. */}
                  <span style={{ userSelect: 'none' }}>
                    {'•'.repeat(8)}
                  </span>
                </td>
                <td style={{textAlign: 'right'}}>
                  <button type="button" className="admins-edit-btn" onClick={() => openEditModal(a)} title="Edit"><FaPencilAlt /></button>
                  <button type="button" className="admins-delete-btn" onClick={() => handleDeleteAdmin(a)} title="Delete"><FaTrash /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal for Add/Edit Admin */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <h3>{modalMode === 'add' ? 'Add Admin' : 'Edit Admin'}</h3>
            <form className="modal-form" onSubmit={handleAdminFormSubmit}>
              <label>Name
                <input name="name" value={adminForm.name} onChange={handleAdminFormChange} required />
              </label>
              <label>Email
                <input name="email" type="email" value={adminForm.email} onChange={handleAdminFormChange} required />
              </label>
              <label>Mobile
                <input name="mobile" value={adminForm.mobile} onChange={handleAdminFormChange} required />
              </label>
              <label>Password
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    name="password"
                    type={showPasswordModal ? 'text' : 'password'}
                    value={adminForm.password}
                    onChange={handleAdminFormChange}
                    required
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="admins-password-toggle-btn"
                    style={{ background: 'none', border: 'none', marginLeft: 8, cursor: 'pointer' }}
                    onClick={toggleShowPasswordModal}
                    tabIndex={-1}
                    title={showPasswordModal ? 'Hide Password' : 'Show Password'}
                  >
                    {showPasswordModal ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </label>
              <button type="submit" className="admins-save-btn" style={{ marginTop: 16 }}>{modalMode === 'add' ? 'Add' : 'Update'}</button>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDeleteAdmin}
        title="Delete Admin"
        message={`Are you sure you want to delete this admin? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
      <ConfirmationDialog
        isOpen={showUpdateConfirm}
        onClose={() => setShowUpdateConfirm(false)}
        onConfirm={confirmUpdateAdmin}
        title="Confirm Update"
        message="Are you sure you want to update this admin's details?"
        confirmText="Update"
        cancelText="Cancel"
        type="info"
      />
      <Toast message={toastMessage} onClose={() => setToastMessage('')} />
    </div>
  );
};

export default AdminAdminsPage; 