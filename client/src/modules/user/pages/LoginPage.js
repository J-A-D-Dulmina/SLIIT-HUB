import React, { useState } from 'react';

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
    <div className="container-center">
      <form className="card" onSubmit={handleSubmit}>
        <h2 className="title">SLIIT HUB Login</h2>
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
        <button className="button" type="submit">
          Login
        </button>
      </form>
    </div>
  );
};

export default LoginPage;