import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { styled, useTheme, Theme, CSSObject } from '@mui/material/styles';
import Box from '@mui/material/Box';
import MuiDrawer from '@mui/material/Drawer';
import MuiAppBar, { AppBarProps as MuiAppBarProps } from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import CssBaseline from '@mui/material/CssBaseline';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Avatar from '@mui/material/Avatar';
// Removido Badge que não estava sendo usado
import Tooltip from '@mui/material/Tooltip';
import { Card, CardContent, Grid, Paper, alpha, Chip, ButtonBase, useMediaQuery } from '@mui/material';
import { motion } from 'framer-motion';
// Icons
import PieChartIcon from '@mui/icons-material/PieChart';
import AssignmentIcon from '@mui/icons-material/Assignment';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import InsightsIcon from '@mui/icons-material/Insights';
import BarChartIcon from '@mui/icons-material/BarChart';
import PeopleIcon from '@mui/icons-material/People';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SearchIcon from '@mui/icons-material/Search';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import LockIcon from '@mui/icons-material/Lock';
// Components
import { useAuth } from '../hooks/useAuth';
import UserManagement from './UserManagement';
import TaskMissionManager from './TaskMissionManager/taskMissionManager';
import ForumList from './ForumList';
import { PERMISSIONS } from '../constants/permissions';
// Importar o componente NotificationBell
import NotificationBell from './NotificationBell';

const drawerWidth = 280;

// Estilo do AppBar para empurrar o conteúdo quando o drawer está aberto
interface AppBarProps extends MuiAppBarProps {
  open?: boolean;
}

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})<AppBarProps>(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

interface MenuItem {
  name: string;
  icon: React.ReactElement;
  requiredPermission?: string | string[];
}

// Função auxiliar para obter o nome da função do usuário
const getRoleName = (role: any): string => {
  if (!role) return 'Usuário';
  if (typeof role === 'string') return role;
  if (typeof role === 'object' && role.name) return role.name;
  return 'Usuário';
};

const Dashboard: React.FC = () => {
  const [open, setOpen] = useState(true);
  const [activeItem, setActiveItem] = useState('Resumo');
  const [darkMode, setDarkMode] = useState(false);
  const { isAuthenticated, user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Para fins de depuração - pode ser removido depois
  useEffect(() => {
    if (user) {
      console.log('User role type:', typeof user.role);
      if (typeof user.role === 'object') {
        console.log('User role object:', user.role);
      }
    }
  }, [user]);

  // Verificar se é mobile e fechar drawer automaticamente
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [isMobile]);

  // Definição dos itens do menu com as permissões requeridas
  const menuItems: MenuItem[] = [
    { name: 'Resumo', icon: <PieChartIcon /> }, // Acessível para todos
    {
      name: 'Gestão de Tarefas e Missões',
      icon: <AssignmentIcon />,
      requiredPermission: PERMISSIONS.TASKS_VIEW
    },
    {
      name: 'Brainstorming',
      icon: <EmojiObjectsIcon />,
      requiredPermission: PERMISSIONS.FORUM_VIEW
    },
    {
      name: 'Insights e Produtividade',
      icon: <InsightsIcon />,
      requiredPermission: PERMISSIONS.REPORTS_VIEW
    },
    {
      name: 'Indicadores',
      icon: <BarChartIcon />,
      requiredPermission: PERMISSIONS.REPORTS_VIEW
    },
    {
      name: 'Gerenciar Usuários',
      icon: <PeopleIcon />,
      requiredPermission: PERMISSIONS.USERS_VIEW
    },
    {
      name: 'Configurações e Segurança',
      icon: <SettingsIcon />,
      requiredPermission: PERMISSIONS.SETTINGS_VIEW
    },
  ];

  // Filtrar os itens do menu com base nas permissões do usuário
  const filteredMenuItems = menuItems.filter(item =>
    !item.requiredPermission || hasPermission(item.requiredPermission)
  );

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Efetuar redirecionamento se não estiver autenticado
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
    } else if (activeItem !== 'Resumo') {
      // Verificar se o usuário tem permissão para o item ativo atual
      const currentItem = menuItems.find(item => item.name === activeItem);
      if (currentItem?.requiredPermission && !hasPermission(currentItem.requiredPermission)) {
        // Se não tiver permissão, voltar para o resumo
        setActiveItem('Resumo');
      }
    }
  }, [isAuthenticated, activeItem, hasPermission, navigate, menuItems]);

  if (!isAuthenticated || !user) {
    return null; // Não renderizar nada se não estiver autenticado
  }

  const renderContent = () => {
    switch (activeItem) {
      case 'Gestão de Tarefas e Missões':
        // Verificar permissão antes de renderizar
        return hasPermission(PERMISSIONS.TASKS_VIEW) ? (
          <TaskMissionManager />
        ) : (
          <AccessDenied />
        );
      case 'Brainstorming':
        return hasPermission(PERMISSIONS.FORUM_VIEW) ? (
          <Box>
            <ForumList />
          </Box>
        ) : (
          <AccessDenied />
        );
      case 'Gerenciar Usuários':
        return hasPermission(PERMISSIONS.USERS_VIEW) ? (
          <UserManagement />
        ) : (
          <AccessDenied />
        );
      case 'Resumo':
        return <DashboardOverview user={user} />;
      default:
        // Para outros itens, verificar permissão genérica
        const currentItem = menuItems.find(item => item.name === activeItem);
        if (currentItem?.requiredPermission && !hasPermission(currentItem.requiredPermission)) {
          return <AccessDenied />;
        }
        return (
          <Box sx={{ textAlign: 'center', py: 8, color: 'text.secondary' }}>
            <Typography variant="h5" gutterBottom>
              {activeItem}
            </Typography>
            <Typography variant="body1">
              Esta seção está em desenvolvimento.
            </Typography>
          </Box>
        );
    }
  };

  // Obter o nome da função do usuário
  const roleName = getRoleName(user.role);

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        open={open}
        elevation={0}
        sx={{
          backgroundColor: darkMode ? 'rgb(26, 32, 39)' : 'white',
          color: darkMode ? 'white' : 'text.primary',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.2)}`
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{
              marginRight: 2,
            }}
          >
            <MenuIcon />
          </IconButton>
          {/* Área do logo e título */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Typography
              variant="h6"
              noWrap
              component="div"
              sx={{
                fontWeight: 600,
                background: 'linear-gradient(45deg, #6B73FF 30%, #000DFF 90%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                display: { xs: 'none', sm: 'block' }
              }}
            >
              SynapseS
            </Typography>
          </Box>
          {/* Barra de pesquisa */}
          <Paper
            component="form"
            elevation={0}
            sx={{
              ml: 4,
              mr: 2,
              flexGrow: 1,
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              px: 2,
              py: 0.5,
              maxWidth: 600,
              border: `1px solid ${alpha(theme.palette.divider, 0.2)}`,
              backgroundColor: darkMode ? alpha(theme.palette.background.default, 0.6) : alpha('#f5f5f5', 0.8),
              borderRadius: 2
            }}
          >
            <SearchIcon sx={{ color: 'text.secondary', mr: 1 }} />
            <input
              placeholder="Pesquisar..."
              style={{
                border: 'none',
                outline: 'none',
                width: '100%',
                backgroundColor: 'transparent',
                color: darkMode ? theme.palette.text.primary : 'inherit',
                fontSize: '0.9rem'
              }}
            />
          </Paper>
          {/* Ícones de Ação */}
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton color="inherit" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
            {/* Substituir o ícone estático pelo componente NotificationBell */}
            <NotificationBell />
            <Tooltip title={user.fullName || 'Usuário'}>
              <IconButton sx={{ ml: 1 }}>
                <Avatar
                  alt={user.fullName || ''}
                  sx={{
                    width: 32,
                    height: 32,
                    border: `2px solid ${theme.palette.primary.main}`
                  }}
                >
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : ''}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>
      <Drawer variant="permanent" open={open}>
        <DrawerHeader>
          <Box sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            px: 2,
            py: 1
          }}>
            {open && (
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar
                  alt={user.fullName || ''}
                  sx={{ width: 40, height: 40, mr: 1.5 }}
                >
                  {user.fullName ? user.fullName.charAt(0).toUpperCase() : (
                    user.username ? user.username.charAt(0).toUpperCase() : ''
                  )}
                </Avatar>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                    {user.fullName?.split(' ')[0] || user.username || 'Usuário'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {roleName}
                  </Typography>
                </Box>
              </Box>
            )}
            <IconButton onClick={handleDrawerToggle}>
              {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Box>
        </DrawerHeader>
        <Divider />
        <List sx={{ px: 1, pt: 1 }}>
          {/* Listar apenas os itens para os quais o usuário tem permissão */}
          {filteredMenuItems.map((item) => (
            <ListItem key={item.name} disablePadding sx={{ display: 'block', mb: 0.5 }}>
              <ListItemButton
                onClick={() => setActiveItem(item.name)}
                selected={activeItem === item.name}
                sx={{
                  minHeight: 48,
                  justifyContent: open ? 'initial' : 'center',
                  px: 2.5,
                  borderRadius: '8px',
                  '&.Mui-selected': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
                    '&:hover': {
                      bgcolor: (theme) => alpha(theme.palette.primary.main, 0.25),
                    },
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: open ? 2 : 'auto',
                    justifyContent: 'center',
                    color: activeItem === item.name ? 'primary.main' : 'text.secondary',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.name}
                  sx={{
                    opacity: open ? 1 : 0,
                    '& .MuiTypography-root': {
                      fontWeight: activeItem === item.name ? 600 : 400,
                      fontSize: '0.9rem',
                    }
                  }}
                />
                {activeItem === item.name && open && (
                  <div style={{
                    width: 4,
                    height: 20,
                    backgroundColor: theme.palette.primary.main,
                    borderRadius: 2,
                    marginLeft: 8
                  }} />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box sx={{ flexGrow: 1 }} />
        {/* Exibir papel e permissões se o drawer estiver aberto */}
        {open && (
          <>
            <Divider />
            <Box sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                Seu papel: {roleName}
              </Typography>
              {user.permissions && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
                    Permissões: {user.permissions.length}
                  </Typography>
                  <Box sx={{ mt: 1, display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {user.permissions.slice(0, 3).map((perm: string, idx: number) => (
                      <Chip
                        key={idx}
                        label={perm.split(':')[1]}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.6rem' }}
                      />
                    ))}
                    {user.permissions.length > 3 && (
                      <Chip
                        label={`+${user.permissions.length - 3}`}
                        size="small"
                        variant="outlined"
                        sx={{ fontSize: '0.6rem' }}
                      />
                    )}
                  </Box>
                </Box>
              )}
            </Box>
          </>
        )}
        <Divider />
        <List sx={{ px: 1, py: 1 }}>
          <ListItem disablePadding>
            <ListItemButton
              onClick={handleLogout}
              sx={{
                minHeight: 48,
                justifyContent: open ? 'initial' : 'center',
                px: 2.5,
                borderRadius: '8px',
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 0,
                  mr: open ? 2 : 'auto',
                  justifyContent: 'center',
                  color: 'text.secondary'
                }}
              >
                <LogoutIcon />
              </ListItemIcon>
              <ListItemText
                primary="Sair"
                sx={{
                  opacity: open ? 1 : 0,
                  '& .MuiTypography-root': { fontSize: '0.9rem' }
                }}
              />
            </ListItemButton>
          </ListItem>
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          bgcolor: darkMode ? 'rgb(17, 24, 39)' : '#f5f7fa',
          color: darkMode ? 'white' : 'inherit',
          minHeight: '100vh',
          transition: 'background-color 0.3s',
          overflow: 'auto'
        }}
      >
        <DrawerHeader />
        {/* Breadcrumb e título */}
        <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography
              component={motion.div}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              variant="h4"
              gutterBottom
              sx={{ fontWeight: 700, color: darkMode ? 'white' : 'text.primary' }}
            >
              {activeItem}
            </Typography>
            <Breadcrumb activeItem={activeItem} />
          </Box>
          {activeItem === 'Resumo' && (
            <Chip
              label="Última atualização: Hoje"
              size="small"
              color="primary"
              variant="outlined"
              icon={<InsightsIcon sx={{ fontSize: '0.9rem', mr: -0.5 }} />}
              sx={{ fontWeight: 500 }}
            />
          )}
        </Box>
        {/* Conteúdo principal */}
        <Box
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
        >
          {renderContent()}
        </Box>
      </Box>
    </Box>
  );
};

// Componente para exibir quando o acesso é negado
const AccessDenied: React.FC = () => {
  return (
    <Box
      sx={{
        textAlign: 'center',
        py: 8,
        color: 'text.secondary',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 2
      }}
    >
      <LockIcon sx={{ fontSize: 60, color: 'error.main', opacity: 0.7 }} />
      <Typography variant="h5" gutterBottom color="error.main">
        Acesso Negado
      </Typography>
      <Typography variant="body1">
        Você não tem permissão para acessar este recurso.
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500, mt: 1 }}>
        Se você acredita que deveria ter acesso a esta funcionalidade,
        entre em contato com o administrador do sistema.
      </Typography>
    </Box>
  );
};

// Componente de breadcrumb
const Breadcrumb: React.FC<{ activeItem: string }> = ({ activeItem }) => {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', fontSize: '0.85rem' }}>
      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
        Dashboard
        <span style={{ margin: '0 8px', fontSize: '10px' }}>•</span>
        <span style={{ fontWeight: 500 }}>{activeItem}</span>
      </Typography>
    </Box>
  );
};

// Componente de visão geral do dashboard
const DashboardOverview: React.FC<{ user: any }> = ({ user }) => {
  const theme = useTheme();
  // Dados fictícios para os cartões de estatísticas
  const stats = [
    {
      title: 'Tarefas Concluídas',
      value: '24',
      change: '+12%',
      positive: true,
      color: theme.palette.primary.main,
      icon: <AssignmentIcon fontSize="large" />
    },
    {
      title: 'Discussões',
      value: '13',
      change: '+5%',
      positive: true,
      color: theme.palette.success.main,
      icon: <EmojiObjectsIcon fontSize="large" />
    },
    {
      title: 'Produtividade',
      value: '87%',
      change: '-2%',
      positive: false,
      color: theme.palette.warning.main,
      icon: <InsightsIcon fontSize="large" />
    },
    {
      title: 'Projetos Ativos',
      value: '6',
      change: '0%',
      positive: true,
      color: theme.palette.info.main,
      icon: <BarChartIcon fontSize="large" />
    },
  ];
  return (
    <Grid container spacing={3}>
      {/* Cartões de estatísticas */}
      {stats.map((stat, index) => (
        <Grid item xs={12} sm={6} md={3} key={index}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            <Card
              elevation={0}
              sx={{
                borderRadius: 3,
                height: '100%',
                position: 'relative',
                overflow: 'hidden',
                transition: 'transform 0.3s, box-shadow 0.3s',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                },
                border: `1px solid ${alpha(theme.palette.divider, 0.1)}`
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box>
                    <Typography color="text.secondary" fontSize="0.875rem" fontWeight={500}>
                      {stat.title}
                    </Typography>
                    <Typography variant="h4" component="div" sx={{ fontWeight: 700, my: 1 }}>
                      {stat.value}
                    </Typography>
                    <Chip
                      label={stat.change}
                      size="small"
                      sx={{
                        backgroundColor: stat.positive ? alpha(theme.palette.success.main, 0.1) : alpha(theme.palette.error.main, 0.1),
                        color: stat.positive ? theme.palette.success.main : theme.palette.error.main,
                        fontWeight: 600,
                        fontSize: '0.75rem'
                      }}
                    />
                  </Box>
                  <Box
                    sx={{
                      p: 1.5,
                      bgcolor: alpha(stat.color, 0.1),
                      borderRadius: 2,
                      color: stat.color
                    }}
                  >
                    {stat.icon}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        </Grid>
      ))}
      {/* Tarefas recentes */}
      <Grid item xs={12} md={6}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Card elevation={0} sx={{ borderRadius: 3, height: '100%', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>Tarefas Recentes</Typography>
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              {/* Lista de tarefas de exemplo */}
              {[
                { title: 'Finalizar reunião de brainstorming', status: 'Em progresso', priority: 'Alta' },
                { title: 'Revisar apresentação do projeto', status: 'Pendente', priority: 'Média' },
                { title: 'Criar nova documentação', status: 'Concluída', priority: 'Baixa' },
              ].map((task, index) => (
                <ButtonBase
                  key={index}
                  sx={{
                    display: 'flex',
                    width: '100%',
                    textAlign: 'left',
                    borderRadius: 2,
                    mb: 1,
                    p: 1.5,
                    transition: 'background-color 0.2s',
                    '&:hover': {
                      bgcolor: alpha(theme.palette.action.hover, 0.7)
                    }
                  }}
                >
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                    <Box>
                      <Typography variant="body2" fontWeight={500}>{task.title}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Prioridade: {task.priority}
                      </Typography>
                    </Box>
                    <Chip
                      label={task.status}
                      size="small"
                      color={
                        task.status === 'Concluída' ? 'success' :
                          task.status === 'Em progresso' ? 'primary' : 'default'
                      }
                      sx={{ fontWeight: 500, fontSize: '0.75rem' }}
                    />
                  </Box>
                </ButtonBase>
              ))}
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <ButtonBase
                  sx={{
                    py: 1,
                    px: 2,
                    borderRadius: 2,
                    color: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    fontWeight: 500,
                    fontSize: '0.875rem'
                  }}
                >
                  Ver todas as tarefas
                </ButtonBase>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>
      {/* Discussões recentes */}
      <Grid item xs={12} md={6}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
        >
          <Card elevation={0} sx={{ borderRadius: 3, height: '100%', border: `1px solid ${alpha(theme.palette.divider, 0.1)}` }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="h6" fontWeight={600}>Discussões Recentes</Typography>
                <IconButton size="small">
                  <MoreVertIcon fontSize="small" />
                </IconButton>
              </Box>
              {/* Lista de discussões de exemplo */}
              {[
                { title: 'Novas ideias para o projeto X', author: 'Carlos Silva', comments: 8, time: '2h atrás' },
                { title: 'Melhorias no sistema de autenticação', author: 'Ana Santos', comments: 3, time: '5h atrás' },
                { title: 'Proposta de novo design', author: 'Rodrigo Lima', comments: 12, time: 'ontem' },
              ].map((discussion, index) => (
                <Box
                  key={index}
                  sx={{
                    p: 1.5,
                    mb: 1,
                    borderRadius: 2,
                    '&:hover': {
                      bgcolor: alpha(theme.palette.action.hover, 0.7)
                    }
                  }}
                >
                  <Typography variant="body2" fontWeight={500}>
                    {discussion.title}
                  </Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">
                      Por: {discussion.author}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary" sx={{ mr: 1 }}>
                        {discussion.comments} comentários
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {discussion.time}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              ))}
              <Box sx={{ mt: 2, textAlign: 'center' }}>
                <ButtonBase
                  sx={{
                    py: 1,
                    px: 2,
                    borderRadius: 2,
                    color: theme.palette.primary.main,
                    bgcolor: alpha(theme.palette.primary.main, 0.1),
                    fontWeight: 500,
                    fontSize: '0.875rem'
                  }}
                >
                  Ver todas as discussões
                </ButtonBase>
              </Box>
            </CardContent>
          </Card>
        </motion.div>
      </Grid>
    </Grid>
  );
};

export default Dashboard;
