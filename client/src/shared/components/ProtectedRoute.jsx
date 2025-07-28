import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner.jsx';

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const location = useLocation();

  useEffect(() => {
    fetch('http://localhost:5000/api/protected', { credentials: 'include' })
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then((data) => {
        if (data.user && data.user.userType) {
          localStorage.setItem('userType', data.user.userType);
          setUserType(data.user.userType);
        }
        setAuthenticated(true);
        setLoading(false);
      })
      .catch(() => {
        setAuthenticated(false);
        setUserType(null);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <LoadingSpinner message="Checking authentication..." size="fullscreen" />;
  }

  // Role-based route protection
  const path = location.pathname;
  if (!authenticated) {
    return <Navigate to="/login" replace />;
  }
  if (path.startsWith('/admin') && userType !== 'admin') {
    // Only admin can access /admin routes
    return <Navigate to="/login" replace />;
  }
  if (!path.startsWith('/admin') && userType === 'admin') {
    // Admin should not access student/lecturer routes
    return <Navigate to="/admin-dashboard" replace />;
  }
  return children;
};

export default ProtectedRoute; 