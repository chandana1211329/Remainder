import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { notificationService } from './services/notifications';
import { api } from './services/api';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import JSRoadmap from './pages/JSRoadmap';
import DSA from './pages/DSA';
import Assignments from './pages/Assignments';
import DailyRoutine from './pages/DailyRoutine';
import CalendarView from './pages/CalendarView';
import Statistics from './pages/Statistics';
import SearchPage from './pages/SearchPage';
import SettingsPage from './pages/SettingsPage';
import AdminPanel from './pages/AdminPanel';
import Login from './pages/Login';
import Register from './pages/Register';

// Protected Route wrapper component
const RequireAuth = ({ children }) => {
  const { token, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0c10]">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

function App() {
  const { token, user } = useAuth();

  useEffect(() => {
    let stopScheduler = null;

    const initNotifications = async () => {
      if (!token) return;

      try {
        // Request Web Notification permission
        const granted = await notificationService.requestPermission();
        if (!granted) return;

        // Fetch dashboard data (containing settings, tasks, revisions, assignments)
        const data = await api.dashboard.get();
        
        // Start scheduler loop
        stopScheduler = notificationService.startScheduler(
          data.settings,
          data.dailyTask,
          data.nextRevision,
          data.nextAssignment
        );
      } catch (err) {
        console.error('Failed to initialize notifications:', err);
      }
    };

    initNotifications();

    return () => {
      if (stopScheduler) stopScheduler();
    };
  }, [token, user]);

  return (
    <div className="min-h-screen flex relative bg-[#0b0c10] text-[#f3f4f6]">
      {/* Background Graphic Elements */}
      <div className="ambient-bg">
        <div className="ambient-orb orb-1" />
        <div className="ambient-orb orb-2" />
      </div>

      {/* Main Layout structure */}
      {token && <Sidebar />}
      
      <div className={`flex-1 flex flex-col min-h-screen transition-all ${token ? 'lg:pl-72' : ''}`}>
        <div className="flex-1 overflow-y-auto">
          <Routes>
            {/* Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* Protected Dashboard/App routes */}
            <Route path="/" element={<RequireAuth><Dashboard /></RequireAuth>} />
            <Route path="/jsroadmap" element={<RequireAuth><JSRoadmap /></RequireAuth>} />
            <Route path="/dsa" element={<RequireAuth><DSA /></RequireAuth>} />
            <Route path="/assignments" element={<RequireAuth><Assignments /></RequireAuth>} />
            <Route path="/routine" element={<RequireAuth><DailyRoutine /></RequireAuth>} />
            <Route path="/calendar" element={<RequireAuth><CalendarView /></RequireAuth>} />
            <Route path="/statistics" element={<RequireAuth><Statistics /></RequireAuth>} />
            <Route path="/search" element={<RequireAuth><SearchPage /></RequireAuth>} />
            <Route path="/settings" element={<RequireAuth><SettingsPage /></RequireAuth>} />
            <Route path="/admin" element={<RequireAuth><AdminPanel /></RequireAuth>} />
            
            {/* Fallback redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

export default App;
