import React from 'react';
import { Card, CardContent, Typography, Chip } from '@mui/material';
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

const TaskCard: React.FC<TaskCardProps> = ({ task, onClick }) => {
    const cardColor = task.color && colorOptions[task.color] ? colorOptions[task.color] : colorOptions.teal;

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
                <Chip
                    label={task.status}
                    size="small"
                    sx={{
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        color: 'white',
                        fontWeight: 'bold'
                    }}
                />
            </CardContent>
        </Card>
    );
};

export default TaskCard;
