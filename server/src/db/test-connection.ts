import pg from 'pg';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve current directory for ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from the server/.env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const { Pool } = pg;

async function testConnections() {
  console.log('🔍 [diagnostics]: Starting connection verification...');
  console.log('==================================================');

  // ----------------------------------------------------
  // 1. Database Connection Check
  // ----------------------------------------------------
  const dbUrl = process.env.DATABASE_URL;
  console.log('📂 Database URL configured:', dbUrl ? `${dbUrl.split('@')[0]}@***` : 'None');
  
  if (!dbUrl || dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
    if (!dbUrl) {
      console.log('❌ [database]: No DATABASE_URL found in .env.');
    } else {
      console.log('ℹ️ [database]: Currently configured for a LOCAL database (localhost).');
    }
  } else if (dbUrl.includes('neon.tech')) {
    console.log('📡 [database]: Configured for NEON POSTGRESQL cloud database.');
  } else {
    console.log('📡 [database]: Configured for a CUSTOM remote database.');
  }

  if (dbUrl) {
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: dbUrl.includes('neon.tech') || process.env.NODE_ENV === 'production' 
        ? { rejectUnauthorized: false } 
        : undefined,
    });

    try {
      console.log('⏳ [database]: Attempting to establish database connection...');
      const client = await pool.connect();
      console.log('✅ [database]: Successfully connected to the database!');
      
      const dbResult = await client.query('SELECT version(), current_database(), now()');
      console.log(`💻 Server Version: ${dbResult.rows[0].version.split(' on ')[0]}`);
      console.log(`📦 Database Name: ${dbResult.rows[0].current_database}`);
      console.log(`🕒 Database Server Time: ${dbResult.rows[0].now}`);

      // Check if tables exist
      const tableCheck = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name IN ('users', 'analyses')
      `);
      const existingTables = tableCheck.rows.map(row => row.table_name);
      console.log(`📋 Existing Tables Found: ${existingTables.length > 0 ? existingTables.join(', ') : 'None (tables will be created on server boot)'}`);
      
      client.release();
    } catch (err: any) {
      console.error('❌ [database-error]: Failed to connect to the database!');
      console.error(`👉 Error Details: ${err.message}`);
      if (dbUrl.includes('neon.tech')) {
        console.error('👉 Tip: Please make sure your Neon database is active and check if you saved the .env file with the correct credentials.');
      }
    } finally {
      await pool.end();
    }
  }

  console.log('==================================================');

  // ----------------------------------------------------
  // 2. Gemini API Check
  // ----------------------------------------------------
  const geminiKey = process.env.GEMINI_API_KEY;
  console.log('📂 Gemini API Key configured:', geminiKey ? (geminiKey === 'YOUR_GEMINI_API_KEY_HERE' ? 'Placeholder value' : 'Set (hidden for security)') : 'None');

  if (!geminiKey || geminiKey === 'YOUR_GEMINI_API_KEY_HERE') {
    console.log('⚠️ [gemini]: Gemini API key is missing or set to placeholder.');
    console.log('👉 Tip: To obtain a key, go to https://aistudio.google.com/, create a key, and replace "YOUR_GEMINI_API_KEY_HERE" in your .env file.');
  } else {
    try {
      console.log('⏳ [gemini]: Testing Gemini API Key validity with a lightweight model call...');
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: 'Write a 5-word message confirming you can hear me.',
      });

      console.log('✅ [gemini]: API key is VALID and working!');
      console.log(`🤖 Gemini Response: "${response.text?.trim()}"`);
    } catch (err: any) {
      console.error('❌ [gemini-error]: Gemini API call failed.');
      console.error(`👉 Error Details: ${err.message}`);
      console.error('👉 Tip: Double check that your API key is correct and has not expired or been deleted in Google AI Studio.');
    }
  }
  
  console.log('==================================================');
}

testConnections();
