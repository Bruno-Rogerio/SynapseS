// controllers/chatController.ts
import { Request, Response } from 'express';
import ChatMessage, { IChatMessage } from '../models/ChatMessage';
import { Types } from 'mongoose';
import eventService from '../services/EventService';
import { User } from '../models/User';
import  Mission  from '../models/Mission'; // Importação adicional

/**
 * Verifica e retorna a empresa associada a uma missão
 * @param missionId ID da missão
 * @returns ID da empresa ou null se não encontrada
 */
export const getMissionCompany = async (missionId: string | Types.ObjectId): Promise<Types.ObjectId | null> => {
    try {
        const mission = await Mission.findById(missionId).select('company');
        return mission?.company || null;
    } catch (error) {
        console.error('Erro ao buscar empresa da missão:', error);
        return null;
    }
};

/**
 * Busca mensagens de chat para uma missão específica
 */
export const getChatMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const { missionId } = req.params;

        // Verificar se o usuário tem uma empresa associada
        if (!req.user?.company) {
            res.status(403).json({ error: 'Usuário não está associado a nenhuma empresa' });
            return;
        }

        // Verificar se a missão pertence à empresa do usuário
        const missionCompany = await getMissionCompany(missionId);
        if (!missionCompany) {
            res.status(404).json({ error: 'Missão não encontrada' });
            return;
        }

        // Converter para string para comparação segura
        const userCompanyStr = req.user.company.toString();
        const missionCompanyStr = missionCompany.toString();

        // Verificar se missão pertence à empresa do usuário
        if (userCompanyStr !== missionCompanyStr) {
            res.status(403).json({ error: 'Acesso negado a esta missão' });
            return;
        }

        // Filtrar mensagens por missão e empresa
        const messages = await ChatMessage.find({
            missionId: new Types.ObjectId(missionId),
            company: req.user.company
        }).sort({ createdAt: 1 });

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
        const { message, fileUrl, replyTo } = req.body;

        // Extrair informações do usuário do token JWT
        if (!req.user?.userId || !req.user?.company) {
            res.status(403).json({ error: 'Usuário não autenticado ou sem empresa associada' });
            return;
        }

        // Buscar usuário para ter informações atualizadas
        const user = await User.findById(req.user.userId).select('username');
        if (!user) {
            res.status(404).json({ error: 'Usuário não encontrado' });
            return;
        }

        // Verificar se a missão pertence à empresa do usuário
        const missionCompany = await getMissionCompany(missionId);
        if (!missionCompany) {
            res.status(404).json({ error: 'Missão não encontrada' });
            return;
        }

        // Converter para string para comparação segura
        const userCompanyStr = req.user.company.toString();
        const missionCompanyStr = missionCompany.toString();

        // Verificar se missão pertence à empresa do usuário
        if (userCompanyStr !== missionCompanyStr) {
            res.status(403).json({ error: 'Acesso negado a esta missão' });
            return;
        }

        // Criar a nova mensagem com a empresa do usuário
        const newMessage: IChatMessage = new ChatMessage({
            missionId: new Types.ObjectId(missionId),
            userId: req.user.userId,
            username: user.username,
            message,
            fileUrl,
            reactions: {},
            company: req.user.company, // Associar à empresa do usuário
            replyTo: replyTo ? {
                messageId: new Types.ObjectId(replyTo.messageId),
                userId: replyTo.userId,
                username: replyTo.username,
                message: replyTo.message,
            } : undefined,
        });

        await newMessage.save();

        // Buscar nome da missão para notificações
        const mission = await Mission.findById(missionId).select('name');
        const missionName = mission?.title || 'Missão';

        // 1. Verificar menções de usuários no texto da mensagem (@username)
        const mentionRegex = /@(\w+)/g;
        const mentions = message.match(mentionRegex);

        if (mentions && mentions.length > 0) {
            // Processar cada menção encontrada
            for (const mention of mentions) {
                const mentionedUsername = mention.substring(1); // Remove o @ do nome
                try {
                    // Buscar o usuário mencionado (apenas na mesma empresa)
                    const mentionedUser = await User.findOne({
                        username: mentionedUsername,
                        company: req.user.company // Filtrar por empresa para segurança
                    });

                    if (mentionedUser) {
                        // Usando cast para object para resolver problemas de tipagem
                        const mentionedUserId = (mentionedUser as any)._id;

                        // Verificar se não é o próprio autor da mensagem
                        if (mentionedUserId.toString() !== req.user.userId) {
                            // Emitir evento de menção
                            eventService.emit('chat.user.mentioned', {
                                missionId,
                                messageId: newMessage._id,
                                mentionedUserId: mentionedUserId,
                                senderId: req.user.userId,
                                senderUsername: user.username,
                                missionName,
                                messageContent: message,
                                company: req.user.company // Incluir empresa no evento
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
            // Verificar se a mensagem original pertence à mesma empresa
            const originalMessage = await ChatMessage.findById(replyTo.messageId);

            if (originalMessage && originalMessage.company.toString() === req.user.company.toString()) {
                // Emitir evento de resposta
                eventService.emit('chat.message.replied', {
                    missionId,
                    messageId: newMessage._id,
                    originalMessageId: replyTo.messageId,
                    originalAuthorId: replyTo.userId,
                    senderId: req.user.userId,
                    senderUsername: user.username,
                    missionName,
                    messageContent: message,
                    company: req.user.company // Incluir empresa no evento
                });
            }
        }

        // 3. Notificar outros participantes da missão
        eventService.emit('chat.message.created', {
            missionId,
            messageId: newMessage._id,
            senderId: req.user.userId,
            senderUsername: user.username,
            missionName,
            messageContent: message,
            company: req.user.company // Incluir empresa no evento
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
        const { messageId } = req.params;
        const { emoji } = req.body;

        // Verificar autenticação e empresa
        if (!req.user?.userId || !req.user?.company) {
            res.status(403).json({ error: 'Usuário não autenticado ou sem empresa associada' });
            return;
        }

        // Buscar mensagem e verificar se pertence à empresa do usuário
        const chatMessage = await ChatMessage.findOne({
            _id: messageId,
            company: req.user.company // Filtrar por empresa
        });

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

        // Verificar autenticação e empresa
        if (!req.user?.userId || !req.user?.company) {
            res.status(403).json({ error: 'Usuário não autenticado ou sem empresa associada' });
            return;
        }

        // Buscar mensagem filtrando por empresa
        const message = await ChatMessage.findOne({
            _id: messageId,
            company: req.user.company // Filtrar por empresa
        });

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

/**
 * Exclui uma mensagem de chat (apenas autor ou admin)
 */
export const deleteChatMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { messageId } = req.params;

        // Verificar autenticação e empresa
        if (!req.user?.userId || !req.user?.company) {
            res.status(403).json({ error: 'Usuário não autenticado ou sem empresa associada' });
            return;
        }

        // Buscar mensagem filtrando por empresa
        const message = await ChatMessage.findOne({
            _id: messageId,
            company: req.user.company
        });

        if (!message) {
            res.status(404).json({ error: 'Mensagem de chat não encontrada' });
            return;
        }

        // Verificar se o usuário é o autor da mensagem ou administrador
        if (message.userId !== req.user.userId && req.user.role !== 'admin') {
            res.status(403).json({ error: 'Somente o autor ou administradores podem excluir esta mensagem' });
            return;
        }

        await ChatMessage.deleteOne({ _id: messageId });

        res.status(200).json({ message: 'Mensagem excluída com sucesso' });
    } catch (error) {
        console.error('Erro ao excluir mensagem de chat:', error);
        res.status(500).json({ error: 'Erro ao excluir mensagem de chat' });
    }
};
