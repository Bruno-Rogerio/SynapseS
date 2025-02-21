// frontend/src/components/TaskMissionManager/MissionForm.tsx
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
    OutlinedInput,
    Typography,
    Divider,
    IconButton,
} from '@mui/material';
import { SelectChangeEvent } from '@mui/material/Select';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { Mission, User, Task } from '../../types';
import { useAuth } from '../../hooks/useAuth';

interface MissionFormProps {
    users: User[];
    onSubmit: (mission: Omit<Mission, '_id' | 'tasks'> & { tasks: Task[] }) => void;
    onClose: () => void;
    initialMission?: Mission & { tasksDetail?: Task[] };
}

interface NewTask {
    title: string;
    assignedTo: string;
    dueDate: string;
}

const MissionForm: React.FC<MissionFormProps> = ({ users, onSubmit, onClose, initialMission }) => {
    const { user } = useAuth();
    const [mission, setMission] = useState<Omit<Mission, '_id' | 'tasks'> & { tasks: Task[] }>({
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
        color: 'teal',
    });
    const [newTask, setNewTask] = useState<NewTask>({ title: '', assignedTo: '', dueDate: '' });
    const [dateErrors, setDateErrors] = useState<{ startDate: string; endDate: string }>({ startDate: '', endDate: '' });

    useEffect(() => {
        if (initialMission) {
            // Se estiver editando, assume que as tarefas detalhadas são passadas em initialMission.tasksDetail
            setMission({
                title: initialMission.title,
                description: initialMission.description,
                startDate: initialMission.startDate,
                endDate: initialMission.endDate,
                leader: initialMission.leader,
                team: initialMission.team,
                tasks: (initialMission as any).tasksDetail || [],
                createdBy: initialMission.createdBy,
                status: initialMission.status,
                points: initialMission.points,
                comments: initialMission.comments,
                attachments: initialMission.attachments,
                color: initialMission.color,
            });
        }
    }, [initialMission]);

    // Handler para inputs padrão (TextField, etc)
    const handleChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | React.ChangeEvent<{ name?: string; value: unknown; }>
    ) => {
        const { name, value } = e.target;
        setMission(prev => ({ ...prev, [name as string]: value }));
        if (name === 'startDate' || name === 'endDate') {
            validateDates(name as string, value as string);
        }
    };

    // Handler para Selects que atualizam a missão
    const handleSelectChange = (event: SelectChangeEvent<string> | SelectChangeEvent<string[]>) => {
        const { name, value } = event.target;
        setMission(prev => ({ ...prev, [name as string]: value }));
    };

    // Handler para Selects que atualizam a tarefa (newTask)
    const handleSelectChangeForTask = (event: SelectChangeEvent<string>) => {
        const { name, value } = event.target;
        setNewTask(prev => ({ ...prev, [name as string]: value }));
    };

    const validateDates = (field: string, value: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(value + 'T00:00:00');
        let errors = { ...dateErrors };
        if (selectedDate < today) {
            errors[field as keyof typeof dateErrors] = 'A data não pode ser anterior a hoje';
        } else {
            errors[field as keyof typeof dateErrors] = '';
        }
        if (field === 'endDate' && mission.startDate) {
            const startDate = new Date(mission.startDate + 'T00:00:00');
            if (selectedDate < startDate) {
                errors.endDate = 'A data de término não pode ser anterior à data de início';
            }
        }
        setDateErrors(errors);
        return !errors.startDate && !errors.endDate;
    };

    const handleTaskChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | React.ChangeEvent<{ name?: string; value: unknown; }>
    ) => {
        const { name, value } = e.target;
        setNewTask(prev => ({ ...prev, [name as string]: value }));
    };

    const addTask = () => {
        if (newTask.title && newTask.assignedTo) {
            const task: Task = {
                _id: '', // Será definido pelo backend
                title: newTask.title,
                description: '',
                status: 'pending',
                startDate: mission.startDate, // ou outro valor padrão
                endDate: newTask.dueDate,
                assignedTo: newTask.assignedTo,
                createdBy: user?._id || '',
                points: 0,
                comments: '',
                attachments: [],
                color: 'teal',
                missionId: '', // Será associado após criação da missão
            };
            setMission(prev => ({ ...prev, tasks: [...prev.tasks, task] }));
            setNewTask({ title: '', assignedTo: '', dueDate: '' });
        }
    };

    const removeTask = (index: number) => {
        setMission(prev => ({
            ...prev,
            tasks: prev.tasks.filter((_, idx) => idx !== index),
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateDates('startDate', mission.startDate) && validateDates('endDate', mission.endDate)) {
            onSubmit(mission);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
                Criar / Editar Missão
            </Typography>
            <TextField
                fullWidth
                label="Objetivo da Missão"
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
                InputLabelProps={{ shrink: true }}
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
                InputLabelProps={{ shrink: true }}
                required
                error={!!dateErrors.endDate}
                helperText={dateErrors.endDate}
            />
            <FormControl fullWidth margin="normal" required>
                <InputLabel>Líder da Missão</InputLabel>
                <Select name="leader" value={mission.leader} onChange={handleSelectChange}>
                    {users.map(u => (
                        <MenuItem key={u._id} value={u._id}>
                            {u.username}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <FormControl fullWidth margin="normal" required>
                <InputLabel>Time Responsável</InputLabel>
                <Select
                    name="team"
                    multiple
                    value={mission.team}
                    onChange={handleSelectChange}
                    input={<OutlinedInput label="Time Responsável" />}
                    renderValue={selected => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {(selected as string[]).map(value => (
                                <Chip key={value} label={users.find(u => u._id === value)?.username} />
                            ))}
                        </Box>
                    )}
                >
                    {users.map(u => (
                        <MenuItem key={u._id} value={u._id}>
                            {u.username}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1">Tarefas Iniciais</Typography>
            {mission.tasks.map((task, index) => (
                <Box key={index} sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                    <Typography sx={{ flexGrow: 1 }}>
                        {task.title} - {users.find(u => u._id === task.assignedTo)?.username}
                    </Typography>
                    <IconButton onClick={() => removeTask(index)} size="small">
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            ))}
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
                <TextField
                    label="Título da Tarefa"
                    name="title"
                    value={newTask.title}
                    onChange={handleTaskChange}
                    size="small"
                    sx={{ mr: 1 }}
                />
                <FormControl size="small" sx={{ mr: 1, minWidth: 120 }}>
                    <InputLabel>Responsável</InputLabel>
                    <Select name="assignedTo" value={newTask.assignedTo} onChange={handleSelectChangeForTask} label="Responsável">
                        {users.map(u => (
                            <MenuItem key={u._id} value={u._id}>
                                {u.username}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField
                    label="Data Limite"
                    name="dueDate"
                    type="date"
                    value={newTask.dueDate}
                    onChange={handleTaskChange}
                    size="small"
                    InputLabelProps={{ shrink: true }}
                    sx={{ mr: 1 }}
                />
                <IconButton onClick={addTask} color="primary">
                    <AddIcon />
                </IconButton>
            </Box>
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                <Button type="submit" variant="contained" color="primary">
                    Salvar Missão
                </Button>
                <Button onClick={onClose} variant="outlined">
                    Cancelar
                </Button>
            </Box>
        </Box>
    );
};

export default MissionForm;
