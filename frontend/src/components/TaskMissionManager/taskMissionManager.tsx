import React, { useState, useEffect, useMemo } from 'react';
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
    Paper,
    Container,
    IconButton,
    useTheme,
    alpha,
    Skeleton,
    Fade,
    Backdrop,
    Grid,
    Chip,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { FaTasks, FaProjectDiagram, FaPlus } from 'react-icons/fa';
import { MdRefresh } from 'react-icons/md';
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
    const theme = useTheme();
    const { user } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalContent, setModalContent] = useState<
        'task' | 'mission' | 'taskForm' | 'missionForm' | 'checkpoint'
    >('task');
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
    const [_selectedCheckpoint, _setSelectedCheckpoint] = useState<Checkpoint | null>(null); // Prefixado com _ pois não é usado
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('success');
    const [activeTab, setActiveTab] = useState(0);

    // Memoize para evitar re-renderizações desnecessárias
    const groupedTasks = useMemo(() => {
        return groupTasksByUser(tasks, users);
    }, [tasks, users]);

    // Efeito inicial para carregar dados
    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchUsers(),
                    fetchTasks(),
                    fetchMissions()
                ]);
            } catch (err) {
                console.error("Erro ao carregar dados iniciais", err);
            } finally {
                // Pequeno atraso para garantir animações suaves
                setTimeout(() => {
                    setLoading(false);
                }, 300);
            }
        };
        loadData();
    }, []);

    // Funções para buscar dados
    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/users`);
            setUsers(response.data);
            return response.data;
        } catch (err) {
            console.error('Erro ao carregar usuários:', err);
            showSnackbar('Erro ao carregar usuários', 'error');
            setError('Erro ao carregar usuários');
            return [];
        }
    };

    const fetchTasks = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/tasks`);
            setTasks(response.data);
            return response.data;
        } catch (err) {
            console.error('Erro ao carregar tarefas:', err);
            showSnackbar('Erro ao carregar tarefas', 'error');
            setError('Erro ao carregar tarefas');
            return [];
        }
    };

    const fetchMissions = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/missions`);
            const fetchedMissions = response.data as Mission[];
            const validMissions = fetchedMissions.map((mission: Mission) => {
                if (!mission.startDate || !mission.endDate) {
                    return {
                        ...mission,
                        startDate: mission.startDate || new Date().toISOString(),
                        endDate: mission.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                    };
                }
                return mission;
            });
            setMissions(validMissions);
            return validMissions;
        } catch (err) {
            console.error('Erro ao carregar missões:', err);
            showSnackbar('Erro ao carregar missões', 'error');
            setError('Erro ao carregar missões');
            return [];
        }
    };

    // Função para atualizar todos os dados
    const handleRefreshData = async () => {
        setRefreshing(true);
        await Promise.all([
            fetchUsers(),
            fetchTasks(),
            fetchMissions()
        ]);
        setTimeout(() => {
            setRefreshing(false);
            showSnackbar('Dados atualizados com sucesso', 'success');
        }, 500);
    };

    // Funções de manipulação de checkpoint
    const handleDeleteCheckpoint = async (missionId: string, checkpointId: string) => {
        try {
            await axios.delete(`${API_BASE_URL}/api/missions/${missionId}/checkpoints/${checkpointId}`);
            setMissions(prev =>
                prev.map(mission => {
                    if (mission._id === missionId) {
                        return {
                            ...mission,
                            checkpoints: mission.checkpoints.filter(cp => cp.id !== checkpointId)
                        };
                    }
                    return mission;
                })
            );
            showSnackbar('Checkpoint excluído com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao excluir checkpoint:', error);
            showSnackbar('Erro ao excluir checkpoint', 'error');
        }
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
            showSnackbar('Checkpoint salvo com sucesso', 'success');
            setIsModalOpen(false);
        } catch (error) {
            console.error('Erro ao salvar checkpoint:', error);
            showSnackbar('Erro ao salvar checkpoint', 'error');
        }
    };

    // Funções de manipulação de tarefas
    // Mantemos a função mas não usamos diretamente neste arquivo
    const _handleTaskClick = (taskOrId: Task | string) => {
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

    // Mantemos a função mas não usamos diretamente neste arquivo
    const _handleCreateTask = (missionId?: string) => {
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
            showSnackbar('Tarefa salva com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao salvar tarefa:', error);
            showSnackbar('Erro ao salvar tarefa', 'error');
        }
    };

    // Funções de manipulação de missões
    const handleMissionClick = (mission: Mission) => {
        setSelectedMission(mission);
        setModalContent('mission');
        setIsModalOpen(true);
    };

    // Mantemos a função mas não usamos diretamente neste arquivo
    const _handleEditMission = (mission: Mission) => {
        setSelectedMission(mission);
        setModalContent('missionForm');
        setIsModalOpen(true);
    };

    const handleCreateMission = () => {
        setSelectedMission(null);
        setModalContent('missionForm');
        setIsModalOpen(true);
    };

    // Mantemos a função mas não usamos diretamente neste arquivo
    const _handleCreateCheckpoint = (missionId: string): void => {
        const mission = missions.find(m => m._id === missionId);
        if (mission) {
            setSelectedMission(mission);
            setModalContent('mission');
            setIsModalOpen(true);
        } else {
            console.error('Mission not found:', missionId);
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
            showSnackbar('Missão salva com sucesso', 'success');
        } catch (error) {
            console.error('Erro ao salvar missão:', error);
            showSnackbar('Erro ao salvar missão', 'error');
        }
    };

    // Funções comuns
    const handleDelete = async (type: 'task' | 'mission', id: string) => {
        try {
            if (type === 'task') {
                await axios.delete(`${API_BASE_URL}/api/tasks/${id}`);
                setTasks(prev => prev.filter(task => task._id !== id));
            } else {
                await axios.delete(`${API_BASE_URL}/api/missions/${id}`);
                setMissions(prev => prev.filter(mission => mission._id !== id));
            }
            showSnackbar('Item excluído com sucesso', 'success');
            setIsModalOpen(false);
        } catch (err) {
            console.error('Erro ao excluir:', err);
            showSnackbar('Erro ao excluir', 'error');
        }
    };

    // Outras funções de manipulação
    const updateTaskComment = async (taskId: string, comments: string) => {
        try {
            const response = await axios.patch(`${API_BASE_URL}/api/tasks/${taskId}`, { comments });
            setTasks(prev => prev.map(task => (task._id === taskId ? response.data : task)));
            if (selectedTask && selectedTask._id === taskId) {
                setSelectedTask(response.data);
            }
            showSnackbar('Comentário atualizado', 'success');
        } catch (error) {
            console.error('Erro ao atualizar comentário:', error);
            showSnackbar('Erro ao atualizar comentário', 'error');
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
                const response = await axios.post(
                    `${API_BASE_URL}/api/tasks/${selectedTask._id}/attachments`,
                    formData,
                    {
                        headers: { 'Content-Type': 'multipart/form-data' },
                    }
                );
                const updatedTask = { ...selectedTask, attachments: response.data.attachments };
                await handleTaskSave(updatedTask);
            } catch (error) {
                console.error('Erro ao fazer upload dos arquivos:', error);
                showSnackbar('Erro ao fazer upload dos arquivos', 'error');
            }
        }
    };

    const handleStatusChange = async (status: 'pending' | 'in_progress' | 'completed') => {
        if (selectedTask && selectedTask._id) {
            const updatedTask = { ...selectedTask, status };
            await handleTaskSave(updatedTask);
        }
    };

    // Função auxiliar para exibir snackbars
    const showSnackbar = (message: string, severity: 'success' | 'error' | 'info' = 'success') => {
        setSnackbarMessage(message);
        setSnackbarSeverity(severity);
        setSnackbarOpen(true);
    };

    // Função para agrupar tarefas por usuário
    function groupTasksByUser(tasks: Task[], users: User[]) {
        // Usar um memoize aqui evita recálculos desnecessários
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
        // Tarefas não atribuídas
        const unassignedTasks = tasks.filter(task => !task.assignedTo);
        if (unassignedTasks.length > 0) {
            groupedTasks.push({
                user: {
                    _id: 'unassigned',
                    username: 'Não atribuído',
                    email: '',
                    role: '',
                    company: '',
                    permissions: []
                } as User,
                tasks: unassignedTasks,
            });
        }
        return groupedTasks;
    }

    // Rendering do contador de tarefas
    const renderTaskCounts = () => {
        const pendingCount = tasks.filter(t => t.status === 'pending').length;
        const inProgressCount = tasks.filter(t => t.status === 'in_progress').length;
        const completedCount = tasks.filter(t => t.status === 'completed').length;
        return (
            <Box sx={{ display: 'flex', gap: 2, mt: 1, mb: 3, flexWrap: 'wrap' }}>
                <Chip
                    label={`Pendentes: ${pendingCount}`}
                    color="warning"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                />
                <Chip
                    label={`Em Progresso: ${inProgressCount}`}
                    color="info"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                />
                <Chip
                    label={`Concluídas: ${completedCount}`}
                    color="success"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                />
                <Chip
                    label={`Total: ${tasks.length}`}
                    color="default"
                    variant="outlined"
                    sx={{ fontWeight: 500 }}
                />
            </Box>
        );
    };

    // Componente de lista de tarefas otimizado
    const TaskList = () => {
        if (groupedTasks.length === 0) {
            return (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                        Nenhuma tarefa encontrada
                    </Typography>
                </Box>
            );
        }
        return (
            <Box
                sx={{
                    display: 'flex',
                    overflowX: 'auto',
                    flexGrow: 1,
                    p: 2,
                    pb: 4, // Extra padding para melhor visualização com scroll
                    gap: 2,
                    scrollbarWidth: 'thin',
                    '&::-webkit-scrollbar': {
                        height: '8px',
                    },
                    '&::-webkit-scrollbar-track': {
                        background: alpha(theme.palette.divider, 0.1),
                        borderRadius: '4px',
                    },
                    '&::-webkit-scrollbar-thumb': {
                        background: alpha(theme.palette.primary.main, 0.2),
                        borderRadius: '4px',
                        '&:hover': {
                            background: alpha(theme.palette.primary.main, 0.3),
                        },
                    },
                }}
            >
                <AnimatePresence>
                    {groupedTasks.map(({ user, tasks }) => (
                        <Box
                            component={motion.div}
                            key={user._id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ duration: 0.3 }}
                        >
                            <UserTaskColumn
                                user={user}
                                tasks={tasks}
                                onTaskClick={(task) => {
                                    // Explicitamente garantir que estamos chamando o handleTaskClick
                                    console.log("TaskCard clicado para:", task.title);
                                    setSelectedTask(task);
                                    setModalContent('task');
                                    setIsModalOpen(true);
                                }}
                                onAddTask={(userId) => {
                                    // Separar completamente a lógica de criação de tarefa
                                    console.log("Botão Add Task clicado para usuário:", userId);
                                    setSelectedTask(null);
                                    setModalContent('taskForm');
                                    setIsModalOpen(true);
                                }}
                            />
                        </Box>
                    ))}
                </AnimatePresence>
            </Box>
        );
    };

    // Componente de lista de missões
    const MissionList = () => {
        if (missions.length === 0) {
            return (
                <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Typography variant="h6" color="text.secondary">
                        Nenhuma missão encontrada
                    </Typography>
                </Box>
            );
        }
        return (
            <Box sx={{
                overflowY: 'auto',
                maxHeight: 'calc(100vh - 240px)',
                pr: 2,
                scrollbarWidth: 'thin',
                '&::-webkit-scrollbar': {
                    width: '8px',
                },
                '&::-webkit-scrollbar-track': {
                    background: alpha(theme.palette.divider, 0.1),
                    borderRadius: '4px',
                },
                '&::-webkit-scrollbar-thumb': {
                    background: alpha(theme.palette.primary.main, 0.2),
                    borderRadius: '4px',
                    '&:hover': {
                        background: alpha(theme.palette.primary.main, 0.3),
                    },
                },
            }}>
                <AnimatePresence>
                    {missions.map((mission, index) => (
                        <Box
                            component={motion.div}
                            key={mission._id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.3, delay: index * 0.05 }}
                            sx={{ mb: 3 }}
                        >
                            <MissionTimelineCard
                                mission={mission}
                                users={users}
                                onEditMission={handleMissionClick}
                            />
                        </Box>
                    ))}
                </AnimatePresence>
            </Box>
        );
    };

    // Componente de carregamento com skeleton
    const LoadingState = () => (
        <Container>
            <Box sx={{ mb: 4, mt: 2 }}>
                <Skeleton variant="rectangular" width={120} height={32} sx={{ mb: 2 }} />
                <Skeleton variant="rectangular" height={48} sx={{ mb: 3 }} />
                <Grid container spacing={2}>
                    {[1, 2, 3].map(i => (
                        <Grid item xs={12} md={4} key={i}>
                            <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2 }} />
                        </Grid>
                    ))}
                </Grid>
            </Box>
        </Container>
    );

    // Estado de erro
    if (error && !loading) {
        return (
            <Container sx={{ mt: 4 }}>
                <Alert
                    severity="error"
                    action={
                        <Button
                            color="inherit"
                            size="small"
                            onClick={handleRefreshData}
                        >
                            Tentar Novamente
                        </Button>
                    }
                    sx={{ mb: 2 }}
                >
                    {error}
                </Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="xl" sx={{ py: 3 }}>
            <Backdrop
                sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
                open={refreshing}
            >
                <CircularProgress color="inherit" />
            </Backdrop>
            <Paper
                elevation={0}
                sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: theme.palette.divider,
                    minHeight: 'calc(100vh - 150px)',
                }}
            >
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        px: 3,
                        py: 2,
                        borderBottom: '1px solid',
                        borderColor: theme.palette.divider,
                        backgroundColor: alpha(theme.palette.background.paper, 0.8),
                        backdropFilter: 'blur(8px)',
                        position: 'sticky',
                        top: 0,
                        zIndex: 10,
                    }}
                >
                    <Typography
                        variant="h5"
                        color="primary"
                        sx={{
                            fontWeight: 600,
                            display: 'flex',
                            alignItems: 'center'
                        }}
                    >
                        {activeTab === 0 ? (
                            <><FaTasks style={{ marginRight: '8px' }} /> Gestão de Tarefas</>
                        ) : (
                            <><FaProjectDiagram style={{ marginRight: '8px' }} /> Gestão de Missões</>
                        )}
                    </Typography>
                    <IconButton
                        onClick={handleRefreshData}
                        disabled={loading || refreshing}
                        color="primary"
                        sx={{
                            bgcolor: alpha(theme.palette.primary.main, 0.08),
                            '&:hover': {
                                bgcolor: alpha(theme.palette.primary.main, 0.15),
                            }
                        }}
                    >
                        <MdRefresh />
                    </IconButton>
                </Box>
                <Box sx={{ px: 3, py: 2 }}>
                    <Tabs
                        value={activeTab}
                        onChange={(_, newValue) => setActiveTab(newValue)}
                        sx={{
                            mb: 3,
                            '& .MuiTabs-indicator': {
                                height: 3,
                                borderRadius: '3px 3px 0 0'
                            },
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '1rem',
                                minWidth: 100,
                                minHeight: 48,
                            }
                        }}
                    >
                        <Tab
                            icon={<FaTasks style={{ marginRight: 8 }} />}
                            iconPosition="start"
                            label="Tarefas"
                        />
                        <Tab
                            icon={<FaProjectDiagram style={{ marginRight: 8 }} />}
                            iconPosition="start"
                            label="Missões"
                        />
                    </Tabs>
                    <Fade in={!loading} timeout={300}>
                        <Box>
                            {activeTab === 0 && (
                                <>
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'flex-start',
                                        mb: 2
                                    }}>
                                        <Box>
                                            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                                                Tarefas por Usuário
                                            </Typography>
                                            {renderTaskCounts()}
                                        </Box>
                                    </Box>
                                    <TaskList />
                                </>
                            )}
                            {activeTab === 1 && (
                                <>
                                    <Box sx={{
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                        mb: 3
                                    }}>
                                        <Typography variant="h6" sx={{ fontWeight: 600 }}>
                                            Linha do Tempo de Missões
                                        </Typography>
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            onClick={handleCreateMission}
                                            startIcon={<FaPlus />}
                                            sx={{
                                                px: 3,
                                                py: 1,
                                                fontWeight: 600,
                                                borderRadius: 2,
                                                boxShadow: theme.shadows[2]
                                            }}
                                        >
                                            Nova Missão
                                        </Button>
                                    </Box>
                                    <MissionList />
                                </>
                            )}
                        </Box>
                    </Fade>
                    {loading && <LoadingState />}
                </Box>
            </Paper>
            {/* Modal com estilo aprimorado e fundo sólido */}
            <Modal
                open={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                aria-labelledby="modal-title"
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500,
                    sx: {
                        backgroundColor: 'rgba(0, 0, 0, 0.75)',
                        backdropFilter: 'blur(8px)',
                    }
                }}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <Fade in={isModalOpen}>
                    <Box
                        component={motion.div}
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{
                            type: 'spring',
                            stiffness: 300,
                            damping: 30,
                            duration: 0.4
                        }}
                        sx={{
                            position: 'relative',
                            width: '90%',
                            maxWidth: 1200,
                            maxHeight: '90vh',
                            overflowY: 'auto',
                            bgcolor: theme.palette.mode === 'dark'
                                ? 'rgba(22, 28, 36, 0.98)' // Fundo escuro sólido
                                : 'rgba(255, 255, 255, 0.98)', // Fundo claro sólido
                            borderRadius: 4,
                            boxShadow: 'rgba(0, 0, 0, 0.2) 0px 10px 35px, rgba(0, 0, 0, 0.12) 0px 15px 20px',
                            outline: 'none',
                            scrollbarWidth: 'thin',
                            '&::-webkit-scrollbar': { width: '8px' },
                            '&::-webkit-scrollbar-track': {
                                background: alpha(theme.palette.divider, 0.1),
                                borderRadius: '4px',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: alpha(theme.palette.primary.main, 0.2),
                                borderRadius: '4px',
                                '&:hover': {
                                    background: alpha(theme.palette.primary.main, 0.3),
                                },
                            },
                        }}
                    >
                        {/* Barra superior colorida */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                right: 0,
                                height: 4,
                                background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                                zIndex: 1,
                            }}
                        />
                        {/* Destaque/Brilho sutil no canto superior */}
                        <Box
                            sx={{
                                position: 'absolute',
                                top: 0,
                                right: 0,
                                width: '50%',
                                height: '30%',
                                background: `radial-gradient(circle at 90% 20%, ${alpha(theme.palette.primary.main, 0.08)}, transparent 80%)`,
                                zIndex: 0,
                                pointerEvents: 'none',
                            }}
                        />
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                width: '40%',
                                height: '25%',
                                background: `radial-gradient(circle at 5% 90%, ${alpha(theme.palette.secondary.main, 0.05)}, transparent 70%)`,
                                zIndex: 0,
                                pointerEvents: 'none',
                            }}
                        />
                        {/* Conteúdo do modal com padding */}
                        <Box
                            sx={{
                                p: { xs: 2, sm: 3, md: 4 },
                                pt: { xs: 3, sm: 3.5, md: 4 },
                                position: 'relative',
                                zIndex: 2,
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
                                        // Corrigido para incluir company e permissions
                                        {
                                            _id: selectedMission.leader,
                                            username: users.find(u => u._id === selectedMission.leader)?.username || 'Líder',
                                            email: users.find(u => u._id === selectedMission.leader)?.email || '',
                                            role: users.find(u => u._id === selectedMission.leader)?.role || 'User',
                                            company: users.find(u => u._id === selectedMission.leader)?.company || '',
                                            permissions: users.find(u => u._id === selectedMission.leader)?.permissions || []
                                        },
                                        ...selectedMission.team.map(userId => {
                                            const user = users.find(u => u._id === userId);
                                            return {
                                                _id: userId,
                                                username: user?.username || 'Desconhecido',
                                                email: user?.email || '',
                                                role: user?.role || 'User',
                                                company: user?.company || '',
                                                permissions: user?.permissions || []
                                            };
                                        })
                                    ]}
                                    missionStartDate={selectedMission.startDate}
                                    missionEndDate={selectedMission.endDate}
                                    initialCheckpoint={_selectedCheckpoint || undefined}
                                />
                            )}
                        </Box>
                    </Box>
                </Fade>
            </Modal>
            {/* Snackbar para notificações */}
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
            >
                <Alert
                    onClose={() => setSnackbarOpen(false)}
                    severity={snackbarSeverity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default TaskMissionManager;
