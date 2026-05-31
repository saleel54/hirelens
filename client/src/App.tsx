import { useState } from 'react';
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
  const handleTabChange = (tab: TabName) => {
    setActiveTab(tab);
    setActiveReportData(null);
  };

  // Triggers when user clicks "View Report" on history row or completes analysis
  const handleViewReport = async (analysisId: number) => {
    try {
      // Set loader or fetch directly
      const data = await apiClient(`/analysis/history/${analysisId}`);
      setActiveReportData(data);
    } catch (err) {
      console.error('Failed to retrieve analysis details:', err);
      alert('Failed to retrieve analysis details. Please try again.');
    }
  };

  const handleAnalysisSuccess = (analysisData: any) => {
    setActiveReportData(analysisData);
  };

  const handleBackToDashboard = () => {
    setActiveReportData(null);
    setActiveTab('dashboard');
  };

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
    <div className="flex bg-background min-h-screen">
      {/* Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
      />

      {/* Main Content Pane */}
      <main className="flex-1 p-8 overflow-y-auto max-h-screen flex flex-col justify-between">
        <div className="flex-1">
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
