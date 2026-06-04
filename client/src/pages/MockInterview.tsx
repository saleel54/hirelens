import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { apiClient } from '../services/api';
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  HelpCircle,
  MessageSquare,
  Award,
  Send,
  Zap,
  RefreshCw,
  Mic,
  MicOff,
  FileText
} from 'lucide-react';

interface AnalysisRecord {
  id: number;
  job_role: string;
  created_at: string;
  interview_questions?: {
    technical: string[];
    behavioral: string[];
    hr: string[];
  };
}

interface EvaluationResult {
  score: number;
  feedback: string;
  starStrengths: string[];
  starWeaknesses: string[];
  suggestedAnswer: string;
}

interface MockInterviewProps {
  onTabChange?: (tab: any) => void;
}

export const MockInterview: React.FC<MockInterviewProps> = ({ onTabChange }) => {
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // Tab states
  const [activeCategory, setActiveCategory] = useState<'technical' | 'behavioral' | 'hr'>('technical');
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);
  
  // Practice simulator states
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [evaluating, setEvaluating] = useState<boolean>(false);
  const [evaluationResult, setEvaluationResult] = useState<EvaluationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Voice Answering (Web Speech API) States & References
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(false);
  const recognitionRef = React.useRef<any>(null);
  const lastProcessedIndexRef = React.useRef<number>(-1);

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = false; // Disable unused interim results to reduce CPU and increase stability
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsRecording(true);
        setErrorMsg(null);
        lastProcessedIndexRef.current = -1; // Reset index tracking on new recording session
      };

      rec.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          // Only append new final result segments we haven't processed yet
          if (event.results[i].isFinal && i > lastProcessedIndexRef.current) {
            finalTranscript += event.results[i][0].transcript + ' ';
            lastProcessedIndexRef.current = i;
          }
        }
        
        if (finalTranscript) {
          setUserAnswer(prev => {
            const cleanPrev = prev.trim();
            return cleanPrev ? `${cleanPrev} ${finalTranscript.trim()}` : finalTranscript.trim();
          });
        }
      };

      rec.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setErrorMsg('Microphone access was denied. Please permit microphone permissions in your browser settings to speak your answers.');
        } else {
          setErrorMsg(`Voice recognition failed: ${event.error}. Please try typing your answer.`);
        }
        setIsRecording(false);
      };

      rec.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setErrorMsg(null);
      try {
        recognitionRef.current.start();
      } catch (err: any) {
        console.error('Failed starting speech recognition:', err);
      }
    }
  };

  const fetchRecords = async () => {
    try {
      const data = await apiClient('/analysis/history');
      if (data && data.history && data.history.length > 0) {
        setHistory(data.history);
        
        // Load details for the latest record (which has full questions)
        const latestDetail = await apiClient(`/analysis/history/${data.history[0].id}`);
        setSelectedRecord(latestDetail);
        
        // Select the first question by default
        const techQuestions = latestDetail.interviewQuestions?.technical || [];
        if (techQuestions.length > 0) {
          setSelectedQuestion(techQuestions[0]);
        }
      }
    } catch (err) {
      console.error('Failed to fetch interview practice data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordSelect = async (id: number) => {
    setLoading(true);
    setSelectedQuestion(null);
    setEvaluationResult(null);
    setUserAnswer('');
    setErrorMsg(null);
    
    try {
      const detail = await apiClient(`/analysis/history/${id}`);
      setSelectedRecord(detail);
      
      const categoryQuestions = detail.interviewQuestions?.[activeCategory] || [];
      if (categoryQuestions.length > 0) {
        setSelectedQuestion(categoryQuestions[0]);
      }
    } catch (err) {
      console.error('Failed to change record context:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (category: 'technical' | 'behavioral' | 'hr') => {
    setActiveCategory(category);
    setEvaluationResult(null);
    setUserAnswer('');
    setErrorMsg(null);
    
    if (selectedRecord) {
      const questions = selectedRecord.interview_questions?.[category] || 
                        (selectedRecord as any).interviewQuestions?.[category] || [];
      if (questions.length > 0) {
        setSelectedQuestion(questions[0]);
      } else {
        setSelectedQuestion(null);
      }
    }
  };

  const handleQuestionSelect = (question: string) => {
    setSelectedQuestion(question);
    setEvaluationResult(null);
    setUserAnswer('');
    setErrorMsg(null);
  };

  const handleSubmitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedQuestion || !userAnswer.trim()) return;
    
    if (userAnswer.trim().length < 20) {
      setErrorMsg('Answer too short. Please provide a detailed response (at least 20 characters) for a meaningful AI evaluation.');
      return;
    }

    setEvaluating(true);
    setErrorMsg(null);
    
    try {
      const result = await apiClient('/analysis/evaluate-answer', {
        method: 'POST',
        body: JSON.stringify({
          question: selectedQuestion,
          answer: userAnswer,
          jobRole: selectedRecord?.job_role
        })
      });
      setEvaluationResult(result);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to submit response to AI evaluator. Please try again.');
    } finally {
      setEvaluating(false);
    }
  };

  const resetPractice = () => {
    if (isRecording && recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setEvaluationResult(null);
    setUserAnswer('');
    setErrorMsg(null);
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-success bg-success/10 border border-success/20';
    if (score >= 6) return 'text-warning bg-warning/10 border border-warning/20';
    return 'text-error bg-error/10 border border-error/20';
  };

  // Safe question extractor supporting multiple casing formats from different DB rows
  const getQuestionsList = (category: 'technical' | 'behavioral' | 'hr'): string[] => {
    if (!selectedRecord) return [];
    return selectedRecord.interview_questions?.[category] || 
           (selectedRecord as any).interviewQuestions?.[category] || [];
  };

  // Animation configurations
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
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-extrabold text-secondary-dark dark:text-white tracking-tight font-outfit">
          AI Mock Interview Simulator
        </h1>
        <p className="text-sm text-secondary-light dark:text-slate-400 mt-1">
          Select custom-generated questions from your resume reviews, type your answer, and receive real-time scoring and STAR evaluations.
        </p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-pulse-slow">
          {/* Left Pane Skeletons */}
          <div className="space-y-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 shadow-xs rounded-2xl p-4 space-y-2">
              <div className="h-2.5 w-24 bg-slate-200 dark:bg-slate-800/60 rounded" />
              <div className="h-8 w-full bg-slate-100 dark:bg-slate-850 rounded-xl" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 shadow-xs rounded-2xl overflow-hidden flex flex-col h-96 space-y-4 p-4">
              <div className="flex space-x-2 border-b border-slate-100 dark:border-slate-850 pb-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-7 flex-1 bg-slate-200 dark:bg-slate-850 rounded-lg" />
                ))}
              </div>
              <div className="space-y-3 flex-1 overflow-hidden">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 w-full bg-slate-100 dark:bg-slate-850 rounded-xl" />
                ))}
              </div>
            </div>
          </div>
          {/* Right Pane Skeletons */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 shadow-xs rounded-2xl p-6 space-y-3">
              <div className="h-3 w-32 bg-slate-200 dark:bg-slate-800/60 rounded" />
              <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800/60 rounded-md" />
            </div>
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800/60 shadow-xs rounded-2xl p-6 space-y-4">
              <div className="h-32 w-full bg-slate-100 dark:bg-slate-850 rounded-xl" />
              <div className="flex justify-between items-center">
                <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800/60 rounded-lg" />
                <div className="h-10 w-36 bg-slate-200 dark:bg-slate-800/60 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
      ) : history.length === 0 ? (
        <div className="relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-white/5 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 p-8 sm:p-12 text-center max-w-xl mx-auto shadow-xs">
          {/* Floating illustrative gradient circles */}
          <div className="absolute -right-20 -top-20 w-36 h-36 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -left-16 -bottom-16 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl pointer-events-none animate-pulse-slow"></div>
          
          <div className="max-w-md mx-auto space-y-5 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary to-indigo-600 p-[1.5px] mx-auto shadow-md shadow-primary/10">
              <div className="w-full h-full bg-slate-50 dark:bg-slate-955 rounded-[14px] flex items-center justify-center text-primary dark:text-cyan-400">
                <MessageSquare className="w-6.5 h-6.5" />
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-extrabold text-slate-850 dark:text-white font-outfit">AI Mock Interview Prep Bank</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold leading-relaxed">
                Unlock custom technical, behavioral, and HR questions generated from your resumes and target jobs. Input voice/text answers to receive detailed score card breakdowns.
              </p>
            </div>
            <button
              type="button"
              onClick={() => { if(onTabChange) onTabChange('analyze'); else window.location.hash = '#analyze'; }}
              className="px-5 py-2.5 text-xs font-bold text-white btn-ai-bloom rounded-xl cursor-pointer shadow-lg inline-flex items-center space-x-1.5"
            >
              <span>Audit Resume to Build Prep Bank</span>
              <FileText className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          {/* Left Pane */}
          <div className="space-y-4">
            <div className="glass-card !transform-none !shadow-xs rounded-2xl p-4 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block">TARGET JOB CONTEXT</label>
              <select
                value={selectedRecord?.id || ''}
                onChange={(e) => handleRecordSelect(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20 text-xs font-bold text-slate-700 dark:text-slate-350 focus:outline-none focus:border-primary focus:bg-white dark:focus:bg-slate-955 focus:ring-1 focus:ring-primary transition-all cursor-pointer"
              >
                {history.map((record) => (
                  <option key={record.id} value={record.id} className="dark:bg-slate-900">
                    {record.job_role}
                  </option>
                ))}
              </select>
            </div>

            <div className="glass-card !transform-none !shadow-xs rounded-2xl overflow-hidden flex flex-col max-h-[500px]">
              <div className="flex border-b border-slate-100 dark:border-slate-800/40 bg-slate-50/30 dark:bg-slate-900/30 p-1">
                {(['technical', 'behavioral', 'hr'] as const).map((cat) => {
                  const labelMap = { technical: 'Tech', behavioral: 'Behavior', hr: 'HR / Fit' };
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => handleCategoryChange(cat)}
                      className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all capitalize cursor-pointer ${
                        isActive 
                          ? 'bg-white/85 dark:bg-slate-800 text-primary dark:text-cyan-400 shadow-sm border border-slate-200/50 dark:border-slate-700/40 !transform-none !shadow-xs' 
                          : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      {labelMap[cat]}
                    </button>
                  );
                })}
              </div>

              <div className="overflow-y-auto p-4 space-y-2.5 flex-1 divide-y divide-slate-50 dark:divide-slate-800/30">
                {getQuestionsList(activeCategory).length === 0 ? (
                  <p className="text-xs text-secondary-light dark:text-slate-450 italic text-center py-8">No questions loaded for this profile.</p>
                ) : (
                  getQuestionsList(activeCategory).map((q, idx) => {
                    const isSelected = selectedQuestion === q;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleQuestionSelect(q)}
                        className={`w-full text-left p-3 rounded-xl text-xs font-semibold leading-relaxed transition-all duration-150 flex items-start space-x-2.5 cursor-pointer ${
                          isSelected 
                            ? 'bg-primary/5 text-primary border border-primary/20 shadow-[inset_1px_0_0_rgba(99,102,241,0.15)] font-bold' 
                            : 'text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-900/30 border border-transparent'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center font-bold text-[9px] ${
                          isSelected ? 'bg-primary text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-500'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="truncate-2-lines">{q}</span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Pane: Simulator */}
          <div className="lg:col-span-2 space-y-6">
            {selectedQuestion ? (
              <>
                <div className="glass-card !transform-none !shadow-xs rounded-2xl p-6 relative overflow-hidden">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-xl pointer-events-none"></div>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-[10px] font-bold text-primary dark:text-cyan-400 uppercase tracking-widest">Active Practice Question</span>
                  </div>
                  
                  <h3 className="text-md font-extrabold text-slate-800 dark:text-white font-outfit leading-relaxed">
                    {selectedQuestion}
                  </h3>
                </div>

                {evaluationResult ? (
                  <div className="glass-card hover-lift rounded-2xl p-6 space-y-6 animate-fadeIn">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-outfit font-extrabold text-lg ${getScoreColor(evaluationResult.score)} shadow-xs`}>
                          <span>{evaluationResult.score}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wide leading-none mt-0.5">/10</span>
                        </div>
                        <div>
                          <h4 className="font-extrabold text-slate-800 dark:text-white font-outfit text-md flex items-center space-x-1.5">
                            <Award className="w-4.5 h-4.5 text-primary shrink-0" />
                            <span>AI Performance Evaluation</span>
                          </h4>
                          <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-550">STAR Method & Conceptual Clarity Grade</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={resetPractice}
                        className="self-start sm:self-auto px-4.5 py-2 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/15 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Practice Again</span>
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <h5 className="text-[10px] font-bold text-slate-400 dark:text-slate-555 uppercase tracking-widest">AI Assessment feedback</h5>
                      <p className="text-xs text-slate-700 dark:text-slate-350 leading-relaxed font-semibold">
                        {evaluationResult.feedback}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      <div className="p-4 rounded-xl border border-success/20 bg-success/5 dark:bg-success/2 space-y-2.5">
                        <h5 className="text-xs font-bold text-success flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>What you did right (Strengths)</span>
                        </h5>
                        <ul className="space-y-1.5">
                          {evaluationResult.starStrengths.map((item, idx) => (
                            <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed flex items-start space-x-1.5">
                              <span className="text-success select-none shrink-0">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="p-4 rounded-xl border border-error/20 bg-error/5 dark:bg-error/2 space-y-2.5">
                        <h5 className="text-xs font-bold text-error flex items-center space-x-1.5">
                          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                          <span>Areas to improve (Weaknesses)</span>
                        </h5>
                        <ul className="space-y-1.5">
                          {evaluationResult.starWeaknesses.map((item, idx) => (
                            <li key={idx} className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed flex items-start space-x-1.5">
                              <span className="text-error select-none shrink-0">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white dark:from-slate-900/60 dark:to-slate-850/60 border dark:border-slate-800/40 space-y-3 relative overflow-hidden group">
                      <div className="absolute -right-10 -top-10 w-24 h-24 bg-primary/20 rounded-full blur-xl"></div>
                      
                      <div className="flex items-center space-x-1.5 text-primary dark:text-cyan-400">
                        <Zap className="w-4.5 h-4.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider font-outfit">Recruiter Suggested Answer (10/10)</span>
                      </div>
                      
                      <p className="text-xs text-slate-300 dark:text-slate-200 leading-relaxed italic">
                        "{evaluationResult.suggestedAnswer}"
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card !transform-none !shadow-xs rounded-2xl p-6">
                    <form onSubmit={handleSubmitAnswer} className="space-y-5">
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <label className="text-xs font-bold text-slate-400 dark:text-slate-550 tracking-wide uppercase">YOUR RESPONSE</label>
                          <div className="flex items-center space-x-3">
                            {speechSupported && (
                              <button
                                type="button"
                                onClick={toggleRecording}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all duration-300 cursor-pointer border ${
                                  isRecording 
                                    ? 'bg-error text-white border-error shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse' 
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-800 dark:hover:bg-slate-800'
                                }`}
                              >
                                {isRecording ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5 text-primary" />}
                                <span>{isRecording ? 'Listening (Click to Stop)' : 'Answer by Voice'}</span>
                              </button>
                            )}
                            <span className="text-[10px] text-slate-400 font-bold">STAR METHOD RECOMMENDED</span>
                          </div>
                        </div>
                        
                        <textarea
                          required
                          rows={8}
                          value={userAnswer}
                          onChange={(e) => { setUserAnswer(e.target.value); setErrorMsg(null); }}
                          placeholder="Type your response here... (Explain Situation, Task, Action, and Result where applicable)"
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-550 text-slate-800 dark:text-slate-100 focus:outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary transition-all leading-relaxed"
                          disabled={evaluating}
                        ></textarea>
                      </div>

                      {errorMsg && (
                        <div className="p-3.5 rounded-lg bg-error/10 border border-error/20 text-xs font-semibold text-error flex items-start space-x-2 animate-shake">
                          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                          <span>{errorMsg}</span>
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={evaluating || !userAnswer.trim()}
                        className="w-full py-3 px-5 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold text-xs shadow-md shadow-primary/10 hover:shadow-lg hover:shadow-primary/20 flex items-center justify-center space-x-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {evaluating ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                            <span>AI Evaluating answer metrics...</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-3.5 h-3.5" />
                            <span>Submit Response for AI Grading</span>
                          </>
                        )}
                      </button>
                    </form>
                  </div>
                )}
              </>
            ) : (
              <div className="bg-white dark:bg-slate-955 border border-slate-200 dark:border-slate-800/40 shadow-xs rounded-2xl p-10 text-center text-slate-400 dark:text-slate-500 space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-300 dark:text-slate-700 mx-auto" />
                <p className="text-xs font-semibold">Please select a question from the left sidebar pane to start your practice session.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};
export default MockInterview;
