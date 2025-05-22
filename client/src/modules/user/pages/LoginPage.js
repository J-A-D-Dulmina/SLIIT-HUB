import React, { useState } from 'react';
import logo from '../../../shared/assets/SLITT HUB logo.png';
import '../../../shared/styles/loginpage.css';
import '../../../shared/styles/main.css';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please enter both username and password.');
      return;
    }
    if (username === 'admin' && password === 'password') {
      setError('');
      alert('Login successful!');
      // You can redirect or set auth state here
    } else {
      setError('Invalid credentials.');
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
          type="text"
          placeholder="Username"
          value={username}
          onChange={e => setUsername(e.target.value)}
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
        />
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