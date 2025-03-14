// frontend/src/components/TaskMissionManager/MissionEditForm.tsx
import React, { useState } from 'react';
import {
    Box,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Chip,
    Avatar,
    OutlinedInput,
    SelectChangeEvent,
    Typography,
    Paper,
    Divider,
    InputAdornment,
    useTheme,
    alpha,
    Tooltip,
    Badge,
    Grid,
    Card,
    CardContent,
    Collapse,
    LinearProgress
} from '@mui/material';
import { motion } from 'framer-motion';
import { Mission, User } from '../../types';
// Ícones
import PersonIcon from '@mui/icons-material/Person';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import SaveIcon from '@mui/icons-material/Save';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LoopIcon from '@mui/icons-material/Loop';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import GroupIcon from '@mui/icons-material/Group';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import WarningIcon from '@mui/icons-material/Warning';
import EditIcon from '@mui/icons-material/Edit';

interface MissionEditFormProps {
    mission: Mission;
    users: User[];
    onSubmit: (updatedMission: Partial<Mission>) => void;
    onClose: () => void;
}

// Define os tipos específicos para o status
type MissionStatus = 'pendente' | 'em-progresso' | 'concluida' | 'pending' | 'in_progress' | 'completed';

// Interface para o formulário
interface FormData {
    title: string;
    description: string;
    leader: string;
    members: string[];
    startDate: string;
    endDate: string;
    status: MissionStatus;
}

const MissionEditForm: React.FC<MissionEditFormProps> = ({ mission, users, onSubmit, onClose }) => {
    const theme = useTheme();
    // Status data for validation and display
    const statusMap = {
        "pending": {
            label: "Pendente",
            icon: <RadioButtonUncheckedIcon />,
            color: theme.palette.warning.main,
            value: "pendente" as MissionStatus
        },
        "pendente": {
            label: "Pendente",
            icon: <RadioButtonUncheckedIcon />,
            color: theme.palette.warning.main,
            value: "pendente" as MissionStatus
        },
        "in_progress": {
            label: "Em Progresso",
            icon: <LoopIcon />,
            color: theme.palette.info.main,
            value: "em-progresso" as MissionStatus
        },
        "em-progresso": {
            label: "Em Progresso",
            icon: <LoopIcon />,
            color: theme.palette.info.main,
            value: "em-progresso" as MissionStatus
        },
        "completed": {
            label: "Concluída",
            icon: <CheckCircleIcon />,
            color: theme.palette.success.main,
            value: "concluida" as MissionStatus
        },
        "concluida": {
            label: "Concluída",
            icon: <CheckCircleIcon />,
            color: theme.palette.success.main,
            value: "concluida" as MissionStatus
        },
        "concluída": {
            label: "Concluída",
            icon: <CheckCircleIcon />,
            color: theme.palette.success.main,
            value: "concluida" as MissionStatus
        }
    };

    // State
    const [formData, setFormData] = useState<FormData>({
        title: mission.title || '',
        description: mission.description || '',
        leader: mission.leader || '',
        members: mission.members || [],
        startDate: new Date(mission.startDate).toISOString().split('T')[0],
        endDate: new Date(mission.endDate).toISOString().split('T')[0],
        status: (mission.status as MissionStatus) || 'pendente'
    });
    
    const [errors, setErrors] = useState<{
        endDate?: string;
        leader?: string;
    }>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showAdvanced, setShowAdvanced] = useState(false);

    // Process status to display
    const currentStatus = statusMap[formData.status as keyof typeof statusMap] || statusMap.pendente;

    // Calculate progress from checkpoints
    const calculateProgress = () => {
        if (!mission.checkpoints || mission.checkpoints.length === 0) {
            return 0;
        }
        const completedCheckpoints = mission.checkpoints.filter(cp => {
            const cpStatus = String(cp.status).toLowerCase();
            return cpStatus === 'completed' || cpStatus === 'concluida' || cpStatus === 'concluída';
        }).length;
        return Math.round((completedCheckpoints / mission.checkpoints.length) * 100);
    };

    const progress = calculateProgress();

    // Validation logic
    const validateForm = () => {
        const newErrors: {
            endDate?: string;
            leader?: string;
        } = {};

        // Validate end date
        if (!formData.endDate) {
            newErrors.endDate = 'Data de conclusão é obrigatória';
        } else {
            const startDate = new Date(formData.startDate);
            const endDate = new Date(formData.endDate);
            if (endDate < startDate) {
                newErrors.endDate = 'A data de conclusão não pode ser anterior à data de início';
            }
        }

        // Validate leader
        if (!formData.leader) {
            newErrors.leader = 'Líder é obrigatório';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Calculate days remaining or overdue
    const getDaysInfo = () => {
        const now = new Date();
        const endDate = new Date(formData.endDate);
        endDate.setHours(23, 59, 59);
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const isOverdue = diffDays < 0;
        return {
            days: Math.abs(diffDays),
            isOverdue,
        };
    };

    const daysInfo = getDaysInfo();

    // Handle changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear errors when field is modified
        if (errors[name as keyof typeof errors]) {
            setErrors(prev => ({
                ...prev,
                [name]: undefined
            }));
        }
    };

    const handleLeaderChange = (e: SelectChangeEvent<string>) => {
        const leaderId = e.target.value;
        // Ensure leader is also in members
        let updatedMembers = [...formData.members];
        if (leaderId && !updatedMembers.includes(leaderId)) {
            updatedMembers.push(leaderId);
        }
        setFormData(prev => ({
            ...prev,
            leader: leaderId,
            members: updatedMembers
        }));
        // Clear error
        if (errors.leader) {
            setErrors(prev => ({
                ...prev,
                leader: undefined
            }));
        }
    };

    const handleMemberChange = (event: SelectChangeEvent<string[]>) => {
        const selectedMembers = event.target.value as string[];
        // Ensure leader is always in members
        let updatedMembers = [...selectedMembers];
        if (formData.leader && !updatedMembers.includes(formData.leader)) {
            updatedMembers.push(formData.leader);
        }
        setFormData(prev => ({
            ...prev,
            members: updatedMembers
        }));
    };

    const handleStatusChange = (event: SelectChangeEvent<string>) => {
        const newStatus = event.target.value as MissionStatus;
        setFormData(prev => ({
            ...prev,
            status: newStatus
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }
        setIsSubmitting(true);
        try {
            // Format dates properly
            await onSubmit({
                title: formData.title,
                description: formData.description,
                leader: formData.leader,
                members: formData.members,
                startDate: new Date(formData.startDate).toISOString(),
                endDate: new Date(formData.endDate).toISOString(),
                status: formData.status
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Find user details
    const getUser = (id: string) => {
        return users.find(u => u._id === id);
    };

    const leaderUser = getUser(formData.leader);

    // Estimar a data de criação (já que não está no tipo Mission)
    const createdAtDisplay = (() => {
        // Usar uma data aproximada baseada no ID da missão ou outra lógica
        // Aqui vamos simplesmente mostrar "há algum tempo"
        return "há algum tempo";
    })();

    return (
        <Paper
            elevation={0}
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            sx={{
                borderRadius: 3,
                overflow: 'hidden',
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                boxShadow: theme.shadows[2],
            }}
        >
            {/* Header com cor primária do tema */}
            <Box
                sx={{
                    bgcolor: theme.palette.primary.main,
                    color: 'white',
                    p: 3,
                    position: 'relative',
                    overflow: 'hidden',
                }}
            >
                {/* Background pattern */}
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        right: 0,
                        bottom: 0,
                        left: 0,
                        opacity: 0.1,
                        backgroundImage: 'linear-gradient(45deg, #fff 25%, transparent 25%), linear-gradient(-45deg, #fff 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #fff 75%), linear-gradient(-45deg, transparent 75%, #fff 75%)',
                        backgroundSize: '20px 20px',
                        backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px',
                    }}
                />
                {/* Circular decorations */}
                <Box
                    sx={{
                        position: 'absolute',
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                        top: -50,
                        right: -20,
                    }}
                />
                <Box
                    sx={{
                        position: 'absolute',
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        background: 'rgba(255,255,255,0.1)',
                        bottom: -20,
                        right: 80,
                    }}
                />
                <Box sx={{ position: 'relative' }}>
                    <Typography variant="overline" sx={{ opacity: 0.9 }}>
                        Editando Missão
                    </Typography>
                    <Typography variant="h5" fontWeight="bold" sx={{ mb: 1 }}>
                        {mission.title}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <AccessTimeIcon sx={{ fontSize: 18, mr: 0.5 }} />
                            <Typography variant="caption" fontWeight="medium">
                                Criada {createdAtDisplay}
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            {React.cloneElement(currentStatus.icon, { fontSize: 'small', style: { marginRight: '4px' } })}
                            <Typography variant="caption" fontWeight="medium">
                                {currentStatus.label}
                            </Typography>
                        </Box>
                    </Box>
                </Box>
            </Box>
            {/* Progress indicator */}
            <Box
                sx={{
                    height: 4,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    position: 'relative'
                }}
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        height: '100%',
                        width: `${progress}%`,
                        bgcolor: theme.palette.primary.main,
                        transition: 'width 1s ease-in-out'
                    }}
                />
            </Box>
            {/* Main form content */}
            <Box
                component="form"
                onSubmit={handleSubmit}
                sx={{
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                }}
            >
                {isSubmitting && <LinearProgress sx={{ mb: 2 }} />}
                {/* Mission status summary */}
                <Card variant="outlined" sx={{ borderRadius: 2 }}>
                    <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} sm={4}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Progresso
                                </Typography>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Box sx={{ flexGrow: 1, mr: 1 }}>
                                        <LinearProgress
                                            variant="determinate"
                                            value={progress}
                                            sx={{
                                                height: 8,
                                                borderRadius: 5,
                                                bgcolor: alpha(theme.palette.divider, 0.2),
                                                '& .MuiLinearProgress-bar': {
                                                    bgcolor: theme.palette.primary.main,
                                                    borderRadius: 5,
                                                }
                                            }}
                                        />
                                    </Box>
                                    <Typography variant="body2" color="text.secondary">
                                        {progress}%
                                    </Typography>
                                </Box>
                            </Grid>
                            <Grid item xs={6} sm={4}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    Checkpoints
                                </Typography>
                                <Typography variant="h6">
                                    {mission.checkpoints?.length || 0}
                                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                                        total
                                    </Typography>
                                </Typography>
                            </Grid>
                            <Grid item xs={6} sm={4}>
                                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                                    {daysInfo.isOverdue ? 'Atrasado' : 'Prazo'}
                                </Typography>
                                <Typography
                                    variant="h6"
                                    sx={{
                                        color: daysInfo.isOverdue ? 'error.main' : daysInfo.days <= 3 ? 'warning.main' : 'text.primary',
                                        display: 'flex',
                                        alignItems: 'center'
                                    }}
                                >
                                    {daysInfo.isOverdue && <WarningIcon fontSize="small" sx={{ mr: 0.5 }} />}
                                    {daysInfo.days} {daysInfo.days === 1 ? 'dia' : 'dias'}
                                    <Typography component="span" variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                                        {daysInfo.isOverdue ? 'atrás' : 'restante(s)'}
                                    </Typography>
                                </Typography>
                            </Grid>
                        </Grid>
                    </CardContent>
                </Card>
                <Grid container spacing={2}>
                    {/* Líder da Missão */}
                    <Grid item xs={12} md={6}>
                        <FormControl fullWidth error={!!errors.leader}>
                            <InputLabel id="leader-label">Líder da Missão</InputLabel>
                            <Select
                                labelId="leader-label"
                                id="leader-select"
                                value={formData.leader}
                                onChange={handleLeaderChange}
                                label="Líder da Missão"
                                startAdornment={
                                    <InputAdornment position="start">
                                        <PersonIcon color={errors.leader ? 'error' : 'primary'} />
                                    </InputAdornment>
                                }
                            >
                                {users.map((user) => (
                                    <MenuItem key={user._id} value={user._id}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                            <Avatar
                                                src={user.avatar}
                                                alt={user.username}
                                                sx={{ width: 28, height: 28 }}
                                            >
                                                {user.username.charAt(0)}
                                            </Avatar>
                                            <Typography>{user.username}</Typography>
                                        </Box>
                                    </MenuItem>
                                ))}
                            </Select>
                            {errors.leader && (
                                <Typography variant="caption" color="error">
                                    {errors.leader}
                                </Typography>
                            )}
                        </FormControl>
                    </Grid>
                    {/* Data de Conclusão */}
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Data de Conclusão"
                            name="endDate"
                            type="date"
                            value={formData.endDate}
                            onChange={handleChange}
                            error={!!errors.endDate}
                            helperText={errors.endDate}
                            InputLabelProps={{
                                shrink: true,
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <CalendarTodayIcon color={errors.endDate ? 'error' : 'primary'} />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    {/* Status da Missão */}
                    <Grid item xs={12}>
                        <FormControl fullWidth>
                            <InputLabel id="status-label">Status</InputLabel>
                            <Select
                                labelId="status-label"
                                id="status-select"
                                value={formData.status}
                                onChange={handleStatusChange}
                                label="Status"
                                startAdornment={
                                    <InputAdornment position="start">
                                        {React.cloneElement(currentStatus.icon, { color: 'primary' })}
                                    </InputAdornment>
                                }
                                sx={{
                                    '& .MuiSelect-select': {
                                        display: 'flex',
                                        alignItems: 'center',
                                    }
                                }}
                            >
                                <MenuItem value="pendente">
                                    <Box sx={{ display: 'flex', alignItems: 'center', color: statusMap.pendente.color }}>
                                        {statusMap.pendente.icon}
                                        <Typography sx={{ ml: 1 }}>Pendente</Typography>
                                    </Box>
                                </MenuItem>
                                <MenuItem value="em-progresso">
                                    <Box sx={{ display: 'flex', alignItems: 'center', color: statusMap["em-progresso"].color }}>
                                        {statusMap["em-progresso"].icon}
                                        <Typography sx={{ ml: 1 }}>Em Progresso</Typography>
                                    </Box>
                                </MenuItem>
                                <MenuItem value="concluida">
                                    <Box sx={{ display: 'flex', alignItems: 'center', color: statusMap.concluida.color }}>
                                        {statusMap.concluida.icon}
                                        <Typography sx={{ ml: 1 }}>Concluída</Typography>
                                    </Box>
                                </MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
                {/* Membros da Equipe */}
                <FormControl fullWidth>
                    <InputLabel id="members-label">Membros da Equipe</InputLabel>
                    <Select
                        labelId="members-label"
                        id="members-select"
                        multiple
                        value={formData.members}
                        onChange={handleMemberChange}
                        input={<OutlinedInput label="Membros da Equipe" />}
                        startAdornment={
                            <InputAdornment position="start">
                                <GroupIcon color="primary" />
                            </InputAdornment>
                        }
                        renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value) => {
                                    const user = getUser(value);
                                    const isLeader = value === formData.leader;
                                    return (
                                        <Chip
                                            key={value}
                                            label={user?.username || value}
                                            size="small"
                                            sx={{
                                                bgcolor: isLeader ? alpha(theme.palette.primary.main, 0.1) : undefined,
                                                border: isLeader ? `1px solid ${theme.palette.primary.main}` : undefined,
                                            }}
                                            avatar={
                                                <Avatar
                                                    src={user?.avatar}
                                                    sx={{
                                                        bgcolor: isLeader ? theme.palette.primary.main : undefined,
                                                    }}
                                                >
                                                    {(user?.username || 'U').charAt(0)}
                                                </Avatar>
                                            }
                                        />
                                    );
                                })}
                            </Box>
                        )}
                    >
                        {users.map((user) => (
                            <MenuItem
                                key={user._id}
                                value={user._id}
                                disabled={user._id === formData.leader} // Disable leader since they're always included
                            >
                                <Box sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    width: '100%'
                                }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar
                                            src={user.avatar}
                                            alt={user.username}
                                            sx={{ width: 28, height: 28 }}
                                        >
                                            {user.username.charAt(0)}
                                        </Avatar>
                                        <Typography>{user.username}</Typography>
                                    </Box>
                                    {user._id === formData.leader && (
                                        <Chip
                                            label="Líder"
                                            size="small"
                                            color="primary"
                                            sx={{ height: 20, fontSize: '0.7rem' }}
                                        />
                                    )}
                                </Box>
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
                {/* Advanced options toggle */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Button
                        onClick={() => setShowAdvanced(!showAdvanced)}
                        startIcon={showAdvanced ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        color="inherit"
                        variant="text"
                        sx={{ textTransform: 'none' }}
                    >
                        Opções avançadas
                    </Button>
                    {/* Avatar do líder */}
                    {leaderUser && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" color="text.secondary">
                                Líder atual:
                            </Typography>
                            <Tooltip title={leaderUser.username}>
                                <Badge
                                    overlap="circular"
                                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                    badgeContent={
                                        <Avatar
                                            sx={{
                                                width: 16,
                                                height: 16,
                                                bgcolor: theme.palette.primary.main,
                                                border: `2px solid ${theme.palette.background.paper}`
                                            }}
                                        >
                                            <Typography variant="caption" sx={{ fontSize: '0.65rem' }}>
                                                L
                                            </Typography>
                                        </Avatar>
                                    }
                                >
                                    <Avatar
                                        src={leaderUser.avatar}
                                        alt={leaderUser.username}
                                        sx={{ width: 40, height: 40 }}
                                    >
                                        {leaderUser.username.charAt(0)}
                                    </Avatar>
                                </Badge>
                            </Tooltip>
                        </Box>
                    )}
                </Box>
                {/* Advanced options */}
                <Collapse in={showAdvanced}>
                    <Box sx={{ pt: 1 }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Título"
                                    name="title"
                                    value={formData.title}
                                    onChange={handleChange}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EditIcon color="primary" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12} md={6}>
                                <TextField
                                    fullWidth
                                    label="Data de Início"
                                    name="startDate"
                                    type="date"
                                    value={formData.startDate}
                                    onChange={handleChange}
                                    InputLabelProps={{
                                        shrink: true,
                                    }}
                                    InputProps={{
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <CalendarTodayIcon color="primary" />
                                            </InputAdornment>
                                        ),
                                    }}
                                />
                            </Grid>
                            <Grid item xs={12}>
                                <TextField
                                    fullWidth
                                    label="Descrição"
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    multiline
                                    rows={4}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </Collapse>
                {/* Actions */}
                <Divider sx={{ mt: 2, mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Button
                        onClick={onClose}
                        variant="outlined"
                        startIcon={<CloseIcon />}
                        disabled={isSubmitting}
                        color="inherit"
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        disabled={isSubmitting}
                    >
                        Salvar Alterações
                    </Button>
                </Box>
            </Box>
        </Paper>
    );
};
export default MissionEditForm;
