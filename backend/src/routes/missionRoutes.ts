import express from 'express';
import {
    createMission,
    getMissions,
    getMissionById,
    updateMission,
    deleteMission
} from '../controllers/missionController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

// Create a new mission
router.post('/', authMiddleware, createMission);

// Get all missions for the authenticated user
router.get('/', authMiddleware, getMissions);

// Get a specific mission by ID
router.get('/:missionId', authMiddleware, getMissionById);

// Update a specific mission
router.put('/:missionId', authMiddleware, updateMission);

// Delete a specific mission
router.delete('/:missionId', authMiddleware, deleteMission);

export default router;
