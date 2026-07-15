import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  FaSearch, 
  FaBookOpen, 
  FaBrain, 
  FaTasks, 
  FaBookmark,
  FaArrowRight
} from 'react-icons/fa';
import { Link } from 'react-router-dom';

const SearchPage = () => {
  const [query, setQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  
  // Datasets for search
  const [jsTopics, setJsTopics] = useState([]);
  const [dsaList, setDsaList] = useState([]);
  const [assignments, setAssignments] = useState([]);
  
  // Results
  const [noteResults, setNoteResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Cache datasets on load for client-side search
    const cacheData = async () => {
      try {
        const jsData = await api.jsroadmap.get();
        setJsTopics(jsData);

        const dsaData = await api.dsa.get();
        setDsaList(dsaData);

        const asgData = await api.assignments.get();
        setAssignments([...asgData.pending, ...asgData.completed]);
      } catch (err) {
        console.error(err);
      }
    };
    cacheData();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    try {
      setLoading(true);
      const notes = await api.notes.search(query);
      setNoteResults(notes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter lists based on query client-side
  const getFilteredJS = () => {
    if (!query) return [];
    return jsTopics.filter(t => 
      t.title.toLowerCase().includes(query.toLowerCase()) || 
      t.description.toLowerCase().includes(query.toLowerCase())
    );
  };

  const getFilteredDSA = () => {
    if (!query) return [];
    // We group by category name, filtering out duplicates
    const uniqueCats = [...new Set(dsaList.map(t => t.category))];
    return uniqueCats
      .filter(cat => cat.toLowerCase().includes(query.toLowerCase()))
      .map(cat => ({ category: cat }));
  };

  const getFilteredAssignments = () => {
    if (!query) return [];
    return assignments.filter(a => 
      a.name.toLowerCase().includes(query.toLowerCase()) || 
      a.description.toLowerCase().includes(query.toLowerCase())
    );
  };

  const jsFiltered = getFilteredJS();
  const dsaFiltered = getFilteredDSA();
  const asgFiltered = getFilteredAssignments();

  const totalResults = jsFiltered.length + dsaFiltered.length + asgFiltered.length + noteResults.length;

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-white flex items-center gap-2">
          <FaSearch className="text-violet-400" />
          <span>Global Search</span>
        </h1>
        <p className="text-gray-400 font-medium mt-1">Search instantly across JS topics, DSA modules, assignments, and written study notes.</p>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-gray-500 pointer-events-none">
            <FaSearch />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type search terms (e.g. Closures, Arrays, Binary, etc.)..."
            className="w-full pl-10 pr-4 py-3.5 glass-input text-sm shadow-md"
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3.5 bg-violet-600 hover:bg-violet-500 font-bold text-sm text-white rounded-xl transition-all shadow-md"
        >
          Search
        </button>
      </form>

      {query && (
        <div className="space-y-6">
          {/* Result Count and Tab Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/5 pb-4">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              Found {totalResults} matches for "{query}"
            </span>

            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'js', label: 'JavaScript' },
                { id: 'dsa', label: 'DSA' },
                { id: 'asg', label: 'Assignments' },
                { id: 'notes', label: 'Study Notes' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`
                    px-3 py-1.5 rounded-lg text-xs font-bold transition-all
                    ${activeTab === tab.id 
                      ? 'bg-violet-600/15 border border-violet-500 text-violet-400' 
                      : 'bg-white/5 border border-transparent text-gray-400 hover:text-white'
                    }
                  `}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search Result Cards Grid */}
          <div className="space-y-4">
            {loading ? (
              <div className="space-y-4">
                <div className="h-20 skeleton rounded-xl" />
                <div className="h-20 skeleton rounded-xl" />
              </div>
            ) : (
              <>
                {/* JavaScript Results */}
                {(activeTab === 'all' || activeTab === 'js') && jsFiltered.map(t => (
                  <div key={t.id} className="glass-card p-5 border-white/5 flex justify-between items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FaBookOpen className="text-violet-400 text-xs" />
                        <span className="text-[10px] font-bold text-violet-400 uppercase tracking-widest">JavaScript Topic</span>
                      </div>
                      <h4 className="font-bold text-sm text-white">{t.title}</h4>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{t.description}</p>
                    </div>
                    <Link to="/jsroadmap" className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all text-xs flex-shrink-0">
                      <FaArrowRight />
                    </Link>
                  </div>
                ))}

                {/* DSA Results */}
                {(activeTab === 'all' || activeTab === 'dsa') && dsaFiltered.map((t, idx) => (
                  <div key={idx} className="glass-card p-5 border-white/5 flex justify-between items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FaBrain className="text-blue-400 text-xs" />
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">DSA Category</span>
                      </div>
                      <h4 className="font-bold text-sm text-white">{t.category}</h4>
                      <p className="text-xs text-gray-400">Master Array structures, operations, and complexities.</p>
                    </div>
                    <Link to="/dsa" className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all text-xs flex-shrink-0">
                      <FaArrowRight />
                    </Link>
                  </div>
                ))}

                {/* Assignment Results */}
                {(activeTab === 'all' || activeTab === 'asg') && asgFiltered.map(a => (
                  <div key={a.id} className="glass-card p-5 border-white/5 flex justify-between items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <FaTasks className="text-pink-400 text-xs" />
                        <span className="text-[10px] font-bold text-pink-400 uppercase tracking-widest">Assignment</span>
                      </div>
                      <h4 className="font-bold text-sm text-white">{a.name}</h4>
                      <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{a.description}</p>
                    </div>
                    <Link to="/assignments" className="p-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all text-xs flex-shrink-0">
                      <FaArrowRight />
                    </Link>
                  </div>
                ))}

                {/* Written Notes Results */}
                {(activeTab === 'all' || activeTab === 'notes') && noteResults.map((n, idx) => (
                  <div key={idx} className="glass-card p-5 border-white/5 space-y-3">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <FaBookmark className="text-yellow-500 text-xs" />
                        <span className="text-[10px] font-bold text-yellow-500 uppercase tracking-widest">
                          {n.type === 'javascript' ? 'JS Study Note' : 'DSA Study Note'}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-bold">
                        {n.title} ({n.category})
                      </span>
                    </div>
                    <p className="text-xs text-gray-300 font-mono bg-black/20 p-3 rounded-xl border border-white/5 whitespace-pre-wrap leading-relaxed">
                      {n.notes}
                    </p>
                  </div>
                ))}

                {totalResults === 0 && (
                  <div className="p-8 text-center glass-card border-white/5 text-gray-500 text-xs">
                    No matches found. Try refining search terms.
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchPage;
