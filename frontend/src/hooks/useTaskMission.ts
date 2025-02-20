import { useState, useEffect } from 'react';
import axios from 'axios';
import { Task, Mission, User } from '../types';

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
    const [tasks, setTasks] = useState<Task[]>([]);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchTasks = async () => {
        try {
            const response = await axios.get<Task[]>(`${API_BASE_URL}/tasks`);
            setTasks(response.data);
        } catch (err) {
            setError('Error fetching tasks');
        }
    };

    const fetchMissions = async () => {
        try {
            const response = await axios.get<Mission[]>(`${API_BASE_URL}/missions`);
            setMissions(response.data);
        } catch (err) {
            setError('Error fetching missions');
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get<User[]>(`${API_BASE_URL}/users`);
            setUsers(response.data);
        } catch (err) {
            setError('Error fetching users');
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            await Promise.all([fetchTasks(), fetchMissions(), fetchUsers()]);
            setLoading(false);
        };
        fetchData();
    }, []);

    const createTask = async (task: Omit<Task, '_id'>): Promise<Task> => {
        const response = await axios.post<Task>(`${API_BASE_URL}/tasks`, task);
        setTasks(prevTasks => [...prevTasks, response.data]);
        return response.data;
    };

    const updateTask = async (task: Task): Promise<Task> => {
        const response = await axios.put<Task>(`${API_BASE_URL}/tasks/${task._id}`, task);
        setTasks(prevTasks => prevTasks.map(t => t._id === task._id ? response.data : t));
        return response.data;
    };

    const deleteTask = async (taskId: string): Promise<void> => {
        await axios.delete(`${API_BASE_URL}/tasks/${taskId}`);
        setTasks(prevTasks => prevTasks.filter(task => task._id !== taskId));
    };

    const createMission = async (mission: Omit<Mission, '_id'>): Promise<Mission> => {
        const response = await axios.post<Mission>(`${API_BASE_URL}/missions`, mission);
        setMissions(prevMissions => [...prevMissions, response.data]);
        return response.data;
    };

    const updateMission = async (mission: Mission): Promise<Mission> => {
        const response = await axios.put<Mission>(`${API_BASE_URL}/missions/${mission._id}`, mission);
        setMissions(prevMissions => prevMissions.map(m => m._id === mission._id ? response.data : m));
        return response.data;
    };

    const deleteMission = async (missionId: string): Promise<void> => {
        await axios.delete(`${API_BASE_URL}/missions/${missionId}`);
        setMissions(prevMissions => prevMissions.filter(mission => mission._id !== missionId));
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
