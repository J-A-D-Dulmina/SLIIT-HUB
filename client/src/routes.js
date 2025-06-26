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
import CalendarPage from './modules/calendar/components/CalendarPage.jsx';
import AIToolPage from './modules/ai/components/AIToolPage.jsx';
import MeetingPage from './modules/communication/components/MeetingPage.jsx';
import MyRecommendationsPage from './modules/lecturer/components/MyRecommendationsPage.jsx';
import AdminLoginPage from './modules/admin/components/AdminLoginPage.jsx';
import AdminLayout from './modules/admin/components/AdminLayout.jsx';
import AdminDashboardHome from './modules/admin/components/AdminDashboardHome.jsx';
import AdminVideosPage from './modules/admin/components/AdminVideosPage.jsx';
import AdminStudentsPage from './modules/admin/components/AdminStudentsPage.jsx';
import AdminMeetingsPage from './modules/admin/components/AdminMeetingsPage.jsx';
import AdminDegreesPage from './modules/admin/components/AdminDegreesPage.jsx';
import AdminLecturersPage from './modules/admin/components/AdminLecturersPage.jsx';
import AdminAnnouncementsPage from './modules/admin/components/AdminAnnouncementsPage.jsx';
import AdminAdminsPage from './modules/admin/components/AdminAdminsPage.jsx';

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
      <Route path="/meeting/:meetingId" element={<MeetingPage />} />
      <Route path="/resources" element={<ResourcesPage />} />
      <Route path="/calendar" element={<CalendarPage />} />
      <Route path="/ai-tool" element={<AIToolPage />} />
      <Route path="/my-recommendations" element={<MyRecommendationsPage />} />
      <Route path="/admin-dashboard" element={<AdminLayout><AdminDashboardHome /></AdminLayout>} />
      <Route path="/admin-degrees" element={<AdminLayout><AdminDegreesPage /></AdminLayout>} />
      <Route path="/admin-lecturers" element={<AdminLayout><AdminLecturersPage /></AdminLayout>} />
      <Route path="/admin-students" element={<AdminLayout><AdminStudentsPage /></AdminLayout>} />
      <Route path="/admin-videos" element={<AdminLayout><AdminVideosPage /></AdminLayout>} />
      <Route path="/admin-announcements" element={<AdminLayout><AdminAnnouncementsPage /></AdminLayout>} />
      <Route path="/admin-admins" element={<AdminLayout><AdminAdminsPage /></AdminLayout>} />
      <Route path="/admin-login" element={<AdminLoginPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default AppRoutes;