import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiClient } from '../services/api';
import { 
  Compass, 
  Map, 
  Clock, 
  Plus, 
  Loader2, 
  ChevronRight, 
  ChevronDown,
  Sparkles,
  Award,
  Zap,
  Target,
  RefreshCw,
  FolderKanban,
  CheckSquare
} from 'lucide-react';

interface Goal {
  id: number;
  targetRole: string;
  timelineMonths: number;
  currentSkillLevel: string;
  hoursPerDay: number;
  preferredLearningStyle: string;
}

interface Task {
  id: string;
  text: string;
  status: 'Pending' | 'In_Progress' | 'Completed';
}

interface Mission {
  id: number;
  moduleId: number;
  weekNumber: number;
  title: string;
  tasks: Task[];
  status: 'Pending' | 'In_Progress' | 'Completed';
  monthNumber: number;
  moduleTitle: string;
}

interface Module {
  id: number;
  monthNumber: number;
  title: string;
  description: string;
  skillsToLearn: string[];
  projectTitle: string;
  projectDescription: string;
  weeklyMissions: Mission[];
}

interface Roadmap {
  id: number;
  title: string;
  description: string;
  modules: Module[];
}

interface Project {
  id: number;
  name: string;
  description: string;
  difficulty: string;
  skillsDemonstrated: string[];
  estimatedCompletionTime: string;
  status: 'Pending' | 'In_Progress' | 'Completed';
}

interface GPS {
  currentLevel: string;
  destinationRole: string;
  progressPercentage: number;
  nextStep: string;
  weeksRemaining: number;
  estimatedReadyDate: string;
}

interface Readiness {
  overallScore: number;
  resumeScore: number;
  skillScore: number;
  projectScore: number;
  interviewScore: number;
  improvementSuggestions: string[];
}

interface CareerCopilotProps {
  onTabChange?: (tab: any) => void;
}

export const CareerCopilot: React.FC<CareerCopilotProps> = () => {
  // Global states
  const [goal, setGoal] = useState<Goal | null>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [missions, setMissions] = useState<Mission[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [gps, setGps] = useState<GPS | null>(null);
  const [readiness, setReadiness] = useState<Readiness | null>(null);
  
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'gps' | 'roadmap' | 'projects'>('gps');

  // Form State
  const [targetRole, setTargetRole] = useState('');
  const [timelineMonths, setTimelineMonths] = useState(3);
  const [currentSkillLevel, setCurrentSkillLevel] = useState('Learning');
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [preferredLearningStyle, setPreferredLearningStyle] = useState('Practical');
  
  // Custom skills tags state
  const [skillInput, setSkillInput] = useState('');
  const [currentSkills, setCurrentSkills] = useState<string[]>([]);
  
  // Roadmap month toggles
  const [expandedMonths, setExpandedMonths] = useState<Record<number, boolean>>({ 1: true });

  const fetchCopilotData = async () => {
    try {
      setLoading(true);
      const goalData = await apiClient('/copilot/goal');
      if (goalData && goalData.goal) {
        setGoal(goalData.goal);
        setRoadmap(goalData.roadmap);
        
        // Fetch remaining details
        const [missionsRes, projectsRes, gpsRes, readinessRes] = await Promise.all([
          apiClient('/copilot/missions'),
          apiClient('/copilot/projects'),
          apiClient('/copilot/gps'),
          apiClient('/copilot/readiness')
        ]);
        
        if (missionsRes && missionsRes.missions) setMissions(missionsRes.missions);
        if (projectsRes && projectsRes.projects) setProjects(projectsRes.projects);
        if (gpsRes && gpsRes.gps) setGps(gpsRes.gps);
        if (readinessRes && readinessRes.current) setReadiness(readinessRes.current);
      } else {
        setGoal(null);
        setRoadmap(null);
      }
    } catch (err) {
      console.error('Failed to load copilot overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCopilotData();
  }, []);

  const handleAddSkill = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanSkill = skillInput.trim();
    if (cleanSkill && !currentSkills.includes(cleanSkill)) {
      setCurrentSkills([...currentSkills, cleanSkill]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setCurrentSkills(currentSkills.filter(s => s !== skillToRemove));
  };

  const handleSubmitGoalForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetRole.trim()) return;

    try {
      setSubmitting(true);
      await apiClient('/copilot/goal', {
        method: 'POST',
        body: JSON.stringify({
          targetRole: targetRole.trim(),
          timelineMonths,
          currentSkillLevel,
          hoursPerDay,
          preferredLearningStyle,
          currentSkills
        })
      });

      // Reload dashboard data
      await fetchCopilotData();
    } catch (err) {
      console.error(err);
      alert('Failed to set career goal. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleTask = async (missionId: number, taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Completed' ? 'Pending' : 'Completed';
    try {
      // Optimistic Update
      setMissions(prev => prev.map(m => {
        if (m.id === missionId) {
          const updatedTasks = m.tasks.map(t => t.id === taskId ? { ...t, status: nextStatus as any } : t);
          return { ...m, tasks: updatedTasks };
        }
        return m;
      }));

      await apiClient(`/copilot/missions/${missionId}/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });

      // Silently refresh scores & gps details
      const [gpsRes, readinessRes] = await Promise.all([
        apiClient('/copilot/gps'),
        apiClient('/copilot/readiness')
      ]);
      if (gpsRes && gpsRes.gps) setGps(gpsRes.gps);
      if (readinessRes && readinessRes.current) setReadiness(readinessRes.current);

    } catch (err) {
      console.error('Failed to toggle task status:', err);
      // Revert fetch
      fetchCopilotData();
    }
  };

  const handleUpdateProjectStatus = async (projectId: number, nextStatus: 'Pending' | 'In_Progress' | 'Completed') => {
    try {
      // Optimistic update
      setProjects(prev => prev.map(p => p.id === projectId ? { ...p, status: nextStatus } : p));

      await apiClient(`/copilot/projects/${projectId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });

      // Silently refresh scores & gps details
      const [gpsRes, readinessRes] = await Promise.all([
        apiClient('/copilot/gps'),
        apiClient('/copilot/readiness')
      ]);
      if (gpsRes && gpsRes.gps) setGps(gpsRes.gps);
      if (readinessRes && readinessRes.current) setReadiness(readinessRes.current);

    } catch (err) {
      console.error('Failed to update project status:', err);
      fetchCopilotData();
    }
  };

  const handleAdaptiveRecalculate = async () => {
    try {
      setRecalculating(true);
      await apiClient('/copilot/adaptive', { method: 'POST' });
      await fetchCopilotData();
    } catch (err) {
      console.error('Failed to recalculate adaptive roadmap:', err);
      alert('Recalculation failed. Please upload a resume first or retry.');
    } finally {
      setRecalculating(false);
    }
  };

  const toggleMonthExpansion = (monthNum: number) => {
    setExpandedMonths(prev => ({
      ...prev,
      [monthNum]: !prev[monthNum]
    }));
  };

  // Helper for Circular progress rings
  const CircularProgress = ({ value, label, size = 60, strokeWidth = 5, colorClass = "text-primary" }: { value: number, label: string, size?: number, strokeWidth?: number, colorClass?: string }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (value / 100) * circumference;

    return (
      <div className="flex flex-col items-center space-y-2 bg-slate-50/50 dark:bg-slate-900/40 border border-slate-100 dark:border-slate-800/40 p-4 rounded-xl shadow-xs shrink-0">
        <div className="relative" style={{ width: size, height: size }}>
          <svg className="w-full h-full transform -rotate-90">
            {/* Background ring */}
            <circle
              className="text-slate-200 dark:text-slate-800/60"
              strokeWidth={strokeWidth}
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx={size / 2}
              cy={size / 2}
            />
            {/* Progress ring */}
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
            <span className="text-xs font-black text-slate-800 dark:text-slate-100">{value}%</span>
          </div>
        </div>
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">{label}</span>
      </div>
    );
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff.toLowerCase()) {
      case 'easy': return 'bg-success/10 text-success border-success/20';
      case 'medium': return 'bg-warning/10 text-warning border-warning/20';
      case 'hard': return 'bg-error/10 text-error border-error/20';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const getGPSBadgeColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'interview ready': return 'from-success via-emerald-500 to-teal-500 text-white';
      case 'job ready': return 'from-primary to-indigo-600 text-white';
      case 'developing': return 'from-warning to-amber-500 text-slate-900';
      default: return 'from-slate-400 to-slate-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse-slow">
        {/* Header Skeleton */}
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800/40 pb-6">
          <div className="space-y-2.5">
            <div className="h-3 w-40 bg-slate-200 dark:bg-slate-800/60 rounded" />
            <div className="h-8 w-80 bg-slate-200 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-4 w-96 max-w-full bg-slate-200 dark:bg-slate-800/60 rounded-lg" />
          </div>
          <div className="flex space-x-3 shrink-0">
            <div className="h-10 w-44 bg-slate-200 dark:bg-slate-800/60 rounded-xl" />
            <div className="h-10 w-24 bg-slate-200 dark:bg-slate-800/60 rounded-xl" />
          </div>
        </div>

        {/* Subtabs Skeleton */}
        <div className="h-10 w-80 bg-slate-200/40 dark:bg-slate-800/20 rounded-xl border border-slate-200/40 dark:border-slate-800/20" />

        {/* Subtab content skeletons */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main skeleton content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="h-48 w-full bg-slate-200/40 dark:bg-slate-800/30 rounded-2xl border border-slate-200/60 dark:border-slate-800/40" />
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <div className="h-4.5 w-48 bg-slate-200 dark:bg-slate-800/60 rounded" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-20 w-full bg-slate-100/50 dark:bg-slate-800/30 rounded-xl" />
                ))}
              </div>
            </div>
          </div>

          {/* Side stats skeleton */}
          <div className="glass-card rounded-2xl p-6 space-y-4">
            <div className="h-4.5 w-36 bg-slate-200 dark:bg-slate-800/60 rounded" />
            <div className="grid grid-cols-2 gap-3.5">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-24 w-full bg-slate-100/50 dark:bg-slate-800/30 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER GOAL FORM SETUP
  // ==========================================
  if (!goal) {
    return (
      <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn p-4">
        {/* Banner */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-primary to-purple-600 p-[1.5px] mx-auto shadow-md shadow-primary/20 animate-pulse">
            <div className="w-full h-full bg-slate-950 rounded-[15px] flex items-center justify-center">
              <Compass className="w-7 h-7 text-cyan-400" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-extrabold text-secondary-dark dark:text-white tracking-tight font-outfit">
              Initialize Career Copilot AI
            </h1>
            <p className="text-sm text-secondary-light dark:text-slate-400 mt-1.5 max-w-lg mx-auto">
              Our GPS algorithm calibrates target roles, missing resume skills, and study constraints to plot a month-by-month learning curriculum and projects roadmap.
            </p>
          </div>
        </div>

        {/* Goal Form Card */}
        <div className="glass-card rounded-2xl p-6 sm:p-8">
          <form onSubmit={handleSubmitGoalForm} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Target Role Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Target Role</label>
                <select
                  required
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary cursor-pointer transition-all"
                >
                  <option value="" disabled>Select Target Career Path</option>
                  <option value="Frontend Developer">Frontend Developer</option>
                  <option value="Backend Developer">Backend Developer</option>
                  <option value="Full Stack Developer">Full Stack Developer</option>
                  <option value="Flutter Developer">Flutter Developer</option>
                  <option value="Data Analyst">Data Analyst</option>
                  <option value="AI Engineer">AI Engineer</option>
                  <option value="UI/UX Designer">UI/UX Designer</option>
                  <option value="Software Engineer">Software Engineer (General)</option>
                </select>
              </div>

              {/* Timeline Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Timeline Target</label>
                <select
                  value={timelineMonths}
                  onChange={(e) => setTimelineMonths(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary cursor-pointer transition-all"
                >
                  <option value={1}>1 Month</option>
                  <option value={2}>2 Months</option>
                  <option value={3}>3 Months</option>
                  <option value={4}>4 Months</option>
                  <option value={6}>6 Months</option>
                  <option value={9}>9 Months</option>
                  <option value={12}>12 Months</option>
                </select>
              </div>

              {/* Experience Level Selector */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Current Skill Level</label>
                <select
                  value={currentSkillLevel}
                  onChange={(e) => setCurrentSkillLevel(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary cursor-pointer transition-all"
                >
                  <option value="Beginner">Beginner (No past experience)</option>
                  <option value="Learning">Learning (Basic foundations built)</option>
                  <option value="Developing">Developing (Ready to build portfolio apps)</option>
                </select>
              </div>

              {/* Hours Available Per Day */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Daily Available Study Hours</label>
                <select
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary cursor-pointer transition-all"
                >
                  <option value={1}>1 Hour / day</option>
                  <option value={2}>2 Hours / day</option>
                  <option value={3}>3 Hours / day</option>
                  <option value={4}>4 Hours / day</option>
                  <option value={6}>6+ Hours / day</option>
                </select>
              </div>

              {/* Learning Style */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">Preferred Learning Style</label>
                <select
                  value={preferredLearningStyle}
                  onChange={(e) => setPreferredLearningStyle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary cursor-pointer transition-all"
                >
                  <option value="Practical">Practical (Hands-on coding, building projects)</option>
                  <option value="Visual">Visual (Video tutorials, structural graphs)</option>
                  <option value="Theoretical">Theoretical (Reading docs, academic books)</option>
                </select>
              </div>

              {/* Manual Skill Tags */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">List your Current Skills</label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    placeholder="e.g. HTML, JavaScript, Figma..."
                    className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 text-slate-800 dark:text-slate-200 text-sm focus:outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary transition-all"
                    onKeyDown={(e) => { if(e.key === 'Enter') { e.preventDefault(); handleAddSkill(e); } }}
                  />
                  <button
                    type="button"
                    onClick={handleAddSkill}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700/80 rounded-xl text-xs font-bold transition-all text-slate-700 dark:text-slate-200 flex items-center space-x-1"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add</span>
                  </button>
                </div>
                
                {currentSkills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2">
                    {currentSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 text-[10px] font-extrabold bg-primary/10 border border-primary/20 text-primary dark:text-cyan-400 rounded-full flex items-center space-x-1 uppercase tracking-wider animate-scaleIn"
                      >
                        <span>{skill}</span>
                        <button type="button" onClick={() => handleRemoveSkill(skill)} className="hover:text-error text-slate-400 cursor-pointer ml-1 select-none font-black text-xs">×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

            </div>

            <button
              type="submit"
              disabled={submitting || !targetRole}
              className="w-full py-3.5 px-5 btn-ai-bloom text-white rounded-xl font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Synthesizing custom roadmap curriculum...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Calibrate System & Generate Roadmap</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER CAREER OPERATING SYSTEM ACTIVE VIEW
  // ==========================================
  return (
    <div className="space-y-8 animate-fadeIn selection:bg-primary/20">
      
      {/* Dynamic Header Cockpit Dashboard */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 border-b border-slate-100 dark:border-slate-800/40 pb-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-primary dark:text-cyan-400">ACTIVE AI COPILOT STATUS</span>
          <h1 className="text-3xl font-extrabold text-secondary-dark dark:text-white tracking-tight font-outfit mt-1 flex items-center gap-2">
            <span>Career GPS Cockpit</span>
            <span className="bg-primary/10 text-primary border border-primary/20 text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
              {goal.targetRole}
            </span>
          </h1>
          <p className="text-xs text-secondary-light dark:text-slate-400 mt-1 max-w-xl">
            Google Maps for Careers. Re-routing your skill acquisition steps, validating deployment items, and measuring hirable metrics in real time.
          </p>
        </div>

        {/* Adaptive Roadmap Trigger */}
        <div className="flex items-center space-x-3 self-start xl:self-auto shrink-0">
          <button
            onClick={handleAdaptiveRecalculate}
            disabled={recalculating}
            className="px-4.5 py-2.5 text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white dark:bg-white dark:hover:bg-slate-100 dark:text-slate-900 border border-slate-800 dark:border-white rounded-xl flex items-center space-x-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
            title="Recalculate learning modules dynamically based on new resume uploads or verified skill updates"
          >
            {recalculating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Re-routing...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Trigger Adaptive Re-route</span>
              </>
            )}
          </button>
          
          <button
            onClick={() => { if(confirm('Reset current career goal? This deletes active roadmaps and weekly progress checklist.')) setGoal(null); }}
            className="px-4 py-2.5 text-xs font-bold text-error bg-error/5 hover:bg-error/10 border border-error/15 rounded-xl cursor-pointer transition-colors"
          >
            Reset Goal
          </button>
        </div>
      </div>

      {/* Sub Tabs Toggle (GPS / Roadmap / Projects) */}
      <div className="flex border-b border-slate-100 dark:border-slate-800/40 p-1 bg-slate-50/50 dark:bg-slate-950/20 max-w-sm rounded-xl">
        {[
          { id: 'gps', label: 'Career GPS', icon: Target },
          { id: 'roadmap', label: 'Roadmap & Missions', icon: Map },
          { id: 'projects', label: 'Projects recommending', icon: FolderKanban }
        ].map((subTab) => {
          const Icon = subTab.icon;
          const isActive = activeSubTab === subTab.id;
          return (
            <button
              key={subTab.id}
              onClick={() => setActiveSubTab(subTab.id as any)}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center space-x-1.5 cursor-pointer ${
                isActive 
                  ? 'bg-white/85 dark:bg-slate-900 text-primary dark:text-cyan-400 shadow-sm border border-slate-200/50 dark:border-slate-800/40 !transform-none !shadow-xs' 
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{subTab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dashboard Sub Tab Render panels */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="space-y-6"
        >
          {/* ==========================================
              SUB-TAB 1: CAREER GPS SUMMARY
              ========================================== */}
          {activeSubTab === 'gps' && gps && readiness && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* GPS HUD Info Widget */}
              <div className="lg:col-span-2 glowing-border-active rounded-2xl p-6 relative overflow-hidden shadow-lg group">
                <div className="absolute -right-20 -top-20 w-44 h-44 bg-primary/10 rounded-full blur-3xl pointer-events-none group-hover:bg-primary/20 transition-all duration-300"></div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Compass className="w-5 h-5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">SYSTEM GPS LOCATION</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r ${getGPSBadgeColor(gps.currentLevel)}`}>
                    Level: {gps.currentLevel}
                  </span>
                </div>

                <div className="mt-8 space-y-6">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Next Step (Destination: {gps.destinationRole})</span>
                    <h3 className="text-xl font-extrabold font-outfit mt-1.5 text-cyan-400">
                      {gps.nextStep}
                    </h3>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold">
                      <span className="text-slate-400">Total Hirable Readiness Route completed</span>
                      <span className="text-primary font-black">{gps.progressPercentage}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                      <motion.div 
                        className="h-full bg-gradient-to-r from-primary to-cyan-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${gps.progressPercentage}%` }}
                        transition={{ duration: 1.2, ease: "easeOut" }}
                      />
                    </div>
                  </div>

                  {/* Arrival details */}
                  <div className="flex flex-wrap items-center gap-6 pt-2 border-t border-white/5 text-xs">
                    <div className="flex items-center space-x-1.5">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="text-slate-400 block font-semibold text-[9px] uppercase tracking-wide">ESTIMATED TIMELINE</span>
                        <span className="font-extrabold text-slate-200">{gps.weeksRemaining} Weeks remaining</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-1.5">
                      <Award className="w-4 h-4 text-slate-400" />
                      <div>
                        <span className="text-slate-400 block font-semibold text-[9px] uppercase tracking-wide">TARGET JOB-READY DATE</span>
                        <span className="font-extrabold text-slate-200">{gps.estimatedReadyDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dials breakdown panel */}
              <div className="glass-card rounded-2xl p-6 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-black text-secondary-dark dark:text-white uppercase tracking-wider font-outfit mb-4">Job Readiness Components</h3>
                  <div className="grid grid-cols-2 gap-3.5">
                    <CircularProgress value={readiness.resumeScore} label="Resume" colorClass="text-indigo-500" />
                    <CircularProgress value={readiness.skillScore} label="Skills" colorClass="text-amber-500" />
                    <CircularProgress value={readiness.projectScore} label="Projects" colorClass="text-emerald-500" />
                    <CircularProgress value={readiness.interviewScore} label="Interviews" colorClass="text-rose-500" />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/40 text-center">
                  <div className="inline-flex items-center space-x-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
                    <Zap className="w-3.5 h-3.5 text-primary" />
                    <span>Proprietary overall readiness: {readiness.overallScore}/100</span>
                  </div>
                </div>
              </div>

              {/* Action list of suggestions (3 columns layout) */}
              <div className="lg:col-span-3 glass-card rounded-2xl p-6 space-y-4">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  <h3 className="text-sm font-black text-secondary-dark dark:text-white uppercase tracking-wider font-outfit">AI Recommended Improvement Strategy</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {readiness.improvementSuggestions.map((item, idx) => (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50/30 dark:bg-slate-950/20 text-xs font-semibold text-slate-600 dark:text-slate-300 leading-relaxed flex items-start space-x-3"
                    >
                      <span className="w-5 h-5 rounded-full bg-primary/10 border border-primary/20 text-primary shrink-0 flex items-center justify-center font-bold text-[10px]">
                        {idx + 1}
                      </span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* ==========================================
              SUB-TAB 2: MONTHLY ROADMAP & MISSIONS
              ========================================== */}
          {activeSubTab === 'roadmap' && roadmap && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Left 2 Columns: Roadmap modules timeline */}
              <div className="lg:col-span-2 space-y-5">
                <div className="glass-card rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-secondary-dark dark:text-white font-outfit">Month-by-Month learning curriculum</h3>
                      <p className="text-xs text-secondary-light dark:text-slate-400 mt-0.5">Dynamically structured learning targets aligned with your timeline goals.</p>
                    </div>
                  </div>

                  {/* Modules Accordion */}
                  <div className="space-y-4">
                    {roadmap.modules.map((m) => {
                      const isExpanded = expandedMonths[m.monthNumber];
                      return (
                        <div 
                          key={m.id}
                          className="border border-slate-100 dark:border-slate-800/60 rounded-xl overflow-hidden bg-slate-50/20 dark:bg-slate-950/10"
                        >
                          {/* Accordion header */}
                          <div 
                            onClick={() => toggleMonthExpansion(m.monthNumber)}
                            className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-950/60 transition-all select-none border-b border-transparent data-[expanded=true]:border-slate-100 dark:data-[expanded=true]:border-slate-800/40"
                            data-expanded={isExpanded}
                          >
                            <div className="flex items-center space-x-3.5 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 text-primary flex items-center justify-center font-outfit font-black shrink-0">
                                M{m.monthNumber}
                              </div>
                              <div className="min-w-0">
                                <h4 className="text-sm font-bold text-secondary-dark dark:text-slate-200 truncate pr-4">
                                  {m.title}
                                </h4>
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
                                  Includes {m.weeklyMissions?.length || 4} weekly learning plans
                                </span>
                              </div>
                            </div>
                            <div>
                              {isExpanded ? <ChevronDown className="w-5 h-5 text-slate-400" /> : <ChevronRight className="w-5 h-5 text-slate-400" />}
                            </div>
                          </div>

                          {/* Accordion Body */}
                          <AnimatePresence initial={false}>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: 'auto' }}
                                exit={{ height: 0 }}
                                transition={{ duration: 0.2 }}
                                className="overflow-hidden"
                              >
                                <div className="p-4.5 border-t border-slate-100 dark:border-slate-800/60 space-y-4 bg-slate-50/20 dark:bg-slate-950/20">
                                  
                                  {/* Description & skills to learn */}
                                  <div className="space-y-2 text-xs">
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Description & Core Concepts</span>
                                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed font-semibold">
                                      {m.description}
                                    </p>
                                    
                                    <div className="flex flex-wrap gap-1.5 pt-2">
                                      {m.skillsToLearn.map((skill: string, idx: number) => (
                                        <span 
                                          key={idx}
                                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200/40 dark:border-slate-700/60"
                                        >
                                          {skill}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Practical Month Project card */}
                                  <div className="p-4 rounded-xl border border-primary/10 bg-primary/3 dark:bg-primary/2 shadow-xs space-y-2 border-l-3 border-l-primary">
                                    <span className="text-[9px] font-bold text-primary dark:text-cyan-400 uppercase tracking-wider flex items-center space-x-1">
                                      <Zap className="w-3 h-3" />
                                      <span>Month milestone project target</span>
                                    </span>
                                    <h5 className="text-xs font-black text-secondary-dark dark:text-slate-200 font-outfit">{m.projectTitle}</h5>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                      {m.projectDescription}
                                    </p>
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
              </div>

              {/* Right 1 Column: Weekly Missions checklists */}
              <div className="glass-card rounded-2xl p-6 flex flex-col">
                <div className="flex items-center space-x-2 mb-4">
                  <CheckSquare className="w-5 h-5 text-primary shrink-0" />
                  <div>
                    <h3 className="text-sm font-black text-secondary-dark dark:text-white uppercase tracking-wider font-outfit">Active Weekly missions</h3>
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide block">Checkpoint checklist</span>
                  </div>
                </div>

                <div className="space-y-4 overflow-y-auto max-h-[600px] flex-1 divide-y divide-slate-100 dark:divide-slate-800/40 pr-1">
                  {missions.length === 0 ? (
                    <p className="text-xs text-secondary-light dark:text-slate-400 italic text-center py-10">No missions compiled. Adjust goals or recalculate.</p>
                  ) : (
                    missions.map((mission) => {
                      const completedTasks = mission.tasks.filter(t => t.status === 'Completed').length;
                      const isMissionCompleted = mission.status === 'Completed';

                      return (
                        <div key={mission.id} className="pt-4 first:pt-0 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-primary dark:text-cyan-400 uppercase tracking-wider">
                              M{mission.monthNumber} • Week {mission.weekNumber}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                              isMissionCompleted 
                                ? 'bg-success/10 text-success border border-success/20' 
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                            }`}>
                              {completedTasks}/{mission.tasks.length} Done
                            </span>
                          </div>

                          <h4 className="text-xs font-black text-secondary-dark dark:text-slate-200 font-outfit">
                            {mission.title}
                          </h4>

                          {/* Task Checklists */}
                          <div className="space-y-2">
                            {mission.tasks.map((task) => {
                              const isCompleted = task.status === 'Completed';
                              return (
                                <div 
                                  key={task.id}
                                  onClick={() => handleToggleTask(mission.id, task.id, task.status)}
                                  className="flex items-start space-x-2.5 p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-950/60 cursor-pointer select-none border border-transparent hover:border-slate-100 dark:hover:border-slate-800/30 transition-all"
                                >
                                  <div className="mt-0.5 shrink-0">
                                    <input
                                      type="checkbox"
                                      checked={isCompleted}
                                      readOnly
                                      className="rounded border-slate-300 text-primary focus:ring-primary w-3.5 h-3.5 cursor-pointer"
                                    />
                                  </div>
                                  <span className={`text-[11px] font-medium leading-relaxed ${
                                    isCompleted 
                                      ? 'text-slate-400 dark:text-slate-500 line-through font-normal' 
                                      : 'text-slate-700 dark:text-slate-300'
                                  }`}>
                                    {task.text}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          )}

          {/* ==========================================
              SUB-TAB 3: PROJECT RECOMMENDATION DESK
              ========================================== */}
          {activeSubTab === 'projects' && (
            <div className="space-y-6">
              <div className="glass-card rounded-2xl p-6">
                <h3 className="text-lg font-bold text-secondary-dark dark:text-white font-outfit">Custom Recommended Portfolio Projects</h3>
                <p className="text-xs text-secondary-light dark:text-slate-400 mt-0.5">
                  AI-recommended real-world projects calibrated to demonstrate missing resume skills and stand out to hiring managers.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                  {projects.length === 0 ? (
                    <div className="col-span-full py-16 text-center text-xs text-slate-400 italic">No recommendations loaded yet. Please trigger an adaptive re-route.</div>
                  ) : (
                    projects.map((p) => {

                      return (
                        <div 
                          key={p.id}
                          className="flex flex-col justify-between p-5 rounded-2xl glass-card hover-lift relative overflow-hidden"
                        >
                          <div>
                            {/* Header badges */}
                            <div className="flex items-center justify-between mb-4">
                              <span className={`px-2.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider border ${getDifficultyColor(p.difficulty)}`}>
                                {p.difficulty}
                              </span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-bold flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{p.estimatedCompletionTime}</span>
                              </span>
                            </div>

                            <h4 className="text-sm font-extrabold text-secondary-dark dark:text-white font-outfit mb-2">
                              {p.name}
                            </h4>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-relaxed font-semibold mb-4">
                              {p.description}
                            </p>

                            {/* Skills demonstrated */}
                            <div className="flex flex-wrap gap-1 mb-6">
                              {p.skillsDemonstrated.map((skill, idx) => (
                                <span 
                                  key={idx}
                                  className="px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-900 border border-slate-200/30 dark:border-slate-800/40 text-[9px] font-bold text-slate-500 dark:text-slate-400"
                                >
                                  {skill}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Status toggle buttons */}
                          <div className="grid grid-cols-3 gap-1 border-t border-slate-100 dark:border-slate-800/40 pt-4">
                            {[
                              { id: 'Pending', label: 'Todo' },
                              { id: 'In_Progress', label: 'Doing' },
                              { id: 'Completed', label: 'Done' }
                            ].map((btn) => {
                              const isBtnActive = p.status === btn.id;
                              return (
                                <button
                                  key={btn.id}
                                  onClick={() => handleUpdateProjectStatus(p.id, btn.id as any)}
                                  className={`py-1.5 text-[9px] font-black rounded-lg uppercase tracking-wider cursor-pointer transition-all ${
                                    isBtnActive 
                                      ? btn.id === 'Completed' 
                                        ? 'bg-success text-white' 
                                        : btn.id === 'In_Progress' 
                                          ? 'bg-warning text-slate-900' 
                                          : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' 
                                      : 'bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                                  }`}
                                >
                                  {btn.label}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

    </div>
  );
};
