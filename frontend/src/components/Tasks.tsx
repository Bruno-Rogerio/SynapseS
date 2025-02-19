import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    Button,
    Typography,
    Box,
    CircularProgress,
    Alert,
    TextField,
    Select,
    MenuItem,
    Modal,
    Snackbar,
    SelectChangeEvent,
} from '@mui/material';
import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

interface User {
    id: string;
    username: string;
}

interface Task {
    id: string;
    title: string;
    description: string;
    status: 'pending' | 'in_progress' | 'completed';
    startDate: string;
    endDate: string;
    assignedTo: { username: string };
    points: number;
}

const Tasks: React.FC = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newTask, setNewTask] = useState({ title: '', description: '', status: 'pending', startDate: '', endDate: '', assignedTo: '', points: 0 });
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    useEffect(() => {
        fetchTasks();
        fetchUsers();
    }, []);

    const fetchTasks = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/tasks`);
            setTasks(response.data);
            setLoading(false);
        } catch (err) {
            setError('Erro ao carregar tarefas');
            setLoading(false);
        }
    };

    const fetchUsers = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/users`);
            setUsers(response.data);
        } catch (err) {
            setError('Erro ao carregar usuários');
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setNewTask({ ...newTask, [name]: value });
    };

    const handleSelectChange = (e: SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        setNewTask({ ...newTask, [name]: value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/api/tasks`, newTask);
            setSnackbarMessage('Tarefa criada com sucesso!');
            setSnackbarOpen(true);
            setIsModalOpen(false);
            fetchTasks();
        } catch (err) {
            setError('Erro ao criar tarefa');
            setSnackbarMessage('Erro ao criar tarefa. Tente novamente.');
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
            <Typography variant="h4" gutterBottom>
                Gestão de Tarefas
            </Typography>
            <Button
                variant="contained"
                color="primary"
                onClick={() => setIsModalOpen(true)}
                sx={{ mb: 2 }}
            >
                Nova Tarefa
            </Button>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Título</TableCell>
                            <TableCell>Descrição</TableCell>
                            <TableCell>Status</TableCell>
                            <TableCell>Data de Início</TableCell>
                            <TableCell>Data de Conclusão</TableCell>
                            <TableCell>Responsável</TableCell>
                            <TableCell>Pontos</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {tasks.map((task) => (
                            <TableRow key={task.id}>
                                <TableCell>{task.title}</TableCell>
                                <TableCell>{task.description}</TableCell>
                                <TableCell>{task.status}</TableCell>
                                <TableCell>{new Date(task.startDate).toLocaleDateString()}</TableCell>
                                <TableCell>{new Date(task.endDate).toLocaleDateString()}</TableCell>
                                <TableCell>{task.assignedTo.username}</TableCell>
                                <TableCell>{task.points}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
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
                        Nova Tarefa
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <TextField
                            label="Título"
                            name="title"
                            value={newTask.title}
                            onChange={handleInputChange}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Descrição"
                            name="description"
                            value={newTask.description}
                            onChange={handleInputChange}
                            fullWidth
                            margin="normal"
                        />
                        <Select
                            label="Status"
                            name="status"
                            value={newTask.status}
                            onChange={handleSelectChange}
                            fullWidth
                            margin="dense"
                        >
                            <MenuItem value="pending">Pendente</MenuItem>
                            <MenuItem value="in_progress">Em Progresso</MenuItem>
                            <MenuItem value="completed">Concluída</MenuItem>
                        </Select>
                        <TextField
                            label="Data de Início"
                            name="startDate"
                            type="date"
                            value={newTask.startDate}
                            onChange={handleInputChange}
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
                            onChange={handleInputChange}
                            fullWidth
                            margin="normal"
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                        <Select
                            label="Responsável"
                            name="assignedTo"
                            value={newTask.assignedTo}
                            onChange={handleSelectChange}
                            fullWidth
                            margin="dense"
                        >
                            {users.map((user) => (
                                <MenuItem key={user.id} value={user.id}>
                                    {user.username}
                                </MenuItem>
                            ))}
                        </Select>
                        <TextField
                            label="Pontos"
                            name="points"
                            type="number"
                            value={newTask.points}
                            onChange={handleInputChange}
                            fullWidth
                            margin="normal"
                        />
                        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                            Criar Tarefa
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
        </Box>
    );
};

export default Tasks;
