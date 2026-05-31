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
          description: "Generate exactly 10 comprehensive technical interview questions customized to the matched and missing skills relative to the job description."
        },
        behavioral: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "Generate exactly 5 situational behavioral questions (STAR format) relevant to this engineering/tech role."
        },
        hr: {
          type: "ARRAY",
          items: { type: "STRING" },
          description: "Generate exactly 5 standard HR/culture-fit questions relevant to the career stage (e.g. entry-level, fresher)."
        }
      },
      required: ["technical", "behavioral", "hr"]
    }
  },
  required: ["suggestions", "interviewQuestions"]
};

/**
 * Invokes Gemini 2.5 Flash to generate recommendations and interview questions
 * @param resumeText Extracted resume text
 * @param jobRole Job title
 * @param jobDescription Pasted job description
 * @param matchedSkills Array of matched skills
 * @param missingSkills Array of missing skills
 * @returns Structured feedback and interview prep questions
 */
export const generateAIFeedback = async (
  resumeText: string,
  jobRole: string,
  jobDescription: string,
  matchedSkills: string[],
  missingSkills: string[]
): Promise<GeminiAnalysisResponse> => {
  
  if (!ai) {
    return getFallbackMockData(jobRole, matchedSkills, missingSkills);
  }

  const prompt = `
    You are an expert technical recruiter and resume consultant. Analyze the following candidate details and provide career recommendations and interview questions:
    
    JOB ROLE TARGETED:
    "${jobRole}"
    
    JOB DESCRIPTION:
    "${jobDescription}"
    
    CANDIDATE PARSED RESUME TEXT:
    "${resumeText.substring(0, 8000)}" -- truncated if too long
    
    MATCHED TECH SKILLS FOUND:
    [${matchedSkills.join(', ')}]
    
    MISSING TECH SKILLS DETECTED:
    [${missingSkills.join(', ')}]
    
    Please provide:
    1. Suggestions (Improvements to resume content/layout, missing skills explanations, and general ATS optimization tips).
    2. Exactly 20 customized interview questions split into 10 Technical (focused on matched and missing technologies), 5 Behavioral, and 5 HR/Culture questions.
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
    return getFallbackMockData(jobRole, matchedSkills, missingSkills);
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
  
  const techString = matchedSkills.join(', ') || 'software development';
  
  const improvements = [
    `Highlight your experience in ${techString} more prominently at the very top of your professional experience section.`,
    "Add deployment links (e.g. Vercel, Netlify, or Heroku URLs) next to your personal project headings to strengthen your credibility.",
    "Reframe your bullet points using the Google X-Y-Z formula (e.g. 'Accomplished [X] as measured by [Y], by doing [Z]') to quantify your metrics."
  ];
  
  const missingSkillsExplanation = missingSkills.length > 0 
    ? missingSkills.map(skill => `Adding ${skill} to your stack is crucial as this job description heavily expects candidates to be familiar with standard enterprise practices around ${skill}.`)
    : ["Your skills align well with this job description. Focus on deepening your system design and testing methodologies to stand out."];

  const atsOptimizationTips = [
    "Remove all graphic design layouts, double-column spacing, and customized progress bars. Keep the layout to a single column, plain text format.",
    "Use standard, scanner-friendly headings like 'Work Experience', 'Skills', 'Projects', and 'Education' rather than creative headings.",
    "Ensure your file is named professionally (e.g. 'Firstname_Lastname_Resume.pdf') and is compiled as a machine-readable text PDF rather than an image-based scan."
  ];

  const technical = [
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

  const behavioral = [
    "Describe a time when you were working on a team project and had a disagreement with a team member about a technical decision. How did you handle it?",
    "Tell me about a project that failed or didn't go as planned. What went wrong, what did you learn, and how would you approach it differently today?",
    "How do you prioritize your tasks and manage tight deadlines when juggling multiple projects or academic deliverables?",
    "Describe a situation where you had to learn a completely new technology or tool in a very short timeframe to complete a task. What was your process?",
    "Tell me about a time you noticed an issue or bottleneck in a project's workflow and took the initiative to fix it without being asked."
  ];

  const hr = [
    `Why are you interested in joining us as a ${jobRole}, and what makes you the ideal candidate for this opening?`,
    "Where do you see yourself professionally in the next three to five years, and how does this role align with those long-term goals?",
    "What kind of work environment do you thrive in, and how do you handle constructive feedback or review criticism?",
    "What are your salary expectations for this position, and when is your earliest available start date?",
    "Do you have any questions for us about our engineering team structure, developmental roadmaps, or company culture?"
  ];

  return {
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
