import React, { useEffect, useState } from 'react';
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
  MicOff
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

export const MockInterview: React.FC = () => {
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

  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      setSpeechSupported(true);
      
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setIsRecording(true);
        setErrorMsg(null);
      };

      rec.onresult = (event: any) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + ' ';
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

  return (
    <div className="space-y-6 animate-fadeIn selection:bg-primary/20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-secondary-dark tracking-tight font-outfit">
          AI Mock Interview Simulator
        </h1>
        <p className="text-sm text-secondary-light mt-1">
          Select custom-generated questions from your resume reviews, type your answer, and receive real-time scoring and STAR evaluations.
        </p>
      </div>

      {loading ? (
        <div className="py-24 text-center text-sm font-semibold text-slate-400 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span>Setting up your interview environment...</span>
        </div>
      ) : history.length === 0 ? (
        <div className="py-16 text-center border border-dashed border-slate-200 bg-white rounded-2xl max-w-lg mx-auto p-8 space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center mx-auto text-primary">
            <MessageSquare className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-md font-bold text-secondary-dark font-outfit">Interview Bank Empty</h3>
            <p className="text-xs text-secondary-light mt-1 max-w-md mx-auto leading-relaxed">
              You must run a resume analysis audit first! HireLens AI uses your parsed resume details and the target job description to generate 20 custom interview prep questions.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 text-xs font-bold text-white bg-primary hover:bg-primary-dark rounded-xl cursor-pointer shadow-md transition-all duration-200"
          >
            Audit a Resume Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Pane: Question Selector (1/3 width) */}
          <div className="space-y-4">
            {/* Target Job Role Context Selector */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">TARGET JOB CONTEXT</label>
              <select
                value={selectedRecord?.id || ''}
                onChange={(e) => handleRecordSelect(Number(e.target.value))}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-xs font-bold text-slate-700 focus:outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary transition-all cursor-pointer"
              >
                {history.map((record) => (
                  <option key={record.id} value={record.id}>
                    {record.job_role}
                  </option>
                ))}
              </select>
            </div>

            {/* Questions list card */}
            <div className="bg-white border border-slate-200 shadow-sm rounded-2xl overflow-hidden flex flex-col max-h-[500px]">
              {/* Category tabs */}
              <div className="flex border-b border-slate-100 bg-slate-50/30 p-1">
                {(['technical', 'behavioral', 'hr'] as const).map((cat) => {
                  const labelMap = { technical: 'Tech', behavioral: 'Behavior', hr: 'HR / Fit' };
                  const isActive = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all capitalize cursor-pointer ${
                        isActive 
                          ? 'bg-white text-primary shadow-sm border border-slate-200/50' 
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {labelMap[cat]}
                    </button>
                  );
                })}
              </div>

              {/* Questions list container */}
              <div className="overflow-y-auto p-4 space-y-2.5 flex-1 divide-y divide-slate-50">
                {getQuestionsList(activeCategory).length === 0 ? (
                  <p className="text-xs text-secondary-light italic text-center py-8">No questions loaded for this profile.</p>
                ) : (
                  getQuestionsList(activeCategory).map((q, idx) => {
                    const isSelected = selectedQuestion === q;
                    return (
                      <button
                        key={idx}
                        onClick={() => handleQuestionSelect(q)}
                        className={`w-full text-left p-3 rounded-xl text-xs font-semibold leading-relaxed transition-all duration-150 flex items-start space-x-2.5 cursor-pointer ${
                          isSelected 
                            ? 'bg-primary/5 text-primary border border-primary/20 shadow-[inset_1px_0_0_rgba(99,102,241,0.15)] font-bold' 
                            : 'text-slate-600 hover:bg-slate-50 border border-transparent'
                        }`}
                      >
                        <span className={`w-5 h-5 rounded-full shrink-0 flex items-center justify-center font-bold text-[9px] ${
                          isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'
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

          {/* Right Pane: Simulator / Terminal (2/3 width) */}
          <div className="lg:col-span-2 space-y-6">
            {selectedQuestion ? (
              <>
                {/* Active Question Box */}
                <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 relative overflow-hidden transition-all duration-200">
                  <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-br from-primary/5 to-transparent rounded-full blur-xl pointer-events-none"></div>
                  
                  <div className="flex items-center space-x-2 mb-3">
                    <HelpCircle className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Active Practice Question</span>
                  </div>
                  
                  <h3 className="text-md font-extrabold text-secondary-dark font-outfit leading-relaxed">
                    {selectedQuestion}
                  </h3>
                </div>

                {/* Evaluation State or Practice Form */}
                {evaluationResult ? (
                  /* Practice evaluation feedback card */
                  <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-6 animate-fadeIn transition-all duration-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
                      <div className="flex items-center space-x-3">
                        <div className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center font-outfit font-extrabold text-lg ${getScoreColor(evaluationResult.score)} shadow-sm`}>
                          <span>{evaluationResult.score}</span>
                          <span className="text-[9px] font-bold uppercase tracking-wide leading-none mt-0.5">/10</span>
                        </div>
                        <div>
                          <h4 className="font-extrabold text-secondary-dark font-outfit text-md flex items-center space-x-1.5">
                            <Award className="w-4.5 h-4.5 text-primary shrink-0" />
                            <span>AI Performance Evaluation</span>
                          </h4>
                          <span className="text-[10px] font-semibold text-slate-400">STAR Method & Conceptual Clarity Grade</span>
                        </div>
                      </div>
                      <button
                        onClick={resetPractice}
                        className="self-start sm:self-auto px-4.5 py-2 text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 border border-primary/15 rounded-xl flex items-center space-x-1.5 cursor-pointer transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>Practice Again</span>
                      </button>
                    </div>

                    {/* Constructive feedback */}
                    <div className="space-y-1.5">
                      <h5 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Assessment feedback</h5>
                      <p className="text-xs text-secondary-dark leading-relaxed font-semibold">
                        {evaluationResult.feedback}
                      </p>
                    </div>

                    {/* STAR highlights / strengths & weaknesses */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* Strengths */}
                      <div className="p-4 rounded-xl border border-success/20 bg-success/5 space-y-2.5">
                        <h5 className="text-xs font-bold text-success flex items-center space-x-1.5">
                          <CheckCircle2 className="w-4 h-4 shrink-0" />
                          <span>What you did right (Strengths)</span>
                        </h5>
                        <ul className="space-y-1.5">
                          {evaluationResult.starStrengths.map((item, idx) => (
                            <li key={idx} className="text-xs text-secondary-light font-medium leading-relaxed flex items-start space-x-1.5">
                              <span className="text-success select-none shrink-0">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Weaknesses */}
                      <div className="p-4 rounded-xl border border-error/20 bg-error/5 space-y-2.5">
                        <h5 className="text-xs font-bold text-error flex items-center space-x-1.5">
                          <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                          <span>Areas to improve (Weaknesses)</span>
                        </h5>
                        <ul className="space-y-1.5">
                          {evaluationResult.starWeaknesses.map((item, idx) => (
                            <li key={idx} className="text-xs text-secondary-light font-medium leading-relaxed flex items-start space-x-1.5">
                              <span className="text-error select-none shrink-0">•</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Gold standard sample answer */}
                    <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-800 text-white space-y-3 relative overflow-hidden group">
                      <div className="absolute -right-10 -top-10 w-24 h-24 bg-primary/20 rounded-full blur-xl"></div>
                      
                      <div className="flex items-center space-x-1.5 text-primary">
                        <Zap className="w-4.5 h-4.5" />
                        <span className="text-[10px] font-bold uppercase tracking-wider font-outfit">Recruiter Suggested Answer (10/10)</span>
                      </div>
                      
                      <p className="text-xs text-slate-300 leading-relaxed italic">
                        "{evaluationResult.suggestedAnswer}"
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Practice answering form */
                  <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 transition-all duration-200">
                    <form onSubmit={handleSubmitAnswer} className="space-y-5">
                      <div className="space-y-2">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                          <label className="text-xs font-bold text-secondary-light tracking-wide uppercase">YOUR RESPONSE</label>
                          <div className="flex items-center space-x-3">
                            {/* Microphone Answering button */}
                            {speechSupported && (
                              <button
                                type="button"
                                onClick={toggleRecording}
                                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition-all duration-300 cursor-pointer border ${
                                  isRecording 
                                    ? 'bg-error text-white border-error shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse' 
                                    : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700/80 dark:hover:bg-slate-700'
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
                          className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/50 text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary transition-all leading-relaxed"
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
              <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-10 text-center text-slate-400 space-y-2">
                <HelpCircle className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold">Please select a question from the left sidebar pane to start your practice session.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
export default MockInterview;
