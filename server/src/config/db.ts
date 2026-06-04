import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

// Active Sandbox Mode flag
export let isSandboxMode = !connectionString || 
                           connectionString.includes('YOUR_DATABASE_URL') || 
                           process.env.USE_SANDBOX === 'true';

export const setSandboxMode = (value: boolean) => {
  isSandboxMode = value;
  if (value) {
    console.log('🤖 [database-simulation]: Sandbox Mode active. Query execution is fully simulated in memory.');
  } else {
    console.log('🔌 [database]: Sandbox Mode deactivated.');
  }
};

if (isSandboxMode) {
  console.log('🤖 [database-simulation]: Sandbox Mode initially active. Query execution is fully simulated in memory.');
}

// In-Memory Database storage structures for Sandbox Simulation
const usersTable: any[] = [];
const analysesTable: any[] = [];
let nextUserId = 1;
let nextAnalysisId = 1;

export const pool = new Pool({
  connectionString,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err: any) => {
  console.error('⚠️ [database]: Unexpected idle database client error:', err.message || err);
});

/**
 * Custom Query Router that directs queries to PostgreSQL or the In-Memory Simulator
 */
export const query = async (text: string, params?: any[]): Promise<any> => {
  const normalizedQuery = text.replace(/\s+/g, ' ').trim().toLowerCase();
  
  // 1. Simulator Routing
  if (isSandboxMode) {
    return simulateQuery(normalizedQuery, params || []);
  }

  // 2. Real Database execution
  try {
    const start = Date.now();
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    if (process.env.NODE_ENV !== 'production') {
      console.log(`📝 [database-query]: Executed query in ${duration}ms`, { rows: res.rowCount });
    }
    
    return res;
  } catch (error: any) {
    console.error(`❌ [database-query-failed]: Database operation failed: ${error.message}`);
    throw error;
  }
};

/**
 * In-Memory SQL Simulator mapping standard queries to Javascript array actions
 */
const simulateQuery = (sql: string, params: any[]): any => {
  const start = Date.now();
  let rows: any[] = [];

  try {
    // A. Users Table Simulators
    if (sql.includes('select id from users where email =')) {
      const email = params[0]?.toLowerCase().trim();
      rows = usersTable.filter(u => u.email === email);
    } 
    else if (sql.includes('insert into users') && sql.includes('returning')) {
      const [name, email, password] = params;
      const newUser = {
        id: nextUserId++,
        name,
        email: email.toLowerCase().trim(),
        password,
        created_at: new Date().toISOString()
      };
      usersTable.push(newUser);
      rows = [newUser];
    } 
    else if (sql.includes('select * from users where email =')) {
      const email = params[0]?.toLowerCase().trim();
      rows = usersTable.filter(u => u.email === email);
    } 
    else if (sql.includes('select id, name, email, created_at from users where id =')) {
      const id = Number(params[0]);
      rows = usersTable.filter(u => u.id === id);
    }
    
    else if (sql.includes('insert into analyses') && sql.includes('returning')) {
      const [
        userId, jobRole, jobDescription, resumeFileName,
        atsScore, resumeQualityScore, scoresBreakdown, matchedSkills, missingSkills,
        resumeQualityDetails, suggestions, interviewQuestions
      ] = params;

      const newAnalysis = {
        id: nextAnalysisId++,
        user_id: Number(userId),
        job_role: jobRole,
        job_description: jobDescription,
        resume_file_name: resumeFileName,
        ats_score: Number(atsScore),
        resume_quality_score: Number(resumeQualityScore),
        scores_breakdown: JSON.parse(scoresBreakdown),
        matched_skills: JSON.parse(matchedSkills),
        missing_skills: JSON.parse(missingSkills),
        resume_quality_details: JSON.parse(resumeQualityDetails),
        suggestions: JSON.parse(suggestions),
        interview_questions: JSON.parse(interviewQuestions),
        created_at: new Date().toISOString()
      };
      
      analysesTable.push(newAnalysis);
      rows = [newAnalysis];
    }
    else if (sql.includes('select') && sql.includes('from analyses') && sql.includes('order by created_at desc')) {
      const userId = Number(params[0]);
      const filtered = analysesTable.filter(a => a.user_id === userId);
      // Sort desc
      rows = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    }
    else if (sql.includes('select * from analyses where id =') && sql.includes('user_id =')) {
      const [id, userId] = params;
      rows = analysesTable.filter(a => a.id === Number(id) && a.user_id === Number(userId));
    }
    else if (sql.includes('delete from analyses where id =') && sql.includes('user_id =') && sql.includes('returning')) {
      const [id, userId] = params;
      const idx = analysesTable.findIndex(a => a.id === Number(id) && a.user_id === Number(userId));
      if (idx !== -1) {
        analysesTable.splice(idx, 1);
        rows = [{ id: Number(id) }];
      }
    }
    
    // C. Default Fallback
    else {
      console.warn('⚠️ [simulator-unmatched]: Query was not explicitly simulated, returning empty set:', sql);
    }

  } catch (err: any) {
    console.error('❌ [simulator-error]: Failed simulating SQL query:', err.message);
  }

  const duration = Date.now() - start;
  console.log(`🤖 [simulator-query]: Simulating SQL query in ${duration}ms`, { rowCount: rows.length });
  
  return {
    rows,
    rowCount: rows.length
  };
};
