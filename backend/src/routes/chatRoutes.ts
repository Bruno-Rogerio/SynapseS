import { Router } from 'express';
import { getChatMessages, postChatMessage, reactToChatMessage, getChatMessageById } from '../controllers/chatController';

const router = Router();

// Retorna o histórico de mensagens para uma missão
router.get('/:missionId', getChatMessages);

// Cria uma nova mensagem de chat para uma missão
router.post('/:missionId', postChatMessage);

// Atualiza as reações de uma mensagem
router.patch('/:missionId/:messageId/react', reactToChatMessage);

// Busca uma mensagem específica por ID
router.get('/message/:messageId', getChatMessageById);

export default router;
