// components/ForumList.tsx
import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
    Typography,
    Box,
    Button,
    Grid,
    Paper,
    LinearProgress,
    useTheme,
    Modal,
    Fade,
    Backdrop,
    Alert,
    Pagination,
    IconButton,
    InputBase,
    Tabs,
    Tab,
    Chip,
    Menu,
    MenuItem,
    Divider,
    Container,
    useMediaQuery,
    Badge,
    Tooltip,
    Zoom,
    Card,
    CardContent,
    Skeleton,
    ToggleButtonGroup,
    ToggleButton,
    Collapse,
    Drawer
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import WhatshotIcon from '@mui/icons-material/Whatshot';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import ViewComfyIcon from '@mui/icons-material/ViewComfy';
import ViewListIcon from '@mui/icons-material/ViewList';
import FormatLineSpacingIcon from '@mui/icons-material/FormatLineSpacing';
import FilterListIcon from '@mui/icons-material/FilterList';
import CheckIcon from '@mui/icons-material/Check';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TravelExploreIcon from '@mui/icons-material/TravelExplore';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import LabelIcon from '@mui/icons-material/Label';
import SortIcon from '@mui/icons-material/Sort';
import ForumIcon from '@mui/icons-material/Forum';
import InsightsIcon from '@mui/icons-material/Insights';
import MessageIcon from '@mui/icons-material/Message';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import TuneIcon from '@mui/icons-material/Tune';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import { useForums } from '../hooks/useForums';
import ForumItem from './ForumItem';
import CreateForumForm from './CreateForumForm';
import ForumDetail from './ForumDetail';
import { motion, AnimatePresence } from 'framer-motion';
import VisibilityIcon from '@mui/icons-material/Visibility';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useAuth } from '../hooks/useAuth';
import PersonIcon from '@mui/icons-material/Person';


// Definindo os tipos de filtro e ordenação
type FilterType = 'all' | 'popular' | 'recent' | 'following' | 'bookmarked' | 'mycreated';
type SortType = 'recent' | 'popular' | 'activity' | 'messages';
type ViewMode = 'grid' | 'list';

const ForumList: React.FC = () => {
    const { forums, loading, error, page, totalPages, fetchForums, refetchForums } = useForums();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedForumId, setSelectedForumId] = useState<string | null>(null);
    const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<FilterType>('all');
    const [sortType, setSortType] = useState<SortType>('recent');
    const [viewMode, setViewMode] = useState<ViewMode>(() => {
        // Recuperar a preferência do usuário do localStorage
        const savedMode = localStorage.getItem('forumViewMode');
        return (savedMode === 'list' ? 'list' : 'grid');
    });
    const [selectedTags, setSelectedTags] = useState<string[]>([]);
    const [showExpandedFilters, setShowExpandedFilters] = useState(false);
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
    const [showTagsMenu, setShowTagsMenu] = useState(false);

    const { user } = useAuth();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    // Ordenar fóruns com base no critério selecionado
    const sortedForums = useMemo(() => {
        let result = [...forums];
        switch (sortType) {
            case 'recent':
                return result.sort((a, b) =>
                    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
                );
            case 'popular':
                return result.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
            case 'activity':
                return result.sort((a, b) =>
                    new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
                );
            case 'messages':
                return result.sort((a, b) => (b.messageCount || 0) - (a.messageCount || 0));
            default:
                return result;
        }
    }, [forums, sortType]);

    // Filtrar fóruns com base no tipo de filtro selecionado
    const filteredByTypeForums = useMemo(() => {
        if (filterType === 'all') return sortedForums;

        if (filterType === 'popular') {
            return sortedForums.filter(forum => forum.viewCount > 50 || forum.followers.length > 5);
        }

        if (filterType === 'recent') {
            return sortedForums.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        }

        if (filterType === 'following' && user) {
            console.log("Aplicando filtro following", { userId: user._id, totalForums: sortedForums.length });

            if (sortedForums.length > 0) {
                console.log("Exemplo de estrutura de fórum:", {
                    id: sortedForums[0]._id,
                    titulo: sortedForums[0].title,
                    seguidores: sortedForums[0].followers,
                    tipo: Array.isArray(sortedForums[0].followers) ? "array" : typeof sortedForums[0].followers
                });
            }

            const filteredForums = sortedForums.filter(forum => {
                // Verificação APENAS para followers
                let isFollower = false;

                if (Array.isArray(forum.followers)) {
                    isFollower = forum.followers.some(follower => {
                        if (typeof follower === 'string') {
                            return follower === user._id;
                        }

                        if (follower && typeof follower === 'object' && '_id' in follower) {
                            return (follower as { _id: string })._id === user._id;
                        }

                        return false;
                    });
                }

                return isFollower; // Apenas seguidores, sem incluir os criados
            });

            console.log(`Encontrados ${filteredForums.length} fóruns que o usuário segue`);
            return filteredForums;
        }

        // NOVO filtro: "mycreated" - para mostrar apenas os fóruns que o usuário criou
        if (filterType === 'mycreated' && user) {
            console.log("Aplicando filtro mycreated", { userId: user._id });

            const filteredForums = sortedForums.filter(forum => {
                // Verifica se o usuário é o criador
                const isCreator = forum.createdBy && (
                    (typeof forum.createdBy === 'string' && forum.createdBy === user._id) ||
                    (typeof forum.createdBy === 'object' && forum.createdBy !== null &&
                        (forum.createdBy as any)._id === user._id) // Usando any para evitar erro de TS
                );

                return isCreator;
            });

            console.log(`Encontrados ${filteredForums.length} fóruns criados pelo usuário`);
            return filteredForums;
        }

        // Para o tipo 'bookmarked', usamos localStorage como fallback
        if (filterType === 'bookmarked' && user) {
            const savedForums = localStorage.getItem('bookmarkedForums');
            if (savedForums) {
                const bookmarkedIds = JSON.parse(savedForums);
                return sortedForums.filter(forum => bookmarkedIds.includes(forum._id));
            }
        }

        return sortedForums;
    }, [sortedForums, filterType, user]);

    // Filtrar por tags selecionadas
    const filteredByTagsForums = useMemo(() => {
        if (selectedTags.length === 0) return filteredByTypeForums;

        return filteredByTypeForums.filter(forum =>
            selectedTags.some(tag => forum.tags.includes(tag))
        );
    }, [filteredByTypeForums, selectedTags]);

    // Filtrar fóruns com base no termo de pesquisa
    const filteredForums = useMemo(() => {
        if (!searchTerm.trim()) return filteredByTagsForums;

        const term = searchTerm.toLowerCase();
        return filteredByTagsForums.filter(forum =>
            forum.title.toLowerCase().includes(term) ||
            forum.description.toLowerCase().includes(term) ||
            forum.tags.some(tag => tag.toLowerCase().includes(term))
        );
    }, [filteredByTagsForums, searchTerm]);

    // Extrair tags únicas de todos os fóruns
    const uniqueTags = useMemo(() => {
        const tagsSet = new Set<string>();
        forums.forEach(forum => {
            forum.tags.forEach(tag => tagsSet.add(tag));
        });
        return Array.from(tagsSet).sort();
    }, [forums]);

    // Selecionar fóruns em destaque
    const featuredForums = useMemo(() => {
        return forums
            .filter(forum => forum.viewCount > 50 || forum.followers.length > 5)
            .sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0))
            .slice(0, 3);
    }, [forums]);

    // Contadores para estatísticas
    const totalForums = forums.length;
    const totalMessages = forums.reduce((sum, forum) => sum + (forum.messageCount || 0), 0);

    // Calcula participantes únicos
    const activeUsers = useMemo(() => {
        const uniqueUsers = new Set<string>();
        // Adiciona criadores
        forums.forEach(forum => {
            // Verificação segura com asserção de tipo
            const creator = forum.createdBy as any;
            if (creator && typeof creator === 'object' && creator._id) {
                uniqueUsers.add(creator._id);
            }
        });
        // Adiciona seguidores com asserção de tipo explícita
        forums.forEach(forum => {
            // Garante que followers é um array
            const followers = Array.isArray(forum.followers) ? forum.followers : [];
            followers.forEach(follower => {
                // Usa asserção de tipo para contornar a limitação do TypeScript
                const typedFollower = follower as any;
                if (typeof typedFollower === 'string') {
                    uniqueUsers.add(typedFollower);
                } else if (typedFollower && typeof typedFollower === 'object' && typedFollower._id) {
                    uniqueUsers.add(typedFollower._id);
                }
            });
        });
        return uniqueUsers.size;
    }, [forums]);

    // Efeito para resetar a página quando o termo de pesquisa, filtro ou ordenação muda
    useEffect(() => {
        if (page !== 1) {
            fetchForums(1);
        }
    }, [searchTerm, filterType, sortType, selectedTags, page, fetchForums]);

    // Handlers para os modais
    const handleOpenModal = useCallback(() => setIsModalOpen(true), []);
    const handleCloseModal = useCallback(() => setIsModalOpen(false), []);

    const handleOpenForumDetail = useCallback((forumId: string) => {
        setSelectedForumId(forumId);
        setIsDetailModalOpen(true);
    }, []);

    const handleCloseForumDetail = useCallback(() => {
        setIsDetailModalOpen(false);
        // Opcional: limpar o ID após um delay para melhorar a animação
        setTimeout(() => setSelectedForumId(null), 300);
    }, []);

    const handlePageChange = useCallback((event: React.ChangeEvent<unknown>, value: number) => {
        fetchForums(value);
    }, [fetchForums]);

    const handleForumCreated = useCallback(() => {
        refetchForums();
        handleCloseModal();
    }, [refetchForums, handleCloseModal]);

    // Handlers para filtros e ordenação
    const handleFilterChange = (filter: FilterType) => {
        setFilterType(filter);
    };

    const handleSortChange = (sort: SortType) => {
        setSortType(sort);
    };

    const handleViewModeChange = (mode: ViewMode) => {
        setViewMode(mode);
        // Salvar preferência do usuário
        localStorage.setItem('forumViewMode', mode);
    };

    const handleTagToggle = (tag: string) => {
        setSelectedTags(prev => {
            if (prev.includes(tag)) {
                return prev.filter(t => t !== tag);
            } else {
                return [...prev, tag];
            }
        });
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setFilterType('all');
        setSortType('recent');
        setSelectedTags([]);
    };

    const toggleExpandedFilters = () => {
        setShowExpandedFilters(prev => !prev);
    };

    // Verifica se existem filtros ativos
    const hasActiveFilters = filterType !== 'all' || sortType !== 'recent' || selectedTags.length > 0 || searchTerm !== '';

    // Estado de carregamento com Skeletons
    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, px: { xs: 2, sm: 3 } }}>
                {/* Cabeçalho */}
                <Box sx={{ mb: 4 }}>
                    <Skeleton variant="rectangular" height={60} sx={{ mb: 2, borderRadius: 2 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Skeleton variant="rectangular" width={200} height={40} sx={{ borderRadius: 2 }} />
                        <Skeleton variant="rectangular" width={150} height={40} sx={{ borderRadius: 2 }} />
                    </Box>
                </Box>
                {/* Skeletons para os cartões */}
                <Grid container spacing={3}>
                    {[1, 2, 3, 4, 5, 6].map((item) => (
                        <Grid item xs={12} sm={6} md={4} key={item}>
                            <Skeleton
                                variant="rectangular"
                                height={220}
                                sx={{
                                    borderRadius: 2,
                                    animation: 'pulse 1.5s ease-in-out 0.5s infinite',
                                    '@keyframes pulse': {
                                        '0%': { opacity: 0.6 },
                                        '50%': { opacity: 1 },
                                        '100%': { opacity: 0.6 }
                                    }
                                }}
                            />
                        </Grid>
                    ))}
                </Grid>
            </Container>
        );
    }

    // Estado de erro
    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 8, textAlign: 'center' }}>
                <Alert
                    severity="error"
                    variant="filled"
                    sx={{
                        borderRadius: 3,
                        boxShadow: '0 4px 20px rgba(211, 47, 47, 0.2)',
                        maxWidth: 600,
                        mx: 'auto',
                        mb: 3,
                        py: 2
                    }}
                >
                    Erro ao carregar fóruns: {error}
                </Alert>
                <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => refetchForums()}
                    sx={{ borderRadius: 2, textTransform: 'none', mt: 2 }}
                >
                    Tentar novamente
                </Button>
            </Container>
        );
    }

    // Função para renderizar o banner do topo
    const renderBanner = () => (
        <Paper
            component={motion.div}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            elevation={0}
            sx={{
                mb: 5,
                p: { xs: 3, md: 4 },
                borderRadius: 3,
                background: 'linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 10px 30px rgba(107, 115, 255, 0.3)'
            }}
        >
            {/* Elementos decorativos de fundo */}
            <Box sx={{
                position: 'absolute',
                top: -30,
                right: -20,
                width: '200px',
                height: '200px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                zIndex: 0
            }} />
            <Box sx={{
                position: 'absolute',
                bottom: -40,
                left: '20%',
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                background: 'rgba(255, 255, 255, 0.1)',
                zIndex: 0
            }} />
            <Box sx={{ position: 'relative', zIndex: 1 }}>
                <Typography
                    variant="h3"
                    sx={{
                        fontWeight: 800,
                        mb: 1,
                        fontSize: { xs: '2rem', sm: '2.5rem', md: '3rem' }
                    }}
                >
                    Fóruns de Brainstorming
                </Typography>
                <Typography
                    variant="body1"
                    sx={{
                        mb: 3,
                        opacity: 0.9,
                        maxWidth: '700px',
                        fontSize: { xs: '0.9rem', sm: '1rem' }
                    }}
                >
                    Explore ideias, compartilhe conhecimentos e colabore com outros membros da comunidade.
                    Participe das discussões ou crie seu próprio fórum para receber feedback.
                </Typography>
                <Box
                    sx={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 3,
                        mt: 3
                    }}
                >
                    <Box
                        component={motion.div}
                        whileHover={{ scale: 1.05 }}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}
                    >
                        <Typography variant="h4" fontWeight="bold">{totalForums}</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>Fóruns</Typography>
                    </Box>
                    <Box
                        component={motion.div}
                        whileHover={{ scale: 1.05 }}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}
                    >
                        <Typography variant="h4" fontWeight="bold">{totalMessages}</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>Mensagens</Typography>
                    </Box>
                    <Box
                        component={motion.div}
                        whileHover={{ scale: 1.05 }}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center'
                        }}
                    >
                        <Typography variant="h4" fontWeight="bold">{activeUsers}</Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8 }}>Participantes</Typography>
                    </Box>
                </Box>
                <Button
                    component={motion.button}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    variant="contained"
                    color="secondary"
                    size="large"
                    startIcon={<AddIcon />}
                    onClick={handleOpenModal}
                    sx={{
                        mt: 4,
                        borderRadius: '50px',
                        textTransform: 'none',
                        px: 4,
                        py: 1.5,
                        backgroundColor: 'white',
                        color: 'primary.main',
                        fontWeight: 600,
                        boxShadow: '0 4px 15px rgba(0, 0, 0, 0.15)',
                        '&:hover': {
                            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)',
                        }
                    }}
                >
                    Criar Novo Fórum
                </Button>
            </Box>
        </Paper>
    );

    // Filtros visuais modernos
    const renderVisualFilters = () => (
        <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            sx={{
                mb: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 2
            }}
        >
            {/* Barra superior com pesquisa e controles de filtro principal */}
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: { xs: 'column', md: 'row' },
                    alignItems: { md: 'center' },
                    gap: 2,
                    justifyContent: 'space-between',
                }}
            >
                {/* Barra de pesquisa */}
                <Paper
                    elevation={0}
                    sx={{
                        display: 'flex',
                        alignItems: 'center',
                        px: 2,
                        py: 0.5,
                        borderRadius: '50px',
                        boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
                        border: '1px solid',
                        borderColor: 'divider',
                        flex: { md: 1 },
                        width: { xs: '100%', md: 'auto' },
                        maxWidth: '100%'
                    }}
                >
                    <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
                    <InputBase
                        placeholder="Pesquisar fóruns..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        sx={{ ml: 1, flex: 1 }}
                    />
                    {searchTerm && (
                        <IconButton
                            size="small"
                            onClick={() => setSearchTerm('')}
                            sx={{ p: '5px' }}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    )}
                </Paper>

                {/* Botões de controle de visualização/filtro */}
                <Box sx={{
                    display: 'flex',
                    gap: 1,
                    flexWrap: { xs: 'wrap', md: 'nowrap' },
                    justifyContent: { xs: 'space-between', md: 'flex-end' },
                    width: { xs: '100%', md: 'auto' }
                }}>
                    {/* Botão de visualização (grade/lista) */}
                    <ToggleButtonGroup
                        value={viewMode}
                        exclusive
                        onChange={(_, newMode) => newMode && handleViewModeChange(newMode)}
                        aria-label="modo de visualização"
                        size="small"
                        sx={{
                            '& .MuiToggleButtonGroup-grouped': {
                                borderRadius: '16px !important',
                                mx: 0.5,
                                border: 0,
                            },
                            bgcolor: 'transparent'
                        }}
                    >
                        <ToggleButton
                            value="grid"
                            aria-label="visualização em grade"
                            sx={{
                                p: '8px',
                                color: viewMode === 'grid' ? 'primary.main' : 'text.secondary',
                                bgcolor: viewMode === 'grid' ? 'action.selected' : 'transparent',
                                '&:hover': { bgcolor: 'action.hover' }
                            }}
                        >
                            <ViewComfyIcon />
                        </ToggleButton>
                        <ToggleButton
                            value="list"
                            aria-label="visualização em lista"
                            sx={{
                                p: '8px',
                                color: viewMode === 'list' ? 'primary.main' : 'text.secondary',
                                bgcolor: viewMode === 'list' ? 'action.selected' : 'transparent',
                                '&:hover': { bgcolor: 'action.hover' }
                            }}
                        >
                            <ViewListIcon />
                        </ToggleButton>
                    </ToggleButtonGroup>

                    {/* Botão para expandir/recolher filtros e mostrar botão mobile */}
                    {isMobile ? (
                        <Button
                            variant="outlined"
                            startIcon={<TuneIcon />}
                            onClick={() => setMobileFiltersOpen(true)}
                            sx={{
                                borderRadius: '20px',
                                textTransform: 'none',
                                fontWeight: 500,
                                borderColor: theme.palette.divider,
                                color: hasActiveFilters ? 'primary.main' : 'text.primary'
                            }}
                        >
                            {hasActiveFilters ? (
                                <Badge badgeContent="" color="primary" variant="dot" sx={{ pr: 1 }}>
                                    Filtros
                                </Badge>
                            ) : (
                                "Filtros"
                            )}
                        </Button>
                    ) : (
                        <Button
                            variant="outlined"
                            endIcon={showExpandedFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                            onClick={toggleExpandedFilters}
                            sx={{
                                borderRadius: '20px',
                                textTransform: 'none',
                                fontWeight: 500,
                                borderColor: theme.palette.divider,
                                color: hasActiveFilters ? 'primary.main' : 'text.primary'
                            }}
                        >
                            {hasActiveFilters ? (
                                <Badge badgeContent="" color="primary" variant="dot" sx={{ pr: 1 }}>
                                    Filtros Avançados
                                </Badge>
                            ) : (
                                "Filtros Avançados"
                            )}
                        </Button>
                    )}
                </Box>
            </Box>

            {/* Botões de filtro rápido */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1, order: { xs: 3, sm: 2 } }}>
                <Button
                    component={motion.button}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    variant={filterType === 'all' ? "contained" : "outlined"}
                    startIcon={<ForumIcon />}
                    size="small"
                    onClick={() => handleFilterChange('all')}
                    sx={{
                        borderRadius: '20px',
                        textTransform: 'none',
                        fontSize: '0.9rem',
                        px: 2,
                        py: 0.8
                    }}
                >
                    Todos os Fóruns
                </Button>

                <Button
                    component={motion.button}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    variant={filterType === 'popular' ? "contained" : "outlined"}
                    startIcon={<WhatshotIcon color={filterType === 'popular' ? "inherit" : "error"} />}
                    size="small"
                    onClick={() => handleFilterChange('popular')}
                    sx={{
                        borderRadius: '20px',
                        textTransform: 'none',
                        fontSize: '0.9rem',
                        px: 2,
                        py: 0.8
                    }}
                >
                    Populares
                </Button>

                <Button
                    component={motion.button}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    variant={filterType === 'recent' ? "contained" : "outlined"}
                    startIcon={<AccessTimeIcon />}
                    size="small"
                    onClick={() => handleFilterChange('recent')}
                    sx={{
                        borderRadius: '20px',
                        textTransform: 'none',
                        fontSize: '0.9rem',
                        px: 2,
                        py: 0.8
                    }}
                >
                    Recentes
                </Button>

                <Button
                    component={motion.button}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    variant={filterType === 'following' ? "contained" : "outlined"}
                    startIcon={<PeopleAltIcon />}
                    size="small"
                    onClick={() => handleFilterChange('following')}
                    disabled={!user}
                    sx={{
                        borderRadius: '20px',
                        textTransform: 'none',
                        fontSize: '0.9rem',
                        px: 2,
                        py: 0.8
                    }}
                >
                    Seguindo
                </Button>

                <Button
                    component={motion.button}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    variant={filterType === 'mycreated' ? "contained" : "outlined"}
                    startIcon={<PersonIcon />} // Importe PersonIcon from '@mui/icons-material/Person';
                    size="small"
                    onClick={() => handleFilterChange('mycreated')}
                    disabled={!user}
                    sx={{
                        borderRadius: '20px',
                        textTransform: 'none',
                        fontSize: '0.9rem',
                        px: 2,
                        py: 0.8
                    }}
                >
                    Meus fóruns
                </Button>


                <Button
                    component={motion.button}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    variant={filterType === 'bookmarked' ? "contained" : "outlined"}
                    startIcon={<BookmarkIcon />}
                    size="small"
                    onClick={() => handleFilterChange('bookmarked')}
                    disabled={!user}
                    sx={{
                        borderRadius: '20px',
                        textTransform: 'none',
                        fontSize: '0.9rem',
                        px: 2,
                        py: 0.8
                    }}
                >
                    Salvos
                </Button>

                {hasActiveFilters && (
                    <Button
                        component={motion.button}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        variant="outlined"
                        startIcon={<ClearAllIcon />}
                        size="small"
                        color="secondary"
                        onClick={clearAllFilters}
                        sx={{
                            borderRadius: '20px',
                            textTransform: 'none',
                            fontSize: '0.9rem',
                            px: 2,
                            py: 0.8,
                            ml: 'auto'
                        }}
                    >
                        Limpar Filtros
                    </Button>
                )}
            </Box>

            {/* Painel de filtros expandido - Desktop */}
            <AnimatePresence>
                {!isMobile && showExpandedFilters && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Paper
                            elevation={0}
                            sx={{
                                p: 3,
                                mt: 2,
                                borderRadius: 3,
                                border: `1px solid ${theme.palette.divider}`,
                                bgcolor: theme.palette.background.paper
                            }}
                        >
                            <Grid container spacing={3}>
                                {/* Ordenação */}
                                <Grid item xs={12} sm={6} md={3}>
                                    <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                                        Ordenar por
                                    </Typography>
                                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                        {[
                                            { value: 'recent', label: 'Mais recentes', icon: <AccessTimeIcon /> },
                                            { value: 'popular', label: 'Mais populares', icon: <VisibilityIcon /> },
                                            { value: 'activity', label: 'Atividade recente', icon: <InsightsIcon /> },
                                            { value: 'messages', label: 'Mais comentados', icon: <MessageIcon /> }
                                        ].map((option) => (
                                            <Button
                                                key={option.value}
                                                variant={sortType === option.value ? 'contained' : 'text'}
                                                color={sortType === option.value ? 'primary' : 'inherit'}
                                                startIcon={option.icon}
                                                size="small"
                                                onClick={() => handleSortChange(option.value as SortType)}
                                                sx={{
                                                    justifyContent: 'flex-start',
                                                    textTransform: 'none',
                                                    py: 1,
                                                    px: 2,
                                                    borderRadius: 2,
                                                    fontWeight: sortType === option.value ? 600 : 400,
                                                    bgcolor: sortType === option.value
                                                        ? 'primary.main'
                                                        : theme.palette.mode === 'dark'
                                                            ? 'rgba(255,255,255,0.05)'
                                                            : 'rgba(0,0,0,0.03)'
                                                }}
                                            >
                                                {option.label}
                                            </Button>
                                        ))}
                                    </Box>
                                </Grid>

                                {/* Tags populares */}
                                <Grid item xs={12} sm={6} md={9}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                        <Typography variant="subtitle2" fontWeight={600}>
                                            Filtrar por tags
                                        </Typography>
                                        {selectedTags.length > 0 && (
                                            <Button
                                                size="small"
                                                color="inherit"
                                                onClick={() => setSelectedTags([])}
                                                sx={{ textTransform: 'none', p: 0 }}
                                            >
                                                Limpar
                                            </Button>
                                        )}
                                    </Box>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                                        {uniqueTags.slice(0, 16).map(tag => (
                                            <Chip
                                                key={tag}
                                                label={tag}
                                                color={selectedTags.includes(tag) ? 'primary' : 'default'}
                                                variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                                                onClick={() => handleTagToggle(tag)}
                                                clickable
                                                sx={{
                                                    borderRadius: '16px',
                                                    transition: 'all 0.2s',
                                                    '&:hover': {
                                                        transform: 'translateY(-2px)',
                                                        boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                                                    }
                                                }}
                                            />
                                        ))}
                                        {uniqueTags.length > 16 && (
                                            <Chip
                                                label={`+ ${uniqueTags.length - 16} tags`}
                                                variant="outlined"
                                                onClick={() => setShowTagsMenu(true)}
                                                clickable
                                                icon={<MoreIcon />}
                                                sx={{ borderRadius: '16px' }}
                                            />
                                        )}
                                    </Box>
                                </Grid>
                            </Grid>
                        </Paper>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Modal de todas as tags */}
            <Modal
                open={showTagsMenu}
                onClose={() => setShowTagsMenu(false)}
                aria-labelledby="tags-modal"
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{ timeout: 500 }}
            >
                <Fade in={showTagsMenu}>
                    <Paper
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: { xs: '90%', sm: '80%', md: '60%' },
                            maxWidth: 700,
                            maxHeight: '80vh',
                            overflowY: 'auto',
                            p: 4,
                            borderRadius: 2
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                            <Typography variant="h6" fontWeight={600}>
                                Todas as tags
                            </Typography>
                            <IconButton onClick={() => setShowTagsMenu(false)}>
                                <CloseIcon />
                            </IconButton>
                        </Box>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                            {uniqueTags.map(tag => (
                                <Chip
                                    key={tag}
                                    label={tag}
                                    color={selectedTags.includes(tag) ? 'primary' : 'default'}
                                    variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                                    onClick={() => handleTagToggle(tag)}
                                    clickable
                                    sx={{ m: 0.5 }}
                                />
                            ))}
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
                            <Button
                                onClick={() => setSelectedTags([])}
                                variant="text"
                            >
                                Limpar seleção
                            </Button>
                            <Button
                                onClick={() => setShowTagsMenu(false)}
                                variant="contained"
                            >
                                Aplicar filtros
                            </Button>
                        </Box>
                    </Paper>
                </Fade>
            </Modal>

            {/* Drawer de filtros para mobile */}
            <Drawer
                anchor="bottom"
                open={mobileFiltersOpen}
                onClose={() => setMobileFiltersOpen(false)}
                PaperProps={{
                    sx: {
                        borderTopLeftRadius: 16,
                        borderTopRightRadius: 16,
                        maxHeight: '90vh'
                    }
                }}
            >
                <Box sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Typography variant="h6" fontWeight={600}>
                            Filtros
                        </Typography>
                        <IconButton onClick={() => setMobileFiltersOpen(false)}>
                            <CloseIcon />
                        </IconButton>
                    </Box>

                    <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 3, mb: 1 }}>
                        Tipos de fórum
                    </Typography>
                    <Grid container spacing={1}>
                        {[
                            { type: 'all', label: 'Todos', icon: <ForumIcon /> },
                            { type: 'popular', label: 'Populares', icon: <WhatshotIcon /> },
                            { type: 'recent', label: 'Recentes', icon: <AccessTimeIcon /> },
                            { type: 'following', label: 'Seguindo', icon: <PeopleAltIcon /> },
                            { type: 'bookmarked', label: 'Salvos', icon: <BookmarkIcon /> }
                        ].map((option) => (
                            <Grid item xs={6} key={option.type}>
                                <Button
                                    fullWidth
                                    variant={filterType === option.type ? 'contained' : 'outlined'}
                                    startIcon={option.icon}
                                    onClick={() => handleFilterChange(option.type as FilterType)}
                                    disabled={
                                        (option.type === 'following' || option.type === 'bookmarked') && !user
                                    }
                                    sx={{
                                        borderRadius: 2,
                                        py: 1,
                                        textTransform: 'none',
                                        justifyContent: 'flex-start'
                                    }}
                                >
                                    {option.label}
                                </Button>
                            </Grid>
                        ))}
                    </Grid>

                    <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 3, mb: 1 }}>
                        Ordenar por
                    </Typography>
                    <Grid container spacing={1}>
                        {[
                            { value: 'recent', label: 'Recentes', icon: <AccessTimeIcon /> },
                            { value: 'popular', label: 'Populares', icon: <VisibilityIcon /> },
                            { value: 'activity', label: 'Atividade', icon: <InsightsIcon /> },
                            { value: 'messages', label: 'Mensagens', icon: <MessageIcon /> }
                        ].map((option) => (
                            <Grid item xs={6} key={option.value}>
                                <Button
                                    fullWidth
                                    variant={sortType === option.value ? 'contained' : 'outlined'}
                                    startIcon={option.icon}
                                    onClick={() => handleSortChange(option.value as SortType)}
                                    sx={{
                                        borderRadius: 2,
                                        py: 1,
                                        textTransform: 'none',
                                        justifyContent: 'flex-start'
                                    }}
                                >
                                    {option.label}
                                </Button>
                            </Grid>
                        ))}
                    </Grid>

                    <Typography variant="subtitle2" fontWeight={600} sx={{ mt: 3, mb: 1 }}>
                        Tags populares
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {uniqueTags.slice(0, 12).map(tag => (
                            <Chip
                                key={tag}
                                label={tag}
                                color={selectedTags.includes(tag) ? 'primary' : 'default'}
                                variant={selectedTags.includes(tag) ? 'filled' : 'outlined'}
                                onClick={() => handleTagToggle(tag)}
                                clickable
                                size="small"
                                sx={{ m: 0.5 }}
                            />
                        ))}
                        {uniqueTags.length > 12 && (
                            <Chip
                                label={`+ ${uniqueTags.length - 12} tags`}
                                variant="outlined"
                                onClick={() => setShowTagsMenu(true)}
                                clickable
                                size="small"
                                sx={{ m: 0.5 }}
                            />
                        )}
                    </Box>

                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
                        <Button
                            variant="outlined"
                            onClick={clearAllFilters}
                            startIcon={<ClearAllIcon />}
                        >
                            Limpar filtros
                        </Button>
                        <Button
                            variant="contained"
                            onClick={() => setMobileFiltersOpen(false)}
                        >
                            Aplicar filtros
                        </Button>
                    </Box>
                </Box>
            </Drawer>
        </Box>
    );

    // Renderizar visualização em grade
    const renderGridView = () => (
        <Grid container spacing={3}>
            {filteredForums.map((forum, index) => (
                <Grid
                    item
                    xs={12}
                    sm={6}
                    md={4}
                    key={forum._id}
                    component={motion.div}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 * (index % 6) }}
                >
                    <Box
                        component={motion.div}
                        whileHover={{ y: -8 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                        sx={{ cursor: 'pointer' }}
                    >
                        <ForumItem
                            forum={forum}
                            onViewDetail={() => handleOpenForumDetail(forum._id)}
                        />
                    </Box>
                </Grid>
            ))}
        </Grid>
    );

    // Renderizar visualização em lista
    const renderListView = () => (
        <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}
        >
            {filteredForums.map((forum, index) => (
                <Card
                    key={forum._id}
                    component={motion.div}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.05 * index }}
                    elevation={0}
                    sx={{
                        display: 'flex',
                        flexDirection: { xs: 'column', sm: 'row' },
                        alignItems: { sm: 'center' },
                        border: `1px solid ${theme.palette.divider}`,
                        borderRadius: 2,
                        overflow: 'hidden',
                        transition: 'all 0.3s ease',
                        '&:hover': {
                            boxShadow: '0 5px 15px rgba(0,0,0,0.08)',
                            borderColor: 'transparent'
                        },
                        cursor: 'pointer'
                    }}
                    onClick={() => handleOpenForumDetail(forum._id)}
                >
                    <Box
                        sx={{
                            width: { sm: '100px' },
                            height: { xs: '80px', sm: '100%' },
                            backgroundColor: theme.palette.primary.main,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}
                    >
                        <Typography variant="h2" sx={{ color: 'white', fontWeight: 'bold' }}>
                            {forum.title.charAt(0).toUpperCase()}
                        </Typography>
                    </Box>
                    <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', p: 3 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                            <Box>
                                <Typography variant="h6" fontWeight="bold" gutterBottom>
                                    {forum.title}
                                </Typography>
                                <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 2, maxWidth: '90%' }}>
                                    {forum.description}
                                </Typography>
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <Tooltip title="Visualizações">
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <VisibilityIcon fontSize="small" color="action" />
                                        <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                                            {forum.viewCount || 0}
                                        </Typography>
                                    </Box>
                                </Tooltip>
                                <Tooltip title="Mensagens">
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <Badge badgeContent={forum.messageCount} color="primary">
                                            <ChatBubbleOutlineIcon fontSize="small" color="action" />
                                        </Badge>
                                    </Box>
                                </Tooltip>
                                <Tooltip title="Seguidores">
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        <PeopleAltIcon fontSize="small" color="action" />
                                        <Typography variant="body2" color="text.secondary" sx={{ ml: 0.5 }}>
                                            {forum.followers.length}
                                        </Typography>
                                    </Box>
                                </Tooltip>
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 'auto' }}>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {forum.tags.slice(0, 3).map(tag => (
                                    <Chip key={tag} label={tag} size="small" />
                                ))}
                                {forum.tags.length > 3 && (
                                    <Chip label={`+${forum.tags.length - 3}`} size="small" />
                                )}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <AccessTimeIcon fontSize="small" color="action" sx={{ mr: 0.5 }} />
                                <Typography variant="caption" color="text.secondary">
                                    {new Date(forum.lastActivity).toLocaleDateString()}
                                </Typography>
                            </Box>
                        </Box>
                    </CardContent>
                </Card>
            ))}
        </Box>
    );

    // Estado vazio
    const renderEmptyState = () => (
        <Paper
            component={motion.div}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            elevation={0}
            sx={{
                p: 5,
                textAlign: 'center',
                bgcolor: theme.palette.background.paper,
                borderRadius: 3,
                border: `1px dashed ${theme.palette.divider}`,
                boxShadow: '0 2px 12px rgba(0,0,0,0.03)'
            }}
        >
            {/* Ícone em vez de imagem para evitar erros */}
            <Box
                sx={{
                    width: '120px',
                    height: '120px',
                    mx: 'auto',
                    mb: 3,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'rgba(0,0,0,0.04)',
                    borderRadius: '50%'
                }}
            >
                <SearchIcon sx={{ fontSize: '4rem', color: 'text.disabled' }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 600, color: theme.palette.text.primary, mb: 1 }}>
                Nenhum fórum encontrado
            </Typography>
            <Typography variant="body1" sx={{ color: theme.palette.text.secondary, mb: 4, maxWidth: '500px', mx: 'auto' }}>
                {searchTerm || selectedTags.length > 0 || filterType !== 'all' ?
                    `Não encontramos fóruns que correspondam aos seus filtros atuais.` :
                    'Seja o primeiro a iniciar uma discussão! Crie um fórum para compartilhar ideias e colaborar com a comunidade.'}
            </Typography>
            <Button
                component={motion.button}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                variant="contained"
                color="primary"
                size="large"
                startIcon={<AddIcon />}
                onClick={handleOpenModal}
                sx={{
                    borderRadius: '50px',
                    textTransform: 'none',
                    px: 4,
                    py: 1.5,
                    fontWeight: 600,
                }}
            >
                Criar Primeiro Fórum
            </Button>
            {hasActiveFilters && (
                <Button
                    variant="text"
                    onClick={clearAllFilters}
                    sx={{ mt: 2, textTransform: 'none' }}
                >
                    Limpar filtros
                </Button>
            )}
        </Paper>
    );

    // Componente principal
    return (
        <Container
            maxWidth="lg"
            sx={{
                py: { xs: 4, md: 6 },
                px: { xs: 2, sm: 3, md: 4 }
            }}
        >
            {/* Banner superior */}
            {renderBanner()}

            {/* Sistema de filtros visual moderno */}
            {renderVisualFilters()}

            {/* Lista principal de fóruns */}
            {filteredForums.length === 0 ? (
                renderEmptyState()
            ) : (
                <Box
                    component={motion.div}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.5 }}
                >
                    {/* Título da seção principal */}
                    <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="h5" fontWeight="bold">
                            {searchTerm
                                ? `Resultados para "${searchTerm}"`
                                : filterType === 'following'
                                    ? 'Fóruns que você segue'
                                    : filterType === 'bookmarked'
                                        ? 'Fóruns salvos'
                                        : filterType === 'popular'
                                            ? 'Fóruns populares'
                                            : filterType === 'recent'
                                                ? 'Fóruns recentes'
                                                : 'Todos os Fóruns'
                            }
                        </Typography>
                        <Chip
                            label={`${filteredForums.length} ${filteredForums.length === 1 ? 'fórum' : 'fóruns'}`}
                            variant="outlined"
                            size="small"
                        />
                    </Box>

                    {/* Renderização condicional baseada no modo de visualização */}
                    {viewMode === 'grid' ? renderGridView() : renderListView()}

                    {/* Paginação */}
                    {totalPages > 1 && (
                        <Box
                            component={motion.div}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.7 }}
                            sx={{
                                display: 'flex',
                                justifyContent: 'center',
                                mt: 6,
                                pt: 3,
                                borderTop: `1px solid ${theme.palette.divider}`
                            }}
                        >
                            <Pagination
                                count={totalPages}
                                page={page}
                                onChange={handlePageChange}
                                color="primary"
                                variant="outlined"
                                shape="rounded"
                                size={isMobile ? "medium" : "large"}
                                siblingCount={isMobile ? 0 : 1}
                            />
                        </Box>
                    )}
                </Box>
            )}

            {/* Modal para criar um novo fórum */}
            <Modal
                open={isModalOpen}
                onClose={handleCloseModal}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500,
                }}
            >
                <Fade in={isModalOpen}>
                    <Box sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: '90%',
                        maxWidth: 600,
                        bgcolor: 'background.paper',
                        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
                        p: 4,
                        borderRadius: 3,
                        outline: 'none',
                    }}>
                        <IconButton
                            aria-label="close"
                            onClick={handleCloseModal}
                            sx={{
                                position: 'absolute',
                                right: 16,
                                top: 16,
                                color: theme.palette.grey[500],
                                bgcolor: 'rgba(255,255,255,0.8)',
                                '&:hover': {
                                    bgcolor: 'rgba(255,255,255,0.95)',
                                    color: theme.palette.grey[800]
                                },
                                zIndex: 1
                            }}
                        >
                            <CloseIcon />
                        </IconButton>
                        <CreateForumForm onClose={handleCloseModal} onForumCreated={handleForumCreated} />
                    </Box>
                </Fade>
            </Modal>

            {/* Modal para visualizar detalhes do fórum */}
            {selectedForumId && (
                <ForumDetail
                    forumId={selectedForumId}
                    open={isDetailModalOpen}
                    onClose={handleCloseForumDetail}
                    isModal={true}
                />
            )}
        </Container>
    );
};

// Ícone de "mais" para o menu de tags
function MoreIcon() {
    return <Box sx={{ fontSize: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>...</Box>;
}

export default ForumList;