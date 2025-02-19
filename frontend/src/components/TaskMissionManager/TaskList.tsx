import React, { useState } from 'react';
import {
    Box,
    Typography,
    Grid,
    Card,
    CardContent,
    CardActions,
    Button,
    Chip
} from '@mui/material';
import TaskDetails from './TaskDetails';
import { Task, User } from '../../types';

interface TaskListProps {
    tasks: Task[];
    users: User[];
}

const TaskList: React.FC<TaskListProps> = ({ tasks, users }) => {
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const handleSave = (updatedTask: Task) => {
        console.log('Task saved:', updatedTask);
        // Implementar a lógica para salvar a tarefa atualizada
        setSelectedTask(null);
    };

    const handleDelete = () => {
        if (selectedTask) {
            console.log('Task deleted:', selectedTask._id);
            // Implementar a lógica para deletar a tarefa
        }
        setSelectedTask(null);
    };

    const handleClose = () => {
        setSelectedTask(null);
    };

    const handleFileChange = (files: File[]) => {
        console.log('Files changed:', files);
        // Implementar a lógica para lidar com a mudança de arquivos
    };

    const handleCommentChange = (comments: string) => {
        console.log('Comments changed:', comments);
        // Implementar a lógica para lidar com a mudança de comentários
    };

    const handleStatusChange = (status: 'pending' | 'in_progress' | 'completed') => {
        console.log('Status changed:', status);
        // Implementar a lógica para lidar com a mudança de status
    };

    return (
        <Box sx={{ mt: 4 }}>
            <Typography variant="h5" gutterBottom>Tarefas</Typography>
            {tasks.length === 0 ? (
                <Typography>Nenhuma tarefa encontrada.</Typography>
            ) : (
                <Grid container spacing={2}>
                    {tasks.map(task => (
                        <Grid item xs={12} sm={6} md={4} key={task._id}>
                            <Card>
                                <CardContent>
                                    <Typography variant="h6">{task.title}</Typography>
                                    <Typography color="textSecondary" gutterBottom>
                                        Responsável: {users.find(user => user._id === task.assignedTo)?.username}
                                    </Typography>
                                    <Chip
                                        label={task.status}
                                        color={
                                            task.status === 'completed' ? 'success' :
                                                task.status === 'in_progress' ? 'primary' :
                                                    'default'
                                        }
                                    />
                                </CardContent>
                                <CardActions>
                                    <Button size="small" onClick={() => setSelectedTask(task)}>
                                        Ver Detalhes
                                    </Button>
                                </CardActions>
                            </Card>
                        </Grid>
                    ))}
                </Grid>
            )}
            {selectedTask && (
                <TaskDetails
                    task={selectedTask}
                    users={users}
                    onSave={handleSave}
                    onDelete={handleDelete}
                    onClose={handleClose}
                    onFileChange={handleFileChange}
                    onCommentChange={handleCommentChange}
                    onStatusChange={handleStatusChange}
                />
            )}
        </Box>
    );
};

export default TaskList;
