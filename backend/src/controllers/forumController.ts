// src/controllers/forumController.ts
import { Request, Response } from 'express';
import Forum, { IForum, IMessage, ILikedReaction, IDislikedReaction, ICustomReaction } from '../models/Forum';
import { User } from '../models/User';
import { DecodedToken } from '../middleware/authMiddleware';
import mongoose, { Types } from 'mongoose';
import eventService from '../services/EventService';
import { EventTypes } from '../constants/EventTypes';

/**
 * Cria um novo fórum e envia a resposta diretamente.
 */
export const createForum = async (req: Request, res: Response) => {
    try {
        console.log('Received request to create forum:', req.body);
        const { title, description, tags } = req.body;
        // Verificar se os campos obrigatórios estão presentes
        if (!title || !description) {
            console.log('Missing required fields');
            return res.status(400).json({ message: 'Título e descrição são obrigatórios' });
        }
        const user = req.user as DecodedToken;
        if (!user || !user.userId) {
            console.log('User not authenticated');
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }
        console.log('Creating new forum with user:', user);
        const newForum: IForum = new Forum({
            title,
            description,
            createdBy: new Types.ObjectId(user.userId),
            tags: tags || [],
            messages: []
        });
        console.log('New forum object:', newForum);
        await newForum.save();
        console.log('Forum saved successfully');

        // Emitir evento de criação de fórum
        eventService.emit(EventTypes.FORUM.FORUM_CREATED, {
            forumId: newForum._id,
            title: newForum.title,
            createdBy: user.userId
        });

        return res.status(201).json(newForum);
    } catch (error: unknown) {
        console.error('Error in createForum:', error);
        if (error instanceof Error) {
            return res.status(500).json({
                message: 'Erro ao criar fórum',
                error: error.message
            });
        }
        return res.status(500).json({
            message: 'Erro ao criar fórum',
            error: 'Erro desconhecido'
        });
    }
};

/**
 * Obtém a lista de fóruns (não arquivados) com paginação.
 */
export const getForums = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;
        const forums = await Forum.find({ isArchived: false })
            .sort({ lastActivity: -1 })
            .skip(skip)
            .limit(limit)
            .populate('createdBy', 'username');
        const total = await Forum.countDocuments({ isArchived: false });
        return res.json({
            forums,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalForums: total
        });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao buscar fóruns', error });
    }
};

/**
 * Obtém um fórum específico pelo ID, incrementa o viewCount e envia a resposta.
 */
export const getForumById = async (req: Request, res: Response) => {
    try {
        const forum = await Forum.findById(req.params.id)
            .populate('createdBy', 'username')
            .populate('followers', 'username');
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        // Incrementa viewCount e salva
        forum.viewCount += 1;
        await forum.save();
        return res.json(forum);
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao buscar fórum', error });
    }
};

/**
 * Atualiza os dados de um fórum.
 */
export const updateForum = async (req: Request, res: Response) => {
    try {
        const { title, description, tags } = req.body;
        const user = req.user as DecodedToken;
        if (!user || !user.userId) {
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }
        const forum = await Forum.findById(req.params.id);
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        if (!forum.createdBy.equals(new Types.ObjectId(user.userId))) {
            return res.status(403).json({ message: 'Não autorizado a editar este fórum' });
        }
        forum.title = title || forum.title;
        forum.description = description || forum.description;
        forum.tags = tags || forum.tags;
        forum.updatedAt = new Date();
        await forum.save();
        return res.json(forum);
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao atualizar fórum', error });
    }
};

/**
 * Permite seguir ou deixar de seguir um fórum.
 */
export const followForum = async (req: Request, res: Response) => {
    try {
        const user = req.user as DecodedToken;
        if (!user || !user.userId) {
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }
        const forum = await Forum.findById(req.params.id);
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        const userId = new Types.ObjectId(user.userId);
        const isFollowing = forum.followers.some(followerId => followerId.equals(userId));
        if (isFollowing) {
            forum.followers = forum.followers.filter(followerId => !followerId.equals(userId));
        } else {
            forum.followers.push(userId);
        }
        await forum.save();
        return res.json({ success: true, following: !isFollowing });
    } catch (error) {
        return res.status(500).json({ success: false, message: 'Erro ao seguir/deixar de seguir fórum', error });
    }
};

/**
 * Pesquisa fóruns com base em uma query de texto.
 */
export const searchForums = async (req: Request, res: Response) => {
    try {
        const { query } = req.query;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;
        const forums = await Forum.find(
            { $text: { $search: query as string }, isArchived: false },
            { score: { $meta: 'textScore' } }
        )
            .sort({ score: { $meta: 'textScore' } })
            .skip(skip)
            .limit(limit)
            .populate('createdBy', 'username');
        const total = await Forum.countDocuments({ $text: { $search: query as string }, isArchived: false });
        return res.json({
            forums,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalForums: total
        });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao buscar fóruns', error });
    }
};

/**
 * Deleta um fórum pelo ID.
 */
export const deleteForum = async (req: Request, res: Response) => {
    try {
        const user = req.user as DecodedToken;
        if (!user || !user.userId) {
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }
        const forum = await Forum.findById(req.params.id);
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        if (!forum.createdBy.equals(new Types.ObjectId(user.userId)) && user.role !== 'admin') {
            return res.status(403).json({ message: 'Não autorizado a deletar este fórum' });
        }
        await Forum.findByIdAndDelete(req.params.id);
        return res.json({ message: 'Fórum deletado com sucesso' });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao deletar fórum', error });
    }
};

/**
 * Obtém os seguidores de um fórum.
 */
export const getForumFollowers = async (req: Request, res: Response) => {
    try {
        const forum = await Forum.findById(req.params.id).populate('followers', 'username email');
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        return res.json(forum.followers);
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao buscar seguidores do fórum', error });
    }
};

/**
 * Arquiva ou desarquiva um fórum.
 */
export const archiveForum = async (req: Request, res: Response) => {
    try {
        const user = req.user as DecodedToken;
        if (!user || !user.userId) {
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }
        const forum = await Forum.findById(req.params.id);
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        if (!forum.createdBy.equals(new Types.ObjectId(user.userId)) && user.role !== 'admin') {
            return res.status(403).json({ message: 'Não autorizado a arquivar este fórum' });
        }
        forum.isArchived = !forum.isArchived;
        await forum.save();
        return res.json({
            message: `Fórum ${forum.isArchived ? 'arquivado' : 'desarquivado'} com sucesso`,
            isArchived: forum.isArchived
        });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao arquivar/desarquivar fórum', error });
    }
};

/**
 * Obtém fóruns filtrados por uma determinada tag.
 */
export const getForumsByTag = async (req: Request, res: Response) => {
    try {
        const { tag } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;
        const forums = await Forum.find({ tags: tag, isArchived: false })
            .sort({ lastActivity: -1 })
            .skip(skip)
            .limit(limit)
            .populate('createdBy', 'username');
        const total = await Forum.countDocuments({ tags: tag, isArchived: false });
        return res.json({
            forums,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalForums: total
        });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao buscar fóruns por tag', error });
    }
};

/**
 * Obtém estatísticas de um fórum.
 */
export const getForumStats = async (req: Request, res: Response) => {
    try {
        const forum = await Forum.findById(req.params.id);
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        const stats = {
            messageCount: forum.messages.length,
            followerCount: forum.followers.length,
            viewCount: forum.viewCount,
            lastActivity: forum.lastActivity
        };
        return res.json(stats);
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao buscar estatísticas do fórum', error });
    }
};

/**
 * Gerencia moderadores de um fórum (adicionar ou remover).
 */
export const manageModerators = async (req: Request, res: Response) => {
    try {
        const { action, userId } = req.body;
        const user = req.user as DecodedToken;
        if (!user || !user.userId || user.role !== 'admin') {
            return res.status(403).json({ message: 'Não autorizado a gerenciar moderadores' });
        }
        const forum = await Forum.findById(req.params.id);
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        const moderatorId = new Types.ObjectId(userId);
        if (action === 'add') {
            if (!forum.moderators.some(id => id.equals(moderatorId))) {
                forum.moderators.push(moderatorId);
            }
        } else if (action === 'remove') {
            forum.moderators = forum.moderators.filter(id => !id.equals(moderatorId));
        } else {
            return res.status(400).json({ message: 'Ação inválida' });
        }
        await forum.save();
        return res.json({ message: 'Moderadores atualizados com sucesso', moderators: forum.moderators });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao gerenciar moderadores', error });
    }
};

/**
 * Obtém a lista de moderadores de um fórum.
 */
export const getForumModerators = async (req: Request, res: Response) => {
    try {
        const forum = await Forum.findById(req.params.id).populate('moderators', 'username email');
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        return res.json(forum.moderators);
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao buscar moderadores do fórum', error });
    }
};

/**
 * Obtém fóruns populares com base em viewCount e followerCount.
 */
export const getPopularForums = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;
        const forums = await Forum.find({ isArchived: false })
            .sort({ viewCount: -1, followerCount: -1 })
            .skip(skip)
            .limit(limit)
            .populate('createdBy', 'username');
        const total = await Forum.countDocuments({ isArchived: false });
        return res.json({
            forums,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalForums: total
        });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao buscar fóruns populares', error });
    }
};

/**
 * Retorna as notificações de um fórum.
 */
export const getForumNotifications = async (req: Request, res: Response) => {
    try {
        const user = req.user as DecodedToken;
        if (!user || !user.userId) {
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }
        const forum = await Forum.findById(req.params.id);
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        return res.json({ message: 'Funcionalidade de notificações ainda não implementada' });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao buscar notificações do fórum', error });
    }
};

/**
 * Adiciona uma mensagem a um fórum.
 */
export const addMessage = async (req: Request, res: Response) => {
    try {
        const { content, replyTo } = req.body;
        const user = req.user as DecodedToken;
        if (!user || !user.userId) {
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }

        const forum = await Forum.findById(req.params.id);
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }

        // Criar nova mensagem
        const newMessage: IMessage = {
            _id: new Types.ObjectId(),
            content,
            author: new Types.ObjectId(user.userId),
            createdAt: new Date(),
            updatedAt: new Date(),
            reactions: { likes: [], dislikes: [], custom: [] }
        };

        // Adicionar referência à mensagem original se for uma resposta
        if (replyTo) {
            newMessage.replyTo = new Types.ObjectId(replyTo);
        }

        // Adicionar a mensagem ao fórum
        forum.messages.push(newMessage);
        forum.lastActivity = new Date();
        await forum.save();

        // Buscar detalhes do autor para popular a resposta
        const populatedMessage = await Forum.populate(newMessage, { path: 'author', select: 'username avatar' });

        // ----- NOTIFICAÇÕES E EVENTOS -----

        try {
            // 1. Notificar todos os seguidores sobre nova mensagem
            eventService.emit(EventTypes.FORUM.MESSAGE_CREATED, {
                forumId: forum._id,
                messageId: newMessage._id,
                senderId: user.userId,
                forumTitle: forum.title,
                messageContent: content,
                recipients: forum.followers.map(f => f.toString())
            });

            // 2. Procurar menções de usuário (@username) no conteúdo
            const mentionRegex = /@(\w+)/g;
            const mentions = content.match(mentionRegex);

            if (mentions) {
                for (const mention of mentions) {
                    const username = mention.substring(1); // Remove o @ do nome

                    try {
                        // Buscar o usuário mencionado
                        const mentionedUser = await User.findOne({ username });

                        if (mentionedUser) {
                            // Usando casting para object para resolver problemas de tipagem
                            const mentionedUserId = (mentionedUser as any)._id;

                            // Verificar se não é o próprio autor da mensagem
                            if (mentionedUserId.toString() !== user.userId) {
                                // Emitir evento de menção
                                eventService.emit(EventTypes.FORUM.USER_MENTIONED, {
                                    forumId: forum._id,
                                    messageId: newMessage._id,
                                    mentionedUserId: mentionedUserId,
                                    senderId: user.userId,
                                    forumTitle: forum.title,
                                    messageContent: content
                                });
                            }
                        }
                    } catch (mentionError) {
                        console.error(`Erro ao processar menção para usuário ${username}:`, mentionError);
                        // Continua o loop mesmo se uma menção específica falhar
                    }
                }
            }

            // 3. Se for resposta a uma mensagem, notificar o autor original
            if (replyTo) {
                // Procurar a mensagem original para obter o autor
                const originalMessage = forum.messages.find(m => m._id.toString() === replyTo);

                if (originalMessage && !originalMessage.author.equals(new Types.ObjectId(user.userId))) {
                    // Emitir evento de resposta
                    eventService.emit(EventTypes.FORUM.MESSAGE_REPLIED, {
                        forumId: forum._id,
                        messageId: newMessage._id,
                        originalAuthorId: originalMessage.author,
                        senderId: user.userId,
                        forumTitle: forum.title,
                        messageContent: content
                    });
                }
            }
        } catch (notificationError) {
            console.error('Erro ao processar notificações:', notificationError);
            // Não falhar a requisição por erro de notificação
        }

        return res.status(201).json(populatedMessage);
    } catch (error) {
        console.error('Erro ao adicionar mensagem:', error);
        return res.status(500).json({ message: 'Erro ao adicionar mensagem', error });
    }
};

/**
 * Obtém mensagens de um fórum com paginação.
 */
export const getMessages = async (req: Request, res: Response) => {
    try {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 50;
        const skip = (page - 1) * limit;
        const forum = await Forum.findById(req.params.id);
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        const messages = await Forum.aggregate([
            { $match: { _id: new mongoose.Types.ObjectId(req.params.id) } },
            { $unwind: '$messages' },
            { $sort: { 'messages.createdAt': -1 } },
            { $skip: skip },
            { $limit: limit },
            {
                $lookup: {
                    from: 'users',
                    localField: 'messages.author',
                    foreignField: '_id',
                    as: 'messages.author'
                }
            },
            { $unwind: '$messages.author' },
            {
                $project: {
                    _id: '$messages._id',
                    content: '$messages.content',
                    createdAt: '$messages.createdAt',
                    updatedAt: '$messages.updatedAt',
                    reactions: '$messages.reactions',
                    replyTo: '$messages.replyTo',
                    author: {
                        _id: '$messages.author._id',
                        username: '$messages.author.username',
                        avatar: '$messages.author.avatar'
                    }
                }
            }
        ]);
        const total = forum.messages.length;
        return res.json({
            messages,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalMessages: total
        });
    } catch (error) {
        console.error('Error in getMessages:', error);
        return res.status(500).json({ message: 'Erro ao buscar mensagens', error: (error as Error).message });
    }
};

/**
 * Atualiza uma mensagem de um fórum.
 */
export const updateMessage = async (req: Request, res: Response) => {
    try {
        const { content } = req.body;
        const user = req.user as DecodedToken;
        if (!user || !user.userId) {
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }
        const forum = await Forum.findById(req.params.forumId);
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        const message = forum.messages.find(m => m._id.toString() === req.params.messageId);
        if (!message) {
            return res.status(404).json({ message: 'Mensagem não encontrada' });
        }
        if (!message.author.equals(new Types.ObjectId(user.userId)) && user.role !== 'admin') {
            return res.status(403).json({ message: 'Não autorizado a editar esta mensagem' });
        }
        message.content = content;
        message.updatedAt = new Date();
        await forum.save();
        const updatedMessage = await Forum.populate(message, { path: 'author', select: 'username avatar' });
        return res.json(updatedMessage);
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao atualizar mensagem', error });
    }
};

/**
 * Deleta uma mensagem de um fórum.
 */
export const deleteMessage = async (req: Request, res: Response) => {
    try {
        const user = req.user as DecodedToken;
        if (!user || !user.userId) {
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }
        const forum = await Forum.findById(req.params.forumId);
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        const messageIndex = forum.messages.findIndex(m => m._id.toString() === req.params.messageId);
        if (messageIndex === -1) {
            return res.status(404).json({ message: 'Mensagem não encontrada' });
        }
        const message = forum.messages[messageIndex];
        if (!message.author.equals(new Types.ObjectId(user.userId)) && user.role !== 'admin') {
            return res.status(403).json({ message: 'Não autorizado a deletar esta mensagem' });
        }
        forum.messages.splice(messageIndex, 1);
        await forum.save();
        return res.json({ message: 'Mensagem deletada com sucesso' });
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao deletar mensagem', error });
    }
};

/**
 * Reage a uma mensagem (like, dislike ou emoji personalizado).
 */
export const reactToMessage = async (req: Request, res: Response) => {
    try {
        // Aceitamos o valor da reação em req.body.emoji ou req.body.type
        const reactionValue: string = req.body.emoji || req.body.type;
        if (!reactionValue || typeof reactionValue !== 'string') {
            return res.status(400).json({ message: 'Reação inválida' });
        }
        const user = req.user as DecodedToken;
        if (!user || !user.userId) {
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }
        const forum = await Forum.findById(req.params.forumId);
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        const message = forum.messages.find(
            (m) => m._id.toString() === req.params.messageId
        );
        if (!message) {
            return res.status(404).json({ message: 'Mensagem não encontrada' });
        }
        // Lógica de reação:
        if (reactionValue === 'like') {
            const likeIndex = message.reactions.likes.findIndex(
                (r: ILikedReaction) => r.userId.toString() === user.userId
            );
            const dislikeIndex = message.reactions.dislikes.findIndex(
                (r: IDislikedReaction) => r.userId.toString() === user.userId
            );
            if (likeIndex !== -1) {
                // Toggle: remove o like
                message.reactions.likes.splice(likeIndex, 1);
            } else {
                if (dislikeIndex !== -1) {
                    message.reactions.dislikes.splice(dislikeIndex, 1);
                }
                message.reactions.likes.push({
                    type: 'like',
                    userId: new Types.ObjectId(user.userId)
                });
            }
        } else if (reactionValue === 'dislike') {
            const dislikeIndex = message.reactions.dislikes.findIndex(
                (r: IDislikedReaction) => r.userId.toString() === user.userId
            );
            const likeIndex = message.reactions.likes.findIndex(
                (r: ILikedReaction) => r.userId.toString() === user.userId
            );
            if (dislikeIndex !== -1) {
                message.reactions.dislikes.splice(dislikeIndex, 1);
            } else {
                if (likeIndex !== -1) {
                    message.reactions.likes.splice(likeIndex, 1);
                }
                message.reactions.dislikes.push({
                    type: 'dislike',
                    userId: new Types.ObjectId(user.userId)
                });
            }
        } else {
            // Para qualquer outro valor (emoji personalizado), opera sobre o array "custom"
            const customIndex = message.reactions.custom.findIndex(
                (r: ICustomReaction) => r.userId.toString() === user.userId
            );
            if (customIndex !== -1) {
                if (message.reactions.custom[customIndex].emoji === reactionValue) {
                    // Se o mesmo emoji, remove (toggle)
                    message.reactions.custom.splice(customIndex, 1);
                } else {
                    // Atualiza para o novo emoji
                    message.reactions.custom[customIndex].emoji = reactionValue;
                }
            } else {
                message.reactions.custom.push({
                    emoji: reactionValue,
                    userId: new Types.ObjectId(user.userId)
                });
            }
        }
        await forum.save();
        const updatedMessage = await Forum.populate(message, {
            path: 'author',
            select: 'username avatar'
        });
        return res.json(updatedMessage);
    } catch (error) {
        return res.status(500).json({ message: 'Erro ao reagir à mensagem', error });
    }
};

/**
 * NOVAS FUNÇÕES PARA BOOKMARKS
 */

/**
 * Adiciona um fórum aos favoritos do usuário.
 */
export const addBookmark = async (req: Request, res: Response) => {
    try {
        const user = req.user as DecodedToken;
        if (!user || !user.userId) {
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }

        const { forumId } = req.params;

        // Verifica se o fórum existe
        const forum = await Forum.findById(forumId);
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }

        // Adiciona aos bookmarks se ainda não estiver
        const updatedUser = await User.findByIdAndUpdate(
            user.userId,
            { $addToSet: { bookmarks: forumId } },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Fórum adicionado aos favoritos',
            bookmarks: updatedUser?.bookmarks || []
        });
    } catch (error) {
        console.error('Erro ao adicionar favorito:', error);
        return res.status(500).json({ success: false, message: 'Erro ao adicionar aos favoritos' });
    }
};

/**
 * Remove um fórum dos favoritos do usuário.
 */
export const removeBookmark = async (req: Request, res: Response) => {
    try {
        const user = req.user as DecodedToken;
        if (!user || !user.userId) {
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }

        const { forumId } = req.params;

        const updatedUser = await User.findByIdAndUpdate(
            user.userId,
            { $pull: { bookmarks: forumId } },
            { new: true }
        );

        return res.status(200).json({
            success: true,
            message: 'Fórum removido dos favoritos',
            bookmarks: updatedUser?.bookmarks || []
        });
    } catch (error) {
        console.error('Erro ao remover favorito:', error);
        return res.status(500).json({ success: false, message: 'Erro ao remover dos favoritos' });
    }
};

/**
 * Verifica se um fórum está nos favoritos do usuário.
 */
export const checkBookmark = async (req: Request, res: Response) => {
    try {
        const user = req.user as DecodedToken;
        if (!user || !user.userId) {
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }

        const { forumId } = req.params;

        const userDoc = await User.findById(user.userId);
        const isBookmarked = userDoc?.bookmarks?.some((bookmark: mongoose.Types.ObjectId) =>
            bookmark.toString() === forumId
        );

        return res.status(200).json({ isBookmarked: !!isBookmarked });
    } catch (error) {
        console.error('Erro ao verificar favorito:', error);
        return res.status(500).json({ success: false, message: 'Erro ao verificar favorito' });
    }
};

/**
 * Obtém todos os fóruns favoritos do usuário.
 */
export const getUserBookmarks = async (req: Request, res: Response) => {
    try {
        const user = req.user as DecodedToken;
        if (!user || !user.userId) {
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }

        const userDoc = await User.findById(user.userId).populate({
            path: 'bookmarks',
            select: 'title description tags createdBy followers lastActivity viewCount messageCount',
            populate: { path: 'createdBy', select: 'username' }
        });

        if (!userDoc) {
            return res.status(404).json({ message: 'Usuário não encontrado' });
        }

        return res.status(200).json({
            bookmarks: userDoc.bookmarks || []
        });
    } catch (error) {
        console.error('Erro ao buscar favoritos:', error);
        return res.status(500).json({ message: 'Erro ao buscar favoritos' });
    }
};

export default {
    // Funções existentes
    createForum,
    getForums,
    getForumById,
    updateForum,
    followForum,
    searchForums,
    deleteForum,
    getForumFollowers,
    archiveForum,
    getForumsByTag,
    getForumStats,
    manageModerators,
    getForumModerators,
    getPopularForums,
    getForumNotifications,
    addMessage,
    getMessages,
    updateMessage,
    deleteMessage,
    reactToMessage,

    // Novas funções para bookmarks
    addBookmark,
    removeBookmark,
    checkBookmark,
    getUserBookmarks
};
