import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '../services/api';
import { 
  FileText, 
  Award, 
  ArrowRight, 
  ArrowUpRight,
  Compass,
  Map,
  CheckSquare,
  FolderKanban,
  Loader2
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

interface GPS {
  currentLevel: string;
  destinationRole: string;
  progressPercentage: number;
  nextStep: string;
  weeksRemaining: number;
  estimatedReadyDate: string;
}

interface Mission {
  id: number;
  weekNumber: number;
  title: string;
  tasks: { id: string; text: string; status: string }[];
  status: string;
  monthNumber: number;
}

interface Project {
  id: number;
  name: string;
  status: string;
  difficulty: string;
}

interface DashboardProps {
  onTabChange: (tab: any) => void;
  onViewReport: (analysisId: number) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onTabChange, onViewReport }) => {
  const { user } = useAuth();
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [gps, setGps] = useState<GPS | null>(null);
  const [goal, setGoal] = useState<any | null>(null);
  const [roadmap, setRoadmap] = useState<any | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [readinessBreakdown, setReadinessBreakdown] = useState<any | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch analysis logs
      const historyData = await apiClient('/analysis/history');
      if (historyData && historyData.history) {
        setHistory(historyData.history);
      }

      // Fetch active career goal and related metrics
      const goalData = await apiClient('/copilot/goal');
      if (goalData && goalData.goal) {
        setGoal(goalData.goal);
        setRoadmap(goalData.roadmap);
        
        const [gpsRes, missionsRes, projectsRes, readinessRes] = await Promise.all([
          apiClient('/copilot/gps'),
          apiClient('/copilot/missions'),
          apiClient('/copilot/projects'),
          apiClient('/copilot/readiness')
        ]);
        
        if (gpsRes && gpsRes.gps) setGps(gpsRes.gps);
        if (missionsRes && missionsRes.missions) setMissions(missionsRes.missions);
        if (projectsRes && projectsRes.projects) setProjects(projectsRes.projects);
        if (readinessRes && readinessRes.current) setReadinessBreakdown(readinessRes.current);
      }
    } catch (err) {
      console.error('Failed to retrieve dashboard insights:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleToggleTask = async (missionId: number, taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    try {
      // Optimistic Update
      setMissions(prev => prev.map(m => {
        if (m.id === missionId) {
          const updatedTasks = m.tasks.map(t => t.id === taskId ? { ...t, status: nextStatus } : t);
          return { ...m, tasks: updatedTasks };
        }
        return m;
      }));

      await apiClient(`/copilot/missions/${missionId}/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });

      // Silently update scores & gps
      const [gpsRes, readinessRes] = await Promise.all([
        apiClient('/copilot/gps'),
        apiClient('/copilot/readiness')
      ]);
      if (gpsRes && gpsRes.gps) setGps(gpsRes.gps);
      if (readinessRes && readinessRes.current) setReadinessBreakdown(readinessRes.current);
    } catch (err) {
      console.error(err);
      fetchDashboardData();
    }
  };

  // Compute Statistics
  const totalAnalyses = history.length;
  const latestATS = totalAnalyses > 0 ? history[0].ats_score : 0;

  // Active missions tasks calculation
  const incompleteMissions = missions.filter(m => m.status !== 'Completed');
  const dashboardTasks: { missionId: number; taskId: string; text: string; status: string }[] = [];
  
  incompleteMissions.forEach(m => {
    m.tasks.forEach(t => {
      if (dashboardTasks.length < 3) {
        dashboardTasks.push({
          missionId: m.id,
          taskId: t.id,
          text: t.text,
          status: t.status
        });
      }
    });
  });

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success bg-success/10 border-success/20';
    if (score >= 60) return 'text-warning bg-warning/10 border-warning/20';
    return 'text-error bg-error/10 border-error/20';
  };

  const getGPSBadgeGradient = (level: string) => {
    switch (level.toLowerCase()) {
      case 'interview ready': return 'from-success to-emerald-500 text-white';
      case 'job ready': return 'from-primary to-indigo-600 text-white';
      case 'developing': return 'from-warning to-amber-500 text-slate-900';
      default: return 'from-slate-400 to-slate-500 text-white';
    }
  };

  // Helper for Circular progress rings
  const MiniCircularProgress = ({ value, label, size = 44, strokeWidth = 3.5, colorClass = "text-primary" }: { value: number, label: string, size?: number, strokeWidth?: number, colorClass?: string }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div className="flex items-center space-x-2 bg-slate-50/50 dark:bg-slate-900/30 p-2 rounded-xl border border-slate-100 dark:border-slate-800/30">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
          <svg className="w-full h-full transform -rotate-90">
            <circle
              className="text-slate-200 dark:text-slate-800"
              strokeWidth={strokeWidth}
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx={size / 2}
              cy={size / 2}
            />
            <circle
              className={`${colorClass} transition-all duration-500 ease-out`}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx={size / 2}
              cy={size / 2}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-[9px] font-black text-slate-800 dark:text-slate-200">{value}%</span>
          </div>
        </div>
        <span className="text-[10px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wide">{label}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="py-32 text-center text-sm font-semibold text-slate-400 flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span>Synthesizing dashboard cockpit telemetry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-secondary-dark dark:text-white tracking-tight font-outfit">
            Good day, {user?.name.split(' ')[0]} 👋
          </h1>
          <p className="text-sm text-secondary-light dark:text-slate-400 mt-1">
            Welcome to your AI Career Operating System cockpit. Review readiness metrics and current priorities.
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => onTabChange('analyze')}
            className="px-4.5 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl flex items-center space-x-2 shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 transition-all cursor-pointer shrink-0"
          >
            <span>Audit Resume</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
          
          {!goal && (
            <button
              onClick={() => onTabChange('copilot')}
              className="px-4 py-2.5 text-xs font-bold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-xl cursor-pointer transition-colors"
            >
              Configure AI Copilot
            </button>
          )}
        </div>
      </div>

      {/* ==========================================
          HEADER WIDGET: ACTIVE CAREER GPS ROUTE
          ========================================== */}
      {goal && gps && (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="glowing-border-active rounded-2xl p-6 relative overflow-hidden shadow-lg group"
        >
          <div className="absolute -right-20 -top-20 w-44 h-44 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/20 transition-all duration-300"></div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3.5">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-primary to-cyan-500 p-[1.5px] shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Compass className="w-5.5 h-5.5 text-cyan-400" />
                </div>
              </div>
              <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">AI CAREER GPS ACTIVE</span>
                <h3 className="text-lg font-black text-slate-100 font-outfit mt-0.5">
                  Route to: <span className="text-cyan-400">{gps.destinationRole}</span>
                </h3>
              </div>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              <span className={`px-2.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-gradient-to-r ${getGPSBadgeGradient(gps.currentLevel)}`}>
                {gps.currentLevel}
              </span>
              <span className="text-xs font-black text-slate-300">{gps.progressPercentage}% Complete</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 pt-5 border-t border-white/5 text-xs">
            <div className="md:col-span-2 space-y-1">
              <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wide">Next GPS Recommendation</span>
              <p className="font-extrabold text-slate-200 leading-snug">{gps.nextStep}</p>
            </div>
            
            <div className="flex items-center space-x-6">
              <div>
                <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wide">Weeks to Go</span>
                <span className="font-extrabold text-slate-200">{gps.weeksRemaining} Weeks</span>
              </div>
              
              <div>
                <span className="text-slate-400 block font-bold text-[9px] uppercase tracking-wide">Target Arrival</span>
                <span className="font-extrabold text-slate-200">{gps.estimatedReadyDate}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* ==========================================
          STATS CARDS GRID
          ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Card 1: ATS Score */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wide uppercase">Latest ATS Score</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-indigo-50 dark:bg-indigo-950/40 text-primary">
              <FileText className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight font-outfit">{totalAnalyses > 0 ? `${latestATS}%` : '0%'}</span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-2.5 flex items-center truncate">
            Based on {totalAnalyses} historical audits
          </p>
        </div>

        {/* Card 2: Job Readiness Score */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wide uppercase">Job Readiness</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40 text-success">
              <Award className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight font-outfit">
              {readinessBreakdown ? `${readinessBreakdown.overallScore}%` : '0%'}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-2.5 flex items-center truncate">
            Proprietary weighted career score
          </p>
        </div>

        {/* Card 3: Completed Tasks */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wide uppercase">Roadmap Checklist</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-amber-50 dark:bg-amber-950/40 text-warning">
              <CheckSquare className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight font-outfit">
              {missions.length > 0 
                ? `${missions.reduce((acc, m) => acc + m.tasks.filter(t => t.status === 'Completed').length, 0)}`
                : '0'
              }
            </span>
            <span className="text-xs text-slate-400 ml-1.5">
              / {missions.reduce((acc, m) => acc + m.tasks.length, 0)} Tasks
            </span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-2.5 flex items-center truncate">
            Weekly mission checkpoints completed
          </p>
        </div>

        {/* Card 4: Recommended Projects */}
        <div className="glass-card rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 dark:text-slate-500 tracking-wide uppercase">Portfolio Projects</span>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-50 dark:bg-rose-950/40 text-rose-500">
              <FolderKanban className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline">
            <span className="text-3xl font-extrabold text-slate-800 dark:text-slate-100 tracking-tight font-outfit">
              {projects.length > 0 ? `${projects.filter(p => p.status === 'Completed').length}` : '0'}
            </span>
            <span className="text-xs text-slate-400 ml-1.5">/ {projects.length} Built</span>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-2.5 flex items-center truncate">
            Deployments validated on database
          </p>
        </div>

      </div>

      {/* ==========================================
          MAIN COCKPIT LAYOUT GRID
          ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width): Evaluations & Roadmaps */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recent Evaluations widget */}
          <div className="glass-card rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-md font-bold text-slate-800 dark:text-slate-100 font-outfit">Recent Resume Audits</h3>
                <p className="text-xs text-slate-400 mt-0.5">Quickly access report metrics or review recommendations.</p>
              </div>
              {totalAnalyses > 3 && (
                <button
                  onClick={() => onTabChange('history')}
                  className="text-xs font-bold text-primary hover:text-primary-dark flex items-center space-x-1 transition-colors cursor-pointer"
                >
                  <span>View History</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {totalAnalyses === 0 ? (
              <div className="py-10 text-center border border-dashed border-slate-200 dark:border-slate-800 rounded-xl space-y-3">
                <p className="text-xs font-bold text-slate-400">No resumes uploaded yet.</p>
                <button
                  onClick={() => onTabChange('analyze')}
                  className="px-4.5 py-2 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/15 rounded-lg cursor-pointer"
                >
                  Parse First Resume
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {history.slice(0, 3).map((record) => (
                  <div
                    key={record.id}
                    onClick={() => onViewReport(record.id)}
                    className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800/40 bg-slate-50/20 dark:bg-slate-950/10 hover:bg-slate-50 dark:hover:bg-slate-900/60 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className={`w-10 h-10 rounded-xl flex flex-col items-center justify-center font-outfit font-extrabold text-xs border ${getScoreColor(record.ats_score)} shadow-xs`}>
                        {record.ats_score}%
                      </div>
                      
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-primary transition-colors">
                          {record.job_role}
                        </h4>
                        <p className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold truncate max-w-xs sm:max-w-md mt-0.5">
                          {record.resume_file_name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      <span className="hidden sm:inline text-[10px] font-bold text-slate-400">
                        {new Date(record.created_at).toLocaleDateString(undefined, { 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <div className="w-6.5 h-6.5 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary group-hover:text-white transition-all">
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Roadmap Milestone highlights widget */}
          {goal && roadmap && (
            <div className="glass-card rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-md font-bold text-slate-800 dark:text-slate-100 font-outfit">Active Roadmap Milestones</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Current month topics and building targets.</p>
                </div>
                <button
                  onClick={() => onTabChange('copilot')}
                  className="text-xs font-bold text-primary hover:text-primary-dark flex items-center space-x-1 cursor-pointer"
                >
                  <span>Open Roadmap Map</span>
                  <Map className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {roadmap.modules.slice(0, 2).map((m: any) => (
                  <div 
                    key={m.id}
                    className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/40 bg-slate-50/10 dark:bg-slate-950/20 space-y-3"
                  >
                    <div className="flex items-center space-x-2">
                      <span className="px-2 py-0.5 rounded text-[9px] font-black bg-primary/10 border border-primary/20 text-primary">
                        Month {m.monthNumber}
                      </span>
                      <span className="text-[10px] text-slate-400 font-bold truncate max-w-[120px]">{m.title}</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Milestone Project</span>
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-slate-200 font-outfit leading-tight mt-0.5">{m.projectTitle}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Right Column (1/3 width): Dials & Missions checklist */}
        <div className="space-y-6">
          
          {/* Job readiness breakdown dials */}
          {readinessBreakdown && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider font-outfit mb-4">Readiness Metrics</h3>
              <div className="grid grid-cols-2 gap-3.5">
                <MiniCircularProgress value={readinessBreakdown.resumeScore} label="Resume" colorClass="text-indigo-500" />
                <MiniCircularProgress value={readinessBreakdown.skillScore} label="Skills" colorClass="text-amber-500" />
                <MiniCircularProgress value={readinessBreakdown.projectScore} label="Projects" colorClass="text-emerald-500" />
                <MiniCircularProgress value={readinessBreakdown.interviewScore} label="Interviews" colorClass="text-rose-500" />
              </div>
            </div>
          )}

          {/* Active Missions dashboard checklist */}
          <div className="glass-card rounded-2xl p-6 flex flex-col">
            <div className="flex items-center space-x-2 mb-4 border-b border-slate-50 dark:border-slate-800 pb-3">
              <CheckSquare className="w-5 h-5 text-primary shrink-0" />
              <div>
                <h3 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider font-outfit">Active Weekly missions</h3>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Next priority tasks</span>
              </div>
            </div>

            {!goal ? (
              <div className="py-12 text-center text-xs text-slate-400 italic space-y-3">
                <Compass className="w-7 h-7 text-slate-300 mx-auto animate-pulse" />
                <p>Initialize Career Copilot to compile your weekly missions checklist.</p>
                <button
                  onClick={() => onTabChange('copilot')}
                  className="px-4 py-2 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/15 rounded-lg cursor-pointer"
                >
                  Configure Career GPS
                </button>
              </div>
            ) : dashboardTasks.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 italic">
                🎉 All tasks completed! You are fully on track. Recalculate or check the projects tab.
              </div>
            ) : (
              <div className="space-y-3.5">
                {dashboardTasks.map((task) => {
                  const isCompleted = task.status === 'Completed';
                  return (
                    <div 
                      key={task.taskId}
                      onClick={() => handleToggleTask(task.missionId, task.taskId, task.status)}
                      className="flex items-start space-x-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950/60 cursor-pointer border border-transparent hover:border-slate-100 dark:hover:border-slate-800/30 transition-all select-none"
                    >
                      <input
                        type="checkbox"
                        checked={isCompleted}
                        readOnly
                        className="mt-0.5 rounded border-slate-300 text-primary w-3.5 h-3.5 cursor-pointer"
                      />
                      <span className={`text-[11px] font-semibold leading-relaxed ${
                        isCompleted 
                          ? 'text-slate-400 dark:text-slate-500 line-through font-normal' 
                          : 'text-slate-700 dark:text-slate-300'
                      }`}>
                        {task.text}
                      </span>
                    </div>
                  );
                })}
                
                <button
                  onClick={() => onTabChange('copilot')}
                  className="w-full mt-4 py-2 px-3 border border-dashed border-slate-200 hover:border-primary dark:border-slate-800 dark:hover:border-primary text-slate-400 hover:text-primary text-[10px] font-bold rounded-lg uppercase tracking-wider flex items-center justify-center space-x-1 transition-all cursor-pointer"
                >
                  <span>Open Roadmap missions list</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
export default Dashboard;
