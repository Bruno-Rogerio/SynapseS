// backend/src/controllers/missionController.ts
import { Request, Response } from 'express';
import Mission, { IMission, ICheckpoint } from '../models/Mission';
import { User } from '../models/User';
import { v4 as uuidv4 } from 'uuid';
import eventService from '../services/EventService';
import { Types } from 'mongoose';

// Adicionando constantes de permissão para missões
const MISSION_PERMISSIONS = {
  MISSION_VIEW: 'mission:view',
  MISSION_CREATE: 'mission:create',
  MISSION_EDIT: 'mission:edit',
  MISSION_DELETE: 'mission:delete',
  MISSION_MANAGE_ALL: 'mission:manage_all'
};

/**
 * Converte status de checkpoint para formato consistente
 */
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

/**
 * Verifica se o usuário tem acesso à missão (é líder ou admin)
 */
const canManageMission = (userId: string, mission: IMission, isAdmin: boolean = false): boolean => {
  // Admins sempre podem gerenciar missões de sua empresa
  if (isAdmin) return true;

  // O líder da missão pode gerenciá-la
  return mission.leader === userId;
};

/**
 * Cria uma nova missão
 */
export const createMission = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Dados recebidos para criar missão:', req.body);
    const { title, description, leader, members, tasks, startDate, endDate, status, checkpoints } = req.body;

    // Verificar se o usuário está autenticado e tem empresa associada
    if (!req.user) {
      res.status(403).json({ error: 'Usuário não autenticado' });
      return;
    }

    const { userId, company } = req.user;

    if (!userId || !company) {
      res.status(403).json({ error: 'Usuário sem ID ou empresa associada' });
      return;
    }

    if (!members || !Array.isArray(members)) {
      res.status(400).json({ error: 'Membros não fornecidos ou inválidos.' });
      return;
    }

    if (!members.includes(leader)) {
      res.status(400).json({ error: 'O líder deve ser um dos membros da missão.' });
      return;
    }

    // Verificar se todos os membros pertencem à mesma empresa do usuário
    const memberUsers = await User.find({
      _id: { $in: members },
      company
    }).select('_id');

    const validMemberIds = memberUsers.map(m => (m._id as Types.ObjectId).toString());
    const invalidMembers = members.filter(id => !validMemberIds.includes(id.toString()));

    if (invalidMembers.length > 0) {
      res.status(400).json({
        error: 'Alguns membros não pertencem à sua empresa ou não existem',
        invalidMembers
      });
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
      company,
    };

    const mission = new Mission(missionData);
    await mission.save();
    console.log('Missão criada:', mission);

    // Notificar membros sobre a criação da missão
    try {
      // Excluir o líder da lista de notificação (ele já sabe que criou)
      const membersToNotify = members.filter(memberId => memberId !== leader);

      // Buscar nome do líder para incluir na notificação
      const leaderUser = await User.findById(leader);
      const leaderName = leaderUser ? (leaderUser as any).username || 'Líder' : 'Líder';

      // Emitir evento para cada membro da missão (exceto o líder)
      eventService.emit('mission.created', {
        missionId: mission._id.toString(),
        title: mission.title,
        description: mission.description,
        createdBy: leader,
        createdByName: leaderName,
        recipients: membersToNotify,
        company: company.toString()
      });

      // Notificar sobre tarefas atribuídas na criação da missão
      if (Array.isArray(tasks)) {
        tasks.forEach(task => {
          if (task.assignedTo && task.assignedTo !== leader) {
            eventService.emit('mission.task.assigned', {
              missionId: mission._id.toString(),
              missionTitle: mission.title,
              taskId: task.id,
              taskTitle: task.title,
              assigneeId: task.assignedTo,
              assignerId: leader,
              company: company.toString()
            });
          }
        });
      }
    } catch (notifyError) {
      console.error('Erro ao enviar notificações da missão:', notifyError);
      // Continuar mesmo se as notificações falharem
    }

    res.status(201).json(mission.toJSON());
  } catch (error: any) {
    console.error('Erro ao criar missão:', error.message, error);
    res.status(500).json({ error: 'Erro ao criar missão' });
  }
};

/**
 * Busca todas as missões da empresa do usuário
 */
export const getMissions = async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificar se o usuário está autenticado e tem empresa associada
    if (!req.user) {
      res.status(403).json({ error: 'Usuário não autenticado' });
      return;
    }

    const { company } = req.user;

    if (!company) {
      res.status(403).json({ error: 'Usuário sem empresa associada' });
      return;
    }

    // Filtrar por empresa do usuário
    const missions = await Mission.find({ company });

    // Simplesmente usar toJSON() em cada missão - o transform definido no modelo cuida da conversão
    const missionList = missions.map(m => m.toJSON());

    res.status(200).json(missionList);
  } catch (error) {
    console.error('Erro ao buscar missões:', error);
    res.status(500).json({ error: 'Erro ao buscar missões' });
  }
};

/**
 * Busca uma missão específica por ID
 */
export const getMissionById = async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificar se o usuário está autenticado e tem empresa associada
    if (!req.user) {
      res.status(403).json({ error: 'Usuário não autenticado' });
      return;
    }

    const { company } = req.user;

    if (!company) {
      res.status(403).json({ error: 'Usuário sem empresa associada' });
      return;
    }

    // Filtrar por ID e empresa do usuário
    const mission = await Mission.findOne({
      _id: req.params.id,
      company
    });

    if (!mission) {
      res.status(404).json({ error: 'Missão não encontrada' });
      return;
    }

    // Simplesmente usar toJSON() - não é necessário modificar _id
    res.status(200).json(mission.toJSON());
  } catch (error) {
    console.error('Erro ao buscar missão:', error);
    res.status(500).json({ error: 'Erro ao buscar missão' });
  }
};

/**
 * Atualiza uma missão existente
 */
export const updateMission = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Dados recebidos para atualizar missão:', req.body);
    const { id } = req.params;
    const { title, description, leader, members, tasks, startDate, endDate, status, checkpoints } = req.body;

    // Verificar se o usuário está autenticado e tem empresa associada
    if (!req.user) {
      res.status(403).json({ error: 'Usuário não autenticado' });
      return;
    }

    const { userId, company, permissions } = req.user;

    if (!userId || !company) {
      res.status(403).json({ error: 'Usuário sem ID ou empresa associada' });
      return;
    }

    // Buscar missão filtrando por empresa
    const mission = await Mission.findOne({
      _id: id,
      company
    });

    if (!mission) {
      res.status(404).json({ error: 'Missão não encontrada.' });
      return;
    }

    // Verificar se o usuário tem permissão para atualizar a missão
    const isAdmin = Array.isArray(permissions) &&
      permissions.includes(MISSION_PERMISSIONS.MISSION_MANAGE_ALL);
    const canManage = canManageMission(userId, mission, isAdmin);

    if (!canManage) {
      res.status(403).json({ error: 'Você não tem permissão para atualizar esta missão.' });
      return;
    }

    // Se membros serão atualizados, verificar se todos pertencem à mesma empresa
    if (members && Array.isArray(members)) {
      const memberUsers = await User.find({
        _id: { $in: members },
        company
      }).select('_id');

      const validMemberIds = memberUsers.map(m => (m._id as Types.ObjectId).toString());
      const invalidMembers = members.filter(id => !validMemberIds.includes(id.toString()));

      if (invalidMembers.length > 0) {
        res.status(400).json({
          error: 'Alguns membros não pertencem à sua empresa ou não existem',
          invalidMembers
        });
        return;
      }
    }

    // Armazenar estado anterior para comparar mudanças
    const previousStatus = mission.status;
    const previousMembers = [...mission.members];

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

    const missionId = mission._id.toString();

    // Notificar sobre mudanças importantes
    try {
      // 1. Notificar se o status mudou
      if (previousStatus !== mission.status) {
        eventService.emit('mission.status.updated', {
          missionId,
          missionTitle: mission.title,
          oldStatus: previousStatus,
          newStatus: mission.status,
          updatedBy: userId,
          recipients: mission.members.filter(m => m !== userId),
          company: company.toString()
        });
      }

      // 2. Notificar novos membros adicionados à missão
      const newMembers = mission.members.filter(m => !previousMembers.includes(m));
      if (newMembers.length > 0) {
        eventService.emit('mission.member.added', {
          missionId,
          missionTitle: mission.title,
          addedMembers: newMembers,
          addedBy: userId,
          company: company.toString()
        });
      }
    } catch (notifyError) {
      console.error('Erro ao enviar notificações de atualização da missão:', notifyError);
      // Continuar mesmo se as notificações falharem
    }

    // Simplesmente enviar o resultado de toJSON()
    res.status(200).json(mission.toJSON());
  } catch (error: any) {
    console.error('Erro ao atualizar missão:', error.message, error);
    res.status(500).json({ error: 'Erro ao atualizar missão' });
  }
};

/**
 * Remove uma missão
 */
export const deleteMission = async (req: Request, res: Response): Promise<void> => {
  try {
    // Verificar se o usuário está autenticado e tem empresa associada
    if (!req.user) {
      res.status(403).json({ error: 'Usuário não autenticado' });
      return;
    }

    const { userId, company, permissions } = req.user;

    if (!userId || !company) {
      res.status(403).json({ error: 'Usuário sem ID ou empresa associada' });
      return;
    }

    // Buscar missão filtrando por empresa
    const mission = await Mission.findOne({
      _id: req.params.id,
      company
    });

    if (!mission) {
      res.status(404).json({ error: 'Missão não encontrada.' });
      return;
    }

    // Verificar se o usuário tem permissão para excluir a missão
    const isAdmin = Array.isArray(permissions) &&
      permissions.includes(MISSION_PERMISSIONS.MISSION_MANAGE_ALL);
    const canManage = canManageMission(userId, mission, isAdmin);

    if (!canManage) {
      res.status(403).json({ error: 'Você não tem permissão para excluir esta missão.' });
      return;
    }

    await Mission.findByIdAndDelete(req.params.id);

    res.status(200).json({ message: 'Missão removida com sucesso.' });
  } catch (error) {
    console.error('Erro ao remover missão:', error);
    res.status(500).json({ error: 'Erro ao remover missão.' });
  }
};

/**
 * Adiciona uma tarefa a uma missão
 */
export const addTaskToMission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { missionId } = req.params;
    const { title, assignedTo } = req.body;

    // Verificar se o usuário está autenticado e tem empresa associada
    if (!req.user) {
      res.status(403).json({ error: 'Usuário não autenticado' });
      return;
    }

    const { userId, company, permissions } = req.user;

    if (!userId || !company) {
      res.status(403).json({ error: 'Usuário sem ID ou empresa associada' });
      return;
    }

    // Buscar missão filtrando por empresa
    const mission = await Mission.findOne({
      _id: missionId,
      company
    });

    if (!mission) {
      res.status(404).json({ error: 'Missão não encontrada.' });
      return;
    }

    // Verificar se o usuário tem permissão para gerenciar a missão
    const isAdmin = Array.isArray(permissions) &&
      permissions.includes(MISSION_PERMISSIONS.MISSION_MANAGE_ALL);
    const canManage = canManageMission(userId, mission, isAdmin);

    if (!canManage) {
      res.status(403).json({ error: 'Você não tem permissão para adicionar tarefas a esta missão.' });
      return;
    }

    // Verificar se o usuário atribuído pertence à empresa
    if (assignedTo) {
      const assignedUser = await User.findOne({
        _id: assignedTo,
        company
      });

      if (!assignedUser) {
        res.status(400).json({ error: 'O usuário atribuído não pertence à sua empresa ou não existe.' });
        return;
      }
    }

    const newTask = {
      id: uuidv4(),
      title,
      assignedTo,
      status: 'pendente' as 'pendente' | 'em-progresso' | 'concluida',
    };

    mission.tasks.push(newTask);
    await mission.save();

    const missionIdStr = mission._id.toString();

    // Notificar o usuário atribuído à tarefa
    try {
      if (assignedTo && assignedTo !== userId) {
        eventService.emit('mission.task.assigned', {
          missionId: missionIdStr,
          missionTitle: mission.title,
          taskId: newTask.id,
          taskTitle: newTask.title,
          assigneeId: assignedTo,
          assignerId: userId,
          company: company.toString()
        });
      }
    } catch (notifyError) {
      console.error('Erro ao enviar notificação de atribuição de tarefa:', notifyError);
    }

    // Simplesmente enviar o resultado de toJSON()
    res.status(200).json(mission.toJSON());
  } catch (error) {
    console.error('Erro ao adicionar tarefa:', error);
    res.status(500).json({ error: 'Erro ao adicionar tarefa' });
  }
};

/**
 * Atualiza o status de uma tarefa
 */
export const updateTaskStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { missionId, taskId } = req.params;
    const { status } = req.body;

    // Verificar se o usuário está autenticado e tem empresa associada
    if (!req.user) {
      res.status(403).json({ error: 'Usuário não autenticado' });
      return;
    }

    const { userId, company, permissions } = req.user;

    if (!userId || !company) {
      res.status(403).json({ error: 'Usuário sem ID ou empresa associada' });
      return;
    }

    // Buscar missão filtrando por empresa
    const mission = await Mission.findOne({
      _id: missionId,
      company
    });

    if (!mission) {
      res.status(404).json({ error: 'Missão não encontrada.' });
      return;
    }

    // Verificar se o usuário tem permissão para atualizar a missão
    const isAdmin = Array.isArray(permissions) &&
      permissions.includes(MISSION_PERMISSIONS.MISSION_MANAGE_ALL);
    const canManage = canManageMission(userId, mission, isAdmin);

    if (!canManage) {
      res.status(403).json({ error: 'Você não tem permissão para atualizar tarefas desta missão.' });
      return;
    }

    const taskIndex = mission.tasks.findIndex(task => task.id === taskId);
    if (taskIndex === -1) {
      res.status(404).json({ error: 'Tarefa não encontrada.' });
      return;
    }

    const previousStatus = mission.tasks[taskIndex].status;
    mission.tasks[taskIndex].status = status as 'pendente' | 'em-progresso' | 'concluida';

    await mission.save();

    const missionIdStr = mission._id.toString();

    // Notificar sobre atualização do status da tarefa
    try {
      const assignedTo = mission.tasks[taskIndex].assignedTo;
      if (assignedTo && assignedTo !== userId && previousStatus !== status) {
        eventService.emit('mission.task.status.updated', {
          missionId: missionIdStr,
          missionTitle: mission.title,
          taskId: taskId,
          taskTitle: mission.tasks[taskIndex].title,
          oldStatus: previousStatus,
          newStatus: status,
          assigneeId: assignedTo,
          updatedBy: userId,
          company: company.toString()
        });

        // Notificação especial para conclusão de tarefa
        if (status === 'concluida') {
          eventService.emit('mission.task.completed', {
            missionId: missionIdStr,
            missionTitle: mission.title,
            taskId: taskId,
            taskTitle: mission.tasks[taskIndex].title,
            assigneeId: assignedTo,
            completedBy: userId,
            company: company.toString()
          });
        }
      }
    } catch (notifyError) {
      console.error('Erro ao enviar notificação de atualização de status:', notifyError);
    }

    // Simplesmente enviar o resultado de toJSON()
    res.status(200).json(mission.toJSON());
  } catch (error) {
    console.error('Erro ao atualizar status da tarefa:', error);
    res.status(500).json({ error: 'Erro ao atualizar status da tarefa' });
  }
};

/**
 * Adiciona um checkpoint a uma missão
 */
export const addCheckpointToMission = async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('Dados recebidos para adicionar checkpoint:', req.body);
    const { missionId } = req.params;
    const { title, dueDate, status, assignedTo } = req.body;

    // Verificar se o usuário está autenticado e tem empresa associada
    if (!req.user) {
      res.status(403).json({ error: 'Usuário não autenticado' });
      return;
    }

    const { userId, company, permissions } = req.user;

    if (!userId || !company) {
      res.status(403).json({ error: 'Usuário sem ID ou empresa associada' });
      return;
    }

    // Buscar missão filtrando por empresa
    const mission = await Mission.findOne({
      _id: missionId,
      company
    });

    if (!mission) {
      res.status(404).json({ error: 'Missão não encontrada.' });
      return;
    }

    // Verificar se o usuário tem permissão para gerenciar a missão
    const isAdmin = Array.isArray(permissions) &&
      permissions.includes(MISSION_PERMISSIONS.MISSION_MANAGE_ALL);
    const canManage = canManageMission(userId, mission, isAdmin);

    if (!canManage) {
      res.status(403).json({ error: 'Você não tem permissão para adicionar checkpoints a esta missão.' });
      return;
    }

    // Verificar se o usuário atribuído pertence à empresa
    if (assignedTo) {
      const assignedUser = await User.findOne({
        _id: assignedTo,
        company
      });

      if (!assignedUser) {
        res.status(400).json({ error: 'O usuário atribuído não pertence à sua empresa ou não existe.' });
        return;
      }
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

    const missionIdStr = mission._id.toString();

    // Notificar usuário atribuído ao checkpoint
    try {
      if (assignedTo && assignedTo !== userId) {
        eventService.emit('mission.checkpoint.assigned', {
          missionId: missionIdStr,
          missionTitle: mission.title,
          checkpointId: newCheckpoint.id,
          checkpointTitle: newCheckpoint.title,
          checkpointDueDate: newCheckpoint.dueDate,
          assigneeId: assignedTo,
          assignerId: userId,
          company: company.toString()
        });
      }
    } catch (notifyError) {
      console.error('Erro ao enviar notificação de atribuição de checkpoint:', notifyError);
    }

    // Simplesmente enviar o resultado de toJSON()
    res.status(200).json(mission.toJSON());
  } catch (error) {
    console.error('Erro ao adicionar checkpoint:', error);
    res.status(500).json({ error: 'Erro ao adicionar checkpoint' });
  }
};

/**
 * Atualiza o status de um checkpoint
 */
export const updateCheckpointStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { missionId, checkpointId } = req.params;
    const { status, assignedTo } = req.body;

    // Verificar se o usuário está autenticado e tem empresa associada
    if (!req.user) {
      res.status(403).json({ error: 'Usuário não autenticado' });
      return;
    }

    const { userId, company, permissions } = req.user;

    if (!userId || !company) {
      res.status(403).json({ error: 'Usuário sem ID ou empresa associada' });
      return;
    }

    // Buscar missão filtrando por empresa
    const mission = await Mission.findOne({
      _id: missionId,
      company
    });

    if (!mission) {
      res.status(404).json({ error: 'Missão não encontrada.' });
      return;
    }

    // Verificar se o usuário tem permissão para atualizar a missão
    const isAdmin = Array.isArray(permissions) &&
      permissions.includes(MISSION_PERMISSIONS.MISSION_MANAGE_ALL);
    const canManage = canManageMission(userId, mission, isAdmin);

    if (!canManage) {
      res.status(403).json({ error: 'Você não tem permissão para atualizar checkpoints desta missão.' });
      return;
    }

    const cpIndex = mission.checkpoints.findIndex(cp => cp.id === checkpointId);
    if (cpIndex === -1) {
      res.status(404).json({ error: 'Checkpoint não encontrado.' });
      return;
    }

    const previousStatus = mission.checkpoints[cpIndex].status;
    const previousAssignee = mission.checkpoints[cpIndex].assignedTo;

    mission.checkpoints[cpIndex].status = convertCheckpointStatus(status);

    // Se um novo responsável for atribuído, verificar se ele existe e pertence à empresa
    if (assignedTo) {
      const assignedUser = await User.findOne({
        _id: assignedTo,
        company
      });

      if (!assignedUser) {
        res.status(400).json({ error: 'O usuário atribuído não pertence à sua empresa ou não existe.' });
        return;
      }

      mission.checkpoints[cpIndex].assignedTo = assignedTo;
    }

    await mission.save();

    const missionIdStr = mission._id.toString();

    // Notificar sobre mudanças importantes no checkpoint
    try {
      const currentAssignee = mission.checkpoints[cpIndex].assignedTo;

      // Notificar sobre mudança de status (se houver alguém atribuído)
      if (currentAssignee && currentAssignee !== userId && previousStatus !== status) {
        eventService.emit('mission.checkpoint.status.updated', {
          missionId: missionIdStr,
          missionTitle: mission.title,
          checkpointId: checkpointId,
          checkpointTitle: mission.checkpoints[cpIndex].title,
          oldStatus: previousStatus,
          newStatus: mission.checkpoints[cpIndex].status,
          assigneeId: currentAssignee,
          updatedBy: userId,
          company: company.toString()
        });
      }

      // Notificar sobre mudança de responsável (se for alguém novo)
      if (assignedTo && previousAssignee !== assignedTo) {
        eventService.emit('mission.checkpoint.assigned', {
          missionId: missionIdStr,
          missionTitle: mission.title,
          checkpointId: checkpointId,
          checkpointTitle: mission.checkpoints[cpIndex].title,
          checkpointDueDate: mission.checkpoints[cpIndex].dueDate,
          assigneeId: assignedTo,
          assignerId: userId,
          company: company.toString()
        });
      }
    } catch (notifyError) {
      console.error('Erro ao enviar notificações de atualização de checkpoint:', notifyError);
    }

    // Simplesmente enviar o resultado de toJSON()
    res.status(200).json(mission.toJSON());
  } catch (error) {
    console.error('Erro ao atualizar status do checkpoint:', error);
    res.status(500).json({ error: 'Erro ao atualizar status do checkpoint' });
  }
};

/**
 * Remove um checkpoint de uma missão
 */
export const deleteCheckpointFromMission = async (req: Request, res: Response): Promise<void> => {
  try {
    const { missionId, checkpointId } = req.params;

    // Verificar se o usuário está autenticado e tem empresa associada
    if (!req.user) {
      res.status(403).json({ error: 'Usuário não autenticado' });
      return;
    }

    const { userId, company, permissions } = req.user;

    if (!userId || !company) {
      res.status(403).json({ error: 'Usuário sem ID ou empresa associada' });
      return;
    }

    // Buscar missão filtrando por empresa
    const mission = await Mission.findOne({
      _id: missionId,
      company
    });

    if (!mission) {
      res.status(404).json({ error: 'Missão não encontrada.' });
      return;
    }

    // Verificar se o usuário tem permissão para gerenciar a missão
    const isAdmin = Array.isArray(permissions) &&
      permissions.includes(MISSION_PERMISSIONS.MISSION_MANAGE_ALL);
    const canManage = canManageMission(userId, mission, isAdmin);

    if (!canManage) {
      res.status(403).json({ error: 'Você não tem permissão para remover checkpoints desta missão.' });
      return;
    }

    mission.checkpoints = mission.checkpoints.filter(cp => cp.id !== checkpointId);
    await mission.save();

    // Simplesmente enviar o resultado de toJSON()
    res.status(200).json(mission.toJSON());
  } catch (error) {
    console.error('Erro ao remover checkpoint:', error);
    res.status(500).json({ error: 'Erro ao remover checkpoint' });
  }
};

/**
 * Busca missões por membro
 */
export const getMissionsByMember = async (req: Request, res: Response): Promise<void> => {
  try {
    const { memberId } = req.params;

    // Verificar se o usuário está autenticado e tem empresa associada
    if (!req.user) {
      res.status(403).json({ error: 'Usuário não autenticado' });
      return;
    }

    const { company } = req.user;

    if (!company) {
      res.status(403).json({ error: 'Usuário sem empresa associada' });
      return;
    }

    // Verificar se o membro pertence à empresa do usuário
    const member = await User.findOne({
      _id: memberId,
      company
    });

    if (!member) {
      res.status(404).json({ error: 'Membro não encontrado na sua empresa.' });
      return;
    }

    // Buscar missões onde o usuário especificado é membro
    const missions = await Mission.find({
      members: memberId,
      company
    });

    // Simplesmente usar toJSON() em cada missão
    const missionList = missions.map(m => m.toJSON());

    res.status(200).json(missionList);
  } catch (error) {
    console.error('Erro ao buscar missões por membro:', error);
    res.status(500).json({ error: 'Erro ao buscar missões por membro' });
  }
};
