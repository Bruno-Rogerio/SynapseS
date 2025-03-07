// src/hooks/useForumChat.ts
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useWebSocket } from './useWebSocket';
import { ForumMessage, User } from '../types';

interface UseForumChatProps {
    forumId: string;
    currentUser: User;
}

export const useForumChat = ({ forumId, currentUser }: UseForumChatProps) => {
    const [messages, setMessages] = useState<ForumMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [isTyping, setIsTyping] = useState(false);

    const wsUrl = `${import.meta.env.VITE_WS_URL}/forum/${forumId}`;
    const { isConnected, sendMessage, socket } = useWebSocket(wsUrl);

    const fetchMessages = useCallback(async () => {
        setLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/forums/${forumId}/messages`, {
                withCredentials: true,
            });
            setMessages(response.data);
            setError('');
        } catch (err) {
            setError('Failed to fetch messages');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [forumId]);

    useEffect(() => {
        fetchMessages();
    }, [fetchMessages]);

    useEffect(() => {
        if (socket) {
            socket.onmessage = (event) => {
                const data = JSON.parse(event.data);
                switch (data.type) {
                    case 'new_message':
                        setMessages(prevMessages => [...prevMessages, data.message]);
                        break;
                    case 'update_message':
                        setMessages(prevMessages => prevMessages.map(message => message._id === data.message._id ? data.message : message));
                        break;
                    case 'delete_message':
                        setMessages(prevMessages => prevMessages.filter(message => message._id !== data.messageId));
                        break;
                    case 'typing':
                        if (data.userId !== currentUser._id) {
                            setIsTyping(true);
                            setTimeout(() => setIsTyping(false), 3000);
                        }
                        break;
                }
            };
        }
    }, [socket, currentUser._id]);

    const sendChatMessage = useCallback(async (content: string, replyTo?: string) => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/forums/${forumId}/messages`, {
                content,
                replyTo
            }, { withCredentials: true });
            sendMessage(JSON.stringify({ type: 'new_message', message: response.data }));
            return response.data;
        } catch (err) {
            console.error('Error sending message:', err);
            throw err;
        }
    }, [forumId, sendMessage]);

    const editChatMessage = useCallback(async (messageId: string, newContent: string) => {
        try {
            const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/api/forums/${forumId}/messages/${messageId}`, {
                content: newContent
            }, { withCredentials: true });
            sendMessage(JSON.stringify({ type: 'update_message', message: response.data }));
            return response.data;
        } catch (err) {
            console.error('Error editing message:', err);
            throw err;
        }
    }, [forumId, sendMessage]);

    const deleteChatMessage = useCallback(async (messageId: string) => {
        try {
            await axios.delete(`${import.meta.env.VITE_API_BASE_URL}/api/forums/${forumId}/messages/${messageId}`, { withCredentials: true });
            sendMessage(JSON.stringify({ type: 'delete_message', messageId }));
        } catch (err) {
            console.error('Error deleting message:', err);
            throw err;
        }
    }, [forumId, sendMessage]);

    const reactToChatMessage = useCallback(async (messageId: string, reactionType: 'like' | 'dislike') => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/forums/${forumId}/messages/${messageId}/reactions`, {
                type: reactionType
            }, { withCredentials: true });
            sendMessage(JSON.stringify({ type: 'update_message', message: response.data }));
            return response.data;
        } catch (err) {
            console.error('Error reacting to message:', err);
            throw err;
        }
    }, [forumId, sendMessage]);

    const notifyTyping = useCallback(() => {
        sendMessage(JSON.stringify({ type: 'typing', userId: currentUser._id }));
    }, [sendMessage, currentUser._id]);

    return {
        messages,
        loading,
        error,
        isTyping,
        isConnected,
        sendChatMessage,
        editChatMessage,
        deleteChatMessage,
        reactToChatMessage,
        notifyTyping
    };
};
