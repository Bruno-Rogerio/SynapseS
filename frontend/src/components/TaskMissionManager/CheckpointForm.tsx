// frontend/src/components/TaskMissionManager/CheckpointForm.tsx
import React, { useState, useEffect } from 'react';
import { Box, TextField, Button, Typography, Select, MenuItem, FormControl, InputLabel, Alert } from '@mui/material';
import { Checkpoint, User } from '../../types';

interface CheckpointFormProps {
    onSubmit: (checkpoint: Omit<Checkpoint, 'id'>) => void;
    onClose: () => void;
    initialCheckpoint?: Partial<Checkpoint>;
    teamMembers: User[];
    missionStartDate: string;
    missionEndDate: string;
}

const CheckpointForm: React.FC<CheckpointFormProps> = ({
    onSubmit,
    onClose,
    initialCheckpoint,
    teamMembers,
    missionStartDate,
    missionEndDate
}) => {
    const [title, setTitle] = useState(initialCheckpoint?.title || '');
    const [dueDate, setDueDate] = useState(initialCheckpoint?.dueDate ? new Date(initialCheckpoint.dueDate).toISOString().split('T')[0] : '');
    const [status, setStatus] = useState<Checkpoint['status']>(initialCheckpoint?.status || 'pending');
    const [assignedTo, setAssignedTo] = useState(initialCheckpoint?.assignedTo || '');
    const [minDate, setMinDate] = useState('');
    const [maxDate, setMaxDate] = useState('');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('CheckpointForm useEffect');
        console.log('missionStartDate:', missionStartDate);
        console.log('missionEndDate:', missionEndDate);
        console.log('teamMembers:', teamMembers);
        console.log('initialCheckpoint:', initialCheckpoint);

        if (!missionStartDate || !missionEndDate) {
            setError('Datas da missão não definidas');
            return;
        }

        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);
        const missionStart = new Date(missionStartDate);
        const missionEnd = new Date(missionEndDate);

        if (isNaN(missionStart.getTime()) || isNaN(missionEnd.getTime())) {
            setError('Data de início ou fim da missão inválida');
            return;
        }

        setError(null);
        const effectiveMinDate = missionStart > today ? missionStart : today;
        setMinDate(effectiveMinDate.toISOString().split('T')[0]);
        setMaxDate(missionEnd.toISOString().split('T')[0]);

        if (!dueDate) {
            setDueDate(effectiveMinDate.toISOString().split('T')[0]);
        } else {
            const currentDueDate = new Date(dueDate);
            if (currentDueDate < effectiveMinDate || currentDueDate > missionEnd) {
                setDueDate(effectiveMinDate.toISOString().split('T')[0]);
            }
        }

        if (teamMembers.length > 0 && !assignedTo) {
            setAssignedTo(teamMembers[0]._id);
        }
    }, [missionStartDate, missionEndDate, dueDate, teamMembers, assignedTo, initialCheckpoint]);

    const validateDueDate = (date: string) => {
        const selectedDate = new Date(date);
        const missionStart = new Date(missionStartDate);
        const missionEnd = new Date(missionEndDate);

        selectedDate.setUTCHours(12, 0, 0, 0);
        missionStart.setUTCHours(0, 0, 0, 0);
        missionEnd.setUTCHours(23, 59, 59, 999);

        if (selectedDate < missionStart || selectedDate > missionEnd) {
            setError('A data deve estar dentro do período da missão');
            return false;
        }
        setError(null);
        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title || !dueDate || !assignedTo) {
            setError('Todos os campos são obrigatórios');
            return;
        }
        if (!validateDueDate(dueDate)) {
            return;
        }
        const dueDateWithTime = new Date(dueDate);
        dueDateWithTime.setUTCHours(12, 0, 0, 0);
        onSubmit({ title, dueDate: dueDateWithTime.toISOString(), status, assignedTo });
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                {initialCheckpoint ? 'Editar Checkpoint' : 'Novo Checkpoint'}
            </Typography>
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <TextField
                fullWidth
                label="Título"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                margin="normal"
                required
            />
            <TextField
                fullWidth
                label="Data de Entrega"
                type="date"
                value={dueDate}
                onChange={(e) => {
                    const newDate = e.target.value;
                    setDueDate(newDate);
                    validateDueDate(newDate);
                }}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                inputProps={{
                    min: minDate,
                    max: maxDate
                }}
                required
            />
            <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as Checkpoint['status'])}
                    label="Status"
                >
                    <MenuItem value="pending">Pendente</MenuItem>
                    <MenuItem value="in_progress">Em Progresso</MenuItem>
                    <MenuItem value="completed">Concluído</MenuItem>
                </Select>
            </FormControl>
            <FormControl fullWidth margin="normal" required>
                <InputLabel>Atribuído a</InputLabel>
                <Select
                    value={assignedTo}
                    onChange={(e) => setAssignedTo(e.target.value)}
                    label="Atribuído a"
                >
                    {teamMembers.map((member) => (
                        <MenuItem key={member._id} value={member._id}>
                            {member.username} {member.role === 'Gestor' ? '(Líder)' : ''}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2, gap: 2 }}>
                <Button variant="outlined" onClick={onClose}>
                    Cancelar
                </Button>
                <Button type="submit" variant="contained" color="primary" disabled={!!error}>
                    Salvar
                </Button>
            </Box>
        </Box>
    );
};

export default CheckpointForm;
