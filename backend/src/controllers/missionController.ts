import { Request, Response } from 'express';
import { Mission, MissionData, Task } from '../models/Mission';
import { v4 as uuidv4 } from 'uuid';

const missions: Mission[] = [];

export const createMission = (req: Request, res: Response): void => {
    const { title, description, leader, members, tasks, startDate, endDate } = req.body;

    if (!members.includes(leader)) {
        res.status(400).json({ error: 'O líder deve ser um dos membros da missão.' });
        return;
    }

    const missionData: MissionData = {
        id: uuidv4(),
        title,
        description,
        leader,
        members,
        tasks: (tasks || []).map((t: any) => ({
            id: uuidv4(),
            title: t.title,
            status: t.status || 'pendente',
            assignedTo: t.assignedTo
        })),
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : undefined
    };

    const mission = new Mission(missionData);
    missions.push(mission);
    res.status(201).json(mission.toJSON());
};

export const getMissions = (req: Request, res: Response): void => {
    res.json(missions.map(m => m.toJSON()));
};

export const getMissionById = (req: Request, res: Response): void => {
    const mission = missions.find(m => m.id === req.params.id);
    if (!mission) {
        res.status(404).json({ error: 'Missão não encontrada' });
        return;
    }
    res.json(mission.toJSON());
};

export const updateTaskStatus = (req: Request, res: Response): void => {
    const { missionId, taskId } = req.params;
    const { status, user } = req.body;

    const mission = missions.find(m => m.id === missionId);
    if (!mission) {
        res.status(404).json({ error: 'Missão não encontrada' });
        return;
    }

    if (mission.leader !== user) {
        res.status(403).json({ error: 'Apenas o líder pode atualizar tarefas.' });
        return;
    }

    mission.updateTaskStatus(taskId, status);
    res.json(mission.toJSON());
};

export const addTaskToMission = (req: Request, res: Response): void => {
    const { missionId } = req.params;
    const { title, assignedTo, user } = req.body;

    const mission = missions.find(m => m.id === missionId);
    if (!mission) {
        res.status(404).json({ error: 'Missão não encontrada' });
        return;
    }

    if (mission.leader !== user) {
        res.status(403).json({ error: 'Apenas o líder pode adicionar tarefas.' });
        return;
    }

    const task: Task = {
        id: uuidv4(),
        title,
        assignedTo,
        status: 'pendente'
    };

    mission.addTask(task);
    res.json(mission.toJSON());
};
