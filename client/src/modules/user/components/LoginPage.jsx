import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../../../assets/SLITT HUB logo.png';
import '../styles/loginpage.css';
import '../../../styles/main.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        // Save user info to localStorage (no token)
        localStorage.setItem('userType', data.userType);
        localStorage.setItem('userName', data.name);
        if (data.userType === 'student') {
          localStorage.setItem('studentId', data.studentId);
        } else if (data.userType === 'lecturer') {
          localStorage.setItem('lecturerId', data.lecturerId);
        }
      setError('');
      navigate('/dashboard');
    } else {
        setError(data.message || 'Invalid credentials.');
      }
    } catch (err) {
      setError('Server error.');
    }
  };

  return (
    <div className="login-background">
      <form className="login-card" onSubmit={handleSubmit}>
        <div className="login-logo">
          <img src={logo} alt="SLIIT HUB Logo" />
        </div>
        <h2 className="login-title">SLIIT HUB Login</h2>
        <div className="login-description">
          SLIIT HUB is your collaborative academic platform for sharing resources, real-time tutoring, and AI-powered learning support. Join the community and empower your learning!
        </div>
        {error && <div className="error">{error}</div>}
        <input
          className="input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
        />
        <div style={{ position: 'relative' }}>
        <input
          className="input"
            type={showPassword ? 'text' : 'password'}
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
            style={{ paddingRight: 40 }}
        />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748b',
              fontSize: 18
            }}
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </button>
        </div>
        <div className="login-button-row">
          <button className="button login-button" type="submit">
            Login
          </button>
        </div>
        <div className="login-links">
          <a href="/forgot-password" className="login-link">Forgot password?</a>
          <span className="login-divider">|</span>
          <a href="/register" className="login-link">Create an account</a>
        </div>
      </form>
    </div>
  );
};

export default LoginPage;