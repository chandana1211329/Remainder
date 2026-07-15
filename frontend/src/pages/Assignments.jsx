import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  FaTasks, 
  FaCheckCircle, 
  FaCalendarAlt, 
  FaClipboard, 
  FaHistory, 
  FaClock
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

const Assignments = () => {
  const { refreshUser } = useAuth();

  const [pendingList, setPendingList] = useState([]);
  const [completedList, setCompletedList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states for active pending completion
  const [notes, setNotes] = useState('');
  const [completingId, setCompletingId] = useState(null);

  const loadAssignments = async () => {
    try {
      setLoading(true);
      const data = await api.assignments.get();
      setPendingList(data.pending);
      setCompletedList(data.completed);
    } catch (err) {
      console.error(err);
      setError('Failed to load assignments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssignments();
  }, []);

  const handleComplete = async (assignmentId) => {
    try {
      setCompletingId(assignmentId);
      const res = await api.assignments.complete(assignmentId, { notes });
      
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.7 }
      });
      
      setNotes('');
      await refreshUser();
      loadAssignments();
    } catch (err) {
      console.error(err);
      alert('Failed to complete assignment.');
    } finally {
      setCompletingId(null);
    }
  };

  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getDaysRemaining = (dateStr) => {
    const target = new Date(dateStr);
    const today = new Date();
    today.setHours(0,0,0,0);
    const diffTime = target - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { text: `${Math.abs(diffDays)} days overdue`, overdue: true };
    if (diffDays === 0) return { text: 'Due Today', urgent: true };
    if (diffDays === 1) return { text: 'Due Tomorrow', urgent: true };
    return { text: `${diffDays} days remaining`, overdue: false };
  };

  if (loading && pendingList.length === 0 && completedList.length === 0) {
    return (
      <div className="p-8 space-y-6">
        <div className="h-12 w-64 skeleton rounded-xl" />
        <div className="h-56 skeleton rounded-3xl" />
        <div className="h-64 skeleton rounded-3xl" />
      </div>
    );
  }

  const nextAssignment = pendingList[0];

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header section */}
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <FaTasks className="text-violet-400" />
          <span>Assignments</span>
        </h1>
        <p className="text-gray-400 font-medium mt-1">Track deadlines and complete pending assignments.</p>
      </div>

      {/* Prominent Next Pending Assignment */}
      {nextAssignment ? (
        <div className="glass-card p-6 md:p-8 border-violet-500/20 shadow-lg shadow-violet-500/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-violet-600/10 rounded-full filter blur-2xl pointer-events-none" />
          
          <div className="flex items-start justify-between gap-4 border-b border-white/5 pb-5 mb-6">
            <div className="space-y-1">
              <span className="text-[10px] font-black text-violet-400 uppercase tracking-widest block">
                Next Active Mission
              </span>
              <h2 className="text-2xl font-extrabold text-white leading-tight">{nextAssignment.name}</h2>
            </div>
            
            {/* Days remaining badge */}
            {(() => {
              const remains = getDaysRemaining(nextAssignment.deadline);
              return (
                <span className={`
                  text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border
                  ${remains.overdue ? 'bg-red-500/10 border-red-500/20 text-red-400'
                    : remains.urgent ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                    : 'bg-violet-500/10 border-violet-500/20 text-violet-400'
                  }
                `}>
                  {remains.text}
                </span>
              );
            })()}
          </div>

          <div className="space-y-6">
            {/* Description details */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Assignment Description</h3>
              <p className="text-sm text-gray-300 leading-relaxed bg-white/[0.01] p-4 rounded-xl border border-white/5">
                {nextAssignment.description}
              </p>
            </div>

            {/* Deadline information */}
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
              <FaCalendarAlt className="text-violet-400" />
              <span>Deadline: <strong className="text-white">{formatDate(nextAssignment.deadline)}</strong></span>
            </div>

            {/* Completion Form */}
            <div className="space-y-3 border-t border-white/5 pt-5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Add Submission Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Log any notes, solutions, links, or learnings from this assignment..."
                rows={3}
                className="w-full p-4 glass-input text-xs resize-none"
              />
              <button
                onClick={() => handleComplete(nextAssignment.assignmentId)}
                disabled={completingId === nextAssignment.assignmentId}
                className="w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-extrabold text-sm text-white transition-all uppercase tracking-wider"
              >
                {completingId === nextAssignment.assignmentId ? 'Submitting...' : 'Mark as Completed (+30 XP)'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 text-center glass-card border-white/5">
          <FaCheckCircle className="text-emerald-500 text-4xl mx-auto mb-3" />
          <h3 className="font-bold text-white text-lg">No Pending Assignments</h3>
          <p className="text-gray-400 text-xs mt-1">Excellent job! All assignments have been cleared.</p>
        </div>
      )}

      {/* Pending queue overflow (if any) */}
      {pendingList.length > 1 && (
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-white flex items-center gap-2">
            <FaClipboard className="text-violet-400" />
            <span>Upcoming Queue ({pendingList.length - 1})</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingList.slice(1).map((asg) => (
              <div key={asg.id} className="glass-card p-5 border-white/5 space-y-3">
                <div>
                  <h4 className="font-bold text-sm text-white leading-tight truncate">{asg.name}</h4>
                  <p className="text-xs text-gray-500 font-semibold mt-1">Deadline: {formatDate(asg.deadline)}</p>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{asg.description}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Assignments History */}
      {completedList.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-white/5 pb-3 mb-2">
            <FaHistory className="text-emerald-500 text-sm" />
            <h3 className="font-bold text-sm text-white">Completed History</h3>
          </div>
          <div className="space-y-3">
            {completedList.map((asg) => (
              <div 
                key={asg.id} 
                className="glass-card p-5 border-emerald-500/10 bg-[#0c0e12]/60 hover:bg-[#0c0e12]/80 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div>
                    <h4 className="font-bold text-sm text-white leading-tight">{asg.name}</h4>
                    <p className="text-[10px] text-gray-500 font-bold flex items-center gap-1.5 mt-1">
                      <FaCheckCircle className="text-emerald-500" />
                      <span>Completed on {formatDate(asg.completionDate)}</span>
                    </p>
                  </div>
                  {asg.notes && (
                    <p className="text-xs text-gray-400 italic bg-white/[0.01] p-3 rounded-lg border border-white/5 leading-relaxed">
                      "{asg.notes}"
                    </p>
                  )}
                </div>
                
                <span className="text-xs font-black tracking-wider px-3.5 py-1.5 rounded-full border bg-emerald-500/10 border-emerald-500/20 text-emerald-400 self-start md:self-center">
                  +30 XP
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Assignments;
