import React, { useState } from 'react';
import {
    Box,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Grid,
    Chip,
    SelectChangeEvent
} from '@mui/material';
import { Mission, User, Task } from '../../types';

interface MissionDetailsProps {
    mission: Mission;
    users: User[];
    onSave: (updatedMission: Mission) => void;
    onDelete: () => void;
    onClose: () => void;
    onTaskClick: (task: Task) => void;
}

const MissionDetails: React.FC<MissionDetailsProps> = ({
    mission,
    users,
    onSave,
    onDelete,
    onClose,
    onTaskClick
}) => {
    const [editedMission, setEditedMission] = useState<Mission>(mission);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        setEditedMission(prev => ({ ...prev, [name]: value }));
    };

    const handleTeamChange = (event: SelectChangeEvent<string[]>) => {
        const { value } = event.target;
        setEditedMission(prev => ({ ...prev, team: typeof value === 'string' ? value.split(',') : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(editedMission);
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
                Detalhes da Missão
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Título"
                        name="title"
                        value={editedMission.title}
                        onChange={handleChange}
                    />
                </Grid>
                <Grid item xs={12}>
                    <TextField
                        fullWidth
                        label="Descrição"
                        name="description"
                        multiline
                        rows={4}
                        value={editedMission.description}
                        onChange={handleChange}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel>Líder</InputLabel>
                        <Select
                            name="leader"
                            value={editedMission.leader}
                            onChange={handleChange}
                        >
                            {users.map(user => (
                                <MenuItem key={user._id} value={user._id}>{user.username}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                        <InputLabel>Equipe</InputLabel>
                        <Select
                            multiple
                            name="team"
                            value={editedMission.team}
                            onChange={handleTeamChange}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {(selected as string[]).map((value) => (
                                        <Chip key={value} label={users.find(user => user._id === value)?.username} />
                                    ))}
                                </Box>
                            )}
                        >
                            {users.map(user => (
                                <MenuItem key={user._id} value={user._id}>
                                    {user.username}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Data de Início"
                        name="startDate"
                        type="date"
                        value={editedMission.startDate}
                        onChange={handleChange}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                </Grid>
                <Grid item xs={12} sm={6}>
                    <TextField
                        fullWidth
                        label="Data de Conclusão"
                        name="endDate"
                        type="date"
                        value={editedMission.endDate}
                        onChange={handleChange}
                        InputLabelProps={{
                            shrink: true,
                        }}
                    />
                </Grid>
            </Grid>
            <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Tarefas da Missão
            </Typography>
            {editedMission.tasks.map((task: Task) => (
                <Typography
                    key={task._id}
                    onClick={() => onTaskClick(task)}
                    style={{ cursor: 'pointer' }}
                >
                    {task.title} - {task.status}
                </Typography>
            ))}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Button type="submit" variant="contained" color="primary">
                    Salvar
                </Button>
                <Button onClick={onDelete} variant="outlined" color="error">
                    Excluir
                </Button>
                <Button onClick={onClose} variant="outlined">
                    Cancelar
                </Button>
            </Box>
        </Box>
    );
};

export default MissionDetails;
