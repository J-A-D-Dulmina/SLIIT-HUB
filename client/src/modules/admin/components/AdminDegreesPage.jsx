import React, { useState, useEffect, useRef } from 'react';
import '../styles/AdminDegreesPage.css';
import ConfirmationDialog from '../../../shared/components/ConfirmationDialog';
import { FaPencilAlt, FaTrash, FaTimes } from 'react-icons/fa';
import * as FaIcons from 'react-icons/fa';
import Toast from '../../../shared/components/Toast';

const API_URL = '/api/admin/degrees';

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

const emptyDegree = { name: '', code: '', yearCount: 1, years: [], icon: '' };

const AdminDegreesPage = () => {
  const [degrees, setDegrees] = useState([]);
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
  const [search, setSearch] = useState('');
  const [showIconPicker, setShowIconPicker] = useState(false);
  const iconPickerRef = useRef(null);
  const [showDeleteModuleDialog, setShowDeleteModuleDialog] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState(null);
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);
  const [showUpdateToast, setShowUpdateToast] = useState(false);

  // Fetch degrees from backend on mount
  useEffect(() => {
    fetch(API_URL)
      .then(res => res.json())
      .then(data => setDegrees(data))
      .catch(() => setDegrees([]));
  }, []);

  useEffect(() => {
    if (!showIconPicker) return;
    function handleClickOutside(event) {
      if (iconPickerRef.current && !iconPickerRef.current.contains(event.target)) {
        setShowIconPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showIconPicker]);

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
      {
        id: Date.now(),
        code: mod.code,
        name: mod.name,
        credit: mod.credit ? Number(mod.credit) : 0,
        description: mod.description || ''
      },
    ];
    setDegreeForm({ ...degreeForm, years });
    setModuleInputs({
      ...moduleInputs,
      [yIdx]: {
        ...(moduleInputs[yIdx] || {}),
        [sIdx]: { code: '', name: '', credit: '', description: '' },
      },
    });
  };
  const handleEditModule = (yIdx, sIdx, mIdx) => {
    const mod = degreeForm.years[yIdx].semesters[sIdx].modules[mIdx];
    setEditingModule({ yIdx, sIdx, mIdx, code: mod.code, name: mod.name, credit: mod.credit || '', description: mod.description || '' });
  };
  const handleUpdateModule = () => {
    const { yIdx, sIdx, mIdx, code, name, credit, description } = editingModule;
    const years = [...degreeForm.years];
    years[yIdx].semesters[sIdx].modules[mIdx] = {
      ...years[yIdx].semesters[sIdx].modules[mIdx],
      code,
      name,
      credit: credit ? Number(credit) : 0,
      description: description || ''
    };
    setDegreeForm({ ...degreeForm, years });
    setEditingModule({});
  };
  const handleDeleteModule = (yIdx, sIdx, mIdx) => {
    setModuleToDelete({ yIdx, sIdx, mIdx });
    setShowDeleteModuleDialog(true);
  };
  const confirmDeleteModule = async () => {
    if (!moduleToDelete) return;
    const { yIdx, sIdx, mIdx } = moduleToDelete;
    const years = [...degreeForm.years];
    years[yIdx].semesters[sIdx].modules = years[yIdx].semesters[sIdx].modules.filter((_, i) => i !== mIdx);
    // Update backend only if _id exists
    if (degreeForm._id) {
      try {
        const res = await fetch(`/api/admin/degrees/${degreeForm._id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...degreeForm, years })
        });
        if (res.ok) {
          setDegreeForm({ ...degreeForm, years });
          setDegrees(degrees => degrees.map(d => (d._id === degreeForm._id ? { ...d, years } : d)));
        } else {
          alert('Failed to update degree in database');
        }
      } catch {
        alert('Server error');
      }
    } else {
      setDegreeForm({ ...degreeForm, years });
    }
    setShowDeleteModuleDialog(false);
    setModuleToDelete(null);
  };

  // Add/Edit Degree
  const handleDegreeFormSubmit = (e) => {
    e.preventDefault();
    setShowUpdateConfirm(true);
  };
  const confirmDegreeUpdate = async () => {
    setShowUpdateConfirm(false);
    if (modalMode === 'add') {
      // Add new degree
      try {
        const res = await fetch(`/api/admin/degrees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(degreeForm)
        });
        if (res.ok) {
          const newDegree = await res.json();
          setDegrees(degrees => [...degrees, newDegree]);
          setShowUpdateToast(true);
          setTimeout(() => setShowUpdateToast(false), 2500);
          closeModal();
        } else {
          alert('Failed to add degree to database');
        }
      } catch {
        alert('Server error');
      }
      return;
    }
    // Only update if _id exists
    if (!degreeForm._id) {
      alert('Cannot update: Degree ID is missing.');
      return;
    }
    try {
      const res = await fetch(`/api/admin/degrees/${degreeForm._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(degreeForm)
      });
      if (res.ok) {
        // Fetch latest degree data from backend
        const updated = await fetch(`/api/admin/degrees/${degreeForm._id}`);
        if (updated.ok) {
          const updatedDegree = await updated.json();
          setDegreeForm(updatedDegree);
          setDegrees(degrees => degrees.map(d => (d._id === updatedDegree._id ? updatedDegree : d)));
        }
        setShowUpdateToast(true);
        setTimeout(() => setShowUpdateToast(false), 2500);
        closeModal();
      } else {
        alert('Failed to update degree in database');
      }
    } catch {
      alert('Server error');
    }
  };

  // Delete Degree
  const handleDeleteDegree = (degree) => {
    setSelectedDegree(degree);
    setShowDeleteDialog(true);
  };
  const confirmDeleteDegree = async () => {
    if (!selectedDegree) return;
    const degreeId = selectedDegree._id || selectedDegree.id;
    if (!degreeId) {
      alert('Cannot delete: Degree ID is missing.');
      setShowDeleteDialog(false);
      closeModal();
      return;
    }
    const res = await fetch(`${API_URL}/${degreeId}`, {
      method: 'DELETE'
    });
    if (res.ok) {
      setDegrees(degrees.filter(d => (d._id || d.id) !== degreeId));
    }
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

  // Curated list of degree-related icons
  const DEGREE_ICONS = [
    'FaGraduationCap', 'FaLaptopCode', 'FaCode', 'FaDatabase', 'FaNetworkWired', 'FaMobileAlt', 'FaCloud', 'FaBook', 'FaChalkboardTeacher', 'FaMicroscope', 'FaFlask', 'FaRobot', 'FaGlobe', 'FaChartBar', 'FaCalculator', 'FaClipboardList', 'FaCogs', 'FaCompass', 'FaDraftingCompass', 'FaFileAlt', 'FaFileCode', 'FaFileExcel', 'FaFilePowerpoint', 'FaFileWord', 'FaFolderOpen', 'FaKeyboard', 'FaLanguage', 'FaLightbulb', 'FaMap', 'FaPalette', 'FaPenNib', 'FaProjectDiagram', 'FaPuzzlePiece', 'FaRuler', 'FaSchool', 'FaServer', 'FaTabletAlt', 'FaUniversity', 'FaUserGraduate', 'FaUsers', 'FaVial', 'FaAtom', 'FaBrain', 'FaBookOpen', 'FaChalkboard', 'FaClipboard', 'FaCube', 'FaCubes', 'FaDesktop', 'FaGlobeAmericas', 'FaLayerGroup', 'FaPenFancy', 'FaShapes', 'FaUserTie', 'FaWrench'
  ];

  return (
    <div className="admin-degrees-page full-width">
      <h2>Degrees Management</h2>
      <div className="degree-table-actions">
        <div style={{ width: '100%', marginBottom: 8 }}>
          <input
            className="degrees-search-bar"
            type="text"
            placeholder="Search degrees..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <button className="add-btn" onClick={openAddModal}>+ Add Degree</button>
      </div>
      <div className="degree-table-wrapper">
        <table className="degree-table styled">
          <thead>
            <tr>
              <th>Icon</th>
              <th>Degree Name</th>
              <th>Code</th>
              <th>Year Count</th>
              <th>Semester Count</th>
              <th>Module Count</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {degrees.filter(degree => {
              const q = search.toLowerCase();
              return (
                degree.name.toLowerCase().includes(q) ||
                degree.code.toLowerCase().includes(q) ||
                degree.years.some(y => y.semesters.some(s => s.modules.some(m => m.name.toLowerCase().includes(q) || m.code.toLowerCase().includes(q))))
              );
            }).map(degree => (
              <tr key={degree.id || degree._id} onClick={e => { if (e.target.tagName !== 'BUTTON') handleRowClick(degree); }} className="degree-row">
                <td style={{textAlign: 'center'}}>
                  {degree.icon && FaIcons[degree.icon]
                    ? React.createElement(FaIcons[degree.icon], { style: { fontSize: 22 } })
                    : React.createElement(FaIcons.FaGraduationCap, { style: { fontSize: 22 } })}
                </td>
                <td>{degree.name}</td>
                <td>{degree.code}</td>
                <td>{getDegreeYearCount(degree)}</td>
                <td>{getDegreeSemesterCount(degree)}</td>
                <td>{getDegreeModuleCount(degree)}</td>
                <td style={{textAlign: 'right'}}>
                  <button type="button" className="degree-edit-btn" onClick={e => { e.stopPropagation(); openEditModal(degree); }} title="Edit">
                    <FaPencilAlt />
                  </button>
                  <button type="button" className="degree-delete-btn" onClick={e => { e.stopPropagation(); handleDeleteDegree(degree); }} title="Delete">
                    <FaTrash />
                  </button>
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
              <label>Degree Icon (optional)
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    type="button"
                    onClick={() => setShowIconPicker(true)}
                    style={{
                      border: '1px solid #ccc',
                      background: '#fff',
                      borderRadius: 8,
                      padding: '4px 10px',
                      cursor: 'pointer',
                      fontSize: 16
                    }}
                  >
                    {degreeForm.icon && FaIcons[degreeForm.icon]
                      ? React.createElement(FaIcons[degreeForm.icon], { style: { fontSize: 22, marginRight: 6, verticalAlign: 'middle' } })
                      : 'Choose Icon'}
                  </button>
                  {degreeForm.icon && (
                    <button
                      type="button"
                      onClick={() => setDegreeForm({ ...degreeForm, icon: '' })}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: '#e11d48',
                        fontSize: 20,
                        cursor: 'pointer',
                        marginLeft: 2
                      }}
                      title="Remove icon"
                    >
                      <FaTimes />
                    </button>
                  )}
                </div>
                {showIconPicker && (
                  <div
                    ref={iconPickerRef}
                    style={{
                      position: 'absolute',
                      zIndex: 1000,
                      background: '#fff',
                      border: '1px solid #ccc',
                      borderRadius: 10,
                      padding: 16,
                      boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      marginTop: 8,
                      maxWidth: 350,
                      maxHeight: 300,
                      overflowY: 'auto',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: 10
                    }}
                  >
                    {DEGREE_ICONS.map(iconName => (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => { setDegreeForm({ ...degreeForm, icon: iconName }); setShowIconPicker(false); }}
                        style={{
                          border: degreeForm.icon === iconName ? '2px solid #3b82f6' : '1px solid #ccc',
                          background: degreeForm.icon === iconName ? '#e0f2fe' : '#fff',
                          borderRadius: 8,
                          padding: 6,
                          cursor: 'pointer',
                          outline: 'none',
                          fontSize: 22,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 38,
                          height: 38
                        }}
                        title={iconName}
                      >
                        {FaIcons[iconName] ? React.createElement(FaIcons[iconName]) : null}
                      </button>
                    ))}
                  </div>
                )}
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
                      <input
                        type="number"
                        placeholder="Credits"
                        value={moduleInputs[activeYearTab]?.[(activeSemesterTab[activeYearTab] || 0)]?.credit || ''}
                        onChange={e => handleModuleInput(activeYearTab, (activeSemesterTab[activeYearTab] || 0), 'credit', e.target.value)}
                        min={1}
                        style={{ width: 80 }}
                      />
                      <input
                        type="text"
                        placeholder="Short description"
                        value={moduleInputs[activeYearTab]?.[(activeSemesterTab[activeYearTab] || 0)]?.description || ''}
                        onChange={e => handleModuleInput(activeYearTab, (activeSemesterTab[activeYearTab] || 0), 'description', e.target.value)}
                        style={{ width: 180 }}
                      />
                      <button type="button" className="add-btn" onClick={() => handleAddModule(activeYearTab, (activeSemesterTab[activeYearTab] || 0))}>Add Module</button>
                    </div>
                    <div style={{width: '100%'}}>
                      <table className="modal-module-table" style={{width: '100%'}}>
                        <thead>
                          <tr>
                            <th style={{width: '15%'}}>Code</th>
                            <th style={{width: '30%'}}>Name</th>
                            <th style={{width: '10%'}}>Credits</th>
                            <th style={{width: '30%'}}>Description</th>
                            <th style={{width: '15%', textAlign: 'right'}}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {degreeForm.years[activeYearTab].semesters[(activeSemesterTab[activeYearTab] || 0)].modules.map((mod, mIdx) => (
                            <tr key={mod.id || mIdx}>
                              {editingModule.yIdx === activeYearTab && editingModule.sIdx === (activeSemesterTab[activeYearTab] || 0) && editingModule.mIdx === mIdx ? (
                                <>
                                  <td><input type="text" value={editingModule.code} onChange={e => setEditingModule({ ...editingModule, code: e.target.value })} /></td>
                                  <td><input type="text" value={editingModule.name} onChange={e => setEditingModule({ ...editingModule, name: e.target.value })} /></td>
                                  <td><input type="number" value={editingModule.credit} onChange={e => setEditingModule({ ...editingModule, credit: e.target.value })} style={{ width: 80 }} /></td>
                                  <td><input type="text" value={editingModule.description} onChange={e => setEditingModule({ ...editingModule, description: e.target.value })} style={{ width: 180 }} /></td>
                                  <td style={{textAlign: 'right'}}>
                                    <button type="button" className="update-btn" onClick={handleUpdateModule}>Update</button>
                                    <button type="button" className="cancel-btn" onClick={() => setEditingModule({})}>Cancel</button>
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td>{mod.code}</td>
                                  <td>{mod.name}</td>
                                  <td>{mod.credit}</td>
                                  <td>{mod.description}</td>
                                  <td style={{textAlign: 'right'}}>
                                    <span style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                                      <button type="button" className="module-edit-btn" onClick={() => handleEditModule(activeYearTab, (activeSemesterTab[activeYearTab] || 0), mIdx)} title="Edit">
                                        <FaPencilAlt />
                                      </button>
                                      <button type="button" className="module-delete-btn" onClick={() => handleDeleteModule(activeYearTab, (activeSemesterTab[activeYearTab] || 0), mIdx)} title="Delete">
                                        <FaTrash />
                                      </button>
                                    </span>
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
      {/* Confirmation dialog for deleting a module */}
      <ConfirmationDialog
        isOpen={showDeleteModuleDialog}
        onClose={() => setShowDeleteModuleDialog(false)}
        onConfirm={confirmDeleteModule}
        title="Delete Module"
        message="Are you sure you want to delete this module? This cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
      <ConfirmationDialog
        isOpen={showUpdateConfirm}
        onClose={() => setShowUpdateConfirm(false)}
        onConfirm={confirmDegreeUpdate}
        title={modalMode === 'add' ? 'Confirm Add' : 'Confirm Update'}
        message={modalMode === 'add' ? 'Are you sure you want to add this degree and all its modules?' : 'Are you sure you want to update this degree and all its modules?'}
        confirmText="Confirm"
        cancelText="Cancel"
        type="success"
      />
      <Toast message={showUpdateToast ? 'Update complete!' : ''} onClose={() => setShowUpdateToast(false)} />
    </div>
  );
};

export default AdminDegreesPage; 