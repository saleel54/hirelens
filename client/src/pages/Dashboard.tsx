import React, { useEffect, useState } from 'react';
import { apiClient } from '../services/api';
import { 
  FileText, 
  Award, 
  TrendingUp, 
  Calendar, 
  ArrowRight, 
  Sparkles,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface AnalysisRecord {
  id: number;
  job_role: string;
  ats_score: number;
  resume_quality_score: number;
  resume_file_name: string;
  created_at: string;
}

interface DashboardProps {
  onTabChange: (tab: 'dashboard' | 'analyze' | 'history' | 'profile') => void;
  onViewReport: (analysisId: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onTabChange, onViewReport }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Compute Statistics
  const totalAnalyses = history.length;
  const highestATS = totalAnalyses > 0 ? Math.max(...history.map(item => item.ats_score)) : 0;
  const avgATS = totalAnalyses > 0 ? Math.round(history.reduce((acc, item) => acc + item.ats_score, 0) / totalAnalyses) : 0;
  const latestAnalysis = totalAnalyses > 0 ? history[0] : null;

  // Get only top 3 recent evaluations
  const recentEvaluations = history.slice(0, 3);

  const statCards = [
    {
      label: 'Total Analyses',
      value: totalAnalyses,
      subtext: 'Evaluations logged',
      icon: FileText,
      color: 'bg-primary/10 text-primary',
    },
    {
      label: 'Highest ATS Score',
      value: totalAnalyses > 0 ? `${highestATS}%` : '0%',
      subtext: 'Peak matched record',
      icon: Award,
      color: 'bg-success/10 text-success',
    },
    {
      label: 'Average ATS Score',
      value: totalAnalyses > 0 ? `${avgATS}%` : '0%',
      subtext: 'Overall mean alignment',
      icon: TrendingUp,
      color: 'bg-warning/10 text-warning',
    },
    {
      label: 'Latest Evaluation',
      value: latestAnalysis ? `${latestAnalysis.ats_score}%` : 'None',
      subtext: latestAnalysis ? latestAnalysis.job_role : 'No records yet',
      icon: Calendar,
      color: 'bg-indigo-50 text-indigo-600',
    },
  ];

  // Dynamically generate personalized AI coaching advice
  const getCoachingAdvice = () => {
    if (totalAnalyses === 0) {
      return {
        title: "Ready to launch your search?",
        description: "Upload your first resume against a target job description. The AI will instantly audit it for ATS parser readability and identify missing skills.",
        actionText: "Analyze Your First Resume",
        iconColor: "text-primary",
        badge: "Get Started"
      };
    }

    if (highestATS >= 80) {
      return {
        title: "Job-Ready Blueprint Achieved! 🚀",
        description: "Fantastic work! You have at least one resume with an excellent 80%+ ATS matching score. We recommend checking your custom technical and behavioral interview prep questions on the report page to prepare for interviews.",
        actionText: "Prepare For Interviews",
        iconColor: "text-success",
        badge: "Expert Level"
      };
    }

    if (highestATS >= 60) {
      return {
        title: "Strong Foundation (60-79%) ⚡",
        description: "You're very close! Most of your core skills align with your target roles, but adding 2-3 specific missing technical keywords (like cloud services, Docker, or testing libraries) will push your resume into the top tier.",
        actionText: "Fine-tune Resume Stack",
        iconColor: "text-warning",
        badge: "Intermediate"
      };
    }

    return {
      title: "Optimization Needed (<60%) ⚠️",
      description: "Your match rate is below standard ATS screeners. Don't worry! This is usually due to single-column parsing errors, poor document formatting, or lacking matching skills in your text content. Let's optimize it.",
      actionText: "Improve ATS Match Score",
      iconColor: "text-error",
      badge: "Needs Polish"
    };
  };

  const advice = getCoachingAdvice();

  // Helper for score badges
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success bg-success/10 border-success/20';
    if (score >= 60) return 'text-warning bg-warning/10 border-warning/20';
    return 'text-error bg-error/10 border-error/20';
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-secondary-dark tracking-tight font-outfit">
            Good day, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-secondary-light mt-1">
            Here's a high-level overview of your professional resume performance and AI insights.
          </p>
        </div>
        <button
          onClick={() => onTabChange('analyze')}
          className="self-start md:self-auto px-4.5 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl flex items-center space-x-2 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all cursor-pointer"
        >
          <span>Audit New Resume</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Stats Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div 
              key={idx}
              className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 hover:shadow-md transition-all duration-200"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-secondary-light tracking-wide uppercase">{stat.label}</span>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="mt-4 flex items-baseline">
                <span className="text-3xl font-extrabold text-secondary-dark tracking-tight font-outfit">{stat.value}</span>
              </div>
              <p className="text-xs text-secondary-light mt-2.5 flex items-center truncate">
                {stat.subtext}
              </p>
            </div>
          );
        })}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Recent activity & Quick view list */}
        <div className="lg:col-span-2 bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="text-lg font-bold text-secondary-dark font-outfit">Recent Evaluations</h2>
                <p className="text-xs text-secondary-light mt-0.5">Your most recently uploaded applications.</p>
              </div>
              {totalAnalyses > 3 && (
                <button
                  onClick={() => onTabChange('history')}
                  className="text-xs font-bold text-primary hover:text-primary-dark flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <span>View All ({totalAnalyses})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {loading ? (
              <div className="py-16 text-center text-sm font-semibold text-slate-400">
                Syncing statistics logs...
              </div>
            ) : recentEvaluations.length === 0 ? (
              <div className="py-12 text-center border border-dashed border-slate-200 rounded-xl space-y-4">
                <p className="text-sm font-semibold text-secondary-light">No evaluations recorded yet.</p>
                <button
                  onClick={() => onTabChange('analyze')}
                  className="px-4 py-2 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/15 rounded-lg cursor-pointer transition-colors"
                >
                  Upload your first resume
                </button>
              </div>
            ) : (
              <div className="space-y-3.5">
                {recentEvaluations.map((record) => (
                  <div
                    key={record.id}
                    onClick={() => onViewReport(record.id)}
                    className="flex items-center justify-between p-4 rounded-xl border border-slate-100 bg-slate-50/20 hover:bg-slate-50 hover:border-slate-200 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center space-x-4 min-w-0">
                      {/* Score Badge circle */}
                      <div className={`w-11 h-11 rounded-xl flex flex-col items-center justify-center font-outfit font-extrabold text-sm border ${getScoreColor(record.ats_score)} shadow-sm`}>
                        {record.ats_score}%
                      </div>
                      
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-secondary-dark truncate group-hover:text-primary transition-colors">
                          {record.job_role}
                        </h4>
                        <p className="text-xs text-secondary-light font-medium truncate max-w-xs sm:max-w-md mt-0.5">
                          {record.resume_file_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className="hidden sm:inline text-xs font-semibold text-secondary-light">
                        {new Date(record.created_at).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                        <ArrowUpRight className="w-4 h-4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {totalAnalyses > 0 && (
            <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-secondary-light">
              <span>Permanently logging records in cloud PostgreSQL.</span>
              <button 
                onClick={() => onTabChange('history')}
                className="text-primary hover:underline cursor-pointer"
              >
                Go to history audit trail
              </button>
            </div>
          )}
        </div>

        {/* Right 1 Column: AI Insights / Coaching panel */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-lg shadow-slate-900/10 flex flex-col justify-between relative overflow-hidden group">
          {/* Subtle glowing orb element */}
          <div className="absolute -right-16 -top-16 w-32 h-32 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all duration-300"></div>

          <div>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 font-outfit">AI Career Assistant</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-white/10 text-primary border border-white/5">
                {advice.badge}
              </span>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-extrabold font-outfit leading-tight !text-white">
                {advice.title}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                {advice.description}
              </p>
            </div>

            {/* Dynamic Visualization (SVG circular chart) */}
            {totalAnalyses > 0 && (
              <div className="mt-6 flex items-center justify-center bg-white/5 rounded-2xl p-4.5 border border-white/5">
                <div className="relative w-20 h-20">
                  <svg className="w-full h-full" viewBox="0 0 36 36">
                    {/* Background circle */}
                    <path
                      className="text-white/10"
                      strokeWidth="3.5"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    {/* Progress circle */}
                    <path
                      className="text-primary"
                      strokeDasharray={`${highestATS}, 100`}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      stroke="currentColor"
                      fill="none"
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-extrabold font-outfit text-white leading-none">{highestATS}%</span>
                    <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">Peak</span>
                  </div>
                </div>
                <div className="ml-4 flex-1">
                  <div className="flex items-center space-x-1 text-slate-300 font-bold text-xs">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    <span>Average performance: {avgATS}%</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                    Calculated across all evaluations logs.
                  </p>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={() => onTabChange(totalAnalyses === 0 ? 'analyze' : 'history')}
            className="w-full mt-6 py-3 px-4 bg-primary hover:bg-primary-dark text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-all duration-200 cursor-pointer shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20"
          >
            <span>{advice.actionText}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

      </div>
    </div>
  );
};
export default Dashboard;
