import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ForgotPasswordPage from './modules/user/pages/ForgotPasswordPage.jsx';
import LoginPage from './modules/user/pages/LoginPage.jsx';
import RegisterPage from './modules/user/pages/RegisterPage.jsx';
import LandingPage from './modules/user/pages/LandingPage.jsx';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<LandingPage />} />
    </Routes>
  );
};

export default AppRoutes;