import { Request, Response } from 'express';
import { Task } from '../models/Task';

export const createTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, status, startDate, endDate, assignedTo, createdBy, points, comments, attachments } = req.body;
        const task = new Task({ title, description, status, startDate, endDate, assignedTo, createdBy, points, comments, attachments });
        await task.save();
        res.status(201).json({ message: 'Task created successfully', task });
    } catch (error) {
        res.status(400).json({
            message: 'Error creating task',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

export const getTasks = async (req: Request, res: Response): Promise<void> => {
    try {
        const tasks = await Task.find().populate('assignedTo', 'username');
        res.json(tasks);
    } catch (error) {
        res.status(500).json({
            message: 'Error fetching tasks',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

export const updateTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const { taskId } = req.params;
        const task = await Task.findByIdAndUpdate(taskId, req.body, { new: true, runValidators: true });
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        res.json(task);
    } catch (error) {
        res.status(500).json({
            message: 'Error updating task',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

export const updateTaskPartial = async (req: Request, res: Response): Promise<void> => {
    try {
        const { taskId } = req.params;
        const task = await Task.findByIdAndUpdate(
            taskId,
            { $set: req.body },
            { new: true, runValidators: true }
        );
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        res.json(task);
    } catch (error) {
        res.status(500).json({
            message: 'Error updating task',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};

export const deleteTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const { taskId } = req.params;
        const task = await Task.findByIdAndDelete(taskId);
        if (!task) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }
        res.json({ message: 'Task deleted successfully' });
    } catch (error) {
        res.status(500).json({
            message: 'Error deleting task',
            error: error instanceof Error ? error.message : String(error)
        });
    }
};
