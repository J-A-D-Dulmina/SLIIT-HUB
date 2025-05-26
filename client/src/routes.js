import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ForgotPasswordPage from './modules/user/components/ForgotPasswordPage.jsx';
import LoginPage from './modules/user/components/LoginPage.jsx';
import RegisterPage from './modules/user/components/RegisterPage.jsx';
import LandingPage from './modules/user/components/LandingPage.jsx';
import ProfilePage from './modules/user/components/ProfilePage.jsx';
import ModuleListPage from './modules/content/components/ModuleListPage.jsx';
import VideoListPage from './modules/content/components/VideoListPage.jsx';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/dashboard" element={<LandingPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/units" element={<ModuleListPage />} />
      <Route path="/videos/:moduleId" element={<VideoListPage />} />
    </Routes>
  );
};

export default AppRoutes;