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
import TutoringPage from './modules/tutoring/components/TutoringPage.jsx';
import JoinMeetingPage from './modules/meetings/components/JoinMeetingPage.jsx';
import MyMeetingsPage from './modules/meetings/components/MyMeetingsPage.jsx';
import ResourcesPage from './modules/resources/components/ResourcesPage.jsx';

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
      <Route path="/tutoring" element={<TutoringPage />} />
      <Route path="/join-meeting" element={<JoinMeetingPage />} />
      <Route path="/my-meetings" element={<MyMeetingsPage />} />
      <Route path="/resources" element={<ResourcesPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;