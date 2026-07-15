import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  FaChartLine, 
  FaBrain, 
  FaBookOpen, 
  FaHourglassHalf, 
  FaWalking, 
  FaBed
} from 'react-icons/fa';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  AreaChart, 
  Area, 
  Legend 
} from 'recharts';

const Statistics = () => {
  const [jsRoadmap, setJsRoadmap] = useState([]);
  const [dsaList, setDsaList] = useState([]);
  const [calendarData, setCalendarData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadStatsData = async () => {
    try {
      setLoading(true);
      // Fetch JS, DSA and Calendar data
      const jsRes = await api.jsroadmap.get();
      setJsRoadmap(jsRes);

      const dsaRes = await api.dsa.get();
      setDsaList(dsaRes);

      const now = new Date();
      const calRes = await api.calendar.get(now.getFullYear(), now.getMonth() + 1);
      setCalendarData(calRes);
    } catch (err) {
      console.error(err);
      setError('Failed to load statistics data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatsData();
  }, []);

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-12 w-64 skeleton rounded-xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="h-72 skeleton rounded-3xl" />
          <div className="h-72 skeleton rounded-3xl" />
        </div>
      </div>
    );
  }

  // 1. JS Progress Chart Data
  const jsCompleted = jsRoadmap.filter(t => t.status === 'completed').length;
  const jsRemaining = jsRoadmap.length - jsCompleted;
  const jsPieData = [
    { name: 'Completed', value: jsCompleted, color: '#10b981' },
    { name: 'Remaining', value: jsRemaining, color: '#1f2937' }
  ];

  // 2. DSA Progress Chart Data (Group by category)
  // Categories solved counts
  const dsaCategories = [
    'Arrays', 'Strings', 'Linked Lists', 'Stacks', 'Queues', 'Trees', 'Graphs', 'Searching', 'Sorting'
  ];
  const dsaChartData = dsaCategories.map(cat => {
    const items = dsaList.filter(t => t.category === cat);
    const solved = items.reduce((sum, t) => sum + t.problemsSolved, 0);
    return { name: cat, Solved: solved };
  });

  // 3. Weekly XP Growth (last 15 days or all month)
  const xpChartData = calendarData.map(day => ({
    date: day.date.substring(5), // MM-DD
    XP: day.xpEarned
  }));

  // 4. Study Hours per category
  // Calculate completed minutes in JS topics per category
  const categoriesList = [...new Set(jsRoadmap.map(t => t.category))];
  const studyHoursData = categoriesList.map(cat => {
    const completedTopics = jsRoadmap.filter(t => t.category === cat && t.status === 'completed');
    const totalMinutes = completedTopics.reduce((sum, t) => sum + t.estimatedTime, 0);
    return { name: cat, Hours: parseFloat((totalMinutes / 60).toFixed(1)) };
  });

  // 5. Exercise & Sleep Consistency Data
  const totalDays = calendarData.length;
  const exerciseDays = calendarData.filter(d => d.morningExCompleted || d.eveningExCompleted).length;
  const sleepDays = calendarData.filter(d => d.sleepCompleted).length;

  const exercisePct = totalDays > 0 ? Math.round((exerciseDays / totalDays) * 100) : 0;
  const sleepPct = totalDays > 0 ? Math.round((sleepDays / totalDays) * 100) : 0;

  const consistencyData = [
    { name: 'Exercise', Rate: exercisePct, color: '#f97316' },
    { name: 'Sleep', Rate: sleepPct, color: '#6366f1' }
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <FaChartLine className="text-violet-400" />
          <span>Analytics Dashboard</span>
        </h1>
        <p className="text-gray-400 font-medium mt-1">Visualize learning progress, exercise consistency, and XP gains.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chart 1: JS Roadmap Progress (Pie) */}
        <div className="glass-card p-6 border-white/5 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <FaBookOpen className="text-violet-400" />
            <span>JavaScript Topics Completion</span>
          </h3>
          <div className="h-64 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={jsPieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {jsPieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: DSA Problems Solved (Bar) */}
        <div className="glass-card p-6 border-white/5 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <FaBrain className="text-blue-400" />
            <span>DSA Problems by Category</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dsaChartData}>
                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Bar dataKey="Solved" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Weekly XP Growth (Area) */}
        <div className="glass-card p-6 border-white/5 space-y-4 lg:col-span-2">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <FaChartLine className="text-emerald-400" />
            <span>Daily XP Gains (This Month)</span>
          </h3>
          <div className="h-72">
            {xpChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={xpChartData}>
                  <defs>
                    <linearGradient id="colorXp" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area type="monotone" dataKey="XP" stroke="#10b981" fillOpacity={1} fill="url(#colorXp)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-gray-500 font-semibold">
                No daily XP logs available for this month.
              </div>
            )}
          </div>
        </div>

        {/* Chart 4: Study Hours Completed (Bar) */}
        <div className="glass-card p-6 border-white/5 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <FaHourglassHalf className="text-amber-400" />
            <span>Study Hours by JS Module</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={studyHoursData}>
                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Bar dataKey="Hours" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Sleep and Exercise Consistency (Bar) */}
        <div className="glass-card p-6 border-white/5 space-y-4">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <FaWalking className="text-orange-400" />
            <span>Habit Consistency Rates (%)</span>
          </h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={consistencyData}>
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={12} domain={[0, 100]} tickLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#111827', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                />
                <Bar dataKey="Rate" radius={[4, 4, 0, 0]}>
                  {consistencyData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Statistics;
