import React, { useState, useEffect, useRef } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  FaBookOpen, 
  FaLock, 
  FaUnlock, 
  FaCheckCircle, 
  FaChevronRight, 
  FaStar, 
  FaSave,
  FaFileCode,
  FaArrowLeft,
  FaQuestionCircle
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const JSRoadmap = () => {
  const { refreshUser } = useAuth();
  
  const [roadmap, setRoadmap] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Active Topic Details Modal/Panel
  const [selectedTopic, setSelectedTopic] = useState(null);
  const [confidence, setConfidence] = useState(5);
  const [notes, setNotes] = useState('');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [saveStatus, setSaveStatus] = useState(''); // 'Saved', 'Saving...', ''
  
  // Spaced Revisions list
  const [revisions, setRevisions] = useState({ due: [], upcoming: [], completed: [] });
  
  const saveTimeoutRef = useRef(null);

  const loadRoadmap = async () => {
    try {
      setLoading(true);
      const data = await api.jsroadmap.get();
      setRoadmap(data);
      
      const revData = await api.jsroadmap.getRevisions();
      setRevisions(revData);
    } catch (err) {
      console.error(err);
      setError('Failed to load JavaScript roadmap.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoadmap();
  }, []);

  // Debounced Autosave for Notes
  const handleNotesChange = (e) => {
    const val = e.target.value;
    setNotes(val);
    setSaveStatus('Saving...');

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        setIsSavingNotes(true);
        await api.notes.save('javascript', selectedTopic.id, val);
        setSaveStatus('Saved');
        // Update local roadmap state notes value
        setRoadmap(prev => prev.map(t => t.id === selectedTopic.id ? { ...t, notes: val } : t));
        setTimeout(() => setSaveStatus(''), 2000);
      } catch (err) {
        console.error(err);
        setSaveStatus('Error saving');
      } finally {
        setIsSavingNotes(false);
      }
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  const handleSelectTopic = (topic) => {
    setSelectedTopic(topic);
    setConfidence(topic.confidenceRating || 5);
    setNotes(topic.notes || '');
    setSaveStatus('');
  };

  const handleCompleteTopic = async () => {
    if (!selectedTopic) return;
    try {
      const res = await api.jsroadmap.complete(selectedTopic.id, confidence);
      
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 }
      });
      
      await refreshUser();
      await loadRoadmap();
      
      // Update selected topic details status locally
      setSelectedTopic(prev => ({
        ...prev,
        status: 'completed',
        confidenceRating: confidence,
        completionDate: new Date()
      }));
    } catch (err) {
      console.error(err);
      alert(err.message || 'Error completing topic.');
    }
  };

  const handleCompleteRevision = async (revId) => {
    try {
      await api.jsroadmap.completeRevision(revId);
      confetti({
        particleCount: 80,
        spread: 60
      });
      await refreshUser();
      const revData = await api.jsroadmap.getRevisions();
      setRevisions(revData);
    } catch (err) {
      console.error(err);
      alert('Error completing revision.');
    }
  };

  // Group roadmap by category
  const categoriesMap = roadmap.reduce((acc, topic) => {
    if (!acc[topic.category]) acc[topic.category] = [];
    acc[topic.category].push(topic);
    return acc;
  }, {});

  const categories = Object.keys(categoriesMap);

  const completedCount = roadmap.filter(t => t.status === 'completed').length;
  const totalCount = roadmap.length;
  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  if (loading && roadmap.length === 0) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-12 w-64 skeleton rounded-xl" />
        <div className="h-20 skeleton rounded-3xl" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="h-32 skeleton rounded-2xl" />
          <div className="h-32 skeleton rounded-2xl" />
          <div className="h-32 skeleton rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 relative">
      {/* Header and Progress details */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <FaBookOpen className="text-violet-400" />
            <span>JavaScript Roadmap</span>
          </h1>
          <p className="text-gray-400 font-medium mt-1">Unlock nodes in order to master full-stack JS logic.</p>
        </div>

        {/* Global Progress Bar card */}
        <div className="glass-card px-6 py-4 flex items-center gap-4 border-white/5">
          <div className="space-y-1">
            <div className="flex justify-between text-xs font-bold text-gray-400">
              <span>Overall Progress</span>
              <span>{completedCount}/{totalCount} Completed</span>
            </div>
            <div className="w-48 h-2.5 rounded-full bg-gray-800 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 progress-fill"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <span className="text-2xl font-black text-white">{progressPercent}%</span>
        </div>
      </div>

      {/* Spaced Revisions due alert strip */}
      {revisions.due.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <FaQuestionCircle />
            <span>Revisions Due ({revisions.due.length})</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {revisions.due.map(rev => (
              <div 
                key={rev.id}
                className="flex items-center gap-3 px-4 py-2 rounded-xl bg-gray-900/60 border border-white/5 text-xs text-white"
              >
                <div>
                  <span className="font-semibold">{rev.topicTitle}</span>
                  <span className="text-gray-500 ml-1">({rev.intervalDays}d interval)</span>
                </div>
                <button
                  onClick={() => handleCompleteRevision(rev.id)}
                  className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 font-bold text-[10px] uppercase text-white transition-all"
                >
                  Mark Done
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Categories Roadmap container */}
      <div className="space-y-10">
        {categories.map((category, catIdx) => (
          <div key={category} className="space-y-4">
            <h2 className="text-lg font-bold text-gray-400 border-l-4 border-violet-500 pl-3 uppercase tracking-wider">
              {category}
            </h2>
            
            {/* List of topic nodes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {categoriesMap[category].map((topic) => {
                const isCompleted = topic.status === 'completed';
                const isUnlocked = topic.status === 'unlocked';
                const isLocked = topic.status === 'locked';

                return (
                  <motion.div
                    key={topic.id}
                    onClick={() => !isLocked && handleSelectTopic(topic)}
                    whileHover={!isLocked ? { y: -4 } : {}}
                    className={`
                      glass-card p-5 flex flex-col justify-between h-40 border-white/5
                      ${isLocked ? 'opacity-40 cursor-not-allowed bg-black/20' : 'cursor-pointer'}
                      ${isUnlocked ? 'border-violet-500/30 shadow-md shadow-violet-500/5' : ''}
                      ${isCompleted ? 'border-emerald-500/20' : ''}
                    `}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`
                          text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border
                          ${topic.difficulty === 'Easy' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                            : topic.difficulty === 'Medium' ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                            : 'bg-red-500/10 border-red-500/20 text-red-400'
                          }
                        `}>
                          {topic.difficulty}
                        </span>

                        {/* Status Icon */}
                        <span className="text-sm">
                          {isCompleted ? <FaCheckCircle className="text-emerald-500" />
                            : isUnlocked ? <FaUnlock className="text-violet-400" />
                            : <FaLock className="text-gray-600" />
                          }
                        </span>
                      </div>

                      <h3 className="font-bold text-white leading-tight truncate">{topic.title}</h3>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{topic.description}</p>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold mt-3 uppercase tracking-wider">
                      <span>Order #{topic.orderNumber}</span>
                      <span>{topic.estimatedTime} mins</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Side Slide-out Detail Drawer */}
      <AnimatePresence>
        {selectedTopic && (
          <div className="fixed inset-0 z-50 flex justify-end">
            {/* Drawer Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedTopic(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            {/* Drawer Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl h-full bg-[#0d0e12] border-l border-white/10 relative z-10 flex flex-col justify-between shadow-2xl"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.01]">
                <button 
                  onClick={() => setSelectedTopic(null)}
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-all font-semibold"
                >
                  <FaArrowLeft />
                  <span>Back to Roadmap</span>
                </button>
                <div className="text-xs text-gray-500 font-bold uppercase tracking-widest">
                  Topic #{selectedTopic.orderNumber}
                </div>
              </div>

              {/* Drawer Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Topic Metadata Header */}
                <div className="space-y-3">
                  <span className="text-xs font-bold text-violet-400 uppercase tracking-widest block">
                    {selectedTopic.category}
                  </span>
                  <h2 className="text-2xl font-extrabold text-white leading-tight">{selectedTopic.title}</h2>
                  <p className="text-sm text-gray-400 leading-relaxed">{selectedTopic.description}</p>
                  
                  <div className="flex gap-4 items-center mt-4">
                    <span className="text-xs font-semibold text-gray-400">
                      Difficulty: <strong className="text-white">{selectedTopic.difficulty}</strong>
                    </span>
                    <span className="text-xs font-semibold text-gray-400">
                      Time Estimate: <strong className="text-white">{selectedTopic.estimatedTime} mins</strong>
                    </span>
                  </div>
                </div>

                {/* Star Ratings selector for Completion */}
                {selectedTopic.status !== 'completed' && (
                  <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
                    <div className="text-sm font-bold text-white flex items-center gap-2">
                      <FaStar className="text-yellow-500" />
                      <span>Rate your confidence before completing:</span>
                    </div>
                    
                    <div className="flex gap-3">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setConfidence(star)}
                          className="text-2xl focus:outline-none transition-transform active:scale-95"
                        >
                          <FaStar className={star <= confidence ? 'text-yellow-500' : 'text-gray-700'} />
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={handleCompleteTopic}
                      className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-extrabold text-sm text-white transition-all uppercase tracking-wider"
                    >
                      Complete & Unlock Next Topic
                    </button>
                  </div>
                )}

                {/* Practice & Interview Questions list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Practice Questions */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-sm text-white border-l-2 border-emerald-500 pl-2">Practice Questions</h3>
                    <ul className="list-disc pl-5 text-xs text-gray-400 space-y-2 leading-relaxed">
                      {selectedTopic.practiceQuestions.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </div>
                  
                  {/* Interview Questions */}
                  <div className="space-y-3">
                    <h3 className="font-bold text-sm text-white border-l-2 border-amber-500 pl-2">Interview Questions</h3>
                    <ul className="list-disc pl-5 text-xs text-gray-400 space-y-2 leading-relaxed">
                      {selectedTopic.interviewQuestions.map((q, idx) => (
                        <li key={idx}>{q}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Related Project */}
                {selectedTopic.relatedProject && (
                  <div className="space-y-2">
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <FaFileCode className="text-violet-400" />
                      <span>Recommended Practice Project</span>
                    </h3>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 text-xs text-gray-400 leading-relaxed">
                      {selectedTopic.relatedProject}
                    </div>
                  </div>
                )}

                {/* Autosaving Notes Editor */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-white">Study & Markdown Notes</h3>
                    {saveStatus && (
                      <span className="text-[10px] font-bold text-violet-400 tracking-wider">
                        {saveStatus}
                      </span>
                    )}
                  </div>
                  <textarea
                    value={notes}
                    onChange={handleNotesChange}
                    placeholder="# Quick Notes&#10;&#10;* Key takeaway 1&#10;* Key takeaway 2&#10;&#10;```javascript&#10;// code example&#10;```"
                    rows={12}
                    className="w-full p-4 glass-input text-xs font-mono resize-none leading-relaxed"
                  />
                </div>
              </div>

              {/* Drawer Footer */}
              <div className="p-4 border-t border-white/5 text-center text-[10px] text-gray-500 font-semibold uppercase tracking-wider bg-white/[0.01]">
                Auto-saved Markdown Notes
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default JSRoadmap;
