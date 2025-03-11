// services/NotificationService.ts
import { Server as SocketServer, Namespace } from 'socket.io';
import mongoose from 'mongoose';
import Notification, { NotificationType, INotification } from '../models/NotificationModel';
import UserPreference, { IUserPreference } from '../models/UserPreferenceModel';

export interface NotificationOptions {
    recipient: mongoose.Types.ObjectId | string;
    sender?: mongoose.Types.ObjectId | string;
    title: string;
    body: string;
    link?: string;
    references?: {
        forum?: mongoose.Types.ObjectId | string;
        message?: mongoose.Types.ObjectId | string;
        task?: mongoose.Types.ObjectId | string;
        mission?: mongoose.Types.ObjectId | string; // Nova referência para missões
        [key: string]: mongoose.Types.ObjectId | string | undefined;
    };
    metadata?: Record<string, any>;
}

class NotificationService {
    // Modificado para aceitar tanto Server quanto Namespace
    private io: SocketServer | Namespace | null = null;

    // Método para inicializar com socket.io (chamado na inicialização do app)
    // Modificado para aceitar tanto Server quanto Namespace
    setSocketServer(io: SocketServer | Namespace) {
        this.io = io;
    }

    // Método principal para criar e enviar notificação
    async createNotification(
        type: NotificationType,
        options: NotificationOptions
    ): Promise<INotification | null> {
        try {
            // Verificar preferências do usuário (se ele deseja receber este tipo de notificação)
            const shouldSend = await this.checkUserPreference(options.recipient, type);

            // Se o usuário desabilitou este tipo de notificação, não cria
            if (!shouldSend) {
                console.log(`Notification skipped: User ${options.recipient} opted out of ${type} notifications`);
                return null;
            }

            // Criar a notificação no banco de dados
            const notification = new Notification({
                type,
                recipient: options.recipient,
                sender: options.sender,
                title: options.title,
                body: options.body,
                link: options.link,
                references: options.references || {},
                metadata: options.metadata || {},
                read: false,
                createdAt: new Date()
            });

            await notification.save();

            // Enviar via socket.io se disponível e o usuário estiver online
            this.sendRealTimeNotification(notification);

            return notification;
        } catch (error) {
            console.error('Error creating notification:', error);
            return null;
        }
    }

    // Verificar preferências do usuário
    private async checkUserPreference(
        userId: mongoose.Types.ObjectId | string,
        type: NotificationType
    ): Promise<boolean> {
        try {
            // Buscar preferências do usuário
            const userPref = await UserPreference.findOne({ user: userId });

            // Se não tem preferências específicas, assume true
            if (!userPref) return true;

            // Verificar se o usuário desativou notificações globais
            if (userPref.notificationsEnabled === false) return false;

            // Verificar configuração específica para este tipo
            const typeSetting = userPref.notificationSettings?.get(type);
            return typeSetting !== false; // undefined ou true significa habilitado
        } catch (error) {
            console.error('Error checking user notification preferences:', error);
            return true; // Em caso de erro, assume que o usuário quer receber
        }
    }

    // Enviar notificação em tempo real
    private sendRealTimeNotification(notification: INotification): void {
        if (this.io) {
            const recipientRoom = `user:${notification.recipient}`;
            this.io.to(recipientRoom).emit('notification', {
                _id: notification._id,
                type: notification.type,
                title: notification.title,
                body: notification.body,
                link: notification.link,
                createdAt: notification.createdAt
            });
        }
    }

    // ------ MÉTODOS ESPECÍFICOS POR TIPO (FÓRUM) ------

    // Notificação de nova mensagem em um fórum
    async notifyNewForumMessage(
        forumId: mongoose.Types.ObjectId | string,
        messageId: mongoose.Types.ObjectId | string,
        recipientId: mongoose.Types.ObjectId | string,
        senderId: mongoose.Types.ObjectId | string,
        forumTitle: string,
        messagePreview: string
    ): Promise<INotification | null> {
        return this.createNotification('forum_message', {
            recipient: recipientId,
            sender: senderId,
            title: `Nova mensagem em "${forumTitle}"`,
            body: messagePreview,
            link: `/forum/${forumId}/message/${messageId}`,
            references: {
                forum: forumId,
                message: messageId
            }
        });
    }

    // Notificação de menção em um fórum
    async notifyForumMention(
        forumId: mongoose.Types.ObjectId | string,
        messageId: mongoose.Types.ObjectId | string,
        recipientId: mongoose.Types.ObjectId | string,
        senderId: mongoose.Types.ObjectId | string,
        forumTitle: string,
        messagePreview: string
    ): Promise<INotification | null> {
        return this.createNotification('forum_mention', {
            recipient: recipientId,
            sender: senderId,
            title: `Você foi mencionado em "${forumTitle}"`,
            body: messagePreview,
            link: `/forum/${forumId}/message/${messageId}`,
            references: {
                forum: forumId,
                message: messageId
            }
        });
    }

    // Notificação de resposta a uma mensagem
    async notifyForumReply(
        forumId: mongoose.Types.ObjectId | string,
        messageId: mongoose.Types.ObjectId | string,
        recipientId: mongoose.Types.ObjectId | string,
        senderId: mongoose.Types.ObjectId | string,
        forumTitle: string,
        messagePreview: string
    ): Promise<INotification | null> {
        return this.createNotification('forum_reply', {
            recipient: recipientId,
            sender: senderId,
            title: `Nova resposta em "${forumTitle}"`,
            body: messagePreview,
            link: `/forum/${forumId}/message/${messageId}`,
            references: {
                forum: forumId,
                message: messageId
            }
        });
    }

    // ------ MÉTODOS ESPECÍFICOS POR TIPO (TAREFAS) ------

    // Notificação de tarefa atribuída
    async notifyTaskAssigned(
        taskId: mongoose.Types.ObjectId | string,
        recipientId: mongoose.Types.ObjectId | string,
        assignerId: mongoose.Types.ObjectId | string,
        taskTitle: string,
        taskDescription: string
    ): Promise<INotification | null> {
        return this.createNotification('task_assigned', {
            recipient: recipientId,
            sender: assignerId,
            title: 'Nova tarefa atribuída a você',
            body: `${taskTitle}: ${taskDescription}`,
            link: `/tasks/${taskId}`,
            references: {
                task: taskId
            }
        });
    }

    // ------ MÉTODOS ESPECÍFICOS POR TIPO (CHAT) ------

    // Notificação de nova mensagem em um chat
    async notifyChatMessage(
        missionId: mongoose.Types.ObjectId | string,
        messageId: mongoose.Types.ObjectId | string,
        recipientId: mongoose.Types.ObjectId | string,
        senderId: mongoose.Types.ObjectId | string,
        senderUsername: string,
        missionName: string,
        messagePreview: string
    ): Promise<INotification | null> {
        return this.createNotification('chat_message', {
            recipient: recipientId,
            sender: senderId,
            title: `Nova mensagem em ${missionName}`,
            body: `${senderUsername}: ${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? '...' : ''}`,
            link: `/missions/${missionId}/chat?message=${messageId}`,
            references: {
                mission: missionId,
                message: messageId
            }
        });
    }

    // Notificação de menção em um chat
    async notifyChatMention(
        missionId: mongoose.Types.ObjectId | string,
        messageId: mongoose.Types.ObjectId | string,
        recipientId: mongoose.Types.ObjectId | string,
        senderId: mongoose.Types.ObjectId | string,
        senderUsername: string,
        missionName: string,
        messagePreview: string
    ): Promise<INotification | null> {
        return this.createNotification('chat_mention', {
            recipient: recipientId,
            sender: senderId,
            title: `Você foi mencionado em ${missionName}`,
            body: `${senderUsername}: ${messagePreview.substring(0, 100)}${messagePreview.length > 100 ? '...' : ''}`,
            link: `/missions/${missionId}/chat?message=${messageId}`,
            references: {
                mission: missionId,
                message: messageId
            }
        });
    }

    // Notificação de resposta a uma mensagem de chat
    async notifyChatReply(
        missionId: mongoose.Types.ObjectId | string,
        messageId: mongoose.Types.ObjectId | string,
        recipientId: mongoose.Types.ObjectId | string,
        senderId: mongoose.Types.ObjectId | string,
        senderUsername: string,
        missionName: string,
        messagePreview: string
    ): Promise<INotification | null> {
        return this.createNotification('chat_reply', {
            recipient: recipientId,
            sender: senderId,
            title: `${senderUsername} respondeu à sua mensagem em ${missionName}`,
            body: messagePreview.substring(0, 100) + (messagePreview.length > 100 ? '...' : ''),
            link: `/missions/${missionId}/chat?message=${messageId}`,
            references: {
                mission: missionId,
                message: messageId
            }
        });
    }

    // ------ MÉTODOS GERAIS ------

    // Notificação do sistema
    async notifySystem(
        recipientId: mongoose.Types.ObjectId | string,
        title: string,
        body: string,
        link?: string
    ): Promise<INotification | null> {
        return this.createNotification('system', {
            recipient: recipientId,
            title,
            body,
            link
        });
    }

    // ------ MÉTODOS PARA GERENCIAR NOTIFICAÇÕES ------

    // Marcar notificação como lida
    async markAsRead(
        notificationId: mongoose.Types.ObjectId | string,
        userId: mongoose.Types.ObjectId | string
    ): Promise<boolean> {
        try {
            const notification = await Notification.findOne({
                _id: notificationId,
                recipient: userId
            });

            if (!notification) return false;

            await notification.markAsRead();
            return true;
        } catch (error) {
            console.error('Error marking notification as read:', error);
            return false;
        }
    }

    // Marcar todas as notificações como lidas
    async markAllAsRead(userId: mongoose.Types.ObjectId | string): Promise<number> {
        try {
            const result = await Notification.updateMany(
                { recipient: userId, read: false },
                { read: true, readAt: new Date() }
            );

            return result.modifiedCount;
        } catch (error) {
            console.error('Error marking all notifications as read:', error);
            return 0;
        }
    }

    // Obter notificações de um usuário
    async getUserNotifications(
        userId: mongoose.Types.ObjectId | string,
        page: number = 1,
        limit: number = 20,
        unreadOnly: boolean = false
    ): Promise<{
        notifications: INotification[];
        total: number;
        unreadCount: number;
    }> {
        try {
            // Define o tipo correto para permitir propriedades dinâmicas
            const query: { recipient: mongoose.Types.ObjectId | string;[key: string]: any } = { recipient: userId };
            if (unreadOnly) {
                query.read = false;
            }

            const [notifications, total, unreadCount] = await Promise.all([
                Notification.find(query)
                    .sort({ createdAt: -1 })
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .populate('sender', 'username fullName avatar')
                    .lean(),
                Notification.countDocuments(query),
                Notification.countDocuments({ recipient: userId, read: false })
            ]);

            return { notifications, total, unreadCount };
        } catch (error) {
            console.error('Error getting user notifications:', error);
            return { notifications: [], total: 0, unreadCount: 0 };
        }
    }

    // Excluir uma notificação
    async deleteNotification(
        notificationId: mongoose.Types.ObjectId | string,
        userId: mongoose.Types.ObjectId | string
    ): Promise<boolean> {
        try {
            const result = await Notification.deleteOne({
                _id: notificationId,
                recipient: userId
            });

            return result.deletedCount > 0;
        } catch (error) {
            console.error('Error deleting notification:', error);
            return false;
        }
    }
}

// Singleton - Exporta uma instância única para ser usada em toda a aplicação
export const notificationService = new NotificationService();
export default notificationService;
