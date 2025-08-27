import React, { useEffect, useMemo, useState } from 'react';
import { FaCopy } from 'react-icons/fa';

const UploadResourceModal = ({
  isOpen,
  onClose,
  onSubmit,
  degreeOptions,
}) => {
  const [form, setForm] = useState({
    title: '',
    description: '',
    type: '',
    degree: '',
    year: '',
    semester: '',
    module: '',
    visibility: 'public',
    file: null,
  });

  // Reset state on open/close
  useEffect(() => {
    if (!isOpen) {
      setForm({
        title: '', description: '', type: '', degree: '', year: '', semester: '', module: '', visibility: 'public', file: null,
      });
    }
  }, [isOpen]);

  const yearOptions = useMemo(() => {
    const d = degreeOptions.find(d => d._id === form.degree);
    return d?.years || [];
  }, [degreeOptions, form.degree]);

  const semesterOptions = useMemo(() => {
    const d = degreeOptions.find(d => d._id === form.degree);
    const y = d?.years?.find(y => String(y.yearNumber) === String(form.year));
    return y?.semesters || [];
  }, [degreeOptions, form.degree, form.year]);

  const moduleOptions = useMemo(() => {
    const d = degreeOptions.find(d => d._id === form.degree);
    const y = d?.years?.find(y => String(y.yearNumber) === String(form.year));
    const s = y?.semesters?.find(s => String(s.semesterNumber) === String(form.semester));
    return s?.modules || [];
  }, [degreeOptions, form.degree, form.year, form.semester]);

  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm(prev => ({ ...prev, [name]: files ? files[0] : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { alert('Please enter a title for the resource'); return; }
    if (!form.file) { alert('Please select a file to upload'); return; }
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => { if (v) fd.append(k, v); });
    await onSubmit(fd);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="modal-overlay"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
    >
      <div 
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        onKeyUp={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2>Upload Resource</h2>
          <button 
            className="close-btn"
            onClick={onClose}
          >
            ×
          </button>
        </div>
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSubmit(e); }}
          onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.preventDefault(); }}
          onKeyUp={(e) => e.stopPropagation()}
        >
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              type="text"
              id="title"
              name="title"
              value={form.title}
              onChange={handleChange}
              onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.preventDefault(); }}
              placeholder="Resource Title"
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.preventDefault(); }}
              placeholder="Resource Description"
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="degree">Degree</label>
              <select
                id="degree"
                name="degree"
                value={form.degree}
                onChange={handleChange}
                onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.preventDefault(); }}
              >
                <option value="">Select Degree</option>
                {degreeOptions.map(degree => (
                  <option key={degree._id} value={degree._id}>{degree.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="type">Resource Type</label>
              <select
                id="type"
                name="type"
                value={form.type}
                onChange={handleChange}
                onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.preventDefault(); }}
              >
                <option value="">Select Type</option>
                {['Documents','Presentations','Notes','Assignments','Others'].map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="year">Degree Year</label>
              <select
                id="year"
                name="year"
                value={form.year}
                onChange={handleChange}
                onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.preventDefault(); }}
              >
                <option value="">Select Year</option>
                {yearOptions.map(year => (
                  <option key={year.yearNumber} value={year.yearNumber}>Year {year.yearNumber}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="semester">Semester</label>
              <select
                id="semester"
                name="semester"
                value={form.semester}
                onChange={handleChange}
                onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.preventDefault(); }}
              >
                <option value="">Select Semester</option>
                {semesterOptions.map(sem => (
                  <option key={sem.semesterNumber} value={sem.semesterNumber}>Semester {sem.semesterNumber}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="module">Module</label>
            <select
              id="module"
              name="module"
              value={form.module}
              onChange={handleChange}
              onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.preventDefault(); }}
            >
              <option value="">Select Module</option>
              {moduleOptions.map(mod => (
                <option key={mod.code} value={mod.code}>{mod.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="file">File</label>
            <input
              type="file"
              id="file"
              name="file"
              onChange={handleChange}
              onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.preventDefault(); }}
              accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,.rar"
            />
            <p className="file-hint">Supported formats: PDF, DOC, DOCX, PPT, PPTX, ZIP, RAR</p>
          </div>

          <div className="form-group">
            <label>Visibility</label>
            <select
              name="visibility"
              value={form.visibility}
              onChange={handleChange}
              onKeyDown={(e) => { e.stopPropagation(); if (e.key === 'Enter') e.preventDefault(); }}
            >
              <option value="public">Public (visible to everyone)</option>
              <option value="private">Private (only you; share by link)</option>
            </select>
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="submit-btn">
              Upload Resource
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default React.memo(UploadResourceModal);


