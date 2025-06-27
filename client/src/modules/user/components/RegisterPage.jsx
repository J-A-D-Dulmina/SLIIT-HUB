import React, { useState } from 'react';
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
    degree: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          enrolYear: form.enrolYear ? Number(form.enrolYear) : undefined,
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
              <option value="BSc (Hons) in Information Technology">BSc (Hons) in Information Technology</option>
              <option value="BSc (Hons) in Computer Science">BSc (Hons) in Computer Science</option>
              <option value="BSc (Hons) in Software Engineering">BSc (Hons) in Software Engineering</option>
              <option value="BSc (Hons) in Data Science">BSc (Hons) in Data Science</option>
              <option value="BSc (Hons) in Cyber Security">BSc (Hons) in Cyber Security</option>
              <option value="BSc (Hons) in Business Information Systems">BSc (Hons) in Business Information Systems</option>
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