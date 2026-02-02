import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// 1. IMPORT YOUR COMPONENTS
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AdminSite from './pages/AdminSite'; // <--- Make sure this line exists!

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Redirect root "/" to login */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        
        {/* 2. ADD THIS ROUTE FOR ADMIN */}
        <Route path="/admin" element={<AdminSite />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;