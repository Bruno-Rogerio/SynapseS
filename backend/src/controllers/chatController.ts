// controllers/chatController.ts
import { Request, Response } from 'express';
import ChatMessage, { IChatMessage } from '../models/ChatMessage';
import { Types } from 'mongoose';
import eventService from '../services/EventService';
import { User } from '../models/User';

/**
 * Busca mensagens de chat para uma missão específica
 */
export const getChatMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const { missionId } = req.params;
        const messages = await ChatMessage.find({ missionId: new Types.ObjectId(missionId) }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (error) {
        console.error('Erro ao buscar mensagens de chat:', error);
        res.status(500).json({ error: 'Erro ao buscar mensagens de chat' });
    }
};

/**
 * Cria uma nova mensagem de chat e emite eventos de notificação apropriados
 */
export const postChatMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { missionId } = req.params;
        const { userId, username, message, fileUrl, replyTo } = req.body;

        // Criar a nova mensagem
        const newMessage: IChatMessage = new ChatMessage({
            missionId: new Types.ObjectId(missionId),
            userId,
            username,
            message,
            fileUrl,
            reactions: {},
            replyTo: replyTo ? {
                messageId: new Types.ObjectId(replyTo.messageId),
                userId: replyTo.userId,
                username: replyTo.username,
                message: replyTo.message,
            } : undefined,
        });

        await newMessage.save();

        // Buscar nome da missão (placeholder - substitua pelo código real)
        const missionName = 'Missão'; // Substitua com a busca real do nome da missão

        // 1. Verificar menções de usuários no texto da mensagem (@username)
        const mentionRegex = /@(\w+)/g;
        const mentions = message.match(mentionRegex);

        if (mentions && mentions.length > 0) {
            // Processar cada menção encontrada
            for (const mention of mentions) {
                const mentionedUsername = mention.substring(1); // Remove o @ do nome

                try {
                    // Buscar o usuário mencionado
                    const mentionedUser = await User.findOne({ username: mentionedUsername });

                    if (mentionedUser) {
                        // Usando cast para object para resolver problemas de tipagem
                        const mentionedUserId = (mentionedUser as any)._id;

                        // Verificar se não é o próprio autor da mensagem
                        if (mentionedUserId.toString() !== userId) {
                            // Emitir evento de menção
                            eventService.emit('chat.user.mentioned', {
                                missionId,
                                messageId: newMessage._id,
                                mentionedUserId: mentionedUserId,
                                senderId: userId,
                                senderUsername: username,
                                missionName,
                                messageContent: message
                            });
                        }
                    }
                } catch (err) {
                    console.error(`Erro ao processar menção de usuário ${mentionedUsername}:`, err);
                    // Continua o loop mesmo se uma menção específica falhar
                }
            }
        }

        // 2. Verificar se é uma resposta a outra mensagem
        if (replyTo) {
            // Emitir evento de resposta
            eventService.emit('chat.message.replied', {
                missionId,
                messageId: newMessage._id,
                originalMessageId: replyTo.messageId,
                originalAuthorId: replyTo.userId,
                senderId: userId,
                senderUsername: username,
                missionName,
                messageContent: message
            });
        }

        // 3. Notificar outros participantes da missão
        eventService.emit('chat.message.created', {
            missionId,
            messageId: newMessage._id,
            senderId: userId,
            senderUsername: username,
            missionName,
            messageContent: message
            // recipients: [] // Você pode adicionar isso quando implementar a lógica para buscar participantes
        });

        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Erro ao criar mensagem de chat:', error);
        res.status(500).json({ error: 'Erro ao criar mensagem de chat' });
    }
};

/**
 * Adiciona uma reação a uma mensagem de chat
 */
export const reactToChatMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { missionId, messageId } = req.params;
        const { emoji, userId } = req.body;

        const chatMessage = await ChatMessage.findById(messageId);
        if (!chatMessage) {
            res.status(404).json({ error: 'Mensagem de chat não encontrada' });
            return;
        }

        // Para simplificar, incrementamos o contador para o emoji selecionado.
        const currentCount = chatMessage.reactions[emoji] || 0;
        chatMessage.reactions[emoji] = currentCount + 1;

        await chatMessage.save();

        res.status(200).json(chatMessage);
    } catch (error) {
        console.error('Erro ao reagir à mensagem de chat:', error);
        res.status(500).json({ error: 'Erro ao reagir à mensagem de chat' });
    }
};

/**
 * Busca uma mensagem específica pelo ID
 */
export const getChatMessageById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { messageId } = req.params;
        const message = await ChatMessage.findById(messageId);
        if (!message) {
            res.status(404).json({ error: 'Mensagem de chat não encontrada' });
            return;
        }
        res.status(200).json(message);
    } catch (error) {
        console.error('Erro ao buscar mensagem de chat:', error);
        res.status(500).json({ error: 'Erro ao buscar mensagem de chat' });
    }
};
