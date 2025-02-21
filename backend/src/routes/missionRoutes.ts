import { Router } from 'express';
import {
    createMission,
    getMissions,
    getMissionById,
    updateTaskStatus,
    addTaskToMission,
    deleteMission  // Certifique-se de importar deleteMission
} from '../controllers/missionController';

export const router = Router();

router.post('/', createMission);
router.get('/', getMissions);
router.get('/:id', getMissionById);
router.put('/:missionId/tasks/:taskId', updateTaskStatus);
router.post('/:missionId/tasks', addTaskToMission);
router.delete('/:id', deleteMission);  // Adicione essa linha

export default router;
