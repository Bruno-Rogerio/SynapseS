// backend/src/controllers/missionController.ts
import { Request, Response } from 'express';
import Mission, { IMission } from '../models/Mission';
import { v4 as uuidv4 } from 'uuid';

export const createMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { title, description, leader, members, tasks, startDate, endDate } = req.body;

        // Verifica se members foi enviado e se é um array
        if (!members || !Array.isArray(members)) {
            res.status(400).json({ error: 'Membros não fornecidos ou inválidos.' });
            return;
        }
        // Verifica se o líder está incluído no array de membros
        if (!members.includes(leader)) {
            res.status(400).json({ error: 'O líder deve ser um dos membros da missão.' });
            return;
        }

        const missionData = {
            title,
            description,
            leader,
            members,
            tasks: (tasks || []).map((t: any) => ({
                id: uuidv4(),
                title: t.title,
                status: (t.status || 'pendente') as 'pendente' | 'em-progresso' | 'concluida',
                assignedTo: t.assignedTo,
            })),
            startDate: new Date(startDate),
            endDate: endDate ? new Date(endDate) : undefined,
        };

        const mission: IMission = new Mission(missionData);
        await mission.save();
        res.status(201).json(mission.toJSON());
    } catch (error) {
        console.error('Erro ao criar missão:', error);
        res.status(500).json({ error: 'Erro ao criar missão' });
    }
};

export const getMissions = async (req: Request, res: Response): Promise<void> => {
    try {
        const missions = await Mission.find();
        res.status(200).json(missions.map(m => m.toJSON()));
    } catch (error) {
        console.error('Erro ao buscar missões:', error);
        res.status(500).json({ error: 'Erro ao buscar missões' });
    }
};

export const getMissionById = async (req: Request, res: Response): Promise<void> => {
    try {
        const mission = await Mission.findById(req.params.id);
        if (!mission) {
            res.status(404).json({ error: 'Missão não encontrada' });
            return;
        }
        res.status(200).json(mission.toJSON());
    } catch (error) {
        console.error('Erro ao buscar missão:', error);
        res.status(500).json({ error: 'Erro ao buscar missão' });
    }
};

export const updateMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { title, description, leader, members, tasks, startDate, endDate } = req.body;

        const mission = await Mission.findById(id);
        if (!mission) {
            res.status(404).json({ error: 'Missão não encontrada.' });
            return;
        }

        mission.title = title || mission.title;
        mission.description = description || mission.description;
        mission.leader = leader || mission.leader;
        mission.members = members || mission.members;
        mission.startDate = startDate ? new Date(startDate) : mission.startDate;
        mission.endDate = endDate ? new Date(endDate) : mission.endDate;

        if (tasks) {
            mission.tasks = tasks.map((t: any) => ({
                id: t.id || uuidv4(),
                title: t.title,
                status: (t.status || 'pendente') as 'pendente' | 'em-progresso' | 'concluida',
                assignedTo: t.assignedTo,
            }));
        }

        await mission.save();
        res.status(200).json(mission.toJSON());
    } catch (error) {
        console.error('Erro ao atualizar missão:', error);
        res.status(500).json({ error: 'Erro ao atualizar missão' });
    }
};

export const deleteMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const mission = await Mission.findByIdAndDelete(req.params.id);
        if (!mission) {
            res.status(404).json({ error: 'Missão não encontrada.' });
            return;
        }
        res.status(200).json({ message: 'Missão removida com sucesso.' });
    } catch (error) {
        console.error('Erro ao remover missão:', error);
        res.status(500).json({ error: 'Erro ao remover missão.' });
    }
};

export const addTaskToMission = async (req: Request, res: Response): Promise<void> => {
    try {
        const { missionId } = req.params;
        const { title, assignedTo, user } = req.body;

        const mission = await Mission.findById(missionId);
        if (!mission) {
            res.status(404).json({ error: 'Missão não encontrada.' });
            return;
        }

        // Verifica se o usuário informado é o líder da missão
        if (mission.leader !== user) {
            res.status(403).json({ error: 'Apenas o líder pode adicionar tarefas.' });
            return;
        }

        const newTask = {
            id: uuidv4(),
            title,
            assignedTo,
            status: 'pendente' as 'pendente' | 'em-progresso' | 'concluida',
        };

        mission.tasks.push(newTask);
        await mission.save();
        res.status(200).json(mission.toJSON());
    } catch (error) {
        console.error('Erro ao adicionar tarefa:', error);
        res.status(500).json({ error: 'Erro ao adicionar tarefa' });
    }
};

export const updateTaskStatus = async (req: Request, res: Response): Promise<void> => {
    try {
        const { missionId, taskId } = req.params;
        const { status, user } = req.body;

        const mission = await Mission.findById(missionId);
        if (!mission) {
            res.status(404).json({ error: 'Missão não encontrada.' });
            return;
        }

        if (mission.leader !== user) {
            res.status(403).json({ error: 'Apenas o líder pode atualizar tarefas.' });
            return;
        }

        const taskIndex = mission.tasks.findIndex(task => task.id === taskId);
        if (taskIndex === -1) {
            res.status(404).json({ error: 'Tarefa não encontrada.' });
            return;
        }

        mission.tasks[taskIndex].status = status as 'pendente' | 'em-progresso' | 'concluida';
        await mission.save();
        res.status(200).json(mission.toJSON());
    } catch (error) {
        console.error('Erro ao atualizar status da tarefa:', error);
        res.status(500).json({ error: 'Erro ao atualizar status da tarefa' });
    }
};
