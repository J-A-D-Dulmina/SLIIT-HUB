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
import ProtectedRoute from './shared/components/ProtectedRoute.jsx';

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/admin-login" element={<AdminLoginPage />} />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Navigate to="/dashboard" replace />
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <LandingPage />
        </ProtectedRoute>
      } />
      <Route path="/profile" element={
        <ProtectedRoute>
          <ProfilePage />
        </ProtectedRoute>
      } />
      <Route path="/units" element={
        <ProtectedRoute>
          <ModuleListPage />
        </ProtectedRoute>
      } />
      <Route path="/modules/:degreeId/:yearId" element={
        <ProtectedRoute>
          <ModuleListPage />
        </ProtectedRoute>
      } />
      <Route path="/videos/:moduleId" element={
        <ProtectedRoute>
          <VideoListPage />
        </ProtectedRoute>
      } />
      <Route path="/video/:moduleId/:videoId" element={
        <ProtectedRoute>
          <VideoDetailsPage />
        </ProtectedRoute>
      } />
      <Route path="/tutoring" element={
        <ProtectedRoute>
          <TutoringPage />
        </ProtectedRoute>
      } />
      <Route path="/join-meeting" element={
        <ProtectedRoute>
          <JoinMeetingPage />
        </ProtectedRoute>
      } />
      <Route path="/my-meetings" element={
        <ProtectedRoute>
          <MyMeetingsPage />
        </ProtectedRoute>
      } />
      <Route path="/meeting/:meetingId" element={
        <ProtectedRoute>
          <MeetingPage />
        </ProtectedRoute>
      } />
      <Route path="/resources" element={
        <ProtectedRoute>
          <ResourcesPage />
        </ProtectedRoute>
      } />
      <Route path="/calendar" element={
        <ProtectedRoute>
          <CalendarPage />
        </ProtectedRoute>
      } />
      <Route path="/ai-tool" element={
        <ProtectedRoute>
          <AIToolPage />
        </ProtectedRoute>
      } />
      <Route path="/my-recommendations" element={
        <ProtectedRoute>
          <MyRecommendationsPage />
        </ProtectedRoute>
      } />
      
      {/* Admin routes */}
      <Route path="/admin-dashboard" element={
        <ProtectedRoute>
          <AdminLayout><AdminDashboardHome /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin-degrees" element={
        <ProtectedRoute>
          <AdminLayout><AdminDegreesPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin-lecturers" element={
        <ProtectedRoute>
          <AdminLayout><AdminLecturersPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin-students" element={
        <ProtectedRoute>
          <AdminLayout><AdminStudentsPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin-videos" element={
        <ProtectedRoute>
          <AdminLayout><AdminVideosPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin-announcements" element={
        <ProtectedRoute>
          <AdminLayout><AdminAnnouncementsPage /></AdminLayout>
        </ProtectedRoute>
      } />
      <Route path="/admin-admins" element={
        <ProtectedRoute>
          <AdminLayout><AdminAdminsPage /></AdminLayout>
        </ProtectedRoute>
      } />
      
      {/* Catch all - redirect to login for unauthenticated users */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};

export default AppRoutes;