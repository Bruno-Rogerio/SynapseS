import { Router } from 'express';
import {
    createMission,
    getMissions,
    getMissionById,
    updateTaskStatus,
    addTaskToMission
} from '../controllers/missionController';

export const router = Router();

router.post('/', createMission);
router.get('/', getMissions);
router.get('/:id', getMissionById);
router.put('/:missionId/tasks/:taskId', updateTaskStatus);
router.post('/:missionId/tasks', addTaskToMission);

export default router; // Mantendo a exportação default também
