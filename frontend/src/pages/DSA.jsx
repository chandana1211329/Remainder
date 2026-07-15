import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  FaBrain, 
  FaPlus, 
  FaMinus, 
  FaBook, 
  FaCheckCircle, 
  FaClock, 
  FaChevronDown, 
  FaChevronUp,
  FaFileAlt
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const DSA = () => {
  const { refreshUser } = useAuth();
  
  const [dsaList, setDsaList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Expanded Category State
  const [expandedCategory, setExpandedCategory] = useState(null);
  
  // Notes Autosave state
  const [notes, setNotes] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const saveTimeoutRef = useRef(null);

  const loadDSA = async () => {
    try {
      setLoading(true);
      const data = await api.dsa.get();
      setDsaList(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load DSA progress.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDSA();
  }, []);

  const handleAdjustCount = async (topic, amount) => {
    const newEasy = topic.difficulty === 'Easy' ? Math.max(0, topic.easyCount + amount) : topic.easyCount;
    const newMedium = topic.difficulty === 'Medium' ? Math.max(0, topic.mediumCount + amount) : topic.mediumCount;
    const newHard = topic.difficulty === 'Hard' ? Math.max(0, topic.hardCount + amount) : topic.hardCount;
    
    const solved = newEasy + newMedium + newHard;
    
    // Check if it is being marked complete to trigger confetti
    const wasCompleted = topic.status === 'completed';
    const isNowCompleted = solved >= topic.targetCount;

    try {
      const res = await api.dsa.update(topic.topicId, {
        easyCount: newEasy,
        mediumCount: newMedium,
        hardCount: newHard
      });

      if (!wasCompleted && isNowCompleted) {
        confetti({
          particleCount: 100,
          spread: 70
        });
      }

      await refreshUser();
      
      // Update local state immediately
      setDsaList(prev => prev.map(t => t.id === topic.id ? { 
        ...t, 
        easyCount: newEasy,
        mediumCount: newMedium,
        hardCount: newHard,
        problemsSolved: solved,
        completionPercentage: Math.min(100, Math.round((solved / t.targetCount) * 100)),
        status: isNowCompleted ? 'completed' : solved > 0 ? 'in_progress' : 'not_started'
      } : t));

    } catch (err) {
      console.error(err);
      alert('Error updating DSA problem count.');
    }
  };

  const handleNotesChange = (e, topicId) => {
    const val = e.target.value;
    setNotes(val);
    setSaveStatus('Saving...');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await api.notes.save('dsa', topicId, val);
        setSaveStatus('Saved');
        setDsaList(prev => prev.map(t => t.topicId === topicId ? { ...t, notes: val } : t));
        setTimeout(() => setSaveStatus(''), 2000);
      } catch (err) {
        console.error(err);
        setSaveStatus('Error saving');
      }
    }, 1000);
  };

  const handleFocusNotes = (topic) => {
    setSelectedTopicId(topic.topicId);
    setNotes(topic.notes || '');
    setSaveStatus('');
  };

  // Group our 27 difficulty items by category name
  const categories = [
    'Arrays', 'Strings', 'Linked Lists', 'Stacks', 'Queues', 'Trees', 'Graphs', 'Searching', 'Sorting'
  ];

  const getCategoryProgress = (catName) => {
    const topics = dsaList.filter(t => t.category === catName);
    if (topics.length === 0) return { solved: 0, target: 0, pct: 0 };
    
    const solved = topics.reduce((sum, t) => sum + t.problemsSolved, 0);
    const target = topics.reduce((sum, t) => sum + t.targetCount, 0);
    const pct = Math.min(100, Math.round((solved / target) * 100));

    return { solved, target, pct };
  };

  const totalDsaSolved = dsaList.reduce((sum, t) => sum + t.problemsSolved, 0);

  if (loading && dsaList.length === 0) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-12 w-64 skeleton rounded-xl" />
        <div className="h-24 skeleton rounded-3xl" />
        <div className="space-y-4">
          <div className="h-20 skeleton rounded-2xl" />
          <div className="h-20 skeleton rounded-2xl" />
          <div className="h-20 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <FaBrain className="text-violet-400" />
            <span>DSA Tracker</span>
          </h1>
          <p className="text-gray-400 font-medium mt-1">Log solved problems across various core data structures.</p>
        </div>

        {/* Global counters badge */}
        <div className="glass-card px-6 py-4 flex flex-col items-end md:items-start border-white/5">
          <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Total Solved</span>
          <h2 className="text-3xl font-black text-white">{totalDsaSolved} Problems</h2>
        </div>
      </div>

      {/* Categories Accordion */}
      <div className="space-y-4">
        {categories.map((category) => {
          const isExpanded = expandedCategory === category;
          const prog = getCategoryProgress(category);

          return (
            <div key={category} className="glass-card overflow-hidden border-white/5">
              {/* Category Header Row */}
              <div 
                onClick={() => setExpandedCategory(isExpanded ? null : category)}
                className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.01] transition-all"
              >
                <div className="flex-1 pr-6">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-base text-white">{category}</h3>
                    <span className="text-xs font-bold text-gray-400">
                      {prog.solved} / {prog.target} Solved ({prog.pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-gray-800 overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 progress-fill"
                      style={{ width: `${prog.pct}%` }}
                    />
                  </div>
                </div>

                <div className="text-gray-400">
                  {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                </div>
              </div>

              {/* Category details breakdown */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="overflow-hidden bg-white/[0.01] border-t border-white/5"
                  >
                    <div className="p-6 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        
                        {/* Render Easy, Medium, and Hard cards */}
                        {dsaList.filter(t => t.category === category).map((topic) => {
                          const isTopicCompleted = topic.status === 'completed';

                          return (
                            <div 
                              key={topic.id}
                              className={`
                                p-5 rounded-2xl border bg-gray-950/40 space-y-4 flex flex-col justify-between
                                ${isTopicCompleted ? 'border-emerald-500/20' : 'border-white/5'}
                              `}
                            >
                              <div className="space-y-3">
                                <div className="flex justify-between items-center">
                                  <span className={`
                                    text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border
                                    ${topic.difficulty === 'Easy' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                      : topic.difficulty === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                      : 'bg-red-500/10 border-red-500/20 text-red-400'
                                    }
                                  `}>
                                    {topic.difficulty}
                                  </span>

                                  {isTopicCompleted && <FaCheckCircle className="text-emerald-500" />}
                                </div>

                                <div className="flex items-baseline justify-between">
                                  <h4 className="text-2xl font-black text-white">{topic.problemsSolved}</h4>
                                  <span className="text-xs text-gray-500 font-semibold">/ {topic.targetCount} target</span>
                                </div>

                                {/* Mini progress bar */}
                                <div className="w-full h-1.5 rounded-full bg-gray-800 overflow-hidden">
                                  <div 
                                    className={`h-full progress-fill ${isTopicCompleted ? 'bg-emerald-500' : 'bg-violet-500'}`}
                                    style={{ width: `${topic.completionPercentage}%` }}
                                  />
                                </div>
                              </div>

                              {/* Plus Minus Controls */}
                              <div className="flex items-center justify-between gap-3 pt-3 border-t border-white/5">
                                <button
                                  onClick={() => handleAdjustCount(topic, -1)}
                                  className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-all"
                                >
                                  <FaMinus size={10} />
                                </button>
                                <button
                                  onClick={() => handleAdjustCount(topic, 1)}
                                  className="w-8 h-8 rounded-lg bg-violet-600/10 hover:bg-violet-600 border border-violet-500/20 hover:border-violet-500 text-violet-400 hover:text-white flex items-center justify-center transition-all"
                                >
                                  <FaPlus size={10} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Notes Section for Category Difficulties */}
                      <div className="space-y-4 border-t border-white/5 pt-6">
                        <h4 className="font-bold text-sm text-white flex items-center gap-2">
                          <FaFileAlt className="text-violet-400" />
                          <span>Category Study Notes</span>
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {dsaList.filter(t => t.category === category).map((topic) => (
                            <div key={topic.id} className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-gray-400">{topic.difficulty} Notes</span>
                                {selectedTopicId === topic.topicId && saveStatus && (
                                  <span className="text-[10px] font-bold text-violet-400 tracking-wider">
                                    {saveStatus}
                                  </span>
                                )}
                              </div>
                              <textarea
                                value={selectedTopicId === topic.topicId ? notes : (topic.notes || '')}
                                onFocus={() => handleFocusNotes(topic)}
                                onChange={(e) => handleNotesChange(e, topic.topicId)}
                                placeholder={`Log notes, approaches, or key questions for ${topic.difficulty} problems...`}
                                rows={4}
                                className="w-full p-3 glass-input text-xs resize-none"
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DSA;
