"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const analysisController_js_1 = require("../controllers/analysisController.js");
const authMiddleware_js_1 = require("../middleware/authMiddleware.js");
const router = (0, express_1.Router)();
// Configure in-memory upload buffering for performance
const upload = (0, multer_1.default)({
    storage: multer_1.default.memoryStorage(),
    limits: {
        fileSize: 5242880 // 5MB bytes limit
    }
});
// Guarded Analysis Routes
router.post('/analyze', authMiddleware_js_1.authenticateToken, upload.single('resume'), analysisController_js_1.analyzeResume);
router.get('/history', authMiddleware_js_1.authenticateToken, analysisController_js_1.getHistory);
router.get('/history/:id', authMiddleware_js_1.authenticateToken, analysisController_js_1.getHistoryById);
router.delete('/history/:id', authMiddleware_js_1.authenticateToken, analysisController_js_1.deleteHistory);
exports.default = router;
