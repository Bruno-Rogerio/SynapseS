import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaChartPie,
  FaTasks,
  FaLightbulb,
  FaChartLine,
  FaChartBar,
  FaCog,
  FaUsers,
  FaSignOutAlt
} from 'react-icons/fa';
import { useAuth } from '../hooks/useAuth';
import { Typography, Button } from '@mui/material';
import UserManagement from './UserManagement';
import TaskMissionManager from './TaskMissionManager/taskMissionManager'; // Importando o componente para gerenciar tarefas e missões

type MenuItem = {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
};

const Dashboard: React.FC = () => {
  const [activeItem, setActiveItem] = useState('Resumo');
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const menuItems: MenuItem[] = [
    { name: 'Resumo', icon: FaChartPie },
    { name: 'Gestão de Tarefas e Missões', icon: FaTasks },
    { name: 'Brainstorming', icon: FaLightbulb },
    { name: 'Insights e Produtividade', icon: FaChartLine },
    { name: 'Indicadores', icon: FaChartBar },
    { name: 'Gerenciar Usuários', icon: FaUsers },
    { name: 'Configurações e Segurança', icon: FaCog },
  ];

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!isAuthenticated || !user) {
    navigate('/');
    return null;
  }

  const renderContent = () => {
    switch (activeItem) {
      case 'Gestão de Tarefas e Missões':
        return <TaskMissionManager />;
      case 'Brainstorming': // Exemplo de como adicionar outras seções no futuro
        return <Typography>Conteúdo da seção Brainstorming vai aqui.</Typography>;
      case 'Insights e Produtividade':
        return <Typography>Conteúdo da seção Insights e Produtividade vai aqui.</Typography>;
      case 'Indicadores':
        return <Typography>Conteúdo da seção Indicadores vai aqui.</Typography>;
      case 'Gerenciar Usuários':
        return <UserManagement />;
      case 'Configurações e Segurança':
        return <Typography>Conteúdo da seção Configurações e Segurança vai aqui.</Typography>;
      default:
        return <Typography>Conteúdo da seção {activeItem} vai aqui.</Typography>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4">
          <Typography variant="h6">Dashboard</Typography>
          <Typography variant="body2">Bem-vindo, {user.fullName}</Typography>
        </div>
        <nav className="mt-4">
          {menuItems.map((item) => (
            <Button
              key={item.name}
              startIcon={<item.icon />}
              onClick={() => setActiveItem(item.name)}
              fullWidth
              sx={{
                justifyContent: 'flex-start',
                px: 3,
                py: 1,
                color: activeItem === item.name ? 'primary.main' : 'text.primary',
                bgcolor: activeItem === item.name ? 'action.selected' : 'transparent',
                textAlign: 'left', // Alinha o texto à esquerda
              }}
            >
              {item.name}
            </Button>
          ))}
          <Button
            startIcon={<FaSignOutAlt />}
            onClick={handleLogout}
            fullWidth
            sx={{
              justifyContent: 'flex-start',
              px: 3,
              py: 1,
              color: 'text.primary',
              textAlign: 'left', // Alinha o texto à esquerda
            }}
          >
            Sair
          </Button>
        </nav>
      </div>
      {/* Main content */}
      <div className="flex-1 p-10 overflow-auto">
        <Typography variant="h4" gutterBottom>{activeItem}</Typography>
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;