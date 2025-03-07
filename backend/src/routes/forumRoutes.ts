// src/routes/forumRoutes.ts
import express from 'express';
import {
    createForum,
    getForums,
    getForumById,
    updateForum,
    followForum,
    searchForums,
    deleteForum,
    getForumFollowers,
    addPostToForum,
    getForumPosts,
    archiveForum,
    getForumsByTag,
    getForumStats,
    manageModerators,
    updatePost,
    deletePost,
    getPostById,
    getForumModerators,
    getPopularForums,
    getForumNotifications
} from '../controllers/forumController';
import { authMiddleware, authorizeAdmin } from '../middleware/authMiddleware';

const router = express.Router();

// Rotas básicas do fórum
router.post('/', authMiddleware, (req, res, next) => {
    createForum(req, res).catch(next);
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

router.put('/:id', authMiddleware, (req, res, next) => {
    updateForum(req, res).catch(next);
});

router.delete('/:id', authMiddleware, (req, res, next) => {
    deleteForum(req, res).catch(next);
});

// Rotas relacionadas a seguidores
router.post('/:id/follow', authMiddleware, (req, res, next) => {
    followForum(req, res).catch(next);
});

router.get('/:id/followers', (req, res, next) => {
    getForumFollowers(req, res).catch(next);
});

// Rotas relacionadas a posts
router.post('/:id/posts', authMiddleware, (req, res, next) => {
    addPostToForum(req, res).catch(next);
});

router.get('/:id/posts', (req, res, next) => {
    getForumPosts(req, res).catch(next);
});

router.get('/:forumId/posts/:postId', (req, res, next) => {
    getPostById(req, res).catch(next);
});

router.put('/:forumId/posts/:postId', authMiddleware, (req, res, next) => {
    updatePost(req, res).catch(next);
});

router.delete('/:forumId/posts/:postId', authMiddleware, (req, res, next) => {
    deletePost(req, res).catch(next);
});

// Rotas de arquivamento e estatísticas
router.patch('/:id/archive', authMiddleware, (req, res, next) => {
    archiveForum(req, res).catch(next);
});

router.get('/:id/stats', (req, res, next) => {
    getForumStats(req, res).catch(next);
});

// Rotas relacionadas a moderadores
router.get('/:id/moderators', (req, res, next) => {
    getForumModerators(req, res).catch(next);
});

router.post('/:id/moderators', authMiddleware, authorizeAdmin, (req, res, next) => {
    manageModerators(req, res).catch(next);
});

// Rota para notificações
router.get('/:id/notifications', authMiddleware, (req, res, next) => {
    getForumNotifications(req, res).catch(next);
});

export default router;
