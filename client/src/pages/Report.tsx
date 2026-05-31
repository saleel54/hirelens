import React, { useState } from 'react';
import { 
  Sparkles, 
  ChevronRight, 
  ChevronDown, 
  Check, 
  X, 
  BookOpen, 
  HelpCircle,
  ChevronLeft
} from 'lucide-react';

interface ReportProps {
  data: any; // Complete analysis output object
  onBackToDashboard: () => void;
}

export const Report: React.FC<ReportProps> = ({ data, onBackToDashboard }) => {
  const [activeAccordionTab, setActiveAccordionTab] = useState<'tech' | 'behavioral' | 'hr'>('tech');
  
  // Accordion open/close individual question state toggles
  const [expandedQuestions, setExpandedQuestions] = useState<{ [key: string]: boolean }>({});

  const toggleQuestion = (key: string) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const {
    jobRole,
    resumeFileName,
    atsScore,
    resumeQualityScore,
    scoresBreakdown,
    qualityBreakdown,
    matchedSkills,
    missingSkills,
    suggestions,
    interviewQuestions
  } = data;

  // Score circular indicator parameters
  const radius = 50;
  const strokeWidth = 8;
  const normalizedRadius = radius - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (atsScore / 100) * circumference;

  // Formatting helpers
  const getQualityLabel = (score: number) => {
    if (score >= 85) return 'Excellent Formatting';
    if (score >= 70) return 'Standard Layout';
    return 'Needs Optimization';
  };

  const getAtsVerdict = (score: number) => {
    if (score >= 80) return 'Strong Match: Highly aligned with requirements.';
    if (score >= 60) return 'Moderate Match: Consider optimizing missing skill gaps.';
    return 'Weak Match: High structural changes suggested below.';
  };

  const qualityItems = [
    { label: 'Email Contact', checked: qualityBreakdown?.emailPresent, desc: 'Contact email found' },
    { label: 'Phone Number', checked: qualityBreakdown?.phonePresent, desc: 'Contact phone found' },
    { label: 'LinkedIn URL', checked: qualityBreakdown?.linkedInPresent, desc: 'Networking link detected' },
    { label: 'GitHub Link', checked: qualityBreakdown?.gitHubPresent, desc: 'Code portfolio detected' },
    { label: 'Projects Section', checked: qualityBreakdown?.projectsPresent, desc: 'Separate project blocks found' },
    { label: 'Quantified Metrics', checked: qualityBreakdown?.quantifiedMetricsPresent, desc: 'Percentages or financial items cited' },
    { label: 'Professional Action Verbs', checked: qualityBreakdown?.actionVerbsPresent, desc: 'Action-oriented verbs identified' },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Back button header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-5">
        <div className="flex items-center space-x-3">
          <button 
            onClick={onBackToDashboard}
            className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-500 hover:text-secondary-dark transition-all cursor-pointer shadow-sm"
          >
            <ChevronLeft className="w-4.5 h-4.5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-secondary-dark tracking-tight font-outfit">
              Analysis Report
            </h1>
            <p className="text-xs text-secondary-light font-semibold mt-0.5">
              Job Role: {jobRole} | File: {resumeFileName}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
          ✨ Analysis Complete
        </span>
      </div>

      {/* Hero Score Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* ATS Score Card */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex flex-col items-center justify-center text-center">
          <span className="text-xs font-bold text-secondary-light tracking-wide uppercase mb-4">ATS Match Rating</span>
          
          {/* Circular SVG Progress */}
          <div className="relative flex items-center justify-center mb-4">
            <svg 
              height={radius * 2} 
              width={radius * 2} 
              className="-rotate-90"
            >
              <circle
                stroke="#f1f5f9"
                fill="transparent"
                strokeWidth={strokeWidth}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
              />
              <circle
                stroke="#2563EB"
                fill="transparent"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference + ' ' + circumference}
                style={{ strokeDashoffset }}
                r={normalizedRadius}
                cx={radius}
                cy={radius}
                className="transition-all duration-1000 ease-out stroke-linecap-round"
              />
            </svg>
            <div className="absolute flex flex-col items-center">
              <span className="text-3xl font-extrabold text-secondary-dark font-outfit">{atsScore}%</span>
            </div>
          </div>
          
          <h3 className="font-bold text-sm text-secondary-dark">{getAtsVerdict(atsScore)}</h3>
          <p className="text-xs text-secondary-light mt-1.5 leading-relaxed max-w-xs">
            Determined using our spec weighted index matrix mapping skills, education, experience, and format thickness.
          </p>
        </div>

        {/* Score Breakdown Bars */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 flex flex-col justify-between">
          <span className="text-xs font-bold text-secondary-light tracking-wide uppercase mb-3 block">Scoring Breakdown</span>
          
          <div className="space-y-4 flex-1 flex flex-col justify-center">
            {/* Skills */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-secondary-dark">Skills Match (40% Weight)</span>
                <span className="text-primary">{scoresBreakdown?.skillsMatchScore}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-primary h-full rounded-full" style={{ width: `${scoresBreakdown?.skillsMatchScore || 0}%` }}></div>
              </div>
            </div>

            {/* Projects */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-secondary-dark">Projects Overlap (25% Weight)</span>
                <span className="text-success">{scoresBreakdown?.projectsRelevanceScore}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-success h-full rounded-full" style={{ width: `${scoresBreakdown?.projectsRelevanceScore || 0}%` }}></div>
              </div>
            </div>

            {/* Quality */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-secondary-dark">Resume Layout Quality (20% Weight)</span>
                <span className="text-warning">{scoresBreakdown?.resumeQualityScore}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-warning h-full rounded-full" style={{ width: `${scoresBreakdown?.resumeQualityScore || 0}%` }}></div>
              </div>
            </div>

            {/* Education */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-secondary-dark">Education Fit (15% Weight)</span>
                <span className="text-indigo-600">{scoresBreakdown?.educationRelevanceScore}%</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${scoresBreakdown?.educationRelevanceScore || 0}%` }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Resume Quality Card */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6">
          <div className="flex justify-between items-baseline mb-4 border-b border-slate-100 pb-2">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-secondary-light tracking-wide uppercase">Document Layout Audit</span>
              <span className="text-[10px] text-warning font-semibold mt-0.5">{getQualityLabel(resumeQualityScore)}</span>
            </div>
            <span className="text-sm font-extrabold text-warning">{resumeQualityScore}%</span>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {qualityItems.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2 text-secondary-dark font-semibold">
                  {item.checked ? (
                    <div className="w-4 h-4 rounded-full bg-success/15 flex items-center justify-center text-success shrink-0">
                      <Check className="w-2.5 h-2.5" />
                    </div>
                  ) : (
                    <div className="w-4 h-4 rounded-full bg-error/15 flex items-center justify-center text-error shrink-0">
                      <X className="w-2.5 h-2.5" />
                    </div>
                  )}
                  <span>{item.label}</span>
                </div>
                <span className="text-slate-400 font-medium text-[10px]">{item.desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Skills Analysis Segment */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-4">
        <h2 className="text-lg font-bold text-secondary-dark font-outfit border-b border-slate-100 pb-2">Skills Match Audit</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Matched Skills */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-success uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-success"></span>
              <span>Matched Stack ({matchedSkills.length})</span>
            </h3>
            {matchedSkills.length === 0 ? (
              <p className="text-xs text-secondary-light italic">No matching required skills found on resume.</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {matchedSkills.map((skill: string) => (
                  <span key={skill} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-success/10 text-success border border-success/15 select-none">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Missing Skills */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-error uppercase tracking-wider flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-error"></span>
              <span>Missing Stack ({missingSkills.length})</span>
            </h3>
            {missingSkills.length === 0 ? (
              <p className="text-xs text-success italic font-bold">Excellent! All required tech stack skills are matched!</p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {missingSkills.map((skill: string) => (
                  <span key={skill} className="px-2.5 py-1 rounded-lg text-xs font-bold bg-error/10 text-error border border-error/15 select-none">
                    {skill}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Recommendations Segment */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-5">
        <h2 className="text-lg font-bold text-secondary-dark font-outfit border-b border-slate-100 pb-2 flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-primary fill-primary/10" />
          <span>AI Suggestions & Optimizer</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Card 1: Improvements */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3">
            <h3 className="text-sm font-bold text-secondary-dark font-outfit">Resume Improvements</h3>
            <ul className="space-y-2.5">
              {suggestions?.improvements?.map((item: string, idx: number) => (
                <li key={idx} className="text-xs font-medium text-secondary-light leading-relaxed flex items-start space-x-2">
                  <span className="text-primary font-bold shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 2: Missing Skill Explanations */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3">
            <h3 className="text-sm font-bold text-secondary-dark font-outfit">Missing Skills Explanation</h3>
            <ul className="space-y-2.5">
              {suggestions?.missingSkillsExplanation?.map((item: string, idx: number) => (
                <li key={idx} className="text-xs font-medium text-secondary-light leading-relaxed flex items-start space-x-2">
                  <span className="text-warning font-bold shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Card 3: ATS tips */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-3">
            <h3 className="text-sm font-bold text-secondary-dark font-outfit">ATS Optimization Tips</h3>
            <ul className="space-y-2.5">
              {suggestions?.atsOptimizationTips?.map((item: string, idx: number) => (
                <li key={idx} className="text-xs font-medium text-secondary-light leading-relaxed flex items-start space-x-2">
                  <span className="text-indigo-500 font-bold shrink-0">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Accordion Interview prep bank */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-6 space-y-5">
        <div className="border-b border-slate-100 pb-2">
          <h2 className="text-lg font-bold text-secondary-dark font-outfit flex items-center space-x-2">
            <BookOpen className="w-5 h-5 text-indigo-500" />
            <span>Custom Interview Prep Bank</span>
          </h2>
          <p className="text-xs text-secondary-light mt-0.5">20 hyper-targeted questions structured to test your exact profile alignments.</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex space-x-2 border-b border-slate-200 pb-px">
          {(['tech', 'behavioral', 'hr'] as const).map((tab) => {
            const labelMap = { tech: 'Technical (10)', behavioral: 'Behavioral (5)', hr: 'HR / Fit (5)' };
            const isActive = activeAccordionTab === tab;
            return (
              <button
                key={tab}
                onClick={() => { setActiveAccordionTab(tab); setExpandedQuestions({}); }}
                className={`pb-2 px-4 text-xs font-bold transition-all border-b-2 cursor-pointer ${
                  isActive 
                    ? 'border-primary text-primary font-extrabold' 
                    : 'border-transparent text-secondary-light hover:text-secondary-dark'
                }`}
              >
                {labelMap[tab]}
              </button>
            );
          })}
        </div>

        {/* Tab Accordion Questions list */}
        <div className="space-y-2.5 pt-2">
          {(() => {
            let questions: string[] = [];
            if (activeAccordionTab === 'tech') questions = interviewQuestions?.technical || [];
            else if (activeAccordionTab === 'behavioral') questions = interviewQuestions?.behavioral || [];
            else if (activeAccordionTab === 'hr') questions = interviewQuestions?.hr || [];

            return questions.map((question, idx) => {
              const qKey = `${activeAccordionTab}-${idx}`;
              const isExpanded = expandedQuestions[qKey];
              
              return (
                <div 
                  key={idx}
                  className="border border-slate-200 rounded-xl bg-slate-50/20 overflow-hidden hover:border-slate-300 transition-colors"
                >
                  <button
                    onClick={() => toggleQuestion(qKey)}
                    className="w-full flex items-center justify-between p-4 text-left font-semibold text-xs text-secondary-dark cursor-pointer transition-colors hover:bg-slate-50/50"
                  >
                    <div className="flex items-start space-x-3.5 pr-4">
                      <HelpCircle className="w-4.5 h-4.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">{question}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronDown className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                    ) : (
                      <ChevronRight className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                    )}
                  </button>

                  {/* Accordion inner expansion body (STAR hints/Answer notes) */}
                  {isExpanded && (
                    <div className="p-4 bg-white border-t border-slate-200/60 text-[11px] text-secondary-light leading-relaxed space-y-3 animate-slideDown">
                      <div className="space-y-1 bg-slate-50 p-3 rounded-lg border border-slate-100">
                        <span className="font-bold text-secondary-dark uppercase tracking-wider text-[9px] block">RECRUITER INTENT</span>
                        <p>Evaluates your direct conceptual clarity, application design choices, and real-world deployment experiences handling these parameters.</p>
                      </div>
                      
                      {activeAccordionTab === 'behavioral' && (
                        <div className="space-y-1 bg-indigo-50/30 p-3 rounded-lg border border-indigo-100/50">
                          <span className="font-bold text-indigo-600 uppercase tracking-wider text-[9px] block">PREPARATION TIP (STAR FORMULA)</span>
                          <p>Outline a specific <b>Situation</b>, define the <b>Task</b> at hand, detail the concrete <b>Actions</b> you personally undertook, and conclude with the measurable, positive <b>Result</b> achieved.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            });
          })()}
        </div>
      </div>
    </div>
  );
};
export default Report;
