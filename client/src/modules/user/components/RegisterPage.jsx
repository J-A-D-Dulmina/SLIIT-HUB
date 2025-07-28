import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Register.css';
import logo from '../../../assets/SLITT HUB logo.png';

const RegisterPage = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'student',
    studentId: '',
    mobile: '',
    enrolYear: '',
    degree: ''
  });
  const [degrees, setDegrees] = useState([]);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/degrees')
      .then(res => res.json())
      .then(data => setDegrees(data))
      .catch(() => setDegrees([]));
  }, []);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // Dynamic year/semester/module options
  const selectedDegree = degrees.find(d => d._id === form.degree);
  const years = selectedDegree ? selectedDegree.years : [];
  const selectedYear = years.find(y => String(y.yearNumber) === String(form.year));
  const semesters = selectedYear ? selectedYear.semesters : [];
  const selectedSemester = semesters.find(s => String(s.semesterNumber) === String(form.semester));
  const modules = selectedSemester ? selectedSemester.modules : [];

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('http://localhost:5000/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          ...form,
          enrolYear: form.enrolYear ? Number(form.enrolYear) : undefined,
          degree: form.degree // send _id
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage('Registration successful! You can now log in.');
        setForm({ name: '', email: '', password: '', role: 'student', studentId: '', mobile: '', enrolYear: '', degree: '' });
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Server error');
    }
    setLoading(false);
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <div className="logo-container">
          <img src={logo} alt="SLIIT HUB Logo" className="logo" />
        </div>
        <h2>Create an Account</h2>
        
        {message && (
          <div className="success-message">{message}</div>
        )}
        
        {error && (
          <div className="error-message">{error}</div>
        )}
        
        <form onSubmit={handleSubmit} autoComplete="off">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your name"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                autoComplete="off"
              />
            </div>
          </div>
          
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Enter your password"
              autoComplete="new-password"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="studentId">Student ID</label>
            <input
              type="text"
              id="studentId"
              name="studentId"
              value={form.studentId}
              onChange={handleChange}
              placeholder="Enter your student ID"
            />
          </div>
          
          {/* Degree Dropdown */}
          <div className="form-group">
            <label htmlFor="degree">Degree</label>
            <select
              id="degree"
              name="degree"
              value={form.degree}
              onChange={handleChange}
              required
            >
              <option value="">Select your degree</option>
              {degrees.map(degree => (
                <option key={degree._id} value={degree._id}>{degree.name}</option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="mobile">Mobile</label>
            <input
              type="text"
              id="mobile"
              name="mobile"
              value={form.mobile}
              onChange={handleChange}
              placeholder="Enter your mobile number"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="enrolYear">Enrol Year</label>
            <input
              type="text"
              id="enrolYear"
              name="enrolYear"
              value={form.enrolYear}
              onChange={handleChange}
              placeholder="Enter your enrolment year"
            />
          </div>
          
          <button type="submit" disabled={loading} className="register-btn">
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <div className="links">
          <p>Already have an account? <Link to="/login" className="login-link">Login</Link></p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;