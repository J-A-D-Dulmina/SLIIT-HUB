import React, { useState } from 'react';

const initialStudents = [
  { id: 1, name: 'Alice Smith', email: 'alice@uni.edu', status: 'active' },
  { id: 2, name: 'Bob Lee', email: 'bob@uni.edu', status: 'active' },
];

const AdminStudentsPage = () => {
  const [students, setStudents] = useState(initialStudents);

  const editStudent = (id) => {
    const name = prompt('New student name?');
    if (name) setStudents(students.map(s => s.id === id ? { ...s, name } : s));
  };
  const deleteStudent = (id) => setStudents(students.filter(s => s.id !== id));

  return (
    <div className="admin-students-page">
      <h2>Manage Students</h2>
      <ul className="admin-student-list">
        {students.map(student => (
          <li key={student.id} className="admin-student-card">
            <div className="admin-student-name">{student.name}</div>
            <div className="admin-student-email">{student.email}</div>
            <div className="admin-student-actions">
              <button onClick={() => editStudent(student.id)} className="admin-edit-btn">Edit</button>
              <button onClick={() => deleteStudent(student.id)} className="admin-delete-btn">Delete</button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminStudentsPage; 