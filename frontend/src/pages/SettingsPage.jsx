import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useAppTheme } from '../context/ThemeContext';
import { 
  FaCog, 
  FaClock, 
  FaPaintBrush, 
  FaBell, 
  FaAward, 
  FaSave 
} from 'react-icons/fa';

const SettingsPage = () => {
  const { refreshUser } = useAuth();
  const { theme, setTheme, accentColor, updateAccentColor } = useAppTheme();

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');

  // Local Form state
  const [form, setForm] = useState({
    wakeupTime: '07:00',
    morningExerciseTime: '07:30',
    breakfastTime: '08:30',
    lunchTime: '13:00',
    eveningExerciseTime: '18:00',
    dinnerTime: '20:30',
    sleepTime: '22:30',
    theme: 'dark',
    accentColor: 'violet',
    notifyMorning: true,
    notifyStudy: true,
    notifyAssignment: true,
    notifyExercise: true,
    notifyDinner: true,
    notifySleep: true,
    notifyRevision: true,
    xpRewardJS: 40,
    xpRewardDSA: 30,
    xpRewardAssignment: 30,
    xpRewardRevision: 20,
    xpRewardExercise: 15,
    xpRewardSleep: 20
  });

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await api.settings.get();
      setSettings(data);
      setForm(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setSuccess('');
      
      const res = await api.settings.update(form);
      setSettings(res.settings);
      
      // Update global context styles
      updateAccentColor(form.accentColor);
      setTheme(form.theme);

      await refreshUser();
      setSuccess('Settings updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      console.error(err);
      alert('Failed to update settings.');
    } finally {
      setSaving(false);
    }
  };

  if (loading && !settings) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-12 w-64 skeleton rounded-xl" />
        <div className="h-96 skeleton rounded-3xl" />
      </div>
    );
  }

  const accentsList = [
    { id: 'violet', label: 'Violet', colorBg: 'bg-violet-600' },
    { id: 'blue', label: 'Blue', colorBg: 'bg-blue-600' },
    { id: 'emerald', label: 'Emerald', colorBg: 'bg-emerald-600' },
    { id: 'amber', label: 'Amber', colorBg: 'bg-amber-500' },
    { id: 'rose', label: 'Rose', colorBg: 'bg-rose-600' }
  ];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <FaCog className="text-violet-400" />
            <span>Settings</span>
          </h1>
          <p className="text-gray-400 font-medium mt-1">Configure routine alarms, visual themes, and gamification rewards.</p>
        </div>
        {success && (
          <span className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold shadow-inner">
            {success}
          </span>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        
        {/* Section 1: Routine Times */}
        <div className="glass-card p-6 border-white/5 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <FaClock className="text-violet-500" />
            <span>Routine Targets</span>
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Wake-up Time', name: 'wakeupTime' },
              { label: 'Morning Exercise', name: 'morningExerciseTime' },
              { label: 'Breakfast Time', name: 'breakfastTime' },
              { label: 'Lunch Time', name: 'lunchTime' },
              { label: 'Evening Exercise', name: 'eveningExerciseTime' },
              { label: 'Dinner Time', name: 'dinnerTime' },
              { label: 'Sleep Time', name: 'sleepTime' }
            ].map(item => (
              <div key={item.name} className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{item.label}</label>
                <input
                  type="time"
                  name={item.name}
                  value={form[item.name]}
                  onChange={handleChange}
                  className="w-full p-3 glass-input text-xs font-bold font-mono"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: UI Styling (Theme & Accents) */}
        <div className="glass-card p-6 border-white/5 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <FaPaintBrush className="text-blue-500" />
            <span>Visual Theme & Accents</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Theme select */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Mode</label>
              <div className="flex gap-4">
                {['dark', 'light'].map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, theme: mode }))}
                    className={`
                      px-5 py-2.5 rounded-xl text-xs font-bold border transition-all uppercase tracking-wider
                      ${form.theme === mode 
                        ? 'bg-violet-600/10 border-violet-500 text-violet-400' 
                        : 'bg-white/5 border-white/5 text-gray-400'
                      }
                    `}
                  >
                    {mode === 'dark' ? 'Dark Mode (default)' : 'Light Mode'}
                  </button>
                ))}
              </div>
            </div>

            {/* Accent Color picker */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block">Accent Color</label>
              <div className="flex flex-wrap gap-3">
                {accentsList.map(item => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setForm(prev => ({ ...prev, accentColor: item.id }))}
                    className={`
                      px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 transition-all
                      ${form.accentColor === item.id
                        ? 'bg-white/10 border-white/20 text-white'
                        : 'bg-white/5 border-transparent text-gray-400'
                      }
                    `}
                  >
                    <span className={`w-3.5 h-3.5 rounded-full ${item.colorBg} border border-white/20`} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Notification Preferences */}
        <div className="glass-card p-6 border-white/5 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <FaBell className="text-emerald-500" />
            <span>Browser Notification Preferences</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { label: 'Morning Reminders', name: 'notifyMorning' },
              { label: 'JS Study Alarms', name: 'notifyStudy' },
              { label: 'Assignment Deadlines', name: 'notifyAssignment' },
              { label: 'Exercise Reminders', name: 'notifyExercise' },
              { label: 'Dinner Timers', name: 'notifyDinner' },
              { label: 'Sleep Warnings', name: 'notifySleep' },
              { label: 'Revision Alerts', name: 'notifyRevision' }
            ].map(item => (
              <label key={item.name} className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  name={item.name}
                  checked={form[item.name]}
                  onChange={handleChange}
                  className="w-5 h-5 rounded-lg border-2 border-gray-600 bg-transparent text-violet-600 cursor-pointer"
                />
                <span className="font-semibold text-xs text-gray-300">{item.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Section 4: XP Rewards */}
        <div className="glass-card p-6 border-white/5 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <FaAward className="text-amber-500" />
            <span>XP Reward Multipliers</span>
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            {[
              { label: 'JS Roadmap Complete', name: 'xpRewardJS' },
              { label: 'DSA Topic Solved', name: 'xpRewardDSA' },
              { label: 'Assignment Finished', name: 'xpRewardAssignment' },
              { label: 'Spaced Revision Complete', name: 'xpRewardRevision' },
              { label: 'Routine Exercises', name: 'xpRewardExercise' },
              { label: 'Sleep Target Met', name: 'xpRewardSleep' }
            ].map(item => (
              <div key={item.name} className="space-y-1.5">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{item.label}</label>
                <input
                  type="number"
                  name={item.name}
                  value={form[item.name]}
                  onChange={handleChange}
                  className="w-full p-3 glass-input text-xs font-bold font-mono"
                  min="0"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={saving}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-violet-600 to-pink-500 hover:from-violet-500 hover:to-pink-400 font-extrabold text-sm text-white uppercase tracking-wider transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <FaSave />
          <span>{saving ? 'Saving...' : 'Save Configuration Changes'}</span>
        </button>

      </form>
    </div>
  );
};

export default SettingsPage;
