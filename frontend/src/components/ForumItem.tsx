// components/ForumItem.tsx
import React, { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    Typography,
    Box,
    Chip,
    Avatar,
    useTheme,
    Tooltip,
    IconButton,
    Badge,
    Divider,
    alpha,
    Snackbar,
    Alert,
    CircularProgress,
    Stack,
    ButtonBase,
    AvatarGroup
} from '@mui/material';
import { Forum } from '../types';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import NotificationsOffIcon from '@mui/icons-material/NotificationsOff';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import axios from 'axios';

// URL base da API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

// Interface para os campos que podem existir no objeto User
interface UserWithOptionalFields {
    _id?: string;
    username?: string;
    displayName?: string;
    avatar?: string;
    [key: string]: any; // Permite qualquer outra propriedade
}

// Cores temáticas baseadas nas tags
const getTagColors = (tags: string[]) => {
    if (!tags.length) return { light: '#6B73FF', dark: '#000DFF' };
    // Mapeamento de tags para cores
    const colorMap: Record<string, { light: string, dark: string }> = {
        'tecnologia': { light: '#6B73FF', dark: '#000DFF' },
        'ciência': { light: '#4CAF50', dark: '#2E7D32' },
        'arte': { light: '#FF7043', dark: '#E64A19' },
        'educação': { light: '#26A69A', dark: '#00796B' },
        'negócios': { light: '#5C6BC0', dark: '#3949AB' },
        'saúde': { light: '#EC407A', dark: '#C2185B' },
        'esporte': { light: '#FFA726', dark: '#EF6C00' },
        'política': { light: '#78909C', dark: '#546E7A' },
        'entretenimento': { light: '#AB47BC', dark: '#8E24AA' },
        'meio ambiente': { light: '#66BB6A', dark: '#388E3C' },
    };

    // Encontrar a primeira tag correspondente ou usar cor padrão
    for (const tag of tags) {
        const lowerTag = tag.toLowerCase();
        for (const key in colorMap) {
            if (lowerTag.includes(key)) {
                return colorMap[key];
            }
        }
    }

    // Cor padrão se não encontrar correspondência
    return { light: '#6B73FF', dark: '#000DFF' };
};

// Interface para as props do componente
interface ForumItemProps {
    forum: Forum;
    onViewDetail?: () => void; // Callback para abrir o modal
    onFollowStatusChange?: (forumId: string, isFollowing: boolean) => void; // Para atualizar o estado no componente pai
    onBookmarkStatusChange?: (forumId: string, isBookmarked: boolean) => void; // Para atualizar o estado no componente pai
}

const ForumItem: React.FC<ForumItemProps> = ({
    forum,
    onViewDetail,
    onFollowStatusChange,
    onBookmarkStatusChange
}) => {
    const theme = useTheme();
    const { user } = useAuth();
    const userId = user?._id;
    const [isHovered, setIsHovered] = useState(false);
    const [isFollowing, setIsFollowing] = useState(false);
    const [isBookmarked, setIsBookmarked] = useState(false);
    const [followersCount, setFollowersCount] = useState(forum.followers?.length || 0);
    const [feedbackMessage, setFeedbackMessage] = useState('');
    const [feedbackSeverity, setFeedbackSeverity] = useState<'success' | 'error'>('success');
    const [showFeedback, setShowFeedback] = useState(false);
    const [loadingFollow, setLoadingFollow] = useState(false);
    const [loadingBookmark, setLoadingBookmark] = useState(false);
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Verifica o estado inicial de seguindo e salvos
    useEffect(() => {
        const checkInitialStatus = async () => {
            if (!userId) {
                setInitialLoadComplete(true);
                return;
            }

            try {
                // Verificar status de seguir
                if (forum.followers) {
                    // Verifica se o usuário está na lista de seguidores
                    const isUserFollowing = forum.followers.some(follower => {
                        if (typeof follower === 'string') return follower === userId;
                        // @ts-ignore - assumindo que follower pode ser um objeto com _id
                        return follower._id === userId;
                    });
                    setIsFollowing(isUserFollowing);
                }

                // Verificar status de favorito - URL CORRIGIDA!
                try {
                    const response = await axios.get(`${API_BASE_URL}/api/forums/users/bookmarks/check/${forum._id}`, {
                        withCredentials: true
                    });
                    if (response.data && 'isBookmarked' in response.data) {
                        setIsBookmarked(response.data.isBookmarked);
                    }
                } catch (bookmarkError) {
                    console.warn('Erro ao verificar status do favorito:', bookmarkError);
                    // Fallback para localStorage se a API falhar
                    const savedForums = localStorage.getItem('bookmarkedForums');
                    if (savedForums) {
                        const bookmarks = JSON.parse(savedForums);
                        setIsBookmarked(bookmarks.includes(forum._id));
                    }
                }
            } catch (error) {
                console.error('Erro ao verificar status inicial:', error);
            } finally {
                setInitialLoadComplete(true);
            }
        };

        checkInitialStatus();
    }, [userId, forum._id, forum.followers]);

    // Verifica se é um fórum popular ou ativo
    const isPopular = forum.viewCount > 100 || followersCount > 10;
    const isActive = forum.messageCount > 20;

    // Obtém cores temáticas com base nas tags
    const { light: lightColor, dark: darkColor } = getTagColors(forum.tags);

    // Função mais segura para extrair o nome do usuário
    const getUserDisplayName = () => {
        if (!forum.createdBy) return 'Usuário';
        const user = forum.createdBy as unknown as UserWithOptionalFields;

        if (user.username) return user.username;
        if (user.displayName) return user.displayName;
        if (user._id) return `Usuário ${String(user._id).substring(0, 5)}`;

        return 'Usuário';
    };

    // Função para obter URL do avatar com segurança
    const getAvatarUrl = () => {
        if (!forum.createdBy) return '';
        const user = forum.createdBy as unknown as UserWithOptionalFields;
        return user.avatar || '';
    };

    // Calcula o tempo desde a última atividade
    const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) {
            const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
            if (diffHours === 0) {
                const diffMinutes = Math.floor(diffTime / (1000 * 60));
                return `${diffMinutes} min atrás`;
            }
            return `${diffHours}h atrás`;
        } else if (diffDays < 7) {
            return `${diffDays}d atrás`;
        } else {
            return new Date(dateString).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }
    };

    const truncateDescription = (text: string, maxLength: number) => {
        if (text.length <= maxLength) return text;
        return `${text.substring(0, maxLength)}...`;
    };

    // Manipulador para seguir/deixar de seguir o fórum
    const handleFollowClick = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Impede que o card seja clicado

        if (!userId) {
            showFeedbackMessage('Faça login para seguir este fórum', 'error');
            return;
        }

        setLoadingFollow(true);
        const newFollowingState = !isFollowing;

        try {
            // Atualize o estado otimisticamente para uma UI responsiva
            setIsFollowing(newFollowingState);
            setFollowersCount(prev => newFollowingState ? prev + 1 : Math.max(0, prev - 1));

            // Chamada à API para persistir a alteração
            const response = await axios.post(
                `${API_BASE_URL}/api/forums/${forum._id}/follow`,
                {},
                { withCredentials: true }
            );

            // Verifica se a solicitação foi bem-sucedida
            if (response.data && response.data.success) {
                showFeedbackMessage(
                    newFollowingState
                        ? 'Agora você está seguindo este fórum'
                        : 'Você deixou de seguir este fórum',
                    'success'
                );

                // Notifica o componente pai sobre a mudança
                if (onFollowStatusChange) {
                    onFollowStatusChange(forum._id, newFollowingState);
                }
            } else {
                // Reverte as alterações
                setIsFollowing(!newFollowingState);
                setFollowersCount(prev => !newFollowingState ? prev + 1 : Math.max(0, prev - 1));
                showFeedbackMessage('Erro ao atualizar status de seguidor', 'error');
            }
        } catch (error) {
            console.error('Erro ao seguir/deixar de seguir o fórum:', error);
            // Reverte o estado em caso de erro
            setIsFollowing(!newFollowingState);
            setFollowersCount(prev => !newFollowingState ? prev + 1 : Math.max(0, prev - 1));
            showFeedbackMessage('Erro ao atualizar status de seguidor', 'error');
        } finally {
            setLoadingFollow(false);
        }
    };

    // Manipulador para salvar/remover fórum dos favoritos
    const handleBookmarkClick = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Impede que o card seja clicado

        if (!userId) {
            showFeedbackMessage('Faça login para salvar este fórum', 'error');
            return;
        }

        setLoadingBookmark(true);
        const newBookmarkState = !isBookmarked;

        try {
            // Atualize o estado otimisticamente para uma UI responsiva
            setIsBookmarked(newBookmarkState);

            // Atualiza o localStorage (cache local)
            updateLocalStorage(forum._id, newBookmarkState);

            // Chamada à API para persistir no servidor - URL CORRIGIDA!
            const endpoint = newBookmarkState
                ? `${API_BASE_URL}/api/forums/users/bookmarks/add/${forum._id}`
                : `${API_BASE_URL}/api/forums/users/bookmarks/remove/${forum._id}`;

            const response = await axios.post(endpoint, {}, { withCredentials: true });

            // Verifica se a solicitação foi bem-sucedida
            if (response.data && response.data.success) {
                showFeedbackMessage(
                    newBookmarkState
                        ? 'Fórum salvo com sucesso'
                        : 'Fórum removido dos salvos',
                    'success'
                );

                // Notifica o componente pai sobre a mudança
                if (onBookmarkStatusChange) {
                    onBookmarkStatusChange(forum._id, newBookmarkState);
                }
            } else {
                // Se houver erro na resposta da API, reverte as alterações
                setIsBookmarked(!newBookmarkState);
                updateLocalStorage(forum._id, !newBookmarkState);
                showFeedbackMessage('Erro ao atualizar fóruns salvos', 'error');
            }
        } catch (error) {
            console.error('Erro ao salvar/remover dos favoritos:', error);
            // Em caso de falha na API, mantemos o localStorage atualizado
            // mas informamos o usuário sobre o erro de sincronização
            showFeedbackMessage(
                'Salvo localmente, mas houve um erro ao sincronizar com o servidor',
                'error'
            );
        } finally {
            setLoadingBookmark(false);
        }
    };

    // Função para atualizar o localStorage
    const updateLocalStorage = (forumId: string, isBookmarked: boolean) => {
        try {
            const savedForums = localStorage.getItem('bookmarkedForums');
            let bookmarks: string[] = savedForums ? JSON.parse(savedForums) : [];

            if (isBookmarked) {
                // Adicionar aos salvos
                if (!bookmarks.includes(forumId)) {
                    bookmarks.push(forumId);
                }
            } else {
                // Remover dos salvos
                bookmarks = bookmarks.filter(id => id !== forumId);
            }

            localStorage.setItem('bookmarkedForums', JSON.stringify(bookmarks));
        } catch (error) {
            console.error('Erro ao atualizar localStorage:', error);
        }
    };

    // Função para exibir mensagens de feedback
    const showFeedbackMessage = (message: string, severity: 'success' | 'error') => {
        setFeedbackMessage(message);
        setFeedbackSeverity(severity);
        setShowFeedback(true);

        // Fechar automaticamente após 3 segundos
        setTimeout(() => {
            setShowFeedback(false);
        }, 3000);
    };

    return (
        <>
            <Card
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 3,
                    overflow: 'hidden',
                    position: 'relative',
                    boxShadow: isHovered
                        ? `0 12px 28px rgba(0,0,0,0.12), 0 0 1px 1px ${alpha(lightColor, 0.2)}`
                        : '0 4px 12px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)',
                    '&:hover': {
                        transform: 'translateY(-8px)',
                    },
                }}
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
            >
                {/* Gradiente na borda superior */}
                <Box
                    sx={{
                        height: '6px',
                        background: `linear-gradient(90deg, ${lightColor} 0%, ${darkColor} 100%)`,
                    }}
                />

                {/* Área de clique para todo o card */}
                <ButtonBase
                    onClick={onViewDetail}
                    sx={{
                        display: 'block',
                        textAlign: 'left',
                        width: '100%',
                        p: 0,
                        flexGrow: 1,
                        borderRadius: 0
                    }}
                >
                    <CardContent sx={{ p: 2.5, pb: 1, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        {/* Cabeçalho com ícones de status e ações */}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            {/* Badges para fóruns populares/ativos */}
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {isPopular && (
                                    <Tooltip title="Fórum popular" placement="top" arrow>
                                        <Box
                                            sx={{
                                                backgroundColor: theme.palette.error.main,
                                                color: 'white',
                                                width: 28,
                                                height: 28,
                                                borderRadius: '50%',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                boxShadow: '0 2px 8px rgba(211, 47, 47, 0.25)'
                                            }}
                                        >
                                            <LocalFireDepartmentIcon sx={{ fontSize: 18 }} />
                                        </Box>
                                    </Tooltip>
                                )}
                                {isActive && (
                                    <Tooltip title="Discussão ativa" placement="top" arrow>
                                        <Chip
                                            size="small"
                                            color="success"
                                            label="Ativo"
                                            sx={{
                                                height: 24,
                                                fontWeight: 600,
                                                '& .MuiChip-label': { px: 1, fontSize: '0.7rem' }
                                            }}
                                        />
                                    </Tooltip>
                                )}
                            </Box>

                            {/* Botões de ação: Seguir e Salvar */}
                            {initialLoadComplete && (
                                <Box
                                    sx={{ display: 'flex', gap: 0.5 }}
                                    onClick={(e) => e.stopPropagation()} // Impede propagação
                                >
                                    <Tooltip title={isFollowing ? "Deixar de seguir" : "Seguir fórum"} placement="top">
                                        <span>
                                            <IconButton
                                                size="small"
                                                onClick={handleFollowClick}
                                                disabled={loadingFollow}
                                                sx={{
                                                    color: isFollowing ? 'primary.main' : 'text.secondary',
                                                    backgroundColor: isFollowing ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        transform: 'scale(1.1)',
                                                        backgroundColor: isFollowing
                                                            ? alpha(theme.palette.primary.main, 0.15)
                                                            : alpha(theme.palette.action.hover, 0.8)
                                                    }
                                                }}
                                            >
                                                {loadingFollow ? (
                                                    <CircularProgress size={16} color="inherit" />
                                                ) : (
                                                    <AnimatePresence mode="wait">
                                                        <motion.div
                                                            key={isFollowing ? 'following' : 'not-following'}
                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            exit={{ scale: 0.8, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            {isFollowing ?
                                                                <NotificationsActiveIcon fontSize="small" /> :
                                                                <NotificationsOffIcon fontSize="small" />
                                                            }
                                                        </motion.div>
                                                    </AnimatePresence>
                                                )}
                                            </IconButton>
                                        </span>
                                    </Tooltip>

                                    <Tooltip title={isBookmarked ? "Remover dos salvos" : "Salvar fórum"} placement="top">
                                        <span>
                                            <IconButton
                                                size="small"
                                                onClick={handleBookmarkClick}
                                                disabled={loadingBookmark}
                                                sx={{
                                                    color: isBookmarked ? 'primary.main' : 'text.secondary',
                                                    backgroundColor: isBookmarked ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        transform: 'scale(1.1)',
                                                        backgroundColor: isBookmarked
                                                            ? alpha(theme.palette.primary.main, 0.15)
                                                            : alpha(theme.palette.action.hover, 0.8)
                                                    }
                                                }}
                                            >
                                                {loadingBookmark ? (
                                                    <CircularProgress size={16} color="inherit" />
                                                ) : (
                                                    <AnimatePresence mode="wait">
                                                        <motion.div
                                                            key={isBookmarked ? 'bookmarked' : 'not-bookmarked'}
                                                            initial={{ scale: 0.8, opacity: 0 }}
                                                            animate={{ scale: 1, opacity: 1 }}
                                                            exit={{ scale: 0.8, opacity: 0 }}
                                                            transition={{ duration: 0.2 }}
                                                        >
                                                            {isBookmarked ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
                                                        </motion.div>
                                                    </AnimatePresence>
                                                )}
                                            </IconButton>
                                        </span>
                                    </Tooltip>
                                </Box>
                            )}
                        </Box>

                        {/* Título e avatar */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1.5, mt: 0.5 }}>
                            <Avatar
                                sx={{
                                    bgcolor: alpha(lightColor, 0.85),
                                    color: 'white',
                                    fontWeight: 'bold',
                                    mr: 1.5,
                                    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`
                                }}
                                alt={forum.title}
                            >
                                {forum.title[0].toUpperCase()}
                            </Avatar>

                            <Typography
                                variant="h6"
                                component="div"
                                sx={{
                                    fontWeight: 700,
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                    fontSize: '1.1rem'
                                }}
                            >
                                {forum.title}
                            </Typography>
                        </Box>

                        {/* Tags */}
                        <Box
                            sx={{
                                display: 'flex',
                                flexWrap: 'wrap',
                                gap: 0.7,
                                mb: 1.5,
                            }}
                        >
                            {forum.tags.slice(0, 3).map((tag) => (
                                <Chip
                                    key={tag}
                                    label={tag}
                                    size="small"
                                    sx={{
                                        height: 24,
                                        borderRadius: '4px',
                                        fontWeight: 500,
                                        fontSize: '0.7rem',
                                        backgroundColor: alpha(lightColor, 0.1),
                                        color: darkColor,
                                        '&:hover': {
                                            backgroundColor: alpha(lightColor, 0.2),
                                        }
                                    }}
                                />
                            ))}
                            {forum.tags.length > 3 && (
                                <Chip
                                    label={`+${forum.tags.length - 3}`}
                                    size="small"
                                    variant="outlined"
                                    sx={{ borderRadius: '4px', height: 24, fontSize: '0.7rem', fontWeight: 500 }}
                                />
                            )}
                        </Box>

                        {/* Descrição */}
                        <Typography
                            variant="body2"
                            color="text.secondary"
                            sx={{
                                mb: 2,
                                flexGrow: 1,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                lineHeight: 1.5
                            }}
                        >
                            {truncateDescription(forum.description, 120)}
                        </Typography>

                        {/* Estatísticas simplificadas com ícones */}
                        <Box
                            sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                mt: 'auto',
                                pt: 1,
                                pb: 1,
                                borderTop: `1px solid ${alpha(theme.palette.divider, 0.6)}`
                            }}
                        >
                            {/* Lado esquerdo: estatísticas principais */}
                            <Stack direction="row" spacing={2}>
                                <Tooltip title="Mensagens" arrow>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <ChatBubbleOutlineIcon
                                            fontSize="small"
                                            sx={{ color: theme.palette.text.secondary, fontSize: 18, mr: 0.5 }}
                                        />
                                        <Typography variant="body2" fontWeight={500} color="text.secondary">
                                            {forum.messageCount}
                                        </Typography>
                                    </Box>
                                </Tooltip>

                                <Tooltip title="Seguidores" arrow>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <PeopleAltIcon
                                            fontSize="small"
                                            sx={{ color: theme.palette.text.secondary, fontSize: 18, mr: 0.5 }}
                                        />
                                        <Typography variant="body2" fontWeight={500} color="text.secondary">
                                            {followersCount}
                                        </Typography>
                                    </Box>
                                </Tooltip>

                                <Tooltip title="Visualizações" arrow>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <VisibilityIcon
                                            fontSize="small"
                                            sx={{ color: theme.palette.text.secondary, fontSize: 18, mr: 0.5 }}
                                        />
                                        <Typography variant="body2" fontWeight={500} color="text.secondary">
                                            {forum.viewCount}
                                        </Typography>
                                    </Box>
                                </Tooltip>
                            </Stack>

                            {/* Lado direito: última atividade */}
                            <Tooltip title="Última atividade" arrow>
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    <AccessTimeIcon fontSize="small" sx={{ color: alpha(theme.palette.text.secondary, 0.75), mr: 0.5 }} />
                                    <Typography
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ fontWeight: 500 }}
                                    >
                                        {getTimeAgo(forum.lastActivity)}
                                    </Typography>
                                </Box>
                            </Tooltip>
                        </Box>
                    </CardContent>
                </ButtonBase>

                {/* Rodapé com informação de quem criou */}
                <Box
                    sx={{
                        p: 2,
                        py: 1.5,
                        backgroundColor: alpha(theme.palette.background.default, 0.6),
                        borderTop: `1px solid ${alpha(theme.palette.divider, 0.7)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                            src={getAvatarUrl()}
                            alt={getUserDisplayName()}
                            sx={{ width: 24, height: 24, mr: 1 }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            Por <Box component="span" sx={{ fontWeight: 'bold' }}>{getUserDisplayName()}</Box>
                        </Typography>
                    </Box>

                    {/* Exibir avatares dos participantes ativos (fictício para demonstração) */}
                    {followersCount > 0 && (
                        <AvatarGroup max={3} sx={{ '& .MuiAvatar-root': { width: 22, height: 22, fontSize: '0.75rem' } }}>
                            <Tooltip title="Participantes ativos">
                                <Avatar sx={{ bgcolor: alpha(darkColor, 0.7) }}>
                                    {followersCount}
                                </Avatar>
                            </Tooltip>
                        </AvatarGroup>
                    )}
                </Box>
            </Card>

            {/* Feedback para o usuário */}
            <Snackbar
                open={showFeedback}
                autoHideDuration={3000}
                onClose={() => setShowFeedback(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={() => setShowFeedback(false)}
                    severity={feedbackSeverity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {feedbackMessage}
                </Alert>
            </Snackbar>
        </>
    );
};

export default ForumItem;
