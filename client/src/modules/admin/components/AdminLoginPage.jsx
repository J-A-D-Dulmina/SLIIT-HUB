import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      if (response.ok) {
        localStorage.setItem('role', 'admin');
        setError('');
        navigate('/admin-dashboard');
      } else {
        const data = await response.json();
        setError(data.message || 'Invalid admin credentials.');
      }
    } catch (err) {
      setError('Server error.');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <form onSubmit={handleSubmit} style={{ background: '#fff', padding: 32, borderRadius: 12, boxShadow: '0 2px 12px rgba(0,0,0,0.08)', minWidth: 320 }}>
        <h2 style={{ marginBottom: 24 }}>Admin Login</h2>
        {error && <div style={{ color: '#dc2626', marginBottom: 16 }}>{error}</div>}
        <input
          type="email"
          placeholder="Admin Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', marginBottom: 16, padding: 10, borderRadius: 6, border: '1px solid #e2e8f0' }}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', marginBottom: 24, padding: 10, borderRadius: 6, border: '1px solid #e2e8f0' }}
        />
        <button type="submit" style={{ width: '100%', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, padding: 12, fontWeight: 600, fontSize: 16, cursor: 'pointer' }}>
          Login
        </button>
      </form>
    </div>
  );
};

export default AdminLoginPage; 