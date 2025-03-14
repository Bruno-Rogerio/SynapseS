import React, { useState, useEffect } from 'react';
import {
    Box, Button, TextField, Select, MenuItem, FormControl,
    InputLabel, SelectChangeEvent, Typography, Paper, IconButton,
    Grid, Divider, Chip, Avatar, InputAdornment, Tooltip,
    Stack, Card, CardContent, alpha, useTheme
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, User } from '../../types';
import ColorSelector from './ColorSelector';

// Ícones - importando apenas os necessários
import TitleIcon from '@mui/icons-material/Title';
import DescriptionIcon from '@mui/icons-material/Description';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventAvailableIcon from '@mui/icons-material/EventAvailable';
import PersonIcon from '@mui/icons-material/Person';
import FormatListNumberedIcon from '@mui/icons-material/FormatListNumbered';
import PaletteIcon from '@mui/icons-material/Palette';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import LoopIcon from '@mui/icons-material/Loop';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ImageIcon from '@mui/icons-material/Image';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

// Componente para visualização de arquivos anexados
const FilePreview = ({ file, onRemove }: { file: string; onRemove: () => void }) => {
    const isImage = file.match(/\.(jpeg|jpg|gif|png)$/i);
    const isPdf = file.match(/\.(pdf)$/i);

    return (
        <Card variant="outlined" sx={{ mb: 1, position: 'relative' }}>
            <CardContent sx={{ p: 1, '&:last-child': { pb: 1 } }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {isImage ? (
                        <ImageIcon color="primary" sx={{ mr: 1 }} />
                    ) : isPdf ? (
                        <PictureAsPdfIcon color="error" sx={{ mr: 1 }} />
                    ) : (
                        <InsertDriveFileIcon color="action" sx={{ mr: 1 }} />
                    )}
                    <Typography variant="body2" noWrap sx={{ flex: 1 }}>
                        {file.split('/').pop()}
                    </Typography>
                    <IconButton size="small" onClick={onRemove}>
                        <DeleteIcon fontSize="small" />
                    </IconButton>
                </Box>
            </CardContent>
        </Card>
    );
};

interface TaskFormProps {
    users: User[];
    onSubmit: (task: Task) => void;
    onClose: () => void;
    initialTask?: Task;
    missionId?: string;
    missionTitle?: string;
}

const TaskForm: React.FC<TaskFormProps> = ({
    users,
    onSubmit,
    onClose,
    initialTask,
    missionId,
    missionTitle
}) => {
    const theme = useTheme();

    const [newTask, setNewTask] = useState<Task>({
        _id: '',
        title: '',
        description: '',
        status: 'pending',
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        assignedTo: '',
        createdBy: '',
        points: 0,
        comments: '',
        attachments: [],
        color: 'teal',
        missionId: missionId || '',
        missionTitle: missionTitle || ''
    });

    const [dateError, setDateError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);

    useEffect(() => {
        if (initialTask) {
            setNewTask(initialTask);
        }
    }, [initialTask]);

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

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
    };

    const handleFiles = (files: FileList) => {
        const fileUrls = Array.from(files).map(file => URL.createObjectURL(file));
        setNewTask(prev => ({
            ...prev,
            attachments: [...prev.attachments, ...fileUrls]
        }));
    };

    const handleRemoveFile = (index: number) => {
        setNewTask(prev => ({
            ...prev,
            attachments: prev.attachments.filter((_, i) => i !== index)
        }));
    };

    const validateDates = (field: string, value: string) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate = new Date(value + 'T00:00:00');
        const startDate = field === 'startDate' ? selectedDate : newTask.startDate ? new Date(newTask.startDate + 'T00:00:00') : null;
        const endDate = field === 'endDate' ? selectedDate : newTask.endDate ? new Date(newTask.endDate + 'T00:00:00') : null;

        if (selectedDate < today) {
            setDateError('A data não pode ser anterior a hoje');
            return false;
        }

        if (startDate && endDate && field === 'endDate' && endDate < startDate) {
            setDateError('A data de conclusão não pode ser anterior à data de início');
            return false;
        }

        setDateError(null);
        return true;
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Validar datas antes de enviar
        const startDateValid = validateDates('startDate', newTask.startDate);
        const endDateValid = newTask.endDate ? validateDates('endDate', newTask.endDate) : true;

        if (startDateValid && endDateValid) {
            onSubmit(newTask);
        }
    };

    const renderStatusIcon = (status: string) => {
        switch (status) {
            case 'pending':
                return <PendingIcon sx={{ color: theme.palette.warning.main }} />;
            case 'in_progress':
                return <LoopIcon sx={{ color: theme.palette.info.main }} />;
            case 'completed':
                return <CheckCircleIcon sx={{ color: theme.palette.success.main }} />;
            default:
                return null;
        }
    };

    // Renderizar o avatar do usuário responsável
    const renderUserAvatar = (userId: string) => {
        const user = users.find(u => u._id === userId);
        if (!user) return null;

        return (
            <Tooltip title={user.username || 'Usuário'}>
                <Avatar
                    src={user.avatar}
                    alt={user.username}
                    sx={{
                        width: 32,
                        height: 32,
                        bgcolor: !user.avatar ? theme.palette.primary.main : undefined,
                        fontSize: '0.9rem'
                    }}
                >
                    {!user.avatar && (user.username?.charAt(0) || 'U')}
                </Avatar>
            </Tooltip>
        );
    };

    return (
        <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            sx={{ position: 'relative' }}
        >
            {/* Cabeçalho */}
            <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 4
            }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Box
                        component={motion.div}
                        initial={{ rotate: -10, scale: 0.9 }}
                        animate={{ rotate: 0, scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                        sx={{ mr: 2 }}
                    >
                        {initialTask ? (
                            <SaveIcon sx={{ fontSize: 28, color: theme.palette.primary.main }} />
                        ) : (
                            <AddIcon sx={{ fontSize: 28, color: theme.palette.primary.main }} />
                        )}
                    </Box>
                    <Typography
                        variant="h5"
                        component={motion.h5}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ duration: 0.3, delay: 0.1 }}
                        sx={{ fontWeight: 600 }}
                    >
                        {initialTask ? 'Editar Tarefa' : 'Nova Tarefa'}
                    </Typography>
                </Box>

                <IconButton
                    onClick={onClose}
                    size="large"
                    sx={{
                        bgcolor: alpha(theme.palette.grey[500], 0.1),
                        '&:hover': {
                            bgcolor: alpha(theme.palette.grey[500], 0.2),
                        }
                    }}
                >
                    <CloseIcon fontSize="small" />
                </IconButton>
            </Box>

            {/* Indicador de missão, se aplicável */}
            {missionTitle && (
                <Box sx={{ mb: 3 }}>
                    <Chip
                        label={`Missão: ${missionTitle}`}
                        color="primary"
                        variant="outlined"
                    />
                </Box>
            )}

            <form onSubmit={handleSubmit}>
                <Grid container spacing={3}>
                    {/* Coluna da esquerda - informações principais */}
                    <Grid item xs={12} md={7}>
                        <Stack spacing={3}>
                            {/* Campo de título */}
                            <TextField
                                label="Título da Tarefa"
                                name="title"
                                value={newTask.title}
                                onChange={handleInputChange}
                                fullWidth
                                required
                                variant="outlined"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <TitleIcon color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                                placeholder="Digite um título descritivo"
                            />

                            {/* Campo de descrição */}
                            <TextField
                                label="Descrição detalhada"
                                name="description"
                                value={newTask.description}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={4}
                                variant="outlined"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                                            <DescriptionIcon color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ '& .MuiInputAdornment-root': { alignSelf: 'flex-start', mt: 2 } }}
                                placeholder="Descreva o que precisa ser feito nesta tarefa..."
                            />

                            {/* Status e pontos */}
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <FormControl fullWidth variant="outlined">
                                        <InputLabel>Status</InputLabel>
                                        <Select
                                            name="status"
                                            value={newTask.status}
                                            onChange={handleSelectChange}
                                            label="Status"
                                            required
                                            startAdornment={
                                                <InputAdornment position="start">
                                                    {renderStatusIcon(newTask.status)}
                                                </InputAdornment>
                                            }
                                        >
                                            <MenuItem value="pending">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <PendingIcon sx={{ color: theme.palette.warning.main }} />
                                                    <span>Pendente</span>
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="in_progress">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <LoopIcon sx={{ color: theme.palette.info.main }} />
                                                    <span>Em Progresso</span>
                                                </Box>
                                            </MenuItem>
                                            <MenuItem value="completed">
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                    <CheckCircleIcon sx={{ color: theme.palette.success.main }} />
                                                    <span>Concluída</span>
                                                </Box>
                                            </MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="Pontos"
                                        name="points"
                                        type="number"
                                        value={newTask.points}
                                        onChange={handleInputChange}
                                        fullWidth
                                        variant="outlined"
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <FormatListNumberedIcon color="primary" />
                                                </InputAdornment>
                                            ),
                                            inputProps: { min: 0, max: 100 }
                                        }}
                                    />
                                </Grid>
                            </Grid>

                            {/* Datas */}
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
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
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <CalendarTodayIcon color="primary" />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{ m: 0 }}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
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
                                        InputProps={{
                                            startAdornment: (
                                                <InputAdornment position="start">
                                                    <EventAvailableIcon color="primary" />
                                                </InputAdornment>
                                            ),
                                        }}
                                        sx={{ m: 0 }}
                                    />
                                </Grid>
                            </Grid>

                            {/* Responsável */}
                            <FormControl fullWidth variant="outlined">
                                <InputLabel>Responsável</InputLabel>
                                <Select
                                    name="assignedTo"
                                    value={typeof newTask.assignedTo === "object" ? newTask.assignedTo._id : newTask.assignedTo || ""}
                                    onChange={handleSelectChange}
                                    label="Responsável"
                                    startAdornment={
                                        <InputAdornment position="start">
                                            {newTask.assignedTo ?
                                                renderUserAvatar(typeof newTask.assignedTo === "object" ? newTask.assignedTo._id : newTask.assignedTo) :
                                                <PersonIcon color="primary" />
                                            }
                                        </InputAdornment>
                                    }
                                >
                                    <MenuItem value="">
                                        <em>Nenhum responsável</em>
                                    </MenuItem>
                                    {users.map((user) => (
                                        <MenuItem key={user._id} value={user._id}>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <Avatar
                                                    src={user.avatar}
                                                    sx={{ width: 24, height: 24 }}
                                                >
                                                    {user.username?.charAt(0)}
                                                </Avatar>
                                                <Typography>{user.username}</Typography>
                                            </Box>
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>

                            {/* Comentários */}
                            <TextField
                                label="Comentários"
                                name="comments"
                                value={newTask.comments}
                                onChange={handleInputChange}
                                fullWidth
                                multiline
                                rows={3}
                                variant="outlined"
                                InputProps={{
                                    startAdornment: (
                                        <InputAdornment position="start" sx={{ alignSelf: 'flex-start', mt: 1.5 }}>
                                            <ChatBubbleOutlineIcon color="primary" />
                                        </InputAdornment>
                                    ),
                                }}
                                sx={{ '& .MuiInputAdornment-root': { alignSelf: 'flex-start', mt: 2 } }}
                                placeholder="Adicione comentários relevantes"
                            />
                        </Stack>
                    </Grid>

                    {/* Coluna da direita - cores e anexos */}
                    <Grid item xs={12} md={5}>
                        <Stack spacing={3}>
                            {/* Seletor de cores */}
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    borderColor: theme.palette.divider,
                                    bgcolor: alpha(theme.palette.background.paper, 0.6),
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    gutterBottom
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: theme.palette.text.secondary,
                                        mb: 2,
                                    }}
                                >
                                    <PaletteIcon sx={{ mr: 1, fontSize: 18 }} />
                                    Cor da tarefa
                                </Typography>

                                <ColorSelector
                                    name="color"
                                    value={newTask.color || 'teal'}
                                    onChange={(e) => handleSelectChange(e as SelectChangeEvent<string>)}
                                />

                                {/* Prévia da cor */}
                                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Aparência:
                                    </Typography>
                                    <Chip
                                        label={newTask.title || "Nova tarefa"}
                                        sx={{
                                            bgcolor: newTask.color,
                                            color: '#fff',
                                            fontWeight: 500,
                                        }}
                                    />
                                </Box>
                            </Paper>

                            {/* Upload de arquivos */}
                            <Paper
                                variant="outlined"
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    borderColor: theme.palette.divider,
                                    bgcolor: alpha(theme.palette.background.paper, 0.6),
                                }}
                            >
                                <Typography
                                    variant="subtitle2"
                                    gutterBottom
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        color: theme.palette.text.secondary,
                                        mb: 2,
                                    }}
                                >
                                    <AttachFileIcon sx={{ mr: 1, fontSize: 18 }} />
                                    Arquivos anexados
                                </Typography>

                                {/* Área de upload de arquivos */}
                                <Box
                                    component={motion.div}
                                    animate={{
                                        backgroundColor: dragActive
                                            ? alpha(theme.palette.primary.main, 0.08)
                                            : alpha(theme.palette.primary.main, 0.03)
                                    }}
                                    sx={{
                                        border: `2px dashed ${dragActive
                                            ? theme.palette.primary.main
                                            : alpha(theme.palette.primary.main, 0.3)}`,
                                        borderRadius: theme.shape.borderRadius,
                                        padding: theme.spacing(3),
                                        textAlign: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease-in-out',
                                        '&:hover': {
                                            backgroundColor: alpha(theme.palette.primary.main, 0.05),
                                            borderColor: alpha(theme.palette.primary.main, 0.5),
                                        },
                                    }}
                                    onDragEnter={handleDragEnter}
                                    onDragLeave={handleDragLeave}
                                    onDragOver={handleDragOver}
                                    onDrop={handleDrop}
                                >
                                    <input
                                        type="file"
                                        multiple
                                        onChange={handleFileChange}
                                        style={{ display: 'none' }}
                                        id="file-upload"
                                        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
                                    />
                                    <label htmlFor="file-upload" style={{ width: '100%', height: '100%', display: 'block' }}>
                                        <Box sx={{ textAlign: 'center' }}>
                                            <AttachFileIcon
                                                color="primary"
                                                sx={{ fontSize: 36, mb: 1, opacity: 0.7 }}
                                            />
                                            <Typography color="text.secondary" gutterBottom>
                                                Arraste arquivos aqui ou clique para selecionar
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Suporta imagens, PDFs e documentos
                                            </Typography>
                                        </Box>
                                    </label>
                                </Box>

                                {/* Prévia dos arquivos */}
                                <AnimatePresence>
                                    {newTask.attachments.length > 0 && (
                                        <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <Box sx={{ mt: 2 }}>
                                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                                    {newTask.attachments.length} arquivo(s) anexado(s):
                                                </Typography>

                                                <Box sx={{ mt: 1, maxHeight: 200, overflowY: 'auto' }}>
                                                    {newTask.attachments.map((attachment, index) => (
                                                        <FilePreview
                                                            key={index}
                                                            file={attachment}
                                                            onRemove={() => handleRemoveFile(index)}
                                                        />
                                                    ))}
                                                </Box>
                                            </Box>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </Paper>
                        </Stack>
                    </Grid>
                </Grid>

                {/* Divider e botões de ação */}
                <Box sx={{ mt: 4 }}>
                    <Divider sx={{ mb: 3 }} />
                    <Box
                        sx={{
                            display: 'flex',
                            justifyContent: 'flex-end',
                            gap: 2,
                        }}
                    >
                        <Button
                            variant="outlined"
                            color="inherit"
                            onClick={onClose}
                            size="large"
                            sx={{ px: 3 }}
                        >
                            Cancelar
                        </Button>

                        <Button
                            type="submit"
                            variant="contained"
                            color="primary"
                            size="large"
                            sx={{
                                px: 4,
                                boxShadow: 2,
                                '&:hover': {
                                    boxShadow: 4,
                                }
                            }}
                            startIcon={initialTask ? <SaveIcon /> : <AddIcon />}
                        >
                            {initialTask ? 'Salvar Alterações' : 'Criar Tarefa'}
                        </Button>
                    </Box>
                </Box>
            </form>
        </Box>
    );
};

export default TaskForm;
