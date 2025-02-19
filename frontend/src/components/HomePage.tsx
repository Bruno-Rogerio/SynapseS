import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Card,
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
  CircularProgress
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { Menu as MenuIcon, Close as CloseIcon } from '@mui/icons-material';
import { useAuth } from '../hooks/useAuth';
import Logo from './Logo';
import LoginForm from './LoginForm';
import CompanyAndAdminRegistrationForm from './CompanyAndAdminRegistrationForm';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  background: 'transparent',
  boxShadow: 'none',
  transition: 'background-color 0.3s ease',
  '&.scrolled': {
    background: theme.palette.primary.main,
  },
}));

const StyledHero = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(20, 0, 6),
  clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 100%)',
}));

const StyledFeature = styled(Card)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  transition: 'transform 0.3s ease, box-shadow 0.3s ease',
  '&:hover': {
    transform: 'translateY(-10px)',
    boxShadow: theme.shadows[10],
  },
}));

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      setIsScrolled(offset > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isAuthenticated && user) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, user, navigate]);

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

  const menuItems = [
    { label: 'Início', id: 'home' },
    { label: 'Funcionalidades', id: 'features' },
    { label: 'Sobre', id: 'about' },
  ];

  if (isAuthenticated && user) {
    return null;
  }

  return (
    <>
      <StyledAppBar position="fixed" className={isScrolled ? 'scrolled' : ''}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2, display: { md: 'none' } }}
            onClick={() => setMobileMenuOpen(true)}
          >
            <MenuIcon />
          </IconButton>
          <Logo />
          <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'flex' }, justifyContent: 'center' }}>
            {menuItems.map((item) => (
              <Button
                key={item.id}
                color="inherit"
                onClick={() => scrollTo(item.id)}
              >
                {item.label}
              </Button>
            ))}
          </Box>
          <Button color="inherit" onClick={() => setOpenDialog(true)}>Login</Button>
        </Toolbar>
      </StyledAppBar>
      <Drawer
        anchor="left"
        open={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      >
        <Box
          sx={{ width: 250 }}
          role="presentation"
        >
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 1 }}>
            <IconButton onClick={() => setMobileMenuOpen(false)}>
              <CloseIcon />
            </IconButton>
          </Box>
          <List>
            {menuItems.map((item) => (
              <ListItem
                key={item.id}
                onClick={() => scrollTo(item.id)}
              >
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
            <ListItem onClick={() => {
              setOpenDialog(true);
              setMobileMenuOpen(false);
            }}>
              <ListItemText primary="Login" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
      <main>
        <StyledHero id="home">
          <Container maxWidth="sm">
            <Typography component="h1" variant="h2" align="center" color="inherit" gutterBottom>
              Bem-vindo ao SynapseS
            </Typography>
            <Typography variant="h5" align="center" color="inherit" paragraph>
              Uma plataforma revolucionária para gestão de conhecimento e produtividade
            </Typography>
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button
                variant="contained"
                color="secondary"
                size="large"
                onClick={handleStartNow}
              >
                Comece Agora
              </Button>
            </Box>
          </Container>
        </StyledHero>
        <Container sx={{ py: 8 }} maxWidth="md" id="features">
          <Typography component="h2" variant="h3" align="center" color="textPrimary" gutterBottom>
            Funcionalidades
          </Typography>
          <Grid container spacing={4}>
            {[
              { title: 'Organize seus pensamentos', description: 'Capture e estruture suas ideias de forma eficiente' },
              { title: 'Colabore em tempo real', description: 'Trabalhe em equipe de forma sincronizada e produtiva' },
              { title: 'Visualize conexões', description: 'Descubra relações entre suas ideias e projetos' },
            ].map((feature, index) => (
              <Grid item key={index} xs={12} sm={6} md={4}>
                <StyledFeature>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography gutterBottom variant="h5" component="h2">
                      {feature.title}
                    </Typography>
                    <Typography>
                      {feature.description}
                    </Typography>
                  </CardContent>
                </StyledFeature>
              </Grid>
            ))}
          </Grid>
        </Container>
        <Box sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText', p: 6 }} component="section" id="about">
          <Container maxWidth="sm">
            <Typography component="h2" variant="h3" align="center" gutterBottom>
              Sobre o SynapseS
            </Typography>
            <Typography variant="h6" align="center" paragraph>
              SynapseS é uma plataforma inovadora que combina gestão de conhecimento, colaboração em tempo real e visualização de dados para impulsionar sua produtividade e criatividade.
            </Typography>
            <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
              <Button variant="contained" color="primary">
                Saiba mais
              </Button>
            </Box>
          </Container>
        </Box>
      </main>
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Tabs value={tabValue} onChange={(_, newValue) => setTabValue(newValue)}>
            <Tab label="Login" />
            <Tab label="Registro de Empresa" />
          </Tabs>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            {tabValue === 0 ? (
              <LoginForm onLoginSuccess={handleLoginSuccess} />
            ) : (
              <CompanyAndAdminRegistrationForm onRegistrationSuccess={() => setTabValue(0)} />
            )}
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HomePage;
