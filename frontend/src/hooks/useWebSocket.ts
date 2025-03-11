import { useState, useEffect, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

interface WebSocketOptions {
    token?: string;
    query?: Record<string, string>;
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
    const reconnectTimeoutRef = useRef<NodeJS.Timeout>();
    const reconnectAttemptsRef = useRef(0);
    const maxReconnectAttempts = 5;

    const connect = useCallback(() => {
        console.log('Attempting to connect to Socket.IO:', url);
        const newSocket = io(url, {
            auth: options.token ? { token: options.token } : undefined,
            query: options.query,
            transports: ['websocket'],
            // reconnection: false, // We'll handle reconnection manually
            timeout: 10000, // Increase timeout to 10 seconds
        });

        newSocket.on('connect', () => {
            console.log('Socket.IO connected successfully');
            setIsConnected(true);
            setError(null);
            reconnectAttemptsRef.current = 0;
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        });

        newSocket.on('disconnect', (reason) => {
            console.log('Socket.IO connection closed:', reason);
            setIsConnected(false);
            attemptReconnect();
        });

        newSocket.on('connect_error', (error: Error) => {
            console.error('Socket.IO connection error:', error);
            setError(error.message);
            attemptReconnect();
        });

        setSocket(newSocket);

        return () => {
            console.log('Cleaning up Socket.IO connection');
            newSocket.close();
        };
    }, [url, options.token, options.query]);

    const attemptReconnect = useCallback(() => {
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
            reconnectAttemptsRef.current += 1;
            const delay = Math.min(1000 * 2 ** reconnectAttemptsRef.current, 30000);
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);
            reconnectTimeoutRef.current = setTimeout(() => {
                connect();
            }, delay);
        } else {
            console.error('Max reconnection attempts reached');
            setError('Unable to connect to the server. Please try again later.');
        }
    }, [connect]);

    useEffect(() => {
        const cleanup = connect();
        return () => {
            cleanup();
            if (reconnectTimeoutRef.current) {
                clearTimeout(reconnectTimeoutRef.current);
            }
        };
    }, [connect]);

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

    return { isConnected, sendMessage, socket, lastMessage, error };
};
