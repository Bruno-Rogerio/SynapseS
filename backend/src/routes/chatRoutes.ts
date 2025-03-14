// routes/chatRoutes.ts
import { Router } from 'express';
import {
    getChatMessages,
    postChatMessage,
    reactToChatMessage,
    getChatMessageById,
    deleteChatMessage
} from '../controllers/chatController';
import { authenticateToken } from '../middleware/authMiddleware';
import { hasPermission, isChatMessageOwnerOrHasPermission, sameCompanyOnly } from '../middleware/permissionMiddleware';

const router = Router();

/**
 * @route GET /api/chat/:missionId
 * @desc Retorna o histórico de mensagens para uma missão
 * @access Private - Somente usuários autenticados da mesma empresa
 */
router.get(
    '/:missionId',
    authenticateToken,
    sameCompanyOnly('mission', 'missionId'),
    getChatMessages
);

/**
 * @route POST /api/chat/:missionId
 * @desc Cria uma nova mensagem de chat para uma missão
 * @access Private - Somente usuários autenticados da mesma empresa
 */
router.post(
    '/:missionId',
    authenticateToken,
    sameCompanyOnly('mission', 'missionId'),
    postChatMessage
);

/**
 * @route PATCH /api/chat/:missionId/:messageId/react
 * @desc Atualiza as reações de uma mensagem
 * @access Private - Somente usuários autenticados da mesma empresa
 */
router.patch(
    '/:missionId/:messageId/react',
    authenticateToken,
    sameCompanyOnly('mission', 'missionId'),
    reactToChatMessage
);

/**
 * @route GET /api/chat/message/:messageId
 * @desc Busca uma mensagem específica por ID
 * @access Private - Somente usuários autenticados da mesma empresa
 */
router.get(
    '/message/:messageId',
    authenticateToken,
    sameCompanyOnly('chat', 'messageId'),
    getChatMessageById
);

/**
 * @route DELETE /api/chat/message/:messageId
 * @desc Exclui uma mensagem de chat (somente autor ou admin)
 * @access Private - Somente autor da mensagem ou administrador
 */
router.delete(
    '/message/:messageId',
    authenticateToken,
    isChatMessageOwnerOrHasPermission('chat:delete'),
    deleteChatMessage
);

export default router;
