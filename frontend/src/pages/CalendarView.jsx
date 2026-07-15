import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  FaCalendarAlt, 
  FaChevronLeft, 
  FaChevronRight, 
  FaBookmark, 
  FaSmile, 
  FaFire, 
  FaCheck,
  FaTimes,
  FaClock
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

const CalendarView = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selected Day Details Modal
  const [selectedDay, setSelectedDay] = useState(null);

  const loadCalendar = async () => {
    try {
      setLoading(true);
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1; // 1-indexed
      const res = await api.calendar.get(year, month);
      setCalendarData(res);

      // Reset selected day details if current month changes
      setSelectedDay(null);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendar();
  }, [currentDate]);

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Generate Calendar Days list
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDays = new Date(year, month + 1, 0).getDate();
    
    const days = [];
    
    // Fill previous month offset blanks
    for (let i = 0; i < firstDayIndex; i++) {
      days.push(null);
    }
    
    // Fill current month days
    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  };

  const daysList = getDaysInMonth();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getDayData = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    return calendarData.find(item => item.date === dateStr);
  };

  const formatDateStr = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  const formatTimeHM = (dateTimeStr) => {
    if (!dateTimeStr) return '';
    const d = new Date(dateTimeStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-8">
      {/* Header with Navigation controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <FaCalendarAlt className="text-violet-400" />
            <span>Monthly Calendar</span>
          </h1>
          <p className="text-gray-400 font-medium mt-1">Review historical checklist completions and mood logs.</p>
        </div>

        {/* Month selector controls */}
        <div className="flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-2 rounded-xl">
          <button 
            onClick={handlePrevMonth}
            className="p-2 text-gray-400 hover:text-white transition"
          >
            <FaChevronLeft size={12} />
          </button>
          
          <span className="font-extrabold text-sm text-white w-32 text-center select-none">
            {currentDate.toLocaleString([], { month: 'long', year: 'numeric' })}
          </span>

          <button 
            onClick={handleNextMonth}
            className="p-2 text-gray-400 hover:text-white transition"
          >
            <FaChevronRight size={12} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Calendar Grid Section */}
        <div className="lg:col-span-2 glass-card p-6 border-white/5">
          {/* Week Days Headers */}
          <div className="grid grid-cols-7 gap-2 mb-4 text-center">
            {weekDays.map(wd => (
              <span key={wd} className="text-xs font-bold text-gray-500 uppercase tracking-wider py-1">
                {wd}
              </span>
            ))}
          </div>

          {/* Grid cells */}
          {loading ? (
            <div className="grid grid-cols-7 gap-2 h-72 skeleton rounded-2xl" />
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {daysList.map((dayDate, idx) => {
                if (!dayDate) {
                  return <div key={`empty-${idx}`} className="aspect-square bg-transparent" />;
                }

                const dayData = getDayData(dayDate);
                const isSelected = selectedDay && selectedDay.date === dayData?.date;
                const isToday = new Date().toDateString() === dayDate.toDateString();

                return (
                  <div
                    key={dayDate.getDate()}
                    onClick={() => dayData && setSelectedDay(dayData)}
                    className={`
                      aspect-square p-2 rounded-2xl border flex flex-col justify-between transition-all duration-200 relative group
                      ${dayData ? 'cursor-pointer hover:border-violet-500/50 bg-white/[0.01]' : 'bg-transparent border-transparent'}
                      ${isToday ? 'border-violet-600 shadow-md shadow-violet-500/5' : 'border-white/5'}
                      ${isSelected ? 'border-violet-500 bg-violet-500/[0.04]' : ''}
                    `}
                  >
                    {/* Day Number */}
                    <span className={`
                      text-xs font-bold leading-none
                      ${isToday ? 'text-violet-400' : 'text-gray-400'}
                    `}>
                      {dayDate.getDate()}
                    </span>

                    {/* Completion indicators (Dot Map) */}
                    {dayData && (
                      <div className="flex flex-wrap gap-1 mt-auto pt-2 justify-center max-w-full">
                        {/* JS Study: Violet */}
                        {dayData.jsCompleted && <span className="w-1.5 h-1.5 rounded-full bg-violet-500" title="JS Roadmap" />}
                        {/* DSA Problem: Blue */}
                        {dayData.dsaCompleted && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" title="DSA" />}
                        {/* Assignment: Pink */}
                        {dayData.assignmentCompleted && <span className="w-1.5 h-1.5 rounded-full bg-pink-500" title="Assignment" />}
                        {/* Exercise: Orange */}
                        {(dayData.morningExCompleted || dayData.eveningExCompleted) && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" title="Exercise" />}
                        {/* Sleep: Purple */}
                        {dayData.sleepCompleted && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" title="Sleep" />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Detailed day view panel */}
        <div className="space-y-6">
          <AnimatePresence mode="wait">
            {selectedDay ? (
              <motion.div
                key={selectedDay.date}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="glass-card p-6 border-white/5 space-y-6"
              >
                {/* Date header */}
                <div className="border-b border-white/5 pb-3">
                  <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest block">
                    Day Details
                  </span>
                  <h3 className="font-bold text-sm text-white mt-1">
                    {formatDateStr(selectedDay.date)}
                  </h3>
                </div>

                {/* Mood, XP stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Mood</span>
                    <div className="flex items-center gap-1.5 mt-1 font-bold text-white text-xs">
                      <FaSmile className="text-yellow-500" />
                      <span className="capitalize">{selectedDay.mood || 'calm'}</span>
                    </div>
                  </div>
                  <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/5">
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">XP Earned</span>
                    <div className="flex items-center gap-1.5 mt-1 font-bold text-emerald-400 text-xs">
                      <FaFire />
                      <span>+{selectedDay.xpEarned} XP</span>
                    </div>
                  </div>
                </div>

                {/* Checked items list */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mission Completions</h4>
                  
                  <div className="space-y-2 text-xs">
                    {/* JS */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">JavaScript Study</span>
                      {selectedDay.jsCompleted 
                        ? <span className="text-emerald-400 font-bold flex items-center gap-1"><FaCheck /> {formatTimeHM(selectedDay.jsTime)}</span>
                        : <span className="text-red-400"><FaTimes /></span>
                      }
                    </div>
                    {/* DSA */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">DSA Challenge</span>
                      {selectedDay.dsaCompleted 
                        ? <span className="text-emerald-400 font-bold flex items-center gap-1"><FaCheck /> {formatTimeHM(selectedDay.dsaTime)}</span>
                        : <span className="text-red-400"><FaTimes /></span>
                      }
                    </div>
                    {/* Assignment */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Assignment submission</span>
                      {selectedDay.assignmentCompleted 
                        ? <span className="text-emerald-400 font-bold flex items-center gap-1"><FaCheck /> {formatTimeHM(selectedDay.assignmentTime)}</span>
                        : <span className="text-red-400"><FaTimes /></span>
                      }
                    </div>
                    {/* Exercise */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Exercise (Morning)</span>
                      {selectedDay.morningExCompleted 
                        ? <span className="text-emerald-400 font-bold flex items-center gap-1"><FaCheck /> {formatTimeHM(selectedDay.morningExTime)}</span>
                        : <span className="text-red-400"><FaTimes /></span>
                      }
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Exercise (Evening)</span>
                      {selectedDay.eveningExCompleted 
                        ? <span className="text-emerald-400 font-bold flex items-center gap-1"><FaCheck /> {formatTimeHM(selectedDay.eveningExTime)}</span>
                        : <span className="text-red-400"><FaTimes /></span>
                      }
                    </div>
                    {/* Sleep */}
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Sleep Schedule met</span>
                      {selectedDay.sleepCompleted 
                        ? <span className="text-emerald-400 font-bold flex items-center gap-1"><FaCheck /> {formatTimeHM(selectedDay.sleepTime)}</span>
                        : <span className="text-red-400"><FaTimes /></span>
                      }
                    </div>
                  </div>
                </div>

                {/* Day reflection notes */}
                {selectedDay.notes && (
                  <div className="space-y-2 border-t border-white/5 pt-4">
                    <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <FaBookmark className="text-violet-400" />
                      <span>Reflections & Notes</span>
                    </h4>
                    <p className="text-xs text-gray-400 leading-relaxed italic bg-white/[0.01] p-3 rounded-xl border border-white/5">
                      "{selectedDay.notes}"
                    </p>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="glass-card p-6 border-white/5 text-center text-gray-400 text-xs py-12">
                <FaCalendarAlt className="text-3xl mx-auto mb-3 text-gray-600" />
                <span>Select a completed day in the calendar to load historical data logs.</span>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default CalendarView;
