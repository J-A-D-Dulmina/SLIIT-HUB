import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './modules/user/pages/LoginPage';

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="*" element={<Navigate to="/login" />} />
  </Routes>
);

export default AppRoutes;