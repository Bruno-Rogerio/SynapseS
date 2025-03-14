import React, { useState, memo, useMemo } from 'react';
import {
  Typography,
  Paper,
  Avatar,
  Box,
  LinearProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Badge,
  Tooltip,
  alpha,
  useTheme,
  CircularProgress,
  useMediaQuery
} from '@mui/material';
import { motion } from 'framer-motion';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import AssignmentLateIcon from '@mui/icons-material/AssignmentLate';
import TimerIcon from '@mui/icons-material/Timer';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import AddTaskIcon from '@mui/icons-material/AddTask';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';
import TaskCard from './TaskCard';
import { Task, User } from '../../types';

interface UserTaskColumnProps {
  user: User;
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  isLoading?: boolean;
  onAddTask?: (userId: string) => void;
}

// Componente de TaskCard memorizado para evitar re-renderização desnecessária
const MemoizedTaskCard = memo(TaskCard);

const UserTaskColumn: React.FC<UserTaskColumnProps> = ({
  user,
  tasks,
  onTaskClick,
  isLoading = false,
  onAddTask
}) => {
  const theme = useTheme();
  // Todos os accordions começam fechados por padrão
  const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({
    completed: false,
    pending: false,
    inProgress: false
  });

  // Media queries para responsividade
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const isMobileScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Filtrar tarefas por status - usando useMemo para melhorar performance
  const { completedTasks, pendingTasks, inProgressTasks, overdueTasks, earnedPoints, progress } = useMemo(() => {
    const completedTasks = tasks.filter(task => task.status === 'completed');
    const pendingTasks = tasks.filter(task => task.status === 'pending');
    const inProgressTasks = tasks.filter(task => task.status === 'in_progress');

    // Encontrar tarefas atrasadas
    const overdueTasks = tasks.filter(task =>
      task.status !== 'completed' &&
      task.endDate &&
      new Date(task.endDate) < new Date()
    );

    // Calcular pontos totais
    const earnedPoints = completedTasks.reduce((sum, task) => sum + (task.points || 0), 0);

    // Calcular progresso
    const progress = tasks.length > 0 ? (completedTasks.length / tasks.length) * 100 : 0;

    return { completedTasks, pendingTasks, inProgressTasks, overdueTasks, earnedPoints, progress };
  }, [tasks]);

  const handleToggleAccordion = (section: string) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          light: alpha(theme.palette.success.main, 0.15),
          main: theme.palette.success.main,
          contrastText: theme.palette.success.contrastText,
          gradient: 'linear-gradient(45deg, #2ecc71, #27ae60)'
        };
      case 'pending':
        return {
          light: alpha(theme.palette.warning.main, 0.15),
          main: theme.palette.warning.main,
          contrastText: theme.palette.warning.contrastText,
          gradient: 'linear-gradient(45deg, #f39c12, #e67e22)'
        };
      case 'inProgress':
        return {
          light: alpha(theme.palette.info.main, 0.15),
          main: theme.palette.info.main,
          contrastText: theme.palette.info.contrastText,
          gradient: 'linear-gradient(45deg, #3498db, #2980b9)'
        };
      default:
        return {
          light: alpha(theme.palette.grey[500], 0.15),
          main: theme.palette.grey[500],
          contrastText: theme.palette.getContrastText(theme.palette.grey[500]),
          gradient: 'linear-gradient(45deg, #95a5a6, #7f8c8d)'
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <AssignmentTurnedInIcon />;
      case 'pending':
        return <AssignmentOutlinedIcon />;
      case 'inProgress':
        return <TimerIcon />;
      default:
        return <AssignmentOutlinedIcon />;
    }
  };

  const TaskAccordion = ({
    title,
    tasks,
    status,
    icon
  }: {
    title: string;
    tasks: Task[];
    status: 'completed' | 'pending' | 'inProgress';
    icon: React.ReactNode;
  }) => {
    const colorSet = getStatusColor(status);
    const isOpen = expanded[status];

    return (
      <Box
        component={motion.div}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        sx={{ mb: 1.5 }}
      >
        <Accordion
          expanded={isOpen}
          onChange={() => handleToggleAccordion(status)}
          sx={{
            boxShadow: isOpen ? 2 : 1,
            borderRadius: '8px !important',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            '&:before': { display: 'none' },
            backgroundColor: theme.palette.background.paper,
          }}
        >
          <AccordionSummary
            expandIcon={<ExpandMoreIcon sx={{ color: colorSet.main }} />}
            aria-controls={`${title.toLowerCase()}-content`}
            id={`${title.toLowerCase()}-header`}
            sx={{
              borderLeft: `4px solid ${colorSet.main}`,
              borderTopLeftRadius: '8px',
              borderTopRightRadius: '8px',
              background: isOpen
                ? `${colorSet.light}`
                : alpha(colorSet.light, 0.5),
              '&:hover': {
                background: colorSet.light,
              },
              transition: 'all 0.3s ease',
              minHeight: 48, // Altura reduzida
              py: 0.5, // Padding vertical reduzido
            }}
          >
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              width: '100%',
              pr: 1
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar
                  sx={{
                    bgcolor: colorSet.main,
                    color: 'white',
                    width: 28, // Tamanho reduzido
                    height: 28, // Tamanho reduzido
                    mr: 1.5,
                    fontSize: '0.9rem'
                  }}
                >
                  {icon}
                </Avatar>
                <Typography
                  variant="body1"
                  sx={{
                    fontWeight: 600,
                    color: alpha(theme.palette.text.primary, 0.9),
                    fontSize: '0.9rem' // Texto mais compacto
                  }}
                >
                  {title}
                </Typography>
              </Box>
              <Badge
                badgeContent={tasks.length}
                color={status === 'completed' ? 'success' :
                  status === 'inProgress' ? 'info' : 'warning'}
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.7rem',
                    height: 18,
                    minWidth: 18,
                    fontWeight: 'bold'
                  }
                }}
              >
                <Box sx={{ width: 12 }} />
              </Badge>
            </Box>
          </AccordionSummary>
          <AccordionDetails
            sx={{
              p: 1.5, // Padding reduzido
              pt: tasks.length ? 1.5 : 0,
              maxHeight: isMobileScreen ? 300 : (isSmallScreen ? 350 : 280), // Altura adaptativa
              overflowY: 'auto',
              background: alpha(theme.palette.background.default, 0.3),
              scrollbarWidth: 'thin',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-thumb': {
                backgroundColor: alpha(theme.palette.divider, 0.4),
                borderRadius: 3,
              }
            }}
          >
            {tasks.length > 0 ? (
              tasks.map((task) => (
                <Box
                  key={task._id}
                  sx={{ mb: 1.5 }} // Margem reduzida entre cards
                >
                  <MemoizedTaskCard
                    task={task}
                    onClick={() => onTaskClick(task)}
                  />
                </Box>
              ))
            ) : (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  py: 2, // Padding reduzido
                  color: theme.palette.text.secondary
                }}
              >
                <Typography
                  variant="body2"
                  sx={{ fontStyle: 'italic', fontSize: '0.85rem' }}
                >
                  Nenhuma tarefa {status === 'completed' ? 'concluída' :
                    status === 'pending' ? 'pendente' : 'em progresso'}
                </Typography>
              </Box>
            )}
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  };

  return (
    <Paper
      component={motion.div}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      elevation={2}
      sx={{
        width: isMobileScreen ? '100%' : 300, // Largura adaptativa
        m: isMobileScreen ? 0 : 1.5,
        mb: isMobileScreen ? 2 : 1.5,
        p: 0,
        display: 'flex',
        flexDirection: 'column',
        height: isMobileScreen ? 'auto' : 'calc(100vh - 220px)', // Altura adaptativa
        maxHeight: isMobileScreen ? 'none' : 'calc(100vh - 180px)', // Altura máxima
        borderRadius: '12px',
        overflow: 'hidden',
        border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
        position: 'relative',
        transition: 'all 0.3s ease'
      }}
    >
      {isLoading && (
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: alpha(theme.palette.background.paper, 0.7),
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 10,
            backdropFilter: 'blur(4px)',
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Header com gradiente */}
      <Box
        sx={{
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 100%)`,
          p: 2, // Padding reduzido
          color: 'white',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Círculos decorativos */}
        <Box
          sx={{
            position: 'absolute',
            width: 150, // Tamanho reduzido
            height: 150, // Tamanho reduzido
            borderRadius: '50%',
            backgroundColor: alpha('#fff', 0.05),
            top: -70,
            right: -50,
          }}
        />
        <Box
          sx={{
            position: 'absolute',
            width: 100, // Tamanho reduzido
            height: 100, // Tamanho reduzido
            borderRadius: '50%',
            backgroundColor: alpha('#fff', 0.05),
            bottom: -40,
            left: -30,
          }}
        />

        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start'
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', zIndex: 1 }}>
            <Avatar
              src={user.avatar}
              sx={{
                width: 50, // Tamanho reduzido
                height: 50, // Tamanho reduzido
                mr: 1.5,
                bgcolor: theme.palette.primary.light,
                fontSize: '1.5rem', // Tamanho reduzido
                border: `2px solid ${alpha('#fff', 0.2)}`, // Borda reduzida
                boxShadow: '0 2px 5px rgba(0,0,0,0.15)' // Sombra reduzida
              }}
            >
              {user.username?.[0]?.toUpperCase() || 'U'}
            </Avatar>
            <Box>
              <Typography
                variant="h6" // Tamanho reduzido
                fontWeight={600}
                sx={{
                  textShadow: '1px 1px 2px rgba(0,0,0,0.2)',
                  fontSize: '1.1rem' // Tamanho reduzido
                }}
              >
                {user.username}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.2 }}>
                <AssignmentOutlinedIcon fontSize="small" sx={{ mr: 0.5, opacity: 0.9, fontSize: '0.9rem' }} />
                <Typography variant="body2" sx={{ opacity: 0.9, fontSize: '0.8rem' }}>
                  {tasks.length} {tasks.length === 1 ? 'tarefa' : 'tarefas'}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Menu de opções e botão para adicionar tarefa */}
          <Box sx={{ display: 'flex' }}>
            {onAddTask && (
              <Tooltip title="Adicionar tarefa">
                <IconButton
                  onClick={() => onAddTask(user._id)}
                  size="small" // Tamanho reduzido
                  sx={{
                    color: 'white',
                    '&:hover': {
                      bgcolor: alpha('#fff', 0.15)
                    }
                  }}
                >
                  <AddTaskIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Tooltip title="Mais opções">
              <IconButton
                size="small" // Tamanho reduzido
                sx={{
                  color: 'white',
                  '&:hover': {
                    bgcolor: alpha('#fff', 0.15)
                  }
                }}
              >
                <MoreHorizIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        </Box>

        {/* Estatísticas e progresso */}
        <Box sx={{ mt: 2, zIndex: 1, position: 'relative' }}>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 0.5 // Margem reduzida
          }}>
            <Typography
              variant="body2"
              sx={{ fontWeight: 500, opacity: 0.95, fontSize: '0.8rem' }}
            >
              Progresso
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                bgcolor: alpha('#fff', 0.2),
                py: 0.2, // Padding reduzido
                px: 0.8, // Padding reduzido
                borderRadius: 10,
                fontSize: '0.75rem' // Tamanho reduzido
              }}
            >
              {Math.round(progress)}%
            </Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6, // Altura reduzida
              borderRadius: 3,
              backgroundColor: alpha('#fff', 0.2),
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#fff',
                borderRadius: 3,
              },
              mb: 1.5, // Margem reduzida
            }}
          />

          {/* Cards com estatísticas */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 1,
              mt: 1 // Margem reduzida
            }}
          >
            <Box
              sx={{
                flex: 1,
                bgcolor: alpha('#fff', 0.15),
                p: 1, // Padding reduzido
                borderRadius: 2,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <EmojiEventsIcon sx={{ mb: 0.2, fontSize: '1.2rem' }} /> {/* Ícone reduzido */}
              <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1rem' }}> {/* Texto reduzido */}
                {earnedPoints}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.7rem' }}> {/* Texto reduzido */}
                Pontos
              </Typography>
            </Box>
            <Box
              sx={{
                flex: 1,
                bgcolor: alpha('#fff', 0.15),
                p: 1, // Padding reduzido
                borderRadius: 2,
                textAlign: 'center',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <StarIcon sx={{ mb: 0.2, fontSize: '1.2rem' }} /> {/* Ícone reduzido */}
              <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1rem' }}> {/* Texto reduzido */}
                {completedTasks.length}
              </Typography>
              <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.7rem' }}> {/* Texto reduzido */}
                Concluídas
              </Typography>
            </Box>
            {overdueTasks.length > 0 && (
              <Box
                sx={{
                  flex: 1,
                  bgcolor: alpha(theme.palette.error.main, 0.3),
                  p: 1, // Padding reduzido
                  borderRadius: 2,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <AssignmentLateIcon sx={{ mb: 0.2, fontSize: '1.2rem' }} /> {/* Ícone reduzido */}
                <Typography variant="h6" fontWeight={600} sx={{ fontSize: '1rem' }}> {/* Texto reduzido */}
                  {overdueTasks.length}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.9, fontSize: '0.7rem' }}> {/* Texto reduzido */}
                  Atrasadas
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Conteúdo */}
      <Box
        sx={{
          p: 1.5, // Padding reduzido
          overflowY: 'auto',
          flexGrow: 1,
          scrollbarWidth: 'thin',
          '&::-webkit-scrollbar': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: alpha(theme.palette.divider, 0.3),
            borderRadius: 3,
          }
        }}
      >
        <TaskAccordion
          title="Pendentes"
          tasks={pendingTasks}
          status="pending"
          icon={<AssignmentOutlinedIcon fontSize="small" />}
        />
        <TaskAccordion
          title="Em Progresso"
          tasks={inProgressTasks}
          status="inProgress"
          icon={<TimerIcon fontSize="small" />}
        />
        <TaskAccordion
          title="Concluídas"
          tasks={completedTasks}
          status="completed"
          icon={<AssignmentTurnedInIcon fontSize="small" />}
        />
      </Box>
    </Paper>
  );
};

// Memorize o componente para evitar re-renderizações desnecessárias
export default memo(UserTaskColumn);
