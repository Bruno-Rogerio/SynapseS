import React, { useState } from 'react';
import { TextField, Button, Box, MenuItem } from '@mui/material';
import { useAuth } from '../hooks/useAuth';

interface CompanyAndAdminRegistrationFormProps {
  onRegistrationSuccess: () => void;
}

const CompanyAndAdminRegistrationForm: React.FC<CompanyAndAdminRegistrationFormProps> = ({ onRegistrationSuccess }) => {
  const [formData, setFormData] = useState({
    companyName: '',
    plan: '',
    adminUsername: '',
    adminEmail: '',
    adminPassword: '',
    adminFullName: ''
  });

  const { registerCompanyAndAdmin } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await registerCompanyAndAdmin(formData);
      onRegistrationSuccess();
    } catch (error) {
      console.error('Registration failed:', error);
      // Adicione aqui a lógica para mostrar mensagens de erro ao usuário
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      <TextField
        fullWidth
        label="Nome da Empresa"
        name="companyName"
        value={formData.companyName}
        onChange={handleChange}
        required
      />
      <TextField
        fullWidth
        select
        label="Plano"
        name="plan"
        value={formData.plan}
        onChange={handleChange}
        required
      >
        <MenuItem value="basic">Básico</MenuItem>
        <MenuItem value="pro">Pro</MenuItem>
        <MenuItem value="enterprise">Enterprise</MenuItem>
      </TextField>
      <TextField
        fullWidth
        label="Nome de Usuário do Administrador"
        name="adminUsername"
        value={formData.adminUsername}
        onChange={handleChange}
        required
      />
      <TextField
        fullWidth
        type="email"
        label="Email do Administrador"
        name="adminEmail"
        value={formData.adminEmail}
        onChange={handleChange}
        required
      />
      <TextField
        fullWidth
        type="password"
        label="Senha do Administrador"
        name="adminPassword"
        value={formData.adminPassword}
        onChange={handleChange}
        required
      />
      <TextField
        fullWidth
        label="Nome Completo do Administrador"
        name="adminFullName"
        value={formData.adminFullName}
        onChange={handleChange}
        required
      />
      <Button type="submit" variant="contained" color="primary" fullWidth>
        Registrar Empresa e Administrador
      </Button>
    </Box>
  );
};

export default CompanyAndAdminRegistrationForm;
