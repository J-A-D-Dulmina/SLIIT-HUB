import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ForgotPasswordPage from './modules/user/pages/ForgotPasswordPage.jsx';
import LoginPage from './modules/user/pages/LoginPage.jsx';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      {/* Add more routes here as you create more pages */}
    </Routes>
  );
};

export default AppRoutes;