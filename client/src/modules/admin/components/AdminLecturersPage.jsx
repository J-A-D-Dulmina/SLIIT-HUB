import React, { useEffect, useState } from 'react';
import '../styles/AdminLecturersPage.css';
import { FaPencilAlt, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';
import axios from 'axios';

const initialLecturers = [];

const emptyLecturer = { lecturerId: '', name: '', email: '', mobile: '', modules: [], password: '' };

const AdminLecturersPage = () => {
  const [lecturers, setLecturers] = useState(initialLecturers);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedLecturer, setSelectedLecturer] = useState(null);
  const [lecturerForm, setLecturerForm] = useState(emptyLecturer);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPasswordTable, setShowPasswordTable] = useState({}); // {id: bool}
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [lecturerToDelete, setLecturerToDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchLecturers = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('http://localhost:5000/api/admin/lecturers', { withCredentials: true });
      const rows = (res.data.lecturers || []).map(l => ({
        id: l._id,
        lecturerId: l.lecturerId,
        name: l.name,
        email: l.email,
        mobile: l.mobile || '',
        modules: Array.isArray(l.modules) ? l.modules : [],
        password: '********'
      }));
      setLecturers(rows);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load lecturers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLecturers();
  }, []);

  // Modal open/close helpers
  const openAddModal = () => {
    setModalMode('add');
    setLecturerForm(emptyLecturer);
    setShowModal(true);
    setShowPasswordModal(false);
  };
  const openEditModal = (lecturer) => {
    setModalMode('edit');
    setLecturerForm({
      lecturerId: lecturer.lecturerId,
      name: lecturer.name,
      email: lecturer.email,
      mobile: lecturer.mobile,
      modules: lecturer.modules.join(', '),
      password: lecturer.password
    });
    setSelectedLecturer(lecturer);
    setShowModal(true);
    setShowPasswordModal(false);
  };
  const closeModal = () => {
    setShowModal(false);
    setSelectedLecturer(null);
    setLecturerForm(emptyLecturer);
    setShowPasswordModal(false);
  };

  // Form changes
  const handleLecturerFormChange = (e) => {
    const { name, value } = e.target;
    setLecturerForm({ ...lecturerForm, [name]: value });
  };

  // Add/Edit Lecturer
  const handleLecturerFormSubmit = async (e) => {
    e.preventDefault();
    if (!lecturerForm.lecturerId.trim() || !lecturerForm.name.trim() || !lecturerForm.email.trim() || !lecturerForm.mobile.trim() || (modalMode === 'add' && !lecturerForm.password.trim())) return;
    try {
      const modulesArr = (typeof lecturerForm.modules === 'string' ? lecturerForm.modules.split(',') : lecturerForm.modules).map(m => String(m).trim()).filter(Boolean);
      if (modalMode === 'add') {
        await axios.post('http://localhost:5000/api/admin/lecturers', {
          lecturerId: lecturerForm.lecturerId,
          name: lecturerForm.name,
          email: lecturerForm.email,
          password: lecturerForm.password,
          mobile: lecturerForm.mobile,
          modules: modulesArr
        }, { withCredentials: true });
      } else if (modalMode === 'edit' && selectedLecturer) {
        await axios.put(`http://localhost:5000/api/admin/lecturers/${selectedLecturer.id}`, {
          name: lecturerForm.name,
          email: lecturerForm.email,
          mobile: lecturerForm.mobile,
          modules: modulesArr,
          password: lecturerForm.password && lecturerForm.password !== '********' ? lecturerForm.password : undefined
        }, { withCredentials: true });
      }
      await fetchLecturers();
      closeModal();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save lecturer');
    }
  };

  // Delete Lecturer (with confirmation)
  const handleDeleteLecturer = (lecturer) => {
    setLecturerToDelete(lecturer);
    setShowDeleteDialog(true);
  };
  const confirmDeleteLecturer = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/lecturers/${lecturerToDelete.id}`, { withCredentials: true });
      await fetchLecturers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
    setShowDeleteDialog(false);
    setLecturerToDelete(null);
  };

  // Table row click (edit modal)
  const handleRowClick = (lecturer) => {
    openEditModal(lecturer);
  };

  // Toggle password visibility in table
  const toggleShowPasswordTable = (id) => {
    setShowPasswordTable(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Toggle password visibility in modal
  const toggleShowPasswordModal = () => {
    setShowPasswordModal(v => !v);
  };

  return (
    <div className="lecturers-admin-page full-width">
      <h2>Lecturers Management</h2>
      <div className="lecturers-table-actions">
        <div style={{ width: '100%', marginBottom: 8 }}>
          <input
            className="lecturers-search-bar"
            type="text"
            placeholder="Search lecturers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="lecturers-add-btn" onClick={openAddModal}>+ Add Lecturer</button>
      </div>
      {error && <div className="error" style={{ marginBottom: 8 }}>{error}</div>}
      <div className="lecturers-table-wrapper">
        <table className="lecturers-table styled">
          <thead>
            <tr>
              <th>Lecturer ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Modules</th>
              <th>Password</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(!loading ? lecturers : []).filter(lecturer => {
              const q = search.toLowerCase();
              return (
                lecturer.lecturerId.toLowerCase().includes(q) ||
                lecturer.name.toLowerCase().includes(q) ||
                lecturer.email.toLowerCase().includes(q) ||
                lecturer.mobile.toLowerCase().includes(q) ||
                lecturer.modules.join(', ').toLowerCase().includes(q)
              );
            }).map(lecturer => (
              <tr key={lecturer.id} onClick={e => { if (e.target.tagName !== 'BUTTON') handleRowClick(lecturer); }} className="lecturers-row">
                <td>{lecturer.lecturerId}</td>
                <td>{lecturer.name}</td>
                <td>{lecturer.email}</td>
                <td>{lecturer.mobile}</td>
                <td>{lecturer.modules.join(', ')}</td>
                <td style={{ position: 'relative' }}>
                  <span style={{ userSelect: 'none' }}>
                    {showPasswordTable[lecturer.id] ? lecturer.password : '•'.repeat(lecturer.password.length)}
                  </span>
                  <button
                    type="button"
                    className="lecturers-password-toggle-btn"
                    style={{ background: 'none', border: 'none', marginLeft: 8, cursor: 'pointer', verticalAlign: 'middle' }}
                    onClick={e => { e.stopPropagation(); toggleShowPasswordTable(lecturer.id); }}
                    tabIndex={-1}
                    title={showPasswordTable[lecturer.id] ? 'Hide Password' : 'Show Password'}
                  >
                    {showPasswordTable[lecturer.id] ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </td>
                <td style={{textAlign: 'right'}}>
                  <button type="button" className="lecturers-edit-btn" onClick={e => { e.stopPropagation(); openEditModal(lecturer); }} title="Edit">
                    <FaPencilAlt />
                  </button>
                  <button type="button" className="lecturers-delete-btn" onClick={e => { e.stopPropagation(); handleDeleteLecturer(lecturer); }} title="Delete">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal for Add/Edit Lecturer */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content wide">
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <h3>{modalMode === 'add' ? 'Add Lecturer' : 'Edit Lecturer'}</h3>
            <form className="modal-form" onSubmit={handleLecturerFormSubmit}>
              <label>Lecturer ID
                <input name="lecturerId" value={lecturerForm.lecturerId} onChange={handleLecturerFormChange} required />
              </label>
              <label>Name
                <input name="name" value={lecturerForm.name} onChange={handleLecturerFormChange} required />
              </label>
              <label>Email
                <input name="email" type="email" value={lecturerForm.email} onChange={handleLecturerFormChange} required />
              </label>
              <label>Mobile
                <input name="mobile" value={lecturerForm.mobile} onChange={handleLecturerFormChange} required />
              </label>
              <label>Modules (comma separated)
                <input name="modules" value={lecturerForm.modules} onChange={handleLecturerFormChange} placeholder="e.g. Programming, Networks" />
              </label>
              <label>Password
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    name="password"
                    type={showPasswordModal ? 'text' : 'password'}
                    value={lecturerForm.password}
                    onChange={handleLecturerFormChange}
                    required
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="lecturers-password-toggle-btn"
                    style={{ background: 'none', border: 'none', marginLeft: 8, cursor: 'pointer' }}
                    onClick={toggleShowPasswordModal}
                    tabIndex={-1}
                    title={showPasswordModal ? 'Hide Password' : 'Show Password'}
                  >
                    {showPasswordModal ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </label>
              <button type="submit" className="lecturers-save-btn" style={{ marginTop: 16 }}>{modalMode === 'add' ? 'Add' : 'Update'}</button>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDeleteLecturer}
        title="Delete Lecturer"
        message={`Are you sure you want to delete the lecturer "${lecturerToDelete?.name}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
  </div>
);
};

export default AdminLecturersPage; 