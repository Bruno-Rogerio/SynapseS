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
    Card,
    CardContent,
    Grid,
    Chip,
} from '@mui/material';
import { FaTasks, FaProjectDiagram } from 'react-icons/fa';
import config from '../../config';
import { useAuth } from '../../hooks/useAuth';
import MissionDetails from './MissionDetails';
import TaskDetails from './TaskDetails';
import MissionForm from './MissionForm';
import TaskForm from './TaskForm';
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
        console.log('Iniciando fetchUsers');
        try {
            const response = await axios.get(`${API_BASE_URL}/api/users`);
            console.log('Resposta do servidor (users):', response.data);
            setUsers(response.data);
        } catch (err) {
            console.error('Erro ao carregar usuários:', err);
            setError('Erro ao carregar usuários');
        }
    };

    const fetchTasks = async () => {
        console.log('Iniciando fetchTasks');
        try {
            const response = await axios.get(`${API_BASE_URL}/api/tasks`);
            console.log('Resposta do servidor (tasks):', response.data);
            setTasks(response.data);
            console.log('Estado tasks atualizado:', response.data);
        } catch (err) {
            console.error('Erro ao carregar tarefas:', err);
            setError('Erro ao carregar tarefas');
        } finally {
            setLoading(false);
        }
    };

    const fetchMissions = async () => {
        console.log('Iniciando fetchMissions');
        try {
            const response = await axios.get(`${API_BASE_URL}/api/missions`);
            console.log('Resposta do servidor (missions):', response.data);
            setMissions(response.data);
        } catch (err) {
            console.error('Erro ao carregar missões:', err);
            setError('Erro ao carregar missões');
        }
    };

    const handleTaskClick = (task: Task) => {
        setSelectedTask(task);
        setModalContent('task');
        setIsModalOpen(true);
    };

    const handleMissionClick = (mission: Mission) => {
        setSelectedMission(mission);
        setModalContent('mission');
        setIsModalOpen(true);
    };

    const handleCreateTask = () => {
        setSelectedTask(null);
        setModalContent('taskForm');
        setIsModalOpen(true);
    };

    const handleCreateMission = () => {
        setSelectedMission(null);
        setModalContent('missionForm');
        setIsModalOpen(true);
    };

    const handleSave = async (data: Task | Mission) => {
        try {
            if ('status' in data) {
                // It's a task
                const taskData = {
                    ...data,
                    createdBy: user?._id || '',
                    startDate: data.startDate ? new Date(data.startDate).toISOString() : null,
                    endDate: data.endDate ? new Date(data.endDate).toISOString() : null
                };
                let response;
                if (data._id) {
                    response = await axios.put(`${API_BASE_URL}/api/tasks/${data._id}`, taskData);
                } else {
                    response = await axios.post(`${API_BASE_URL}/api/tasks`, taskData);
                }
                const updatedTask = response.data.task || response.data;
                setTasks(prevTasks =>
                    data._id
                        ? prevTasks.map(task => task._id === data._id ? updatedTask : task)
                        : [...prevTasks, updatedTask]
                );
                setSelectedTask(null);
            } else {
                // It's a mission
                if (data._id) {
                    await axios.put(`${API_BASE_URL}/api/missions/${data._id}`, data);
                } else {
                    await axios.post(`${API_BASE_URL}/api/missions`, data);
                }
                await fetchMissions();
            }
            setSnackbarMessage('Salvo com sucesso');
            setSnackbarOpen(true);
            setIsModalOpen(false);
        } catch (error) {
            console.error('Erro ao salvar:', error);
            setError('Erro ao salvar');
            setSnackbarOpen(true);
        }
    };

    const handleDelete = async (type: 'task' | 'mission', id: string) => {
        try {
            if (type === 'task') {
                await axios.delete(`${API_BASE_URL}/api/tasks/${id}`);
                await fetchTasks();
            } else {
                await axios.delete(`${API_BASE_URL}/api/missions/${id}`);
                await fetchMissions();
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
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
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

    const renderTaskList = () => {
        console.log('Renderizando lista de tarefas');
        console.log('Tasks:', tasks);
        console.log('Users:', users);
        return (
            <Grid container spacing={2}>
                {tasks.map(task => {
                    const assignedUser = users.find(user => user._id === task.assignedTo);
                    console.log('Task:', task);
                    console.log('Assigned User:', assignedUser);
                    return (
                        <Grid item xs={12} sm={6} md={4} key={task._id}>
                            <Card
                                onClick={() => handleTaskClick(task)}
                                sx={{
                                    cursor: 'pointer',
                                    '&:hover': {
                                        boxShadow: 6
                                    }
                                }}
                            >
                                <CardContent>
                                    <Typography variant="h6">{task.title}</Typography>
                                    <Typography color="textSecondary" noWrap>{task.description}</Typography>
                                    {assignedUser && (
                                        <Typography variant="body2" sx={{ mt: 1 }}>
                                            Responsável: {assignedUser.username}
                                        </Typography>
                                    )}
                                    <Chip
                                        label={task.status === 'pending' ? 'Pendente' :
                                            task.status === 'in_progress' ? 'Em Progresso' :
                                                'Concluída'}
                                        color={
                                            task.status === 'completed' ? 'success' :
                                                task.status === 'in_progress' ? 'primary' :
                                                    'default'
                                        }
                                        size="small"
                                        sx={{ mt: 1 }}
                                    />
                                </CardContent>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        );
    };

    const renderMissionList = () => (
        <Grid container spacing={2}>
            {missions.map(mission => (
                <Grid item xs={12} sm={6} md={4} key={mission._id}>
                    <Card
                        onClick={() => handleMissionClick(mission)}
                        sx={{
                            cursor: 'pointer',
                            '&:hover': {
                                boxShadow: 6
                            }
                        }}
                    >
                        <CardContent>
                            <Typography variant="h6">{mission.title}</Typography>
                            <Typography color="textSecondary">{mission.description}</Typography>
                        </CardContent>
                    </Card>
                </Grid>
            ))}
        </Grid>
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
                            <Button variant="contained" color="primary" onClick={handleCreateTask}>
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
                        {renderMissionList()}
                    </>
                )}
            </Box>
            <Modal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                aria-labelledby="modal-title"
            >
                <Box sx={{
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
                    overflowY: 'auto'
                }}>
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
                            onSave={handleSave}
                            onDelete={() => selectedMission._id && handleDelete('mission', selectedMission._id)}
                            onClose={() => setIsModalOpen(false)}
                            onTaskClick={handleTaskClick}
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
