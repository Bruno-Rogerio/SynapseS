import { Router } from 'express';
import {
    createMission,
    getMissions,
    getMissionById,
    updateMission,
    updateTaskStatus,
    addTaskToMission,
    deleteMission,
    addCheckpointToMission,
    updateCheckpointStatus,
    deleteCheckpointFromMission
} from '../controllers/missionController';

export const router = Router();

router.post('/', createMission);
router.get('/', getMissions);
router.get('/:id', getMissionById);
router.put('/:id', updateMission);
router.put('/:missionId/tasks/:taskId', updateTaskStatus);
router.post('/:missionId/tasks', addTaskToMission);
router.delete('/:id', deleteMission);

// Endpoints para checkpoints
router.post('/:missionId/checkpoints', addCheckpointToMission);
router.put('/:missionId/checkpoints/:checkpointId', updateCheckpointStatus);
router.delete('/:missionId/checkpoints/:checkpointId', deleteCheckpointFromMission);

export default router;
