// src/controllers/forumController.ts
import { Request, Response } from 'express';
import Forum, { IForum, IPost } from '../models/Forum';
import { DecodedToken } from '../middleware/authMiddleware';
import mongoose from 'mongoose';

// Criar um novo fórum
export const createForum = async (req: Request, res: Response) => {
    try {
        const { title, description, tags } = req.body;
        const user = req.user as DecodedToken;
        if (!user || !user.userId) {
            return res.status(401).json({ message: 'Usuário não autenticado' });
        }
        const newForum: IForum = new Forum({
            title,
            description,
            createdBy: new mongoose.Types.ObjectId(user.userId),
            tags
        });
        await newForum.save();
        res.status(201).json(newForum);
    } catch (error) {
        res.status(500).json({ message: 'Erro ao criar fórum', error });
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
        if (forum.createdBy instanceof mongoose.Types.ObjectId) {
            if (forum.createdBy.toString() !== user.userId) {
                return res.status(403).json({ message: 'Não autorizado a editar este fórum' });
            }
        } else {
            return res.status(500).json({ message: 'Erro na estrutura do fórum' });
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
        const userId = new mongoose.Types.ObjectId(user.userId);
        const isFollowing = forum.followers.some((followerId) => {
            return followerId instanceof mongoose.Types.ObjectId && followerId.equals(userId);
        });
        if (isFollowing) {
            forum.followers = forum.followers.filter((followerId) => {
                return followerId instanceof mongoose.Types.ObjectId && !followerId.equals(userId);
            });
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
        if (forum.createdBy instanceof mongoose.Types.ObjectId) {
            if (forum.createdBy.toString() !== user.userId && user.role !== 'admin') {
                return res.status(403).json({ message: 'Não autorizado a deletar este fórum' });
            }
        } else {
            return res.status(500).json({ message: 'Erro na estrutura do fórum' });
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
        const newPost: IPost = {
            _id: new mongoose.Types.ObjectId(),
            title,
            content,
            author: new mongoose.Types.ObjectId(user.userId),
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
        if (forum.createdBy instanceof mongoose.Types.ObjectId) {
            if (forum.createdBy.toString() !== user.userId && user.role !== 'admin') {
                return res.status(403).json({ message: 'Não autorizado a arquivar este fórum' });
            }
        } else {
            return res.status(500).json({ message: 'Erro na estrutura do fórum' });
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
        const moderatorId = new mongoose.Types.ObjectId(userId);
        if (action === 'add') {
            if (!forum.moderators.some((id) => id instanceof mongoose.Types.ObjectId && id.equals(moderatorId))) {
                forum.moderators.push(moderatorId);
            }
        } else if (action === 'remove') {
            forum.moderators = forum.moderators.filter((id) => id instanceof mongoose.Types.ObjectId && !id.equals(moderatorId));
        } else {
            return res.status(400).json({ message: 'Ação inválida' });
        }
        await forum.save();
        res.json({ message: 'Moderadores atualizados com sucesso', moderators: forum.moderators });
    } catch (error) {
        res.status(500).json({ message: 'Erro ao gerenciar moderadores', error });
    }
};
