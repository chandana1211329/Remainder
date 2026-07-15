import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { 
  FaHome, 
  FaBook, 
  FaBrain, 
  FaTasks, 
  FaRunning, 
  FaCalendarAlt, 
  FaChartLine, 
  FaSearch, 
  FaCog, 
  FaUserShield, 
  FaSignOutAlt, 
  FaFire,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const { accentColor } = useAppTheme();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { name: 'Dashboard', path: '/', icon: <FaHome /> },
    { name: 'JS Roadmap', path: '/jsroadmap', icon: <FaBook /> },
    { name: 'DSA Tracker', path: '/dsa', icon: <FaBrain /> },
    { name: 'Assignments', path: '/assignments', icon: <FaTasks /> },
    { name: 'Daily Routine', path: '/routine', icon: <FaRunning /> },
    { name: 'Calendar', path: '/calendar', icon: <FaCalendarAlt /> },
    { name: 'Statistics', path: '/statistics', icon: <FaChartLine /> },
    { name: 'Notes Search', path: '/search', icon: <FaSearch /> },
    { name: 'Settings', path: '/settings', icon: <FaCog /> },
  ];

  // Add Admin Panel link if logged in
  if (user) {
    menuItems.push({ name: 'Admin Panel', path: '/admin', icon: <FaUserShield /> });
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getXpProgressWidth = () => {
    if (!user) return '0%';
    // Level formula: level = Math.floor(Math.sqrt(xp / 100)) + 1
    // Total XP required for level L is (L-1)^2 * 100
    // Total XP required for level L+1 is L^2 * 100
    const currentLevel = user.level;
    const minXp = Math.pow(currentLevel - 1, 2) * 100;
    const maxXp = Math.pow(currentLevel, 2) * 100;
    const range = maxXp - minXp;
    const earned = user.xp - minXp;
    
    if (range <= 0) return '0%';
    const pct = Math.min(100, Math.max(0, Math.round((earned / range) * 100)));
    return `${pct}%`;
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="p-3 rounded-xl bg-gray-900/80 border border-white/10 text-white backdrop-blur-md shadow-lg"
        >
          {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
        </button>
      </div>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Container */}
      <div className={`
        fixed top-0 bottom-0 left-0 z-40
        w-72 glass-card rounded-none border-y-0 border-l-0
        flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Top Branding Section */}
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 to-pink-500 flex items-center justify-center font-bold text-xl text-white shadow-md shadow-violet-500/20">
              S
            </div>
            <div>
              <h1 className="font-bold text-lg leading-tight bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
                Study Companion
              </h1>
              <span className="text-xs text-gray-500 font-medium">Life Dashboard</span>
            </div>
          </div>

          {/* User Profile Card */}
          {user && (
            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-white truncate max-w-[130px]">{user.username}</h3>
                  <p className="text-xs text-gray-400 font-medium">Level {user.level}</p>
                </div>
                
                {/* Streak counter */}
                <div className="flex items-center gap-1 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full text-orange-400 font-bold text-sm shadow-sm">
                  <FaFire className="pulse-flame-animation text-orange-500" />
                  <span>{user.currentStreak}</span>
                </div>
              </div>
              
              {/* XP progress bar */}
              <div>
                <div className="flex justify-between text-[10px] text-gray-400 font-semibold mb-1">
                  <span>Progress to Level {user.level + 1}</span>
                  <span>{user.xp} XP</span>
                </div>
                <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 progress-fill"
                    style={{ width: getXpProgressWidth() }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-4 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200
                ${isActive 
                  ? 'bg-gradient-to-r from-white/10 to-white/0 border border-white/10 text-white shadow-sm' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
              `}
              style={({ isActive }) => isActive ? { 
                borderLeft: `3px solid var(--accent)` 
              } : {}}
            >
              <span className="text-lg">{item.icon}</span>
              <span>{item.name}</span>
            </NavLink>
          ))}
        </div>

        {/* Bottom Section - Logout */}
        <div className="p-4 border-t border-white/5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-4 px-4 py-3 rounded-xl font-semibold text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-all"
          >
            <FaSignOutAlt className="text-lg" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
