import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthPages } from './pages/AuthPages';
import { Sidebar } from './components/layout/Sidebar';
import type { TabName } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { History } from './pages/History';
import { MockInterview } from './pages/MockInterview';
import { About } from './pages/About';
import { AnalyzeResume } from './pages/AnalyzeResume';
import { Profile } from './pages/Profile';
import { Report } from './pages/Report';
import { Loader2 } from 'lucide-react';
import { apiClient } from './services/api';

function AppContent() {
  const { user, token, loading } = useAuth();
  const [activeTab, setActiveTab] = useState<TabName>('dashboard');
  const [activeReportData, setActiveReportData] = useState<any | null>(null);

  // Switch tab and clear active report view
  const handleTabChange = (tab: TabName, preventPush = false) => {
    setActiveTab(tab);
    setActiveReportData(null);
    if (!preventPush) {
      window.history.pushState({ tab }, '', '#' + tab);
    }
  };

  // Triggers when user clicks "View Report" on history row or completes analysis
  const handleViewReport = async (analysisId: number, preventPush = false) => {
    try {
      const data = await apiClient(`/analysis/history/${analysisId}`);
      setActiveReportData(data);
      if (!preventPush) {
        window.history.pushState({ tab: 'report', reportId: analysisId }, '', `#report-${analysisId}`);
      }
    } catch (err) {
      console.error('Failed to retrieve analysis details:', err);
      alert('Failed to retrieve analysis details. Please try again.');
    }
  };

  const handleAnalysisSuccess = (analysisData: any) => {
    setActiveReportData(analysisData);
    if (analysisData && analysisData.id) {
      window.history.pushState({ tab: 'report', reportId: analysisData.id }, '', `#report-${analysisData.id}`);
    }
  };

  const handleBackToDashboard = () => {
    setActiveReportData(null);
    setActiveTab('dashboard');
    window.history.pushState({ tab: 'dashboard' }, '', '#dashboard');
  };

  // Synchronize initial hash fragment and handle back/forward navigation popstate
  useEffect(() => {
    // 1. Establish/restore initial state from hash fragment
    const hash = window.location.hash.replace('#', '');
    const validTabs: TabName[] = ['dashboard', 'analyze', 'history', 'interview', 'about', 'profile'];
    
    if (hash.startsWith('report-')) {
      const reportId = parseInt(hash.replace('report-', ''), 10);
      if (!isNaN(reportId)) {
        window.history.replaceState({ tab: 'report', reportId }, '', '#' + hash);
        handleViewReport(reportId, true);
      } else {
        window.history.replaceState({ tab: 'dashboard' }, '', '#dashboard');
      }
    } else if (validTabs.includes(hash as TabName)) {
      setActiveTab(hash as TabName);
      window.history.replaceState({ tab: hash }, '', '#' + hash);
    } else {
      window.history.replaceState({ tab: 'dashboard' }, '', '#dashboard');
    }

    // 2. Popstate listener to handle browser back button
    const handlePopState = (event: PopStateEvent) => {
      if (event.state && event.state.tab) {
        if (event.state.tab === 'report') {
          handleViewReport(event.state.reportId, true);
        } else {
          setActiveTab(event.state.tab);
          setActiveReportData(null);
        }
      } else {
        setActiveTab('dashboard');
        setActiveReportData(null);
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // 1. Session check loader
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <Loader2 className="w-10 h-10 text-primary animate-spin mb-3.5" />
        <p className="text-sm font-semibold text-slate-400">Syncing active session context...</p>
      </div>
    );
  }

  // 2. Auth Guard
  if (!user || !token) {
    return <AuthPages />;
  }

  // 3. Authenticated App Layout
  return (
    <div className="flex flex-col lg:flex-row bg-background min-h-screen">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
      />

      {/* Main Content Pane */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto lg:max-h-screen flex flex-col justify-between">
        <div className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeReportData ? `report-${activeReportData.id}` : activeTab}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="flex-1 flex flex-col"
            >
              {activeReportData ? (
                <Report 
                  data={activeReportData} 
                  onBackToDashboard={handleBackToDashboard}
                />
              ) : (
                <>
                  {activeTab === 'dashboard' && (
                    <Dashboard 
                      onTabChange={handleTabChange} 
                      onViewReport={handleViewReport} 
                    />
                  )}
                  
                  {activeTab === 'analyze' && (
                    <AnalyzeResume 
                      onAnalysisSuccess={handleAnalysisSuccess} 
                    />
                  )}

                  {activeTab === 'history' && (
                    <History 
                      onTabChange={handleTabChange} 
                      onViewReport={handleViewReport} 
                    />
                  )}

                  {activeTab === 'interview' && (
                    <MockInterview />
                  )}

                  {activeTab === 'about' && (
                    <About />
                  )}

                  {activeTab === 'profile' && (
                    <Profile />
                  )}
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Global Luxury Branding Footer */}
        <footer className="mt-16 pt-6 border-t border-slate-100 dark:border-slate-800/40 text-center text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none select-none">
          Built independently by Yoosuf Ali Saleel • Powered by YAStudio
        </footer>
      </main>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
