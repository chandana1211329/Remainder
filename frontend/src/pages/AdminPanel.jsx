import React, { useState } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  FaUserShield, 
  FaDatabase, 
  FaDownload, 
  FaUpload, 
  FaTrashAlt, 
  FaFileImport,
  FaCheckCircle,
  FaExclamationTriangle
} from 'react-icons/fa';

const AdminPanel = () => {
  const { refreshUser } = useAuth();
  
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Reset confirmation state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  // Import textareas
  const [importType, setImportType] = useState('js'); // js, dsa, assignments
  const [importJson, setImportJson] = useState('');

  const triggerSuccess = (msg) => {
    setSuccess(msg);
    setTimeout(() => setSuccess(''), 4000);
  };

  const handleBackup = async () => {
    try {
      setLoading(true);
      const data = await api.admin.backup();
      
      // Serialize to file download
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `study_dashboard_backup_${new Date().toISOString().split('T')[0]}.json`);
      document.body.appendChild(downloadAnchor);
      
      downloadAnchor.click();
      downloadAnchor.remove();
      triggerSuccess('Database backup file downloaded successfully!');
    } catch (err) {
      console.error(err);
      alert('Backup failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.readAsText(file, "UTF-8");
    fileReader.onload = async (event) => {
      try {
        setLoading(true);
        const parsedData = JSON.parse(event.target.result);
        
        if (!parsedData.jsProgress || !parsedData.dsaProgress || !parsedData.user) {
          throw new Error('Invalid backup file schema.');
        }

        await api.admin.restore(parsedData);
        await refreshUser();
        triggerSuccess('Database restored successfully! Reloading...');
        setTimeout(() => window.location.reload(), 2000);
      } catch (err) {
        console.error(err);
        alert('Restore failed. Please upload a valid JSON backup file.');
      } finally {
        setLoading(false);
      }
    };
  };

  const handleResetProgress = async () => {
    if (confirmText !== 'RESET') {
      alert('Please type RESET to confirm.');
      return;
    }

    try {
      setLoading(true);
      await api.admin.reset();
      await refreshUser();
      setShowResetConfirm(false);
      setConfirmText('');
      triggerSuccess('All user progress reset to level 1 successfully!');
    } catch (err) {
      console.error(err);
      alert('Reset failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!importJson.trim()) {
      alert('Please paste JSON data first.');
      return;
    }

    try {
      setLoading(true);
      const parsed = JSON.parse(importJson);

      if (importType === 'js') {
        await api.admin.importJS(parsed);
        triggerSuccess('JavaScript topics imported/updated successfully!');
      } else if (importType === 'dsa') {
        await api.admin.importDSA(parsed);
        triggerSuccess('DSA topics imported successfully!');
      } else if (importType === 'assignments') {
        await api.admin.importAssignments(parsed);
        triggerSuccess('Assignments imported successfully!');
      }
      setImportJson('');
    } catch (err) {
      console.error(err);
      alert('Import failed. Make sure the JSON format is valid and matches required keys.');
    } finally {
      setLoading(false);
    }
  };

  const getPlaceholderJson = () => {
    if (importType === 'js') {
      return `[\n  {\n    "category": "Basics",\n    "title": "Custom JS Topic",\n    "description": "Topic description text...",\n    "estimatedTime": 45,\n    "difficulty": "Easy",\n    "orderNumber": 20,\n    "practiceQuestions": ["Q1?", "Q2?"],\n    "interviewQuestions": ["Q1?", "Q2?"],\n    "relatedProject": "Project details..."\n  }\n]`;
    }
    if (importType === 'dsa') {
      return `[\n  {\n    "category": "Bit Manipulation",\n    "difficulty": "Medium"\n  }\n]`;
    }
    return `[\n  {\n    "name": "Mid-Term Project",\n    "description": "Build an E-commerce API...",\n    "deadline": "${new Date(Date.now() + 86400000 * 5).toISOString()}"\n  }\n]`;
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
            <FaUserShield className="text-violet-400" />
            <span>Admin Panel</span>
          </h1>
          <p className="text-gray-400 font-medium mt-1">Manage database backups, imports, and progress resets.</p>
        </div>
        {success && (
          <span className="px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold shadow-inner">
            {success}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Card 1: Backup / Restore */}
        <div className="glass-card p-6 border-white/5 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <FaDatabase className="text-violet-500" />
            <span>Database Backup & Restore</span>
          </h2>

          <p className="text-xs text-gray-400 leading-relaxed">
            Download your entire study and routine history as a JSON file, or restore tables from a previous backup file.
          </p>

          <div className="space-y-4 pt-3">
            {/* Backup Trigger */}
            <button
              onClick={handleBackup}
              disabled={loading}
              className="w-full py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition"
            >
              <FaDownload />
              <span>{loading ? 'Creating Backup...' : 'Download JSON Backup'}</span>
            </button>

            {/* Restore File Form */}
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreUpload}
                disabled={loading}
                className="hidden"
                id="restore-file-input"
              />
              <label
                htmlFor="restore-file-input"
                className="w-full py-3.5 rounded-xl border border-dashed border-white/15 hover:border-violet-500 bg-transparent text-gray-400 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <FaUpload />
                <span>Upload JSON Backup to Restore</span>
              </label>
            </div>
          </div>
        </div>

        {/* Card 2: Reset Progress */}
        <div className="glass-card p-6 border-white/5 space-y-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
            <FaTrashAlt className="text-red-500" />
            <span>Reset Progress</span>
          </h2>

          <p className="text-xs text-gray-400 leading-relaxed">
            Deletes all logged daily tasks, revision schedules, completed assignments, DSA problem counts, and notes. Sets your user stats back to Level 1.
          </p>

          <div className="pt-3">
            {showResetConfirm ? (
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-4">
                <div className="flex items-start gap-2.5 text-xs text-red-400 font-semibold leading-relaxed">
                  <FaExclamationTriangle className="flex-shrink-0 mt-0.5" />
                  <span>This action is permanent! Type <strong>RESET</strong> below to confirm.</span>
                </div>
                <input
                  type="text"
                  placeholder="Type RESET here..."
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full p-2.5 glass-input text-xs font-bold font-mono border-red-500/30 focus:border-red-500 focus:ring-red-500/20"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-bold text-gray-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetProgress}
                    className="flex-1 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-extrabold text-white transition"
                  >
                    Delete Everything
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowResetConfirm(true)}
                className="w-full py-3.5 rounded-xl bg-red-500/10 hover:bg-red-500 border border-red-500/20 text-red-400 hover:text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition"
              >
                <FaTrashAlt />
                <span>Reset User Data</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Box 3: Custom JSON Imports */}
      <div className="glass-card p-6 border-white/5 space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-white/5 pb-3">
          <FaFileImport className="text-emerald-500" />
          <span>Import Custom Data</span>
        </h2>

        <div className="space-y-4">
          <div className="flex gap-4 border-b border-white/5 pb-3">
            {[
              { id: 'js', label: 'JavaScript Topics' },
              { id: 'dsa', label: 'DSA Topics' },
              { id: 'assignments', label: 'Assignments' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => { setImportType(tab.id); setImportJson(''); }}
                className={`
                  text-xs font-bold pb-1.5 border-b-2 transition-all
                  ${importType === tab.id 
                    ? 'border-violet-500 text-white' 
                    : 'border-transparent text-gray-500 hover:text-white'
                  }
                `}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            placeholder={getPlaceholderJson()}
            rows={8}
            className="w-full p-4 glass-input text-xs font-mono resize-none"
          />

          <button
            onClick={handleImport}
            disabled={loading}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-extrabold text-sm text-white uppercase tracking-wider transition flex items-center justify-center gap-2"
          >
            <FaCheckCircle />
            <span>Run Import Parser</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPanel;
