import React, { useState } from 'react';
import '../styles/AdminAdminsPage.css';
import { FaPencilAlt, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';

const initialAdmins = [
  { id: 1, name: 'Super Admin', email: 'super@admin.com', mobile: '0711111111', password: 'admin123' },
  { id: 2, name: 'John Doe', email: 'john@admin.com', mobile: '0722222222', password: 'johnpass' },
];

const emptyAdmin = { name: '', email: '', mobile: '', password: '' };

const AdminAdminsPage = () => {
  const [admins, setAdmins] = useState(initialAdmins);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [adminForm, setAdminForm] = useState(emptyAdmin);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [search, setSearch] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPasswordTable, setShowPasswordTable] = useState({});

  // Modal open/close helpers
  const openAddModal = () => {
    setModalMode('add');
    setAdminForm(emptyAdmin);
    setShowModal(true);
    setShowPasswordModal(false);
  };
  const openEditModal = (admin) => {
    setModalMode('edit');
    setAdminForm({ ...admin });
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
  const handleAdminFormSubmit = (e) => {
    e.preventDefault();
    if (!adminForm.name.trim() || !adminForm.email.trim() || !adminForm.mobile.trim() || !adminForm.password.trim()) return;
    if (modalMode === 'add') {
      setAdmins([
        { ...adminForm, id: Date.now() },
        ...admins,
      ]);
    } else if (modalMode === 'edit' && selectedAdmin) {
      setAdmins(admins.map(a => a.id === selectedAdmin.id ? { ...adminForm, id: a.id } : a));
    }
    closeModal();
  };

  // Delete Admin
  const handleDeleteAdmin = (admin) => {
    setSelectedAdmin(admin);
    setShowDeleteDialog(true);
  };
  const confirmDeleteAdmin = () => {
    setAdmins(admins.filter(a => a.id !== selectedAdmin.id));
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
                a.name.toLowerCase().includes(q) ||
                a.email.toLowerCase().includes(q) ||
                a.mobile.toLowerCase().includes(q)
              );
            }).map(a => (
              <tr key={a.id} className="admins-row">
                <td>{a.name}</td>
                <td>{a.email}</td>
                <td>{a.mobile}</td>
                <td style={{ position: 'relative' }}>
                  <span style={{ userSelect: 'none' }}>
                    {showPasswordTable[a.id] ? a.password : '•'.repeat(a.password.length)}
                  </span>
                  <button
                    type="button"
                    className="admins-password-toggle-btn"
                    style={{ background: 'none', border: 'none', marginLeft: 8, cursor: 'pointer', verticalAlign: 'middle' }}
                    onClick={e => { e.stopPropagation(); toggleShowPasswordTable(a.id); }}
                    tabIndex={-1}
                    title={showPasswordTable[a.id] ? 'Hide Password' : 'Show Password'}
                  >
                    {showPasswordTable[a.id] ? <FaEyeSlash /> : <FaEye />}
                  </button>
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
    </div>
  );
};

export default AdminAdminsPage; 