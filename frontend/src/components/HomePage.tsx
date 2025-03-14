import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  CardContent,
  Button,
  Box,
  IconButton,
  Dialog,
  DialogContent,
  DialogTitle,
  Tabs,
  Tab,
  Drawer,
  List,
  ListItem,
  ListItemText,
  useTheme,
  alpha,
  useMediaQuery,
  Avatar,
  Chip,
  Divider,
  Paper,
  Stack,
  ListItemIcon
} from '@mui/material';
import { styled } from '@mui/material/styles';
import {
  Menu as MenuIcon,
  Close as CloseIcon,
  ArrowForward,
  CheckCircleOutline,
  Assessment,
  Psychology,
  Speed,
  Group,
  Security,
  CloudSync,
  FormatQuote,
  Business,
  TrendingUp,
  GitHub,
  Twitter,
  LinkedIn,
  Brightness4,
  Settings,
  BarChart,
  Timeline,
  NetworkCheck,
  Storage,
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import Logo from './Logo';
import LoginForm from './LoginForm';
import CompanyAndAdminRegistrationForm from './CompanyAndAdminRegistrationForm';
// Componentes com Motion integrado
const MotionBox = styled(Box)(({ theme }) => ({}));
const MotionTypography = styled(Typography)(({ theme }) => ({}));
const MotionContainer = styled(Container)(({ theme }) => ({}));
// AppBar estilizado
const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'transparent',
  boxShadow: 'none',
  transition: 'all 0.3s ease',
  backdropFilter: 'none',
  '&.scrolled': {
    background: alpha(theme.palette.background.paper, 0.85),
    backdropFilter: 'blur(10px)',
    borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
    boxShadow: theme.shadows[4],
  },
}));
const GradientButton = styled(Button)(({ theme }) => ({
  background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
  border: 0,
  borderRadius: 50,
  boxShadow: '0 3px 15px 2px rgba(33, 150, 243, 0.3)',
  color: theme.palette.common.white,
  padding: '10px 30px',
  transition: 'all 0.3s',
  '&:hover': {
    boxShadow: '0 6px 20px 2px rgba(33, 150, 243, 0.4)',
    transform: 'translateY(-2px)',
  },
}));
const FeatureCard = styled(Paper)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  borderRadius: theme.shape.borderRadius * 2,
  background: alpha(theme.palette.background.paper, 0.8),
  backdropFilter: 'blur(10px)',
  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.05)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  overflow: 'hidden',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
}));
const TestimonialCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  height: '100%',
  borderRadius: theme.shape.borderRadius * 3,
  background: theme.palette.mode === 'dark'
    ? `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.4)}, ${alpha(theme.palette.background.paper, 0.2)})`
    : `linear-gradient(145deg, ${alpha(theme.palette.background.paper, 0.7)}, ${alpha(theme.palette.background.paper, 0.9)})`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '4px',
    background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
  }
}));
const StatsCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(3),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  borderRadius: theme.shape.borderRadius * 2,
  background: alpha(theme.palette.background.paper, 0.6),
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
  height: '100%',
}));
const GlowingDot = styled('div')(({ theme }) => ({
  width: 8,
  height: 8,
  borderRadius: '50%',
  backgroundColor: theme.palette.success.main,
  boxShadow: `0 0 10px ${theme.palette.success.main}`,
  animation: 'pulse 1.5s infinite',
  '@keyframes pulse': {
    '0%': {
      boxShadow: `0 0 0 0 ${alpha(theme.palette.success.main, 0.7)}`,
    },
    '70%': {
      boxShadow: `0 0 0 10px ${alpha(theme.palette.success.main, 0)}`,
    },
    '100%': {
      boxShadow: `0 0 0 0 ${alpha(theme.palette.success.main, 0)}`,
    },
  },
}));
// Componente HomePage
const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  const { isAuthenticated, user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);
  const featuresRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setIsScrolled(offset > 30);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveFeature(prev => (prev + 1) % features.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);
  const handleLoginSuccess = () => {
    setOpenDialog(false);
    navigate('/dashboard');
  };
  const scrollTo = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };
  const handleStartNow = () => {
    setTabValue(1);
    setOpenDialog(true);
  };
  // Dados
  const features = [
    {
      title: 'Gestão de Conhecimento',
      description: 'Centralize, organize e acesse o conhecimento da empresa de forma eficiente.',
      icon: <Psychology fontSize="large" />,
      color: theme.palette.primary.main
    },
    {
      title: 'Colaboração em Tempo Real',
      description: 'Trabalhe em equipe com edição colaborativa e comunicação integrada.',
      icon: <Group fontSize="large" />,
      color: theme.palette.secondary.main
    },
    {
      title: 'Visualização de Dados',
      description: 'Transforme dados complexos em visualizações claras e acionáveis.',
      icon: <Assessment fontSize="large" />,
      color: theme.palette.success.main
    },
    {
      title: 'Automação de Processos',
      description: 'Automatize fluxos de trabalho repetitivos e aumente a produtividade.',
      icon: <Speed fontSize="large" />,
      color: theme.palette.warning.main
    },
    {
      title: 'Segurança Avançada',
      description: 'Proteja seus dados com criptografia e controles de acesso granulares.',
      icon: <Security fontSize="large" />,
      color: theme.palette.info.main
    },
    {
      title: 'Integração com APIs',
      description: 'Conecte facilmente com suas ferramentas favoritas através de APIs robustas.',
      icon: <CloudSync fontSize="large" />,
      color: theme.palette.error.main
    }
  ];
  const testimonials = [
    {
      name: 'Ana Silva',
      position: 'CTO, TechCorp',
      avatar: '/avatars/ana.jpg',
      quote: 'O SynapseS transformou completamente nossa gestão de conhecimento. A produtividade da equipe aumentou em 35%.',
    },
    {
      name: 'João Martins',
      position: 'Gerente de Projetos, Inova',
      avatar: '/avatars/joao.jpg',
      quote: 'Simples de usar e incrivelmente poderoso. Conseguimos reduzir o tempo de integração de novos funcionários em 50%.',
    },
    {
      name: 'Carla Mendes',
      position: 'CEO, StartupX',
      avatar: '/avatars/carla.jpg',
      quote: 'SynapseS é um diferencial competitivo para nossa empresa. A colaboração em tempo real mudou nossa forma de trabalhar.',
    }
  ];
  const stats = [
    { value: '98%', label: 'Satisfação de clientes', icon: <CheckCircleOutline fontSize="large" color="success" /> },
    { value: '+45%', label: 'Produtividade média', icon: <TrendingUp fontSize="large" color="primary" /> },
    { value: '+5000', label: 'Empresas usuárias', icon: <Business fontSize="large" color="secondary" /> },
    { value: '-35%', label: 'Tempo em reuniões', icon: <Speed fontSize="large" color="warning" /> }
  ];
  const menuItems = [
    { label: 'Início', id: 'home' },
    { label: 'Funcionalidades', id: 'features' },
    { label: 'Depoimentos', id: 'testimonials' },
    { label: 'Resultados', id: 'results' },
    { label: 'FAQ', id: 'faq' },
  ];
  const faqItems = [
    {
      question: 'O que é o SynapseS?',
      answer: 'SynapseS é uma plataforma completa de gestão de conhecimento e produtividade para empresas de todos os tamanhos. Ela centraliza informações, facilita a colaboração e potencializa a inovação através de ferramentas inteligentes.'
    },
    {
      question: 'Como funciona o período de teste?',
      answer: 'Oferecemos um período de teste gratuito de 30 dias com todas as funcionalidades disponíveis. Não é necessário cartão de crédito para começar. Após o período, você pode escolher o plano que melhor atende às suas necessidades.'
    },
    {
      question: 'A plataforma é segura?',
      answer: 'Absolutamente. Utilizamos criptografia de ponta a ponta, autenticação de dois fatores e mantemos nossos servidores com as melhores práticas de segurança. Todos os dados são armazenados de forma segura e em conformidade com leis de proteção de dados como GDPR e LGPD.'
    },
    {
      question: 'É possível integrar com outros sistemas?',
      answer: 'Sim, o SynapseS oferece integrações nativas com ferramentas populares como Slack, Microsoft Teams, Google Workspace, Jira, Trello e muitas outras. Também disponibilizamos uma API completa para integrações personalizadas.'
    },
  ];
  if (isAuthenticated && user) {
    return null;
  }
  return (
    <>
      {/* Navbar */}
      <StyledAppBar
        position="fixed"
        className={isScrolled ? 'scrolled' : ''}
        elevation={0}
      >
        <Box
          component={motion.div}
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <Toolbar sx={{ py: 1 }}>
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2, display: { md: 'none' } }}
              onClick={() => setMobileMenuOpen(true)}
            >
              <MenuIcon />
            </IconButton>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Logo />
              <Box
                component={motion.div}
                animate={{ opacity: 1, x: 0 }}
                initial={{ opacity: 0, x: -20 }}
                sx={{
                  ml: 1,
                  display: 'flex',
                  alignItems: 'center',
                  '& .MuiTypography-root': {
                    mr: 1
                  },
                  '& .live-indicator': {
                    display: 'flex',
                    alignItems: 'center',
                    pl: 1
                  }
                }}
              >
                <Typography variant="h6" color="primary" sx={{ fontWeight: 600 }}>
                  SynapseS
                </Typography>
                <Chip
                  size="small"
                  label="Beta"
                  color="secondary"
                  sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.65rem' } }}
                />
                <Box className="live-indicator" sx={{ display: { xs: 'none', sm: 'flex' } }}>
                  <GlowingDot />
                  <Typography variant="caption" sx={{ ml: 0.5, color: theme.palette.success.main, fontWeight: 500 }}>
                    ONLINE
                  </Typography>
                </Box>
              </Box>
            </Box>
            <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
              {menuItems.map((item) => (
                <Button
                  key={item.id}
                  color="inherit"
                  onClick={() => scrollTo(item.id)}
                  sx={{
                    mx: 0.5,
                    px: 2,
                    fontSize: '0.95rem',
                    position: 'relative',
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      bottom: 8,
                      left: '50%',
                      width: 5,
                      height: 5,
                      backgroundColor: 'transparent',
                      borderRadius: '50%',
                      transform: 'translateX(-50%)',
                      transition: 'all 0.2s',
                    },
                    '&:hover::after': {
                      backgroundColor: theme.palette.primary.main,
                    }
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Button
                color="inherit"
                variant="text"
                onClick={() => {
                  setTabValue(0);
                  setOpenDialog(true);
                }}
                sx={{
                  borderRadius: 50,
                  px: 2,
                  display: { xs: 'none', sm: 'flex' }
                }}
              >
                Login
              </Button>
              <Box component={motion.div} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleStartNow}
                  sx={{
                    borderRadius: 50,
                    px: { xs: 2, sm: 3 },
                    boxShadow: 4
                  }}
                >
                  Comece Grátis
                </Button>
              </Box>
            </Box>
          </Toolbar>
        </Box>
      </StyledAppBar>
      {/* Menu Mobile */}
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            borderRadius: '0 20px 20px 0',
            background: alpha(theme.palette.background.paper, 0.95),
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        <Box sx={{ width: 280 }} role="presentation">
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            py: 2,
            borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Logo />
              <Typography variant="h6" sx={{ ml: 1, fontWeight: 600 }}>
                SynapseS
              </Typography>
            </Box>
            <IconButton onClick={() => setMobileMenuOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <List sx={{ pt: 1 }}>
            {menuItems.map((item) => (
              <ListItem
                key={item.id}
                onClick={() => scrollTo(item.id)}
                sx={{ py: 1.5 }}
              >
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{ fontSize: '1.1rem' }}
                />
              </ListItem>
            ))}
            <Divider sx={{ my: 2, opacity: 0.5 }} />
            <ListItem
              onClick={() => {
                setOpenDialog(true);
                setTabValue(0);
                setMobileMenuOpen(false);
              }}
            >
              <ListItemText primary="Login" />
            </ListItem>
            <ListItem>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                onClick={() => {
                  handleStartNow();
                  setMobileMenuOpen(false);
                }}
                sx={{ borderRadius: 50, py: 1.2 }}
              >
                Comece Grátis
              </Button>
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <main>
        {/* Hero Section */}
        <Box
          id="home"
          component={motion.div}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          sx={{
            position: 'relative',
            overflow: 'hidden',
            pt: { xs: 12, sm: 18, md: 22 },
            pb: { xs: 8, sm: 10, md: 16 },
            background: theme.palette.mode === 'dark'
              ? `linear-gradient(180deg, ${alpha(theme.palette.primary.dark, 0.2)} 0%, ${alpha(theme.palette.background.default, 0.1)} 100%)`
              : `linear-gradient(180deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.background.default, 0.1)} 100%)`,
          }}
        >
          {/* Background decoration */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              height: '100%',
              overflow: 'hidden',
              zIndex: 0,
              opacity: 0.6,
              pointerEvents: 'none'
            }}
          >
            <Box
              component={motion.div}
              animate={{
                backgroundPosition: ['0% 0%', '100% 100%'],
              }}
              transition={{
                repeat: Infinity,
                repeatType: 'reverse',
                duration: 30,
              }}
              sx={{
                position: 'absolute',
                top: '-50%',
                left: '-50%',
                width: '200%',
                height: '200%',
                backgroundImage: `radial-gradient(circle at 30% 80%, ${alpha(theme.palette.primary.main, 0.1)} 0%, transparent 20%),
                                radial-gradient(circle at 70% 20%, ${alpha(theme.palette.secondary.main, 0.08)} 0%, transparent 20%)`,
                backgroundSize: '80% 80%',
                transform: 'rotate(-15deg)',
              }}
            />
            <svg
              width="100%"
              height="100%"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              style={{ position: 'absolute', bottom: 0, fill: theme.palette.background.default }}
            >
              <path d="M0,70 C40,120 60,30 100,70 L100,100 0,100 Z" />
            </svg>
          </Box>
          <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={6}>
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.8, delay: 0.2 }}
                >
                  <Typography
                    component="h1"
                    variant="h2"
                    color="textPrimary"
                    gutterBottom
                    sx={{
                      fontWeight: 800,
                      fontSize: { xs: '2.5rem', md: '3.5rem' },
                      backgroundImage: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      backgroundClip: 'text',
                      textFillColor: 'transparent',
                      mb: 2,
                    }}
                  >
                    Potencialize sua<br />
                    Inteligência Coletiva
                  </Typography>
                  <Typography
                    variant="h5"
                    color="textSecondary"
                    paragraph
                    sx={{
                      maxWidth: 600,
                      fontSize: { xs: '1.1rem', md: '1.25rem' },
                      mb: 4
                    }}
                  >
                    SynapseS é a plataforma que transforma conhecimento em poder, conectando pessoas e
                    ideias para criar resultados surpreendentes.
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                    <Box component={motion.div} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <GradientButton
                        size="large"
                        onClick={handleStartNow}
                        endIcon={<ArrowForward />}
                      >
                        Comece Grátis
                      </GradientButton>
                    </Box>
                    <Button
                      variant="outlined"
                      color="primary"
                      size="large"
                      onClick={() => scrollTo('features')}
                      sx={{ borderRadius: 50, px: 3 }}
                    >
                      Saiba Mais
                    </Button>
                  </Box>
                  <Box sx={{ mt: 4, display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleOutline sx={{ color: theme.palette.success.main, mr: 1, fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={500}>Teste gratuito de 30 dias</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleOutline sx={{ color: theme.palette.success.main, mr: 1, fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={500}>Sem necessidade de cartão</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <CheckCircleOutline sx={{ color: theme.palette.success.main, mr: 1, fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={500}>Suporte 24/7</Typography>
                    </Box>
                  </Box>
                </Box>
              </Grid>
              <Grid item xs={12} md={6} sx={{ position: 'relative' }}>
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.8, delay: 0.4 }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      height: { xs: 300, sm: 400, md: 480 },
                      mx: 'auto',
                      maxWidth: 600
                    }}
                  >
                    {/* Visualização - Pode ser substituída por uma imagem real do produto */}
                    <Paper
                      elevation={8}
                      sx={{
                        position: 'absolute',
                        top: '10%',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: '90%',
                        height: '80%',
                        borderRadius: 4,
                        overflow: 'hidden',
                        border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
                        backgroundImage: `url('/dashboard-preview.jpg')`, // Substitua por uma imagem real da sua UI
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        zIndex: 2,
                      }}
                    >
                      {/* Fallback para quando não tem imagem */}
                      <Box
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          width: '100%',
                          height: '100%',
                          background: `linear-gradient(45deg, ${alpha(theme.palette.primary.dark, 0.9)}, ${alpha(theme.palette.secondary.dark, 0.9)})`,
                          display: 'flex',
                          flexDirection: 'column',
                          padding: 3,
                        }}
                      >
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="h6" color={theme.palette.common.white} sx={{ mb: 1 }}>Dashboard SynapseS</Typography>
                          <Box sx={{ height: 6, width: 80, bgcolor: alpha(theme.palette.common.white, 0.3), borderRadius: 3 }} />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                          <Box sx={{ flex: 1, height: 40, bgcolor: alpha(theme.palette.common.white, 0.1), borderRadius: 1 }} />
                          <Box sx={{ flex: 1, height: 40, bgcolor: alpha(theme.palette.common.white, 0.1), borderRadius: 1 }} />
                          <Box sx={{ flex: 1, height: 40, bgcolor: alpha(theme.palette.common.white, 0.1), borderRadius: 1 }} />
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, mb: 3, flex: 1 }}>
                          <Box sx={{ flex: 2, bgcolor: alpha(theme.palette.common.white, 0.1), borderRadius: 1, p: 2 }}>
                            <Box sx={{ height: 20, width: 120, bgcolor: alpha(theme.palette.common.white, 0.2), borderRadius: 1, mb: 2 }} />
                            <Box sx={{ height: 10, width: '80%', bgcolor: alpha(theme.palette.common.white, 0.1), borderRadius: 1, mb: 1 }} />
                            <Box sx={{ height: 10, width: '60%', bgcolor: alpha(theme.palette.common.white, 0.1), borderRadius: 1, mb: 1 }} />
                            <Box sx={{ height: 10, width: '70%', bgcolor: alpha(theme.palette.common.white, 0.1), borderRadius: 1 }} />
                            <Box sx={{ mt: 3, display: 'flex', alignItems: 'flex-end' }}>
                              <Box sx={{ height: 40, width: 15, bgcolor: alpha(theme.palette.common.white, 0.3), borderRadius: '4px 4px 0 0', mr: 1 }} />
                              <Box sx={{ height: 60, width: 15, bgcolor: alpha(theme.palette.common.white, 0.5), borderRadius: '4px 4px 0 0', mr: 1 }} />
                              <Box sx={{ height: 30, width: 15, bgcolor: alpha(theme.palette.common.white, 0.2), borderRadius: '4px 4px 0 0', mr: 1 }} />
                              <Box sx={{ height: 50, width: 15, bgcolor: alpha(theme.palette.common.white, 0.4), borderRadius: '4px 4px 0 0', mr: 1 }} />
                              <Box sx={{ height: 70, width: 15, bgcolor: alpha(theme.palette.common.white, 0.6), borderRadius: '4px 4px 0 0' }} />
                            </Box>
                          </Box>
                          <Box sx={{ flex: 1, bgcolor: alpha(theme.palette.common.white, 0.1), borderRadius: 1, p: 2, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ height: 20, width: 80, bgcolor: alpha(theme.palette.common.white, 0.2), borderRadius: 1, mb: 2 }} />
                            <Box sx={{
                              flex: 1,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-around'
                            }}>
                              <Box sx={{ height: 30, width: '100%', bgcolor: alpha(theme.palette.common.white, 0.1), borderRadius: 1 }} />
                              <Box sx={{ height: 30, width: '100%', bgcolor: alpha(theme.palette.common.white, 0.1), borderRadius: 1 }} />
                              <Box sx={{ height: 30, width: '100%', bgcolor: alpha(theme.palette.common.white, 0.1), borderRadius: 1 }} />
                            </Box>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Box sx={{ flex: 1, height: 50, bgcolor: alpha(theme.palette.common.white, 0.1), borderRadius: 1 }} />
                          <Box sx={{ width: 50, height: 50, bgcolor: alpha(theme.palette.primary.main, 0.5), borderRadius: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ArrowForward sx={{ color: theme.palette.common.white }} />
                          </Box>
                        </Box>
                      </Box>
                    </Paper>
                    {/* Elementos decorativos em volta */}
                    <Box
                      component={motion.div}
                      animate={{
                        rotate: [0, 360],
                      }}
                      transition={{
                        duration: 40,
                        repeat: Infinity,
                        ease: "linear"
                      }}
                      sx={{
                        position: 'absolute',
                        top: '5%',
                        left: '5%',
                        width: '90%',
                        height: '90%',
                        borderRadius: '50%',
                        border: `2px dashed ${alpha(theme.palette.primary.main, 0.3)}`,
                        zIndex: 1,
                      }}
                    />
                    <Box
                      component={motion.div}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        repeatType: 'reverse'
                      }}
                      sx={{
                        position: 'absolute',
                        top: '0%',
                        left: '20%',
                        width: 60,
                        height: 60,
                        borderRadius: '24px',
                        background: `linear-gradient(45deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                        boxShadow: `0 8px 16px ${alpha(theme.palette.primary.main, 0.3)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: theme.palette.common.white,
                        zIndex: 3,
                      }}
                    >
                      <BarChart />
                    </Box>
                    <Box
                      component={motion.div}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        delay: 2
                      }}
                      sx={{
                        position: 'absolute',
                        bottom: '5%',
                        right: '10%',
                        width: 50,
                        height: 50,
                        borderRadius: '16px',
                        background: `linear-gradient(45deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.light})`,
                        boxShadow: `0 8px 16px ${alpha(theme.palette.secondary.main, 0.3)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: theme.palette.common.white,
                        zIndex: 3,
                      }}
                    >
                      <Timeline />
                    </Box>
                    <Box
                      component={motion.div}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        delay: 4
                      }}
                      sx={{
                        position: 'absolute',
                        top: '60%',
                        left: '5%',
                        width: 40,
                        height: 40,
                        borderRadius: '12px',
                        background: `linear-gradient(45deg, ${theme.palette.success.main}, ${theme.palette.success.light})`,
                        boxShadow: `0 8px 16px ${alpha(theme.palette.success.main, 0.3)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: theme.palette.common.white,
                        zIndex: 3,
                      }}
                    >
                      <NetworkCheck />
                    </Box>
                    <Box
                      component={motion.div}
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{
                        duration: 6,
                        repeat: Infinity,
                        repeatType: 'reverse',
                        delay: 1
                      }}
                      sx={{
                        position: 'absolute',
                        top: '15%',
                        right: '5%',
                        width: 45,
                        height: 45,
                        borderRadius: '14px',
                        background: `linear-gradient(45deg, ${theme.palette.warning.main}, ${theme.palette.warning.light})`,
                        boxShadow: `0 8px 16px ${alpha(theme.palette.warning.main, 0.3)}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: theme.palette.common.white,
                        zIndex: 3,
                      }}
                    >
                      <Storage />
                    </Box>
                  </Box>
                </Box>
              </Grid>
            </Grid>
            {/* Logos de clientes ou tecnologias */}
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              sx={{
                mt: { xs: 5, sm: 8, md: 12 },
                textAlign: 'center'
              }}
            >
              <Typography
                variant="subtitle1"
                color="textSecondary"
                sx={{ mb: 3, opacity: 0.8 }}
              >
                Utilizado e confiado por empresas de todos os tamanhos
              </Typography>
              <Box sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: { xs: 3, sm: 5 },
                opacity: 0.7
              }}>
                {['Microsoft', 'Google', 'Amazon', 'Tesla', 'Netflix'].map((company) => (
                  <Typography
                    key={company}
                    variant="h6"
                    sx={{
                      fontWeight: 700,
                      color: alpha(theme.palette.text.primary, 0.7),
                      fontSize: { xs: '1rem', sm: '1.25rem' }
                    }}
                  >
                    {company}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Container>
        </Box>
        {/* Features Section */}
        <Box
          id="features"
          ref={featuresRef}
          sx={{
            py: { xs: 8, sm: 12 },
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.4)
              : alpha(theme.palette.background.paper, 0.7),
            position: 'relative'
          }}
        >
          <Container maxWidth="lg">
            <Box sx={{ mb: 8, textAlign: 'center' }}>
              <Box
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <Typography
                  variant="h3"
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    position: 'relative',
                    display: 'inline-block',
                    mb: 4,
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      width: 80,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: theme.palette.primary.main,
                      bottom: -10,
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }
                  }}
                >
                  Funcionalidades Poderosas
                </Typography>
              </Box>
              <Box
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <Typography
                  variant="h6"
                  color="textSecondary"
                  sx={{ maxWidth: 700, mx: 'auto' }}
                >
                  Tudo o que você precisa para transformar o conhecimento coletivo
                  da sua equipe em resultados tangíveis.
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={4}>
              {features.map((feature, index) => (
                <Grid item key={index} xs={12} sm={6} md={4}>
                  <Box
                    component={motion.div}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true, amount: 0.2 }}
                    whileHover={{
                      y: -10,
                      boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                      transition: { duration: 0.3 }
                    }}
                  >
                    <FeatureCard elevation={0}>
                      <CardContent sx={{ p: 4, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Avatar
                          sx={{
                            bgcolor: alpha(feature.color, 0.1),
                            color: feature.color,
                            width: 65,
                            height: 65,
                            mb: 2.5,
                            transform: 'rotate(-10deg)',
                          }}
                        >
                          {feature.icon}
                        </Avatar>
                        <Typography variant="h5" component="h3" gutterBottom sx={{ fontWeight: 600 }}>
                          {feature.title}
                        </Typography>
                        <Typography variant="body1" color="textSecondary" sx={{ mb: 2, flex: 1 }}>
                          {feature.description}
                        </Typography>
                        <Button
                          color="primary"
                          sx={{
                            alignSelf: 'flex-start',
                            mt: 'auto',
                            fontWeight: 600,
                            '&:hover': {
                              backgroundColor: alpha(feature.color, 0.1),
                            },
                            '& .MuiButton-endIcon': {
                              transition: 'transform 0.2s'
                            },
                            '&:hover .MuiButton-endIcon': {
                              transform: 'translateX(4px)'
                            }
                          }}
                          endIcon={<ArrowForward fontSize="small" />}
                        >
                          Saiba Mais
                        </Button>
                      </CardContent>
                    </FeatureCard>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
        {/* Feature Showcase */}
        <Box sx={{
          py: { xs: 8, sm: 12 },
          background: theme.palette.mode === 'dark'
            ? `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.4)} 0%, ${alpha(theme.palette.background.default, 0.4)} 100%)`
            : `linear-gradient(180deg, ${alpha(theme.palette.background.paper, 0.7)} 0%, ${alpha(theme.palette.background.default, 0.7)} 100%)`
        }}>
          <Container maxWidth="lg">
            <Grid container spacing={6} alignItems="center">
              <Grid item xs={12} md={6}>
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.7 }}
                  viewport={{ once: true, amount: 0.3 }}
                >
                  <Typography variant="overline" color="primary" sx={{ fontWeight: 600, letterSpacing: 1 }}>
                    PODEROSO E INTUITIVO
                  </Typography>
                  <Typography variant="h3" component="h2" sx={{ mt: 1, mb: 3, fontWeight: 700 }}>
                    Conhecimento Organizado, Decisões Melhores
                  </Typography>
                  <Typography variant="body1" paragraph sx={{ color: alpha(theme.palette.text.primary, 0.7), mb: 4 }}>
                    Transforme o caos em clareza. Nossa plataforma organiza automaticamente o conhecimento da sua empresa em estruturas que facilitam o acesso, a compreensão e a aplicação prática das informações.
                  </Typography>
                  <List>
                    {[
                      'Categorização inteligente de conhecimento',
                      'Pesquisa semântica avançada',
                      'Visualização de conexões entre informações',
                      'Integração com fontes de dados existentes'
                    ].map((item, index) => (
                      <ListItem
                        key={index}
                        sx={{ px: 0, py: 0.8 }}
                      >
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <Avatar
                            sx={{
                              width: 26,
                              height: 26,
                              bgcolor: theme.palette.primary.main,
                              fontSize: '0.8rem',
                              fontWeight: 'bold'
                            }}
                          >
                            {index + 1}
                          </Avatar>
                        </ListItemIcon>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>
                  <Button
                    variant="contained"
                    color="primary"
                    size="large"
                    sx={{ mt: 4, borderRadius: 50, px: 4 }}
                    endIcon={<ArrowForward />}
                  >
                    Descubra Mais
                  </Button>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  viewport={{ once: true, amount: 0.3 }}
                >
                  <Box
                    sx={{
                      position: 'relative',
                      height: { xs: 320, sm: 400, md: 480 },
                      width: '100%',
                      mr: { md: -4 },
                    }}
                  >
                    <Paper
                      elevation={8}
                      sx={{
                        position: 'absolute',
                        width: '90%',
                        height: '90%',
                        borderRadius: 4,
                        overflow: 'hidden',
                        background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                        transform: 'perspective(1000px) rotateY(-15deg) rotateX(5deg)',
                        transformOrigin: 'left center',
                        transition: 'all 0.4s',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                      }}
                    >
                      {/* Conteúdo da tela - pode ser substituído por imagem real */}
                      <Box
                        sx={{
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          p: 3,
                          color: theme.palette.common.white,
                        }}
                      >
                        <Box sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 2,
                          pb: 2,
                          borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.2)}`
                        }}>
                          <Box sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '12px',
                            bgcolor: alpha(theme.palette.common.white, 0.2),
                            mr: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}>
                            <Psychology />
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              Base de Conhecimento
                            </Typography>
                            <Typography variant="caption">
                              Documentos, Wikis & Processos
                            </Typography>
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, flex: 1 }}>
                          <Box sx={{ width: 180, bgcolor: alpha(theme.palette.common.white, 0.1), borderRadius: 2, p: 1 }}>
                            <Typography variant="caption">Categorias</Typography>
                            <List dense disablePadding>
                              {['Marketing', 'Produto', 'Vendas', 'Suporte', 'RH'].map((item, i) => (
                                <ListItem key={i} dense sx={{ py: 0.5 }}>
                                  <ListItemIcon sx={{ minWidth: 30 }}>
                                    <Box sx={{ width: 8, height: 8, bgcolor: i === 2 ? theme.palette.common.white : alpha(theme.palette.common.white, 0.5), borderRadius: '50%' }} />
                                  </ListItemIcon>
                                  <ListItemText
                                    primary={item}
                                    primaryTypographyProps={{
                                      variant: 'body2',
                                      sx: { color: i === 2 ? theme.palette.common.white : alpha(theme.palette.common.white, 0.7) }
                                    }}
                                  />
                                </ListItem>
                              ))}
                            </List>
                          </Box>
                          <Box sx={{ flex: 1, bgcolor: alpha(theme.palette.common.white, 0.1), borderRadius: 2, p: 1, display: 'flex', flexDirection: 'column' }}>
                            <Typography variant="caption" sx={{ mb: 1 }}>Documentos Recentes</Typography>
                            <Box sx={{ borderRadius: 1, bgcolor: theme.palette.background.paper, p: 1.5, mb: 1 }}>
                              <Typography variant="body2" sx={{ color: theme.palette.text.primary, fontWeight: 500, mb: 0.5 }}>
                                Guia de Onboarding de Clientes
                              </Typography>
                              <Typography variant="caption" sx={{ color: theme.palette.text.secondary, display: 'block', mb: 1 }}>
                                Atualizado há 2 dias • 12 visualizações
                              </Typography>
                              <Chip
                                size="small"
                                label="Processo"
                                sx={{
                                  height: 20,
                                  bgcolor: theme.palette.primary.main,
                                  color: theme.palette.common.white,
                                  fontSize: '0.7rem'
                                }}
                              />
                            </Box>
                            {[
                              { title: 'Roadmap Q3 2025', type: 'Documento' },
                              { title: 'Política de Reembolso', type: 'Wiki' }
                            ].map((item, i) => (
                              <Box key={i} sx={{
                                borderRadius: 1,
                                bgcolor: alpha(theme.palette.common.white, 0.1),
                                p: 1.5,
                                mb: i < 1 ? 1 : 0
                              }}>
                                <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                                  {item.title}
                                </Typography>
                                <Chip
                                  size="small"
                                  label={item.type}
                                  sx={{
                                    height: 20,
                                    bgcolor: alpha(theme.palette.common.white, 0.2),
                                    color: theme.palette.common.white,
                                    fontSize: '0.7rem'
                                  }}
                                />
                              </Box>
                            ))}
                          </Box>
                        </Box>
                        <Box sx={{
                          p: 1.5,
                          bgcolor: alpha(theme.palette.common.white, 0.1),
                          borderRadius: 2,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1
                        }}>
                          <Box
                            sx={{
                              width: 32,
                              height: 32,
                              borderRadius: '10px',
                              bgcolor: theme.palette.primary.main,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Search />
                          </Box>
                          <Typography variant="body2" sx={{ color: alpha(theme.palette.common.white, 0.7) }}>
                            Pesquisar na base de conhecimento...
                          </Typography>
                        </Box>
                      </Box>
                    </Paper>
                    {/* Elementos decorativos */}
                    {[
                      { top: '10%', left: '85%', delay: 0, size: 80, color: theme.palette.primary.main },
                      { top: '80%', left: '10%', delay: 0.5, size: 120, color: theme.palette.secondary.main },
                    ].map((bubble, index) => (
                      <Box
                        key={index}
                        component={motion.div}
                        animate={{
                          y: [0, -15, 0],
                          scale: [1, 1.05, 1],
                        }}
                        transition={{
                          duration: 8,
                          repeat: Infinity,
                          delay: bubble.delay
                        }}
                        sx={{
                          position: 'absolute',
                          top: bubble.top,
                          left: bubble.left,
                          width: bubble.size,
                          height: bubble.size,
                          borderRadius: '40%',
                          background: `radial-gradient(circle, ${alpha(bubble.color, 0.2)}, transparent 70%)`,
                          zIndex: -1,
                        }}
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Container>
        </Box>
        {/* Testimonials Section */}
        <Box
          id="testimonials"
          sx={{
            py: { xs: 8, sm: 12 },
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.4)
              : alpha(theme.palette.background.paper, 0.7),
          }}
        >
          <Container maxWidth="lg">
            <Box sx={{ mb: 8, textAlign: 'center' }}>
              <Box
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <Typography
                  variant="h3"
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    position: 'relative',
                    display: 'inline-block',
                    mb: 4,
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      width: 80,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: theme.palette.secondary.main,
                      bottom: -10,
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }
                  }}
                >
                  O Que Nossos Clientes Dizem
                </Typography>
              </Box>
              <Box
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <Typography
                  variant="h6"
                  color="textSecondary"
                  sx={{ maxWidth: 700, mx: 'auto' }}
                >
                  Histórias reais de empresas que transformaram seu conhecimento em vantagem competitiva
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={4}>
              {testimonials.map((testimonial, index) => (
                <Grid item key={index} xs={12} md={4}>
                  <Box
                    component={motion.div}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.2 }}
                    viewport={{ once: true, amount: 0.2 }}
                  >
                    <TestimonialCard elevation={0}>
                      <Box sx={{ mb: 2 }}>
                        <FormatQuote sx={{
                          fontSize: 40,
                          color: alpha(theme.palette.primary.main, 0.2),
                          transform: 'scaleX(-1)'
                        }} />
                      </Box>
                      <Typography
                        variant="body1"
                        paragraph
                        sx={{
                          fontStyle: 'italic',
                          mb: 4,
                          color: alpha(theme.palette.text.primary, 0.87)
                        }}
                      >
                        {testimonial.quote}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Avatar
                          src={testimonial.avatar}
                          alt={testimonial.name}
                          sx={{
                            width: 50,
                            height: 50,
                            border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`
                          }}
                        />
                        <Box sx={{ ml: 2 }}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                            {testimonial.name}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {testimonial.position}
                          </Typography>
                        </Box>
                      </Box>
                    </TestimonialCard>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
        {/* Stats Section */}
        <Box
          id="results"
          sx={{
            py: { xs: 8, sm: 10 },
            background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={4}>
              {stats.map((stat, index) => (
                <Grid item key={index} xs={6} md={3}>
                  <Box
                    component={motion.div}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    viewport={{ once: true, amount: 0.2 }}
                  >
                    <StatsCard elevation={0}>
                      <Box sx={{ mb: 2 }}>
                        {stat.icon}
                      </Box>
                      <Typography variant="h3" sx={{ fontWeight: 700, mb: 1 }}>
                        {stat.value}
                      </Typography>
                      <Typography variant="body2" color="textSecondary" align="center">
                        {stat.label}
                      </Typography>
                    </StatsCard>
                  </Box>
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
        {/* FAQ Section */}
        <Box
          id="faq"
          sx={{
            py: { xs: 8, sm: 12 },
            background: theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.4)
              : alpha(theme.palette.background.paper, 0.7),
          }}
        >
          <Container maxWidth="md">
            <Box sx={{ mb: 8, textAlign: 'center' }}>
              <Box
                component={motion.div}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true, amount: 0.2 }}
              >
                <Typography
                  variant="h3"
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    position: 'relative',
                    display: 'inline-block',
                    mb: 4,
                    '&::after': {
                      content: '""',
                      position: 'absolute',
                      width: 80,
                      height: 4,
                      borderRadius: 2,
                      backgroundColor: theme.palette.primary.main,
                      bottom: -10,
                      left: '50%',
                      transform: 'translateX(-50%)'
                    }
                  }}
                >
                  Perguntas Frequentes
                </Typography>
              </Box>
            </Box>
            <Box>
              {faqItems.map((item, index) => (
                <Box
                  component={motion.div}
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  viewport={{ once: true, amount: 0.2 }}
                >
                  <Paper
                    elevation={0}
                    sx={{
                      p: 3,
                      mb: 3,
                      borderRadius: 3,
                      border: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                      background: alpha(theme.palette.background.paper, 0.7),
                      backdropFilter: 'blur(10px)',
                    }}
                  >
                    <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                      {item.question}
                    </Typography>
                    <Typography variant="body1" color="textSecondary">
                      {item.answer}
                    </Typography>
                  </Paper>
                </Box>
              ))}
            </Box>
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              viewport={{ once: true, amount: 0.2 }}
              sx={{
                mt: 6,
                textAlign: 'center',
                p: 4,
                borderRadius: 4,
                background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.05)}, ${alpha(theme.palette.secondary.main, 0.05)})`,
              }}
            >
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
                Ainda tem dúvidas?
              </Typography>
              <Typography variant="body1" paragraph>
                Nossa equipe de suporte está disponível 24/7 para ajudar você.
              </Typography>
              <Button
                variant="contained"
                color="primary"
                size="large"
                sx={{ borderRadius: 50, px: 4 }}
              >
                Entre em Contato
              </Button>
            </Box>
          </Container>
        </Box>
        {/* CTA Section */}
        <Box
          sx={{
            position: 'relative',
            py: { xs: 8, sm: 12 },
            background: `linear-gradient(45deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
            color: theme.palette.common.white,
            overflow: 'hidden'
          }}
        >
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage: 'url(/pattern.svg)', // Substitua por um padrão real
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
            }}
          />
          <Container maxWidth="md">
            <Box
              component={motion.div}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true, amount: 0.2 }}
              sx={{
                textAlign: 'center',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <Typography variant="h2" gutterBottom sx={{ fontWeight: 700 }}>
                Comece a Transformar Conhecimento em Resultados
              </Typography>
              <Typography variant="h5" paragraph sx={{ maxWidth: 800, mx: 'auto', mb: 5, opacity: 0.9 }}>
                Junte-se a milhares de empresas que já transformaram sua maneira de trabalhar com o SynapseS.
              </Typography>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={3}
                justifyContent="center"
              >
                <Box component={motion.div} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleStartNow}
                    sx={{
                      bgcolor: theme.palette.common.white,
                      color: theme.palette.primary.dark,
                      fontWeight: 600,
                      borderRadius: 50,
                      px: 4,
                      py: 1.5,
                      '&:hover': {
                        bgcolor: theme.palette.common.white,
                      }
                    }}
                  >
                    Comece Grátis • 30 Dias
                  </Button>
                </Box>
                <Box component={motion.div} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outlined"
                    size="large"
                    sx={{
                      color: theme.palette.common.white,
                      borderColor: theme.palette.common.white,
                      borderRadius: 50,
                      px: 4,
                      py: 1.5,
                      '&:hover': {
                        borderColor: theme.palette.common.white,
                        bgcolor: alpha(theme.palette.common.white, 0.1)
                      }
                    }}
                  >
                    Agendar Demo
                  </Button>
                </Box>
              </Stack>
            </Box>
          </Container>
        </Box>
        {/* Footer */}
        <Box
          sx={{
            py: { xs: 6, sm: 10 },
            bgcolor: theme.palette.mode === 'dark'
              ? alpha(theme.palette.background.paper, 0.2)
              : alpha(theme.palette.background.paper, 0.8),
          }}
        >
          <Container maxWidth="lg">
            <Grid container spacing={4}>
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <Logo />
                  <Typography variant="h5" sx={{ fontWeight: 700, ml: 2 }}>
                    SynapseS
                  </Typography>
                </Box>
                <Typography variant="body2" paragraph color="textSecondary" sx={{ maxWidth: 300 }}>
                  Transformando o conhecimento coletivo das empresas em vantagem competitiva desde 2023.
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, mt: 3 }}>
                  {[
                    { icon: <GitHub />, label: 'GitHub' },
                    { icon: <Twitter />, label: 'Twitter' },
                    { icon: <LinkedIn />, label: 'LinkedIn' }
                  ].map((social, index) => (
                    <IconButton
                      key={index}
                      sx={{
                        color: theme.palette.text.secondary,
                        '&:hover': {
                          color: theme.palette.primary.main,
                          bgcolor: alpha(theme.palette.primary.main, 0.1)
                        }
                      }}
                      aria-label={social.label}
                    >
                      {social.icon}
                    </IconButton>
                  ))}
                </Box>
              </Grid>
              <Grid item xs={6} sm={3} md={2}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Produto
                </Typography>
                <List dense disablePadding>
                  {['Funcionalidades', 'Preços', 'Cases', 'Segurança'].map((item) => (
                    <ListItem key={item} disablePadding sx={{ py: 0.5 }}>
                      <Button
                        color="inherit"
                        sx={{
                          color: theme.palette.text.secondary,
                          p: 0,
                          textTransform: 'none',
                          justifyContent: 'flex-start',
                          '&:hover': {
                            color: theme.palette.primary.main,
                            bgcolor: 'transparent'
                          }
                        }}
                      >
                        {item}
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={6} sm={3} md={2}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Empresa
                </Typography>
                <List dense disablePadding>
                  {['Sobre nós', 'Blog', 'Carreiras', 'Contato'].map((item) => (
                    <ListItem key={item} disablePadding sx={{ py: 0.5 }}>
                      <Button
                        color="inherit"
                        sx={{
                          color: theme.palette.text.secondary,
                          p: 0,
                          textTransform: 'none',
                          justifyContent: 'flex-start',
                          '&:hover': {
                            color: theme.palette.primary.main,
                            bgcolor: 'transparent'
                          }
                        }}
                      >
                        {item}
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={6} sm={3} md={2}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Recursos
                </Typography>
                <List dense disablePadding>
                  {['Documentação', 'Tutoriais', 'Webinars', 'API'].map((item) => (
                    <ListItem key={item} disablePadding sx={{ py: 0.5 }}>
                      <Button
                        color="inherit"
                        sx={{
                          color: theme.palette.text.secondary,
                          p: 0,
                          textTransform: 'none',
                          justifyContent: 'flex-start',
                          '&:hover': {
                            color: theme.palette.primary.main,
                            bgcolor: 'transparent'
                          }
                        }}
                      >
                        {item}
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </Grid>
              <Grid item xs={6} sm={3} md={2}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Legal
                </Typography>
                <List dense disablePadding>
                  {['Termos', 'Privacidade', 'Cookies', 'Compliance'].map((item) => (
                    <ListItem key={item} disablePadding sx={{ py: 0.5 }}>
                      <Button
                        color="inherit"
                        sx={{
                          color: theme.palette.text.secondary,
                          p: 0,
                          textTransform: 'none',
                          justifyContent: 'flex-start',
                          '&:hover': {
                            color: theme.palette.primary.main,
                            bgcolor: 'transparent'
                          }
                        }}
                      >
                        {item}
                      </Button>
                    </ListItem>
                  ))}
                </List>
              </Grid>
            </Grid>
            <Box
              sx={{
                mt: 8,
                pt: 3,
                borderTop: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'space-between',
                alignItems: { xs: 'center', sm: 'flex-end' },
                textAlign: { xs: 'center', sm: 'left' }
              }}
            >
              <Typography variant="body2" color="textSecondary">
                © 2025 SynapseS. Todos os direitos reservados.
              </Typography>
              <Stack
                direction="row"
                spacing={2}
                sx={{ mt: { xs: 3, sm: 0 } }}
              >
                <Button
                  size="small"
                  startIcon={<Brightness4 fontSize="small" />}
                  sx={{
                    color: theme.palette.text.secondary,
                    textTransform: 'none',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                  }}
                >
                  Modo Escuro
                </Button>
                <Button
                  size="small"
                  startIcon={<Settings fontSize="small" />}
                  sx={{
                    color: theme.palette.text.secondary,
                    textTransform: 'none',
                    '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.1) }
                  }}
                >
                  Preferências
                </Button>
              </Stack>
            </Box>
          </Container>
        </Box>
      </main>
      {/* Login/Registro Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          elevation: 8,
          sx: {
            borderRadius: 2,
            overflow: 'hidden',
            backgroundImage: theme.palette.mode === 'dark'
              ? `linear-gradient(to bottom right, ${alpha(theme.palette.background.paper, 0.8)}, ${alpha(theme.palette.background.paper, 0.95)})`
              : `linear-gradient(to bottom right, ${alpha(theme.palette.background.paper, 0.9)}, ${alpha(theme.palette.background.paper, 1)})`,
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        <Box sx={{ position: 'relative' }}>
          <DialogTitle sx={{ pb: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h5" component="h2" sx={{ fontWeight: 600 }}>
                {tabValue === 0 ? 'Bem-vindo de volta' : 'Crie sua conta'}
              </Typography>
              <IconButton
                onClick={() => setOpenDialog(false)}
                edge="end"
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
            </Box>
            <Tabs
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              sx={{
                mt: 2,
                borderBottom: `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                '& .MuiTabs-indicator': {
                  height: 3,
                  borderRadius: 1.5
                }
              }}
            >
              <Tab
                label="Login"
                sx={{
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                  minWidth: 100
                }}
              />
              <Tab
                label="Registro de Empresa"
                sx={{
                  fontWeight: 600,
                  textTransform: 'none',
                  fontSize: '1rem',
                  minWidth: 100
                }}
              />
            </Tabs>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 3 }}>
              {tabValue === 0 ? (
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <LoginForm onLoginSuccess={handleLoginSuccess} />
                </Box>
              ) : (
                <Box
                  component={motion.div}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <CompanyAndAdminRegistrationForm onRegistrationSuccess={() => setTabValue(0)} />
                </Box>
              )}
              <Box sx={{ mt: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="textSecondary">
                  {tabValue === 0
                    ? 'Ainda não tem uma conta?'
                    : 'Já tem uma conta?'
                  }
                </Typography>
                <Button
                  color="primary"
                  onClick={() => setTabValue(tabValue === 0 ? 1 : 0)}
                  sx={{
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: 'transparent' }
                  }}
                >
                  {tabValue === 0
                    ? 'Registrar agora'
                    : 'Faça login'
                  }
                </Button>
              </Box>
            </Box>
          </DialogContent>
          {/* Decoração visual */}
          <Box
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: 150,
              height: 150,
              borderRadius: '0 0 0 100%',
              background: `linear-gradient(45deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.1)})`,
              zIndex: -1,
            }}
          />
          <Box
            sx={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              width: 120,
              height: 120,
              borderRadius: '0 100% 0 0',
              background: `linear-gradient(45deg, ${alpha(theme.palette.secondary.main, 0.1)}, ${alpha(theme.palette.primary.main, 0.1)})`,
              zIndex: -1,
            }}
          />
        </Box>
      </Dialog>
    </>
  );
};
// Componente Search com tipo definido
interface SearchProps {
  color?: string;
  height?: string | number;
  width?: string | number;
}
const Search: React.FC<SearchProps> = (props) => {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" height={props.height || "20"} width={props.width || "20"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <circle cx="11" cy="11" r="8"></circle>
      <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
    </svg>
  );
};
export default HomePage;


