// frontend/src/components/TaskMissionManager/MissionCheckpointsManager.tsx
import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    List,
    ListItem,
    ListItemText,
    IconButton,
    Button,
    Modal,
    TextField,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import axios from 'axios';
import config from '../../config';
import { useAuth } from '../../hooks/useAuth';
import { Checkpoint } from '../../types';

const API_BASE_URL = config.API_BASE_URL;

interface MissionCheckpointsManagerProps {
    missionId: string;
}

const MissionCheckpointsManager: React.FC<MissionCheckpointsManagerProps> = ({ missionId }) => {
    const { user } = useAuth();
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [openModal, setOpenModal] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDueDate, setNewDueDate] = useState('');

    useEffect(() => {
        axios
            .get(`${API_BASE_URL}/api/missions/${missionId}`)
            .then(response => {
                const mission = response.data;
                setCheckpoints(mission.checkpoints || []);
                setLoading(false);
            })
            .catch(err => {
                setError('Erro ao carregar checkpoints.');
                setLoading(false);
            });
    }, [missionId]);

    const handleAddCheckpoint = () => {
        const payload = {
            title: newTitle,
            dueDate: newDueDate,
            user: user?._id,
        };
        axios
            .post(`${API_BASE_URL}/api/missions/${missionId}/checkpoints`, payload)
            .then(response => {
                const mission = response.data;
                setCheckpoints(mission.checkpoints || []);
                setOpenModal(false);
                setNewTitle('');
                setNewDueDate('');
            })
            .catch(error => {
                setError('Erro ao adicionar checkpoint.');
            });
    };

    const handleDeleteCheckpoint = (checkpointId: string) => {
        axios
            .delete(`${API_BASE_URL}/api/missions/${missionId}/checkpoints/${checkpointId}`)
            .then(response => {
                const mission = response.data;
                setCheckpoints(mission.checkpoints || []);
            })
            .catch(error => {
                setError('Erro ao remover checkpoint.');
            });
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h6">Checkpoints da Missão</Typography>
            {loading ? (
                <Typography>Carregando...</Typography>
            ) : error ? (
                <Typography color="error">{error}</Typography>
            ) : checkpoints.length === 0 ? (
                <Typography>Nenhum checkpoint encontrado.</Typography>
            ) : (
                <List>
                    {checkpoints.map(cp => (
                        <ListItem key={cp.id}>
                            <ListItemText
                                primary={cp.title}
                                secondary={`Status: ${cp.status} - Entrega: ${new Date(cp.dueDate).toLocaleDateString()}`}
                            />
                            <IconButton edge="end" onClick={() => handleDeleteCheckpoint(cp.id)}>
                                <DeleteIcon />
                            </IconButton>
                        </ListItem>
                    ))}
                </List>
            )}
            <Button variant="contained" sx={{ mt: 2 }} onClick={() => setOpenModal(true)}>
                Adicionar Checkpoint
            </Button>
            <Modal open={openModal} onClose={() => setOpenModal(false)}>
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '90%',
                        maxWidth: 500,
                        bgcolor: 'background.paper',
                        p: 2,
                        borderRadius: 2,
                        boxShadow: 24,
                        overflowY: 'auto',
                    }}
                >
                    <Typography variant="h6" gutterBottom>
                        Novo Checkpoint
                    </Typography>
                    <TextField
                        fullWidth
                        label="Título"
                        value={newTitle}
                        onChange={e => setNewTitle(e.target.value)}
                        margin="normal"
                        required
                    />
                    <TextField
                        fullWidth
                        label="Data de Entrega"
                        type="date"
                        value={newDueDate}
                        onChange={e => setNewDueDate(e.target.value)}
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                        required
                    />
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
                        <Button variant="contained" onClick={handleAddCheckpoint}>
                            Salvar
                        </Button>
                        <Button variant="outlined" onClick={() => setOpenModal(false)}>
                            Cancelar
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </Box>
    );
};

export default MissionCheckpointsManager;
