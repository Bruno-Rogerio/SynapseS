import React from 'react';
import { Typography, Paper } from '@mui/material';
import TaskCard from './TaskCard';  // Certifique-se de que este import está correto
import { Task, User } from '../../types';

interface UserTaskColumnProps {
  user: User;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const UserTaskColumn: React.FC<UserTaskColumnProps> = ({ user, tasks, onTaskClick }) => {
  return (
    <Paper 
      elevation={3} 
      sx={{ 
        minWidth: 300, 
        maxWidth: 300, 
        m: 1, 
        p: 2, 
        display: 'flex', 
        flexDirection: 'column', 
        height: 'calc(100vh - 200px)', 
        overflowY: 'auto' 
      }}
    >
      <Typography variant="h6" gutterBottom>
        {user.username}
      </Typography>
      {tasks.map(task => (
        <TaskCard key={task._id} task={task} onClick={() => onTaskClick(task)} />
      ))}
    </Paper>
  );
};

export default UserTaskColumn;
