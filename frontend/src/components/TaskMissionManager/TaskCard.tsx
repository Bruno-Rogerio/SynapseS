import React from 'react';
import { Card, CardContent, Typography, Chip, Box } from '@mui/material';
import { Task } from '../../types';

interface TaskCardProps {
    task: Task;
    onClick: () => void;
}

const colorOptions = {
    teal: '#009688',
    cyan: '#00bcd4',
    indigo: '#3f51b5',
    deepPurple: '#673ab7',
    pink: '#e91e63',
    amber: '#ffc107',
};

const translateStatus = (status: 'pending' | 'in_progress' | 'completed'): string => {
    switch (status) {
        case 'pending':
            return 'Pendente';
        case 'in_progress':
            return 'Em Progresso';
        case 'completed':
            return 'Concluída';
        default:
            return status;
    }
};

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
    const cardColor = task.color && colorOptions[task.color] ? colorOptions[task.color] : colorOptions.teal;
    const translatedStatus = translateStatus(task.status);

    return (
        <Card
            onClick={onClick}
            sx={{
                mb: 2,
                cursor: 'pointer',
                backgroundColor: cardColor,
                color: 'white',
                transition: 'all 0.3s ease',
                '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: '0 4px 20px 0 rgba(0,0,0,0.12)',
                },
            }}
        >
            <CardContent>
                <Typography variant="h6" component="div" sx={{ mb: 1 }}>
                    {task.title}
                </Typography>
                <Typography variant="body2" sx={{ mb: 2 }}>
                    {task.description.substring(0, 50)}...
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip
                        label={translatedStatus}
                        size="small"
                        sx={{
                            backgroundColor: 'rgba(255, 255, 255, 0.2)',
                            color: 'white',
                            fontWeight: 'bold'
                        }}
                    />
                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                        Pontos: {task.points}
                    </Typography>
                </Box>
                {task.endDate && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, textAlign: 'right' }}>
                        Prazo: {new Date(task.endDate).toLocaleDateString()}
                    </Typography>
                )}
            </CardContent>
        </Card>
    );
};

export default TaskCard;
