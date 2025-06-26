import React, { useState } from 'react';
import '../styles/AdminDashboardPage.css';

const initialDegrees = [
  { id: 1, name: 'BSc in IT', modules: [
    { id: 1, name: 'Programming', semesters: [1, 2] },
    { id: 2, name: 'Networks', semesters: [1] }
  ]},
  { id: 2, name: 'BSc in Software Engineering', modules: [
    { id: 3, name: 'Software Design', semesters: [1, 2] }
  ]}
];
const initialLecturers = [
  { id: 1, name: 'Dr. John Smith', email: 'john@uni.edu' },
  { id: 2, name: 'Prof. Sarah Johnson', email: 'sarah@uni.edu' }
];

const AdminDashboardPage = () => {
  const [degrees, setDegrees] = useState(initialDegrees);
  const [lecturers, setLecturers] = useState(initialLecturers);

  // Degree/Module/Semester handlers (mock)
  const addDegree = () => {
    const name = prompt('Degree name?');
    if (name) setDegrees([...degrees, { id: Date.now(), name, modules: [] }]);
  };
  const editDegree = (id) => {
    const name = prompt('New degree name?');
    if (name) setDegrees(degrees.map(d => d.id === id ? { ...d, name } : d));
  };
  const deleteDegree = (id) => setDegrees(degrees.filter(d => d.id !== id));

  const addModule = (degreeId) => {
    const name = prompt('Module name?');
    if (name) setDegrees(degrees.map(d => d.id === degreeId ? { ...d, modules: [...d.modules, { id: Date.now(), name, semesters: [] }] } : d));
  };
  const editModule = (degreeId, moduleId) => {
    const name = prompt('New module name?');
    if (name) setDegrees(degrees.map(d => d.id === degreeId ? { ...d, modules: d.modules.map(m => m.id === moduleId ? { ...m, name } : m) } : d));
  };
  const deleteModule = (degreeId, moduleId) => setDegrees(degrees.map(d => d.id === degreeId ? { ...d, modules: d.modules.filter(m => m.id !== moduleId) } : d));

  const addSemester = (degreeId, moduleId) => {
    const sem = prompt('Semester number?');
    if (sem) setDegrees(degrees.map(d => d.id === degreeId ? { ...d, modules: d.modules.map(m => m.id === moduleId ? { ...m, semesters: [...m.semesters, Number(sem)] } : m) } : d));
  };
  const deleteSemester = (degreeId, moduleId, sem) => setDegrees(degrees.map(d => d.id === degreeId ? { ...d, modules: d.modules.map(m => m.id === moduleId ? { ...m, semesters: m.semesters.filter(s => s !== sem) } : m) } : d));

  // Lecturer handlers (mock)
  const addLecturer = () => {
    const name = prompt('Lecturer name?');
    const email = prompt('Lecturer email?');
    if (name && email) setLecturers([...lecturers, { id: Date.now(), name, email }]);
  };
  const editLecturer = (id) => {
    const name = prompt('New lecturer name?');
    const email = prompt('New lecturer email?');
    if (name && email) setLecturers(lecturers.map(l => l.id === id ? { ...l, name, email } : l));
  };
  const deleteLecturer = (id) => setLecturers(lecturers.filter(l => l.id !== id));

  return (
    <div className="admin-dashboard-page">
      <h2>Admin Dashboard</h2>
      <section className="admin-section">
        <h3>Degrees & Modules</h3>
        <button onClick={addDegree} className="admin-btn add">Add Degree</button>
        {degrees.map(degree => (
          <div key={degree.id} className="admin-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <strong>{degree.name}</strong>
              <button onClick={() => editDegree(degree.id)} className="admin-btn edit">Edit</button>
              <button onClick={() => deleteDegree(degree.id)} className="admin-btn delete">Delete</button>
              <button onClick={() => addModule(degree.id)} className="admin-btn add">Add Module</button>
            </div>
            <ul className="admin-list" style={{ marginTop: 8 }}>
              {degree.modules.map(module => (
                <li key={module.id} className="admin-list-item">
                  <span style={{ fontWeight: 500 }}>{module.name}</span>
                  <button onClick={() => editModule(degree.id, module.id)} className="admin-btn edit">Edit</button>
                  <button onClick={() => deleteModule(degree.id, module.id)} className="admin-btn delete">Delete</button>
                  <button onClick={() => addSemester(degree.id, module.id)} className="admin-btn add">Add Semester</button>
                  <span style={{ marginLeft: 8 }}>Semesters: {module.semesters.join(', ')}</span>
                  {module.semesters.map(sem => (
                    <button key={sem} onClick={() => deleteSemester(degree.id, module.id, sem)} className="admin-btn delete">Remove {sem}</button>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
      <section className="admin-section">
        <h3>Lecturers</h3>
        <button onClick={addLecturer} className="admin-btn add">Add Lecturer</button>
        <ul className="admin-list">
          {lecturers.map(lect => (
            <li key={lect.id} className="admin-list-item">
              <span style={{ fontWeight: 500 }}>{lect.name} ({lect.email})</span>
              <button onClick={() => editLecturer(lect.id)} className="admin-btn edit">Edit</button>
              <button onClick={() => deleteLecturer(lect.id)} className="admin-btn delete">Delete</button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
};

export default AdminDashboardPage; 