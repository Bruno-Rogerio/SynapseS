// src/controllers/taskController.ts
import { Request, Response } from 'express';
import { Task } from '../models/Task';
import eventService from '../services/EventService';
import { EventTypes } from '../constants/EventTypes';

export const createTask = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, status, startDate, endDate, assignedTo, createdBy, points, comments, attachments, color } = req.body;

        const task = new Task({
            title,
            description,
            status,
            startDate,
            endDate,
            assignedTo,
            createdBy,
            points,
            comments,
            attachments,
            color
        });

        await task.save();

        // Notificar o usuário atribuído à tarefa
        try {
            if (assignedTo && assignedTo !== createdBy) {
                eventService.emit(EventTypes.TASK.ASSIGNED, {
                    taskId: task._id,
                    taskTitle: title,
                    taskDescription: description,
                    assigneeId: assignedTo,
                    assignerId: createdBy,
                    dueDate: endDate
                });
            }
        } catch (notifyError) {
            console.error('Error sending task assignment notification:', notifyError);
            // Continue with the main process even if notification fails
        }

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

        // Buscar a tarefa antes da atualização para comparar alterações
        const existingTask = await Task.findById(taskId);
        if (!existingTask) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        // Guardar os valores antigos importantes
        const previousStatus = existingTask.status;
        const previousAssignedTo = existingTask.assignedTo?.toString();

        // Atualizar a tarefa
        const task = await Task.findByIdAndUpdate(
            taskId,
            req.body,
            { new: true, runValidators: true }
        ).populate('assignedTo', 'username');

        if (!task) {
            res.status(404).json({ message: 'Task not found after update' });
            return;
        }

        // Enviar notificações sobre mudanças importantes
        try {
            const { status, assignedTo, createdBy } = task;

            // 1. Notificar se o status mudou para "concluída"
            if (previousStatus !== 'completed' && status === 'completed') {
                eventService.emit(EventTypes.TASK.COMPLETED, {
                    taskId: task._id,
                    taskTitle: task.title,
                    assigneeId: assignedTo,
                    completedBy: req.body.updatedBy || createdBy,
                    completionDate: new Date()
                });
            }

            // 2. Notificar se uma tarefa foi reatribuída a outro usuário
            const currentAssignedTo = assignedTo?.toString();
            if (previousAssignedTo !== currentAssignedTo && currentAssignedTo) {
                eventService.emit(EventTypes.TASK.ASSIGNED, {
                    taskId: task._id,
                    taskTitle: task.title,
                    taskDescription: task.description,
                    assigneeId: assignedTo,
                    assignerId: req.body.updatedBy || createdBy,
                    dueDate: task.endDate
                });
            }

            // 3. Verificar se a data de vencimento está próxima (se foi atualizada)
            if (req.body.endDate && task.endDate) {
                const dueDate = new Date(task.endDate);
                const now = new Date();
                const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                if (daysUntilDue > 0 && daysUntilDue <= 2 && assignedTo) {
                    eventService.emit(EventTypes.TASK.DUE_DATE_APPROACHING, {
                        taskId: task._id,
                        taskTitle: task.title,
                        assigneeId: assignedTo,
                        dueDate: task.endDate,
                        daysRemaining: daysUntilDue
                    });
                }
            }
        } catch (notifyError) {
            console.error('Error sending task update notifications:', notifyError);
            // Continue with the main process even if notification fails
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

        // Buscar a tarefa antes da atualização para comparar alterações
        const existingTask = await Task.findById(taskId);
        if (!existingTask) {
            res.status(404).json({ message: 'Task not found' });
            return;
        }

        // Guardar os valores antigos importantes
        const previousStatus = existingTask.status;
        const previousAssignedTo = existingTask.assignedTo?.toString();

        // Atualizar a tarefa
        const task = await Task.findByIdAndUpdate(
            taskId,
            { $set: req.body },
            { new: true, runValidators: true }
        ).populate('assignedTo', 'username');

        if (!task) {
            res.status(404).json({ message: 'Task not found after update' });
            return;
        }

        // Enviar notificações sobre mudanças importantes
        try {
            // 1. Notificar se o status mudou para "concluída"
            if (req.body.status && previousStatus !== 'completed' && req.body.status === 'completed') {
                eventService.emit(EventTypes.TASK.COMPLETED, {
                    taskId: task._id,
                    taskTitle: task.title,
                    assigneeId: task.assignedTo,
                    completedBy: req.body.updatedBy || task.createdBy,
                    completionDate: new Date()
                });
            }

            // 2. Notificar se uma tarefa foi reatribuída a outro usuário
            if (req.body.assignedTo && previousAssignedTo !== req.body.assignedTo) {
                eventService.emit(EventTypes.TASK.ASSIGNED, {
                    taskId: task._id,
                    taskTitle: task.title,
                    taskDescription: task.description,
                    assigneeId: task.assignedTo,
                    assignerId: req.body.updatedBy || task.createdBy,
                    dueDate: task.endDate
                });
            }

            // 3. Verificar se a data de vencimento está próxima (se foi atualizada)
            if (req.body.endDate && task.endDate) {
                const dueDate = new Date(task.endDate);
                const now = new Date();
                const daysUntilDue = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

                if (daysUntilDue > 0 && daysUntilDue <= 2 && task.assignedTo) {
                    eventService.emit(EventTypes.TASK.DUE_DATE_APPROACHING, {
                        taskId: task._id,
                        taskTitle: task.title,
                        assigneeId: task.assignedTo,
                        dueDate: task.endDate,
                        daysRemaining: daysUntilDue
                    });
                }
            }
        } catch (notifyError) {
            console.error('Error sending task update notifications:', notifyError);
            // Continue with the main process even if notification fails
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
