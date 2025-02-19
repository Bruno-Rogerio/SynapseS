// routes/authRoutes.ts
import express from 'express';
import { registerCompany, login, verifyToken } from '../controllers/authController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/register-company', registerCompany);
router.post('/login', login);
router.get('/verify', authenticateToken, verifyToken);

export default router;
