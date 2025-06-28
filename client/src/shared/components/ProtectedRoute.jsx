import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner.jsx';

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    console.log('ProtectedRoute: Checking authentication...');
    fetch('http://localhost:5000/api/protected', { credentials: 'include' })
      .then(res => {
        console.log('ProtectedRoute: Response status:', res.status);
        return res.ok ? res.json() : Promise.reject(res);
      })
      .then((data) => {
        console.log('ProtectedRoute: Authentication successful:', data);
        setAuthenticated(true);
        setLoading(false);
      })
      .catch((error) => {
        console.log('ProtectedRoute: Authentication failed:', error);
        setAuthenticated(false);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." size="fullscreen" />;
  }
  
  if (!authenticated) {
    console.log('ProtectedRoute: Redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  console.log('ProtectedRoute: Rendering protected content');
  return children;
};

export default ProtectedRoute; 