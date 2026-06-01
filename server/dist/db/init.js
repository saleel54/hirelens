"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = void 0;
const pg_1 = __importDefault(require("pg"));
const db_js_1 = require("../config/db.js");
const initializeDatabase = async () => {
    console.log('🔄 [database]: Initializing schema and tables check...');
    const connectionString = process.env.DATABASE_URL;
    // 1. Auto-Create target database if it does not exist locally
    if (connectionString && !connectionString.includes('neon.tech')) {
        try {
            const parsedUrl = new URL(connectionString);
            const targetDb = parsedUrl.pathname.substring(1); // 'hirelensai'
            if (targetDb && targetDb !== 'postgres') {
                // Connect temporarily to the default 'postgres' database which always exists
                parsedUrl.pathname = '/postgres';
                const tempClient = new pg_1.default.Client({
                    connectionString: parsedUrl.toString(),
                    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
                });
                await tempClient.connect();
                const dbCheck = await tempClient.query("SELECT 1 FROM pg_database WHERE datname = $1", [targetDb]);
                if (dbCheck.rows.length === 0) {
                    console.log(`🔨 [database-creation]: Database "${targetDb}" does not exist. Creating it now...`);
                    // Note: PostgreSQL requires double quotes on identifiers or standard text format
                    await tempClient.query(`CREATE DATABASE ${targetDb}`);
                    console.log(`🎉 [database-creation]: Database "${targetDb}" created successfully.`);
                }
                else {
                    console.log(`✅ [database-creation]: Database "${targetDb}" verified present.`);
                }
                await tempClient.end();
            }
        }
        catch (err) {
            console.warn('⚠️ [database-creation-warning]: Database auto-check bypassed:', err.message || err);
            // Let it fall through, the standard query pool will throw its own error if it fails
        }
    }
    // 2. Initialize SQL schema and tables
    try {
        // Create Users Table
        await (0, db_js_1.query)(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ [database]: Users table verified/created.');
        // Create Analyses Table
        await (0, db_js_1.query)(`
      CREATE TABLE IF NOT EXISTS analyses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE NOT NULL,
        job_role VARCHAR(255) NOT NULL,
        job_description TEXT,
        resume_file_name VARCHAR(255),
        ats_score INTEGER NOT NULL CHECK (ats_score BETWEEN 0 AND 100),
        resume_quality_score INTEGER NOT NULL CHECK (resume_quality_score BETWEEN 0 AND 100),
        scores_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
        matched_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
        missing_skills JSONB NOT NULL DEFAULT '[]'::jsonb,
        resume_quality_details JSONB NOT NULL DEFAULT '{}'::jsonb,
        suggestions JSONB NOT NULL DEFAULT '{}'::jsonb,
        interview_questions JSONB NOT NULL DEFAULT '{}'::jsonb,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
        console.log('✅ [database]: Analyses table verified/created.');
        // Run structural migration check to alter existing production database tables safely
        try {
            await (0, db_js_1.query)(`ALTER TABLE analyses ADD COLUMN IF NOT EXISTS job_description TEXT;`);
            await (0, db_js_1.query)(`ALTER TABLE analyses ADD COLUMN IF NOT EXISTS resume_file_name VARCHAR(255);`);
            console.log('✅ [database]: Analyses table migrations verified/applied.');
        }
        catch (alterError) {
            console.warn('⚠️ [database-migration]: Production structural check bypassed:', alterError.message || alterError);
        }
        // Create Search/Foreign Key Indexes
        await (0, db_js_1.query)(`
      CREATE INDEX IF NOT EXISTS idx_analyses_user_id ON analyses(user_id);
    `);
        await (0, db_js_1.query)(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    `);
        console.log('✅ [database]: Performance indexes verified/created.');
        console.log('🎉 [database]: Database initialization completed successfully.');
    }
    catch (error) {
        console.error('❌ [database-init-error]: Failed to initialize database schema:', error);
        throw error;
    }
};
exports.initializeDatabase = initializeDatabase;
