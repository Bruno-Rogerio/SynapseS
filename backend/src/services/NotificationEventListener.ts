// services/NotificationEventListener.ts
import eventService from './EventService';
import notificationService from './NotificationService';
import { EventTypes } from '../constants/EventTypes';

/**
 * Serviço que escuta eventos do sistema e gera notificações apropriadas
 */
class NotificationEventListener {
    /**
     * Inicializa todos os listeners de eventos
     */
    initialize(): void {
        console.log('[NotificationEventListener] Inicializando listeners de eventos...');

        // Registrar listeners para eventos de fórum
        this.setupForumEventListeners();

        // Registrar listeners para eventos de tarefas
        this.setupTaskEventListeners();

        // Registrar listeners para eventos do sistema
        this.setupSystemEventListeners();

        // Registrar listeners para eventos de chat
        this.setupChatEventListeners();

        console.log('[NotificationEventListener] Todos os listeners foram registrados');
    }

    /**
     * Configura listeners para eventos relacionados a fóruns
     */
    private setupForumEventListeners(): void {
        // Escutar evento de nova mensagem em fórum
        eventService.on(EventTypes.FORUM.MESSAGE_CREATED, async (data) => {
            const {
                forumId,
                messageId,
                senderId,
                forumTitle,
                messageContent,
                recipients
            } = data;

            // Para cada destinatário, criar uma notificação
            for (const recipientId of recipients) {
                // Não notificar o próprio autor
                if (recipientId !== senderId) {
                    // Usar serviço de notificação para criar a notificação
                    await notificationService.notifyNewForumMessage(
                        forumId,
                        messageId,
                        recipientId,
                        senderId,
                        forumTitle,
                        messageContent.substring(0, 100) // Preview da mensagem
                    );
                }
            }
        });

        // Escutar evento de menção de usuário
        eventService.on(EventTypes.FORUM.USER_MENTIONED, async (data) => {
            const {
                forumId,
                messageId,
                mentionedUserId,
                senderId,
                forumTitle,
                messageContent
            } = data;

            // Notificar usuário mencionado
            await notificationService.notifyForumMention(
                forumId,
                messageId,
                mentionedUserId,
                senderId,
                forumTitle,
                messageContent.substring(0, 100)
            );
        });

        // Escutar evento de resposta a mensagem
        eventService.on(EventTypes.FORUM.MESSAGE_REPLIED, async (data) => {
            const {
                forumId,
                messageId,
                originalAuthorId,
                senderId,
                forumTitle,
                messageContent
            } = data;

            // Não notificar se a pessoa respondeu a si própria
            if (originalAuthorId !== senderId) {
                await notificationService.notifyForumReply(
                    forumId,
                    messageId,
                    originalAuthorId,
                    senderId,
                    forumTitle,
                    messageContent.substring(0, 100)
                );
            }
        });
    }

    /**
     * Configura listeners para eventos relacionados a tarefas
     */
    private setupTaskEventListeners(): void {
        // Escutar evento de tarefa atribuída
        eventService.on(EventTypes.TASK.ASSIGNED, async (data) => {
            const {
                taskId,
                assigneeId,
                assignerId,
                taskTitle,
                taskDescription
            } = data;

            // Notificar pessoa que recebeu a tarefa
            await notificationService.notifyTaskAssigned(
                taskId,
                assigneeId,
                assignerId,
                taskTitle,
                taskDescription
            );
        });

        // Outros listeners de eventos de tarefas...
    }

    /**
     * Configura listeners para eventos relacionados ao chat
     */
    private setupChatEventListeners(): void {
        // Escutar evento de nova mensagem no chat
        eventService.on(EventTypes.CHAT.MESSAGE_CREATED, async (data) => {
            const {
                missionId,
                messageId,
                senderId,
                senderUsername,
                missionName,
                messageContent,
                recipients
            } = data;

            // Se houver uma lista de destinatários específicos, envie para cada um deles
            if (recipients && Array.isArray(recipients) && recipients.length > 0) {
                for (const recipientId of recipients) {
                    // Não notificar o próprio autor
                    if (recipientId !== senderId) {
                        // Criar notificação para nova mensagem de chat
                        await notificationService.createNotification('chat_message', {
                            recipient: recipientId,
                            sender: senderId,
                            title: `Nova mensagem em ${missionName}`,
                            body: `${senderUsername}: ${messageContent.substring(0, 100)}${messageContent.length > 100 ? '...' : ''}`,
                            link: `/missions/${missionId}/chat?message=${messageId}`,
                            references: {
                                mission: missionId,
                                message: messageId
                            }
                        });
                    }
                }
            }
        });

        // Escutar evento de menção de usuário no chat
        eventService.on(EventTypes.CHAT.MENTION_USER, async (data) => {
            const {
                missionId,
                messageId,
                mentionedUserId,
                senderId,
                senderUsername,
                missionName,
                messageContent
            } = data;

            // Criar notificação para menção em chat
            await notificationService.createNotification('chat_mention', {
                recipient: mentionedUserId,
                sender: senderId,
                title: `Você foi mencionado em ${missionName}`,
                body: `${senderUsername}: ${messageContent.substring(0, 100)}${messageContent.length > 100 ? '...' : ''}`,
                link: `/missions/${missionId}/chat?message=${messageId}`,
                references: {
                    mission: missionId,
                    message: messageId
                }
            });
        });

        // Escutar evento de resposta a mensagem no chat
        eventService.on(EventTypes.CHAT.MESSAGE_REPLIED, async (data) => {
            const {
                missionId,
                messageId,
                originalAuthorId,
                senderId,
                senderUsername,
                missionName,
                messageContent
            } = data;

            // Não notificar se a pessoa respondeu a si própria
            if (originalAuthorId !== senderId) {
                // Criar notificação para resposta em chat
                await notificationService.createNotification('chat_reply', {
                    recipient: originalAuthorId,
                    sender: senderId,
                    title: `${senderUsername} respondeu à sua mensagem em ${missionName}`,
                    body: `${messageContent.substring(0, 100)}${messageContent.length > 100 ? '...' : ''}`,
                    link: `/missions/${missionId}/chat?message=${messageId}`,
                    references: {
                        mission: missionId,
                        message: messageId
                    }
                });
            }
        });
    }

    /**
     * Configura listeners para eventos do sistema
     */
    private setupSystemEventListeners(): void {
        // Escutar anúncios do sistema
        eventService.on(EventTypes.SYSTEM.ANNOUNCEMENT, async (data) => {
            const {
                title,
                body,
                link,
                recipients
            } = data;

            // Enviar notificação para todos os destinatários
            for (const recipientId of recipients) {
                await notificationService.notifySystem(
                    recipientId,
                    title,
                    body,
                    link
                );
            }
        });

        // Outros listeners de eventos do sistema...
    }
}

// Exporta uma instância única
const notificationEventListener = new NotificationEventListener();
export default notificationEventListener;
