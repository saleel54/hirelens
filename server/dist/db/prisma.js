"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbService = exports.getPrisma = void 0;
const client_1 = require("@prisma/client");
const db_js_1 = require("../config/db.js");
let prismaClient = null;
if (!db_js_1.isSandboxMode) {
    try {
        prismaClient = new client_1.PrismaClient();
    }
    catch (err) {
        console.warn('⚠️ [prisma]: Failed to initialize Prisma Client, will use sandbox fallback:', err.message);
    }
}
const getPrisma = () => {
    if (!prismaClient) {
        throw new Error('Prisma Client is not initialized. Running in Sandbox Mode.');
    }
    return prismaClient;
};
exports.getPrisma = getPrisma;
// ==========================================
// In-Memory Database Storage for Sandbox Mode
// ==========================================
const mockCareerGoals = [];
const mockRoadmaps = [];
const mockRoadmapModules = [];
const mockWeeklyMissions = [];
const mockProjectRecommendations = [];
const mockUserProgress = [];
const mockJobReadinessScores = [];
const mockInterviewSessions = [];
let nextGoalId = 1;
let nextRoadmapId = 1;
let nextModuleId = 1;
let nextMissionId = 1;
let nextProjectId = 1;
let nextProgressId = 1;
let nextReadinessId = 1;
// ==========================================
// DB Service Operations
// ==========================================
exports.dbService = {
    // ----------------------------------------
    // Career Goal Operations
    // ----------------------------------------
    async getCareerGoal(userId) {
        if (!db_js_1.isSandboxMode && prismaClient) {
            return prismaClient.careerGoal.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            });
        }
        return mockCareerGoals.find(g => g.userId === userId) || null;
    },
    async saveCareerGoal(userId, data) {
        if (!db_js_1.isSandboxMode && prismaClient) {
            // Clean up past goals (cascade deletes roadmaps, missions, projects)
            await prismaClient.careerGoal.deleteMany({
                where: { userId }
            });
            return prismaClient.careerGoal.create({
                data: {
                    userId,
                    targetRole: data.targetRole,
                    timelineMonths: data.timelineMonths,
                    currentSkillLevel: data.currentSkillLevel,
                    hoursPerDay: data.hoursPerDay,
                    preferredLearningStyle: data.preferredLearningStyle
                }
            });
        }
        // In-memory simulation
        // Remove old ones
        const idx = mockCareerGoals.findIndex(g => g.userId === userId);
        if (idx !== -1) {
            const oldGoal = mockCareerGoals[idx];
            mockCareerGoals.splice(idx, 1);
            // Cascade delete on mock database
            const roadmapsToDelete = mockRoadmaps.filter(r => r.goalId === oldGoal.id);
            roadmapsToDelete.forEach(r => {
                const modulesToDelete = mockRoadmapModules.filter(m => m.roadmapId === r.id);
                modulesToDelete.forEach(m => {
                    const mIdx = mockWeeklyMissions.findIndex(w => w.moduleId === m.id);
                    while (mIdx !== -1) {
                        mockWeeklyMissions.splice(mIdx, 1);
                    }
                });
                const rmIdx = mockRoadmapModules.findIndex(m => m.roadmapId === r.id);
                while (rmIdx !== -1) {
                    mockRoadmapModules.splice(rmIdx, 1);
                }
            });
            const rIdx = mockRoadmaps.findIndex(r => r.goalId === oldGoal.id);
            while (rIdx !== -1) {
                mockRoadmaps.splice(rIdx, 1);
            }
            const pIdx = mockProjectRecommendations.findIndex(p => p.goalId === oldGoal.id);
            while (pIdx !== -1) {
                mockProjectRecommendations.splice(pIdx, 1);
            }
        }
        const newGoal = {
            id: nextGoalId++,
            userId,
            targetRole: data.targetRole,
            timelineMonths: data.timelineMonths,
            currentSkillLevel: data.currentSkillLevel,
            hoursPerDay: data.hoursPerDay,
            preferredLearningStyle: data.preferredLearningStyle,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        mockCareerGoals.push(newGoal);
        return newGoal;
    },
    // ----------------------------------------
    // Roadmap Operations
    // ----------------------------------------
    async getRoadmap(userId) {
        if (!db_js_1.isSandboxMode && prismaClient) {
            return prismaClient.roadmap.findFirst({
                where: { userId },
                include: {
                    modules: {
                        include: {
                            weeklyMissions: true
                        },
                        orderBy: { monthNumber: 'asc' }
                    }
                }
            });
        }
        // In-memory simulation
        const activeGoal = mockCareerGoals.find(g => g.userId === userId);
        if (!activeGoal)
            return null;
        const roadmap = mockRoadmaps.find(r => r.goalId === activeGoal.id);
        if (!roadmap)
            return null;
        const modules = mockRoadmapModules
            .filter(m => m.roadmapId === roadmap.id)
            .map(m => {
            const weeklyMissions = mockWeeklyMissions.filter(w => w.moduleId === m.id);
            return {
                ...m,
                weeklyMissions
            };
        })
            .sort((a, b) => a.monthNumber - b.monthNumber);
        return {
            ...roadmap,
            modules
        };
    },
    async saveRoadmap(goalId, userId, title, description, modules) {
        if (!db_js_1.isSandboxMode && prismaClient) {
            return prismaClient.roadmap.create({
                data: {
                    goalId,
                    userId,
                    title,
                    description,
                    modules: {
                        create: modules.map(m => ({
                            monthNumber: m.monthNumber,
                            title: m.title,
                            description: m.description,
                            skillsToLearn: m.skillsToLearn,
                            projectTitle: m.projectTitle,
                            projectDescription: m.projectDescription,
                            weeklyMissions: {
                                create: m.weeks.map((w) => ({
                                    weekNumber: w.weekNumber,
                                    title: w.title,
                                    tasks: w.tasks.map((t, tIdx) => ({
                                        id: `task-${m.monthNumber}-${w.weekNumber}-${tIdx}`,
                                        text: t,
                                        status: 'Pending'
                                    })),
                                    status: 'Pending'
                                }))
                            }
                        }))
                    }
                }
            });
        }
        // In-memory simulation
        const newRoadmap = {
            id: nextRoadmapId++,
            goalId,
            userId,
            title,
            description,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        mockRoadmaps.push(newRoadmap);
        modules.forEach(m => {
            const newModule = {
                id: nextModuleId++,
                roadmapId: newRoadmap.id,
                monthNumber: m.monthNumber,
                title: m.title,
                description: m.description,
                skillsToLearn: m.skillsToLearn,
                projectTitle: m.projectTitle,
                projectDescription: m.projectDescription,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            mockRoadmapModules.push(newModule);
            m.weeks.forEach((w) => {
                const newMission = {
                    id: nextMissionId++,
                    moduleId: newModule.id,
                    weekNumber: w.weekNumber,
                    title: w.title,
                    tasks: w.tasks.map((t, tIdx) => ({
                        id: `task-${m.monthNumber}-${w.weekNumber}-${tIdx}`,
                        text: t,
                        status: 'Pending'
                    })),
                    status: 'Pending',
                    createdAt: new Date(),
                    updatedAt: new Date()
                };
                mockWeeklyMissions.push(newMission);
            });
        });
        return newRoadmap;
    },
    // ----------------------------------------
    // Weekly Mission Operations
    // ----------------------------------------
    async getWeeklyMissions(userId) {
        if (!db_js_1.isSandboxMode && prismaClient) {
            const roadmap = await prismaClient.roadmap.findFirst({
                where: { userId },
                include: {
                    modules: {
                        include: {
                            weeklyMissions: true
                        }
                    }
                }
            });
            if (!roadmap)
                return [];
            const missions = [];
            roadmap.modules.forEach(m => {
                m.weeklyMissions.forEach(w => {
                    missions.push({
                        ...w,
                        monthNumber: m.monthNumber,
                        moduleTitle: m.title
                    });
                });
            });
            return missions.sort((a, b) => (a.monthNumber - b.monthNumber) || (a.weekNumber - b.weekNumber));
        }
        // In-memory simulation
        const activeGoal = mockCareerGoals.find(g => g.userId === userId);
        if (!activeGoal)
            return [];
        const roadmap = mockRoadmaps.find(r => r.goalId === activeGoal.id);
        if (!roadmap)
            return [];
        const modules = mockRoadmapModules.filter(m => m.roadmapId === roadmap.id);
        const missions = [];
        modules.forEach(m => {
            const wMissions = mockWeeklyMissions.filter(w => w.moduleId === m.id);
            wMissions.forEach(w => {
                missions.push({
                    ...w,
                    monthNumber: m.monthNumber,
                    moduleTitle: m.title
                });
            });
        });
        return missions.sort((a, b) => (a.monthNumber - b.monthNumber) || (a.weekNumber - b.weekNumber));
    },
    async updateMissionTaskStatus(userId, missionId, taskId, taskStatus) {
        if (!db_js_1.isSandboxMode && prismaClient) {
            // Get mission
            const mission = await prismaClient.weeklyMission.findUnique({
                where: { id: missionId }
            });
            if (!mission)
                throw new Error('Weekly mission not found.');
            const tasks = mission.tasks;
            const taskIndex = tasks.findIndex(t => t.id === taskId);
            if (taskIndex !== -1) {
                tasks[taskIndex].status = taskStatus;
            }
            // Re-evaluate mission status
            let missionStatus = 'Pending';
            const completedCount = tasks.filter(t => t.status === 'Completed').length;
            if (completedCount === tasks.length) {
                missionStatus = 'Completed';
            }
            else if (completedCount > 0 || tasks.some(t => t.status === 'In_Progress')) {
                missionStatus = 'In_Progress';
            }
            return prismaClient.weeklyMission.update({
                where: { id: missionId },
                data: {
                    tasks,
                    status: missionStatus
                }
            });
        }
        // In-memory simulation
        const mission = mockWeeklyMissions.find(w => w.id === missionId);
        if (!mission)
            throw new Error('Weekly mission not found.');
        const taskIndex = mission.tasks.findIndex((t) => t.id === taskId);
        if (taskIndex !== -1) {
            mission.tasks[taskIndex].status = taskStatus;
        }
        let missionStatus = 'Pending';
        const completedCount = mission.tasks.filter((t) => t.status === 'Completed').length;
        if (completedCount === mission.tasks.length) {
            missionStatus = 'Completed';
        }
        else if (completedCount > 0 || mission.tasks.some((t) => t.status === 'In_Progress')) {
            missionStatus = 'In_Progress';
        }
        mission.status = missionStatus;
        mission.updatedAt = new Date();
        return mission;
    },
    // ----------------------------------------
    // Project Recommendation Operations
    // ----------------------------------------
    async getProjectRecommendations(userId) {
        if (!db_js_1.isSandboxMode && prismaClient) {
            const activeGoal = await prismaClient.careerGoal.findFirst({
                where: { userId },
                orderBy: { createdAt: 'desc' }
            });
            if (!activeGoal)
                return [];
            return prismaClient.projectRecommendation.findMany({
                where: { goalId: activeGoal.id },
                orderBy: { createdAt: 'asc' }
            });
        }
        // In-memory simulation
        const activeGoal = mockCareerGoals.find(g => g.userId === userId);
        if (!activeGoal)
            return [];
        return mockProjectRecommendations.filter(p => p.goalId === activeGoal.id);
    },
    async saveProjectRecommendations(goalId, projects) {
        if (!db_js_1.isSandboxMode && prismaClient) {
            return prismaClient.projectRecommendation.createMany({
                data: projects.map(p => ({
                    goalId,
                    name: p.name,
                    description: p.description,
                    difficulty: p.difficulty,
                    skillsDemonstrated: p.skillsDemonstrated,
                    estimatedCompletionTime: p.estimatedCompletionTime,
                    status: 'Pending'
                }))
            });
        }
        // In-memory simulation
        projects.forEach(p => {
            mockProjectRecommendations.push({
                id: nextProjectId++,
                goalId,
                name: p.name,
                description: p.description,
                difficulty: p.difficulty,
                skillsDemonstrated: p.skillsDemonstrated,
                estimatedCompletionTime: p.estimatedCompletionTime,
                status: 'Pending',
                createdAt: new Date(),
                updatedAt: new Date()
            });
        });
    },
    async updateProjectStatus(userId, projectId, status) {
        if (!db_js_1.isSandboxMode && prismaClient) {
            return prismaClient.projectRecommendation.update({
                where: { id: projectId },
                data: { status }
            });
        }
        // In-memory simulation
        const project = mockProjectRecommendations.find(p => p.id === projectId);
        if (!project)
            throw new Error('Project recommendation not found.');
        project.status = status;
        project.updatedAt = new Date();
        return project;
    },
    // ----------------------------------------
    // Progress Calculations
    // ----------------------------------------
    async calculateUserProgress(userId) {
        const missions = await this.getWeeklyMissions(userId);
        const projects = await this.getProjectRecommendations(userId);
        let totalTasks = 0;
        let completedTasks = 0;
        missions.forEach(m => {
            const tasks = m.tasks;
            totalTasks += tasks.length;
            completedTasks += tasks.filter(t => t.status === 'Completed').length;
        });
        const totalProjects = projects.length;
        const completedProjects = projects.filter(p => p.status === 'Completed').length;
        const totalModules = Math.ceil(missions.length / 4) || 1; // 4 weeks per month approx
        const completedModules = missions.length > 0 ? Math.floor(missions.filter(m => m.status === 'Completed').length / 4) : 0;
        const progressData = {
            completedTasksCount: completedTasks,
            totalTasksCount: totalTasks,
            completedProjectsCount: completedProjects,
            totalProjectsCount: totalProjects,
            completedModulesCount: completedModules,
            totalModulesCount: totalModules,
            lastCalculatedAt: new Date()
        };
        if (!db_js_1.isSandboxMode && prismaClient) {
            const existingProgress = await prismaClient.userProgress.findFirst({
                where: { userId }
            });
            if (existingProgress) {
                return prismaClient.userProgress.update({
                    where: { id: existingProgress.id },
                    data: progressData
                });
            }
            else {
                return prismaClient.userProgress.create({
                    data: {
                        userId,
                        ...progressData
                    }
                });
            }
        }
        // In-memory simulation
        const idx = mockUserProgress.findIndex(p => p.userId === userId);
        const mockProgress = {
            id: idx !== -1 ? mockUserProgress[idx].id : nextProgressId++,
            userId,
            ...progressData
        };
        if (idx !== -1) {
            mockUserProgress[idx] = mockProgress;
        }
        else {
            mockUserProgress.push(mockProgress);
        }
        return mockProgress;
    },
    // ----------------------------------------
    // Job Readiness Score Operations
    // ----------------------------------------
    async getReadinessHistory(userId) {
        if (!db_js_1.isSandboxMode && prismaClient) {
            return prismaClient.jobReadinessScore.findMany({
                where: { userId },
                orderBy: { createdAt: 'asc' }
            });
        }
        return mockJobReadinessScores.filter(s => s.userId === userId).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    },
    async saveJobReadinessScore(userId, data) {
        if (!db_js_1.isSandboxMode && prismaClient) {
            return prismaClient.jobReadinessScore.create({
                data: {
                    userId,
                    overallScore: data.overallScore,
                    resumeScore: data.resumeScore,
                    skillScore: data.skillScore,
                    projectScore: data.projectScore,
                    interviewScore: data.interviewScore,
                    improvementSuggestions: data.improvementSuggestions
                }
            });
        }
        const newScore = {
            id: nextReadinessId++,
            userId,
            overallScore: data.overallScore,
            resumeScore: data.resumeScore,
            skillScore: data.skillScore,
            projectScore: data.projectScore,
            interviewScore: data.interviewScore,
            improvementSuggestions: data.improvementSuggestions,
            createdAt: new Date()
        };
        mockJobReadinessScores.push(newScore);
        return newScore;
    },
    // ----------------------------------------
    // Mock Interview Practice Integration
    // ----------------------------------------
    async getInterviewSession(userId, jobRole) {
        if (!db_js_1.isSandboxMode && prismaClient) {
            return prismaClient.interviewSession.findFirst({
                where: { userId, jobRole },
                orderBy: { createdAt: 'desc' }
            });
        }
        return mockInterviewSessions.find(s => s.userId === userId && s.jobRole === jobRole) || null;
    },
    async saveInterviewSession(userId, jobRole, question, answer, score, feedback, suggestedAnswer) {
        const sessionEntry = {
            question,
            answer,
            score,
            feedback,
            suggestedAnswer,
            date: new Date().toISOString()
        };
        if (!db_js_1.isSandboxMode && prismaClient) {
            const existingSession = await prismaClient.interviewSession.findFirst({
                where: { userId, jobRole }
            });
            if (existingSession) {
                const sessions = existingSession.sessions;
                sessions.push(sessionEntry);
                const completedQuestionsCount = sessions.length;
                const averageScore = Number((sessions.reduce((acc, s) => acc + s.score, 0) / completedQuestionsCount).toFixed(1));
                return prismaClient.interviewSession.update({
                    where: { id: existingSession.id },
                    data: {
                        completedQuestionsCount,
                        averageScore,
                        sessions
                    }
                });
            }
            else {
                return prismaClient.interviewSession.create({
                    data: {
                        userId,
                        jobRole,
                        completedQuestionsCount: 1,
                        averageScore: score,
                        sessions: [sessionEntry]
                    }
                });
            }
        }
        // In-memory simulation
        let existingSession = mockInterviewSessions.find(s => s.userId === userId && s.jobRole === jobRole);
        if (existingSession) {
            existingSession.sessions.push(sessionEntry);
            existingSession.completedQuestionsCount = existingSession.sessions.length;
            existingSession.averageScore = Number((existingSession.sessions.reduce((acc, s) => acc + s.score, 0) / existingSession.completedQuestionsCount).toFixed(1));
            return existingSession;
        }
        else {
            const newSession = {
                id: mockInterviewSessions.length + 1,
                userId,
                jobRole,
                completedQuestionsCount: 1,
                averageScore: score,
                sessions: [sessionEntry],
                createdAt: new Date()
            };
            mockInterviewSessions.push(newSession);
            return newSession;
        }
    }
};
