"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.evaluateAnswer = exports.deleteHistory = exports.getHistoryById = exports.getHistory = exports.analyzeResume = void 0;
const db_js_1 = require("../config/db.js");
const parser_js_1 = require("../services/parser.js");
const atsEngine_js_1 = require("../services/atsEngine.js");
const gemini_js_1 = require("../services/gemini.js");
/**
 * Executes a full end-to-end resume analysis audit
 */
const analyzeResume = async (req, res) => {
    const { jobRole, jobDescription } = req.body;
    const file = req.file;
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User session not found.' });
    }
    // 1. Inputs validation
    if (!jobRole || jobRole.trim() === '') {
        return res.status(400).json({ error: 'Validation Error', message: 'Job Role targeted is required.' });
    }
    if (!jobDescription || jobDescription.trim() === '') {
        return res.status(400).json({ error: 'Validation Error', message: 'Job Description is required.' });
    }
    if (!file) {
        return res.status(400).json({ error: 'Validation Error', message: 'Please upload a PDF resume file.' });
    }
    // Double check PDF type and size (5MB in bytes is 5242880)
    if (file.mimetype !== 'application/pdf') {
        return res.status(400).json({ error: 'Validation Error', message: 'Only PDF format is allowed.' });
    }
    if (file.size > 5242880) {
        return res.status(400).json({ error: 'Validation Error', message: 'Resume size must not exceed 5MB.' });
    }
    try {
        // 2. Parse PDF buffer to raw text (Step 1 Loading state context)
        const resumeText = await (0, parser_js_1.parseResumePDF)(file.buffer);
        // 3. Extract baseline programmatic skills hints
        const { compareSkills } = await import('../services/skillsEngine.js');
        const programmaticSkills = compareSkills(resumeText, jobDescription);
        // 4. Generate AI semantic matching, scoring, and interview prep questions
        const aiFeedback = await (0, gemini_js_1.generateAIFeedback)(resumeText, jobRole.trim(), jobDescription.trim(), programmaticSkills.matchedSkills, programmaticSkills.missingSkills);
        // 5. Calculate combined overall weighted ATS score blending AI scores & programmatic structure audits
        const atsResult = (0, atsEngine_js_1.calculateATSScore)(resumeText, jobDescription, {
            skillsMatchScore: aiFeedback.skillsMatchScore,
            projectsRelevanceScore: aiFeedback.projectsRelevanceScore,
            matchedSkills: aiFeedback.matchedSkills,
            missingSkills: aiFeedback.missingSkills
        });
        // 6. Store completed analysis record into database
        const dbResult = await (0, db_js_1.query)(`INSERT INTO analyses (
        user_id, job_role, job_description, resume_file_name, 
        ats_score, resume_quality_score, scores_breakdown, matched_skills, 
        missing_skills, resume_quality_details, suggestions, interview_questions
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING id, created_at`, [
            req.user.id,
            jobRole.trim(),
            jobDescription.trim(),
            file.originalname,
            atsResult.atsScore,
            atsResult.resumeQualityScore,
            JSON.stringify(atsResult.scoresBreakdown),
            JSON.stringify(atsResult.matchedSkills),
            JSON.stringify(atsResult.missingSkills),
            JSON.stringify(atsResult.qualityBreakdown),
            JSON.stringify(aiFeedback.suggestions),
            JSON.stringify(aiFeedback.interviewQuestions)
        ]);
        const savedRecord = dbResult.rows[0];
        // Return full computed analytical context to user
        return res.status(200).json({
            message: 'Analysis completed successfully',
            analysisId: savedRecord.id,
            jobRole: jobRole.trim(),
            resumeFileName: file.originalname,
            created_at: savedRecord.created_at,
            atsScore: atsResult.atsScore,
            resumeQualityScore: atsResult.resumeQualityScore,
            scoresBreakdown: atsResult.scoresBreakdown,
            qualityBreakdown: atsResult.qualityBreakdown,
            matchedSkills: atsResult.matchedSkills,
            missingSkills: atsResult.missingSkills,
            suggestions: aiFeedback.suggestions,
            interviewQuestions: aiFeedback.interviewQuestions
        });
    }
    catch (error) {
        console.error('❌ [analysis-controller-error]:', error);
        return res.status(500).json({
            error: 'Server Error',
            message: error.message || 'An unexpected error occurred during resume analysis.'
        });
    }
};
exports.analyzeResume = analyzeResume;
/**
 * Fetches user's historical analyses records
 */
const getHistory = async (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User session not found.' });
    }
    try {
        const result = await (0, db_js_1.query)(`SELECT id, job_role, ats_score, resume_quality_score, resume_file_name, created_at 
       FROM analyses 
       WHERE user_id = $1 
       ORDER BY created_at DESC`, [req.user.id]);
        return res.status(200).json({
            history: result.rows
        });
    }
    catch (error) {
        console.error('❌ [analysis-controller-history-error]:', error);
        return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve analysis logs.' });
    }
};
exports.getHistory = getHistory;
/**
 * Fetches specific historical analysis card details
 */
const getHistoryById = async (req, res) => {
    const { id } = req.params;
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User session not found.' });
    }
    try {
        const result = await (0, db_js_1.query)(`SELECT * FROM analyses WHERE id = $1 AND user_id = $2`, [id, req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Not Found', message: 'Analysis record does not exist.' });
        }
        const record = result.rows[0];
        // We already save matched/missing as JSONB, Postgres parses it directly
        return res.status(200).json({
            analysisId: record.id,
            jobRole: record.job_role,
            jobDescription: record.job_description,
            resumeFileName: record.resume_file_name,
            created_at: record.created_at,
            atsScore: record.ats_score,
            resumeQualityScore: record.resume_quality_score,
            scoresBreakdown: record.scores_breakdown,
            matchedSkills: record.matched_skills,
            missingSkills: record.missing_skills,
            qualityBreakdown: record.resume_quality_details,
            suggestions: record.suggestions,
            interviewQuestions: record.interview_questions
        });
    }
    catch (error) {
        console.error('❌ [analysis-controller-detail-error]:', error);
        return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve analysis record details.' });
    }
};
exports.getHistoryById = getHistoryById;
/**
 * Deletes a historical analysis record
 */
const deleteHistory = async (req, res) => {
    const { id } = req.params;
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User session not found.' });
    }
    try {
        const result = await (0, db_js_1.query)(`DELETE FROM analyses WHERE id = $1 AND user_id = $2 RETURNING id`, [id, req.user.id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Not Found', message: 'Analysis record not found or unauthorized.' });
        }
        return res.status(200).json({
            message: 'Analysis record deleted successfully',
            id: result.rows[0].id
        });
    }
    catch (error) {
        console.error('❌ [analysis-controller-delete-error]:', error);
        return res.status(500).json({ error: 'Server Error', message: 'Failed to delete analysis log.' });
    }
};
exports.deleteHistory = deleteHistory;
/**
 * Evaluates candidate response to a custom mock interview question
 */
const evaluateAnswer = async (req, res) => {
    const { question, answer, jobRole } = req.body;
    if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized', message: 'User session not found.' });
    }
    if (!question || !answer) {
        return res.status(400).json({ error: 'Validation Error', message: 'Question and answer are required.' });
    }
    try {
        const evaluation = await (0, gemini_js_1.evaluateInterviewResponse)(question.trim(), answer.trim(), jobRole ? jobRole.trim() : 'Software Engineer');
        return res.status(200).json(evaluation);
    }
    catch (error) {
        console.error('❌ [analysis-controller-evaluate-answer-error]:', error);
        return res.status(500).json({
            error: 'Server Error',
            message: error.message || 'An unexpected error occurred during interview question evaluation.'
        });
    }
};
exports.evaluateAnswer = evaluateAnswer;
