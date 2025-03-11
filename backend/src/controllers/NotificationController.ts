// controllers/NotificationController.ts
import { Request, Response } from 'express';
import mongoose from 'mongoose';
import notificationService from '../services/NotificationService';
import { DecodedToken } from '../middleware/authMiddleware';

class NotificationController {
    // Obter notificações do usuário atual
    async getUserNotifications(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user?.userId) {
                res.status(401).json({ message: 'Usuário não autenticado' });
                return;
            }

            const userId = req.user.userId;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const unreadOnly = req.query.unreadOnly === 'true';

            const result = await notificationService.getUserNotifications(
                userId,
                page,
                limit,
                unreadOnly
            );

            res.json({
                notifications: result.notifications,
                pagination: {
                    total: result.total,
                    page,
                    pages: Math.ceil(result.total / limit)
                },
                unreadCount: result.unreadCount
            });
        } catch (error) {
            console.error('Error fetching notifications:', error);
            res.status(500).json({ message: 'Erro ao buscar notificações' });
        }
    }

    // Obter contagem de notificações não lidas
    async getUnreadCount(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user?.userId) {
                res.status(401).json({ message: 'Usuário não autenticado' });
                return;
            }

            const userId = req.user.userId;
            const { unreadCount } = await notificationService.getUserNotifications(
                userId,
                1,
                0,
                true
            );

            res.json({ unreadCount });
        } catch (error) {
            console.error('Error getting unread count:', error);
            res.status(500).json({ message: 'Erro ao buscar contagem de notificações não lidas' });
        }
    }

    // Marcar uma notificação como lida
    async markAsRead(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user?.userId) {
                res.status(401).json({ message: 'Usuário não autenticado' });
                return;
            }

            const userId = req.user.userId;
            const notificationId = req.params.id;

            if (!mongoose.Types.ObjectId.isValid(notificationId)) {
                res.status(400).json({ message: 'ID de notificação inválido' });
                return;
            }

            const success = await notificationService.markAsRead(notificationId, userId);

            if (success) {
                res.json({ success: true, message: 'Notificação marcada como lida' });
            } else {
                res.status(404).json({ message: 'Notificação não encontrada' });
            }
        } catch (error) {
            console.error('Error marking notification as read:', error);
            res.status(500).json({ message: 'Erro ao marcar notificação como lida' });
        }
    }

    // Marcar todas as notificações como lidas
    async markAllAsRead(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user?.userId) {
                res.status(401).json({ message: 'Usuário não autenticado' });
                return;
            }

            const userId = req.user.userId;
            const count = await notificationService.markAllAsRead(userId);

            res.json({
                success: true,
                message: `${count} notificações marcadas como lidas`
            });
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            res.status(500).json({ message: 'Erro ao marcar notificações como lidas' });
        }
    }

    // Excluir uma notificação
    async deleteNotification(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user?.userId) {
                res.status(401).json({ message: 'Usuário não autenticado' });
                return;
            }

            const userId = req.user.userId;
            const notificationId = req.params.id;

            if (!mongoose.Types.ObjectId.isValid(notificationId)) {
                res.status(400).json({ message: 'ID de notificação inválido' });
                return;
            }

            const success = await notificationService.deleteNotification(notificationId, userId);

            if (success) {
                res.json({ success: true, message: 'Notificação excluída com sucesso' });
            } else {
                res.status(404).json({ message: 'Notificação não encontrada' });
            }
        } catch (error) {
            console.error('Error deleting notification:', error);
            res.status(500).json({ message: 'Erro ao excluir notificação' });
        }
    }

    // Criar uma notificação de teste (útil para desenvolvimento)
    async createTestNotification(req: Request, res: Response): Promise<void> {
        try {
            if (!req.user?.userId) {
                res.status(401).json({ message: 'Usuário não autenticado' });
                return;
            }

            // Verifica se é admin para criar notificações de teste
            if (req.user.role !== 'admin') {
                res.status(403).json({ message: 'Apenas administradores podem criar notificações de teste' });
                return;
            }

            const userId = req.user.userId;
            const { type, title, body, link, recipientId } = req.body;

            // O recipientId é opcional, se não for fornecido, usa o próprio usuário
            const recipient = recipientId || userId;

            if (!type || !title || !body) {
                res.status(400).json({ message: 'Tipo, título e corpo são obrigatórios' });
                return;
            }

            const notification = await notificationService.createNotification(type, {
                recipient,
                sender: userId,
                title,
                body,
                link
            });

            if (notification) {
                res.status(201).json({
                    success: true,
                    message: 'Notificação de teste criada com sucesso',
                    notification
                });
            } else {
                res.status(400).json({ message: 'Erro ao criar notificação de teste' });
            }
        } catch (error) {
            console.error('Error creating test notification:', error);
            res.status(500).json({ message: 'Erro ao criar notificação de teste' });
        }
    }
}

export default new NotificationController();
