import React, { useState } from 'react';
import '../styles/AdminDegreesPage.css';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';

const initialDegrees = [
  {
    id: 1,
    name: 'BSc in IT',
    code: 'IT101',
    yearCount: 3,
    years: [
      {
        yearNumber: 1,
        semesterCount: 2,
        semesters: [
          { semesterNumber: 1, modules: [ { id: 1, code: 'IT1011', name: 'Programming' } ] },
          { semesterNumber: 2, modules: [ { id: 2, code: 'IT1012', name: 'Networks' } ] },
        ],
      },
      {
        yearNumber: 2,
        semesterCount: 2,
        semesters: [
          { semesterNumber: 1, modules: [ { id: 3, code: 'IT2011', name: 'Databases' } ] },
          { semesterNumber: 2, modules: [] },
        ],
      },
      {
        yearNumber: 3,
        semesterCount: 2,
        semesters: [
          { semesterNumber: 1, modules: [] },
          { semesterNumber: 2, modules: [] },
        ],
      },
    ],
  },
];

function getDegreeYearCount(degree) {
  return degree.years.length;
}
function getDegreeSemesterCount(degree) {
  return degree.years.reduce((acc, y) => acc + y.semesters.length, 0);
}
function getDegreeModuleCount(degree) {
  return degree.years.reduce(
    (acc, y) => acc + y.semesters.reduce((sacc, s) => sacc + s.modules.length, 0),
    0
  );
}

const emptyDegree = { name: '', code: '', yearCount: 1, years: [] };

const AdminDegreesPage = () => {
  const [degrees, setDegrees] = useState(initialDegrees);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [selectedDegree, setSelectedDegree] = useState(null);
  const [degreeForm, setDegreeForm] = useState(emptyDegree);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  // For modal tab navigation and module management
  const [activeYearTab, setActiveYearTab] = useState(0);
  const [activeSemesterTab, setActiveSemesterTab] = useState({}); // {yearIdx: semesterIdx}
  const [semesterCounts, setSemesterCounts] = useState({}); // {yearIdx: count}
  const [moduleInputs, setModuleInputs] = useState({}); // {yearIdx: {semIdx: {code, name}}}
  const [editingModule, setEditingModule] = useState({}); // {yearIdx, semIdx, modIdx, code, name}

  // Modal open/close helpers
  const openAddModal = () => {
    setModalMode('add');
    setDegreeForm(emptyDegree);
    setShowModal(true);
    setActiveYearTab(0);
    setActiveSemesterTab({});
    setSemesterCounts({});
    setModuleInputs({});
    setEditingModule({});
  };
  const openEditModal = (degree) => {
    setModalMode('edit');
    setDegreeForm(JSON.parse(JSON.stringify(degree)));
    setSelectedDegree(degree);
    setShowModal(true);
    setActiveYearTab(0);
    setActiveSemesterTab({});
    setSemesterCounts({});
    setModuleInputs({});
    setEditingModule({});
  };
  const closeModal = () => {
    setShowModal(false);
    setSelectedDegree(null);
    setDegreeForm(emptyDegree);
    setActiveYearTab(0);
    setActiveSemesterTab({});
    setSemesterCounts({});
    setModuleInputs({});
    setEditingModule({});
  };

  // Degree form changes
  const handleDegreeFormChange = (e) => {
    const { name, value } = e.target;
    if (name === 'yearCount') {
      const count = Math.max(1, Number(value));
      // Generate years array if needed
      let years = [...degreeForm.years];
      if (count > years.length) {
        for (let i = years.length + 1; i <= count; i++) {
          years.push({ yearNumber: i, semesterCount: 1, semesters: [ { semesterNumber: 1, modules: [] } ] });
        }
      } else if (count < years.length) {
        years = years.slice(0, count);
      }
      setDegreeForm({ ...degreeForm, yearCount: count, years });
    } else {
      setDegreeForm({ ...degreeForm, [name]: value });
    }
  };

  // Semester count per year
  const handleSemesterCountChange = (yearIdx, value) => {
    const count = Math.max(1, Number(value));
    let years = [...degreeForm.years];
    let semesters = [...years[yearIdx].semesters];
    if (count > semesters.length) {
      for (let i = semesters.length + 1; i <= count; i++) {
        semesters.push({ semesterNumber: i, modules: [] });
      }
    } else if (count < semesters.length) {
      semesters = semesters.slice(0, count);
    }
    years[yearIdx].semesterCount = count;
    years[yearIdx].semesters = semesters;
    setDegreeForm({ ...degreeForm, years });
  };

  // Module management
  const handleModuleInput = (yIdx, sIdx, field, value) => {
    setModuleInputs({
      ...moduleInputs,
      [yIdx]: {
        ...(moduleInputs[yIdx] || {}),
        [sIdx]: {
          ...(moduleInputs[yIdx]?.[sIdx] || {}),
          [field]: value,
        },
      },
    });
  };
  const handleAddModule = (yIdx, sIdx) => {
    const mod = moduleInputs[yIdx]?.[sIdx];
    if (!mod || !mod.code?.trim() || !mod.name?.trim()) return;
    const years = [...degreeForm.years];
    years[yIdx].semesters[sIdx].modules = [
      ...years[yIdx].semesters[sIdx].modules,
      { id: Date.now(), code: mod.code, name: mod.name },
    ];
    setDegreeForm({ ...degreeForm, years });
    setModuleInputs({
      ...moduleInputs,
      [yIdx]: {
        ...(moduleInputs[yIdx] || {}),
        [sIdx]: { code: '', name: '' },
      },
    });
  };
  const handleEditModule = (yIdx, sIdx, mIdx) => {
    const mod = degreeForm.years[yIdx].semesters[sIdx].modules[mIdx];
    setEditingModule({ yIdx, sIdx, mIdx, code: mod.code, name: mod.name });
  };
  const handleUpdateModule = () => {
    const { yIdx, sIdx, mIdx, code, name } = editingModule;
    const years = [...degreeForm.years];
    years[yIdx].semesters[sIdx].modules[mIdx] = { ...years[yIdx].semesters[sIdx].modules[mIdx], code, name };
    setDegreeForm({ ...degreeForm, years });
    setEditingModule({});
  };
  const handleDeleteModule = (yIdx, sIdx, mIdx) => {
    const years = [...degreeForm.years];
    years[yIdx].semesters[sIdx].modules = years[yIdx].semesters[sIdx].modules.filter((_, i) => i !== mIdx);
    setDegreeForm({ ...degreeForm, years });
  };

  // Add/Edit Degree
  const handleDegreeFormSubmit = (e) => {
    e.preventDefault();
    if (!degreeForm.name.trim() || !degreeForm.code.trim()) return;
    if (modalMode === 'add') {
      setDegrees([
        ...degrees,
        { ...degreeForm, id: Date.now() },
      ]);
    } else if (modalMode === 'edit' && selectedDegree) {
      setDegrees(degrees.map(d => d.id === selectedDegree.id ? { ...degreeForm, id: d.id } : d));
    }
    closeModal();
  };

  // Delete Degree
  const handleDeleteDegree = (degree) => {
    setSelectedDegree(degree);
    setShowDeleteDialog(true);
  };
  const confirmDeleteDegree = () => {
    setDegrees(degrees.filter(d => d.id !== selectedDegree.id));
    setShowDeleteDialog(false);
    closeModal();
  };

  // Table row click (edit modal)
  const handleRowClick = (degree) => {
    openEditModal(degree);
  };

  // Tab navigation
  const handleYearTabClick = (idx) => setActiveYearTab(idx);
  const handleSemesterTabClick = (yearIdx, semIdx) => setActiveSemesterTab({ ...activeSemesterTab, [yearIdx]: semIdx });

  return (
    <div className="admin-degrees-page full-width">
      <h2>Degrees Management</h2>
      <div className="degree-table-actions">
        <button className="add-btn" onClick={openAddModal}>+ Add Degree</button>
      </div>
      <div className="degree-table-wrapper">
        <table className="degree-table styled">
          <thead>
            <tr>
              <th>Degree Name</th>
              <th>Code</th>
              <th>Year Count</th>
              <th>Semester Count</th>
              <th>Module Count</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {degrees.map(degree => (
              <tr key={degree.id} onClick={e => { if (e.target.tagName !== 'BUTTON') handleRowClick(degree); }} className="degree-row">
                <td>{degree.name}</td>
                <td>{degree.code}</td>
                <td>{getDegreeYearCount(degree)}</td>
                <td>{getDegreeSemesterCount(degree)}</td>
                <td>{getDegreeModuleCount(degree)}</td>
                <td style={{textAlign: 'right'}}>
                  <button type="button" className="edit-btn" onClick={e => { e.stopPropagation(); openEditModal(degree); }}>Edit</button>
                  <button type="button" className="delete-btn" onClick={e => { e.stopPropagation(); handleDeleteDegree(degree); }}>Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Modal for Add/Edit Degree */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content wide">
            <button className="modal-close" onClick={closeModal}>&times;</button>
            <h3>{modalMode === 'add' ? 'Add Degree' : 'Edit Degree'}</h3>
            <form className="modal-form" onSubmit={handleDegreeFormSubmit}>
              <label>Degree Name
                <input name="name" value={degreeForm.name} onChange={handleDegreeFormChange} required />
              </label>
              <label>Degree Code
                <input name="code" value={degreeForm.code} onChange={handleDegreeFormChange} required />
              </label>
              <label>Year Count
                <input name="yearCount" type="number" min={1} max={6} value={degreeForm.yearCount} onChange={handleDegreeFormChange} required />
              </label>
              {/* Year Tabs */}
              <div className="modal-section">
                <div className="modal-tabs">
                  {degreeForm.years.map((year, yIdx) => (
                    <button
                      key={yIdx}
                      type="button"
                      className={`modal-tab${activeYearTab === yIdx ? ' active' : ''}`}
                      onClick={() => handleYearTabClick(yIdx)}
                    >
                      Year {year.yearNumber}
                    </button>
                  ))}
                </div>
                {/* Semester Count for Active Year */}
                {degreeForm.years[activeYearTab] && (
                  <div className="modal-semester-count">
                    <label>Semester Count for Year {degreeForm.years[activeYearTab].yearNumber}
                      <input
                        type="number"
                        min={1}
                        max={4}
                        value={degreeForm.years[activeYearTab].semesterCount}
                        onChange={e => handleSemesterCountChange(activeYearTab, e.target.value)}
                        required
                      />
                    </label>
                  </div>
                )}
                {/* Semester Tabs for Active Year */}
                {degreeForm.years[activeYearTab] && (
                  <div className="modal-tabs semester-tabs">
                    {degreeForm.years[activeYearTab].semesters.map((sem, sIdx) => (
                      <button
                        key={sIdx}
                        type="button"
                        className={`modal-tab${(activeSemesterTab[activeYearTab] || 0) === sIdx ? ' active' : ''}`}
                        onClick={() => handleSemesterTabClick(activeYearTab, sIdx)}
                      >
                        Semester {sem.semesterNumber}
                      </button>
                    ))}
                  </div>
                )}
                {/* Module Management for Active Semester */}
                {degreeForm.years[activeYearTab] && degreeForm.years[activeYearTab].semesters[(activeSemesterTab[activeYearTab] || 0)] && (
                  <div className="modal-modules-list">
                    <div className="modal-module-add">
                      <input
                        type="text"
                        placeholder="Module code"
                        value={moduleInputs[activeYearTab]?.[(activeSemesterTab[activeYearTab] || 0)]?.code || ''}
                        onChange={e => handleModuleInput(activeYearTab, (activeSemesterTab[activeYearTab] || 0), 'code', e.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Module name"
                        value={moduleInputs[activeYearTab]?.[(activeSemesterTab[activeYearTab] || 0)]?.name || ''}
                        onChange={e => handleModuleInput(activeYearTab, (activeSemesterTab[activeYearTab] || 0), 'name', e.target.value)}
                      />
                      <button type="button" className="add-btn" onClick={() => handleAddModule(activeYearTab, (activeSemesterTab[activeYearTab] || 0))}>Add Module</button>
                    </div>
                    <div style={{width: '100%'}}>
                      <table className="modal-module-table" style={{width: '100%'}}>
                        <thead>
                          <tr>
                            <th style={{width: '20%'}}>Code</th>
                            <th style={{width: '60%'}}>Name</th>
                            <th style={{width: '20%', textAlign: 'right'}}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {degreeForm.years[activeYearTab].semesters[(activeSemesterTab[activeYearTab] || 0)].modules.map((mod, mIdx) => (
                            <tr key={mod.id}>
                              {editingModule.yIdx === activeYearTab && editingModule.sIdx === (activeSemesterTab[activeYearTab] || 0) && editingModule.mIdx === mIdx ? (
                                <>
                                  <td><input type="text" value={editingModule.code} onChange={e => setEditingModule({ ...editingModule, code: e.target.value })} /></td>
                                  <td><input type="text" value={editingModule.name} onChange={e => setEditingModule({ ...editingModule, name: e.target.value })} /></td>
                                  <td style={{textAlign: 'right'}}>
                                    <button type="button" className="update-btn" onClick={handleUpdateModule}>Update</button>
                                    <button type="button" className="cancel-btn" onClick={() => setEditingModule({})}>Cancel</button>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td>{mod.code}</td>
                                  <td>{mod.name}</td>
                                  <td style={{textAlign: 'right'}}>
                                    <button type="button" className="edit-btn" onClick={() => handleEditModule(activeYearTab, (activeSemesterTab[activeYearTab] || 0), mIdx)}>Edit</button>
                                    <button type="button" className="delete-btn" onClick={() => handleDeleteModule(activeYearTab, (activeSemesterTab[activeYearTab] || 0), mIdx)}>Delete</button>
                                  </td>
                                </>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
              <button type="submit" className="update-btn" style={{ marginTop: 16 }}>{modalMode === 'add' ? 'Add' : 'Update'}</button>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDeleteDegree}
        title="Delete Degree"
        message={`Are you sure you want to delete the degree "${selectedDegree?.name}"? This cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </div>
  );
};

export default AdminDegreesPage; 