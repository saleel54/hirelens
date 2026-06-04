import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/api';
import { 
  Eye, 
  Trash2, 
  Search, 
  Filter, 
  Clock, 
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

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-secondary-dark tracking-tight font-outfit">
            Analysis History
          </h1>
          <p className="text-sm text-secondary-light mt-1">
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
      </div>

      {/* Control panel (Search & Filter) */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col md:flex-row md:items-center gap-4 transition-all duration-200">
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
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary transition-all duration-200"
          />
        </div>

        {/* Filter */}
        <div className="flex items-center space-x-2.5">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-bold text-secondary-light tracking-wide uppercase">ATS Category:</span>
          <div className="flex bg-slate-100/80 p-1 rounded-xl">
            {(['all', 'high', 'medium', 'low'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setScoreFilter(filter)}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all capitalize cursor-pointer ${
                  scoreFilter === filter 
                    ? 'bg-white text-secondary-dark shadow-sm' 
                    : 'text-slate-500 hover:text-secondary-dark'
                }`}
              >
                {filter === 'high' ? 'High (80%+)' : filter === 'medium' ? 'Medium (60%+)' : filter === 'low' ? 'Low (<60%)' : 'All'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 transition-all duration-200">
        {loading ? (
          <div className="py-24 text-center text-sm font-semibold text-slate-400 flex flex-col items-center justify-center space-y-3">
            <Clock className="w-8 h-8 text-primary animate-spin" />
            <span>Retrieving historical data records...</span>
          </div>
        ) : filteredHistory.length === 0 ? (
          <div className="py-20 text-center border border-dashed border-slate-200 rounded-xl max-w-lg mx-auto p-8 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-md font-bold text-secondary-dark font-outfit">No Records Match</h3>
              <p className="text-xs text-secondary-light mt-1">
                {history.length === 0 
                  ? "You haven't run any resume evaluations yet." 
                  : "Try adjusting your query or category filters."}
              </p>
            </div>
            {history.length === 0 && (
              <button
                onClick={() => onTabChange('analyze')}
                className="px-4 py-2 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/15 rounded-lg cursor-pointer transition-colors"
              >
                Evaluate your first resume
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Audit Date</th>
                  <th className="py-3 px-4">Targeted Job Role</th>
                  <th className="py-3 px-4">Resume File Name</th>
                  <th className="py-3 px-4 text-center">ATS Match</th>
                  <th className="py-3 px-4 text-center">Quality Score</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-secondary-dark">
                {filteredHistory.map((record) => (
                  <tr 
                    key={record.id}
                    onClick={() => onViewReport(record.id)}
                    className="hover:bg-slate-50/50 cursor-pointer transition-all duration-150 group"
                  >
                    <td className="py-3.5 px-4 text-xs text-secondary-light font-semibold">
                      {new Date(record.created_at).toLocaleDateString(undefined, { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-secondary-dark group-hover:text-primary transition-colors">
                      {record.job_role}
                    </td>
                    <td className="py-3.5 px-4 text-xs text-secondary-light font-semibold truncate max-w-xs">
                      {record.resume_file_name}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getScoreBadge(record.ats_score)}`}>
                        {record.ats_score}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center text-xs text-secondary-light font-semibold">
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
      </div>
    </div>
  );
};
export default History;
