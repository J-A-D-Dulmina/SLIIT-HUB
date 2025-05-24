import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import '../../../styles/ForgotPassword.css';
// import logo from '../../../assets/sliithub-logo.png';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [step, setStep] = useState(1); // 1: Request reset, 2: Enter new password
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleRequestReset = (e) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      setMessage('Forgot password link sent to your email');
      setStep(2);
    }, 1000);
  };

  const handleResetPassword = (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    // Simulate API call
    setTimeout(() => {
      setMessage('Password reset successful');
      setError('');
    }, 1000);
  };

  return (
    <div className="reset-password-container">
      <div className="reset-password-card">
        <div className="logo-container">
          {/* <img src={logo} alt="SLIIT HUB Logo" className="logo" /> */}
        </div>
        <h2>Forgot Password</h2>
        
        {message && <div className="success-message">{message}</div>}
        {error && <div className="error-message">{error}</div>}
        
        {step === 1 ? (
          <form onSubmit={handleRequestReset}>
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            <button type="submit" className="reset-btn">Send Forgot Password Link</button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword}>
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                placeholder="Enter new password"
              />
            </div>
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Confirm new password"
              />
            </div>
            <button type="submit" className="reset-btn">Reset Password</button>
          </form>
        )}
        
        <div className="links">
          <Link to="/login" className="back-link">Back to Login</Link>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordPage; 