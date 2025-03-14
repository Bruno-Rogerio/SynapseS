// src/components/ForumDetail.tsx
import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Dialog,
    DialogContent,
    Paper,
    Box,
    Typography,
    Chip,
    Button,
    CircularProgress,
    Stack,
    Grid,
    IconButton,
    Avatar,
    Container,
    useTheme,
    useMediaQuery,
    Slide,
    Fade,
    Tooltip,
    Badge,
    Tabs,
    Tab,
    Divider,
    AvatarGroup
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleIcon from '@mui/icons-material/People';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import ShareIcon from '@mui/icons-material/Share';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ThumbUpOutlinedIcon from '@mui/icons-material/ThumbUpOutlined';
import TagIcon from '@mui/icons-material/Tag';
import { TransitionProps } from '@mui/material/transitions';
import axios from 'axios';
import ForumChat from './ForumChat';
import { Forum } from '../types';
import { useAuth } from '../hooks/useAuth';

interface ForumDetailProps {
    forumId?: string;
    open?: boolean;
    onClose?: () => void;
    isModal?: boolean;
}

const Transition = React.forwardRef(function Transition(
    props: TransitionProps & {
        children: React.ReactElement;
    },
    ref: React.Ref<unknown>,
) {
    return <Slide direction="up" ref={ref} {...props} />;
});

const ForumDetail: React.FC<ForumDetailProps> = ({
    forumId: propForumId,
    open = false,
    onClose,
    isModal = false
}) => {
    const [forum, setForum] = useState<Forum | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tabValue, setTabValue] = useState(0);
    const { user } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));
    // Refs para rolagem
    const dialogContentRef = useRef<HTMLDivElement>(null);
    const chatSectionRef = useRef<HTMLDivElement>(null);
    const headerRef = useRef<HTMLDivElement>(null);
    // Para modo de rota
    const { id: paramId } = useParams<{ id: string }>();
    const navigate = useNavigate();
    // Use o ID da prop ou do parâmetro da URL
    const id = propForumId || paramId;
    // Determinar se estamos no modo modal ou de página
    const isModalMode = isModal || Boolean(propForumId && onClose);

    // Fazer scroll ao topo quando o modal abre
    useEffect(() => {
        if (open && dialogContentRef.current) {
            setTimeout(() => {
                if (dialogContentRef.current) {
                    dialogContentRef.current.scrollTop = 0;
                }
            }, 100);
        }
    }, [open]);

    useEffect(() => {
        const fetchForumDetails = async () => {
            if (!id) {
                setError('ID do fórum não fornecido');
                setLoading(false);
                return;
            }
            setLoading(true);
            setError(null);
            try {
                const forumResponse = await axios.get<Forum>(
                    `${import.meta.env.VITE_API_BASE_URL}/api/forums/${id}`,
                    { withCredentials: true }
                );
                setForum(forumResponse.data);
                // Adicione um pequeno delay para simular carga e mostrar as animações
                setTimeout(() => {
                    setLoading(false);
                    // Scroll para o topo após o carregamento
                    if (dialogContentRef.current) {
                        dialogContentRef.current.scrollTop = 0;
                    }
                }, 300);
            } catch (err) {
                console.error('Erro ao carregar detalhes do fórum:', err);
                if (axios.isAxiosError(err)) {
                    setError(err.response?.data?.message || 'Erro ao carregar detalhes do fórum');
                } else {
                    setError('Erro desconhecido ao carregar detalhes do fórum');
                }
                setLoading(false);
            }
        };
        if (!isModalMode || (isModalMode && open)) {
            fetchForumDetails();
        }
    }, [id, open, isModalMode]);

    const handleGoBack = () => {
        if (isModalMode && onClose) {
            onClose();
        } else {
            navigate('/forums');
        }
    };

    const handleLogin = () => {
        if (isModalMode && onClose) {
            onClose();
        }
        navigate('/login', { state: { from: `/forums/${id}` } });
    };

    // Handle tab change with scroll to sections
    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
        // Rolar automaticamente para a seção correspondente
        if (newValue === 0 && chatSectionRef.current) {
            setTimeout(() => {
                chatSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }, 100);
        }
    };

    // Função para rolar para o chat quando o botão "Discussão" for clicado
    const scrollToChat = () => {
        setTabValue(0);
        setTimeout(() => {
            chatSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    };

    // Função para obter a cor de fundo do banner baseada no título
    const getBannerGradient = (title?: string) => {
        if (!title) return 'linear-gradient(135deg, #4776E6 0%, #8E54E9 100%)';
        // Use a primeira letra do título para determinar a cor
        const firstChar = title.charCodeAt(0) % 5;
        const gradients = [
            'linear-gradient(135deg, #4776E6 0%, #8E54E9 100%)', // Azul para roxo
            'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', // Verde
            'linear-gradient(135deg, #FF416C 0%, #FF4B2B 100%)', // Vermelho
            'linear-gradient(135deg, #f46b45 0%, #eea849 100%)', // Laranja
            'linear-gradient(135deg, #009FFD 0%, #2A2A72 100%)' // Azul escuro
        ];
        return gradients[firstChar];
    };

    // Gera iniciais para avatar baseado em um ID ou usuário
    const getInitials = (id: any) => {
        // Se temos um objeto de usuário completo com username
        if (typeof id === 'object' && id !== null) {
            if (id.username) {
                // Usar as iniciais do nome de usuário (primeira letra)
                return id.username.charAt(0).toUpperCase();
            }
            if ('_id' in id) {
                // Se for um objeto com propriedade _id
                // Não use os caracteares do ID, use uma inicial genérica
                return 'U'; // U de Usuário
            }
        }
        // Se for uma string (ID), não use os caracteres do ID
        if (typeof id === 'string') {
            return 'U'; // U de Usuário
        }
        // Fallback para um valor padrão
        return '?';
    };

    // Gera uma cor para avatar baseada no ID
    const getAvatarColor = (id: any) => {
        const colors = [
            '#1976d2', '#388e3c', '#d32f2f', '#f57c00',
            '#7b1fa2', '#0288d1', '#c2185b', '#303f9f'
        ];
        // Garantir que temos uma string para trabalhar
        let idString: string;
        // Verificar o tipo do id recebido
        if (typeof id === 'string') {
            idString = id;
        } else if (typeof id === 'object' && id !== null && '_id' in id) {
            // Se for um objeto com propriedade _id
            idString = id._id;
        } else {
            // Fallback para um valor padrão se o id não for string nem objeto com _id
            return colors[0]; // Retorna a primeira cor como fallback
        }
        // Use um hash simples do ID para escolher uma cor
        const hash = idString.split('').reduce((a, b) => {
            return a + b.charCodeAt(0);
        }, 0);
        return colors[hash % colors.length];
    };

    const renderLoading = () => (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minHeight: '400px'
        }}>
            <CircularProgress
                size={60}
                thickness={4}
                sx={{
                    color: theme.palette.primary.main,
                    mb: 2
                }}
            />
            <Typography variant="body1" color="text.secondary" sx={{ mt: 2 }}>
                Carregando fórum...
            </Typography>
        </Box>
    );

    const renderError = () => (
        <Box sx={{
            p: 4,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh'
        }}>
            <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" color="error" gutterBottom>
                {error}
            </Typography>
            <Button
                variant="contained"
                onClick={handleGoBack}
                sx={{
                    mt: 3,
                    borderRadius: 4,
                    px: 4
                }}
            >
                {isModalMode ? 'Fechar' : 'Voltar para a lista de fóruns'}
            </Button>
        </Box>
    );

    const renderNotFound = () => (
        <Box sx={{
            p: 4,
            textAlign: 'center',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '60vh'
        }}>
            <ErrorOutlineIcon color="warning" sx={{ fontSize: 60, mb: 2 }} />
            <Typography variant="h6" gutterBottom>
                Fórum não encontrado
            </Typography>
            <Button
                variant="contained"
                onClick={handleGoBack}
                sx={{
                    mt: 3,
                    borderRadius: 4,
                    px: 4
                }}
            >
                {isModalMode ? 'Fechar' : 'Voltar para a lista de fóruns'}
            </Button>
        </Box>
    );

    const renderForumHeader = () => {
        if (!forum) return null;
        return (
            <Box
                ref={headerRef}
                sx={{
                    position: 'relative',
                    borderRadius: { xs: '16px', md: '20px' },
                    overflow: 'hidden',
                    mb: 3,
                    boxShadow: '0 6px 20px rgba(0,0,0,0.07)',
                    scrollMarginTop: '16px',
                }}
            >
                {/* Banner superior com gradiente */}
                <Box
                    sx={{
                        background: getBannerGradient(forum.title),
                        height: { xs: '120px', md: '160px' },
                        display: 'flex',
                        alignItems: 'flex-end',
                        p: 3,
                        position: 'relative',
                    }}
                >
                    <Fade in={true} timeout={600}>
                        <Box sx={{ position: 'relative', zIndex: 5, width: '100%' }}>
                            <Typography
                                variant="h3"
                                component="h1"
                                sx={{
                                    color: 'white',
                                    textShadow: '0 2px 10px rgba(0,0,0,0.2)',
                                    fontWeight: 700,
                                    fontSize: { xs: '1.8rem', md: '2.5rem' },
                                    mb: 1,
                                    maxWidth: '80%'
                                }}
                            >
                                {forum.title}
                            </Typography>
                        </Box>
                    </Fade>
                    {/* Avatar do criador do fórum */}
                    <Fade in={true} timeout={800}>
                        <Box
                            sx={{
                                position: 'absolute',
                                bottom: '-35px',
                                right: { xs: '20px', md: '30px' },
                                display: 'flex',
                                gap: 2,
                                justifyContent: 'flex-end',
                            }}
                        >
                            <Avatar
                                // Uso de type assertion e fallback para compatibilidade
                                src={(forum.createdBy as any).avatar || undefined}
                                sx={{
                                    width: 70,
                                    height: 70,
                                    border: '4px solid white',
                                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                                }}
                            >
                                {forum.createdBy.username?.[0] || 'U'}
                            </Avatar>
                        </Box>
                    </Fade>
                </Box>
                {/* Conteúdo principal do card do fórum */}
                <Paper
                    elevation={0}
                    sx={{
                        p: 3,
                        pt: 4,
                        borderRadius: '0 0 20px 20px',
                        backgroundColor: '#fff',
                        position: 'relative',
                    }}
                >
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Fade in={true} timeout={900}>
                                <Box>
                                    <Typography
                                        variant="body1"
                                        sx={{
                                            color: 'text.secondary',
                                            fontSize: '1.05rem',
                                            mb: 2,
                                            lineHeight: 1.6
                                        }}
                                    >
                                        {forum.description}
                                    </Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                        <TagIcon
                                            sx={{
                                                fontSize: 20,
                                                color: theme.palette.primary.main,
                                                mr: 1,
                                                opacity: 0.9
                                            }}
                                        />
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                                            {forum.tags.map((tag) => (
                                                <Chip
                                                    key={tag}
                                                    label={tag}
                                                    size="small"
                                                    sx={{
                                                        borderRadius: '6px',
                                                        fontWeight: 500,
                                                        fontSize: '0.8rem',
                                                        background: theme.palette.primary.light,
                                                        color: theme.palette.primary.contrastText,
                                                        '&:hover': {
                                                            background: theme.palette.primary.main,
                                                        },
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                />
                                            ))}
                                        </Box>
                                    </Box>
                                </Box>
                            </Fade>
                        </Grid>
                        <Grid item xs={12} md={4}>
                            <Fade in={true} timeout={1000}>
                                <Stack spacing={1.5}>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <PersonIcon
                                            fontSize="small"
                                            sx={{ color: theme.palette.secondary.main, mr: 1 }}
                                        />
                                        <Typography variant="body2">
                                            Criado por <strong>{forum.createdBy.username}</strong>
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <AccessTimeIcon
                                            fontSize="small"
                                            sx={{ color: theme.palette.info.main, mr: 1 }}
                                        />
                                        <Typography variant="body2">
                                            Última atividade {new Date(forum.lastActivity).toLocaleDateString()} às {new Date(forum.lastActivity).toLocaleTimeString().substring(0, 5)}
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <PeopleIcon
                                            fontSize="small"
                                            sx={{ color: theme.palette.success.main, mr: 1 }}
                                        />
                                        <Typography variant="body2">
                                            <strong>{forum.followers.length}</strong> seguidores
                                        </Typography>
                                    </Box>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <VisibilityIcon
                                            fontSize="small"
                                            sx={{ color: theme.palette.primary.main, mr: 1 }}
                                        />
                                        <Typography variant="body2">
                                            <strong>{forum.viewCount || 0}</strong> visualizações
                                        </Typography>
                                    </Box>
                                    {/* Renderização dos avatares de seguidores */}
                                    {!isTablet && forum.followers.length > 0 && (
                                        <AvatarGroup max={5} sx={{ mt: 2 }}>
                                            {forum.followers.slice(0, 5).map((follower, index) => (
                                                <Tooltip key={index} title={`Seguidor ${index + 1}`}>
                                                    <Avatar
                                                        sx={{
                                                            bgcolor: getAvatarColor(follower)
                                                        }}
                                                    >
                                                        {getInitials(follower)}
                                                    </Avatar>
                                                </Tooltip>
                                            ))}
                                        </AvatarGroup>
                                    )}
                                </Stack>
                            </Fade>
                        </Grid>
                    </Grid>
                    {/* Ações do fórum */}
                    <Fade in={true} timeout={1100}>
                        <Box sx={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            mt: 3,
                            pt: 2,
                            borderTop: `1px solid ${theme.palette.divider}`,
                        }}>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                <Tooltip title="Curtir">
                                    <IconButton color="primary" size="small">
                                        <ThumbUpOutlinedIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Salvar">
                                    <IconButton color="primary" size="small">
                                        <BookmarkBorderIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Compartilhar">
                                    <IconButton color="primary" size="small">
                                        <ShareIcon fontSize="small" />
                                    </IconButton>
                                </Tooltip>
                            </Box>
                            {!isMobile && (
                                <Badge
                                    badgeContent={forum.messageCount || 0}
                                    color="primary"
                                    max={999}
                                    sx={{ '& .MuiBadge-badge': { fontSize: '0.7rem' } }}
                                >
                                    <Button
                                        variant="text"
                                        color="primary"
                                        size="small"
                                        startIcon={<ChatBubbleOutlineIcon fontSize="small" />}
                                        onClick={scrollToChat}
                                        sx={{ textTransform: 'none' }}
                                    >
                                        Discussão
                                    </Button>
                                </Badge>
                            )}
                        </Box>
                    </Fade>
                </Paper>
            </Box>
        );
    };

    const renderContent = () => {
        if (loading) return renderLoading();
        if (error) return renderError();
        if (!forum) return renderNotFound();
        return (
            <Fade in={true} timeout={500}>
                <Box sx={{ overflow: 'hidden' }}>
                    {/* Botão de navegação (apenas no modo de página) */}
                    {!isModalMode && (
                        <Button
                            variant="outlined"
                            onClick={() => navigate(-1)}
                            sx={{ mb: 3 }}
                        >
                            Voltar
                        </Button>
                    )}
                    {/* Cabeçalho do fórum */}
                    {renderForumHeader()}
                    {/* Abas para diferentes seções */}
                    <Box sx={{ mb: 2 }}>
                        <Tabs
                            value={tabValue}
                            onChange={handleTabChange}
                            variant={isMobile ? "fullWidth" : "standard"}
                            sx={{
                                '& .MuiTab-root': {
                                    textTransform: 'none',
                                    minWidth: isMobile ? 'auto' : 120,
                                    fontWeight: 500,
                                },
                                '& .Mui-selected': {
                                    fontWeight: 700
                                },
                                borderBottom: `1px solid ${theme.palette.divider}`
                            }}
                        >
                            <Tab
                                label={
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <ChatBubbleOutlineIcon fontSize="small" sx={{ mr: 0.5 }} />
                                        Discussão
                                    </Box>
                                }
                            />
                            {!isMobile && <Tab label="Informações" />}
                            {!isMobile && <Tab label="Membros" />}
                        </Tabs>
                    </Box>
                    {/* Conteúdo da aba selecionada */}
                    <Box sx={{ mt: 3 }}>
                        {tabValue === 0 && (
                            <Paper
                                ref={chatSectionRef}
                                elevation={0}
                                sx={{
                                    p: { xs: 2, sm: 3 },
                                    height: { xs: '320px', sm: '380px', md: '450px' },
                                    display: 'flex',
                                    flexDirection: 'column',
                                    backgroundColor: 'background.paper',
                                    borderRadius: '16px',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                    overflow: 'hidden',
                                    scrollMarginTop: '16px',
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            fontWeight: 600,
                                            color: theme.palette.text.primary,
                                            fontSize: { xs: '1.1rem', sm: '1.25rem' }
                                        }}
                                    >
                                        Discussão
                                    </Typography>
                                    {!user && (
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            size="small"
                                            disableElevation
                                            sx={{
                                                borderRadius: '20px',
                                                textTransform: 'none',
                                                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
                                                px: 2
                                            }}
                                            onClick={handleLogin}
                                        >
                                            Fazer Login
                                        </Button>
                                    )}
                                </Box>
                                <Divider sx={{ mb: 2 }} />
                                <Box sx={{
                                    flexGrow: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    overflow: 'hidden', // Importante para o container do chat
                                }}>
                                    {user ? (
                                        // Estilizando o componente ForumChat para permitir rolagem
                                        <Box sx={{
                                            flexGrow: 1,
                                            display: 'flex',
                                            flexDirection: 'column',
                                            overflow: 'hidden' // Importante para o chat
                                        }}>
                                            <ForumChat forumId={id!} currentUser={user} />
                                        </Box>
                                    ) : (
                                        <Box
                                            sx={{
                                                flexGrow: 1,
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                backgroundColor: 'rgba(0,0,0,0.02)',
                                                borderRadius: 2,
                                                p: 3,
                                                textAlign: 'center'
                                            }}
                                        >
                                            <ChatBubbleOutlineIcon
                                                sx={{
                                                    fontSize: 40,
                                                    color: theme.palette.action.disabled,
                                                    mb: 2
                                                }}
                                            />
                                            <Typography variant="body1" color="text.secondary" gutterBottom>
                                                Faça login para participar da discussão
                                            </Typography>
                                            <Typography variant="body2" color="text.secondary">
                                                Compartilhe suas ideias e colabore com outros participantes
                                            </Typography>
                                        </Box>
                                    )}
                                </Box>
                            </Paper>
                        )}
                        {tabValue === 1 && (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    minHeight: '400px',
                                    borderRadius: '16px',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                <Typography variant="h6" gutterBottom>
                                    Informações do Fórum
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={3}>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Descrição
                                        </Typography>
                                        <Typography variant="body2" paragraph>
                                            {forum.description}
                                        </Typography>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Tags
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.8 }}>
                                            {forum.tags.map((tag) => (
                                                <Chip key={tag} label={tag} size="small" />
                                            ))}
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12} md={6}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Estatísticas
                                        </Typography>
                                        <Box sx={{ mb: 2 }}>
                                            <Typography variant="body2">
                                                Criado em: {new Date(forum.createdAt).toLocaleDateString()}
                                            </Typography>
                                            <Typography variant="body2">
                                                Mensagens: {forum.messageCount || 0}
                                            </Typography>
                                            <Typography variant="body2">
                                                Visualizações: {forum.viewCount || 0}
                                            </Typography>
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Paper>
                        )}
                        {tabValue === 2 && (
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    minHeight: '400px',
                                    borderRadius: '16px',
                                    border: '1px solid',
                                    borderColor: 'divider',
                                }}
                            >
                                <Typography variant="h6" gutterBottom>
                                    Membros do Fórum
                                </Typography>
                                <Divider sx={{ mb: 2 }} />
                                <Grid container spacing={2}>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" gutterBottom>
                                            Criado por
                                        </Typography>
                                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                                            <Avatar
                                                // Uso de type assertion e fallback para compatibilidade
                                                src={(forum.createdBy as any).avatar || undefined}
                                                sx={{ mr: 1, width: 40, height: 40 }}
                                            >
                                                {forum.createdBy.username?.[0] || 'U'}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="body2" fontWeight="bold">
                                                    {forum.createdBy.username}
                                                </Typography>
                                                <Typography variant="caption" color="text.secondary">
                                                    {forum.createdBy.role || 'Membro'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Grid>
                                    <Grid item xs={12}>
                                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
                                            Seguidores ({forum.followers.length})
                                        </Typography>
                                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                            {/* Renderização dos avatares de seguidores (corrigida) */}
                                            {forum.followers.map((follower, index) => (
                                                <Tooltip key={index} title={`Seguidor ${index + 1}`}>
                                                    <Avatar
                                                        sx={{
                                                            width: 40,
                                                            height: 40,
                                                            bgcolor: getAvatarColor(follower)
                                                        }}
                                                    >
                                                        {getInitials(follower)}
                                                    </Avatar>
                                                </Tooltip>
                                            ))}
                                        </Box>
                                    </Grid>
                                </Grid>
                            </Paper>
                        )}
                    </Box>
                </Box>
            </Fade>
        );
    };

    // Renderização como modal
    if (isModalMode) {
        return (
            <Dialog
                open={Boolean(open)}
                onClose={onClose}
                fullWidth
                maxWidth="md"
                TransitionComponent={Transition}
                PaperProps={{
                    sx: {
                        borderRadius: { xs: 2, sm: 3 },
                        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                        overflow: { xs: 'hidden', sm: 'visible' },
                        background: theme.palette.background.default,
                        maxHeight: '90vh',
                        m: { xs: 1, sm: 2 }
                    }
                }}
            >
                {/* Botão de fechar (X) */}
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 12,
                        top: 12,
                        color: 'white',
                        zIndex: 20,
                        bgcolor: 'rgba(0,0,0,0.3)',
                        '&:hover': {
                            bgcolor: 'rgba(0,0,0,0.5)',
                            transform: 'scale(1.1)'
                        },
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
                    }}
                >
                    <CloseIcon />
                </IconButton>
                <DialogContent
                    ref={dialogContentRef}
                    sx={{
                        p: { xs: 2, sm: 3 },
                        pb: { xs: 3, sm: 4 },
                        pt: { xs: 2, sm: 2 },
                        overflowY: 'auto', // Garante que o conteúdo tenha scroll
                        maxHeight: '80vh', // Define uma altura máxima para garantir o scroll
                        scrollBehavior: 'smooth', // Rolagem suave
                    }}
                >
                    {renderContent()}
                </DialogContent>
            </Dialog>
        );
    }

    // Renderização como página
    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 6, px: { xs: 2, sm: 3 } }}>
            {renderContent()}
        </Container>
    );
};

export default ForumDetail;
