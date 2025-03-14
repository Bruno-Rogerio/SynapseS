import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { Task, Mission, User } from '../types';
import { useAuth } from '../hooks/useAuth';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

interface UseTaskMissionReturn {
    tasks: Task[];
    missions: Mission[];
    users: User[];
    loading: boolean;
    error: string | null;
    fetchTasks: () => Promise<void>;
    fetchMissions: () => Promise<void>;
    fetchUsers: () => Promise<void>;
    createTask: (task: Omit<Task, '_id'>) => Promise<Task>;
    updateTask: (task: Task) => Promise<Task>;
    deleteTask: (taskId: string) => Promise<void>;
    createMission: (mission: Omit<Mission, '_id'>) => Promise<Mission>;
    updateMission: (mission: Mission) => Promise<Mission>;
    deleteMission: (missionId: string) => Promise<void>;
}

export const useTaskMission = (): UseTaskMissionReturn => {
    // Integração com o sistema de autenticação
    const { user, isAuthenticated } = useAuth();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Função para obter token de autenticação
    const getToken = () => localStorage.getItem('auth_token') || '';

    // Extrair o ID da empresa do usuário (lidando com diferentes formatos possíveis)
    const companyId = useMemo(() => {
        if (!user?.company) return null;
        if (typeof user.company === 'object' && user.company !== null) {
            // Usar asserção de tipo para company como objeto
            const companyObj = user.company as { _id: string };
            return companyObj._id;
        }
        // Caso seja um ID direto (string)
        return user.company as string;
    }, [user]);

    // Funções de utilidade para verificar permissões
    const hasPermission = (permission: string): boolean => {
        if (!user?.permissions) return false;
        return user.permissions.includes(permission) || user.permissions.includes('admin');
    };

    const checkPermission = (permission: string, action: string): boolean => {
        if (!hasPermission(permission)) {
            setError(`Permissão negada: você não pode ${action}`);
            return false;
        }
        return true;
    };

    // Função para criar cabeçalhos com autenticação
    const getAuthHeaders = () => ({
        headers: { Authorization: `Bearer ${getToken()}` }
    });

    // Buscar tarefas com autenticação e filtro por empresa
    const fetchTasks = async () => {
        if (!isAuthenticated) {
            setError('Autenticação necessária para buscar tarefas');
            return;
        }

        if (!checkPermission('view_tasks', 'visualizar tarefas')) return;

        try {
            const response = await axios.get<Task[]>(`${API_BASE_URL}/tasks`, {
                ...getAuthHeaders(),
                params: { companyId } // Filtrar por empresa
            });
            setTasks(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching tasks:', err);
            setError('Erro ao buscar tarefas');
        }
    };

    // Buscar missões com autenticação e filtro por empresa
    const fetchMissions = async () => {
        if (!isAuthenticated) {
            setError('Autenticação necessária para buscar missões');
            return;
        }

        if (!checkPermission('view_missions', 'visualizar missões')) return;

        try {
            const response = await axios.get<Mission[]>(`${API_BASE_URL}/missions`, {
                ...getAuthHeaders(),
                params: { companyId } // Filtrar por empresa
            });
            setMissions(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching missions:', err);
            setError('Erro ao buscar missões');
        }
    };

    // Buscar usuários com autenticação e filtro por empresa
    const fetchUsers = async () => {
        if (!isAuthenticated) {
            setError('Autenticação necessária para buscar usuários');
            return;
        }

        if (!checkPermission('view_users', 'visualizar usuários')) return;

        try {
            const response = await axios.get<User[]>(`${API_BASE_URL}/users`, {
                ...getAuthHeaders(),
                params: { companyId } // Filtrar por empresa
            });
            setUsers(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching users:', err);
            setError('Erro ao buscar usuários');
        }
    };

    // Efeito para buscar dados iniciais após autenticação
    useEffect(() => {
        const fetchData = async () => {
            if (isAuthenticated) {
                setLoading(true);
                await Promise.all([fetchTasks(), fetchMissions(), fetchUsers()]);
                setLoading(false);
            }
        };

        fetchData();
    }, [isAuthenticated, companyId]); // Re-fetch quando a empresa mudar

    // Criar tarefa com autenticação e associação à empresa
    const createTask = async (task: Omit<Task, '_id'>): Promise<Task> => {
        if (!isAuthenticated) {
            throw new Error('Autenticação necessária para criar tarefas');
        }

        if (!checkPermission('create_tasks', 'criar tarefas')) {
            throw new Error('Permissão negada: você não pode criar tarefas');
        }

        try {
            // Associar a tarefa à empresa do usuário
            const taskWithCompany = {
                ...task,
                companyId: companyId
            };

            const response = await axios.post<Task>(
                `${API_BASE_URL}/tasks`,
                taskWithCompany,
                getAuthHeaders()
            );

            setTasks(prevTasks => [...prevTasks, response.data]);
            setError(null);
            return response.data;
        } catch (err) {
            console.error('Error creating task:', err);
            setError('Erro ao criar tarefa');
            throw err;
        }
    };

    // Atualizar tarefa com autenticação e verificação de permissão
    const updateTask = async (task: Task): Promise<Task> => {
        if (!isAuthenticated) {
            throw new Error('Autenticação necessária para atualizar tarefas');
        }

        if (!checkPermission('edit_tasks', 'editar tarefas')) {
            throw new Error('Permissão negada: você não pode editar tarefas');
        }

        try {
            const response = await axios.put<Task>(
                `${API_BASE_URL}/tasks/${task._id}`,
                task,
                getAuthHeaders()
            );

            setTasks(prevTasks =>
                prevTasks.map(t => t._id === task._id ? response.data : t)
            );

            setError(null);
            return response.data;
        } catch (err) {
            console.error('Error updating task:', err);
            setError('Erro ao atualizar tarefa');
            throw err;
        }
    };

    // Excluir tarefa com autenticação e verificação de permissão
    const deleteTask = async (taskId: string): Promise<void> => {
        if (!isAuthenticated) {
            throw new Error('Autenticação necessária para excluir tarefas');
        }

        if (!checkPermission('delete_tasks', 'excluir tarefas')) {
            throw new Error('Permissão negada: você não pode excluir tarefas');
        }

        try {
            await axios.delete(
                `${API_BASE_URL}/tasks/${taskId}`,
                getAuthHeaders()
            );

            setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
            setError(null);
        } catch (err) {
            console.error('Error deleting task:', err);
            setError('Erro ao excluir tarefa');
            throw err;
        }
    };

    // Criar missão com autenticação e associação à empresa
    const createMission = async (mission: Omit<Mission, '_id'>): Promise<Mission> => {
        if (!isAuthenticated) {
            throw new Error('Autenticação necessária para criar missões');
        }

        if (!checkPermission('create_missions', 'criar missões')) {
            throw new Error('Permissão negada: você não pode criar missões');
        }

        try {
            // Associar a missão à empresa do usuário
            const missionWithCompany = {
                ...mission,
                companyId: companyId
            };

            const response = await axios.post<Mission>(
                `${API_BASE_URL}/missions`,
                missionWithCompany,
                getAuthHeaders()
            );

            setMissions(prevMissions => [...prevMissions, response.data]);
            setError(null);
            return response.data;
        } catch (err) {
            console.error('Error creating mission:', err);
            setError('Erro ao criar missão');
            throw err;
        }
    };

    // Atualizar missão com autenticação e verificação de permissão
    const updateMission = async (mission: Mission): Promise<Mission> => {
        if (!isAuthenticated) {
            throw new Error('Autenticação necessária para atualizar missões');
        }

        if (!checkPermission('edit_missions', 'editar missões')) {
            throw new Error('Permissão negada: você não pode editar missões');
        }

        try {
            const response = await axios.put<Mission>(
                `${API_BASE_URL}/missions/${mission._id}`,
                mission,
                getAuthHeaders()
            );

            setMissions(prevMissions =>
                prevMissions.map(m => m._id === mission._id ? response.data : m)
            );

            setError(null);
            return response.data;
        } catch (err) {
            console.error('Error updating mission:', err);
            setError('Erro ao atualizar missão');
            throw err;
        }
    };

    // Excluir missão com autenticação e verificação de permissão
    const deleteMission = async (missionId: string): Promise<void> => {
        if (!isAuthenticated) {
            throw new Error('Autenticação necessária para excluir missões');
        }

        if (!checkPermission('delete_missions', 'excluir missões')) {
            throw new Error('Permissão negada: você não pode excluir missões');
        }

        try {
            await axios.delete(
                `${API_BASE_URL}/missions/${missionId}`,
                getAuthHeaders()
            );

            setMissions(prevMissions => prevMissions.filter(mission => mission._id !== missionId));
            setError(null);
        } catch (err) {
            console.error('Error deleting mission:', err);
            setError('Erro ao excluir missão');
            throw err;
        }
    };

    return {
        tasks,
        missions,
        users,
        loading,
        error,
        fetchTasks,
        fetchMissions,
        fetchUsers,
        createTask,
        updateTask,
        deleteTask,
        createMission,
        updateMission,
        deleteMission,
    };
};

export default useTaskMission;
