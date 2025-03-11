// src/routes/forumRoutes.ts
import express, { Response } from 'express';
import {
    createForum,
    getForums,
    getForumById,
    updateForum,
    followForum,
    searchForums,
    deleteForum,
    getForumFollowers,
    addMessage,
    getMessages,
    archiveForum,
    getForumsByTag,
    getForumStats,
    manageModerators,
    updateMessage,
    deleteMessage,
    reactToMessage,
    getForumModerators,
    getPopularForums,
    getForumNotifications,
    // Importando as funções de bookmark
    addBookmark,
    removeBookmark,
    checkBookmark,
    getUserBookmarks
} from '../controllers/forumController';
import { authMiddleware, authorizeAdmin } from '../middleware/authMiddleware';
import { Server } from 'socket.io';
import { IForum } from '../models/Forum';

const router = express.Router();

// Helper para extrair os dados armazenados em res.locals.data.
// Certifique-se de que os controladores atribuam o resultado em res.locals.data antes de enviar a resposta.
const extractData = <T>(res: Response): T | null => {
    return (res.locals.data as T) || null;
};

export const setupForumSocket = (io: Server) => {
    // Rotas básicas do fórum
    router.post('/', authMiddleware, async (req, res, next) => {
        try {
            await createForum(req, res);
            // Cast explícito para IForum para garantir que _id exista
            const forum = extractData<IForum>(res) as IForum;
            if (forum && forum._id) {
                io.emit('new_forum', forum);
            }
        } catch (error) {
            next(error);
        }
    });

    router.get('/', (req, res, next) => {
        getForums(req, res).catch(next);
    });

    router.get('/search', (req, res, next) => {
        searchForums(req, res).catch(next);
    });

    router.get('/popular', (req, res, next) => {
        getPopularForums(req, res).catch(next);
    });

    router.get('/bytag/:tag', (req, res, next) => {
        getForumsByTag(req, res).catch(next);
    });

    router.get('/:id', (req, res, next) => {
        getForumById(req, res).catch(next);
    });

    router.put('/:id', authMiddleware, async (req, res, next) => {
        try {
            await updateForum(req, res);
            const updatedForum = extractData<IForum>(res) as IForum;
            if (updatedForum && updatedForum._id) {
                io.to(updatedForum._id.toString()).emit('update_forum', updatedForum);
            }
        } catch (error) {
            next(error);
        }
    });

    router.delete('/:id', authMiddleware, async (req, res, next) => {
        try {
            await deleteForum(req, res);
            const deletedForumId = extractData<string>(res);
            if (deletedForumId) {
                io.emit('delete_forum', deletedForumId);
            }
        } catch (error) {
            next(error);
        }
    });

    // Rotas relacionadas a seguidores
    router.post('/:id/follow', authMiddleware, async (req, res, next) => {
        try {
            await followForum(req, res);
            const result = extractData<any>(res);
            if (result) {
                io.to(req.params.id).emit('follow_forum', result);
            }
        } catch (error) {
            next(error);
        }
    });

    router.get('/:id/followers', (req, res, next) => {
        getForumFollowers(req, res).catch(next);
    });

    // Rotas relacionadas a mensagens
    router.post('/:id/messages', authMiddleware, async (req, res, next) => {
        try {
            await addMessage(req, res);
            const message = extractData<any>(res);
            if (message) {
                io.to(req.params.id).emit('new_message', message);
            }
        } catch (error) {
            next(error);
        }
    });

    router.get('/:id/messages', (req, res, next) => {
        getMessages(req, res).catch(next);
    });

    router.put('/:forumId/messages/:messageId', authMiddleware, async (req, res, next) => {
        try {
            await updateMessage(req, res);
            const updatedMessage = extractData<any>(res);
            if (updatedMessage) {
                io.to(req.params.forumId).emit('update_message', updatedMessage);
            }
        } catch (error) {
            next(error);
        }
    });

    router.delete('/:forumId/messages/:messageId', authMiddleware, async (req, res, next) => {
        try {
            await deleteMessage(req, res);
            const deletedMessageId = extractData<string>(res);
            if (deletedMessageId) {
                io.to(req.params.forumId).emit('delete_message', deletedMessageId);
            }
        } catch (error) {
            next(error);
        }
    });

    router.post('/:forumId/messages/:messageId/react', authMiddleware, async (req, res, next) => {
        try {
            await reactToMessage(req, res);
            const updatedMessage = extractData<any>(res);
            if (updatedMessage) {
                io.to(req.params.forumId).emit('update_message', updatedMessage);
            }
        } catch (error) {
            next(error);
        }
    });

    // Rotas de arquivamento e estatísticas
    router.patch('/:id/archive', authMiddleware, async (req, res, next) => {
        try {
            await archiveForum(req, res);
            const archivedForum = extractData<IForum>(res) as IForum;
            if (archivedForum && archivedForum._id) {
                io.to(archivedForum._id.toString()).emit('archive_forum', archivedForum);
            }
        } catch (error) {
            next(error);
        }
    });

    router.get('/:id/stats', (req, res, next) => {
        getForumStats(req, res).catch(next);
    });

    // Rotas relacionadas a moderadores
    router.get('/:id/moderators', (req, res, next) => {
        getForumModerators(req, res).catch(next);
    });

    router.post('/:id/moderators', authMiddleware, authorizeAdmin, async (req, res, next) => {
        try {
            await manageModerators(req, res);
            const result = extractData<any>(res);
            if (result) {
                io.to(req.params.id).emit('update_moderators', result);
            }
        } catch (error) {
            next(error);
        }
    });

    // Rota para notificações
    router.get('/:id/notifications', authMiddleware, (req, res, next) => {
        getForumNotifications(req, res).catch(next);
    });

    // NOVAS ROTAS - Bookmarks/Favoritos
    router.post('/users/bookmarks/add/:forumId', authMiddleware, (req, res, next) => {
        addBookmark(req, res).catch(next);
    });

    router.post('/users/bookmarks/remove/:forumId', authMiddleware, (req, res, next) => {
        removeBookmark(req, res).catch(next);
    });

    router.get('/users/bookmarks/check/:forumId', authMiddleware, (req, res, next) => {
        checkBookmark(req, res).catch(next);
    });

    router.get('/users/bookmarks', authMiddleware, (req, res, next) => {
        getUserBookmarks(req, res).catch(next);
    });

    return router;
};

export default router;
