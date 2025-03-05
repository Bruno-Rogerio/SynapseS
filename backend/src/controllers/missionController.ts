// backend/src/controllers/missionController.ts
import { Request, Response } from 'express';
import Mission, { IMission, ICheckpoint } from '../models/Mission';
import { v4 as uuidv4 } from 'uuid';

const convertCheckpointStatus = (status: string): ICheckpoint['status'] => {
  switch (status) {
    case 'pending':
    case 'in_progress':
    case 'completed':
    case 'pendente':
    case 'em-progresso':
    case 'concluida':
      return status as ICheckpoint['status'];
    default:
      return 'pendente';
  }
};

export const createMission = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Dados recebidos para criar missão:', req.body);
    const { title, description, leader, members, tasks, startDate, endDate, status, checkpoints } = req.body;
    if (!members || !Array.isArray(members)) {
      res.status(400).json({ error: 'Membros não fornecidos ou inválidos.' });
      return;
    }
    if (!members.includes(leader)) {
      res.status(400).json({ error: 'O líder deve ser um dos membros da missão.' });
      return;
    }
    const missionData = {
      title,
      description,
      leader,
      members,
      tasks: Array.isArray(tasks)
        ? tasks.map((t: any) => ({
          id: uuidv4(),
          title: t.title,
          status: t.status ? t.status : 'pendente',
          assignedTo: t.assignedTo,
        }))
        : [],
      checkpoints: Array.isArray(checkpoints)
        ? checkpoints.map((cp: any) => ({
          id: uuidv4(),
          title: cp.title,
          dueDate: new Date(cp.dueDate),
          status: convertCheckpointStatus(cp.status || 'pendente'),
          assignedTo: cp.assignedTo,
        }))
        : [],
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      status: status ? status : 'pendente',
    };
    const mission: IMission = new Mission(missionData);
    await mission.save();
    console.log('Missão criada:', mission);
    res.status(201).json(mission.toJSON());
  } catch (error: any) {
    console.error('Erro ao criar missão:', error.message, error);
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
    console.log('Dados recebidos para atualizar missão:', req.body);
    const { id } = req.params;
    const { title, description, leader, members, tasks, startDate, endDate, status, checkpoints } = req.body;
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
    if (status) {
      mission.status = status as 'pendente' | 'em-progresso' | 'concluida';
    }
    if (tasks) {
      mission.tasks = tasks.map((t: any) => ({
        id: t.id || uuidv4(),
        title: t.title,
        status: t.status ? t.status : 'pendente',
        assignedTo: t.assignedTo,
      }));
    }
    if (checkpoints) {
      mission.checkpoints = checkpoints.map((cp: any) => ({
        id: cp.id || uuidv4(),
        title: cp.title,
        dueDate: new Date(cp.dueDate),
        status: convertCheckpointStatus(cp.status || 'pendente'),
        assignedTo: cp.assignedTo,
      }));
    }
    await mission.save();
    console.log('Missão atualizada:', mission);
    res.status(200).json(mission.toJSON());
  } catch (error: any) {
    console.error('Erro ao atualizar missão:', error.message, error);
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

export const addCheckpointToMission = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Dados recebidos para adicionar checkpoint:', req.body);
    const { missionId } = req.params;
    const { title, dueDate, status, user, assignedTo } = req.body;
    const mission = await Mission.findById(missionId);
    if (!mission) {
      res.status(404).json({ error: 'Missão não encontrada.' });
      return;
    }
    if (mission.leader !== user) {
      res.status(403).json({ error: 'Apenas o líder pode adicionar checkpoints.' });
      return;
    }
    const newCheckpoint: ICheckpoint = {
      id: uuidv4(),
      title,
      dueDate: new Date(dueDate),
      status: convertCheckpointStatus(status || 'pendente'),
      assignedTo,
    };
    mission.checkpoints.push(newCheckpoint);
    await mission.save();
    console.log('Checkpoint adicionado:', newCheckpoint);
    res.status(200).json(mission.toJSON());
  } catch (error) {
    console.error('Erro ao adicionar checkpoint:', error);
    res.status(500).json({ error: 'Erro ao adicionar checkpoint' });
  }
};

export const updateCheckpointStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { missionId, checkpointId } = req.params;
    const { status, user, assignedTo } = req.body;
    const mission = await Mission.findById(missionId);
    if (!mission) {
      res.status(404).json({ error: 'Missão não encontrada.' });
      return;
    }
    if (mission.leader !== user) {
      res.status(403).json({ error: 'Apenas o líder pode atualizar checkpoints.' });
      return;
    }
    const cpIndex = mission.checkpoints.findIndex(cp => cp.id === checkpointId);
    if (cpIndex === -1) {
      res.status(404).json({ error: 'Checkpoint não encontrado.' });
      return;
    }
    mission.checkpoints[cpIndex].status = convertCheckpointStatus(status);
    if (assignedTo) {
      mission.checkpoints[cpIndex].assignedTo = assignedTo;
    }
    await mission.save();
    res.status(200).json(mission.toJSON());
  } catch (error) {
    console.error('Erro ao atualizar status do checkpoint:', error);
    res.status(500).json({ error: 'Erro ao atualizar status do checkpoint' });
  }
};

export const deleteCheckpointFromMission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { missionId, checkpointId } = req.params;
    const mission = await Mission.findById(missionId);
    if (!mission) {
      res.status(404).json({ error: 'Missão não encontrada.' });
      return;
    }
    mission.checkpoints = mission.checkpoints.filter(cp => cp.id !== checkpointId);
    await mission.save();
    res.status(200).json(mission.toJSON());
  } catch (error) {
    console.error('Erro ao remover checkpoint:', error);
    res.status(500).json({ error: 'Erro ao remover checkpoint' });
  }
};
