// frontend/src/components/TaskMissionManager/TaskMissionManager.tsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    Typography,
    Modal,
    CircularProgress,
    Alert,
    Snackbar,
    Button,
    Tabs,
    Tab,
} from '@mui/material';
import { FaTasks, FaProjectDiagram } from 'react-icons/fa';
import config from '../../config';
import { useAuth } from '../../hooks/useAuth';
import MissionDetails from './MissionDetails';
import TaskDetails from './TaskDetails';
import MissionForm from './MissionForm';
import TaskForm from './TaskForm';
import UserTaskColumn from './UserTaskColumn';
import MissionTimelineCard from './MissionTimelineCard'; // Novo componente para cada missão
import { Mission, Task, User } from '../../types';

const API_BASE_URL = config.API_BASE_URL;

const TaskMissionManager: React.FC = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<'task' | 'mission' | 'taskForm' | 'missionForm'>('task');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [activeTab, setActiveTab] = useState(0);

    useEffect(() => {
        fetchUsers();
        fetchTasks();
        fetchMissions();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/users`);
            setUsers(response.data);
        } catch (err) {
            console.error('Erro ao carregar usuários:', err);
            setError('Erro ao carregar usuários');
        }
    };

    const fetchTasks = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/tasks`);
            setTasks(response.data);
        } catch (err) {
            console.error('Erro ao carregar tarefas:', err);
            setError('Erro ao carregar tarefas');
        } finally {
            setLoading(false);
        }
    };

    const fetchMissions = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/missions`);
            setMissions(response.data);
        } catch (err) {
            console.error('Erro ao carregar missões:', err);
            setError('Erro ao carregar missões');
        }
    };

    const handleTaskClick = (taskOrId: Task | string) => {
        let task: Task | undefined;
        if (typeof taskOrId === 'string') {
            task = tasks.find(t => t._id === taskOrId);
        } else {
            task = taskOrId;
        }
        if (task) {
            setSelectedTask(task);
            setModalContent('task');
            setIsModalOpen(true);
        }
    };

    const handleMissionClick = (mission: Mission) => {
        setSelectedMission(mission);
        setModalContent('mission');
        setIsModalOpen(true);
    };

    // Ao criar uma tarefa, se missionId for fornecido, pré-seleciona a missão
    const handleCreateTask = (missionId?: string) => {
        setSelectedTask(null);
        setModalContent('taskForm');
        setIsModalOpen(true);
        if (missionId) {
            const mission = missions.find(m => m._id === missionId);
            if (mission) {
                setSelectedMission(mission);
            }
        }
    };

    const handleCreateMission = () => {
        setSelectedMission(null);
        setModalContent('missionForm');
        setIsModalOpen(true);
    };

    /**
     * handleSave: Se os dados representam uma tarefa (contêm assignedTo),
     * então é uma tarefa. Se existir data._id, atualiza; caso contrário, cria.
     * Se data.missionId estiver definido, utiliza o endpoint de missão para criar a tarefa,
     * e atualiza o array de tarefas da missão com o novo task ID.
     */
    const handleSave = async (data: Omit<Task | Mission, '_id'> & { _id?: string; missionId?: string }) => {
        try {
            if ('assignedTo' in data) {
                // É uma tarefa
                const taskData = {
                    ...data,
                    createdBy: user?._id || '',
                    color: data.color || 'teal',
                    startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
                    endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
                };
                let response;
                if (data._id) {
                    // Atualização da tarefa
                    response = await axios.put(`${API_BASE_URL}/api/tasks/${data._id}`, taskData);
                } else {
                    // Criação de nova tarefa
                    if (data.missionId) {
                        // Tarefa vinculada à missão
                        response = await axios.post(`${API_BASE_URL}/api/missions/${data.missionId}/tasks`, taskData);
                        const updatedTask = response.data.task || response.data;
                        // Atualiza a missão com o novo task ID
                        setMissions(prev =>
                            prev.map(m =>
                                m._id === data.missionId ? { ...m, tasks: [...m.tasks, updatedTask._id] } : m
                            )
                        );
                        setTasks(prevTasks => [...prevTasks, updatedTask]);
                    } else {
                        response = await axios.post(`${API_BASE_URL}/api/tasks`, taskData);
                        const updatedTask = response.data.task || response.data;
                        setTasks(prevTasks => [...prevTasks, updatedTask]);
                    }
                }
                const updatedTask = response.data.task || response.data;
                setTasks(prevTasks =>
                    data._id
                        ? prevTasks.map(task => task._id === data._id ? updatedTask : task)
                        : [...prevTasks, updatedTask]
                );
                setSelectedTask(null);
            } else {
                // É uma missão
                console.log('Sending mission data:', data);
                let response;
                if (data._id) {
                    response = await axios.put(`${API_BASE_URL}/api/missions/${data._id}`, data);
                } else {
                    response = await axios.post(`${API_BASE_URL}/api/missions`, data);
                }
                console.log('Server response:', response.data);
                const updatedMission = response.data.mission || response.data;
                setMissions(prevMissions =>
                    data._id
                        ? prevMissions.map(mission => mission._id === data._id ? updatedMission : mission)
                        : [...prevMissions, updatedMission]
                );
                setSelectedMission(null);
            }
            setSnackbarMessage('Salvo com sucesso');
            setSnackbarOpen(true);
            setIsModalOpen(false);
        } catch (error) {
            console.error('Erro ao salvar:', error);
            if (axios.isAxiosError(error) && error.response) {
                console.error('Resposta do servidor:', error.response.data);
            }
            setError('Erro ao salvar');
            setSnackbarOpen(true);
        }
    };

    const handleDelete = async (type: 'task' | 'mission', id: string) => {
        try {
            if (type === 'task') {
                await axios.delete(`${API_BASE_URL}/api/tasks/${id}`);
                setTasks(prevTasks => prevTasks.filter(task => task._id !== id));
            } else {
                await axios.delete(`${API_BASE_URL}/api/missions/${id}`);
                setMissions(prevMissions => prevMissions.filter(mission => mission._id !== id));
            }
            setSnackbarMessage('Excluído com sucesso');
            setSnackbarOpen(true);
            setIsModalOpen(false);
        } catch (err) {
            console.error('Erro ao excluir:', err);
            setError('Erro ao excluir');
            setSnackbarOpen(true);
        }
    };

    const updateTaskComment = async (taskId: string, comments: string) => {
        try {
            const response = await axios.patch(`${API_BASE_URL}/api/tasks/${taskId}`, { comments });
            setTasks(tasks.map(task => task._id === taskId ? response.data : task));
            if (selectedTask && selectedTask._id === taskId) {
                setSelectedTask(response.data);
            }
            setSnackbarMessage('Comentário atualizado');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Erro ao atualizar comentário:', error);
            setError('Erro ao atualizar comentário');
            setSnackbarOpen(true);
        }
    };

    const handleCommentChange = (comments: string) => {
        if (selectedTask && selectedTask._id) {
            updateTaskComment(selectedTask._id, comments);
        }
    };

    const handleFileChange = async (files: File[]) => {
        if (selectedTask && selectedTask._id) {
            const formData = new FormData();
            files.forEach((file, index) => {
                formData.append(`file${index}`, file);
            });
            try {
                const response = await axios.post(`${API_BASE_URL}/api/tasks/${selectedTask._id}/attachments`, formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                const updatedTask = { ...selectedTask, attachments: response.data.attachments };
                await handleSave(updatedTask);
            } catch (error) {
                console.error('Erro ao fazer upload dos arquivos:', error);
                setError('Erro ao fazer upload dos arquivos');
                setSnackbarOpen(true);
            }
        }
    };

    const handleStatusChange = async (status: 'pending' | 'in_progress' | 'completed') => {
        if (selectedTask && selectedTask._id) {
            const updatedTask = { ...selectedTask, status };
            await handleSave(updatedTask);
        }
    };

    const groupTasksByUser = (tasks: Task[], users: User[]) => {
        const groupedTasks = users.map(user => ({
            user,
            tasks: tasks.filter(task => {
                if (typeof task.assignedTo === 'string') {
                    return task.assignedTo === user._id;
                } else if (task.assignedTo && typeof task.assignedTo === 'object' && '_id' in task.assignedTo) {
                    return task.assignedTo._id === user._id;
                }
                return false;
            }),
        }));

        const unassignedTasks = tasks.filter(task => !task.assignedTo);
        if (unassignedTasks.length > 0) {
            groupedTasks.push({
                user: { _id: 'unassigned', username: 'Não atribuído' } as User,
                tasks: unassignedTasks,
            });
        }
        return groupedTasks;
    };

    const renderTaskList = () => (
        <Box sx={{ display: 'flex', overflowX: 'auto', flexGrow: 1, p: 2 }}>
            {groupTasksByUser(tasks, users).map(({ user, tasks }) => (
                <UserTaskColumn key={user._id} user={user} tasks={tasks} onTaskClick={handleTaskClick} />
            ))}
        </Box>
    );

    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Box sx={{ width: '100%' }}>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)}>
                <Tab icon={<FaTasks />} label="Tarefas" />
                <Tab icon={<FaProjectDiagram />} label="Missões" />
            </Tabs>
            <Box sx={{ mt: 2 }}>
                {activeTab === 0 && (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h5">Tarefas</Typography>
                            <Button variant="contained" color="primary" onClick={() => handleCreateTask()}>
                                Criar Tarefa
                            </Button>
                        </Box>
                        {renderTaskList()}
                    </>
                )}
                {activeTab === 1 && (
                    <>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                            <Typography variant="h5">Missões</Typography>
                            <Button variant="contained" color="primary" onClick={handleCreateMission}>
                                Criar Missão
                            </Button>
                        </Box>
                        {/* Para cada missão, renderizamos um MissionTimelineCard */}
                        <Box sx={{ overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
                            {missions.map(mission => (
                                <Box key={mission._id} sx={{ mb: 2 }}>
                                    <MissionTimelineCard
                                        mission={mission}
                                        tasks={tasks}
                                        users={users}
                                        onEditMission={(mission) => {
                                            setSelectedMission(mission);
                                            setModalContent('missionForm');
                                            setIsModalOpen(true);
                                        }}
                                        onDeleteMission={(missionId) => handleDelete('mission', missionId)}
                                        onAddTask={(missionId) => handleCreateTask(missionId)}
                                        onTaskClick={(task) => handleTaskClick(task)}
                                    />
                                </Box>
                            ))}
                        </Box>
                    </>
                )}
            </Box>
            <Modal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                aria-labelledby="modal-title"
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '80%',
                        maxWidth: 600,
                        maxHeight: '90vh',
                        bgcolor: 'background.paper',
                        boxShadow: 24,
                        p: 4,
                        overflowY: 'auto',
                    }}
                >
                    {modalContent === 'task' && selectedTask && (
                        <TaskDetails
                            task={selectedTask}
                            users={users}
                            onSave={handleSave}
                            onDelete={() => selectedTask._id && handleDelete('task', selectedTask._id)}
                            onClose={() => setIsModalOpen(false)}
                            onFileChange={handleFileChange}
                            onCommentChange={handleCommentChange}
                            onStatusChange={handleStatusChange}
                        />
                    )}
                    {modalContent === 'mission' && selectedMission && (
                        <MissionDetails
                            mission={selectedMission}
                            users={users}
                            tasks={tasks.filter(task => selectedMission.tasks.includes(task._id))}
                            onDelete={(missionId) => handleDelete('mission', missionId)}
                            onClose={() => setIsModalOpen(false)}
                            onTaskUpdate={handleTaskClick}
                            onTaskCreate={(newTaskData: Omit<Task, '_id' | 'missionId'>, missionId: string) =>
                                handleSave({ ...newTaskData, missionId })
                            }
                            onEditMission={(mission) => { }}
                        />
                    )}
                    {modalContent === 'taskForm' && (
                        <TaskForm
                            users={users}
                            onSubmit={handleSave}
                            onClose={() => setIsModalOpen(false)}
                        />
                    )}
                    {modalContent === 'missionForm' && (
                        <MissionForm
                            users={users}
                            onSubmit={handleSave}
                            onClose={() => setIsModalOpen(false)}
                            initialMission={selectedMission || undefined}
                        />
                    )}
                </Box>
            </Modal>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
            />
        </Box>
    );
};

export default TaskMissionManager;
