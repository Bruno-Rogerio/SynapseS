import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import HomePage from './components/HomePage';
import Dashboard from './components/Dashboard';
import AcceptInviteForm from './components/AcceptInviteForm';
import Tasks from './components/Tasks';
import Missions from './components/Missions';
import ForumList from './components/ForumList';
import ForumDetail from './components/ForumDetail';
import { AuthProvider } from './contexts/AuthContext';

const theme = createTheme({
  palette: {
    primary: {
      main: '#4A5FE0',
    },
    secondary: {
      main: '#6C63FF',
    },
    background: {
      default: '#F4F7FE',
    },
    text: {
      primary: '#333333',
      secondary: '#666666',
    },
  },
  typography: {
    fontFamily: 'Poppins, Arial, sans-serif',
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/accept-invite/:token" element={<AcceptInviteForm />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/missions" element={<Missions />} />
            {/* Rotas para o fórum */}
            <Route path="/forums" element={<ForumList />} />
            <Route path="/forum/:id" element={<ForumDetail />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
