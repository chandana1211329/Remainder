import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  FaRunning, 
  FaCoffee, 
  FaUtensils, 
  FaBed, 
  FaTint, 
  FaOm, 
  FaBookReader, 
  FaSmile, 
  FaSave,
  FaCheckCircle,
  FaNotesMedical
} from 'react-icons/fa';
import confetti from 'canvas-confetti';

const DailyRoutine = () => {
  const { refreshUser } = useAuth();
  
  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [settings, setSettings] = useState(null);

  // Form local states
  const [notes, setNotes] = useState('');
  const [mood, setMood] = useState('calm');

  const loadTodayTask = async () => {
    try {
      setLoading(true);
      const todayStr = new Date().toISOString().split('T')[0];
      const res = await api.daily.get(todayStr);
      setTask(res);
      setNotes(res.notes || '');
      setMood(res.mood || 'calm');

      // Load settings for times
      const setRes = await api.settings.get();
      setSettings(setRes);
    } catch (err) {
      console.error(err);
      setError('Failed to load routine data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTodayTask();
  }, []);

  const handleToggle = async (field, completed) => {
    if (!task) return;
    try {
      const res = await api.daily.update({
        date: task.date.split('T')[0],
        field,
        completed
      });
      
      if (completed) {
        confetti({
          particleCount: 50,
          spread: 40,
          origin: { y: 0.8 }
        });
      }

      setTask(res.dailyTask);
      await refreshUser();
      setSuccess('Routine updated!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error(err);
      alert('Error updating routine checkbox.');
    }
  };

  const handleAdjustValue = async (field, increment) => {
    if (!task) return;
    
    let currentValue = task[field] || 0;
    let newValue = Math.max(0, currentValue + increment);

    try {
      const res = await api.daily.update({
        date: task.date.split('T')[0],
        field, // e.g. waterIntakeML, meditationMin, readingMin
        // We pass the new integer value directly:
        waterIntakeML: field === 'waterIntakeML' ? newValue : undefined,
        meditationMin: field === 'meditationMin' ? newValue : undefined,
        readingMin: field === 'readingMin' ? newValue : undefined
      });
      setTask(res.dailyTask);
      setSuccess('Routine value updated!');
      setTimeout(() => setSuccess(''), 2000);
    } catch (err) {
      console.error(err);
      alert('Error adjusting value.');
    }
  };

  const handleSaveTextData = async () => {
    if (!task) return;
    try {
      setSaving(true);
      const res = await api.daily.update({
        date: task.date.split('T')[0],
        field: 'notes', // Dummy field to satisfy endpoint requirements
        notes,
        mood
      });
      setTask(res.dailyTask);
      setSuccess('Day notes & mood saved!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to save details.');
    } finally {
      setSaving(false);
    }
  };

  const formatHM = (dateStr) => {
    if (!dateStr) return 'Not completed';
    return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
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

  if (loading && !task) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-12 w-64 skeleton rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 skeleton rounded-3xl" />
          <div className="h-96 skeleton rounded-3xl" />
        </div>
      </div>
    );
  }

  const routineItems = [
    { id: 'morningExCompleted', label: 'Morning Exercise', icon: <FaRunning className="text-blue-400" />, time: task.morningExCompleted ? task.morningExTime : null, target: settings?.morningExerciseTime },
    { id: 'breakfastCompleted', label: 'Breakfast', icon: <FaCoffee className="text-yellow-400" />, time: task.breakfastCompleted ? task.breakfastTime : null, target: settings?.breakfastTime },
    { id: 'lunchCompleted', label: 'Lunch', icon: <FaUtensils className="text-emerald-400" />, time: task.lunchCompleted ? task.lunchTime : null, target: settings?.lunchTime },
    { id: 'eveningExCompleted', label: 'Evening Exercise', icon: <FaRunning className="text-orange-400" />, time: task.eveningExCompleted ? task.eveningExTime : null, target: settings?.eveningExerciseTime },
    { id: 'dinnerCompleted', label: 'Dinner', icon: <FaUtensils className="text-pink-400" />, time: task.dinnerCompleted ? task.dinnerTime : null, target: settings?.dinnerTime },
    { id: 'sleepCompleted', label: 'Sleep Check', icon: <FaBed className="text-violet-400" />, time: task.sleepCompleted ? task.sleepTime : null, target: settings?.sleepTime }
  ];

  const moodOptions = [
    { value: 'calm', label: 'Calm', emoji: '😌' },
    { value: 'happy', label: 'Happy', emoji: '☀️' },
    { value: 'productive', label: 'Productive', emoji: '🔥' },
    { value: 'tired', label: 'Tired', emoji: '🥱' },
    { value: 'stressed', label: 'Stressed', emoji: '🧠' }
  ];

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <FaRunning className="text-violet-400" />
            <span>Daily Routine</span>
          </h1>
          <p className="text-gray-400 font-medium mt-1">Track consistency on standard habits and routine timers.</p>
        </div>
        
        {success && (
          <span className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold shadow-inner">
            {success}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Side: Standard Habit Timings list */}
        <div className="glass-card p-6 border-white/5 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <FaCheckCircle className="text-violet-500" />
            <span>Habit Checklists</span>
          </h2>
          
          <div className="divide-y divide-white/5 space-y-2">
            {routineItems.map((item) => {
              const isChecked = task[item.id];
              return (
                <div key={item.id} className="flex items-center justify-between py-3 px-2 rounded-xl hover:bg-white/[0.01] transition-all">
                  <div className="flex items-center gap-4">
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={(e) => handleToggle(item.id, e.target.checked)}
                      className="w-5 h-5 rounded-lg border-2 border-gray-600 bg-transparent text-violet-600 cursor-pointer"
                    />
                    <div className="flex items-center gap-2 text-white">
                      <span className="text-base">{item.icon}</span>
                      <span className="font-semibold text-sm">{item.label}</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[10px] font-bold block ${isChecked ? 'text-gray-400' : 'text-gray-500'}`}>
                      {isChecked ? `Completed: ${formatHM(item.time)}` : `Target: ${format12HourStr(item.target)}`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Side: Optional Metric trackers & Mood/Notes */}
        <div className="space-y-8">
          
          {/* Optional Habit counters */}
          <div className="glass-card p-6 border-white/5 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <FaTint className="text-blue-500" />
              <span>Optional Trackers</span>
            </h2>

            <div className="space-y-6">
              {/* Water Intake */}
              <div className="flex items-center justify-between bg-white/[0.01] p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 text-lg">
                    <FaTint />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Water Intake</h3>
                    <span className="text-xs text-gray-500 font-semibold">{task.waterIntakeML || 0} ml</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAdjustValue('waterIntakeML', -250)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 hover:text-white transition"
                  >
                    -250
                  </button>
                  <button 
                    onClick={() => handleAdjustValue('waterIntakeML', 250)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 hover:border-blue-500 text-blue-400 hover:text-white text-xs font-bold transition"
                  >
                    +250ml
                  </button>
                </div>
              </div>

              {/* Meditation Tracker */}
              <div className="flex items-center justify-between bg-white/[0.01] p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center text-yellow-400 text-lg">
                    <FaOm />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Meditation</h3>
                    <span className="text-xs text-gray-500 font-semibold">{task.meditationMin || 0} mins</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAdjustValue('meditationMin', -5)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 hover:text-white transition"
                  >
                    -5m
                  </button>
                  <button 
                    onClick={() => handleAdjustValue('meditationMin', 5)}
                    className="px-3 py-1.5 rounded-lg bg-yellow-600/10 hover:bg-yellow-600 border border-yellow-500/20 hover:border-yellow-500 text-yellow-400 hover:text-white text-xs font-bold transition"
                  >
                    +5m
                  </button>
                </div>
              </div>

              {/* Reading Tracker */}
              <div className="flex items-center justify-between bg-white/[0.01] p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 text-lg">
                    <FaBookReader />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-white">Reading</h3>
                    <span className="text-xs text-gray-500 font-semibold">{task.readingMin || 0} mins</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => handleAdjustValue('readingMin', -10)}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 hover:text-white transition"
                  >
                    -10m
                  </button>
                  <button 
                    onClick={() => handleAdjustValue('readingMin', 10)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600/10 hover:bg-emerald-600 border border-emerald-500/20 hover:border-emerald-500 text-emerald-400 hover:text-white text-xs font-bold transition"
                  >
                    +10m
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mood & General Notes Logger */}
          <div className="glass-card p-6 border-white/5 space-y-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
              <FaNotesMedical className="text-pink-500" />
              <span>Mood & Diary notes</span>
            </h2>

            <div className="space-y-4">
              {/* Mood Selectors */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Today's Mood</label>
                <div className="flex flex-wrap gap-2">
                  {moodOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => setMood(option.value)}
                      className={`
                        px-3.5 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5
                        ${mood === option.value 
                          ? 'bg-violet-600/15 border-violet-500 text-violet-400 shadow-sm' 
                          : 'bg-white/5 border-white/5 text-gray-400 hover:text-white'
                        }
                      `}
                    >
                      <span>{option.emoji}</span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* General Day Notes */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block">Day Reflections</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Record summary reflections, notes on consistency, or custom logs for today..."
                  rows={4}
                  className="w-full p-4 glass-input text-xs resize-none"
                />
              </div>

              <button
                onClick={handleSaveTextData}
                disabled={saving}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 font-extrabold text-xs uppercase tracking-wider text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <FaSave />
                <span>{saving ? 'Saving...' : 'Save Notes & Mood'}</span>
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default DailyRoutine;
