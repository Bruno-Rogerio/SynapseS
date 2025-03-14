// src/routes/missionRoutes.ts
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
    deleteCheckpointFromMission,
    getMissionsByMember
} from '../controllers/missionController';
import { authenticateToken } from '../middleware/authMiddleware';
import {
    hasPermission,
    isMissionLeaderOrHasPermission,
    sameCompanyOnly
} from '../middleware/permissionMiddleware';

export const router = Router();

// Constantes para permissões de missão
const MISSION_PERMISSIONS = {
    CREATE: 'mission:create',
    VIEW: 'mission:view',
    EDIT: 'mission:edit',
    DELETE: 'mission:delete',
    MANAGE_ALL: 'mission:manage_all'
};

/**
 * @route POST /api/missions
 * @desc Cria uma nova missão
 * @access Private - Requer permissão para criar missão
 */
router.post(
    '/',
    authenticateToken,
    hasPermission(MISSION_PERMISSIONS.CREATE),
    createMission
);

/**
 * @route GET /api/missions
 * @desc Retorna todas as missões da empresa do usuário
 * @access Private - Usuários autenticados da mesma empresa
 */
router.get(
    '/',
    authenticateToken,
    getMissions
);

/**
 * @route GET /api/missions/member/:memberId
 * @desc Retorna todas as missões associadas a um membro específico
 * @access Private - Usuários autenticados da mesma empresa
 */
router.get(
    '/member/:memberId',
    authenticateToken,
    getMissionsByMember
);

/**
 * @route GET /api/missions/:id
 * @desc Retorna uma missão específica
 * @access Private - Usuários autenticados da mesma empresa
 */
router.get(
    '/:id',
    authenticateToken,
    sameCompanyOnly('mission', 'id'),
    getMissionById
);

/**
 * @route PUT /api/missions/:id
 * @desc Atualiza uma missão
 * @access Private - Líder da missão ou com permissão de edição
 */
router.put(
    '/:id',
    authenticateToken,
    sameCompanyOnly('mission', 'id'),
    isMissionLeaderOrHasPermission(MISSION_PERMISSIONS.EDIT),
    updateMission
);

/**
 * @route DELETE /api/missions/:id
 * @desc Remove uma missão
 * @access Private - Líder da missão ou com permissão de exclusão
 */
router.delete(
    '/:id',
    authenticateToken,
    sameCompanyOnly('mission', 'id'),
    isMissionLeaderOrHasPermission(MISSION_PERMISSIONS.DELETE),
    deleteMission
);

// ----- ENDPOINTS PARA TAREFAS -----

/**
 * @route POST /api/missions/:missionId/tasks
 * @desc Adiciona uma tarefa a uma missão
 * @access Private - Líder da missão ou com permissão de edição
 */
router.post(
    '/:missionId/tasks',
    authenticateToken,
    sameCompanyOnly('mission', 'missionId'),
    isMissionLeaderOrHasPermission(MISSION_PERMISSIONS.EDIT),
    addTaskToMission
);

/**
 * @route PUT /api/missions/:missionId/tasks/:taskId
 * @desc Atualiza o status de uma tarefa
 * @access Private - Líder da missão ou com permissão de edição
 */
router.put(
    '/:missionId/tasks/:taskId',
    authenticateToken,
    sameCompanyOnly('mission', 'missionId'),
    isMissionLeaderOrHasPermission(MISSION_PERMISSIONS.EDIT),
    updateTaskStatus
);

// ----- ENDPOINTS PARA CHECKPOINTS -----

/**
 * @route POST /api/missions/:missionId/checkpoints
 * @desc Adiciona um checkpoint a uma missão
 * @access Private - Líder da missão ou com permissão de edição
 */
router.post(
    '/:missionId/checkpoints',
    authenticateToken,
    sameCompanyOnly('mission', 'missionId'),
    isMissionLeaderOrHasPermission(MISSION_PERMISSIONS.EDIT),
    addCheckpointToMission
);

/**
 * @route PUT /api/missions/:missionId/checkpoints/:checkpointId
 * @desc Atualiza o status de um checkpoint
 * @access Private - Líder da missão ou com permissão de edição
 */
router.put(
    '/:missionId/checkpoints/:checkpointId',
    authenticateToken,
    sameCompanyOnly('mission', 'missionId'),
    isMissionLeaderOrHasPermission(MISSION_PERMISSIONS.EDIT),
    updateCheckpointStatus
);

/**
 * @route DELETE /api/missions/:missionId/checkpoints/:checkpointId
 * @desc Remove um checkpoint de uma missão
 * @access Private - Líder da missão ou com permissão de edição
 */
router.delete(
    '/:missionId/checkpoints/:checkpointId',
    authenticateToken,
    sameCompanyOnly('mission', 'missionId'),
    isMissionLeaderOrHasPermission(MISSION_PERMISSIONS.EDIT),
    deleteCheckpointFromMission
);

export default router;
