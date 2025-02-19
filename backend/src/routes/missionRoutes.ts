import express from 'express';
import { createMission, getMissions, updateMission, deleteMission } from '../controllers/missionController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', authMiddleware, createMission);
router.get('/', authMiddleware, getMissions);
router.put('/:missionId', authMiddleware, updateMission);
router.delete('/:missionId', authMiddleware, deleteMission);

export default router;
