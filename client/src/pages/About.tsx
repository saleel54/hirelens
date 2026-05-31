import React, { useState } from 'react';
import {
  Sparkles,
  User,
  Terminal,
  Globe,
  Mail,
  Heart
} from 'lucide-react';

export const About: React.FC = () => {
  const [imgError, setImgError] = useState<boolean>(false);
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn selection:bg-primary/20">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-secondary-dark tracking-tight font-outfit">
          About YAStudio
        </h1>
        <p className="text-sm text-secondary-light mt-1">
          The story, vision, and creator behind the development of HireLens AI.
        </p>
      </div>

      {/* Grid container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Creator Profile Card (1/3 width) */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute -right-12 -top-12 w-28 h-28 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-xl"></div>

          <div className="space-y-5">
            {/* Styled Profile Avatar / Image with Graceful Vector Fallback */}
            <div className="w-18 h-18 rounded-2xl bg-gradient-to-tr from-primary via-purple-500 to-pink-500 p-[2px] shadow-md shadow-primary/10 group-hover:scale-105 transition-all duration-300">
              <div className="w-full h-full rounded-[14px] bg-slate-950 overflow-hidden flex items-center justify-center relative">
                {!imgError ? (
                  <img 
                    src="/creator.jpg" 
                    alt="Yoosuf Ali Saleel" 
                    onError={() => setImgError(true)}
                    className="w-full h-full object-cover select-none"
                  />
                ) : (
                  <span className="font-outfit font-black text-2xl text-white select-none">
                    YS
                  </span>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-lg font-extrabold text-secondary-dark font-outfit">Yoosuf Ali Saleel</h3>
              <p className="text-xs text-primary font-bold tracking-wide uppercase mt-0.5">Founder & Full Stack Developer</p>
            </div>

            <div className="border-t border-slate-100 pt-4 space-y-3.5">
              <div className="flex items-center space-x-2.5 text-xs text-secondary-light font-semibold">
                <Terminal className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                <span>Solo Creator of HireLens AI</span>
              </div>
              <div className="flex items-center space-x-2.5 text-xs text-secondary-light font-semibold">
                <Globe className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                <span>Founder, YAStudio</span>
              </div>
              <div className="flex items-center space-x-2.5 text-xs text-secondary-light font-semibold">
                <Heart className="w-4.5 h-4.5 text-rose-500 fill-rose-500/10 shrink-0" />
                <span>AI-powered EdTech Advocate</span>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-5 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Core Skillsets</span>
            <div className="flex flex-wrap gap-1">
              {['TypeScript', 'React', 'Node.js', 'Express', 'PostgreSQL', 'Gemini AI', 'Tailwind CSS'].map((tech) => (
                <span key={tech} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/40">
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Narrative Copy (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Story Panel */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-secondary-dark font-outfit border-b border-slate-100 pb-2 flex items-center space-x-2">
              <User className="w-5 h-5 text-primary" />
              <span>About the Creator</span>
            </h2>

            <div className="text-xs text-secondary leading-relaxed space-y-3.5 font-medium">
              <p>
                "Hi, I'm Yoosuf Ali Saleel, a Full Stack Developer and the founder of <b>'YAStudio'</b>.
              </p>
              <p>
                I built <b>HireLens AI</b> independently with a simple mission: to help students, freshers, and job seekers understand exactly what is preventing them from getting shortlisted and hired.
              </p>
              <p>
                As a recent graduate navigating the competitive job market myself, I noticed that many talented candidates are rejected not because they lack skills, but because they don't know how their resumes align with industry expectations. HireLens AI was created to bridge that gap.
              </p>
              <p>
                This platform combines custom ATS analysis, skill-gap identification, AI-powered recommendations, and interview preparation tools to provide actionable insights that help users improve their chances of landing their dream job.
              </p>
              <p>
                Every feature of HireLens AI — from resume parsing and ATS scoring to AI-generated suggestions and interview questions — was designed, developed, and deployed by me as a solo developer under <i>YAStudio"</i>.
              </p>
            </div>
          </div>

          {/* YAStudio Vision Panel */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-secondary-dark font-outfit border-b border-slate-100 pb-2 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-purple-500 fill-purple-500/10" />
              <span>About YAStudio</span>
            </h2>

            <div className="text-xs text-secondary leading-relaxed space-y-3 font-medium">
              <p>
                <b>YAStudio</b> is an independent software development initiative focused on building innovative, practical, and AI-powered digital solutions that solve real-world problems.
              </p>
              <p>
                Our vision is to create products that empower people through technology, making advanced tools more accessible, useful, and impactful.
              </p>
            </div>
          </div>

          {/* Connect Panel */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-secondary-dark font-outfit border-b border-slate-100 pb-2 flex items-center space-x-2">
              <Mail className="w-5 h-5 text-indigo-500" />
              <span>Connect</span>
            </h2>

            <div className="text-xs text-secondary leading-relaxed space-y-4 font-medium">
              <p>
                I am passionate about full-stack development, AI-powered applications, and building products that create meaningful impact. Thank you for using HireLens AI.
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-1">
                {/* Email link */}
                <a
                  href="mailto:saleelt54@gmail.com"
                  className="px-4 py-2.5 rounded-xl border border-slate-200 hover:border-primary hover:bg-primary/5 text-slate-600 hover:text-primary font-bold text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer dark:border-slate-800 dark:hover:border-primary"
                >
                  <Mail className="w-4.5 h-4.5" />
                  <span>saleelt54@gmail.com</span>
                </a>

                {/* Founder Info Label */}
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest sm:ml-auto">
                  — Yoosuf Ali Saleel<br />
                  <span className="text-[9px] text-slate-300 font-semibold lowercase">Founder & Developer, YAStudio</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default About;
