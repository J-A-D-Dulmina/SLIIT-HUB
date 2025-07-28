import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import LoadingSpinner from './LoadingSpinner.jsx';
import axios from 'axios';

const ProtectedRoute = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userType, setUserType] = useState(null);
  const location = useLocation();

  useEffect(() => {
    axios.get('http://localhost:5000/api/protected', { withCredentials: true })
      .then((res) => {
        if (res.data.user && res.data.user.userType) {
          localStorage.setItem('userType', res.data.user.userType);
          setUserType(res.data.user.userType);
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