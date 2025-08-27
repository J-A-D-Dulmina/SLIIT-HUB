import React, { useEffect, useState } from 'react';
import '../styles/AdminStudentsPage.css';
import { FaPencilAlt, FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';
import axios from 'axios';

const initialStudents = [];

const emptyStudent = { studentId: '', name: '', email: '', mobile: '', enrolYear: '', password: '' };

const AdminStudentsPage = () => {
  const [students, setStudents] = useState(initialStudents);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentForm, setStudentForm] = useState(emptyStudent);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPasswordTable, setShowPasswordTable] = useState({});
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await axios.get('http://localhost:5000/api/admin/students', { withCredentials: true });
      const rows = (res.data.students || []).map(s => ({
        id: s._id,
        studentId: s.studentId,
        name: s.name,
        email: s.email,
        mobile: s.mobile || '',
        enrolYear: String(s.enrolYear || ''),
        password: '********'
      }));
      setStudents(rows);
    } catch (e) {
      setError(e.response?.data?.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  // Modal open/close helpers
  const openAddModal = () => {
    setModalMode('add');
    setStudentForm(emptyStudent);
    setShowModal(true);
    setShowPasswordModal(false);
  };
  const openEditModal = (student) => {
    setModalMode('edit');
    setStudentForm({ ...student });
    setSelectedStudent(student);
    setShowModal(true);
    setShowPasswordModal(false);
  };
  const closeModal = () => {
    setShowModal(false);
    setSelectedStudent(null);
    setStudentForm(emptyStudent);
    setShowPasswordModal(false);
  };

  // Form changes
  const handleStudentFormChange = (e) => {
    const { name, value } = e.target;
    setStudentForm({ ...studentForm, [name]: value });
  };

  // Add/Edit Student
  const handleStudentFormSubmit = async (e) => {
    e.preventDefault();
    if (!studentForm.studentId.trim() || !studentForm.name.trim() || !studentForm.email.trim() || !studentForm.mobile.trim() || !studentForm.enrolYear.trim() || (modalMode === 'add' && !studentForm.password.trim())) return;
    try {
      if (modalMode === 'add') {
        await axios.post('http://localhost:5000/api/admin/students', {
          name: studentForm.name,
          email: studentForm.email,
          password: studentForm.password,
          studentId: studentForm.studentId,
          mobile: studentForm.mobile,
          enrolYear: studentForm.enrolYear
        }, { withCredentials: true });
      } else if (modalMode === 'edit' && selectedStudent) {
        await axios.put(`http://localhost:5000/api/admin/students/${selectedStudent.id}`, {
          name: studentForm.name,
          email: studentForm.email,
          mobile: studentForm.mobile,
          enrolYear: studentForm.enrolYear,
          password: studentForm.password && studentForm.password !== '********' ? studentForm.password : undefined
        }, { withCredentials: true });
      }
      await fetchStudents();
      closeModal();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to save student');
    }
  };

  // Delete Student (with confirmation)
  const handleDeleteStudent = (student) => {
    setStudentToDelete(student);
    setShowDeleteDialog(true);
  };
  const confirmDeleteStudent = async () => {
    try {
      await axios.delete(`http://localhost:5000/api/admin/students/${studentToDelete.id}`, { withCredentials: true });
      await fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete');
    }
    setShowDeleteDialog(false);
    setStudentToDelete(null);
  };

  // Table row click (edit modal)
  const handleRowClick = (student) => {
    openEditModal(student);
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
    <div className="students-admin-page full-width">
      <h2>Students Management</h2>
      <div className="students-table-actions">
        <div style={{ width: '100%', marginBottom: 8 }}>
          <input
            className="students-search-bar"
            type="text"
            placeholder="Search students..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="students-add-btn" onClick={openAddModal}>+ Add Student</button>
      </div>
      {error && <div className="error" style={{ marginBottom: 8 }}>{error}</div>}
      <div className="students-table-wrapper">
        <table className="students-table styled">
          <thead>
            <tr>
              <th>Student ID</th>
              <th>Name</th>
              <th>Email</th>
              <th>Mobile</th>
              <th>Enrol Year</th>
              <th>Password</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {(!loading ? students : []).filter(student => {
              const q = search.toLowerCase();
              return (
                student.studentId.toLowerCase().includes(q) ||
                student.name.toLowerCase().includes(q) ||
                student.email.toLowerCase().includes(q) ||
                student.mobile.toLowerCase().includes(q) ||
                student.enrolYear.toLowerCase().includes(q)
              );
            }).map(student => (
              <tr key={student.id} onClick={e => { if (e.target.tagName !== 'BUTTON') handleRowClick(student); }} className="students-row">
                <td>{student.studentId}</td>
                <td>{student.name}</td>
                <td>{student.email}</td>
                <td>{student.mobile}</td>
                <td>{student.enrolYear}</td>
                <td style={{ position: 'relative' }}>
                  <span style={{ userSelect: 'none' }}>{showPasswordTable[student.id] ? '********' : '•'.repeat(8)}</span>
                  <button
                    type="button"
                    className="students-password-toggle-btn"
                    style={{ background: 'none', border: 'none', marginLeft: 8, cursor: 'pointer', verticalAlign: 'middle' }}
                    onClick={e => { e.stopPropagation(); toggleShowPasswordTable(student.id); }}
                    tabIndex={-1}
                    title={showPasswordTable[student.id] ? 'Hide Password' : 'Show Password'}
                  >
                    {showPasswordTable[student.id] ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </td>
                <td style={{textAlign: 'right'}}>
                  <button type="button" className="students-edit-btn" onClick={e => { e.stopPropagation(); openEditModal(student); }} title="Edit">
                    <FaPencilAlt />
                  </button>
                  <button type="button" className="students-delete-btn" onClick={e => { e.stopPropagation(); handleDeleteStudent(student); }} title="Delete">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal for Add/Edit Student */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content wide">
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <h3>{modalMode === 'add' ? 'Add Student' : 'Edit Student'}</h3>
            <form className="modal-form" onSubmit={handleStudentFormSubmit}>
              <label>Student ID
                <input name="studentId" value={studentForm.studentId} onChange={handleStudentFormChange} required />
              </label>
              <label>Name
                <input name="name" value={studentForm.name} onChange={handleStudentFormChange} required />
              </label>
              <label>Email
                <input name="email" type="email" value={studentForm.email} onChange={handleStudentFormChange} required />
              </label>
              <label>Mobile
                <input name="mobile" value={studentForm.mobile} onChange={handleStudentFormChange} required />
              </label>
              <label>Enrol Year
                <input name="enrolYear" value={studentForm.enrolYear} onChange={handleStudentFormChange} required placeholder="e.g. 2023" />
              </label>
              <label>Password
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    name="password"
                    type={showPasswordModal ? 'text' : 'password'}
                    value={studentForm.password}
                    onChange={handleStudentFormChange}
                    required
                    style={{ flex: 1 }}
                  />
                  <button
                    type="button"
                    className="students-password-toggle-btn"
                    style={{ background: 'none', border: 'none', marginLeft: 8, cursor: 'pointer' }}
                    onClick={toggleShowPasswordModal}
                    tabIndex={-1}
                    title={showPasswordModal ? 'Hide Password' : 'Show Password'}
                  >
                    {showPasswordModal ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </label>
              <button type="submit" className="students-save-btn" style={{ marginTop: 16 }}>{modalMode === 'add' ? 'Add' : 'Update'}</button>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDeleteStudent}
        title="Delete Student"
        message={`Are you sure you want to delete the student "${studentToDelete?.name}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default AdminStudentsPage; 