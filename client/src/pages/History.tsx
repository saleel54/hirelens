import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '../services/api';
import { 
  Eye, 
  Trash2, 
  Search, 
  Filter, 
  FileText
} from 'lucide-react';

interface AnalysisRecord {
  id: number;
  job_role: string;
  ats_score: number;
  resume_quality_score: number;
  resume_file_name: string;
  created_at: string;
}

interface HistoryProps {
  onTabChange: (tab: 'dashboard' | 'analyze' | 'history' | 'profile') => void;
  onViewReport: (analysisId: number) => void;
}

export const History: React.FC<HistoryProps> = ({ onTabChange, onViewReport }) => {
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Filtering & Searching State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [scoreFilter, setScoreFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  const fetchHistory = async () => {
    try {
      const data = await apiClient('/analysis/history');
      if (data && data.history) {
        setHistory(data.history);
      }
    } catch (err) {
      console.error('Failed to retrieve history logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this analysis record?')) return;
    
    try {
      await apiClient(`/analysis/history/${id}`, { method: 'DELETE' });
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error('Failed to delete history record:', err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Filtered History List
  const filteredHistory = history.filter(record => {
    const matchesSearch = 
      record.job_role.toLowerCase().includes(searchQuery.toLowerCase()) || 
      record.resume_file_name.toLowerCase().includes(searchQuery.toLowerCase());

    if (scoreFilter === 'high') {
      return matchesSearch && record.ats_score >= 80;
    }
    if (scoreFilter === 'medium') {
      return matchesSearch && record.ats_score >= 60 && record.ats_score < 80;
    }
    if (scoreFilter === 'low') {
      return matchesSearch && record.ats_score < 60;
    }
    return matchesSearch;
  });

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-success/10 text-success border border-success/20';
    if (score >= 60) return 'bg-warning/10 text-warning border border-warning/20';
    return 'bg-error/10 text-error border border-error/20';
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 100, damping: 15 } }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 selection:bg-primary/20"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-secondary-dark dark:text-white tracking-tight font-outfit">
            Analysis History
          </h1>
          <p className="text-sm text-secondary-light dark:text-slate-400 mt-1">
            Access, view, or manage all your past AI resume audits and scores.
          </p>
        </div>
        <button
          onClick={() => onTabChange('analyze')}
          className="self-start sm:self-auto px-4 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl flex items-center space-x-1.5 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all cursor-pointer"
        >
          <FileText className="w-4 h-4" />
          <span>Audit New Resume</span>
        </button>
      </motion.div>

      {/* Control panel (Search & Filter) */}
      <motion.div variants={itemVariants} className="glass-card rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4.5 h-4.5" />
          </div>
          <input
            type="text"
            placeholder="Search by job role or file name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-950 focus:ring-1 focus:ring-primary transition-all duration-200"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2.5">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-secondary-light dark:text-slate-400 tracking-wide uppercase">ATS Category:</span>
          <div className="flex bg-slate-100/80 dark:bg-slate-900/60 p-1 rounded-xl">
            {(['all', 'high', 'medium', 'low'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setScoreFilter(filter)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer ${
                  scoreFilter === filter 
                    ? 'bg-white/85 dark:bg-slate-800 text-secondary-dark dark:text-white shadow-sm' 
                    : 'text-slate-500 hover:text-secondary-dark dark:hover:text-white'
                }`}
              >
                {filter === 'high' ? 'High (80%+)' : filter === 'medium' ? 'Medium (60%+)' : filter === 'low' ? 'Low (<60%)' : 'All'}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Table Section */}
      <motion.div variants={itemVariants} className="glass-card rounded-2xl p-6">
        {loading ? (
          <div className="space-y-4 animate-pulse-slow">
            <div className="h-6 w-1/4 bg-slate-200 dark:bg-slate-800/40 rounded-md" />
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/40 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Audit Date</th>
                    <th className="py-3 px-4">Targeted Job Role</th>
                    <th className="py-3 px-4">Resume File Name</th>
                    <th className="py-3 px-4 text-center">ATS Match</th>
                    <th className="py-3 px-4 text-center">Quality Score</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...Array(5)].map((_, i) => (
                    <tr key={i} className="border-b border-slate-100/50 dark:border-slate-800/20">
                      <td className="py-4 px-4"><div className="h-3 w-16 bg-slate-200 dark:bg-slate-800/40 rounded" /></td>
                      <td className="py-4 px-4"><div className="h-4.5 w-36 bg-slate-200 dark:bg-slate-800/40 rounded-lg" /></td>
                      <td className="py-4 px-4"><div className="h-3 w-48 bg-slate-200 dark:bg-slate-800/40 rounded" /></td>
                      <td className="py-4 px-4 text-center"><div className="h-5 w-12 bg-slate-200 dark:bg-slate-800/40 rounded-full mx-auto" /></td>
                      <td className="py-4 px-4 text-center"><div className="h-3.5 w-8 bg-slate-200 dark:bg-slate-800/40 rounded mx-auto" /></td>
                      <td className="py-4 px-4 text-right"><div className="h-8 w-20 bg-slate-200 dark:bg-slate-800/40 rounded-lg ml-auto" /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : filteredHistory.length === 0 ? (
          history.length === 0 ? (
            <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-white/5 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 p-8 text-center max-w-xl mx-auto shadow-xs">
              <div className="absolute -right-16 -top-16 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none"></div>
              
              <div className="max-w-md mx-auto space-y-4 relative z-10">
                <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 p-[1.5px] mx-auto shadow-md shadow-primary/10">
                  <div className="w-full h-full bg-slate-50 dark:bg-slate-955 rounded-[14px] flex items-center justify-center text-primary dark:text-cyan-400">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h3 className="text-md font-extrabold text-slate-850 dark:text-white font-outfit">Your Audit Log is Empty</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                    You haven't run any resume evaluations yet. Upload your PDF resume and input a target job description to verify your ATS match score.
                  </p>
                </div>
                <button
                  onClick={() => onTabChange('analyze')}
                  className="px-5 py-2.5 text-xs font-bold text-white btn-ai-bloom rounded-xl cursor-pointer shadow-md inline-flex items-center space-x-1.5"
                >
                  <span>Evaluate your first resume</span>
                  <FileText className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="py-16 text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-900 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-600 border border-slate-200/50 dark:border-slate-800/40">
                <Search className="w-5.5 h-5.5" />
              </div>
              <div className="space-y-1.5">
                <h3 className="text-md font-bold text-slate-800 dark:text-white font-outfit">No Records Match</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Try adjusting your query or category filters.
                </p>
              </div>
              <button
                onClick={() => { setSearchQuery(''); setScoreFilter('all'); }}
                className="px-4 py-2 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/15 rounded-lg cursor-pointer transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/40 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Audit Date</th>
                  <th className="py-3 px-4">Targeted Job Role</th>
                  <th className="py-3 px-4">Resume File Name</th>
                  <th className="py-3 px-4 text-center">ATS Match</th>
                  <th className="py-3 px-4 text-center">Quality Score</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 text-sm font-medium text-secondary-dark dark:text-slate-200">
                {filteredHistory.map((record) => (
                  <tr 
                    key={record.id}
                    onClick={() => onViewReport(record.id)}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-900/40 cursor-pointer transition-all duration-150 group"
                  >
                    <td className="py-3.5 px-4 text-xs text-secondary-light dark:text-slate-400 font-semibold">
                      {new Date(record.created_at).toLocaleDateString(undefined, { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-secondary-dark dark:text-white group-hover:text-primary transition-colors">
                      {record.job_role}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-secondary-light dark:text-slate-400 font-semibold truncate max-w-xs">
                      {record.resume_file_name}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getScoreBadge(record.ats_score)}`}>
                        {record.ats_score}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs text-secondary-light dark:text-slate-400 font-semibold">
                      {record.resume_quality_score}%
                    </td>
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => onViewReport(record.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 flex items-center space-x-1 transition-all cursor-pointer"
                          title="View Full Report"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Report</span>
                        </button>
                        <button
                          onClick={(e) => handleDelete(record.id, e)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-error hover:bg-error/5 transition-all cursor-pointer"
                          title="Delete Record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};
export default History;
