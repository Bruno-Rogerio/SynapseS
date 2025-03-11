// src/hooks/useForumChat.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useWebSocket } from './useWebSocket';
import { ForumMessage, User, WebSocketMessage } from '../types';

interface UseForumChatProps {
    forumId: string;
    currentUser: User;
}

export const useForumChat = ({ forumId, currentUser }: UseForumChatProps) => {
    const [messages, setMessages] = useState<ForumMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);

    const wsUrl = import.meta.env.VITE_WS_URL; // Ex: ws://localhost:5000
    console.log('WebSocket URL:', `${wsUrl}/forum`);

    // Memoriza o objeto de query para evitar que ele seja recriado a cada renderização
    const query = useMemo(() => ({ forumId }), [forumId]);

    const { isConnected, sendMessage, lastMessage, error: wsError } = useWebSocket<WebSocketMessage>(`${wsUrl}/forum`, {
        token: currentUser.token || '',
        query,
    });

    const fetchMessages = useCallback(async (page = 1) => {
        console.log('Fetching messages for page:', page);
        setLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/forums/${forumId}/messages`, {
                params: { page, limit: 50 },
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });
            console.log('Messages received:', response.data);
            if (page === 1) {
                setMessages(response.data.messages);
            } else {
                setMessages(prevMessages => [...prevMessages, ...response.data.messages]);
            }
            setCurrentPage(page);
            setHasMoreMessages(page < response.data.totalPages);
            setError('');
        } catch (err) {
            console.error('Error fetching messages:', err);
            if (axios.isAxiosError(err)) {
                setError(`Failed to fetch messages: ${err.response?.data?.message || err.message}`);
            } else {
                setError('An unknown error occurred while fetching messages');
            }
        } finally {
            setLoading(false);
        }
    }, [forumId, currentUser.token]);

    useEffect(() => {
        console.log('Initial fetch of messages');
        fetchMessages();
    }, [fetchMessages]);

    useEffect(() => {
        console.log('WebSocket connection status:', isConnected);
        if (isConnected) {
            console.log('WebSocket connected successfully');
        } else {
            console.log('WebSocket not connected');
        }
    }, [isConnected]);

    useEffect(() => {
        if (lastMessage) {
            console.log('WebSocket message received:', lastMessage);
            switch (lastMessage.type) {
                case 'new_message':
                    setMessages(prevMessages => [lastMessage.message, ...prevMessages]);
                    break;
                case 'update_message':
                    setMessages(prevMessages =>
                        prevMessages.map(message =>
                            message._id === lastMessage.message._id ? lastMessage.message : message
                        )
                    );
                    break;
                case 'delete_message':
                    setMessages(prevMessages =>
                        prevMessages.filter(message => message._id !== lastMessage.messageId)
                    );
                    break;
                case 'typing':
                    if (lastMessage.userId !== currentUser._id) {
                        setIsTyping(true);
                        setTimeout(() => setIsTyping(false), 3000);
                    }
                    break;
                default:
                    console.warn('Unknown message type received:', lastMessage.type);
            }
        }
    }, [lastMessage, currentUser._id]);

    const sendChatMessage = useCallback(async (content: string, replyTo?: string) => {
        console.log('Sending chat message:', { content, replyTo });
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/forums/${forumId}/messages`, {
                content,
                replyTo,
            }, {
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });
            console.log('Message sent, response:', response.data);
            sendMessage('new_message', { type: 'new_message', message: response.data });
            return response.data;
        } catch (err) {
            console.error('Error sending message:', err);
            throw err;
        }
    }, [forumId, sendMessage, currentUser.token]);

    const editChatMessage = useCallback(async (messageId: string, newContent: string) => {
        console.log('Editing chat message:', { messageId, newContent });
        try {
            const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/forums/${forumId}/messages/${messageId}`, {
                content: newContent,
            }, {
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });
            console.log('Message edited, response:', response.data);
            sendMessage('update_message', { type: 'update_message', message: response.data });
            return response.data;
        } catch (err) {
            console.error('Error editing message:', err);
            throw err;
        }
    }, [forumId, sendMessage, currentUser.token]);

    const deleteChatMessage = useCallback(async (messageId: string) => {
        console.log('Deleting chat message:', messageId);
        try {
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/forums/${forumId}/messages/${messageId}`, {
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });
            console.log('Message deleted');
            sendMessage('delete_message', { type: 'delete_message', messageId });
        } catch (err) {
            console.error('Error deleting message:', err);
            throw err;
        }
    }, [forumId, sendMessage, currentUser.token]);

    // Atualizado para aceitar um parâmetro do tipo string (emoji)
    const reactToChatMessage = useCallback(async (messageId: string, reaction: string): Promise<ForumMessage> => {
        console.log('Reacting to chat message:', { messageId, reaction });
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/forums/${forumId}/messages/${messageId}/react`, {
                emoji: reaction,
            }, {
                headers: { Authorization: `Bearer ${currentUser.token}` },
            });
            console.log('Reaction sent, response:', response.data);
            sendMessage('update_message', { type: 'update_message', message: response.data });
            return response.data;
        } catch (err) {
            console.error('Error reacting to message:', err);
            throw err;
        }
    }, [forumId, sendMessage, currentUser.token]);

    const notifyTyping = useCallback(() => {
        console.log('Notifying typing');
        sendMessage('typing', { type: 'typing', userId: currentUser._id, username: currentUser.username });
    }, [sendMessage, currentUser._id, currentUser.username]);

    const loadMoreMessages = useCallback(() => {
        console.log('Loading more messages');
        if (hasMoreMessages && !loading) {
            fetchMessages(currentPage + 1);
        }
    }, [hasMoreMessages, loading, currentPage, fetchMessages]);

    console.log('useForumChat state:', {
        messagesCount: messages.length,
        loading,
        error,
        wsError,
        isConnected,
        hasMoreMessages,
    });

    return {
        messages,
        loading,
        error: error || wsError,
        isTyping,
        isConnected,
        sendChatMessage,
        editChatMessage,
        deleteChatMessage,
        reactToChatMessage,
        notifyTyping,
        loadMoreMessages,
        hasMoreMessages,
    };
};
