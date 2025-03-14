// src/hooks/useWebSocket.ts - versão ajustada com limites de reconexão
import { useState, useEffect, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

interface WebSocketOptions {
    token?: string;
    query?: Record<string, string>;
    auth?: Record<string, any>;
}

type WebSocketHook<T> = {
    isConnected: boolean;
    sendMessage: (event: string, message: T) => void;
    socket: Socket | null;
    lastMessage: T | null;
    error: string | null;
};

export const useWebSocket = <T = any>(
    url: string,
    options: WebSocketOptions = {}
): WebSocketHook<T> => {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState<T | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [permanentlyDisabled, setPermanentlyDisabled] = useState(false);

    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const reconnectAttemptsRef = useRef(0);
    const connectionAttemptedRef = useRef(false);
    const reconnectingRef = useRef(false);

    // Configurações ajustáveis
    const maxReconnectAttempts = 3; // Reduzido de 5 para 3
    const baseReconnectDelay = 3000; // Aumentado para 3 segundos iniciais
    const maxReconnectDelay = 30000; // 30 segundos máximo

    // Função para calcular o tempo de espera com backoff exponencial
    const getBackoffDelay = useCallback(() => {
        const attempt = reconnectAttemptsRef.current;
        // Fórmula: delay base * (2^tentativa) com um limite máximo
        return Math.min(baseReconnectDelay * Math.pow(2, attempt), maxReconnectDelay);
    }, []);

    const connect = useCallback(() => {
        // Não tente conectar se estiver permanentemente desabilitado
        if (permanentlyDisabled) {
            console.log('WebSocket permanently disabled due to multiple connection failures');
            return () => { };
        }

        // Verificar se a conexão deve ser habilitada através do parâmetro query
        if (options.query?.enabled === 'false') {
            console.log('WebSocket connection explicitly disabled by query parameter');
            return () => { };
        }

        // Verificar se auth contém userId antes de tentar conectar
        if (!options.auth?.userId) {
            console.log('Skipping WebSocket connection: no userId in auth object');
            setError('Autenticação necessária para conectar ao WebSocket');
            return () => { };
        }

        // Verificar se o userId é uma string vazia (indicando desativação)
        if (options.auth.userId === '') {
            console.log('WebSocket connection disabled: empty userId');
            return () => { };
        }

        // Evitar tentativas de conexão simultâneas
        if (connectionAttemptedRef.current || reconnectingRef.current) {
            console.log('Connection already in progress - preventing duplicate connections');
            return () => { };
        }

        connectionAttemptedRef.current = true;
        console.log('Attempting to connect to Socket.IO:', url);
        console.log('Socket.IO auth configuration:', options.auth);

        try {
            const newSocket = io(url, {
                auth: options.auth,
                query: options.query,
                transports: ['websocket'],
                timeout: 10000,
                reconnection: false, // Desabilitar reconexão automática do Socket.io
            });

            newSocket.on('connect', () => {
                console.log('Socket.IO connected successfully');
                setIsConnected(true);
                setError(null);
                reconnectAttemptsRef.current = 0;
                reconnectingRef.current = false;
                if (reconnectTimeoutRef.current) {
                    clearTimeout(reconnectTimeoutRef.current);
                    reconnectTimeoutRef.current = undefined;
                }
            });

            newSocket.on('disconnect', (reason) => {
                console.log('Socket.IO connection closed:', reason);
                setIsConnected(false);

                // Só tenta reconectar para razões específicas
                if (reason === 'io server disconnect' || reason === 'io client disconnect') {
                    // Se o servidor ou cliente desconectou explicitamente, não reconectar
                    console.log('Explicit disconnect, not attempting to reconnect');
                } else {
                    attemptReconnect();
                }
            });

            newSocket.on('connect_error', (err) => {
                console.error('Socket.IO connection error:', err.message);
                setError(err.message);
                // Não chamar attemptReconnect aqui, pois o disconnect já vai ser chamado
            });

            setSocket(newSocket);

            return () => {
                console.log('Cleaning up Socket.IO connection');
                connectionAttemptedRef.current = false;
                if (newSocket) {
                    newSocket.removeAllListeners();
                    newSocket.close();
                }
            };
        } catch (err) {
            console.error('Error creating Socket.IO instance:', err);
            connectionAttemptedRef.current = false;
            return () => { };
        }
    }, [url, options.auth, options.query, permanentlyDisabled]);

    const attemptReconnect = useCallback(() => {
        // Não tente reconectar se estiver permanentemente desabilitado
        if (permanentlyDisabled) {
            return;
        }

        // Se já estiver tentando reconectar, não inicie outra tentativa
        if (reconnectingRef.current) {
            console.log('Reconnection already in progress');
            return;
        }

        // Verificar se a conexão está desativada
        if (options.query?.enabled === 'false') {
            console.log('Reconnection aborted: connection disabled by query parameter');
            return;
        }

        // Verificar se temos userId válido antes de tentar reconectar
        if (!options.auth?.userId || options.auth?.userId === '') {
            console.log('Aborting reconnection: userId not available or empty');
            setError('Authentication required to connect to WebSocket');
            return;
        }

        // Limitar o número de tentativas
        if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
            console.error(`Max reconnection attempts (${maxReconnectAttempts}) reached. Disabling WebSocket.`);
            setError('Não foi possível conectar ao servidor após várias tentativas.');
            setPermanentlyDisabled(true);
            return;
        }

        reconnectingRef.current = true;
        reconnectAttemptsRef.current += 1;

        const delay = getBackoffDelay();
        console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`);

        // Limpar qualquer timeout anterior
        if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
        }

        reconnectTimeoutRef.current = setTimeout(() => {
            console.log('Executing reconnection attempt');
            if (socket) {
                socket.close();
                setSocket(null);
            }
            connectionAttemptedRef.current = false;
            reconnectingRef.current = false;
            connect();
        }, delay);
    }, [connect, options.auth, options.query, socket, getBackoffDelay, permanentlyDisabled]);

    useEffect(() => {
        const cleanup = connect();

        return () => {
            cleanup();
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connect]);

    // Botão de reset para reconexão manual (opcional)
    const resetConnection = useCallback(() => {
        if (permanentlyDisabled) {
            console.log('Resetting WebSocket connection state');
            setPermanentlyDisabled(false);
            reconnectAttemptsRef.current = 0;
            connectionAttemptedRef.current = false;
            reconnectingRef.current = false;

            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }

            if (socket) {
                socket.close();
                setSocket(null);
            }

            // Tentar reconectar após um pequeno delay
            setTimeout(() => {
                connect();
            }, 1000);
        }
    }, [permanentlyDisabled, socket, connect]);

    const sendMessage = useCallback((event: string, message: T) => {
        if (socket && isConnected) {
            console.log(`Sending Socket.IO message for event '${event}':`, message);
            socket.emit(event, message);
        } else {
            console.warn('Cannot send message, Socket.IO is not connected');
        }
    }, [socket, isConnected]);

    useEffect(() => {
        if (socket) {
            const handleMessage = (message: T) => {
                console.log('Socket.IO message received:', message);
                setLastMessage(message);
            };

            socket.onAny(handleMessage);

            return () => {
                socket.offAny(handleMessage);
            };
        }
    }, [socket]);

    return {
        isConnected,
        sendMessage,
        socket,
        lastMessage,
        error
    };
};
