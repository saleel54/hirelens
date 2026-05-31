import { Router } from 'express';
import multer from 'multer';
import { 
  analyzeResume, 
  getHistory, 
  getHistoryById, 
  deleteHistory,
  evaluateAnswer
} from '../controllers/analysisController.js';
import { authenticateToken } from '../middleware/authMiddleware.js';

const router = Router();

// Configure in-memory upload buffering for performance
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5242880 // 5MB bytes limit
  }
});

// Guarded Analysis Routes
router.post('/analyze', authenticateToken as any, upload.single('resume'), analyzeResume as any);
router.get('/history', authenticateToken as any, getHistory as any);
router.get('/history/:id', authenticateToken as any, getHistoryById as any);
router.delete('/history/:id', authenticateToken as any, deleteHistory as any);
router.post('/evaluate-answer', authenticateToken as any, evaluateAnswer as any);

export default router;
