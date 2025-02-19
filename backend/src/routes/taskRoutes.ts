import express from 'express';
import { createTask, getTasks, updateTask, deleteTask, updateTaskPartial } from '../controllers/taskController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = express.Router();

router.post('/', authMiddleware, createTask);
router.get('/', authMiddleware, getTasks);
router.put('/:taskId', authMiddleware, updateTask);
router.patch('/:taskId', authMiddleware, updateTaskPartial);
router.delete('/:taskId', authMiddleware, deleteTask);

export default router;
