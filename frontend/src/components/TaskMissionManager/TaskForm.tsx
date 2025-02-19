import React, { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    SelectChangeEvent,
    Typography
} from '@mui/material';
import { Task, User } from '../../types';

interface TaskFormProps {
    users: User[];
    onSubmit: (task: Task) => void;
    onClose: () => void;
}

const colorOptions = [
    { value: 'teal', label: 'Verde Água' },
    { value: 'cyan', label: 'Ciano' },
    { value: 'indigo', label: 'Índigo' },
    { value: 'deepPurple', label: 'Roxo Profundo' },
    { value: 'pink', label: 'Rosa' },
    { value: 'amber', label: 'Âmbar' },
];

const TaskForm: React.FC<TaskFormProps> = ({ users, onSubmit, onClose }) => {
    const [newTask, setNewTask] = useState<Task>({
        _id: '',
        title: '',
        description: '',
        status: 'pending',
        startDate: '',
        endDate: '',
        assignedTo: '',
        createdBy: '', // Será preenchido no TaskMissionManager
        points: 0,
        comments: '',
        attachments: [],
        color: 'teal',
    });
    const [dateError, setDateError] = useState<string | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'startDate' || name === 'endDate') {
            validateDates(name, value);
        }
        setNewTask(prev => ({ ...prev, [name]: value }));
    };

    const handleSelectChange = (e: SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        setNewTask(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const fileUrls = Array.from(e.target.files).map(file => URL.createObjectURL(file));
            setNewTask(prev => ({ ...prev, attachments: fileUrls }));
        }
    };

    const validateDates = (field: string, value: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(value + 'T00:00:00');
        const startDate = field === 'startDate' ? selectedDate : new Date(newTask.startDate + 'T00:00:00');
        const endDate = field === 'endDate' ? selectedDate : new Date(newTask.endDate + 'T00:00:00');

        if (selectedDate < today) {
            setDateError('A data não pode ser anterior a hoje');
            return false;
        }

        if (field === 'endDate' && endDate < startDate) {
            setDateError('A data de conclusão não pode ser anterior à data de início');
            return false;
        }

        setDateError(null);
        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (validateDates('startDate', newTask.startDate) && validateDates('endDate', newTask.endDate)) {
            onSubmit(newTask);
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
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
                    required
                />
                <TextField
                    label="Descrição"
                    name="description"
                    value={newTask.description}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    multiline
                    rows={4}
                />
                <FormControl fullWidth margin="normal">
                    <InputLabel>Status</InputLabel>
                    <Select
                        name="status"
                        value={newTask.status}
                        onChange={handleSelectChange}
                        label="Status"
                        required
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
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    InputLabelProps={{ shrink: true }}
                    required
                    error={!!dateError}
                    helperText={dateError}
                    inputProps={{
                        min: new Date().toISOString().split('T')[0]
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
                    InputLabelProps={{ shrink: true }}
                    error={!!dateError}
                    helperText={dateError}
                    inputProps={{
                        min: newTask.startDate || new Date().toISOString().split('T')[0]
                    }}
                />
                <FormControl fullWidth margin="normal">
                    <InputLabel>Responsável</InputLabel>
                    <Select
                        name="assignedTo"
                        value={newTask.assignedTo || ''}
                        onChange={handleSelectChange}
                        label="Responsável"
                    >
                        <MenuItem value="">
                            <em>Nenhum</em>
                        </MenuItem>
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
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                />
                <FormControl fullWidth margin="normal">
                    <InputLabel>Cor do Cartão</InputLabel>
                    <Select
                        name="color"
                        value={newTask.color}
                        onChange={handleSelectChange}
                        label="Cor do Cartão"
                    >
                        {colorOptions.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                                {option.label}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                <TextField
                    label="Comentários"
                    name="comments"
                    value={newTask.comments}
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                    multiline
                    rows={4}
                />
                <input
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    id="file-upload"
                />
                <label htmlFor="file-upload">
                    <Button variant="contained" component="span" sx={{ mt: 2, mb: 2 }}>
                        Anexar Arquivos
                    </Button>
                </label>
                {newTask.attachments.length > 0 && (
                    <Box sx={{ mt: 2, mb: 2 }}>
                        <Typography variant="subtitle1">Anexos:</Typography>
                        {newTask.attachments.map((attachment, index) => (
                            <Typography key={index}>{attachment}</Typography>
                        ))}
                    </Box>
                )}
                <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <Button onClick={onClose} color="secondary" sx={{ mr: 1 }}>
                        Cancelar
                    </Button>
                    <Button type="submit" variant="contained" color="primary">
                        Criar Tarefa
                    </Button>
                </Box>
            </form>
        </Box>
    );
};

export default TaskForm;
