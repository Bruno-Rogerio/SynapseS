// routes/notificationRoutes.ts
import express from 'express';
import NotificationController from '../controllers/NotificationController';
import { authMiddleware, authorizeAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Todas as rotas de notificação requerem autenticação
router.use(authMiddleware);

// Obter notificações do usuário
router.get('/', NotificationController.getUserNotifications);

// Obter apenas a contagem de não lidas (mais leve)
router.get('/unread-count', NotificationController.getUnreadCount);

// Marcar uma notificação específica como lida
router.put('/:id/read', NotificationController.markAsRead);

// Marcar todas as notificações como lidas
router.put('/read-all', NotificationController.markAllAsRead);

// Excluir uma notificação
router.delete('/:id', NotificationController.deleteNotification);

// Criar uma notificação de teste (apenas para administradores)
router.post('/test', authorizeAdmin, NotificationController.createTestNotification);

export default router;
