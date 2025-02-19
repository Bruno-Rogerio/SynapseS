import React, { useState } from 'react';
import {
    Box,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    OutlinedInput,
    TextareaAutosize,
    Input,
    SelectChangeEvent,
    Typography
} from '@mui/material';
import { Task, User } from '../../types';

interface TaskFormProps {
    users: User[];
    onSubmit: (task: Task) => void;
    onClose: () => void;
}

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
        setNewTask(prev => ({ ...prev, [name as string]: value }));
    };

    const handleStatusChange = (e: SelectChangeEvent) => {
        setNewTask(prev => ({ ...prev, status: e.target.value as 'pending' | 'in_progress' | 'completed' }));
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
        const selectedDate = new Date(value);
        selectedDate.setHours(0, 0, 0, 0);
        const startDate = field === 'startDate' ? selectedDate : new Date(newTask.startDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = field === 'endDate' ? selectedDate : new Date(newTask.endDate);
        endDate.setHours(0, 0, 0, 0);

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
            console.log('Dados do formulário de tarefa:', newTask);
            onSubmit(newTask);
        }
    };

    return (
        <Box>
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
                <FormControl fullWidth margin="dense">
                    <InputLabel>Status</InputLabel>
                    <Select
                        name="status"
                        value={newTask.status}
                        onChange={handleStatusChange}
                        input={<OutlinedInput label="Status" />}
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
                />
                <FormControl fullWidth margin="dense">
                    <InputLabel>Responsável</InputLabel>
                    <Select
                        name="assignedTo"
                        value={newTask.assignedTo}
                        onChange={handleSelectChange}
                        input={<OutlinedInput label="Responsável" />}
                        required
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
                    onChange={handleInputChange}
                    fullWidth
                    margin="normal"
                />
                <TextareaAutosize
                    name="comments"
                    value={newTask.comments}
                    onChange={handleInputChange}
                    placeholder="Comentários/Anotações"
                    style={{ width: '100%', marginTop: '16px', padding: '8px' }}
                />
                <Input
                    type="file"
                    inputProps={{ multiple: true }}
                    onChange={handleFileChange}
                    style={{ marginTop: '16px' }}
                />
                {dateError && (
                    <Typography color="error" sx={{ mt: 2 }}>
                        {dateError}
                    </Typography>
                )}
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                    <Button type="submit" variant="contained" color="primary">
                        Criar Tarefa
                    </Button>
                    <Button variant="outlined" color="secondary" onClick={onClose}>
                        Cancelar
                    </Button>
                </Box>
            </form>
        </Box>
    );
};

export default TaskForm;
