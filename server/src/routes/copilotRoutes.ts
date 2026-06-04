import { Router } from 'express';
import { authenticateToken } from '../middleware/authMiddleware.js';
import {
  setGoal,
  getGoal,
  getMissions,
  updateTaskStatus,
  getProjects,
  updateProjectStatus,
  getGPS,
  getReadiness,
  triggerAdaptiveRecalculate
} from '../controllers/copilotController.js';

const router = Router();

// Secure all Career Copilot paths using JWT Auth
router.use(authenticateToken);

router.post('/goal', setGoal);
router.get('/goal', getGoal);
router.get('/missions', getMissions);
router.put('/missions/:missionId/tasks/:taskId', updateTaskStatus);
router.get('/projects', getProjects);
router.put('/projects/:projectId', updateProjectStatus);
router.get('/gps', getGPS);
router.get('/readiness', getReadiness);
router.post('/adaptive', triggerAdaptiveRecalculate);

export default router;
