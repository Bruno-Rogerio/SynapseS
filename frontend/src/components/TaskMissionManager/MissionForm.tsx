import React, { useState, useEffect } from 'react';
import {
    TextField,
    Button,
    Box,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    SelectChangeEvent,
} from '@mui/material';
import { Mission, User } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface MissionFormProps {
    users: User[];
    onSubmit: (mission: Omit<Mission, '_id'>) => void;
    onClose: () => void;
    initialMission?: Mission;
}

const MissionForm: React.FC<MissionFormProps> = ({ users, onSubmit, onClose, initialMission }) => {
    const { user } = useAuth();
    const [mission, setMission] = useState<Omit<Mission, '_id'>>({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        leader: '',
        team: [],
        tasks: [],
        createdBy: user?._id || '',
        status: 'pending',
        points: 0,
        comments: '',
        attachments: [],
        color: 'teal'
    });
    const [dateErrors, setDateErrors] = useState({
        startDate: '',
        endDate: ''
    });

    useEffect(() => {
        if (initialMission) {
            setMission(initialMission);
        }
    }, [initialMission]);

    useEffect(() => {
        setMission(prev => ({ ...prev, createdBy: user?._id || '' }));
    }, [user]);

    const validateDates = (field: string, value: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(value + 'T00:00:00');
        const startDate = field === 'startDate' ? selectedDate : new Date(mission.startDate + 'T00:00:00');
        const endDate = field === 'endDate' ? selectedDate : new Date(mission.endDate + 'T00:00:00');

        let newErrors = { ...dateErrors };

        if (selectedDate < today) {
            newErrors[field as keyof typeof dateErrors] = 'A data não pode ser anterior a hoje';
        } else {
            newErrors[field as keyof typeof dateErrors] = '';
        }

        if (field === 'endDate' && endDate < startDate) {
            newErrors.endDate = 'A data de conclusão não pode ser anterior à data de início';
        }

        setDateErrors(newErrors);
        return !newErrors.startDate && !newErrors.endDate;
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string | string[]>) => {
        const { name, value } = e.target;
        setMission(prev => ({ ...prev, [name]: value }));

        if (name === 'startDate' || name === 'endDate') {
            validateDates(name, value as string);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const startDateValid = validateDates('startDate', mission.startDate);
        const endDateValid = validateDates('endDate', mission.endDate);
        if (startDateValid && endDateValid) {
            onSubmit({
                ...mission,
                createdBy: user?._id || '',
            });
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <TextField
                fullWidth
                label="Título"
                name="title"
                value={mission.title}
                onChange={handleChange}
                margin="normal"
                required
            />
            <TextField
                fullWidth
                label="Descrição"
                name="description"
                value={mission.description}
                onChange={handleChange}
                margin="normal"
                multiline
                rows={4}
                required
            />
            <TextField
                fullWidth
                label="Data de Início"
                name="startDate"
                type="date"
                value={mission.startDate}
                onChange={handleChange}
                margin="normal"
                InputLabelProps={{
                    shrink: true,
                }}
                required
                error={!!dateErrors.startDate}
                helperText={dateErrors.startDate}
            />
            <TextField
                fullWidth
                label="Data de Término"
                name="endDate"
                type="date"
                value={mission.endDate}
                onChange={handleChange}
                margin="normal"
                InputLabelProps={{
                    shrink: true,
                }}
                required
                error={!!dateErrors.endDate}
                helperText={dateErrors.endDate}
            />
            <FormControl fullWidth margin="normal" required>
                <InputLabel>Líder</InputLabel>
                <Select
                    name="leader"
                    value={mission.leader}
                    onChange={handleChange}
                >
                    {users.map(user => (
                        <MenuItem key={user._id} value={user._id}>{user.username}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
                <InputLabel>Equipe</InputLabel>
                <Select
                    multiple
                    name="team"
                    value={mission.team}
                    onChange={handleChange}
                    renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(selected as string[]).map((value) => (
                                <Chip key={value} label={users.find(user => user._id === value)?.username} />
                            ))}
                        </Box>
                    )}
                >
                    {users.map(user => (
                        <MenuItem key={user._id} value={user._id}>{user.username}</MenuItem>
                    ))}
                </Select>
            </FormControl>
            <TextField
                fullWidth
                label="Pontos"
                name="points"
                type="number"
                value={mission.points}
                onChange={handleChange}
                margin="normal"
            />
            <TextField
                fullWidth
                label="Comentários"
                name="comments"
                value={mission.comments}
                onChange={handleChange}
                margin="normal"
                multiline
                rows={4}
            />
            <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                    name="status"
                    value={mission.status}
                    onChange={handleChange}
                >
                    <MenuItem value="pending">Pendente</MenuItem>
                    <MenuItem value="in_progress">Em Progresso</MenuItem>
                    <MenuItem value="completed">Concluída</MenuItem>
                </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
                <InputLabel>Cor</InputLabel>
                <Select
                    name="color"
                    value={mission.color}
                    onChange={handleChange}
                >
                    <MenuItem value="teal">Teal</MenuItem>
                    <MenuItem value="cyan">Cyan</MenuItem>
                    <MenuItem value="indigo">Indigo</MenuItem>
                    <MenuItem value="deepPurple">Deep Purple</MenuItem>
                    <MenuItem value="pink">Pink</MenuItem>
                    <MenuItem value="amber">Amber</MenuItem>
                </Select>
            </FormControl>
            <Box sx={{ mt: 2 }}>
                <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    sx={{ mr: 1 }}
                    disabled={!!dateErrors.startDate || !!dateErrors.endDate}
                >
                    Salvar
                </Button>
                <Button onClick={onClose} variant="outlined">
                    Cancelar
                </Button>
            </Box>
        </form>
    );
};

export default MissionForm;
