import React from 'react';
import AdminSidebar from './AdminSidebar';
import '../styles/AdminLayout.css';

const AdminLayout = ({ children }) => (
  <div className="admin-layout">
    <AdminSidebar />
    <main className="admin-main-content">
      {children}
    </main>
  </div>
);

export default AdminLayout; 