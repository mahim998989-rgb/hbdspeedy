import { useEffect, useState } from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import Checkin from './pages/Checkin';
import Tasks from './pages/Tasks';
import Referral from './pages/Referral';
import TapForFun from './pages/TapForFun';
import Withdrawal from './pages/Withdrawal';
import Leaderboard from './pages/Leaderboard';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminTasks from './pages/admin/AdminTasks';
import AdminWithdrawals from './pages/admin/AdminWithdrawals';
import AdminSettings from './pages/admin/AdminSettings';
import { AuthProvider } from './context/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import { Toaster } from './components/ui/sonner';

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <div className="App">
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/checkin" element={<Checkin />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/referral" element={<Referral />} />
              <Route path="/tap" element={<TapForFun />} />
              <Route path="/withdrawal" element={<Withdrawal />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              
              {/* Admin Routes */}
              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/tasks" element={<AdminTasks />} />
              <Route path="/admin/withdrawals" element={<AdminWithdrawals />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
            </Routes>
          </BrowserRouter>
          <Toaster position="top-center" richColors />
        </div>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;