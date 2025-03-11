// components/CreateForumForm.tsx
import React, { useState, useEffect } from 'react';
import {
    TextField,
    Button,
    Box,
    Typography,
    Chip,
    Stack,
    IconButton,
    useTheme,
    InputAdornment,
    Divider,
    CircularProgress,
    Stepper,
    Step,
    StepLabel,
    StepContent,
    Paper,
    Avatar,
    alpha,
    Tooltip,
    Autocomplete,
    LinearProgress,
    Card,
    CardContent,
    Badge,
    FormControlLabel,
    Switch,
    Dialog,
    useMediaQuery
} from '@mui/material';
import axios from 'axios';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import InsertPhotoIcon from '@mui/icons-material/InsertPhoto';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import PublicIcon from '@mui/icons-material/Public';
import ForumIcon from '@mui/icons-material/Forum';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

interface CreateForumFormProps {
    onClose: () => void;
    onForumCreated: () => void;
}

// Lista de tags sugeridas para autocompletar
const SUGGESTED_TAGS = [
    'Tecnologia', 'Programação', 'Design', 'Marketing', 'Negócios', 
    'Educação', 'Saúde', 'Esportes', 'Arte', 'Música', 'Cinema', 
    'Literatura', 'Ciência', 'História', 'Filosofia', 'Política',
    'Desenvolvimento Web', 'Mobile', 'IA', 'Machine Learning', 'UX/UI',
    'React', 'Node.js', 'Python', 'JavaScript', 'Data Science'
];

// Categorias para o fórum
const FORUM_CATEGORIES = [
    { name: 'Discussão Geral', description: 'Tópicos gerais e miscelânea', icon: <ForumIcon /> },
    { name: 'Perguntas e Respostas', description: 'Tire suas dúvidas com a comunidade', icon: <HelpOutlineIcon /> },
    { name: 'Compartilhamento', description: 'Compartilhe recursos e conhecimento', icon: <ChatBubbleOutlineIcon /> },
];

const CreateForumForm: React.FC<CreateForumFormProps> = ({ onClose, onForumCreated }) => {
    // Estado dos passos
    const [activeStep, setActiveStep] = useState(0);
    
    // Estados para o formulário
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [tag, setTag] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [category, setCategory] = useState(FORUM_CATEGORIES[0].name);
    const [isPublic, setIsPublic] = useState(true);
    const [enableNotifications, setEnableNotifications] = useState(true);
    const [image, setImage] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Estados para feedback de qualidade
    const [titleScore, setTitleScore] = useState(0);
    const [descriptionScore, setDescriptionScore] = useState(0);
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const { user } = useAuth();
    
    // Cálculo de score baseado na qualidade do título
    useEffect(() => {
        if (!title) {
            setTitleScore(0);
            return;
        }
        
        let score = 0;
        
        // Comprimento adequado (entre 10 e 100 caracteres)
        if (title.length >= 10) score += 30;
        if (title.length >= 20) score += 20;
        if (title.length > 100) score -= 20;
        
        // Tem caracteres especiais ou números (pode indicar mais especificidade)
        if (/[0-9!?]/.test(title)) score += 10;
        
        // Contém palavras-chave importantes
        const keywords = ['como', 'guia', 'tutorial', 'ajuda', 'dúvida', 'problema'];
        if (keywords.some(keyword => title.toLowerCase().includes(keyword))) {
            score += 15;
        }
        
        setTitleScore(Math.min(100, score));
    }, [title]);
    
    // Cálculo de score baseado na qualidade da descrição
    useEffect(() => {
        if (!description) {
            setDescriptionScore(0);
            return;
        }
        
        let score = 0;
        
        // Comprimento adequado
        if (description.length >= 50) score += 20;
        if (description.length >= 100) score += 20;
        if (description.length >= 200) score += 20;
        
        // Tem formatação ou estrutura
        if (description.includes('\n')) score += 10;
        
        // Tem perguntas (engagement)
        if (description.includes('?')) score += 10;
        
        // Parágrafos bem definidos
        const paragraphs = description.split('\n\n');
        if (paragraphs.length > 1) score += 20;
        
        setDescriptionScore(Math.min(100, score));
    }, [description]);
    
    const getScoreColor = (score: number) => {
        if (score < 30) return theme.palette.error.main;
        if (score < 60) return theme.palette.warning.main;
        return theme.palette.success.main;
    };
    
    // Manipuladores de tags
    const handleAddTag = () => {
        if (tag && !tags.includes(tag) && tags.length < 8) {
            setTags([...tags, tag]);
            setTag('');
        }
    };
    
    const handleDeleteTag = (tagToDelete: string) => {
        setTags(tags.filter((t) => t !== tagToDelete));
    };
    
    // Manipulador de imagem (simulado com uma URL)
    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Em um caso real, você enviaria para um servidor
            // Aqui estamos simulando com um URL de objeto local
            const reader = new FileReader();
            reader.onload = () => {
                setImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };
    
    // Navegação entre passos
    const handleNext = () => {
        setActiveStep((prevActiveStep) => prevActiveStep + 1);
    };
    
    const handleBack = () => {
        setActiveStep((prevActiveStep) => prevActiveStep - 1);
    };
    
    // Envio do formulário
    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError('');
        const forumData = { 
            title, 
            description, 
            tags, 
            category,
            isPublic,
            enableNotifications,
            // Em um caso real, você enviaria o arquivo de imagem para o servidor
            // e salvaria a URL retornada. Aqui estamos apenas indicando que tem uma imagem.
            hasImage: !!image
        };
        
        console.log('Sending forum data:', forumData);
        
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/forums`, forumData, {
                withCredentials: true
            });
            console.log('Forum created successfully:', response.data);
            onForumCreated();
            onClose();
        } catch (error) {
            console.error('Error creating forum:', error);
            if (axios.isAxiosError(error)) {
                if (error.response) {
                    console.error('Error response:', error.response.data);
                    setError(`Erro ao criar fórum: ${error.response.data.message || 'Erro desconhecido'}`);
                } else if (error.request) {
                    console.error('No response received:', error.request);
                    setError('Erro ao criar fórum: Nenhuma resposta recebida do servidor');
                } else {
                    console.error('Error setting up request:', error.message);
                    setError(`Erro ao criar fórum: ${error.message}`);
                }
            } else {
                setError('Erro desconhecido ao criar fórum');
            }
            setActiveStep(3); // Volta para o passo de revisão em caso de erro
        } finally {
            setIsSubmitting(false);
        }
    };
    
    // Verificação se pode avançar para o próximo passo
    const canAdvance = () => {
        switch (activeStep) {
            case 0:
                return title.length >= 5;
            case 1:
                return description.length >= 20;
            case 2:
                return tags.length >= 1;
            default:
                return true;
        }
    };
    
    return (
        <Box sx={{ maxWidth: 800, margin: '0 auto' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography 
                    variant="h5" 
                    component="h2" 
                    sx={{ 
                        fontWeight: 700, 
                        background: 'linear-gradient(90deg, #6B73FF 0%, #000DFF 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                    }}
                >
                    Criar Novo Fórum
                </Typography>
                <IconButton onClick={onClose} size="small" disabled={isSubmitting}>
                    <CloseIcon />
                </IconButton>
            </Box>
            
            <Divider sx={{ mb: 4 }} />
            
            {/* Stepper para navegação entre os passos */}
            <Stepper activeStep={activeStep} orientation={isMobile ? "vertical" : "horizontal"} sx={{ mb: 4 }}>
                <Step>
                    <StepLabel>Informações Básicas</StepLabel>
                </Step>
                <Step>
                    <StepLabel>Descrição</StepLabel>
                </Step>
                <Step>
                    <StepLabel>Tags & Categorias</StepLabel>
                </Step>
                <Step>
                    <StepLabel>Revisão & Criar</StepLabel>
                </Step>
            </Stepper>
            
            {/* Conteúdo dinâmico baseado no passo atual */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {activeStep === 0 && (
                        /* Passo 1: Informações Básicas */
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                Qual será o título do seu fórum?
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Escolha um título claro e conciso que descreva o tema do fórum.
                            </Typography>
                            
                            <TextField
                                fullWidth
                                label="Título do Fórum"
                                value={title}
                                onChange={(e) => setTitle(e.target.value)}
                                required
                                variant="outlined"
                                sx={{ mb: 3 }}
                                disabled={isSubmitting}
                                placeholder="Ex: Discussões sobre desenvolvimento React"
                                helperText={
                                    title.length > 0 ? 
                                    `${title.length}/100 caracteres` : 
                                    "Um bom título ajuda os outros a encontrar seu fórum"
                                }
                                InputProps={{
                                    endAdornment: title.length > 0 ? (
                                        <InputAdornment position="end">
                                            <IconButton size="small" onClick={() => setTitle("")}>
                                                <CloseIcon fontSize="small" />
                                            </IconButton>
                                        </InputAdornment>
                                    ) : null
                                }}
                            />
                            
                            {title.length > 0 && (
                                <Box sx={{ mb: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" fontWeight={500}>
                                            Qualidade do título
                                        </Typography>
                                        <Typography 
                                            variant="body2" 
                                            fontWeight={600}
                                            sx={{ color: getScoreColor(titleScore) }}
                                        >
                                            {titleScore < 30 ? 'Básico' : titleScore < 60 ? 'Bom' : 'Excelente'} 
                                            ({titleScore}%)
                                        </Typography>
                                    </Box>
                                    <LinearProgress 
                                        variant="determinate" 
                                        value={titleScore} 
                                        sx={{ 
                                            height: 8, 
                                            borderRadius: 4,
                                            backgroundColor: alpha(getScoreColor(titleScore), 0.2),
                                            '& .MuiLinearProgress-bar': {
                                                backgroundColor: getScoreColor(titleScore)
                                            }
                                        }} 
                                    />
                                    
                                    {titleScore < 60 && (
                                        <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.info.light, 0.1), borderRadius: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                <InfoOutlinedIcon 
                                                    fontSize="small" 
                                                    sx={{ verticalAlign: 'middle', mr: 1, color: theme.palette.info.main }} 
                                                />
                                                Dica: Um bom título tem entre 20-100 caracteres e descreve claramente o tema do fórum.
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            )}
                            
                            {/* Seleção de privacidade */}
                            <Paper elevation={0} sx={{ p: 2, bgcolor: alpha(theme.palette.background.default, 0.7), borderRadius: 2, mb: 2, border: `1px solid ${theme.palette.divider}` }}>
                                <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                                    Privacidade do Fórum
                                </Typography>
                                
                                <Stack direction="row" spacing={2} sx={{ mb: 1 }}>
                                    <Button
                                        variant={isPublic ? "contained" : "outlined"}
                                        startIcon={<PublicIcon />}
                                        onClick={() => setIsPublic(true)}
                                        sx={{ borderRadius: 2, flex: 1 }}
                                        size="small"
                                    >
                                        Público
                                    </Button>
                                    <Button
                                        variant={!isPublic ? "contained" : "outlined"}
                                        startIcon={<LockOutlinedIcon />}
                                        onClick={() => setIsPublic(false)}
                                        sx={{ borderRadius: 2, flex: 1 }}
                                        size="small"
                                    >
                                        Restrito
                                    </Button>
                                </Stack>
                                
                                <Typography variant="caption" color="text.secondary">
                                    {isPublic 
                                        ? "Qualquer pessoa pode ver e participar deste fórum" 
                                        : "Apenas membros convidados podem ver e participar"}
                                </Typography>
                            </Paper>
                            
                            <Box sx={{ mt: 4 }}>
                                <Button 
                                    variant="contained" 
                                    color="primary" 
                                    onClick={handleNext} 
                                    disabled={!canAdvance()}
                                    endIcon={<ChevronRightIcon />}
                                    sx={{ px: 3, borderRadius: 2 }}
                                >
                                    Continuar
                                </Button>
                            </Box>
                        </Box>
                    )}
                    
                    {activeStep === 1 && (
                        /* Passo 2: Descrição */
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                Descreva seu fórum
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Explique o propósito do fórum, regras de participação, ou qualquer outra informação importante.
                            </Typography>
                            
                            <TextField
                                fullWidth
                                label="Descrição"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                required
                                multiline
                                minRows={6}
                                maxRows={12}
                                variant="outlined"
                                sx={{ mb: 2 }}
                                disabled={isSubmitting}
                                placeholder="Descreva o propósito deste fórum, quais temas são apropriados, e outras informações relevantes..."
                                helperText={
                                    description ? 
                                    `${description.length} caracteres` : 
                                    "Uma boa descrição ajuda os participantes a entender o propósito do fórum"
                                }
                            />
                            
                            {description.length > 0 && (
                                <Box sx={{ mb: 4 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2" fontWeight={500}>
                                            Qualidade da descrição
                                        </Typography>
                                        <Typography 
                                            variant="body2" 
                                            fontWeight={600}
                                            sx={{ color: getScoreColor(descriptionScore) }}
                                        >
                                            {descriptionScore < 30 ? 'Básica' : descriptionScore < 60 ? 'Boa' : 'Excelente'} 
                                            ({descriptionScore}%)
                                        </Typography>
                                    </Box>
                                    <LinearProgress 
                                        variant="determinate" 
                                        value={descriptionScore} 
                                        sx={{ 
                                            height: 8, 
                                            borderRadius: 4,
                                            backgroundColor: alpha(getScoreColor(descriptionScore), 0.2),
                                            '& .MuiLinearProgress-bar': {
                                                backgroundColor: getScoreColor(descriptionScore)
                                            }
                                        }} 
                                    />
                                    
                                    {descriptionScore < 60 && (
                                        <Box sx={{ mt: 2, p: 2, bgcolor: alpha(theme.palette.info.light, 0.1), borderRadius: 1 }}>
                                            <Typography variant="body2" color="text.secondary">
                                                <InfoOutlinedIcon 
                                                    fontSize="small" 
                                                    sx={{ verticalAlign: 'middle', mr: 1, color: theme.palette.info.main }} 
                                                />
                                                Dica: Inclua parágrafos bem estruturados, explique as regras e expectativas, e seja detalhado sobre o propósito do fórum.
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            )}
                            
                            {/* Imagem para o fórum */}
                            <Paper elevation={0} sx={{ 
                                p: 2, 
                                bgcolor: alpha(theme.palette.background.default, 0.7), 
                                borderRadius: 2, 
                                mb: 4,
                                border: `1px solid ${theme.palette.divider}`,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}>
                                <Typography variant="subtitle2" gutterBottom fontWeight={600}>
                                    Imagem do fórum (opcional)
                                </Typography>
                                
                                {image ? (
                                    <Box sx={{ position: 'relative', width: '100%', textAlign: 'center', mb: 2 }}>
                                        <Badge
                                            overlap="circular"
                                            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                                            badgeContent={
                                                <IconButton 
                                                    size="small" 
                                                    onClick={() => setImage(null)} 
                                                    sx={{ 
                                                        bgcolor: 'white', 
                                                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
                                                        '&:hover': { bgcolor: 'white' }
                                                    }}
                                                >
                                                    <CloseIcon fontSize="small" />
                                                </IconButton>
                                            }
                                        >
                                            <Avatar 
                                                src={image} 
                                                alt="Forum image" 
                                                sx={{ width: 100, height: 100, borderRadius: 2 }}
                                                variant="rounded"
                                            />
                                        </Badge>
                                    </Box>
                                ) : (
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        startIcon={<InsertPhotoIcon />}
                                        sx={{ borderStyle: 'dashed', mb: 1 }}
                                    >
                                        Escolher Imagem
                                        <input
                                            type="file"
                                            hidden
                                            accept="image/*"
                                            onChange={handleImageUpload}
                                        />
                                    </Button>
                                )}
                                
                                <Typography variant="caption" color="text.secondary">
                                    Escolha uma imagem que represente o tema do seu fórum
                                </Typography>
                            </Paper>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Button
                                    onClick={handleBack}
                                    startIcon={<ChevronLeftIcon />}
                                    sx={{ borderRadius: 2 }}
                                >
                                    Voltar
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleNext}
                                    disabled={!canAdvance()}
                                    endIcon={<ChevronRightIcon />}
                                    sx={{ px: 3, borderRadius: 2 }}
                                >
                                    Continuar
                                </Button>
                            </Box>
                        </Box>
                    )}
                    
                    {activeStep === 2 && (
                        /* Passo 3: Tags e Categorias */
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                Tags e Categorização
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Adicione tags para ajudar outros usuários a encontrar seu fórum e selecione uma categoria.
                            </Typography>
                            
                            {/* Autocomplete para tags */}
                            <Autocomplete
                                freeSolo
                                options={SUGGESTED_TAGS.filter(t => !tags.includes(t))}
                                inputValue={tag}
                                onInputChange={(_, newValue) => setTag(newValue)}
                                onChange={(_, newValue) => {
                                    if (newValue && !tags.includes(newValue)) {
                                        setTags([...tags, newValue]);
                                        setTag('');
                                    }
                                }}
                                renderInput={(params) => (
                                    <TextField
                                        {...params}
                                        label="Adicionar Tag"
                                        variant="outlined"
                                        fullWidth
                                        disabled={isSubmitting || tags.length >= 8}
                                        helperText={tags.length >= 8 ? "Máximo de 8 tags atingido" : "Pressione Enter ou selecione da lista de sugestões"}
                                        InputProps={{
                                            ...params.InputProps,
                                            endAdornment: (
                                                <InputAdornment position="end">
                                                    <IconButton 
                                                        onClick={handleAddTag} 
                                                        edge="end" 
                                                        disabled={isSubmitting || !tag || tags.length >= 8}
                                                    >
                                                        <AddIcon />
                                                    </IconButton>
                                                </InputAdornment>
                                            ),
                                        }}
                                        onKeyPress={(e) => {
                                            if (e.key === 'Enter' && tag && !tags.includes(tag) && tags.length < 8) {
                                                e.preventDefault();
                                                handleAddTag();
                                            }
                                        }}
                                    />
                                )}
                            />
                            
                            {/* Tags selecionadas */}
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, my: 3 }}>
                                <AnimatePresence>
                                    {tags.map((t) => (
                                        <motion.div
                                            key={t}
                                            initial={{ opacity: 0, scale: 0.8 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.8 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Chip
                                                label={t}
                                                onDelete={() => handleDeleteTag(t)}
                                                disabled={isSubmitting}
                                                sx={{
                                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                    color: theme.palette.primary.main,
                                                    fontWeight: 500,
                                                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.2) },
                                                }}
                                            />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                
                                {tags.length === 0 && (
                                    <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                                        <LocalOfferIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 1, opacity: 0.7 }} />
                                        Nenhuma tag adicionada ainda
                                    </Typography>
                                )}
                            </Box>
                            
                            {/* Seleção de categoria */}
                            <Typography variant="subtitle1" gutterBottom sx={{ mt: 3, fontWeight: 600 }}>
                                Categoria do fórum
                            </Typography>
                            
                            <Box sx={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', gap: 2, mb: 4 }}>
                                {FORUM_CATEGORIES.map((cat) => (
                                    <Card 
                                        key={cat.name}
                                        raised={category === cat.name}
                                        sx={{ 
                                            flex: '1 1 0',
                                            cursor: 'pointer',
                                            borderRadius: 2,
                                            transition: 'all 0.2s',
                                            transform: category === cat.name ? 'translateY(-2px)' : 'none',
                                            border: category === cat.name ? `2px solid ${theme.palette.primary.main}` : 'none',
                                        }}
                                        onClick={() => setCategory(cat.name)}
                                    >
                                        <CardContent>
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                mb: 1,
                                                color: category === cat.name ? theme.palette.primary.main : 'inherit'
                                            }}>
                                                {cat.icon}
                                                <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 600 }}>
                                                    {cat.name}
                                                </Typography>
                                            </Box>
                                            <Typography variant="body2" color="text.secondary">
                                                {cat.description}
                                            </Typography>
                                            
                                            {category === cat.name && (
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center', 
                                                    mt: 2,
                                                    color: theme.palette.primary.main
                                                }}>
                                                    <CheckCircleIcon fontSize="small" sx={{ mr: 0.5 }} />
                                                    <Typography variant="caption" fontWeight={600}>
                                                        Selecionada
                                                    </Typography>
                                                </Box>
                                            )}
                                        </CardContent>
                                    </Card>
                                ))}
                            </Box>
                            
                            {/* Configurações de notificação */}
                            <Paper elevation={0} sx={{ 
                                p: 2, 
                                bgcolor: alpha(theme.palette.background.default, 0.7), 
                                borderRadius: 2, 
                                mb: 3,
                                border: `1px solid ${theme.palette.divider}`,
                            }}>
                                <FormControlLabel
                                    control={
                                        <Switch 
                                            checked={enableNotifications} 
                                            onChange={(e) => setEnableNotifications(e.target.checked)} 
                                        />
                                    }
                                    label={(
                                        <Box>
                                            <Typography variant="body2" fontWeight={500}>
                                                Receber notificações
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Seja notificado sobre novas mensagens neste fórum
                                            </Typography>
                                        </Box>
                                    )}
                                />
                            </Paper>
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Button
                                    onClick={handleBack}
                                    startIcon={<ChevronLeftIcon />}
                                    sx={{ borderRadius: 2 }}
                                >
                                    Voltar
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleNext}
                                    disabled={!canAdvance()}
                                    endIcon={<ChevronRightIcon />}
                                    sx={{ px: 3, borderRadius: 2 }}
                                >
                                    Revisar
                                </Button>
                            </Box>
                        </Box>
                    )}
                    
                    {activeStep === 3 && (
                        /* Passo 4: Revisão e Criação */
                        <Box>
                            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                                Revisar e Criar Fórum
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                                Verifique as informações abaixo antes de criar o fórum.
                            </Typography>
                            
                            {/* Cartão de pré-visualização */}
                            <Paper 
                                elevation={3} 
                                sx={{ 
                                    borderRadius: 3, 
                                    overflow: 'hidden',
                                    mb: 4,
                                    transition: 'transform 0.3s',
                                    '&:hover': {
                                        transform: 'translateY(-5px)',
                                    },
                                }}
                            >
                                {/* Header com cor ou imagem */}
                                <Box sx={{ 
                                    height: image ? 120 : 80, 
                                    background: image 
                                        ? `url(${image}) center/cover` 
                                        : 'linear-gradient(90deg, #6B73FF 0%, #000DFF 100%)',
                                    display: 'flex',
                                    alignItems: 'flex-end',
                                    justifyContent: 'center',
                                    p: 2,
                                    position: 'relative'
                                }}>
                                    {!image && (
                                        <Typography 
                                            variant="h5" 
                                            sx={{ 
                                                color: 'white', 
                                                textAlign: 'center',
                                                fontWeight: 700,
                                                textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                            }}
                                        >
                                            {title}
                                        </Typography>
                                    )}
                                    
                                    {/* Avatar que se sobrepõe à imagem/cor */}
                                    {image && (
                                        <Avatar
                                            sx={{
                                                width: 80,
                                                height: 80,
                                                position: 'absolute',
                                                bottom: -40,
                                                left: '50%',
                                                transform: 'translateX(-50%)',
                                                border: `4px solid ${theme.palette.background.paper}`,
                                                boxShadow: theme.shadows[3]
                                            }}
                                            src={image}
                                        >
                                            {title[0]}
                                        </Avatar>
                                    )}
                                </Box>
                                
                                {/* Conteúdo */}
                                <Box sx={{ p: 3, pt: image ? 5 : 3 }}>
                                    {image && (
                                        <Typography 
                                            variant="h5" 
                                            align="center" 
                                            gutterBottom
                                            sx={{ fontWeight: 700 }}
                                        >
                                            {title}
                                        </Typography>
                                    )}
                                    
                                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
                                        {tags.map(tag => (
                                            <Chip 
                                                key={tag} 
                                                label={tag} 
                                                size="small" 
                                                sx={{ 
                                                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                                                    color: theme.palette.primary.main,
                                                }} 
                                            />
                                        ))}
                                    </Box>
                                    
                                    <Typography 
                                        variant="body2" 
                                        color="text.secondary" 
                                        align="center"
                                        sx={{
                                            maxHeight: 80,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                        }}
                                    >
                                        {description}
                                    </Typography>
                                    
                                    <Box sx={{ 
                                        display: 'flex', 
                                        justifyContent: 'center', 
                                        mt: 2,
                                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                                        pt: 2
                                    }}>
                                        <Chip
                                            icon={isPublic ? <PublicIcon fontSize="small" /> : <LockOutlinedIcon fontSize="small" />}
                                            label={isPublic ? "Público" : "Restrito"}
                                            size="small"
                                            color={isPublic ? "primary" : "default"}
                                            variant="outlined"
                                            sx={{ mr: 1 }}
                                        />
                                        <Chip
                                            label={category}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                        />
                                    </Box>
                                </Box>
                            </Paper>
                            
                            {/* Botão para abrir diálogo de visualização completa */}
                            <Box sx={{ textAlign: 'center', mb: 4 }}>
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    onClick={() => setPreviewDialogOpen(true)}
                                    startIcon={<InsertPhotoIcon />}
                                >
                                    Ver em tela cheia
                                </Button>
                            </Box>
                            
                            {/* Mensagem de erro caso exista */}
                            {error && (
                                <Box sx={{ 
                                    mb: 3, 
                                    p: 2, 
                                    bgcolor: alpha(theme.palette.error.main, 0.1),
                                    borderRadius: 1,
                                    color: theme.palette.error.main
                                }}>
                                    <Typography variant="body2">
                                        {error}
                                    </Typography>
                                </Box>
                            )}
                            
                            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                                <Button
                                    onClick={handleBack}
                                    startIcon={<ChevronLeftIcon />}
                                    sx={{ borderRadius: 2 }}
                                    disabled={isSubmitting}
                                >
                                    Voltar
                                </Button>
                                <Button
                                    variant="contained"
                                    color="primary"
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <ForumIcon />}
                                    sx={{ 
                                        px: 4, 
                                        py: 1, 
                                        borderRadius: 2,
                                        position: 'relative',
                                        overflow: 'hidden',
                                        '&::after': {
                                            content: '""',
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            right: 0,
                                            bottom: 0,
                                            background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
                                            opacity: 0,
                                            transition: 'opacity 0.3s',
                                        },
                                        '&:hover::after': {
                                            opacity: 1,
                                        }
                                    }}
                                >
                                    {isSubmitting ? 'Criando...' : 'Criar Fórum'}
                                </Button>
                            </Box>
                        </Box>
                    )}
                </motion.div>
            </AnimatePresence>
            
            {/* Diálogo de pré-visualização */}
            <Dialog
                open={previewDialogOpen}
                onClose={() => setPreviewDialogOpen(false)}
                maxWidth="md"
                fullWidth
            >
                <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                        <Typography variant="h6" fontWeight={600}>
                            Visualização do Fórum
                        </Typography>
                        <IconButton onClick={() => setPreviewDialogOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>
                    
                    <Box sx={{ 
                        bgcolor: theme.palette.mode === 'dark' ? '#121212' : '#f5f5f5', 
                        borderRadius: 3, 
                        overflow: 'hidden',
                        border: `1px solid ${theme.palette.divider}`
                    }}>
                        {/* Header com imagem de capa */}
                        <Box sx={{ 
                            height: 200, 
                            background: image 
                                ? `url(${image}) center/cover` 
                                : 'linear-gradient(90deg, #6B73FF 0%, #000DFF 100%)',
                            display: 'flex',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            position: 'relative',
                            p: 3
                        }}>
                            {!image && (
                                <Typography 
                                    variant="h4" 
                                    sx={{ 
                                        color: 'white', 
                                        textAlign: 'center',
                                        fontWeight: 700,
                                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                                    }}
                                >
                                    {title}
                                </Typography>
                            )}
                            
                            {image && (
                                <Avatar
                                    sx={{
                                        width: 100,
                                        height: 100,
                                        position: 'absolute',
                                        bottom: -50,
                                        left: '50%',
                                        transform: 'translateX(-50%)',
                                        border: `4px solid ${theme.palette.background.paper}`,
                                        boxShadow: theme.shadows[3]
                                    }}
                                    src={image}
                                >
                                    {title[0]}
                                </Avatar>
                            )}
                        </Box>
                        
                        {/* Conteúdo */}
                        <Box sx={{ p: 4, pt: image ? 7 : 4 }}>
                            {image && (
                                <Typography 
                                    variant="h4" 
                                    align="center" 
                                    gutterBottom
                                    sx={{ fontWeight: 700, mb: 2 }}
                                >
                                    {title}
                                </Typography>
                            )}
                            
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'center', 
                                mb: 3, 
                                flexWrap: 'wrap',
                                gap: 1
                            }}>
                                {tags.map(tag => (
                                    <Chip 
                                        key={tag} 
                                        label={tag} 
                                        sx={{ 
                                            bgcolor: alpha(theme.palette.primary.main, 0.1),
                                            color: theme.palette.primary.main,
                                        }} 
                                    />
                                ))}
                            </Box>
                            
                            <Paper elevation={0} sx={{ 
                                p: 3, 
                                mb: 3, 
                                bgcolor: theme.palette.background.paper,
                                borderRadius: 2,
                                maxWidth: 700,
                                mx: 'auto'
                            }}>
                                <Typography 
                                    variant="body1"
                                    sx={{
                                        whiteSpace: 'pre-line',
                                        color: theme.palette.text.primary,
                                        lineHeight: 1.8
                                    }}
                                >
                                    {description}
                                </Typography>
                            </Paper>
                            
                            <Box sx={{ 
                                display: 'flex', 
                                justifyContent: 'center',
                                alignItems: 'center',
                                flexWrap: 'wrap',
                                gap: 2,
                                p: 2,
                                bgcolor: alpha(theme.palette.background.default, 0.6),
                                borderRadius: 2,
                                maxWidth: 700,
                                mx: 'auto'
                            }}>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <Avatar
                                        sx={{ width: 40, height: 40, mr: 1 }}
                                        src={user?.avatar}
                                    >
                                        {user?.fullName?.[0] || 'U'}
                                    </Avatar>
                                    <Box>
                                        <Typography variant="subtitle2">
                                            {user?.fullName || 'Usuário'}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Criado agora
                                        </Typography>
                                    </Box>
                                </Box>
                                
                                <Divider orientation="vertical" flexItem sx={{ height: 30 }} />
                                
                                <Chip
                                    icon={isPublic ? <PublicIcon fontSize="small" /> : <LockOutlinedIcon fontSize="small" />}
                                    label={isPublic ? "Fórum Público" : "Fórum Restrito"}
                                    color={isPublic ? "primary" : "default"}
                                />
                                
                                <Chip
                                    icon={<ForumIcon fontSize="small" />}
                                    label={category}
                                    color="primary"
                                    variant="outlined"
                                />
                                
                                {enableNotifications && (
                                    <Chip
                                        icon={<NotificationsActiveIcon fontSize="small" />}
                                        label="Notificações ativadas"
                                        size="small"
                                        color="success"
                                    />
                                )}
                            </Box>
                        </Box>
                    </Box>
                </Box>
            </Dialog>
        </Box>
    );
};

export default CreateForumForm;
