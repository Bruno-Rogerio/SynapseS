import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Button,
    TextField,
    Select,
    MenuItem,
    FormControl,
    InputLabel,
    SelectChangeEvent,
} from '@mui/material';
import { Task, User } from '../../types';
import ColorSelector from './ColorSelector';

interface TaskDetailsProps {
    task: Task;
    users: User[];
    onSave: (task: Task) => void;
    onDelete: () => void;
    onClose: () => void;
    onFileChange: (files: File[]) => void;
    onCommentChange: (comments: string) => void;
    onStatusChange: (status: 'pending' | 'in_progress' | 'completed') => void;
}

const TaskDetails: React.FC<TaskDetailsProps> = ({
    task: initialTask,
    users,
    onSave,
    onDelete,
    onClose,
    onFileChange,
    onCommentChange,
    onStatusChange,
}) => {
    const [task, setTask] = useState<Task>(initialTask);
    const [dateError, setDateError] = useState<string | null>(null);

    useEffect(() => {
        setTask(initialTask);
    }, [initialTask]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'startDate' || name === 'endDate') {
            validateDates(name, value);
        }
        setTask(prevTask => ({ ...prevTask, [name]: value }));
    };

    const handleSelectChange = (e: SelectChangeEvent<string>) => {
        const { name, value } = e.target;
        setTask(prevTask => ({ ...prevTask, [name]: value }));
    };

    const handleStatusChange = (e: SelectChangeEvent<'pending' | 'in_progress' | 'completed'>) => {
        const newStatus = e.target.value as 'pending' | 'in_progress' | 'completed';
        setTask(prevTask => ({ ...prevTask, status: newStatus }));
        onStatusChange(newStatus);
    };

    const handleCommentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const newComments = e.target.value;
        setTask(prevTask => ({ ...prevTask, comments: newComments }));
        onCommentChange(newComments);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            onFileChange(files);
        }
    };

    const validateDates = (field: string, value: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(value + 'T00:00:00');
        const startDate = field === 'startDate' ? selectedDate : new Date(task.startDate + 'T00:00:00');
        const endDate = field === 'endDate' ? selectedDate : new Date(task.endDate + 'T00:00:00');

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

    const formatDate = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    };

    const handleSave = () => {
        if (validateDates('startDate', task.startDate) && validateDates('endDate', task.endDate)) {
            onSave(task);
        }
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Detalhes da Tarefa
            </Typography>
            <TextField
                fullWidth
                label="Título"
                name="title"
                value={task.title}
                onChange={handleChange}
                margin="normal"
            />
            <TextField
                fullWidth
                label="Descrição"
                name="description"
                value={task.description}
                onChange={handleChange}
                margin="normal"
                multiline
                rows={4}
            />
            <FormControl fullWidth margin="normal">
                <InputLabel>Status</InputLabel>
                <Select<'pending' | 'in_progress' | 'completed'>
                    value={task.status}
                    onChange={handleStatusChange}
                    label="Status"
                >
                    <MenuItem value="pending">Pendente</MenuItem>
                    <MenuItem value="in_progress">Em Progresso</MenuItem>
                    <MenuItem value="completed">Concluída</MenuItem>
                </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
                <InputLabel>Responsável</InputLabel>
                <Select
                    name="assignedTo"
                    value={typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo}
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
                fullWidth
                label="Data de Início"
                name="startDate"
                type="date"
                value={formatDate(task.startDate)}
                onChange={handleChange}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                error={!!dateError}
                helperText={dateError}
                inputProps={{
                    min: new Date().toISOString().split('T')[0]
                }}
            />
            <TextField
                fullWidth
                label="Data de Conclusão"
                name="endDate"
                type="date"
                value={formatDate(task.endDate)}
                onChange={handleChange}
                margin="normal"
                InputLabelProps={{ shrink: true }}
                error={!!dateError}
                helperText={dateError}
                inputProps={{
                    min: task.startDate || new Date().toISOString().split('T')[0]
                }}
            />
            <TextField
                fullWidth
                label="Pontos"
                name="points"
                type="number"
                value={task.points}
                onChange={handleChange}
                margin="normal"
            />
            <ColorSelector
                name="color"
                value={task.color || 'teal'}
                onChange={(e) => handleSelectChange(e as SelectChangeEvent<string>)}
            />
            <TextField
                fullWidth
                label="Comentários"
                name="comments"
                value={task.comments}
                onChange={handleCommentChange}
                margin="normal"
                multiline
                rows={4}
            />
            <input
                type="file"
                multiple
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="file-upload"
            />
            <label htmlFor="file-upload">
                <Button variant="contained" component="span" sx={{ mt: 2, mb: 2 }}>
                    Anexar Arquivos
                </Button>
            </label>
            {task.attachments && task.attachments.length > 0 && (
                <Box sx={{ mt: 2, mb: 2 }}>
                    <Typography variant="subtitle1">Anexos:</Typography>
                    {task.attachments.map((attachment, index) => (
                        <Typography key={index}>{attachment}</Typography>
                    ))}
                </Box>
            )}
            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
                <Button onClick={onDelete} color="error" variant="contained">
                    Excluir
                </Button>
                <Box>
                    <Button onClick={onClose} color="primary" variant="outlined" sx={{ mr: 1 }}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} color="primary" variant="contained">
                        Salvar
                    </Button>
                </Box>
            </Box>
        </Box>
    );
};

export default TaskDetails;
