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
import MissionTimelineCard from './MissionTimelineCard';
import CheckpointForm from './CheckpointForm';
import { Mission, Task, User, Checkpoint } from '../../types';
import { v4 as uuidv4 } from 'uuid';

const API_BASE_URL = config.API_BASE_URL;

const TaskMissionManager: React.FC = () => {
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<
        'task' | 'mission' | 'taskForm' | 'missionForm' | 'checkpoint'
    >('task');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
    const [selectedCheckpoint, setSelectedCheckpoint] = useState<Checkpoint | null>(null);
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
            const fetchedMissions = response.data as Mission[];
            console.log('Fetched Missions:', fetchedMissions);
            const validMissions = fetchedMissions.map((mission: Mission) => {
                if (!mission.startDate || !mission.endDate) {
                    console.error('Mission with missing dates:', mission);
                    return {
                        ...mission,
                        startDate: mission.startDate || new Date().toISOString(),
                        endDate: mission.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                    };
                }
                return mission;
            });
            setMissions(validMissions);
        } catch (err) {
            console.error('Erro ao carregar missões:', err);
            setError('Erro ao carregar missões');
        }
    };


    const handleDeleteCheckpoint = async (missionId: string, checkpointId: string) => {
        try {
            await axios.delete(`${API_BASE_URL}/api/missions/${missionId}/checkpoints/${checkpointId}`);
            const updatedMissions = missions.map(mission => {
                if (mission._id === missionId) {
                    return {
                        ...mission,
                        checkpoints: mission.checkpoints.filter(cp => cp.id !== checkpointId)
                    };
                }
                return mission;
            });
            setMissions(updatedMissions);
            setSnackbarMessage('Checkpoint excluído com sucesso');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Erro ao excluir checkpoint:', error);
            setSnackbarMessage('Erro ao excluir checkpoint');
            setSnackbarOpen(true);
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

    const handleEditMission = (mission: Mission) => {
        setSelectedMission(mission);
        setModalContent('missionForm');
        setIsModalOpen(true);
    };

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

    const handleCreateCheckpoint = (missionId: string): void => {
        const mission = missions.find(m => m._id === missionId);
        if (mission) {
            setSelectedMission(mission);
            setModalContent('mission');
            setIsModalOpen(true);
        } else {
            console.error('Mission not found:', missionId);
        }
    };


    const handleCheckpointClick = (checkpoint: Checkpoint, mission: Mission): void => {
        setSelectedMission(mission);
        setModalContent('mission');
        setIsModalOpen(true);
    };


    const handleCheckpointSave = async (checkpointData: Omit<Checkpoint, "id">, missionId: string) => {
        try {
            const newCheckpoint: Checkpoint = { id: uuidv4(), ...checkpointData };
            const response = await axios.post(`${API_BASE_URL}/api/missions/${missionId}/checkpoints`, newCheckpoint);
            const updatedMission = response.data.mission || response.data;
            setMissions(prev =>
                prev.map(mission => (mission._id === missionId ? updatedMission : mission))
            );
            setSelectedMission(updatedMission);
            setSnackbarMessage('Checkpoint salvo com sucesso');
            setSnackbarOpen(true);
            setIsModalOpen(false);
        } catch (error) {
            console.error('Erro ao salvar checkpoint:', error);
            setError('Erro ao salvar checkpoint');
            setSnackbarOpen(true);
        }
    };


    const handleTaskSave = async (data: Omit<Task, '_id'> & { _id?: string; missionId?: string }) => {
        try {
            const taskData = {
                ...data,
                createdBy: user?._id || '',
                color: data.color || 'teal',
                startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
                endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
            };
            let response;
            if (data._id) {
                response = await axios.put(`${API_BASE_URL}/api/tasks/${data._id}`, taskData);
            } else {
                response = await axios.post(`${API_BASE_URL}/api/tasks`, taskData);
            }
            const updatedTask = response.data.task || response.data;
            setTasks(prev =>
                data._id ? prev.map(task => (task._id === data._id ? updatedTask : task)) : [...prev, updatedTask]
            );
            setSelectedTask(null);
            setIsModalOpen(false);
            setSnackbarMessage('Tarefa salva com sucesso');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Erro ao salvar tarefa:', error);
            if (axios.isAxiosError(error) && error.response) {
                console.error('Resposta do servidor:', error.response.data);
            }
            setError('Erro ao salvar tarefa');
            setSnackbarOpen(true);
        }
    };

   

    const handleMissionSave = async (missionData: Partial<Mission>) => {
        try {
            let response;
            if (missionData._id) {
                response = await axios.put(`${API_BASE_URL}/api/missions/${missionData._id}`, missionData);
            } else {
                response = await axios.post(`${API_BASE_URL}/api/missions`, missionData);
            }
            const updatedMission = response.data;
            setMissions(prev =>
                missionData._id
                    ? prev.map(m => (m._id === missionData._id ? updatedMission : m))
                    : [...prev, updatedMission]
            );

            // Atualiza a missão selecionada se estiver aberta
            if (selectedMission && selectedMission._id === updatedMission._id) {
                setSelectedMission(updatedMission);
            }

            setSnackbarMessage('Missão atualizada com sucesso');
            setSnackbarOpen(true);
        } catch (error) {
            console.error('Erro ao salvar missão:', error);
            if (axios.isAxiosError(error)) {
                setSnackbarMessage(error.response?.data?.message || 'Erro ao salvar missão');
            } else {
                setSnackbarMessage('Erro desconhecido ao salvar missão');
            }
            setSnackbarOpen(true);
        }
    };




    const handleDelete = async (type: 'task' | 'mission', id: string) => {
        try {
            if (type === 'task') {
                await axios.delete(`${API_BASE_URL}/api/tasks/${id}`);
                setTasks(prev => prev.filter(task => task._id !== id));
            } else {
                await axios.delete(`${API_BASE_URL}/api/missions/${id}`);
                setMissions(prev => prev.filter(mission => mission._id !== id));
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
            setTasks(prev => prev.map(task => (task._id === taskId ? response.data : task)));
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
                await handleTaskSave(updatedTask);
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
            await handleTaskSave(updatedTask);
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
                        <Box sx={{ overflowY: 'auto', maxHeight: 'calc(100vh - 200px)' }}>
                            {missions.map(mission => (
                                <Box key={mission._id} sx={{ mb: 2 }}>
                                    <MissionTimelineCard
                                        mission={mission}
                                        users={users}
                                        onEditMission={handleMissionClick}
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
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Box
                    sx={{
                        outline: 'none',
                        width: '90%',
                        maxWidth: 1200,
                        maxHeight: '90vh',
                        overflowY: 'auto',
                        bgcolor: 'background.paper', // Adicione esta linha
                        borderRadius: 2, // Opcional: para arredondar as bordas
                        boxShadow: 24, // Opcional: para adicionar uma sombra
                        p: 4, // Adicione padding
                    }}
                >
                    {modalContent === 'task' && selectedTask && (
                        <TaskDetails
                            task={selectedTask}
                            users={users}
                            onSave={handleTaskSave}
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
                            onDelete={(missionId: string) => handleDelete('mission', missionId)}
                            onClose={() => setIsModalOpen(false)}
                            onEditMission={handleMissionSave}
                            onDeleteCheckpoint={handleDeleteCheckpoint}
                        />
                    )}
                    {modalContent === 'taskForm' && (
                        <TaskForm
                            users={users}
                            onSubmit={handleTaskSave}
                            onClose={() => setIsModalOpen(false)}
                        />
                    )}
                    {modalContent === 'missionForm' && (
                        <MissionForm
                            users={users}
                            onSubmit={handleMissionSave}
                            onClose={() => setIsModalOpen(false)}
                            initialMission={selectedMission || undefined}
                        />
                    )}
                    {modalContent === 'checkpoint' && selectedMission && (
                        <CheckpointForm
                            onSubmit={(checkpointData) => handleCheckpointSave(checkpointData, selectedMission._id)}
                            onClose={() => setIsModalOpen(false)}
                            teamMembers={[
                                {
                                    _id: selectedMission.leader,
                                    username: users.find(u => u._id === selectedMission.leader)?.username || 'Líder',
                                    email: users.find(u => u._id === selectedMission.leader)?.email || '',
                                    role: users.find(u => u._id === selectedMission.leader)?.role || 'User',
                                },
                                ...selectedMission.team.map(userId => {
                                    const user = users.find(u => u._id === userId);
                                    return {
                                        _id: userId,
                                        username: user?.username || 'Desconhecido',
                                        email: user?.email || '',
                                        role: user?.role || 'User',
                                    };
                                })
                            ]}
                            missionStartDate={selectedMission.startDate}
                            missionEndDate={selectedMission.endDate}
                            initialCheckpoint={selectedCheckpoint || undefined}
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
