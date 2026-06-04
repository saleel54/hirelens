"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authMiddleware_js_1 = require("../middleware/authMiddleware.js");
const copilotController_js_1 = require("../controllers/copilotController.js");
const router = (0, express_1.Router)();
// Secure all Career Copilot paths using JWT Auth
router.use(authMiddleware_js_1.authenticateToken);
router.post('/goal', copilotController_js_1.setGoal);
router.get('/goal', copilotController_js_1.getGoal);
router.get('/missions', copilotController_js_1.getMissions);
router.put('/missions/:missionId/tasks/:taskId', copilotController_js_1.updateTaskStatus);
router.get('/projects', copilotController_js_1.getProjects);
router.put('/projects/:projectId', copilotController_js_1.updateProjectStatus);
router.get('/gps', copilotController_js_1.getGPS);
router.get('/readiness', copilotController_js_1.getReadiness);
router.post('/adaptive', copilotController_js_1.triggerAdaptiveRecalculate);
exports.default = router;
