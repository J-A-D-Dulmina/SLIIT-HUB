import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ForgotPasswordPage from './modules/user/components/ForgotPasswordPage.jsx';
import LoginPage from './modules/user/components/LoginPage.jsx';
import RegisterPage from './modules/user/components/RegisterPage.jsx';
import LandingPage from './modules/user/components/LandingPage.jsx';
import ProfilePage from './modules/user/components/ProfilePage.jsx';
import ModuleListPage from './modules/content/components/ModuleListPage.jsx';
import VideoListPage from './modules/content/components/VideoListPage.jsx';
import VideoDetailsPage from './modules/content/components/VideoDetailsPage.jsx';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/units" element={<ModuleListPage />} />
      <Route path="/modules/:degreeId/:yearId" element={<ModuleListPage />} />
      <Route path="/videos/:moduleId" element={<VideoListPage />} />
      <Route path="/video/:moduleId/:videoId" element={<VideoDetailsPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;