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
    Modal,
    Snackbar,
} from '@mui/material';
import config from '../config';

const API_BASE_URL = config.API_BASE_URL;

interface Mission {
    id: string;
    title: string;
    description: string;
    startDate: string;
    endDate: string;
    tasks: { title: string }[];
}

const Missions: React.FC = () => {
    const [missions, setMissions] = useState<Mission[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newMission, setNewMission] = useState({ title: '', description: '', startDate: '', endDate: '' });
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');

    useEffect(() => {
        fetchMissions();
    }, []);

    const fetchMissions = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/missions`);
            setMissions(response.data);
            setLoading(false);
        } catch (err) {
            setError('Erro ao carregar missões');
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setNewMission({ ...newMission, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await axios.post(`${API_BASE_URL}/api/missions`, newMission);
            setSnackbarMessage('Missão criada com sucesso!');
            setSnackbarOpen(true);
            setIsModalOpen(false);
            fetchMissions();
        } catch (err) {
            setError('Erro ao criar missão');
            setSnackbarMessage('Erro ao criar missão. Tente novamente.');
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
                Gestão de Missões
            </Typography>
            <Button
                variant="contained"
                color="primary"
                onClick={() => setIsModalOpen(true)}
                sx={{ mb: 2 }}
            >
                Nova Missão
            </Button>
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Título</TableCell>
                            <TableCell>Descrição</TableCell>
                            <TableCell>Data de Início</TableCell>
                            <TableCell>Data de Conclusão</TableCell>
                            <TableCell>Tarefas</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {missions.map((mission) => (
                            <TableRow key={mission.id}>
                                <TableCell>{mission.title}</TableCell>
                                <TableCell>{mission.description}</TableCell>
                                <TableCell>{new Date(mission.startDate).toLocaleDateString()}</TableCell>
                                <TableCell>{new Date(mission.endDate).toLocaleDateString()}</TableCell>
                                <TableCell>
                                    {mission.tasks.map((task, index) => (
                                        <div key={index}>{task.title}</div>
                                    ))}
                                </TableCell>
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
                        Nova Missão
                    </Typography>
                    <form onSubmit={handleSubmit}>
                        <TextField
                            label="Título"
                            name="title"
                            value={newMission.title}
                            onChange={handleInputChange}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Descrição"
                            name="description"
                            value={newMission.description}
                            onChange={handleInputChange}
                            fullWidth
                            margin="normal"
                        />
                        <TextField
                            label="Data de Início"
                            name="startDate"
                            type="date"
                            value={newMission.startDate}
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
                            value={newMission.endDate}
                            onChange={handleInputChange}
                            fullWidth
                            margin="normal"
                            InputLabelProps={{
                                shrink: true,
                            }}
                        />
                        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
                            Criar Missão
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

export default Missions;
