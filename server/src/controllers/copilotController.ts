import { Response } from 'express';
import { AuthRequest } from '../@types/auth.js';
import { dbService, getPrisma } from '../db/prisma.js';
import { query, isSandboxMode } from '../config/db.js';
import { generateCareerCopilotRoadmap } from '../services/gemini.js';

// ==========================================
// Job Readiness Score Recalculator
// ==========================================
export const recalculateJobReadiness = async (userId: number): Promise<any> => {
  let atsScore = 0;
  let resumeQualityScore = 0;
  let hasGithub = false;
  let hasLinkedin = false;
  let hasPortfolio = false;
  let resumeScore = 0;

  // 1. Resume Readiness (25%)
  try {
    const analysisRes = await query(
      `SELECT ats_score, resume_quality_score, matched_skills, suggestions 
       FROM analyses 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [userId]
    );

    if (analysisRes.rows.length > 0) {
      const latest = analysisRes.rows[0];
      atsScore = latest.ats_score || 0;
      resumeQualityScore = latest.resume_quality_score || 0;

      // Scan JSON and suggestions for profile links presence
      const payloadString = JSON.stringify(latest).toLowerCase();
      hasGithub = payloadString.includes('github.com') || payloadString.includes('git');
      hasLinkedin = payloadString.includes('linkedin.com');
      hasPortfolio = payloadString.includes('portfolio') || payloadString.includes('website') || payloadString.includes('http');
      
      const presenceBonus = (hasGithub ? 33 : 0) + (hasLinkedin ? 33 : 0) + (hasPortfolio ? 34 : 0);
      resumeScore = Math.round(atsScore * 0.5 + resumeQualityScore * 0.3 + presenceBonus * 0.2);
    }
  } catch (err) {
    console.error('Failed to query resume analysis in readiness recalculation:', err);
  }

  // 2. Skill Readiness (35%)
  let skillScore = 0;
  let matchedSkillsCount = 0;
  let missingSkillsCount = 0;
  try {
    const goal = await dbService.getCareerGoal(userId);
    if (goal) {
      const analysisRes = await query(
        `SELECT matched_skills, missing_skills 
         FROM analyses 
         WHERE user_id = $1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [userId]
      );

      if (analysisRes.rows.length > 0) {
        const latest = analysisRes.rows[0];
        const matched = Array.isArray(latest.matched_skills) ? latest.matched_skills : [];
        const missing = Array.isArray(latest.missing_skills) ? latest.missing_skills : [];
        matchedSkillsCount = matched.length;
        missingSkillsCount = missing.length;

        if (matchedSkillsCount + missingSkillsCount > 0) {
          skillScore = Math.round((matchedSkillsCount / (matchedSkillsCount + missingSkillsCount)) * 100);
        } else {
          skillScore = 50;
        }
      } else {
        // Fallback depending on goal input level
        skillScore = goal.currentSkillLevel === 'Beginner' ? 20 : goal.currentSkillLevel === 'Learning' ? 50 : 75;
      }
    }
  } catch (err) {
    console.error('Failed to calculate skill score:', err);
  }

  // 3. Project Readiness (25%)
  let projectScore = 0;
  try {
    const projects = await dbService.getProjectRecommendations(userId);
    if (projects.length > 0) {
      const completed = projects.filter(p => p.status === 'Completed').length;
      const inProgress = projects.filter(p => p.status === 'In_Progress').length;
      projectScore = Math.round(((completed * 1.0 + inProgress * 0.5) / projects.length) * 100);
    }
  } catch (err) {
    console.error('Failed to calculate project score:', err);
  }

  // 4. Interview Readiness (15%)
  let interviewScore = 0;
  let interviewCompleted = 0;
  try {
    const goal = await dbService.getCareerGoal(userId);
    if (goal) {
      const session = await dbService.getInterviewSession(userId, goal.targetRole);
      if (session) {
        interviewCompleted = session.completedQuestionsCount || 0;
        const avgRating = session.averageScore || 0; // 0-10
        interviewScore = Math.round(Math.min(100, (interviewCompleted / 10) * 50 + (avgRating / 10) * 50));
      }
    }
  } catch (err) {
    console.error('Failed to calculate interview score:', err);
  }

  // 5. Overall Weighted
  const overallScore = Math.round(
    resumeScore * 0.25 +
    skillScore * 0.35 +
    projectScore * 0.25 +
    interviewScore * 0.15
  );

  // Generate improvements advice
  const improvementSuggestions: string[] = [];
  if (atsScore < 75) {
    improvementSuggestions.push('Optimize your resume structure and format to raise your ATS Score above 75%.');
  }
  if (!hasGithub) {
    improvementSuggestions.push('Add your GitHub profile link to your resume to demonstrate open-source contributions.');
  }
  if (!hasLinkedin) {
    improvementSuggestions.push('Link your LinkedIn presence to showcase your professional profile.');
  }
  if (missingSkillsCount > 0) {
    improvementSuggestions.push('Acquire the missing skills for your target role, focusing on your current roadmap modules.');
  }
  
  const pendingProjects = (await dbService.getProjectRecommendations(userId)).filter(p => p.status !== 'Completed');
  if (pendingProjects.length > 0) {
    improvementSuggestions.push(`Complete your recommended projects (like '${pendingProjects[0].name}') to demonstrate real-world deployment credentials.`);
  }

  if (interviewCompleted < 10) {
    improvementSuggestions.push(`Practice at least ${10 - interviewCompleted} more AI mock interview questions to sharpen your STAR delivery.`);
  }

  if (improvementSuggestions.length === 0) {
    improvementSuggestions.push('Keep applying to jobs and refining your system design answers! You are job ready.');
  }

  const finalRecord = await dbService.saveJobReadinessScore(userId, {
    overallScore,
    resumeScore,
    skillScore,
    projectScore,
    interviewScore,
    improvementSuggestions
  });

  // Keep track in progress table
  await dbService.calculateUserProgress(userId);

  return finalRecord;
};

// ==========================================
// Controller Route Handlers
// ==========================================

/**
 * Setup Career Goal and generate complete AI Copilot assets
 */
export const setGoal = async (req: AuthRequest, res: Response) => {
  const { targetRole, timelineMonths, currentSkillLevel, hoursPerDay, preferredLearningStyle, currentSkills } = req.body;

  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'User session not found.' });
  }

  if (!targetRole || !timelineMonths || !currentSkillLevel || !hoursPerDay || !preferredLearningStyle) {
    return res.status(400).json({ error: 'Validation Error', message: 'All goal setup fields are required.' });
  }

  try {
    // 1. Save Goal Info
    const goal = await dbService.saveCareerGoal(req.user.id, {
      targetRole,
      timelineMonths: Number(timelineMonths),
      currentSkillLevel,
      hoursPerDay: Number(hoursPerDay),
      preferredLearningStyle
    });

    // 2. Fetch Latest Resume analysis if exists to feed Gemini
    let resumeData;
    const analysisRes = await query(
      `SELECT ats_score, resume_quality_score, matched_skills, missing_skills 
       FROM analyses 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [req.user.id]
    );

    if (analysisRes.rows.length > 0) {
      const raw = analysisRes.rows[0];
      resumeData = {
        atsScore: raw.ats_score,
        resumeQualityScore: raw.resume_quality_score,
        matchedSkills: Array.isArray(raw.matched_skills) ? raw.matched_skills : [],
        missingSkills: Array.isArray(raw.missing_skills) ? raw.missing_skills : []
      };
    }

    // 3. Request Gemini to generate tailored roadmap, weekly missions, and projects
    const aiCopilotResponse = await generateCareerCopilotRoadmap(
      targetRole,
      Number(timelineMonths),
      currentSkillLevel,
      Number(hoursPerDay),
      preferredLearningStyle,
      Array.isArray(currentSkills) ? currentSkills : [],
      resumeData
    );

    // 4. Save generated Roadmap & Weekly Missions
    const roadmap = await dbService.saveRoadmap(
      goal.id,
      req.user.id,
      aiCopilotResponse.roadmapTitle,
      aiCopilotResponse.roadmapDescription,
      aiCopilotResponse.modules
    );

    // 5. Save Project recommendations
    await dbService.saveProjectRecommendations(goal.id, aiCopilotResponse.projectRecommendations);

    // 6. Recalculate Initial Readiness Score
    await recalculateJobReadiness(req.user.id);

    return res.status(200).json({
      message: 'AI Career Goal setup and Roadmap generated successfully.',
      goal,
      roadmap,
      estimatedWeeks: aiCopilotResponse.estimatedJobReadyWeeks,
      nextSteps: aiCopilotResponse.nextSteps
    });

  } catch (error: any) {
    console.error('❌ [copilot-controller-set-goal]:', error);
    return res.status(500).json({
      error: 'Server Error',
      message: error.message || 'An unexpected error occurred while setting your career goal.'
    });
  }
};

/**
 * Retrieve active Career Goal & Roadmap Modules
 */
export const getGoal = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'User session not found.' });
  }

  try {
    const goal = await dbService.getCareerGoal(req.user.id);
    if (!goal) {
      return res.status(200).json({ goal: null, roadmap: null });
    }

    const roadmap = await dbService.getRoadmap(req.user.id);
    return res.status(200).json({ goal, roadmap });
  } catch (error: any) {
    console.error('❌ [copilot-controller-get-goal]:', error);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve active goal details.' });
  }
};

/**
 * Retrieve weekly missions checklist
 */
export const getMissions = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'User session not found.' });
  }

  try {
    const missions = await dbService.getWeeklyMissions(req.user.id);
    return res.status(200).json({ missions });
  } catch (error: any) {
    console.error('❌ [copilot-controller-get-missions]:', error);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve weekly missions.' });
  }
};

/**
 * Toggle a task status in weekly missions checklist
 */
export const updateTaskStatus = async (req: AuthRequest, res: Response) => {
  const { missionId, taskId } = req.params;
  const { status } = req.body; // "Completed" | "Pending" | "In_Progress"

  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'User session not found.' });
  }

  if (!status) {
    return res.status(400).json({ error: 'Validation Error', message: 'Task status is required.' });
  }

  try {
    const updatedMission = await dbService.updateMissionTaskStatus(
      req.user.id,
      Number(missionId),
      taskId,
      status
    );

    // Trigger score recalculation
    await recalculateJobReadiness(req.user.id);

    return res.status(200).json({
      message: 'Mission task updated successfully.',
      mission: updatedMission
    });
  } catch (error: any) {
    console.error('❌ [copilot-controller-update-task]:', error);
    return res.status(500).json({ error: 'Server Error', message: error.message || 'Failed to update mission task status.' });
  }
};

/**
 * Get lists of recommended projects
 */
export const getProjects = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'User session not found.' });
  }

  try {
    const projects = await dbService.getProjectRecommendations(req.user.id);
    return res.status(200).json({ projects });
  } catch (error: any) {
    console.error('❌ [copilot-controller-get-projects]:', error);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve projects recommendations.' });
  }
};

/**
 * Toggle project status
 */
export const updateProjectStatus = async (req: AuthRequest, res: Response) => {
  const { projectId } = req.params;
  const { status } = req.body; // "Pending" | "In_Progress" | "Completed"

  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'User session not found.' });
  }

  if (!status) {
    return res.status(400).json({ error: 'Validation Error', message: 'Project status is required.' });
  }

  try {
    const updatedProject = await dbService.updateProjectStatus(
      req.user.id,
      Number(projectId),
      status
    );

    // Recalculate readiness
    await recalculateJobReadiness(req.user.id);

    return res.status(200).json({
      message: 'Project status updated successfully.',
      project: updatedProject
    });
  } catch (error: any) {
    console.error('❌ [copilot-controller-update-project]:', error);
    return res.status(500).json({ error: 'Server Error', message: error.message || 'Failed to update project status.' });
  }
};

/**
 * Retrieve Career GPS dashboard information
 */
export const getGPS = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'User session not found.' });
  }

  try {
    const goal = await dbService.getCareerGoal(req.user.id);
    if (!goal) {
      return res.status(200).json({ gps: null });
    }

    const scoresHistory = await dbService.getReadinessHistory(req.user.id);
    const latestScoreRecord = scoresHistory.length > 0 ? scoresHistory[scoresHistory.length - 1] : null;
    const progress = latestScoreRecord ? latestScoreRecord.overallScore : 0;

    // Define current level based on overall score
    let currentLevel = 'Beginner';
    if (progress > 85) currentLevel = 'Interview Ready';
    else if (progress > 70) currentLevel = 'Job Ready';
    else if (progress > 50) currentLevel = 'Developing';
    else if (progress > 30) currentLevel = 'Learning';

    // Get next steps & timeline
    const roadmap = await dbService.getRoadmap(req.user.id);
    const weeklyMissions = await dbService.getWeeklyMissions(req.user.id);
    const incompleteMissions = weeklyMissions.filter(m => m.status !== 'Completed');
    
    let nextStep = 'Set up a GitHub profile and parse a resume.';
    if (incompleteMissions.length > 0) {
      const activeMission = incompleteMissions[0];
      const pendingTask = (activeMission.tasks as any[]).find(t => t.status !== 'Completed');
      nextStep = pendingTask ? pendingTask.text : `Complete mission: ${activeMission.title}`;
    } else if (roadmap) {
      nextStep = 'Complete all recommended projects to start interview preparation.';
    }

    // Estimate job ready date (weeks remaining)
    const weeksRemaining = Math.max(1, Math.round(Number(goal.timelineMonths) * 4 * (1 - (progress / 100))));

    return res.status(200).json({
      gps: {
        currentLevel,
        destinationRole: goal.targetRole,
        progressPercentage: progress,
        nextStep,
        weeksRemaining,
        estimatedReadyDate: new Date(Date.now() + weeksRemaining * 7 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, {
          month: 'short',
          year: 'numeric'
        })
      }
    });
  } catch (error: any) {
    console.error('❌ [copilot-controller-get-gps]:', error);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve Career GPS status.' });
  }
};

/**
 * Retrieve Job Readiness Breakdown and history logs
 */
export const getReadiness = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'User session not found.' });
  }

  try {
    const scoresHistory = await dbService.getReadinessHistory(req.user.id);
    
    if (scoresHistory.length === 0) {
      return res.status(200).json({ current: null, history: [] });
    }

    const latest = scoresHistory[scoresHistory.length - 1];

    return res.status(200).json({
      current: latest,
      history: scoresHistory.map(h => ({
        score: h.overallScore,
        date: h.createdAt
      }))
    });
  } catch (error: any) {
    console.error('❌ [copilot-controller-get-readiness]:', error);
    return res.status(500).json({ error: 'Server Error', message: 'Failed to retrieve Job Readiness breakdown.' });
  }
};

/**
 * Force recaculation of roadmap learning priorities (Adaptive Recalculation)
 */
export const triggerAdaptiveRecalculate = async (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'User session not found.' });
  }

  try {
    const goal = await dbService.getCareerGoal(req.user.id);
    if (!goal) {
      return res.status(400).json({ error: 'Error', message: 'No active career goal found. Set a goal first.' });
    }

    // Recalculate AI roadmap dynamically
    // Get latest resume details
    let resumeData;
    const analysisRes = await query(
      `SELECT ats_score, resume_quality_score, matched_skills, missing_skills 
       FROM analyses 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 1`,
      [req.user.id]
    );

    if (analysisRes.rows.length > 0) {
      const raw = analysisRes.rows[0];
      resumeData = {
        atsScore: raw.ats_score,
        resumeQualityScore: raw.resume_quality_score,
        matchedSkills: Array.isArray(raw.matched_skills) ? raw.matched_skills : [],
        missingSkills: Array.isArray(raw.missing_skills) ? raw.missing_skills : []
      };
    }

    console.log(`⚡ [copilot-controller]: Running dynamic adaptive recalculation for user ID: ${req.user.id}`);
    
    // Request Gemini to generate a new adjusted roadmap
    const aiCopilotResponse = await generateCareerCopilotRoadmap(
      goal.targetRole,
      goal.timelineMonths,
      goal.currentSkillLevel,
      goal.hoursPerDay,
      goal.preferredLearningStyle,
      [],
      resumeData
    );

    // Save recalculated Roadmap
    const roadmap = await dbService.saveRoadmap(
      goal.id,
      req.user.id,
      aiCopilotResponse.roadmapTitle,
      aiCopilotResponse.roadmapDescription,
      aiCopilotResponse.modules
    );

    // Re-evaluate scores
    await recalculateJobReadiness(req.user.id);

    return res.status(200).json({
      message: 'AI Adaptive Roadmap successfully recalculated and updated.',
      roadmap,
      estimatedWeeks: aiCopilotResponse.estimatedJobReadyWeeks,
      nextSteps: aiCopilotResponse.nextSteps
    });

  } catch (error: any) {
    console.error('❌ [copilot-controller-adaptive-recalculate]:', error);
    return res.status(500).json({ error: 'Server Error', message: error.message || 'Failed to recalculate roadmap.' });
  }
};
