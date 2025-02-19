import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Box,
    Button,
    Typography,
    Modal,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    CircularProgress,
    Alert,
    Snackbar,
    Checkbox,
    ListItemText,
    OutlinedInput,
    SelectChangeEvent,
    TextareaAutosize,
    Input,
} from '@mui/material';
import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

interface User {
    _id: string;
    username: string;
}

interface Task {
    _id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    startDate: string;
    endDate: string;
    assignedTo: string;
    createdBy: string;
    points: number;
    comments: string;
    attachments: string[]; // Change to string[] to store file URLs
}

interface Mission {
    _id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    leader: string;
    team: string[];
    category: string;
    createdBy: string;
    tasks: Task[];
    comments: string;
    attachments: string[]; // Change to string[] to store file URLs
}

const TaskMissionManager: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isTask, setIsTask] = useState(true);
    const [newTask, setNewTask] = useState<Task>({
        _id: '',
        title: '',
        description: '',
        status: 'pending',
        startDate: '',
        endDate: '',
        assignedTo: '',
        createdBy: '',
        points: 0,
        comments: '',
        attachments: [],
    });
    const [newMission, setNewMission] = useState<Mission>({
        _id: '',
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        leader: '',
        team: [],
        category: '',
        createdBy: '',
        tasks: [],
        comments: '',
        attachments: [],
    });
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    useEffect(() => {
        console.log("Componente montado");
        fetchUsers();
        fetchTasks();
        fetchMissions();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/users`);
            setUsers(response.data);
            console.log('Usuários carregados:', response.data);
        } catch (err) {
            setError('Erro ao carregar usuários');
        } finally {
            setLoading(false);
        }
    };

    const fetchTasks = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/tasks`);
            setTasks(response.data);
            console.log('Tarefas carregadas:', response.data);
        } catch (err) {
            setError('Erro ao carregar tarefas');
        }
    };

    const fetchMissions = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/missions`);
            setMissions(response.data);
            console.log('Missões carregadas:', response.data);
        } catch (err) {
            setError('Erro ao carregar missões');
        }
    };

    const handleTaskInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewTask({ ...newTask, [name]: value });
    };

    const handleTaskSelectChange = (e: SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        setNewTask({ ...newTask, [name]: value });
    };

    const handleTaskFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const fileUrls = Array.from(e.target.files).map(file => URL.createObjectURL(file));
            setNewTask({ ...newTask, attachments: fileUrls });
        }
    };

    const handleMissionInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setNewMission({ ...newMission, [name]: value });
    };

    const handleMissionSelectChange = (e: SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        setNewMission({ ...newMission, [name]: value });
    };

    const handleMissionTeamChange = (e: SelectChangeEvent<string[]>) => {
        setNewMission({ ...newMission, team: e.target.value as string[] });
    };

    const handleMissionFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const fileUrls = Array.from(e.target.files).map(file => URL.createObjectURL(file));
            setNewMission({ ...newMission, attachments: fileUrls });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const currentUser = users.find(user => user.username === 'Bruno'); // Ajuste para definir createdBy para fins de teste
            if (currentUser) {
                if (isTask) {
                    const taskToSubmit = { ...newTask, createdBy: currentUser._id };
                    console.log('Enviando tarefa:', taskToSubmit); // Adicionando log para verificar os dados
                    await axios.post(`${API_BASE_URL}/api/tasks`, taskToSubmit);
                    setSnackbarMessage('Tarefa criada com sucesso!');
                    fetchTasks(); // Atualizar lista de tarefas
                } else {
                    const missionToSubmit = { ...newMission, createdBy: currentUser._id };
                    console.log('Enviando missão:', missionToSubmit); // Adicionando log para verificar os dados
                    await axios.post(`${API_BASE_URL}/api/missions`, missionToSubmit);
                    setSnackbarMessage('Missão criada com sucesso!');
                    fetchMissions(); // Atualizar lista de missões
                }
                setSnackbarOpen(true);
                setIsModalOpen(false);
            } else {
                setError('Usuário não encontrado');
                setSnackbarMessage('Erro ao encontrar o usuário. Tente novamente.');
                setSnackbarOpen(true);
            }
        } catch (err) {
            setError('Erro ao criar tarefa ou missão');
            setSnackbarMessage('Erro ao criar tarefa ou missão. Tente novamente.');
            setSnackbarOpen(true);
        }
    };

    if (loading) {
        return <CircularProgress />;
    }

    if (error) {
        return <Alert severity="error">{error}</Alert>;
    }

    return (
        <Box sx={{ mt: 4 }}>
            <Button
                variant="contained"
                color="primary"
                onClick={() => {
                    setIsTask(true);
                    setIsModalOpen(true);
                }}
                sx={{ mb: 2, mr: 2 }}
            >
                Nova Tarefa
            </Button>
            <Button
                variant="contained"
                color="secondary"
                onClick={() => {
                    setIsTask(false);
                    setIsModalOpen(true);
                }}
                sx={{ mb: 2 }}
            >
                Nova Missão
            </Button>
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
                    width: 400,
                    bgcolor: 'background.paper',
                    boxShadow: 24,
                    p: 4,
                }}>
                    <Typography id="modal-title" variant="h6" component="h2">
                        {isTask ? 'Nova Tarefa' : 'Nova Missão'}
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        {isTask ? (
                            <>
                                <TextField
                                    label="Título"
                                    name="title"
                                    value={newTask.title}
                                    onChange={handleTaskInputChange}
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    label="Descrição"
                                    name="description"
                                    value={newTask.description}
                                    onChange={handleTaskInputChange}
                                    fullWidth
                                    margin="normal"
                                />
                                <FormControl fullWidth margin="dense">
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        name="status"
                                        value={newTask.status}
                                        onChange={handleTaskSelectChange}
                                        input={<OutlinedInput label="Status" />}
                                    >
                                        <MenuItem value="pending">Pendente</MenuItem>
                                        <MenuItem value="in_progress">Em Progresso</MenuItem>
                                        <MenuItem value="completed">Concluída</MenuItem>
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Data de Início"
                                    name="startDate"
                                    type="date"
                                    value={newTask.startDate}
                                    onChange={handleTaskInputChange}
                                    fullWidth
                                    margin="normal"
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                                <TextField
                                    label="Data de Conclusão"
                                    name="endDate"
                                    type="date"
                                    value={newTask.endDate}
                                    onChange={handleTaskInputChange}
                                    fullWidth
                                    margin="normal"
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                                <FormControl fullWidth margin="dense">
                                    <InputLabel>Responsável</InputLabel>
                                    <Select
                                        name="assignedTo"
                                        value={newTask.assignedTo}
                                        onChange={handleTaskSelectChange}
                                        input={<OutlinedInput label="Responsável" />}
                                    >
                                        {users.map((user) => (
                                            <MenuItem key={user._id} value={user._id}>
                                                {user.username}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Pontos"
                                    name="points"
                                    type="number"
                                    value={newTask.points}
                                    onChange={handleTaskInputChange}
                                    fullWidth
                                    margin="normal"
                                />
                                <TextareaAutosize
                                    name="comments"
                                    value={newTask.comments}
                                    onChange={handleTaskInputChange}
                                    placeholder="Comentários/Anotações"
                                    style={{ width: '100%', marginTop: '16px', padding: '8px' }}
                                />
                                <Input
                                    type="file"
                                    inputProps={{ multiple: true }}
                                    onChange={handleTaskFileChange}
                                    style={{ marginTop: '16px' }}
                                />
                            </>
                        ) : (
                            <>
                                <TextField
                                    label="Título"
                                    name="title"
                                    value={newMission.title}
                                    onChange={handleMissionInputChange}
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    label="Descrição"
                                    name="description"
                                    value={newMission.description}
                                    onChange={handleMissionInputChange}
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    label="Data de Início"
                                    name="startDate"
                                    type="date"
                                    value={newMission.startDate}
                                    onChange={handleMissionInputChange}
                                    fullWidth
                                    margin="normal"
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                                <TextField
                                    label="Data de Conclusão"
                                    name="endDate"
                                    type="date"
                                    value={newMission.endDate}
                                    onChange={handleMissionInputChange}
                                    fullWidth
                                    margin="normal"
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                />
                                <FormControl fullWidth margin="dense">
                                    <InputLabel>Líder da Missão</InputLabel>
                                    <Select
                                        name="leader"
                                        value={newMission.leader}
                                        onChange={handleMissionSelectChange}
                                        input={<OutlinedInput label="Líder da Missão" />}
                                    >
                                        {users.map((user) => (
                                            <MenuItem key={user._id} value={user._id}>
                                                {user.username}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <FormControl fullWidth margin="dense">
                                    <InputLabel>Equipe</InputLabel>
                                    <Select
                                        multiple
                                        name="team"
                                        value={newMission.team}
                                        onChange={handleMissionTeamChange}
                                        input={<OutlinedInput label="Equipe" />}
                                        renderValue={(selected) => selected.map((id) => users.find((user) => user._id === id)?.username).join(', ')}
                                    >
                                        {users.map((user) => (
                                            <MenuItem key={user._id} value={user._id}>
                                                <Checkbox checked={newMission.team.indexOf(user._id) > -1} />
                                                <ListItemText primary={user.username} />
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                                <TextField
                                    label="Categoria/Tag"
                                    name="category"
                                    value={newMission.category}
                                    onChange={handleMissionInputChange}
                                    fullWidth
                                    margin="normal"
                                />
                                <TextareaAutosize
                                    name="comments"
                                    value={newMission.comments}
                                    onChange={handleMissionInputChange}
                                    placeholder="Comentários/Anotações"
                                    style={{ width: '100%', marginTop: '16px', padding: '8px' }}
                                />
                                <Input
                                    type="file"
                                    inputProps={{ multiple: true }}
                                    onChange={handleMissionFileChange}
                                    style={{ marginTop: '16px' }}
                                />
                            </>
                        )}
                        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                            {isTask ? 'Criar Tarefa' : 'Criar Missão'}
                        </Button>
                    </form>
                </Box>
            </Modal>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                message={snackbarMessage}
            />
            <Box sx={{ mt: 4 }}>
                <Typography variant="h5">Tarefas</Typography>
                {tasks.length === 0 ? (
                    <Typography>Nenhuma tarefa encontrada.</Typography>
                ) : (
                    tasks.map(task => (
                        <Box key={task._id} sx={{ mb: 2 }}>
                            <Typography variant="h6">{task.title}</Typography>
                            <Typography>{task.description}</Typography>
                            <Typography>Status: {task.status}</Typography>
                            <Typography>Responsável: {users.find(user => user._id === task.assignedTo)?.username}</Typography>
                            <Typography>Data de Início: {task.startDate}</Typography>
                            <Typography>Data de Conclusão: {task.endDate}</Typography>
                            <Typography>Pontos: {task.points}</Typography>
                            <Typography>Comentários: {task.comments}</Typography>
                            <Typography>Anexos: {task.attachments ? task.attachments.map((file, index) => <a key={index} href={file} download>{file.split('/').pop()}</a>) : 'Nenhum anexo'}</Typography>
                        </Box>
                    ))
                )}
            </Box>
            <Box sx={{ mt: 4 }}>
                <Typography variant="h5">Missões</Typography>
                {missions.length === 0 ? (
                    <Typography>Nenhuma missão encontrada.</Typography>
                ) : (
                    missions.map(mission => (
                        <Box key={mission._id} sx={{ mb: 2 }}>
                            <Typography variant="h6">{mission.title}</Typography>
                            <Typography>{mission.description}</Typography>
                            <Typography>Líder: {users.find(user => user._id === mission.leader)?.username}</Typography>
                            <Typography>Data de Início: {mission.startDate}</Typography>
                            <Typography>Data de Conclusão: {mission.endDate}</Typography>
                            <Typography>Categoria: {mission.category}</Typography>
                            <Typography>Equipe: {mission.team ? mission.team.map(id => users.find(user => user._id === id)?.username).join(', ') : 'Nenhuma equipe'}</Typography>
                            <Typography>Comentários: {mission.comments}</Typography>
                            <Typography>Anexos: {mission.attachments ? mission.attachments.map((file, index) => <a key={index} href={file} download>{file.split('/').pop()}</a>) : 'Nenhum anexo'}</Typography>
                            <Typography>Tarefas:</Typography>
                            {mission.tasks ? mission.tasks.map(task => (
                                <Box key={task._id} sx={{ ml: 2, mb: 1 }}>
                                    <Typography variant="subtitle1">{task.title}</Typography>
                                    <Typography>{task.description}</Typography>
                                    <Typography>Status: {task.status}</Typography>
                                    <Typography>Responsável: {users.find(user => user._id === task.assignedTo)?.username}</Typography>
                                    <Typography>Data de Início: {task.startDate}</Typography>
                                    <Typography>Data de Conclusão: {task.endDate}</Typography>
                                    <Typography>Pontos: {task.points}</Typography>
                                    <Typography>Comentários: {task.comments}</Typography>
                                    <Typography>Anexos: {task.attachments ? task.attachments.map((file, index) => <a key={index} href={file} download>{file.split('/').pop()}</a>) : 'Nenhum anexo'}</Typography>
                                </Box>
                            )) : 'Nenhuma tarefa'}
                        </Box>
                    ))
                )}
            </Box>
        </Box>
    );
};

export default TaskMissionManager;
