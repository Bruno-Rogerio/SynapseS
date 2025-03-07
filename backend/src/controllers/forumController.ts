// src/controllers/forumController.ts
import { Request, Response } from 'express';
import Forum, { IForum, IPost, IPostBase } from '../models/Forum';
import { DecodedToken } from '../middleware/authMiddleware';
import mongoose, { Types } from 'mongoose';

// Criar um novo fórum
export const createForum = async (req: Request, res: Response) => {
    try {
        console.log('Received request to create forum:', req.body);
        const { title, description, tags } = req.body;

        // Verificar se todos os campos necessários estão presentes
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
            tags: tags || []
        });

        console.log('New forum object:', newForum);
        await newForum.save();
        console.log('Forum saved successfully');
        res.status(201).json(newForum);
    } catch (error: unknown) {
        console.error('Error in createForum:', error);
        if (error instanceof Error) {
            res.status(500).json({
                message: 'Erro ao criar fórum',
                error: error.message
            });
        } else {
            res.status(500).json({
                message: 'Erro ao criar fórum',
                error: 'Erro desconhecido'
            });
        }
    }
};


// Obter lista de fóruns
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
        res.json({
            forums,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalForums: total
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar fóruns', error });
    }
};

// Obter um fórum específico por ID
export const getForumById = async (req: Request, res: Response) => {
    try {
        const forum = await Forum.findById(req.params.id)
            .populate('createdBy', 'username')
            .populate('followers', 'username');
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        // Incrementar viewCount
        forum.viewCount += 1;
        await forum.save();
        res.json(forum);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar fórum', error });
    }
};

// Atualizar um fórum
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
        res.json(forum);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar fórum', error });
    }
};

// Seguir ou deixar de seguir um fórum
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
        res.json({ following: !isFollowing });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao seguir/deixar de seguir fórum', error });
    }
};

// Pesquisar fóruns
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
        res.json({
            forums,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalForums: total
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar fóruns', error });
    }
};
// Deletar um fórum
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
        res.json({ message: 'Fórum deletado com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar fórum', error });
    }
};

// Obter seguidores de um fórum
export const getForumFollowers = async (req: Request, res: Response) => {
    try {
        const forum = await Forum.findById(req.params.id).populate('followers', 'username email');
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        res.json(forum.followers);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar seguidores do fórum', error });
    }
};

// Adicionar um post a um fórum
export const addPostToForum = async (req: Request, res: Response) => {
    try {
        const { title, content } = req.body;
        const user = req.user as DecodedToken;
        if (!user || !user.userId) {
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }
        const forum = await Forum.findById(req.params.id);
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        const newPost: IPostBase = {
            title,
            content,
            author: new Types.ObjectId(user.userId),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        forum.posts.push(newPost);
        forum.lastActivity = new Date();
        await forum.save();
        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao adicionar post ao fórum', error });
    }
};

// Obter posts de um fórum
export const getForumPosts = async (req: Request, res: Response) => {
    try {
        const forum = await Forum.findById(req.params.id).populate({
            path: 'posts',
            populate: { path: 'author', select: 'username' }
        });
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        res.json(forum.posts);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar posts do fórum', error });
    }
};

// Arquivar ou desarquivar um fórum
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
        res.json({ message: `Fórum ${forum.isArchived ? 'arquivado' : 'desarquivado'} com sucesso`, isArchived: forum.isArchived });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao arquivar/desarquivar fórum', error });
    }
};

// Obter fóruns por tag
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
        res.json({
            forums,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalForums: total
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar fóruns por tag', error });
    }
};

// Obter estatísticas de um fórum
export const getForumStats = async (req: Request, res: Response) => {
    try {
        const forum = await Forum.findById(req.params.id);
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        const stats = {
            postCount: forum.posts.length,
            followerCount: forum.followers.length,
            viewCount: forum.viewCount,
            lastActivity: forum.lastActivity
        };
        res.json(stats);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar estatísticas do fórum', error });
    }
};

// Gerenciar moderadores de um fórum
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
        res.json({ message: 'Moderadores atualizados com sucesso', moderators: forum.moderators });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao gerenciar moderadores', error });
    }
};

// Atualizar um post
export const updatePost = async (req: Request, res: Response) => {
    try {
        const { title, content } = req.body;
        const user = req.user as DecodedToken;
        if (!user || !user.userId) {
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }
        const forum = await Forum.findById(req.params.forumId);
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        const post = forum.posts.id(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: 'Post não encontrado' });
        }
        if (!post.author.equals(new Types.ObjectId(user.userId)) && user.role !== 'admin') {
            return res.status(403).json({ message: 'Não autorizado a editar este post' });
        }
        post.title = title || post.title;
        post.content = content || post.content;
        post.updatedAt = new Date();
        await forum.save();
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao atualizar post', error });
    }
};

// Deletar um post
export const deletePost = async (req: Request, res: Response) => {
    try {
        const user = req.user as DecodedToken;
        if (!user || !user.userId) {
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }
        const forum = await Forum.findById(req.params.forumId);
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        const post = forum.posts.id(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: 'Post não encontrado' });
        }
        if (!post.author.equals(new Types.ObjectId(user.userId)) && user.role !== 'admin') {
            return res.status(403).json({ message: 'Não autorizado a deletar este post' });
        }
        forum.posts.pull(post._id);
        await forum.save();
        res.json({ message: 'Post deletado com sucesso' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao deletar post', error });
    }
};

// Obter um post específico
export const getPostById = async (req: Request, res: Response) => {
    try {
        const forum = await Forum.findById(req.params.forumId);
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        const post = forum.posts.id(req.params.postId);
        if (!post) {
            return res.status(404).json({ message: 'Post não encontrado' });
        }
        res.json(post);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar post', error });
    }
};

// Obter moderadores de um fórum
export const getForumModerators = async (req: Request, res: Response) => {
    try {
        const forum = await Forum.findById(req.params.id).populate('moderators', 'username email');
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        res.json(forum.moderators);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar moderadores do fórum', error });
    }
};

// Obter fóruns populares
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
        res.json({
            forums,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            totalForums: total
        });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar fóruns populares', error });
    }
};

// Obter notificações de um fórum
export const getForumNotifications = async (req: Request, res: Response) => {
    try {
        const user = req.user as DecodedToken;
        if (!user || !user.userId) {
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }
        // Implementação depende de como você está gerenciando notificações
        // Este é apenas um exemplo básico
        const forum = await Forum.findById(req.params.id);
        if (!forum) {
            return res.status(404).json({ message: 'Fórum não encontrado' });
        }
        // Aqui você buscaria as notificações relacionadas ao fórum para o usuário atual
        // Por exemplo:
        // const notifications = await Notification.find({ forum: req.params.id, user: user.userId });
        // res.json(notifications);
        res.json({ message: 'Funcionalidade de notificações ainda não implementada' });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao buscar notificações do fórum', error });
    }
};
