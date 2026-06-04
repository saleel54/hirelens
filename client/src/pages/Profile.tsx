import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/api';
import { Mail, Calendar, BarChart2, Shield } from 'lucide-react';

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [totalCount, setTotalCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await apiClient('/analysis/history');
        if (data && data.history) {
          setTotalCount(data.history.length);
        }
      } catch (err) {
        console.error('Failed to get stats', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-secondary-dark dark:text-white tracking-tight font-outfit">
          Account Profile
        </h1>
        <p className="text-sm text-secondary-light dark:text-slate-400 mt-1">
          Review your account contexts, verification status, and cumulative usage metrics.
        </p>
      </div>

      {/* Profile Card */}
      <div className="glass-card !transform-none !shadow-xs rounded-xl overflow-hidden">
        {/* Top Banner Accent */}
        <div className="h-32 bg-gradient-to-r from-primary/10 to-indigo-50 dark:from-primary/5 dark:to-indigo-950/30 border-b border-slate-100 dark:border-slate-800/40 flex items-end px-6 pb-4">
          <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border-2 border-white dark:border-slate-950 shadow-md flex items-center justify-center font-outfit font-extrabold text-4xl text-primary dark:text-cyan-400 translate-y-8 select-none">
            {user?.name.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>

        {/* Card Body */}
        <div className="pt-12 p-6 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-secondary-dark dark:text-white font-outfit">{user?.name}</h2>
            <p className="text-xs font-semibold text-primary dark:text-cyan-400 mt-0.5 tracking-wider uppercase">Active Job Seeker</p>
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800/40 pt-6 space-y-4">
            <div className="flex items-center space-x-3.5 text-sm text-secondary-dark dark:text-slate-200 font-medium">
              <Mail className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <span className="text-xs font-bold text-secondary-light dark:text-slate-400 block uppercase tracking-wide">EMAIL ADDRESS</span>
                <span>{user?.email}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3.5 text-sm text-secondary-dark dark:text-slate-200 font-medium">
              <Calendar className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <span className="text-xs font-bold text-secondary-light dark:text-slate-400 block uppercase tracking-wide">JOINED DATE</span>
                <span>
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString(undefined, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  }) : 'N/A'}
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3.5 text-sm text-secondary-dark dark:text-slate-200 font-medium">
              <BarChart2 className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <span className="text-xs font-bold text-secondary-light dark:text-slate-400 block uppercase tracking-wide">TOTAL AUDITS COMPLETED</span>
                <span>{loading ? 'Fetching...' : `${totalCount} Resume analyses`}</span>
              </div>
            </div>

            <div className="flex items-center space-x-3.5 text-sm text-secondary-dark dark:text-slate-200 font-medium">
              <Shield className="w-5 h-5 text-slate-400" />
              <div className="flex-1">
                <span className="text-xs font-bold text-secondary-light dark:text-slate-400 block uppercase tracking-wide">ACCOUNT STATUS</span>
                <span className="inline-flex items-center space-x-1 text-xs font-bold text-success mt-0.5">
                  <span className="w-2 h-2 rounded-full bg-success animate-pulse"></span>
                  <span>JWT Session Authorized</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default Profile;
