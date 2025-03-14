// src/constants/permissions.ts
export const PERMISSIONS = {
    // Gerenciamento de usuários
    USERS_VIEW: 'users:view',
    USERS_CREATE: 'users:create',
    USERS_EDIT: 'users:edit',
    USERS_DELETE: 'users:delete',

    // Tarefas e missões
    TASKS_VIEW: 'tasks:view',
    TASKS_CREATE: 'tasks:create',
    TASKS_EDIT: 'tasks:edit',
    TASKS_DELETE: 'tasks:delete',
    TASKS_ASSIGN: 'tasks:assign',

    // Relatórios
    REPORTS_VIEW: 'reports:view',
    REPORTS_CREATE: 'reports:create',
    REPORTS_EXPORT: 'reports:export',

    // Configurações
    SETTINGS_VIEW: 'settings:view',
    SETTINGS_EDIT: 'settings:edit',

    // Fóruns (baseado em código que você compartilhou)
    FORUM_VIEW: 'forum:view',
    FORUM_CREATE: 'forum:create',
    FORUM_EDIT: 'forum:edit',
    FORUM_DELETE: 'forum:delete'
};

// Definição de quais permissões cada papel deve ter
export const ROLE_PERMISSIONS = {
    admin: [
        // Admin tem todas as permissões
        ...Object.values(PERMISSIONS)
    ],

    manager: [
        // Visualização de usuários
        PERMISSIONS.USERS_VIEW,

        // Gerenciamento completo de tarefas
        PERMISSIONS.TASKS_VIEW,
        PERMISSIONS.TASKS_CREATE,
        PERMISSIONS.TASKS_EDIT,
        PERMISSIONS.TASKS_DELETE,
        PERMISSIONS.TASKS_ASSIGN,

        // Relatórios
        PERMISSIONS.REPORTS_VIEW,
        PERMISSIONS.REPORTS_CREATE,
        PERMISSIONS.REPORTS_EXPORT,

        // Configurações (apenas visualização)
        PERMISSIONS.SETTINGS_VIEW,

        // Fóruns
        PERMISSIONS.FORUM_VIEW,
        PERMISSIONS.FORUM_CREATE,
        PERMISSIONS.FORUM_EDIT
    ],

    user: [
        // Visualização limitada
        PERMISSIONS.USERS_VIEW,

        // Tarefas (sem delete)
        PERMISSIONS.TASKS_VIEW,

        // Fóruns (apenas visualização)
        PERMISSIONS.FORUM_VIEW
    ]
};
