// client/src/components/Layout.js

import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import '../styles/Layout.css';

const Layout = () => {
  console.log('Layout mounted');

  return (
    <div className="app-container">
      {/* Top Header (could be teal, etc.) */}
      <Header />

      {/* Sidebar + main content */}
      <div className="layout-body">
        <Sidebar />
        <main className="main-content">
          {/* Nested routes appear here */}
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;

