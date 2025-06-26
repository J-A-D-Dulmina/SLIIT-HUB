import React, { useState } from 'react';
import '../styles/AdminAnnouncementsPage.css';
import { FaPencilAlt, FaTrash } from 'react-icons/fa';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';

const initialAnnouncements = [
  { id: 1, text: 'Exam Timetable Released', date: '2024-06-01' },
  { id: 2, text: 'System Maintenance on June 5th', date: '2024-05-28' },
];

const emptyAnnouncement = { text: '', date: '' };

const AdminAnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [announcementForm, setAnnouncementForm] = useState(emptyAnnouncement);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [search, setSearch] = useState('');

  // Modal open/close helpers
  const openAddModal = () => {
    setModalMode('add');
    setAnnouncementForm(emptyAnnouncement);
    setShowModal(true);
  };
  const openEditModal = (announcement) => {
    setModalMode('edit');
    setAnnouncementForm({ text: announcement.text, date: announcement.date });
    setSelectedAnnouncement(announcement);
    setShowModal(true);
  };
  const closeModal = () => {
    setShowModal(false);
    setSelectedAnnouncement(null);
    setAnnouncementForm(emptyAnnouncement);
  };

  // Form changes
  const handleAnnouncementFormChange = (e) => {
    const { name, value } = e.target;
    setAnnouncementForm({ ...announcementForm, [name]: value });
  };

  // Add/Edit Announcement
  const handleAnnouncementFormSubmit = (e) => {
    e.preventDefault();
    if (!announcementForm.text.trim() || !announcementForm.date.trim()) return;
    if (modalMode === 'add') {
      setAnnouncements([
        { ...announcementForm, id: Date.now() },
        ...announcements,
      ]);
    } else if (modalMode === 'edit' && selectedAnnouncement) {
      setAnnouncements(announcements.map(a => a.id === selectedAnnouncement.id ? { ...announcementForm, id: a.id } : a));
    }
    closeModal();
  };

  // Delete Announcement
  const handleDeleteAnnouncement = (announcement) => {
    setSelectedAnnouncement(announcement);
    setShowDeleteDialog(true);
  };
  const confirmDeleteAnnouncement = () => {
    setAnnouncements(announcements.filter(a => a.id !== selectedAnnouncement.id));
    setShowDeleteDialog(false);
    setSelectedAnnouncement(null);
  };

  return (
    <div className="announcements-admin-page full-width">
      <h2>Announcements Management</h2>
      <div className="announcements-actions" style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
        <input
          className="announcements-search-bar"
          type="text"
          placeholder="Search announcements..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ marginBottom: 0 }}
        />
        <button className="announcements-add-btn" onClick={openAddModal}>+ Add Announcement</button>
      </div>
      <ul className="announcements-list">
        {announcements.filter(a => {
          const q = search.toLowerCase();
          return (
            a.text.toLowerCase().includes(q) ||
            a.date.toLowerCase().includes(q)
          );
        }).map(a => (
          <li key={a.id} className="announcements-item">
            <div className="announcements-text">{a.text}</div>
            <div className="announcements-date">{a.date}</div>
            <div className="announcements-actions-row">
              <button type="button" className="announcements-edit-btn" onClick={() => openEditModal(a)} title="Edit"><FaPencilAlt /></button>
              <button type="button" className="announcements-delete-btn" onClick={() => handleDeleteAnnouncement(a)} title="Delete"><FaTrash /></button>
            </div>
          </li>
        ))}
      </ul>
      {/* Modal for Add/Edit Announcement */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <h3>{modalMode === 'add' ? 'Add Announcement' : 'Edit Announcement'}</h3>
            <form className="modal-form" onSubmit={handleAnnouncementFormSubmit}>
              <label>Announcement Text
                <textarea name="text" value={announcementForm.text} onChange={handleAnnouncementFormChange} required rows={3} />
              </label>
              <label>Date
                <input name="date" type="date" value={announcementForm.date} onChange={handleAnnouncementFormChange} required />
              </label>
              <button type="submit" className="announcements-save-btn" style={{ marginTop: 16 }}>{modalMode === 'add' ? 'Add' : 'Update'}</button>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDeleteAnnouncement}
        title="Delete Announcement"
        message={`Are you sure you want to delete this announcement? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default AdminAnnouncementsPage; 