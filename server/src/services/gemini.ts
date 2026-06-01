import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// Initialize the modern Google Gen AI SDK client
let ai: GoogleGenAI | null = null;
if (GEMINI_API_KEY && GEMINI_API_KEY !== 'YOUR_GEMINI_API_KEY_HERE') {
  ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
  console.log('🔌 [gemini-service]: Google Gen AI SDK client initialized successfully.');
} else {
  console.warn('⚠️ [gemini-service]: GEMINI_API_KEY is not defined. Active AI calls will fall back to mock data.');
}

export interface GeminiAnalysisResponse {
  matchedSkills: string[];
  missingSkills: string[];
  skillsMatchScore: number;
  projectsRelevanceScore: number;
  suggestions: {
    improvements: string[];
    missingSkillsExplanation: string[];
    atsOptimizationTips: string[];
  };
  interviewQuestions: {
    technical: string[];
    behavioral: string[];
    hr: string[];
  };
}

// Strict JSON Output Schema to enforce exact data formatting
const schema = {
  type: "OBJECT",
  properties: {
    matchedSkills: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "List of technical, analytical, or domain-specific skills required by the job description that are present in the candidate's resume."
    },
    missingSkills: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "List of critical technical, analytical, or domain-specific skills or qualifications explicitly requested in the job description but completely absent from the resume."
    },
    skillsMatchScore: {
      type: "INTEGER",
      description: "A score from 0 to 100 representing how well the candidate's skills match the job description. Be highly realistic: if they have <10% skill match, return a low score like 0-15."
    },
    projectsRelevanceScore: {
      type: "INTEGER",
      description: "A score from 0 to 100 representing the relevance of the projects in the candidate's resume to the target job role. If projects are missing or completely irrelevant, return 0 or a low score."
    },
    suggestions: {
      type: "OBJECT",
      properties: {
        improvements: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "Action-oriented concrete tips to improve the resume content and style. Generate exactly 3-5 high-impact points."
        },
        missingSkillsExplanation: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "Clear explanations of why the identified missing skills are critical for this job role. Generate exactly 2-3 points."
        },
        atsOptimizationTips: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "Specific formatting, keywords, and structural changes to optimize the resume for ATS parsers. Generate exactly 3 points."
        }
      },
      required: ["improvements", "missingSkillsExplanation", "atsOptimizationTips"]
    },
    interviewQuestions: {
      type: "OBJECT",
      properties: {
        technical: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "Generate exactly 10 comprehensive technical/domain-specific interview questions customized to the target job role, matched skills, and missing skills. These MUST be highly specific to the actual role (e.g. nursing questions for a nurse, sales questions for a sales role) and NOT generic web development questions."
        },
        behavioral: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "Generate exactly 5 situational behavioral questions (STAR format) relevant to this job role."
        },
        hr: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "Generate exactly 5 standard HR/culture-fit questions relevant to the career stage."
        }
      },
      required: ["technical", "behavioral", "hr"]
    }
  },
  required: [
    "matchedSkills",
    "missingSkills",
    "skillsMatchScore",
    "projectsRelevanceScore",
    "suggestions",
    "interviewQuestions"
  ]
};

/**
 * Invokes Gemini 2.5 Flash to generate recommendations and interview questions
 * @param resumeText Extracted resume text
 * @param jobRole Job title
 * @param jobDescription Pasted job description
 * @param programmaticMatchedSkills Array of programmatically matched skills
 * @param programmaticMissingSkills Array of programmatically missing skills
 * @returns Structured feedback and interview prep questions
 */
export const generateAIFeedback = async (
  resumeText: string,
  jobRole: string,
  jobDescription: string,
  programmaticMatchedSkills: string[] = [],
  programmaticMissingSkills: string[] = []
): Promise<GeminiAnalysisResponse> => {
  
  if (!ai) {
    return getFallbackMockData(jobRole, programmaticMatchedSkills, programmaticMissingSkills);
  }

  const prompt = `
    You are an expert technical recruiter and professional resume consultant. Analyze the following candidate resume text against the target job role and job description.
    
    TARGET JOB ROLE:
    "${jobRole}"
    
    JOB DESCRIPTION:
    "${jobDescription}"
    
    CANDIDATE RESUME TEXT:
    "${resumeText.substring(0, 8000)}" -- truncated if too long
    
    PROGRAMMATIC DICTIONARY SKILLS HINTS (for reference only):
    Matched: [${programmaticMatchedSkills.join(', ')}]
    Missing: [${programmaticMissingSkills.join(', ')}]
    
    INSTRUCTIONS:
    1. Conduct a deep semantic review of the Candidate's Resume Text and the Job Description.
    2. Dynamically extract the true matched skills (technologies, methodologies, soft skills) and missing skills (requirements in the JD not present in the resume). Do NOT limit yourself to the programmatic hints.
    3. Calculate a highly realistic 'skillsMatchScore' (0 to 100) reflecting actual skill alignment. If the resume and JD are completely mismatched (e.g., a software developer resume applied to a nurse or sales job), return a very low score (0 to 15).
    4. Calculate a 'projectsRelevanceScore' (0 to 100) based on how relevant the candidate's listed projects are to the job requirements.
    5. Generate 10 technical questions, 5 behavioral questions, and 5 HR questions. Ensure that the technical questions are 100% relevant to the target job role (e.g. if the job role is Registered Nurse, do NOT generate developer/React questions; generate questions on patient care, nursing protocols, etc.).
    6. Return all data matching the specified JSON schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: schema as any
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Received empty response text from Gemini API');
    }

    const parsedResult = JSON.parse(responseText) as GeminiAnalysisResponse;
    return parsedResult;

  } catch (error: any) {
    console.error('❌ [gemini-service-api-error]: Failed calling Gemini API, falling back to mock logs:', error.message || error);
    return getFallbackMockData(jobRole, programmaticMatchedSkills, programmaticMissingSkills);
  }
};

/**
 * Returns premium mock data tailored to the candidate's target job role and skills
 */
function getFallbackMockData(
  jobRole: string,
  matchedSkills: string[],
  missingSkills: string[]
): GeminiAnalysisResponse {
  console.log(`ℹ️ [gemini-fallback]: Generating realistic feedback for targeted role: ${jobRole}`);
  
  const hasMatched = matchedSkills.length > 0;
  const skillsMatchScore = hasMatched ? Math.min(90, 40 + matchedSkills.length * 10) : 10;
  const projectsRelevanceScore = hasMatched ? 75 : 10;
  
  const techString = matchedSkills.join(', ') || 'required domain skills';
  
  const improvements = [
    `Highlight your experience in ${techString} more prominently at the very top of your professional experience section.`,
    "Add concrete performance metrics or deployment URLs to your personal project headings to strengthen your credibility.",
    "Reframe your bullet points using the Google X-Y-Z formula (e.g. 'Accomplished [X] as measured by [Y], by doing [Z]') to quantify your metrics."
  ];
  
  const missingSkillsExplanation = missingSkills.length > 0 
    ? missingSkills.map(skill => `Adding ${skill} to your stack is crucial as this job description heavily expects candidates to be familiar with standard practices around ${skill}.`)
    : ["Your skills align well with this job description. Focus on deepening your system design and domain methodologies to stand out."];

  const atsOptimizationTips = [
    "Remove all graphic design layouts, double-column spacing, and customized progress bars. Keep the layout to a single column, plain text format.",
    "Use standard, scanner-friendly headings like 'Work Experience', 'Skills', 'Projects', and 'Education' rather than creative headings.",
    "Ensure your file is named professionally (e.g. 'Firstname_Lastname_Resume.pdf') and is compiled as a machine-readable text PDF rather than an image-based scan."
  ];

  const isWebDev = /software|developer|engineer|coder|programmer|web|react|node/i.test(jobRole);
  const isNurse = /nurse|nursing|health|medical|clinical|patient/i.test(jobRole);
  
  let technical: string[] = [];
  
  if (isNurse) {
    technical = [
      "Can you describe your experience with patient triage and how you prioritize care in a high-stress emergency setting?",
      "How do you ensure accuracy in administering medications, and what protocols do you follow if an error occurs?",
      "Explain your familiarity with Electronic Health Records (EHR) software. How do you maintain patient data privacy (HIPAA)?",
      "How do you handle difficult or non-compliant patients while maintaining professional care standards?",
      "Describe a time you had to collaborate closely with a multidisciplinary clinical team to manage a complex patient case.",
      "What is your approach to patient education, particularly regarding post-discharge care and chronic condition management?",
      "How do you stay updated with current clinical guidelines and nursing practices?",
      "Describe your experience managing specialized medical equipment relevant to this nursing department.",
      "How do you recognize and respond to a sudden clinical deterioration in a patient's vital signs?",
      "Explain your understanding of infection control protocols and sterile techniques in clinical procedures."
    ];
  } else if (!isWebDev) {
    technical = [
      `What are the core methodologies and best practices you follow in your role as a ${jobRole}?`,
      `How do you measure success and key performance indicators (KPIs) in this industry?`,
      `Describe the primary tools, software, or platforms you utilize for daily tasks in a ${jobRole} capacity.`,
      `How do you handle risk management or unexpected bottlenecks in your regular projects?`,
      `Describe a time when you had to analyze complex data or situational reports to make an informed decision.`,
      `What is your approach to cross-departmental collaboration and stakeholder communication?`,
      `How do you ensure quality control and regulatory compliance in your deliverables?`,
      `Describe your experience managing budgets, timelines, or resources in your past roles.`,
      `How do you stay abreast of market trends, competitor actions, or industrial shifts?`,
      `Can you explain a complex project or challenge you managed in this field and the ultimate outcome?`
    ];
  } else {
    technical = [
      `Can you describe a complex challenge you encountered while building projects with ${matchedSkills[0] || 'your core stack'} and how you resolved it?`,
      `Explain the architectural differences between SQL (e.g., PostgreSQL) and NoSQL databases. When would you prefer one over the other?`,
      `What is the difference between client-side rendering (CSR) and server-side rendering (SSR), and how do they impact page-load metrics?`,
      `Can you explain the main lifecycle methods or hooks in modern frontend rendering structures?`,
      `How do you ensure proper security (like sanitization, validation) when processing database entries in Node/Express controllers?`,
      `Explain the concept of JWT (JSON Web Tokens). What is the difference between an Access Token and a Refresh Token, and how do you store them securely?`,
      `If a database query is running slowly in production, what profiling and optimization steps (e.g. indexes, execution plans) would you take?`,
      `What are REST API best practices? Explain the usage of status codes 200, 201, 400, 401, 403, and 500.`,
      `How do you write structured unit and integration tests in TypeScript? Describe mock dependencies.`,
      `Explain containerization using Docker. Why is it beneficial, and how does it solve the 'works on my machine' dilemma?`
    ];
  }

  const behavioral = isNurse ? [
    "Describe a time you had to deliver difficult news to a patient or family member. How did you approach the conversation?",
    "Tell me about a high-pressure clinical situation where you had to act quickly. What did you do and what was the outcome?",
    "How do you handle conflict or differences in clinical opinions with a physician or colleague?",
    "Describe a situation where you went above and beyond for a patient's comfort or care. What did it involve?",
    "Tell me about a time you had to adapt to a major change in shift workload or clinical protocol on short notice."
  ] : [
    "Describe a time when you were working on a team project and had a disagreement with a team member about a technical decision. How did you handle it?",
    "Tell me about a project that failed or didn't go as planned. What went wrong, what did you learn, and how would you approach it differently today?",
    "How do you prioritize your tasks and manage tight deadlines when juggling multiple projects or deliverables?",
    "Describe a situation where you had to learn a completely new technology or tool in a very short timeframe to complete a task. What was your process?",
    "Tell me about a time you noticed an issue or bottleneck in a project's workflow and took the initiative to fix it without being asked."
  ];

  const hr = [
    `Why are you interested in joining us as a ${jobRole}, and what makes you the ideal candidate for this opening?`,
    "Where do you see yourself professionally in the next three to five years, and how does this role align with those long-term goals?",
    "What kind of work environment do you thrive in, and how do you handle constructive feedback or review criticism?",
    "What are your salary expectations for this position, and when is your earliest available start date?",
    "Do you have any questions for us about our team structure, developmental roadmaps, or company culture?"
  ];

  return {
    matchedSkills,
    missingSkills,
    skillsMatchScore,
    projectsRelevanceScore,
    suggestions: {
      improvements,
      missingSkillsExplanation,
      atsOptimizationTips
    },
    interviewQuestions: {
      technical,
      behavioral,
      hr
    }
  };
}

export interface GeminiEvaluationResponse {
  score: number;
  feedback: string;
  starStrengths: string[];
  starWeaknesses: string[];
  suggestedAnswer: string;
}

const evaluationSchema = {
  type: "OBJECT",
  properties: {
    score: {
      type: "INTEGER",
      description: "An evaluation score from 1 to 10 based on accuracy, structure, and depth."
    },
    feedback: {
      type: "STRING",
      description: "A constructive, detailed, professional 2-3 sentence overview of the answer's quality."
    },
    starStrengths: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Action-oriented details they got right, or parts of the STAR method they successfully demonstrated."
    },
    starWeaknesses: {
      type: "ARRAY",
      items: { type: "STRING" },
      description: "Constructive feedback on what was missing (e.g. lacked quantitative results, didn't specify the technology)."
    },
    suggestedAnswer: {
      type: "STRING",
      description: "A highly polished, perfect 1-paragraph response demonstrating a gold-standard response to the question."
    }
  },
  required: ["score", "feedback", "starStrengths", "starWeaknesses", "suggestedAnswer"]
};

export const evaluateInterviewResponse = async (
  question: string,
  answer: string,
  jobRole: string
): Promise<GeminiEvaluationResponse> => {
  if (!ai) {
    return getMockEvaluation(question, answer);
  }

  const prompt = `
    You are an expert technical interviewer. Evaluate the candidate's answer to the following interview question for a targeted role: "${jobRole}".
    
    INTERVIEW QUESTION:
    "${question}"
    
    CANDIDATE RESPONSE:
    "${answer}"
    
    Please provide:
    1. A score from 1 to 10.
    2. Constructive overall feedback.
    3. Specific strengths matching the STAR method (Situation, Task, Action, Result) or general tech accuracy.
    4. Specific weaknesses or details they missed.
    5. A recommended suggested sample answer that would score a 10/10.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: evaluationSchema as any
      }
    });

    const responseText = response.text;
    if (!responseText) {
      throw new Error('Received empty response text from Gemini evaluation API');
    }

    const parsedResult = JSON.parse(responseText) as GeminiEvaluationResponse;
    return parsedResult;

  } catch (error: any) {
    console.error('❌ [gemini-evaluation-failed]:', error.message || error);
    return getMockEvaluation(question, answer);
  }
};

function getMockEvaluation(question: string, answer: string): GeminiEvaluationResponse {
  console.log('ℹ️ [gemini-evaluation-fallback]: Generating mock evaluation');
  const score = Math.min(10, Math.max(1, Math.round(answer.split(' ').length / 10)));
  
  return {
    score: score || 6,
    feedback: "Your answer has a solid direction and introduces the key technologies, but could benefit from a more structured delivery and concrete experience references.",
    starStrengths: [
      "Explicitly mentioned technical concepts relative to the question.",
      "Clear explanation of the problem background."
    ],
    starWeaknesses: [
      "Lacked quantified results or impact (Result in STAR formula).",
      "Could clarify the specific role you took in the action phase."
    ],
    suggestedAnswer: "A stellar answer should structure your experience clearly. For example: 'In my last role, we had a bottleneck where our database queries were taking up to 4s. I identified missing indexes on the foreign keys, analyzed the execution plans, and refactored our queries to reduce loading time by 80% to 200ms.'"
  };
}
