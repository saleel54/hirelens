"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateATSScore = exports.checkResumeQuality = void 0;
const skillsEngine_js_1 = require("./skillsEngine.js");
// Regex matching rules
const EMAIL_REGEX = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const PHONE_REGEX = /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/;
const LINKEDIN_REGEX = /linkedin\.com/i;
const GITHUB_REGEX = /github\.com/i;
const PROJECTS_SECTION_REGEX = /\b(projects|personal projects|selected projects|academic projects|key projects)\b/i;
const QUANTIFIED_METRICS_REGEX = /\b(?:\d+%\b|\$\d+|\d+\s*x\b|increased|improved|saved|reduced|led to\s*\d+|by\s*\d+)/i;
const ACTION_VERBS_REGEX = /\b(implemented|built|designed|developed|managed|led|created|architected|optimized|orchestrated|automated|deployed|integrated|streamlined)\b/i;
const DEGREE_REGEX = /\b(bachelor|master|phd|degree|b\.s\b|m\.s\b|b\.tech\b|m\.tech\b|b\.c\.a\b|m\.c\.a\b|graduate|university|college|education)\b/i;
/**
 * Conducts a programmatic quality check audit of the resume text
 * @param text Cleaned resume text string
 * @returns Quality score (0-100) and details checklist
 */
const checkResumeQuality = (text) => {
    const breakdown = {
        emailPresent: EMAIL_REGEX.test(text),
        phonePresent: PHONE_REGEX.test(text),
        linkedInPresent: LINKEDIN_REGEX.test(text),
        gitHubPresent: GITHUB_REGEX.test(text),
        projectsPresent: PROJECTS_SECTION_REGEX.test(text),
        quantifiedMetricsPresent: QUANTIFIED_METRICS_REGEX.test(text),
        actionVerbsPresent: ACTION_VERBS_REGEX.test(text),
    };
    let score = 0;
    if (breakdown.emailPresent)
        score += 15;
    if (breakdown.phonePresent)
        score += 15;
    if (breakdown.linkedInPresent)
        score += 15;
    if (breakdown.gitHubPresent)
        score += 15;
    if (breakdown.projectsPresent)
        score += 15;
    if (breakdown.quantifiedMetricsPresent)
        score += 15;
    if (breakdown.actionVerbsPresent)
        score += 10;
    return {
        score,
        breakdown,
    };
};
exports.checkResumeQuality = checkResumeQuality;
/**
 * Calculates the final ATS Score and returns the breakdown of scores
 * @param resumeText Raw resume text content
 * @param jdText Raw job description content
 * @param aiScores Optional AI-computed overrides from Gemini
 * @returns Complete ATS calculation details
 */
const calculateATSScore = (resumeText, jdText, aiScores) => {
    // 1. Skills Comparison (40%)
    const matchedSkills = aiScores?.matchedSkills ?? (0, skillsEngine_js_1.compareSkills)(resumeText, jdText).matchedSkills;
    const missingSkills = aiScores?.missingSkills ?? (0, skillsEngine_js_1.compareSkills)(resumeText, jdText).missingSkills;
    let skillsMatchScore = aiScores?.skillsMatchScore;
    if (skillsMatchScore === undefined) {
        const totalRequiredSkillsCount = matchedSkills.length + missingSkills.length;
        skillsMatchScore = 100; // default if no specific skills are found
        if (totalRequiredSkillsCount > 0) {
            skillsMatchScore = Math.round((matchedSkills.length / totalRequiredSkillsCount) * 100);
        }
    }
    // 2. Resume Quality Check (20%)
    const qualityAudit = (0, exports.checkResumeQuality)(resumeText);
    const resumeQualityScore = qualityAudit.score;
    // 3. Projects Relevance Score (25%)
    let projectsRelevanceScore = aiScores?.projectsRelevanceScore;
    if (projectsRelevanceScore === undefined) {
        if (qualityAudit.breakdown.projectsPresent) {
            // If project section is present, check technical complexity overlap
            if (matchedSkills.length >= 3) {
                projectsRelevanceScore = 100;
            }
            else if (matchedSkills.length === 2) {
                projectsRelevanceScore = 85;
            }
            else if (matchedSkills.length === 1) {
                projectsRelevanceScore = 70;
            }
            else {
                projectsRelevanceScore = 50; // default base score for having projects section
            }
        }
        else {
            projectsRelevanceScore = 0; // missing critical projects section
        }
    }
    // 4. Education Relevance Score (15%)
    let educationRelevanceScore = 0;
    const lowercaseResume = resumeText.toLowerCase();
    if (DEGREE_REGEX.test(lowercaseResume)) {
        // Standard credential keyword verified
        educationRelevanceScore = 100;
    }
    else if (lowercaseResume.includes('education') || lowercaseResume.includes('academic')) {
        // Generic education section present
        educationRelevanceScore = 60;
    }
    else {
        // No explicit indicators found
        educationRelevanceScore = 20;
    }
    // 5. Total Weighted Scoring Calculation
    // Skills = 40%, Projects = 25%, Quality = 20%, Education = 15%
    const finalScore = Math.round((skillsMatchScore * 0.40) +
        (projectsRelevanceScore * 0.25) +
        (resumeQualityScore * 0.20) +
        (educationRelevanceScore * 0.15));
    return {
        atsScore: finalScore,
        resumeQualityScore,
        scoresBreakdown: {
            skillsMatchScore,
            projectsRelevanceScore,
            resumeQualityScore,
            educationRelevanceScore,
        },
        qualityBreakdown: qualityAudit.breakdown,
        matchedSkills,
        missingSkills,
    };
};
exports.calculateATSScore = calculateATSScore;
