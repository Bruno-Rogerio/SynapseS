import React from 'react';
import {
  Typography,
  Paper,
  Avatar,
  Box,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import TaskCard from './TaskCard';
import { Task, User } from '../../types';

interface UserTaskColumnProps {
  user: User;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

const UserTaskColumn: React.FC<UserTaskColumnProps> = ({ user, tasks, onTaskClick }) => {
  const completedTasks = tasks.filter(task => task.status === 'completed');
  const pendingTasks = tasks.filter(task => task.status === 'pending');
  const inProgressTasks = tasks.filter(task => task.status === 'in_progress');
  const progress = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

  const TaskAccordion = ({ title, tasks, color }: { title: string; tasks: Task[]; color: string }) => (
    <Accordion
      sx={{
        mb: 2,
        boxShadow: 'none',
        '&:before': { display: 'none' },
        backgroundColor: 'transparent'
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon />}
        aria-controls={`${title.toLowerCase()}-content`}
        id={`${title.toLowerCase()}-header`}
        sx={{
          backgroundColor: color,
          borderRadius: '8px',
          '&:hover': {
            backgroundColor: color,
            opacity: 0.9,
          },
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <Typography sx={{ color: 'rgba(0, 0, 0, 0.7)', fontWeight: 'bold' }}>{title}</Typography>
          <Chip
            label={tasks.length}
            size="small"
            sx={{
              backgroundColor: 'rgba(255, 255, 255, 0.6)',
              fontWeight: 'bold',
              color: 'rgba(0, 0, 0, 0.7)'
            }}
          />
        </Box>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 1, mt: 1, maxHeight: 300, overflowY: 'auto' }}>
        {tasks.map(task => (
          <Box key={task._id} sx={{ mb: 2 }}>
            <TaskCard task={task} onClick={() => onTaskClick(task)} />
          </Box>
        ))}
      </AccordionDetails>
    </Accordion>
  );

  return (
    <Paper
      elevation={3}
      sx={{
        width: 340,
        m: 2,
        p: 3,
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 200px)',
        overflowY: 'auto',
        bgcolor: '#f5f5f5',
        borderRadius: '12px',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <Avatar
          sx={{
            width: 64,
            height: 64,
            mr: 2,
            bgcolor: '#3f51b5',
            fontSize: '1.8rem',
          }}
        >
          {user.username[0].toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="h5" gutterBottom>
            {user.username}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {tasks.length} tarefas atribuídas
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{
            flexGrow: 1,
            mr: 1,
            height: 10,
            borderRadius: 5,
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: '#1DB954',
            },
          }}
        />
        <Typography variant="body2" color="text.secondary">
          {`${Math.round(progress)}%`}
        </Typography>
      </Box>

      <TaskAccordion title="Concluídas" tasks={completedTasks} color="rgba(29, 185, 84, 0.15)" />
      <TaskAccordion title="Pendentes" tasks={pendingTasks} color="rgba(255, 102, 102, 0.15)" />
      <TaskAccordion title="Em Progresso" tasks={inProgressTasks} color="rgba(0, 175, 240, 0.15)" />
    </Paper>
  );
};

export default UserTaskColumn;
