import React, { useState, useRef } from 'react';
import { 
  Sparkles, 
  Upload, 
  FileText, 
  CheckCircle2, 
  Loader2, 
  X, 
  AlertCircle 
} from 'lucide-react';

interface AnalyzeResumeProps {
  onAnalysisSuccess: (analysisData: any) => void;
}

export const AnalyzeResume: React.FC<AnalyzeResumeProps> = ({ onAnalysisSuccess }) => {
  const [jobRole, setJobRole] = useState<string>('');
  const [jobDescription, setJobDescription] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  
  // UI Status
  const [isDragActive, setIsDragActive] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Steps to display in the animated loader
  const loadingSteps = [
    { label: 'Parsing Resume PDF Text' },
    { label: 'Extracting Technical Skillsets' },
    { label: 'Calculating Weighted ATS Metrics' },
    { label: 'Querying Gemini AI Optimization Tips' },
    { label: 'Preparing Customized Interview prep bank' }
  ];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const validateFile = (selectedFile: File) => {
    setErrorMsg(null);
    if (selectedFile.type !== 'application/pdf') {
      setErrorMsg('Invalid format: Only PDF resumes are accepted.');
      setFile(null);
      return false;
    }
    if (selectedFile.size > 5242880) { // 5MB in bytes
      setErrorMsg('File too large: Size must not exceed 5MB.');
      setFile(null);
      return false;
    }
    setFile(selectedFile);
    return true;
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateFile(e.target.files[0]);
    }
  };

  const removeFile = () => {
    setFile(null);
    setErrorMsg(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const triggerUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !jobRole || !jobDescription) {
      setErrorMsg('All fields (Role, Job Description, and PDF Resume) are required.');
      return;
    }

    setLoading(true);
    setLoadingStep(1);
    setErrorMsg(null);

    // Stagger loading step changes programmatically for a premium, clean user experience
    const stepInterval = setInterval(() => {
      setLoadingStep((prev) => {
        if (prev < 5) return prev + 1;
        clearInterval(stepInterval);
        return prev;
      });
    }, 1500);

    try {
      const formData = new FormData();
      formData.append('resume', file);
      formData.append('jobRole', jobRole);
      formData.append('jobDescription', jobDescription);

      const token = localStorage.getItem('hirelens_token');
      
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
      const response = await fetch(`${apiBase}/analysis/analyze`, {
        method: 'POST',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {},
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Audit request failed');
      }

      const data = await response.json();
      
      // Complete all steps visually
      clearInterval(stepInterval);
      setLoadingStep(5);
      
      // Let the final checkmark show for 800ms for visual satisfaction
      setTimeout(() => {
        setLoading(false);
        onAnalysisSuccess(data);
      }, 800);

    } catch (err: any) {
      clearInterval(stepInterval);
      console.error(err);
      setErrorMsg(err.message || 'An error occurred during resume analysis.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-secondary-dark tracking-tight font-outfit">
          Analyze Resume
        </h1>
        <p className="text-sm text-secondary-light mt-1">
          Provide your target job role and the job description to run a mathematical ATS match and compile custom AI prep questions.
        </p>
      </div>

      {/* Main card */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
        {errorMsg && (
          <div className="mb-5 p-3.5 rounded-lg bg-error/10 border border-error/20 text-xs font-semibold text-error flex items-start space-x-2">
            <AlertCircle className="w-4.5 h-4.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Role targeted */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-secondary-light tracking-wide uppercase block">TARGET JOB ROLE</label>
            <input
              type="text"
              required
              placeholder="e.g. Full Stack Developer, Software Engineer"
              value={jobRole}
              onChange={(e) => setJobRole(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary transition-all"
            />
          </div>

          {/* Job Description paste box */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-secondary-light tracking-wide uppercase block">JOB DESCRIPTION</label>
            <textarea
              required
              rows={6}
              placeholder="Paste job description here..."
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50/50 text-sm placeholder:text-slate-400 focus:outline-none focus:border-primary focus:bg-white focus:ring-1 focus:ring-primary transition-all font-mono text-xs"
            ></textarea>
          </div>

          {/* PDF File upload zone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-secondary-light tracking-wide uppercase block">UPLOAD RESUME (PDF ONLY)</label>
            
            {file ? (
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-sm font-bold text-secondary-dark truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-secondary-light font-semibold mt-0.5">
                      {(file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button 
                  type="button"
                  onClick={removeFile}
                  className="p-1 rounded-lg hover:bg-slate-200/50 text-slate-400 hover:text-secondary-dark cursor-pointer transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onClick={triggerUploadClick}
                className={`w-full border-2 border-dashed rounded-xl py-10 px-4 text-center cursor-pointer transition-all ${
                  isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/30'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
                <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Upload className="w-5 h-5" />
                </div>
                <p className="text-sm font-bold text-secondary-dark">
                  Drag and drop your PDF resume here, or <span className="text-primary hover:underline">browse files</span>
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Supports PDF format only. Maximum file size 5MB.
                </p>
              </div>
            )}
          </div>

          {/* Audit Submit Button */}
          <button
            type="submit"
            className="w-full py-3 px-4 bg-primary hover:bg-primary-dark text-white rounded-lg font-bold text-sm shadow-md shadow-primary/10 hover:shadow-lg flex items-center justify-center space-x-2 transition-all cursor-pointer"
          >
            <Sparkles className="w-4.5 h-4.5" />
            <span>Analyze Resume</span>
          </button>
        </form>
      </div>

      {/* Modern Multi-step Loading Modal */}
      {loading && (
        <div className="fixed inset-0 z-50 bg-secondary-dark/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full shadow-2xl p-8 space-y-6">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-primary animate-spin mx-auto mb-4" />
              <h3 className="text-lg font-bold text-secondary-dark font-outfit">Analyzing Resume</h3>
              <p className="text-xs text-secondary-light mt-1">Please wait while HireLens AI processes your credentials...</p>
            </div>

            {/* Stepper tracker */}
            <div className="space-y-4 pt-2">
              {loadingSteps.map((step, idx) => {
                const stepNum = idx + 1;
                const isCompleted = loadingStep > stepNum;
                const isCurrent = loadingStep === stepNum;
                
                return (
                  <div key={idx} className="flex items-start space-x-3">
                    <div className="shrink-0 mt-0.5">
                      {isCompleted ? (
                        <CheckCircle2 className="w-5 h-5 text-success fill-success/5" />
                      ) : isCurrent ? (
                        <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-slate-200 text-slate-300 text-xs font-bold flex items-center justify-center select-none bg-slate-50">
                          {stepNum}
                        </div>
                      )}
                    </div>
                    <span className={`text-xs font-semibold ${
                      isCompleted 
                        ? 'text-secondary-light line-through opacity-60' 
                        : isCurrent 
                          ? 'text-primary font-bold' 
                          : 'text-slate-400'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
            
            {/* Progress Bar indicator */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-primary h-full rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${(loadingStep / 5) * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AnalyzeResume;
