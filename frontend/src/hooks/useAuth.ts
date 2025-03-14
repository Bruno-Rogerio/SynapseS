// hooks/useAuth.ts
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import { PERMISSIONS } from '../constants/permissions';

/**
 * Hook para acessar o contexto de autenticação e funcionalidades relacionadas a permissões
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  const {
    registerCompanyAndAdmin,
    login,
    logout,
    user,
    isAuthenticated,
    loading,
    hasPermission
  } = context;

  // Funções auxiliares baseadas em papéis (para compatibilidade com código existente)
  const isAdmin = !!user && user.role === 'admin';
  const isManager = !!user && user.role === 'manager';
  const isRegularUser = !!user && user.role === 'user';

  /**
   * Verifica se o usuário pode realizar uma ação específica
   * Utiliza as constantes de permissão do sistema
   */
  const can = {
    // Usuários
    viewUsers: () => hasPermission(PERMISSIONS.USERS_VIEW),
    createUsers: () => hasPermission(PERMISSIONS.USERS_CREATE),
    editUsers: () => hasPermission(PERMISSIONS.USERS_EDIT),
    deleteUsers: () => hasPermission(PERMISSIONS.USERS_DELETE),

    // Tarefas
    viewTasks: () => hasPermission(PERMISSIONS.TASKS_VIEW),
    createTasks: () => hasPermission(PERMISSIONS.TASKS_CREATE),
    editTasks: () => hasPermission(PERMISSIONS.TASKS_EDIT),
    deleteTasks: () => hasPermission(PERMISSIONS.TASKS_DELETE),
    assignTasks: () => hasPermission(PERMISSIONS.TASKS_ASSIGN),

    // Fóruns
    viewForums: () => hasPermission(PERMISSIONS.FORUM_VIEW),
    createForums: () => hasPermission(PERMISSIONS.FORUM_CREATE),
    editForums: () => hasPermission(PERMISSIONS.FORUM_EDIT),
    deleteForums: () => hasPermission(PERMISSIONS.FORUM_DELETE),

    // Relatórios
    viewReports: () => hasPermission(PERMISSIONS.REPORTS_VIEW),
    createReports: () => hasPermission(PERMISSIONS.REPORTS_CREATE),
    exportReports: () => hasPermission(PERMISSIONS.REPORTS_EXPORT),

    // Configurações
    viewSettings: () => hasPermission(PERMISSIONS.SETTINGS_VIEW),
    editSettings: () => hasPermission(PERMISSIONS.SETTINGS_EDIT)
  };

  return {
    // Funções e estado originais
    registerCompanyAndAdmin,
    login,
    logout,
    user,
    isAuthenticated,
    loading,

    // Funções de verificação de permissões
    hasPermission,

    // Funções auxiliares baseadas em papéis (para compatibilidade)
    isAdmin,
    isManager,
    isRegularUser,

    // Helper semântico para verificação de permissões
    can
  };
};
