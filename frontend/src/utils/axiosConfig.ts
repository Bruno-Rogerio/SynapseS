// src/utils/axiosConfig.ts
import axios from 'axios';

// Constantes para configuração
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
export const TOKEN_KEY = 'auth_token'; // Chave padronizada para o token
const LEGACY_TOKEN_KEY = 'token';      // Chave antiga para compatibilidade

/**
 * Obtém o token de autenticação do localStorage.
 * Verifica primeiro a nova chave, depois a chave legada para compatibilidade.
 */
export const getAuthToken = () => {
  return localStorage.getItem(TOKEN_KEY) ||
    localStorage.getItem(LEGACY_TOKEN_KEY) ||
    '';
};

/**
 * Função para tratamento comum de erros de resposta
 */
const handleResponseError = (error: any) => {
  if (error.response) {
    // Token expirado ou inválido
    if (error.response.status === 401) {
      console.error('Erro de autenticação: Token inválido ou expirado');
      // Remover tokens de ambas as chaves
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(LEGACY_TOKEN_KEY);

      // Se não estiver na página de login, redirecionar
      if (!window.location.pathname.includes('/login')) {
        // Aguardar um curto período antes de redirecionar para garantir 
        // que outros manipuladores de erro possam ser executados
        setTimeout(() => {
          window.location.href = '/login';
        }, 100);
      }
    }
    // Permissão negada
    else if (error.response.status === 403) {
      console.error('Erro de autorização: Permissão negada para este recurso');
      // Aqui você pode implementar lógica adicional se necessário
    }
  }
  return Promise.reject(error);
};

// Configurar interceptor de requisição global (para compatibilidade com código existente)
axios.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Adicionar interceptor de resposta para tratamento de erros de autenticação
axios.interceptors.response.use(
  (response) => {
    return response;
  },
  handleResponseError
);

// Criar uma instância configurada do axios para importação em outros arquivos
export const api = axios.create({
  baseURL: API_BASE_URL,
});

// Aplicar os mesmos interceptores à instância api
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Usar a mesma função de tratamento de erro para o interceptor de resposta da API
api.interceptors.response.use(
  (response) => response,
  handleResponseError
);

// Configuração padrão para CORS e outros cabeçalhos comuns
api.defaults.withCredentials = true; // Permitir envio de cookies em requisições cross-origin se necessário

export default api;
