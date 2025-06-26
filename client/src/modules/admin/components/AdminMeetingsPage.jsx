import React, { useState } from 'react';

const initialMeetings = [
  { id: 1, title: 'AI Tutorial', date: '2024-06-01', status: 'scheduled' },
  { id: 2, title: 'Research Review', date: '2024-06-05', status: 'completed' },
];

const AdminMeetingsPage = () => {
  const [meetings, setMeetings] = useState(initialMeetings);

  const editMeeting = (id) => {
    const title = prompt('New meeting title?');
    if (title) setMeetings(meetings.map(m => m.id === id ? { ...m, title } : m));
  };
  const deleteMeeting = (id) => setMeetings(meetings.filter(m => m.id !== id));

  return (
    <div className="admin-meetings-page">
      <h2>Manage Meetings</h2>
      <ul className="admin-meeting-list">
        {meetings.map(meeting => (
          <li key={meeting.id} className="admin-meeting-card">
            <div className="admin-meeting-title">{meeting.title}</div>
            <div className="admin-meeting-date">{meeting.date}</div>
            <div className="admin-meeting-actions">
              <button onClick={() => editMeeting(meeting.id)} className="admin-edit-btn">Edit</button>
              <button onClick={() => deleteMeeting(meeting.id)} className="admin-delete-btn">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminMeetingsPage; 