import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, TextField, Select, MenuItem, FormControl,
    Grid, Chip, Avatar, IconButton,
    Paper, Badge, Tab, Tabs, CircularProgress,
    List, ListItem, ListItemText, ListItemIcon, ListItemAvatar, alpha, useTheme
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, User, CheckpointStatus } from '../../types';
import ColorSelector from './ColorSelector';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventIcon from '@mui/icons-material/Event';
import PersonIcon from '@mui/icons-material/Person';
import StarIcon from '@mui/icons-material/Star';
import FlagIcon from '@mui/icons-material/Flag';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import LoopIcon from '@mui/icons-material/Loop';
import DescriptionIcon from '@mui/icons-material/Description';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import FormatListBulletedIcon from '@mui/icons-material/FormatListBulleted';
import CommentIcon from '@mui/icons-material/Comment';
import SaveIcon from '@mui/icons-material/Save';
import AddIcon from '@mui/icons-material/Add';

// Tipo para status que inclui variantes em inglês e português
type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'pendente' | 'em-progresso' | 'concluida' | 'concluída';

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
    const theme = useTheme();
    const [task, setTask] = useState<Task>(initialTask);
    const [dateError, setDateError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [editMode, setEditMode] = useState(false);
    const [saving, setSaving] = useState(false);
    const [comment, setComment] = useState('');

    // Definições de cores e status (incluindo versões em português e inglês)
    const statusColors = {
        pending: theme.palette.warning.main,
        in_progress: theme.palette.info.main,
        completed: theme.palette.success.main,
        // Versões em português
        pendente: theme.palette.warning.main,
        'em-progresso': theme.palette.info.main,
        concluida: theme.palette.success.main,
        concluída: theme.palette.success.main
    };

    const statusLabels = {
        pending: 'Pendente',
        in_progress: 'Em Progresso',
        completed: 'Concluída',
        // Versões em português
        pendente: 'Pendente',
        'em-progresso': 'Em Progresso',
        concluida: 'Concluída',
        concluída: 'Concluída'
    };

    const statusIcons = {
        pending: <PendingIcon />,
        in_progress: <LoopIcon />,
        completed: <CheckCircleIcon />,
        // Versões em português
        pendente: <PendingIcon />,
        'em-progresso': <LoopIcon />,
        concluida: <CheckCircleIcon />,
        concluída: <CheckCircleIcon />
    };

    const priorityLabels = ['Baixa', 'Média', 'Alta', 'Urgente'];
    const priorityColors = ['#81c784', '#ffb74d', '#ff9800', '#e53935'];

    useEffect(() => {
        setTask(initialTask);
    }, [initialTask]);

    // Calcular progresso
    const calculateProgress = () => {
        if (task.status === 'completed' || task.status === 'concluida' || task.status === 'concluída') return 100;
        if (task.status === 'in_progress' || task.status === 'em-progresso') return 50;
        return 0;
    };

    // Calcular dias restantes
    const calculateDaysRemaining = () => {
        if (!task.endDate) return null;
        const today = new Date();
        const endDate = new Date(task.endDate);
        // Reset time part for accurate date comparison
        today.setHours(0, 0, 0, 0);
        endDate.setHours(0, 0, 0, 0);
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    const daysRemaining = calculateDaysRemaining();
    const isOverdue = daysRemaining !== null && daysRemaining < 0 &&
        (task.status !== 'completed' && task.status !== 'concluida' && task.status !== 'concluída');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        if (name === 'startDate' || name === 'endDate') {
            validateDates(name, value);
        }
        setTask(prevTask => ({ ...prevTask, [name]: value }));
    };

    const handleSelectChange = (e: { target: { name?: string; value: string } }) => {
        const { name, value } = e.target;
        if (name) {
            setTask(prevTask => ({ ...prevTask, [name]: value }));
        }
    };

    // Função convertedora para garantir tipo correto
    const convertStatus = (status: TaskStatus): 'pending' | 'in_progress' | 'completed' => {
        switch (status) {
            case 'pendente':
                return 'pending';
            case 'em-progresso':
                return 'in_progress';
            case 'concluida':
            case 'concluída':
                return 'completed';
            default:
                return status;
        }
    };

    const handleStatusChange = (newStatus: TaskStatus) => {
        // Convertemos o status para o formato esperado pelo onStatusChange
        const standardStatus = convertStatus(newStatus);
        setTask(prevTask => ({ ...prevTask, status: newStatus as any }));
        onStatusChange(standardStatus);
    };

    const handleCommentSubmit = () => {
        if (!comment.trim()) return;
        // Append new comment to existing comments
        const newComments = task.comments
            ? typeof task.comments === 'string'
                ? `${task.comments}\n\n${new Date().toLocaleString()}: ${comment}`
                : [...task.comments, `${new Date().toLocaleString()}: ${comment}`]
            : `${new Date().toLocaleString()}: ${comment}`;
        setTask(prevTask => ({ ...prevTask, comments: newComments }));
        onCommentChange(typeof newComments === 'string' ? newComments : newComments.join('\n\n'));
        setComment('');
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

    const formatLocalDate = (dateString: string) => {
        if (!dateString) return 'Não definida';
        try {
            return new Date(dateString).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric'
            });
        } catch (e) {
            return 'Data inválida';
        }
    };

    const handleSave = async () => {
        if (validateDates('startDate', task.startDate) && validateDates('endDate', task.endDate)) {
            setSaving(true);
            try {
                await onSave(task);
                setEditMode(false);
            } finally {
                setSaving(false);
            }
        }
    };

    // Correção para o problema com assignedTo.avatar
    const getAssignedUserName = () => {
        if (!task.assignedTo) return 'Não atribuído';
        if (typeof task.assignedTo === 'object' && task.assignedTo._id) {
            return task.assignedTo.username || 'Usuário';
        }
        const user = users.find(u => u._id === task.assignedTo);
        return user ? user.username : 'Usuário desconhecido';
    };

    // Ajuste na função getAssignedUserAvatar
    const getAssignedUserAvatar = () => {
        if (!task.assignedTo) return null;
        if (typeof task.assignedTo === 'object' && task.assignedTo._id) {
            // Não tentamos acessar avatar aqui
            return null;
        }
        const user = users.find(u => u._id === task.assignedTo);
        // Verificar se o usuário existe e tem avatar
        return user && 'avatar' in user ? user.avatar : null;
    };

    // Renderizar comentários
    const renderComments = () => {
        if (!task.comments) return <Typography color="text.secondary">Nenhum comentário</Typography>;
        const commentsArray = typeof task.comments === 'string'
            ? task.comments.split('\n\n').filter(c => c.trim().length > 0)
            : task.comments;
        return (
            <List>
                <AnimatePresence>
                    {commentsArray.map((comment, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                        >
                            <ListItem
                                alignItems="flex-start"
                                sx={{
                                    backgroundColor: alpha(theme.palette.background.paper, 0.6),
                                    borderRadius: 2,
                                    mb: 1,
                                    px: 2,
                                    py: 1
                                }}
                            >
                                <ListItemAvatar>
                                    <Avatar sx={{ bgcolor: theme.palette.primary.main }}>
                                        <CommentIcon />
                                    </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                    primary={
                                        <Typography
                                            variant="body2"
                                            sx={{ fontWeight: 'bold', mb: 0.5 }}
                                        >
                                            {comment.split(':')[0]}
                                        </Typography>
                                    }
                                    secondary={
                                        <Typography
                                            variant="body2"
                                            sx={{ whiteSpace: 'pre-wrap' }}
                                        >
                                            {comment.split(':').slice(1).join(':').trim()}
                                        </Typography>
                                    }
                                />
                            </ListItem>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </List>
        );
    };

    // Corrigir renderização de anexos
    const renderAttachments = () => {
        if (!task.attachments || task.attachments.length === 0) {
            return <Typography color="text.secondary">Nenhum anexo</Typography>;
        }
        return (
            <List>
                {task.attachments.map((attachment, index) => (
                    <ListItem key={index}>
                        <ListItemIcon>
                            <AttachFileIcon />
                        </ListItemIcon>
                        <ListItemText
                            primary={
                                <Typography variant="body2">
                                    {/* Usando simplificação com string */}
                                    {typeof attachment === 'string' ? attachment : 'Arquivo'}
                                </Typography>
                            }
                        />
                    </ListItem>
                ))}
            </List>
        );
    };

    return (
        <Box sx={{ position: 'relative' }}>
            {/* Cabeçalho com título e ações */}
            <Box
                component={motion.div}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 3,
                    pb: 2,
                    borderBottom: `1px solid ${theme.palette.divider}`
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                        sx={{
                            width: 5,
                            height: 40,
                            backgroundColor: task.color ? task.color : theme.palette.primary.main,
                            borderRadius: 1,
                            mr: 2
                        }}
                    />
                    {editMode ? (
                        <TextField
                            name="title"
                            value={task.title}
                            onChange={handleChange}
                            variant="outlined"
                            sx={{ minWidth: 300 }}
                            InputProps={{
                                sx: {
                                    fontSize: '1.5rem',
                                    fontWeight: 600
                                }
                            }}
                        />
                    ) : (
                        <Typography variant="h5" component="h1" fontWeight={600}>
                            {task.title || 'Sem título'}
                        </Typography>
                    )}
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    {!editMode ? (
                        <>
                            <Button
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={() => setEditMode(true)}
                            >
                                Editar
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={onDelete}
                            >
                                Excluir
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="contained"
                                color="primary"
                                startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                onClick={handleSave}
                                disabled={saving}
                            >
                                Salvar
                            </Button>
                            <Button
                                variant="outlined"
                                onClick={() => {
                                    setEditMode(false);
                                    setTask(initialTask); // Reset changes
                                }}
                            >
                                Cancelar
                            </Button>
                        </>
                    )}
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </Box>
            <Grid container spacing={3}>
                {/* Coluna da esquerda - Detalhes principais */}
                <Grid item xs={12} md={8}>
                    {/* Status e progresso */}
                    <Paper
                        component={motion.div}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        elevation={0}
                        sx={{
                            p: 3,
                            mb: 3,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            position: 'relative',
                            overflow: 'hidden',
                            background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 0.7)})`,
                            backdropFilter: 'blur(10px)',
                        }}
                    >
                        <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, bgcolor: statusColors[task.status as TaskStatus] }} />
                        <Box sx={{
                            display: 'flex',
                            flexDirection: { xs: 'column', sm: 'row' },
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            justifyContent: 'space-between',
                            mb: 2
                        }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, sm: 0 } }}>
                                <Typography variant="h6" component="h2" sx={{ mr: 2 }}>
                                    Status
                                </Typography>
                                {editMode ? (
                                    <FormControl size="small" sx={{ minWidth: 150 }}>
                                        <Select
                                            value={task.status}
                                            onChange={(e) => handleStatusChange(e.target.value as TaskStatus)}
                                            sx={{ height: 40 }}
                                        >
                                            <MenuItem value="pending">Pendente</MenuItem>
                                            <MenuItem value="in_progress">Em Progresso</MenuItem>
                                            <MenuItem value="completed">Concluída</MenuItem>
                                        </Select>
                                    </FormControl>
                                ) : (
                                    <Chip
                                        icon={statusIcons[task.status as TaskStatus]}
                                        label={statusLabels[task.status as TaskStatus]}
                                        sx={{
                                            bgcolor: alpha(statusColors[task.status as TaskStatus], 0.15),
                                            color: statusColors[task.status as TaskStatus],
                                            fontWeight: 500,
                                            fontSize: '0.9rem',
                                            paddingLeft: 0.5
                                        }}
                                    />
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography variant="body2" sx={{ mr: 2 }}>
                                    Progresso:
                                </Typography>
                                <Box sx={{ width: 35, textAlign: 'center', mr: 1 }}>
                                    <Typography variant="body2" fontWeight="bold">
                                        {calculateProgress()}%
                                    </Typography>
                                </Box>
                                <Box sx={{ position: 'relative', width: 40, height: 40 }}>
                                    <CircularProgress
                                        variant="determinate"
                                        value={100}
                                        sx={{
                                            position: 'absolute',
                                            color: alpha(theme.palette.divider, 0.3),
                                        }}
                                        size={40}
                                    />
                                    <CircularProgress
                                        variant="determinate"
                                        value={calculateProgress()}
                                        sx={{
                                            position: 'absolute',
                                            color: statusColors[task.status as TaskStatus],
                                        }}
                                        size={40}
                                    />
                                </Box>
                            </Box>
                        </Box>
                        <Grid container spacing={3}>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Avatar
                                        sx={{
                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                            color: theme.palette.primary.main,
                                            mb: 1
                                        }}
                                    >
                                        <CalendarTodayIcon />
                                    </Avatar>
                                    <Typography variant="body2" color="text.secondary" align="center">
                                        Início
                                    </Typography>
                                    {editMode ? (
                                        <TextField
                                            name="startDate"
                                            type="date"
                                            value={formatDate(task.startDate)}
                                            onChange={handleChange}
                                            size="small"
                                            InputLabelProps={{ shrink: true }}
                                            sx={{ mt: 1, width: '100%' }}
                                            error={!!dateError}
                                            helperText={dateError}
                                        />
                                    ) : (
                                        <Typography variant="body1" fontWeight={500} align="center">
                                            {formatLocalDate(task.startDate)}
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Avatar
                                        sx={{
                                            bgcolor: isOverdue
                                                ? alpha(theme.palette.error.main, 0.1)
                                                : alpha(theme.palette.success.main, 0.1),
                                            color: isOverdue
                                                ? theme.palette.error.main
                                                : theme.palette.success.main,
                                            mb: 1
                                        }}
                                    >
                                        <EventIcon />
                                    </Avatar>
                                    <Typography variant="body2" color="text.secondary" align="center">
                                        Vencimento
                                    </Typography>
                                    {editMode ? (
                                        <TextField
                                            name="endDate"
                                            type="date"
                                            value={formatDate(task.endDate)}
                                            onChange={handleChange}
                                            size="small"
                                            InputLabelProps={{ shrink: true }}
                                            sx={{ mt: 1, width: '100%' }}
                                            error={!!dateError}
                                            helperText={dateError}
                                        />
                                    ) : (
                                        <Typography
                                            variant="body1"
                                            fontWeight={500}
                                            color={isOverdue ? 'error' : 'inherit'}
                                            align="center"
                                        >
                                            {formatLocalDate(task.endDate)}
                                            {isOverdue && <span> (Atrasada)</span>}
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Avatar
                                        sx={{
                                            bgcolor: alpha(theme.palette.info.main, 0.1),
                                            color: theme.palette.info.main,
                                            mb: 1
                                        }}
                                    >
                                        <AccessTimeIcon />
                                    </Avatar>
                                    <Typography variant="body2" color="text.secondary" align="center">
                                        Prazo
                                    </Typography>
                                    <Typography
                                        variant="body1"
                                        fontWeight={500}
                                        color={isOverdue ? 'error.main' : daysRemaining === 0 ? 'warning.main' : 'inherit'}
                                        align="center"
                                    >
                                        {daysRemaining === null ? 'Não definido' :
                                            daysRemaining === 0 ? 'Hoje' :
                                                isOverdue ? `${Math.abs(daysRemaining)} dias atrás` :
                                                    `${daysRemaining} dias restantes`}
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={12} sm={6} md={3}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                    <Avatar
                                        src={getAssignedUserAvatar() || undefined}
                                        sx={{
                                            bgcolor: alpha(theme.palette.secondary.main, 0.1),
                                            color: theme.palette.secondary.main,
                                            mb: 1
                                        }}
                                    >
                                        {!getAssignedUserAvatar() && <PersonIcon />}
                                    </Avatar>
                                    <Typography variant="body2" color="text.secondary" align="center">
                                        Responsável
                                    </Typography>
                                    {editMode ? (
                                        <FormControl size="small" sx={{ mt: 1, width: '100%' }}>
                                            <Select
                                                name="assignedTo"
                                                value={typeof task.assignedTo === 'object' ? task.assignedTo._id : task.assignedTo || ''}
                                                onChange={handleSelectChange}
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
                                    ) : (
                                        <Typography variant="body1" fontWeight={500} align="center">
                                            {getAssignedUserName()}
                                        </Typography>
                                    )}
                                </Box>
                            </Grid>
                        </Grid>
                    </Paper>
                    {/* Descrição */}
                    <Paper
                        component={motion.div}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        elevation={0}
                        sx={{
                            p: 3,
                            mb: 3,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                            <DescriptionIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="h6" component="h2">
                                Descrição
                            </Typography>
                        </Box>
                        {editMode ? (
                            <TextField
                                name="description"
                                value={task.description}
                                onChange={handleChange}
                                fullWidth
                                multiline
                                rows={6}
                                placeholder="Descreva a tarefa em detalhes"
                            />
                        ) : (
                            <Typography
                                variant="body1"
                                sx={{
                                    whiteSpace: 'pre-wrap',
                                    bgcolor: alpha(theme.palette.background.default, 0.5),
                                    p: 2,
                                    borderRadius: 1,
                                    minHeight: '100px'
                                }}
                            >
                                {task.description || 'Sem descrição'}
                            </Typography>
                        )}
                    </Paper>
                    {/* Tabs para comentários e anexos */}
                    <Paper
                        component={motion.div}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.2 }}
                        elevation={0}
                        sx={{
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2,
                            overflow: 'hidden'
                        }}
                    >
                        <Tabs
                            value={activeTab}
                            onChange={(_, newValue) => setActiveTab(newValue)}
                            sx={{
                                borderBottom: `1px solid ${theme.palette.divider}`,
                                bgcolor: alpha(theme.palette.background.paper, 0.7)
                            }}
                        >
                            <Tab
                                icon={<ChatBubbleOutlineIcon />}
                                iconPosition="start"
                                label="Comentários"
                            />
                            <Tab
                                icon={<AttachFileIcon />}
                                iconPosition="start"
                                label="Anexos"
                            />
                        </Tabs>
                        <Box sx={{ p: 3 }}>
                            {activeTab === 0 && (
                                <Box>
                                    {renderComments()}
                                    <Box sx={{ display: 'flex', mt: 2 }}>
                                        <TextField
                                            fullWidth
                                            placeholder="Adicionar comentário..."
                                            multiline
                                            rows={2}
                                            value={comment}
                                            onChange={(e) => setComment(e.target.value)}
                                            size="small"
                                            sx={{ mr: 1 }}
                                        />
                                        <Button
                                            variant="contained"
                                            onClick={handleCommentSubmit}
                                            disabled={!comment.trim()}
                                            sx={{ alignSelf: 'flex-end' }}
                                        >
                                            Enviar
                                        </Button>
                                    </Box>
                                </Box>
                            )}
                            {activeTab === 1 && (
                                <Box>
                                    {renderAttachments()}
                                    <Box sx={{ mt: 2 }}>
                                        <input
                                            type="file"
                                            multiple
                                            onChange={handleFileUpload}
                                            style={{ display: 'none' }}
                                            id="task-file-upload"
                                        />
                                        <label htmlFor="task-file-upload">
                                            <Button
                                                variant="outlined"
                                                component="span"
                                                startIcon={<AddIcon />}
                                            >
                                                Adicionar Anexo
                                            </Button>
                                        </label>
                                    </Box>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </Grid>
                {/* Coluna da direita - Informações adicionais */}
                <Grid item xs={12} md={4}>
                    <Paper
                        component={motion.div}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        elevation={0}
                        sx={{
                            p: 3,
                            mb: 3,
                            border: `1px solid ${theme.palette.divider}`,
                            borderRadius: 2
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <FormatListBulletedIcon color="primary" sx={{ mr: 1 }} />
                            <Typography variant="h6" component="h2">
                                Detalhes Adicionais
                            </Typography>
                        </Box>
                        <List disablePadding>
                            {/* Prioridade */}
                            <ListItem
                                disableGutters
                                sx={{
                                    py: 1,
                                    px: 0,
                                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <FlagIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Prioridade"
                                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                />
                                {editMode ? (
                                    <FormControl size="small" sx={{ minWidth: 120 }}>
                                        <Select
                                            name="priority"
                                            value={task.priority?.toString() || '0'}
                                            onChange={handleSelectChange}
                                        >
                                            <MenuItem value="0">Baixa</MenuItem>
                                            <MenuItem value="1">Média</MenuItem>
                                            <MenuItem value="2">Alta</MenuItem>
                                            <MenuItem value="3">Urgente</MenuItem>
                                        </Select>
                                    </FormControl>
                                ) : (
                                    <Chip
                                        label={task.priority !== undefined ? priorityLabels[task.priority] : 'Baixa'}
                                        size="small"
                                        sx={{
                                            bgcolor: alpha(task.priority !== undefined ? priorityColors[task.priority] : priorityColors[0], 0.15),
                                            color: task.priority !== undefined ? priorityColors[task.priority] : priorityColors[0],
                                            fontWeight: 500,
                                        }}
                                    />
                                )}
                            </ListItem>
                            {/* Pontos */}
                            <ListItem
                                disableGutters
                                sx={{
                                    py: 1,
                                    px: 0,
                                    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <StarIcon />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Pontos"
                                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                />
                                {editMode ? (
                                    <TextField
                                        name="points"
                                        type="number"
                                        value={task.points || 0}
                                        onChange={handleChange}
                                        size="small"
                                        inputProps={{ min: 0, max: 100 }}
                                        sx={{ width: 80 }}
                                    />
                                ) : (
                                    <Badge
                                        badgeContent={task.points || 0}
                                        color="primary"
                                        sx={{
                                            '& .MuiBadge-badge': {
                                                fontSize: '0.9rem',
                                                height: 24,
                                                minWidth: 24,
                                            }
                                        }}
                                    >
                                        <StarIcon sx={{ color: '#FFD700', mr: 2 }} />
                                    </Badge>
                                )}
                            </ListItem>
                            {/* Cor */}
                            <ListItem
                                disableGutters
                                sx={{
                                    py: 1,
                                    px: 0
                                }}
                            >
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    <Box
                                        sx={{
                                            width: 20,
                                            height: 20,
                                            borderRadius: '50%',
                                            backgroundColor: task.color || 'teal',
                                        }}
                                    />
                                </ListItemIcon>
                                <ListItemText
                                    primary="Cor"
                                    primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                                />
                                {editMode ? (
                                    <ColorSelector
                                        name="color"
                                        value={task.color || 'teal'}
                                        onChange={(e) => handleSelectChange(e as any)}
                                    />
                                ) : (
                                    <Typography variant="body2">
                                        {task.color || 'Padrão'}
                                    </Typography>
                                )}
                            </ListItem>
                        </List>
                    </Paper>
                    {/* Adicione aqui mais componentes para a coluna da direita */}
                    {(!editMode && task.subtasks && task.subtasks.length > 0) && (
                        <Paper
                            component={motion.div}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.3, delay: 0.2 }}
                            elevation={0}
                            sx={{
                                p: 3,
                                mb: 3,
                                border: `1px solid ${theme.palette.divider}`,
                                borderRadius: 2
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                <FormatListBulletedIcon color="primary" sx={{ mr: 1 }} />
                                <Typography variant="h6" component="h2">
                                    Subtarefas
                                </Typography>
                            </Box>
                            <List disablePadding>
                                {task.subtasks.map((subtask, index) => (
                                    <ListItem
                                        key={index}
                                        disableGutters
                                        sx={{
                                            py: 1,
                                            px: 0,
                                            borderBottom: index < task.subtasks!.length - 1 ?
                                                `1px solid ${alpha(theme.palette.divider, 0.5)}` : 'none',
                                        }}
                                    >
                                        <ListItemIcon sx={{ minWidth: 40 }}>
                                            {subtask.completed ?
                                                <CheckCircleIcon color="success" /> :
                                                <PendingIcon color="action" />
                                            }
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={subtask.title}
                                            primaryTypographyProps={{
                                                style: {
                                                    textDecoration: subtask.completed ? 'line-through' : 'none',
                                                    color: subtask.completed ? theme.palette.text.secondary : theme.palette.text.primary
                                                }
                                            }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </Paper>
                    )}
                </Grid>
            </Grid>
        </Box>
    );
};

export default TaskDetails;
