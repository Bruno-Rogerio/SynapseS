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
import { authenticateToken } from '../middleware/authMiddleware';
import { 
    hasPermission, 
    isOwnerOrHasPermission, 
    sameCompanyOnly 
} from '../middleware/permissionMiddleware';
import { Server } from 'socket.io';
import { IForum } from '../models/Forum';

const router = express.Router();

// Constantes para permissões de fórum
const FORUM_PERMISSIONS = {
    CREATE: 'forum:create',
    EDIT: 'forum:edit',
    DELETE: 'forum:delete',
    MODERATE: 'forum:moderate',
    ADMIN: 'forum:admin',
    ARCHIVE: 'forum:archive',
    MESSAGE_DELETE: 'forum:message:delete'
};

// Helper para extrair os dados armazenados em res.locals.data.
const extractData = <T>(res: Response): T | null => {
    return (res.locals.data as T) || null;
};

export const setupForumSocket = (io: Server) => {
    // Rotas básicas do fórum
    router.post('/', 
        authenticateToken, 
        hasPermission(FORUM_PERMISSIONS.CREATE),
        async (req, res, next) => {
            try {
                await createForum(req, res);
                const forum = extractData<IForum>(res) as IForum;
                if (forum && forum._id) {
                    // Emitir apenas para usuários da mesma empresa
                    const companyRoom = `company_${req.user?.company}`;
                    io.to(companyRoom).emit('new_forum', forum);
                }
            } catch (error) {
                next(error);
            }
        }
    );

    router.get('/', 
        authenticateToken,
        (req, res, next) => {
            getForums(req, res).catch(next);
        }
    );

    router.get('/search', 
        authenticateToken, 
        (req, res, next) => {
            searchForums(req, res).catch(next);
        }
    );

    router.get('/popular', 
        authenticateToken, 
        (req, res, next) => {
            getPopularForums(req, res).catch(next);
        }
    );

    router.get('/bytag/:tag', 
        authenticateToken, 
        (req, res, next) => {
            getForumsByTag(req, res).catch(next);
        }
    );

    router.get('/:id', 
        authenticateToken,
        sameCompanyOnly('forum', 'id'), 
        (req, res, next) => {
            getForumById(req, res).catch(next);
        }
    );

    router.put('/:id', 
        authenticateToken,
        sameCompanyOnly('forum', 'id'),
        isOwnerOrHasPermission(FORUM_PERMISSIONS.EDIT, 'forum', 'id'),
        async (req, res, next) => {
            try {
                await updateForum(req, res);
                const updatedForum = extractData<IForum>(res) as IForum;
                if (updatedForum && updatedForum._id) {
                    const companyRoom = `company_${req.user?.company}`;
                    io.to(companyRoom).emit('update_forum', updatedForum);
                }
            } catch (error) {
                next(error);
            }
        }
    );

    router.delete('/:id', 
        authenticateToken,
        sameCompanyOnly('forum', 'id'),
        isOwnerOrHasPermission(FORUM_PERMISSIONS.DELETE, 'forum', 'id'),
        async (req, res, next) => {
            try {
                await deleteForum(req, res);
                const deletedForumId = extractData<string>(res);
                if (deletedForumId) {
                    const companyRoom = `company_${req.user?.company}`;
                    io.to(companyRoom).emit('delete_forum', deletedForumId);
                }
            } catch (error) {
                next(error);
            }
        }
    );

    // Rotas relacionadas a seguidores
    router.post('/:id/follow', 
        authenticateToken,
        sameCompanyOnly('forum', 'id'),
        async (req, res, next) => {
            try {
                await followForum(req, res);
                const result = extractData<any>(res);
                if (result) {
                    // Apenas para usuários da empresa
                    const companyRoom = `company_${req.user?.company}`;
                    io.to(companyRoom).to(req.params.id).emit('follow_forum', result);
                }
            } catch (error) {
                next(error);
            }
        }
    );

    router.get('/:id/followers', 
        authenticateToken,
        sameCompanyOnly('forum', 'id'),
        (req, res, next) => {
            getForumFollowers(req, res).catch(next);
        }
    );

    // Rotas relacionadas a mensagens
    router.post('/:id/messages', 
        authenticateToken,
        sameCompanyOnly('forum', 'id'),
        async (req, res, next) => {
            try {
                await addMessage(req, res);
                const message = extractData<any>(res);
                if (message) {
                    const companyRoom = `company_${req.user?.company}`;
                    io.to(companyRoom).to(req.params.id).emit('new_message', message);
                }
            } catch (error) {
                next(error);
            }
        }
    );

    router.get('/:id/messages', 
        authenticateToken,
        sameCompanyOnly('forum', 'id'),
        (req, res, next) => {
            getMessages(req, res).catch(next);
        }
    );

    router.put('/:forumId/messages/:messageId', 
        authenticateToken,
        sameCompanyOnly('forum', 'forumId'),
        isOwnerOrHasPermission(FORUM_PERMISSIONS.EDIT, 'message', 'messageId'),
        async (req, res, next) => {
            try {
                await updateMessage(req, res);
                const updatedMessage = extractData<any>(res);
                if (updatedMessage) {
                    const companyRoom = `company_${req.user?.company}`;
                    io.to(companyRoom).to(req.params.forumId).emit('update_message', updatedMessage);
                }
            } catch (error) {
                next(error);
            }
        }
    );

    router.delete('/:forumId/messages/:messageId', 
        authenticateToken,
        sameCompanyOnly('forum', 'forumId'),
        isOwnerOrHasPermission(FORUM_PERMISSIONS.MESSAGE_DELETE, 'message', 'messageId'),
        async (req, res, next) => {
            try {
                await deleteMessage(req, res);
                const deletedMessageId = extractData<string>(res);
                if (deletedMessageId) {
                    const companyRoom = `company_${req.user?.company}`;
                    io.to(companyRoom).to(req.params.forumId).emit('delete_message', deletedMessageId);
                }
            } catch (error) {
                next(error);
            }
        }
    );

    router.post('/:forumId/messages/:messageId/react', 
        authenticateToken,
        sameCompanyOnly('forum', 'forumId'),
        async (req, res, next) => {
            try {
                await reactToMessage(req, res);
                const updatedMessage = extractData<any>(res);
                if (updatedMessage) {
                    const companyRoom = `company_${req.user?.company}`;
                    io.to(companyRoom).to(req.params.forumId).emit('update_message', updatedMessage);
                }
            } catch (error) {
                next(error);
            }
        }
    );

    // Rotas de arquivamento e estatísticas
    router.patch('/:id/archive', 
        authenticateToken,
        sameCompanyOnly('forum', 'id'),
        isOwnerOrHasPermission(FORUM_PERMISSIONS.ARCHIVE, 'forum', 'id'),
        async (req, res, next) => {
            try {
                await archiveForum(req, res);
                const archivedForum = extractData<IForum>(res) as IForum;
                if (archivedForum && archivedForum._id) {
                    const companyRoom = `company_${req.user?.company}`;
                    io.to(companyRoom).to(archivedForum._id.toString()).emit('archive_forum', archivedForum);
                }
            } catch (error) {
                next(error);
            }
        }
    );

    router.get('/:id/stats', 
        authenticateToken,
        sameCompanyOnly('forum', 'id'),
        (req, res, next) => {
            getForumStats(req, res).catch(next);
        }
    );

    // Rotas relacionadas a moderadores
    router.get('/:id/moderators', 
        authenticateToken,
        sameCompanyOnly('forum', 'id'),
        (req, res, next) => {
            getForumModerators(req, res).catch(next);
        }
    );

    router.post('/:id/moderators', 
        authenticateToken,
        sameCompanyOnly('forum', 'id'),
        hasPermission(FORUM_PERMISSIONS.MODERATE),
        async (req, res, next) => {
            try {
                await manageModerators(req, res);
                const result = extractData<any>(res);
                if (result) {
                    const companyRoom = `company_${req.user?.company}`;
                    io.to(companyRoom).to(req.params.id).emit('update_moderators', result);
                }
            } catch (error) {
                next(error);
            }
        }
    );

    // Rota para notificações
    router.get('/:id/notifications', 
        authenticateToken,
        sameCompanyOnly('forum', 'id'),
        (req, res, next) => {
            getForumNotifications(req, res).catch(next);
        }
    );

    // NOVAS ROTAS - Bookmarks/Favoritos
    router.post('/users/bookmarks/add/:forumId', 
        authenticateToken,
        sameCompanyOnly('forum', 'forumId'),
        (req, res, next) => {
            addBookmark(req, res).catch(next);
        }
    );

    router.post('/users/bookmarks/remove/:forumId', 
        authenticateToken,
        sameCompanyOnly('forum', 'forumId'),
        (req, res, next) => {
            removeBookmark(req, res).catch(next);
        }
    );

    router.get('/users/bookmarks/check/:forumId', 
        authenticateToken,
        sameCompanyOnly('forum', 'forumId'),
        (req, res, next) => {
            checkBookmark(req, res).catch(next);
        }
    );

    router.get('/users/bookmarks', 
        authenticateToken,
        (req, res, next) => {
            getUserBookmarks(req, res).catch(next);
        }
    );

    return router;
};

// Ajuste para Socket.IO inicialização
export const initializeSocketCompanyRooms = (io: Server) => {
    io.on('connection', (socket) => {
        // Extrair token do socket e verificar autenticação
        const token = socket.handshake.auth.token;
        if (!token) return;

        try {
            // Decodificar token para obter ID da empresa (implementação simplificada)
            // Na prática, você deve usar jwt.verify ou similar
            const decoded = JSON.parse(Buffer.from(token.split('.')[1], 'base64').toString());
            const companyId = decoded.company;
            
            if (companyId) {
                // Inscrever socket em sala específica da empresa
                socket.join(`company_${companyId}`);
                console.log(`Socket ${socket.id} joined company room: company_${companyId}`);
            }
        } catch (error) {
            console.error("Error setting up socket company rooms:", error);
        }
    });
};

export default router;
