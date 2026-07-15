import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { 
  FaFire, 
  FaCalendarCheck, 
  FaTrophy, 
  FaPlay,
  FaCheckCircle, 
  FaClipboardList, 
  FaLightbulb,
  FaCommentAlt,
  FaBookmark,
  FaClock
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const Dashboard = () => {
  const { user, refreshUser } = useAuth();
  const { accentColor } = useAppTheme();
  
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Realtime Clock
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Note Modal States
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [selectedField, setSelectedField] = useState('');
  const [noteContent, setNoteContent] = useState('');
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      const res = await api.dashboard.get();
      setData(res);
    } catch (err) {
      console.error(err);
      setError('Could not load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const triggerConfetti = () => {
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.8 },
      colors: ['#8b5cf6', '#d946ef', '#3b82f6', '#10b981', '#f59e0b', '#f43f5e']
    });
  };

  const handleToggleTask = async (field, completedVal, revisionId = null) => {
    if (!data) return;

    try {
      let res;
      
      // If it's a revision check off
      if (revisionId) {
        res = await api.jsroadmap.completeRevision(revisionId);
        triggerConfetti();
      } else {
        // Routine or main checklist tasks
        res = await api.daily.update({
          date: data.dailyTask.date.split('T')[0],
          field,
          completed: completedVal
        });
        
        if (completedVal) {
          triggerConfetti();
        }
      }
      
      // Refresh local states
      await refreshUser();
      loadDashboard();
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error updating task.');
    }
  };

  const openNoteModal = (field, currentNote) => {
    setSelectedField(field);
    setNoteContent(currentNote || '');
    setNoteModalOpen(true);
  };

  const handleSaveNote = async () => {
    try {
      await api.daily.update({
        date: data.dailyTask.date.split('T')[0],
        field: selectedField,
        completed: data.dailyTask[selectedField],
        notes: noteContent
      });
      setNoteModalOpen(false);
      loadDashboard();
    } catch (err) {
      console.error(err);
      alert('Failed to save notes.');
    }
  };

  const formatClockTime = (date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
  };

  const formatDate = (date) => {
    return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTimeHM = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    const d = new Date(dateTimeStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const format12HourStr = (timeStr) => {
    if (!timeStr) return '--:--';
    const [h, m] = timeStr.split(':');
    let hours = parseInt(h, 10);
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `${String(hours).padStart(2, '0')}:${m} ${ampm}`;
  };

  if (loading && !data) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-12 w-64 skeleton rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-40 skeleton rounded-3xl" />
          <div className="h-40 skeleton rounded-3xl" />
          <div className="h-40 skeleton rounded-3xl" />
        </div>
        <div className="h-96 skeleton rounded-3xl" />
      </div>
    );
  }

  const getLevelProgressInfo = () => {
    if (!user) return { earned: 0, required: 100, pct: 0 };
    const L = user.level;
    const minXp = Math.pow(L - 1, 2) * 100;
    const maxXp = Math.pow(L, 2) * 100;
    const required = maxXp - minXp;
    const earned = user.xp - minXp;
    const pct = Math.min(100, Math.max(0, Math.round((earned / required) * 100)));
    return { earned, required, pct };
  };

  const progressInfo = getLevelProgressInfo();

  // Create list of missions combining routine and dynamic assignments
  const missionItems = [
    {
      id: 'morningExCompleted',
      label: 'Morning Exercise',
      subtitle: `Target: ${format12HourStr(data.settings.morningExerciseTime)}`,
      completed: data.dailyTask.morningExCompleted,
      time: data.dailyTask.morningExTime,
      xp: data.settings.xpRewardExercise,
      isRoutine: true
    },
    {
      id: 'breakfastCompleted',
      label: 'Breakfast',
      subtitle: `Target: ${format12HourStr(data.settings.breakfastTime)}`,
      completed: data.dailyTask.breakfastCompleted,
      time: data.dailyTask.breakfastTime,
      xp: 5,
      isRoutine: true
    },
    {
      id: 'jsCompleted',
      label: "Today's JavaScript Topic",
      subtitle: data.nextJS ? data.nextJS.title : 'All JavaScript topics completed!',
      completed: data.dailyTask.jsCompleted,
      time: data.dailyTask.jsTime,
      xp: data.settings.xpRewardJS,
      disabled: !data.nextJS,
      isRoutine: false
    },
    {
      id: 'dsaCompleted',
      label: "Today's DSA Topic",
      subtitle: data.nextDSA ? `${data.nextDSA.category} (${data.nextDSA.difficulty})` : 'All DSA topics initialized!',
      completed: data.dailyTask.dsaCompleted,
      time: data.dailyTask.dsaTime,
      xp: data.settings.xpRewardDSA,
      disabled: !data.nextDSA,
      isRoutine: false
    },
    {
      id: 'assignmentCompleted',
      label: "AccioJob Assignment",
      subtitle: data.nextAssignment ? `Next: ${data.nextAssignment.name}` : 'Practice daily assignments on AccioJob',
      completed: data.dailyTask.assignmentCompleted,
      time: data.dailyTask.assignmentTime,
      xp: data.settings.xpRewardAssignment,
      disabled: false,
      isRoutine: false
    },
    {
      id: 'revisionCompleted',
      label: "Today's Revision Due",
      subtitle: data.nextRevision ? data.nextRevision.topicTitle : 'No revisions due today!',
      completed: data.nextRevision ? false : true, // If nextRevision is null, we are good!
      time: null,
      xp: data.settings.xpRewardRevision,
      disabled: !data.nextRevision,
      isRevision: true,
      revisionId: data.nextRevision ? data.nextRevision.id : null
    },
    {
      id: 'lunchCompleted',
      label: 'Lunch',
      subtitle: `Target: ${format12HourStr(data.settings.lunchTime)}`,
      completed: data.dailyTask.lunchCompleted,
      time: data.dailyTask.lunchTime,
      xp: 5,
      isRoutine: true
    },
    {
      id: 'eveningExCompleted',
      label: 'Evening Exercise',
      subtitle: `Target: ${format12HourStr(data.settings.eveningExerciseTime)}`,
      completed: data.dailyTask.eveningExCompleted,
      time: data.dailyTask.eveningExTime,
      xp: data.settings.xpRewardExercise,
      isRoutine: true
    },
    {
      id: 'dinnerCompleted',
      label: 'Dinner',
      subtitle: `Target: ${format12HourStr(data.settings.dinnerTime)}`,
      completed: data.dailyTask.dinnerCompleted,
      time: data.dailyTask.dinnerTime,
      xp: 5,
      isRoutine: true
    },
    {
      id: 'sleepCompleted',
      label: 'Sleep Before Target Time',
      subtitle: `Target: ${format12HourStr(data.settings.sleepTime)}`,
      completed: data.dailyTask.sleepCompleted,
      time: data.dailyTask.sleepTime,
      xp: data.settings.xpRewardSleep,
      isRoutine: true
    }
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white flex items-center gap-2">
            <span>{data.greeting},</span>
            <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
              {user.username}!
            </span>
          </h1>
          <p className="text-gray-400 font-medium mt-1">Ready to crush today's mission?</p>
        </div>

        {/* Real-time Clock Dashboard Card */}
        <div className="glass-card px-6 py-4 flex flex-col items-end md:items-start select-none border-white/5">
          <div className="flex items-center gap-2 text-violet-400 font-bold tracking-wider text-2xl font-mono">
            <FaClock size={18} />
            <span>{formatClockTime(currentTime)}</span>
          </div>
          <span className="text-xs font-semibold text-gray-500 mt-1 uppercase tracking-wider">
            {formatDate(currentTime)}
          </span>
        </div>
      </div>

      {/* Registration Day Welcome Alert */}
      {user && user.createdAt && new Date(user.createdAt).toDateString() === new Date().toDateString() && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-600/10 to-fuchsia-600/10 border border-violet-500/20 text-violet-300 text-sm flex gap-4 items-start shadow-md">
          <span className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-lg flex-shrink-0 text-violet-400">
            🚀
          </span>
          <div className="space-y-1">
            <h4 className="font-extrabold text-white text-base">Your dashboard starts tomorrow!</h4>
            <p className="text-gray-400 text-xs leading-relaxed">
              Welcome aboard! Your official streak tracking, habit checklist compliance, and daily XP multipliers will begin tomorrow. 
              Take some time today to explore the JavaScript Roadmap, practice DSA problems, add notes, or configure your routine timings under Settings!
            </p>
          </div>
        </div>
      )}

      {/* Motivational Quote Alert Banner */}
      <div className="p-4 rounded-2xl bg-violet-600/10 border border-violet-500/20 text-violet-300 text-sm flex gap-3 items-start shadow-inner">
        <FaLightbulb className="text-violet-400 text-lg flex-shrink-0 mt-0.5" />
        <p className="font-semibold italic leading-relaxed">"{data.quote}"</p>
      </div>

      {/* Statistics Block */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Streak Flame Card */}
        <div className="glass-card p-6 flex items-center justify-between relative overflow-hidden group border-white/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-orange-600/10 rounded-full filter blur-xl group-hover:bg-orange-500/20 transition-all duration-300" />
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Daily Streak</span>
            <h2 className="text-4xl font-black text-white flex items-baseline gap-1">
              <span>{user.currentStreak}</span>
              <span className="text-xs text-gray-500 font-semibold">days</span>
            </h2>
            <div className="text-xs text-gray-400 font-semibold flex items-center gap-1.5 mt-2">
              <FaTrophy className="text-amber-500" />
              <span>Personal Best: <strong>{user.longestStreak} days</strong></span>
            </div>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 text-3xl">
            <FaFire className="pulse-flame-animation" />
          </div>
        </div>

        {/* Level & XP circular progress Wheel */}
        <div className="glass-card p-6 flex items-center justify-between relative overflow-hidden group border-white/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-violet-600/10 rounded-full filter blur-xl group-hover:bg-violet-500/20 transition-all duration-300" />
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Current Level</span>
            <h2 className="text-4xl font-black text-white">Level {user.level}</h2>
            <div className="text-xs text-gray-400 font-semibold mt-2">
              <span>{progressInfo.earned} / {progressInfo.required} XP to Next Level</span>
            </div>
          </div>
          {/* Circular progress wheel SVG */}
          <div className="relative w-16 h-16 flex items-center justify-center select-none">
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
              <path
                className="text-gray-800"
                strokeWidth="3.5"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                className="text-violet-500 progress-fill"
                strokeDasharray={`${progressInfo.pct}, 100`}
                strokeWidth="3.5"
                strokeLinecap="round"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute text-center text-xs font-bold text-white">
              {progressInfo.pct}%
            </div>
          </div>
        </div>

        {/* Today's XP Card */}
        <div className="glass-card p-6 flex items-center justify-between relative overflow-hidden group border-white/5">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-600/10 rounded-full filter blur-xl group-hover:bg-emerald-500/20 transition-all duration-300" />
          <div className="space-y-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block">XP Gained Today</span>
            <h2 className="text-4xl font-black text-white">+{data.dailyTask.xpEarned} XP</h2>
            <div className="text-xs text-gray-400 font-semibold flex items-center gap-1.5 mt-2">
              <FaCalendarCheck className="text-emerald-500" />
              <span>Overall Progress: <strong>{data.progress.js}% JavaScript</strong></span>
            </div>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-500 text-3xl">
            <FaTrophy />
          </div>
        </div>
      </div>

      {/* Main Checklist: Today's Mission */}
      <div className="glass-card p-6 border-white/5">
        <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-violet-600/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
              <FaClipboardList />
            </span>
            <h2 className="text-xl font-bold text-white">Today's Mission</h2>
          </div>
          <span className="text-xs font-bold text-gray-400">
            {missionItems.filter(i => i.completed).length} / {missionItems.length} Completed
          </span>
        </div>

        {/* List of Tasks */}
        <div className="divide-y divide-white/5 space-y-1.5">
          {missionItems.map((item) => {
            const isCompleted = item.completed;
            const isDisabled = item.disabled;

            return (
              <div 
                key={item.id}
                className={`
                  flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-4 px-3 rounded-2xl transition-all duration-200
                  ${isCompleted ? 'bg-white/[0.01]' : 'hover:bg-white/[0.02]'}
                  ${isDisabled ? 'opacity-40' : ''}
                `}
              >
                {/* Left: Checkbox + Name + Details */}
                <div className="flex items-start gap-4">
                  <div className="mt-1">
                    <input
                      type="checkbox"
                      checked={isCompleted}
                      disabled={isDisabled}
                      onChange={(e) => handleToggleTask(item.id, e.target.checked, item.isRevision ? item.revisionId : null)}
                      className={`
                        w-6 h-6 rounded-lg border-2 border-gray-600 bg-transparent text-violet-600 cursor-pointer
                        focus:ring-2 focus:ring-violet-500/20
                      `}
                    />
                  </div>
                  <div>
                    <h3 className={`font-semibold text-sm leading-tight ${isCompleted ? 'text-gray-500 line-through' : 'text-white'}`}>
                      {item.label}
                    </h3>
                    <p className={`text-xs mt-1 ${isCompleted ? 'text-gray-600' : 'text-gray-400 font-medium'}`}>
                      {item.subtitle}
                    </p>
                    {isCompleted && item.time && (
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-gray-500">
                        <FaClock size={8} />
                        <span>Completed at {formatTimeHM(item.time)}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Right: Notes Button + XP Badge */}
                <div className="flex items-center justify-end gap-3 self-end sm:self-center">
                  {/* Notes update button */}
                  {!isDisabled && !item.isRevision && (
                    <button
                      onClick={() => openNoteModal(item.id, data.dailyTask.notes)}
                      className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all text-xs"
                      title="Notes"
                    >
                      <FaCommentAlt />
                    </button>
                  )}

                  {/* XP Badge */}
                  <span className={`
                    text-xs font-black tracking-wider px-3 py-1 rounded-full border
                    ${isCompleted 
                      ? 'bg-gray-800/20 border-gray-800 text-gray-600' 
                      : 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                    }
                  `}>
                    +{item.xp} XP
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Task Notes overlay Dialog Modal */}
      <AnimatePresence>
        {noteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setNoteModalOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-lg glass-card p-6 relative z-10 border-white/10"
            >
              <h2 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                <FaBookmark className="text-violet-500" />
                <span>Mission Notes</span>
              </h2>
              <p className="text-xs text-gray-400 mb-4 uppercase tracking-wider font-semibold">
                Daily task: {selectedField.replace('Completed', '')}
              </p>

              <textarea
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Log notes, progress updates, or routines for today..."
                rows={5}
                className="w-full p-4 glass-input text-sm resize-none mb-6"
              />

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setNoteModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-gray-400 hover:text-white font-semibold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveNote}
                  className="px-5 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold text-sm transition-all"
                >
                  Save Notes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
