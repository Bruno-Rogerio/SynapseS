// src/components/ForumChat.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    Box,
    TextField,
    IconButton,
    Avatar,
    Typography,
    Menu,
    MenuItem,
    Chip,
    Button,
    CircularProgress,
    Paper,
    Popover,
    Tooltip,
    Badge,
    Fade,
    Divider,
    useTheme,
    Theme,
    alpha,
    InputAdornment,
    Collapse,
    Card,
    Zoom,
} from '@mui/material';
import SendIcon from '@mui/icons-material/Send';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import ReplyIcon from '@mui/icons-material/Reply';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ThumbUpAltOutlinedIcon from '@mui/icons-material/ThumbUpAltOutlined';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownAltOutlinedIcon from '@mui/icons-material/ThumbDownAltOutlined';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import EmojiEmotionsOutlinedIcon from '@mui/icons-material/EmojiEmotionsOutlined';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import ImageIcon from '@mui/icons-material/Image';
import CloseIcon from '@mui/icons-material/Close';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import FormatBoldIcon from '@mui/icons-material/FormatBold';
import FormatItalicIcon from '@mui/icons-material/FormatItalic';
import CodeIcon from '@mui/icons-material/Code';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import EmojiPicker from 'emoji-picker-react';
import { ForumMessage, User } from '../types';
import { useForumChat } from '../hooks/useForumChat';
import { motion, AnimatePresence } from 'framer-motion';

interface ForumChatProps {
    forumId: string;
    currentUser: User;
}

// Interface para as props do MessageItem
interface MessageItemProps {
    message: ForumMessage;
    isOwnMessage: boolean;
    onReply: (messageId: string) => void;
    onReaction: (messageId: string, reaction: string) => void;
    onMenuOpen: (event: React.MouseEvent<HTMLButtonElement>, messageId: string, type: 'menu' | 'emoji') => void;
    currentUser: User;
    replyToMessage?: ForumMessage;
    onEdit: (messageId: string) => void;
    theme: Theme;
}

// Atualizada para incluir "custom" na normalização
const normalizeMessage = (msg: ForumMessage, fallbackAuthor: User): ForumMessage => {
    return {
        ...msg,
        author: msg.author || fallbackAuthor,
        reactions: {
            likes: Array.isArray(msg.reactions.likes) ? msg.reactions.likes : [],
            dislikes: Array.isArray(msg.reactions.dislikes) ? msg.reactions.dislikes : [],
            custom: Array.isArray(msg.reactions.custom) ? msg.reactions.custom : [],
        },
    };
};

// Função para formatar a data da mensagem
const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    if (diffMins < 1) return 'agora';
    if (diffMins < 60) return `${diffMins}m`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h`;
    if (date.toDateString() === now.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (now.getFullYear() === date.getFullYear()) {
        return date.toLocaleDateString([], { day: '2-digit', month: '2-digit' });
    }
    return date.toLocaleDateString();
};

// Componente de mensagem individual
const MessageItem: React.FC<MessageItemProps> = ({
    message,
    isOwnMessage,
    onReply,
    onReaction,
    onMenuOpen,
    currentUser,
    replyToMessage,
    onEdit,
    theme
}) => {
    const [showActions, setShowActions] = useState(false);
    const isEdited = message.updatedAt !== message.createdAt;
    const hasLiked = message.reactions.likes.some((reaction: any) => {
        // Caso reaction seja o próprio ID
        if (typeof reaction === 'string') return reaction === currentUser._id;
        // Caso reaction seja um objeto que contém o ID
        return Object.values(reaction).includes(currentUser._id);
    });
    const hasDisliked = message.reactions.dislikes.some((reaction: any) => {
        if (typeof reaction === 'string') return reaction === currentUser._id;
        return Object.values(reaction).includes(currentUser._id);
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <Box
                sx={{
                    display: 'flex',
                    flexDirection: isOwnMessage ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    mb: 2,
                    px: 0.5,
                }}
            >
                <Badge
                    color="success"
                    variant="dot"
                    overlap="circular"
                    anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                    sx={{
                        '& .MuiBadge-badge': {
                            boxShadow: `0 0 0 2px ${theme.palette.background.paper}`
                        },
                        ml: isOwnMessage ? 1.5 : 0,
                        mr: isOwnMessage ? 0 : 1.5,
                    }}
                >
                    <Avatar
                        alt={message.author.username}
                        // Uso do operador de acesso seguro com fallback
                        src={(message.author as any).avatar || ''}
                        sx={{ width: 38, height: 38 }}
                    >
                        {message.author.username?.[0]}
                    </Avatar>
                </Badge>
                <Box sx={{ maxWidth: '75%', position: 'relative' }}>
                    {/* Cabeçalho com nome e timestamp */}
                    <Box sx={{
                        display: 'flex',
                        justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                        alignItems: 'center',
                        mb: 0.3
                    }}>
                        <Typography variant="caption" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                            {isOwnMessage ? 'Você' : message.author.username}
                        </Typography>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ ml: 1, fontSize: '0.7rem' }}
                        >
                            {formatMessageTime(message.createdAt)}
                            {isEdited && (
                                <span style={{ marginLeft: 4, fontStyle: 'italic' }}>(editado)</span>
                            )}
                        </Typography>
                    </Box>
                    {/* Mensagem de resposta */}
                    {message.replyTo && replyToMessage && (
                        <Box
                            sx={{
                                borderLeft: `2px solid ${theme.palette.primary.main}`,
                                pl: 1,
                                py: 0.5,
                                mb: 0.5,
                                borderRadius: 0.5,
                                bgcolor: alpha(theme.palette.primary.main, 0.05),
                                fontSize: '0.75rem',
                                maxHeight: '60px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <Typography
                                    variant="caption"
                                    sx={{
                                        fontWeight: 'bold',
                                        color: theme.palette.primary.main
                                    }}
                                >
                                    {replyToMessage.author._id === currentUser._id ? 'Você' : replyToMessage.author.username}
                                </Typography>
                            </Box>
                            <Typography variant="caption" color="text.secondary" noWrap>
                                {replyToMessage.content.slice(0, 100)}
                                {replyToMessage.content.length > 100 ? '...' : ''}
                            </Typography>
                        </Box>
                    )}
                    {/* Conteúdo da mensagem */}
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 2,
                            bgcolor: isOwnMessage
                                ? alpha(theme.palette.primary.main, 0.9)
                                : theme.palette.mode === 'dark'
                                    ? alpha(theme.palette.grey[800], 0.8)
                                    : alpha(theme.palette.grey[100], 0.8),
                            color: isOwnMessage ? 'white' : 'text.primary',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                            borderTopLeftRadius: !isOwnMessage ? 0 : undefined,
                            borderTopRightRadius: isOwnMessage ? 0 : undefined,
                            wordBreak: 'break-word',
                        }}
                    >
                        <Typography variant="body2" sx={{ lineHeight: 1.5 }}>
                            {message.content}
                        </Typography>
                    </Box>
                    {/* Área de reações */}
                    <Box
                        sx={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 0.5,
                            mt: 0.5,
                            justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                        }}
                    >
                        {message.reactions.likes.length > 0 && (
                            <Chip
                                icon={<ThumbUpIcon fontSize="small" />}
                                label={message.reactions.likes.length}
                                size="small"
                                color={hasLiked ? "primary" : "default"}
                                onClick={() => onReaction(message._id, 'like')}
                                sx={{
                                    height: 24,
                                    fontSize: '0.7rem',
                                    '& .MuiChip-icon': { fontSize: '0.9rem' }
                                }}
                            />
                        )}
                        {message.reactions.dislikes.length > 0 && (
                            <Chip
                                icon={<ThumbDownIcon fontSize="small" />}
                                label={message.reactions.dislikes.length}
                                size="small"
                                color={hasDisliked ? "error" : "default"}
                                onClick={() => onReaction(message._id, 'dislike')}
                                sx={{
                                    height: 24,
                                    fontSize: '0.7rem',
                                    '& .MuiChip-icon': { fontSize: '0.9rem' }
                                }}
                            />
                        )}
                        {Array.isArray(message.reactions.custom) && message.reactions.custom.map((r: any, index: number) => (
                            <Chip
                                key={index}
                                label={r.emoji}
                                size="small"
                                sx={{
                                    height: 24,
                                    fontSize: '0.85rem',
                                    px: 0.5
                                }}
                            />
                        ))}
                    </Box>
                    {/* Menu de ações - aparece ao passar o mouse */}
                    <Fade in={showActions}>
                        <Box
                            sx={{
                                position: 'absolute',
                                top: '-20px',
                                [isOwnMessage ? 'left' : 'right']: 0,
                                bgcolor: theme.palette.background.paper,
                                borderRadius: '20px',
                                boxShadow: theme.shadows[2],
                                display: 'flex',
                                zIndex: 2,
                            }}
                        >
                            <Tooltip title="Responder">
                                <IconButton
                                    size="small"
                                    onClick={() => onReply(message._id)}
                                    sx={{ width: 28, height: 28 }}
                                >
                                    <ReplyIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Curtir">
                                <IconButton
                                    size="small"
                                    onClick={() => onReaction(message._id, 'like')}
                                    color={hasLiked ? "primary" : "default"}
                                    sx={{ width: 28, height: 28 }}
                                >
                                    {hasLiked ? (
                                        <ThumbUpIcon fontSize="small" />
                                    ) : (
                                        <ThumbUpAltOutlinedIcon fontSize="small" />
                                    )}
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Não curtir">
                                <IconButton
                                    size="small"
                                    onClick={() => onReaction(message._id, 'dislike')}
                                    color={hasDisliked ? "error" : "default"}
                                    sx={{ width: 28, height: 28 }}
                                >
                                    {hasDisliked ? (
                                        <ThumbDownIcon fontSize="small" />
                                    ) : (
                                        <ThumbDownAltOutlinedIcon fontSize="small" />
                                    )}
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Adicionar emoji">
                                <IconButton
                                    size="small"
                                    onClick={(e) => onMenuOpen(e, message._id, 'emoji')}
                                    sx={{ width: 28, height: 28 }}
                                >
                                    <EmojiEmotionsOutlinedIcon fontSize="small" />
                                </IconButton>
                            </Tooltip>
                            {isOwnMessage && (
                                <>
                                    <Tooltip title="Editar">
                                        <IconButton
                                            size="small"
                                            onClick={() => onEdit(message._id)}
                                            sx={{ width: 28, height: 28 }}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                    <Tooltip title="Mais opções">
                                        <IconButton
                                            size="small"
                                            onClick={(e) => onMenuOpen(e, message._id, 'menu')}
                                            sx={{ width: 28, height: 28 }}
                                        >
                                            <MoreVertIcon fontSize="small" />
                                        </IconButton>
                                    </Tooltip>
                                </>
                            )}
                        </Box>
                    </Fade>
                </Box>
            </Box>
        </motion.div>
    );
};

const ForumChat: React.FC<ForumChatProps> = ({ forumId, currentUser }) => {
    const theme = useTheme();
    const {
        messages,
        loading,
        error,
        isTyping,
        isConnected,
        sendChatMessage,
        editChatMessage,
        deleteChatMessage,
        reactToChatMessage,
        notifyTyping,
        loadMoreMessages,
        hasMoreMessages,
    } = useForumChat({ forumId, currentUser });
    const [newMessage, setNewMessage] = useState('');
    const [editingMessage, setEditingMessage] = useState<string | null>(null);
    const [replyingTo, setReplyingTo] = useState<string | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [menuType, setMenuType] = useState<'menu' | 'emoji'>('menu');
    const [selectedMessage, setSelectedMessage] = useState<string | null>(null);
    const [showScrollButton, setShowScrollButton] = useState(false);
    const [showFormatting, setShowFormatting] = useState(false);
    const messagesContainerRef = useRef<HTMLDivElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const lastScrollPosition = useRef<number>(0);
    const inputRef = useRef<HTMLInputElement>(null);
    // Estado local para atualização otimista
    const [localMessages, setLocalMessages] = useState<ForumMessage[]>([]);
    // Estado para o EmojiPicker
    const [anchorElEmoji, setAnchorElEmoji] = useState<null | HTMLElement>(null);
    // Atualiza o estado local quando as mensagens mudam
    useEffect(() => {
        setLocalMessages(messages.map((msg) => normalizeMessage(msg, currentUser)));
    }, [messages, currentUser]);
    // Ordena as mensagens do mais antigo para o mais recente
    const orderedMessages = localMessages
        .filter((m) => m && m._id && m.author)
        .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    // Obtém a mensagem original sendo respondida
    const replyToMessage = replyingTo
        ? orderedMessages.find(m => m._id === replyingTo)
        : null;
    // Função para detectar se o usuário rolou para longe do final
    const handleScroll = useCallback(() => {
        if (!messagesContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
        const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
        setShowScrollButton(!isNearBottom);
        lastScrollPosition.current = scrollTop;
    }, []);
    // Monitorar o scroll
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            container.addEventListener('scroll', handleScroll);
            return () => container.removeEventListener('scroll', handleScroll);
        }
    }, [handleScroll]);
    // Rolar para o final quando novas mensagens chegarem
    useEffect(() => {
        const container = messagesContainerRef.current;
        if (container) {
            // Só rola automaticamente se o usuário estiver próximo do final
            const { scrollTop, scrollHeight, clientHeight } = container;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 200;
            if (isNearBottom) {
                scrollToBottom();
            }
        }
    }, [orderedMessages.length]);
    // Rolar para o final quando a conversa é carregada inicialmente
    useEffect(() => {
        if (!loading && orderedMessages.length > 0) {
            scrollToBottom();
        }
    }, [loading, orderedMessages.length > 0]);
    // Função para rolar até o final
    const scrollToBottom = useCallback(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);
    // Handler para abrir menu de opções (emojis ou ações)
    const handleMenuOpen = useCallback((
        event: React.MouseEvent<HTMLButtonElement>,
        messageId: string,
        type: 'menu' | 'emoji' = 'menu'
    ) => {
        setAnchorEl(event.currentTarget);
        setSelectedMessage(messageId);
        setMenuType(type);
    }, []);
    // Fechar menu
    const handleMenuClose = useCallback(() => {
        setAnchorEl(null);
        setSelectedMessage(null);
    }, []);
    // Enviar mensagem
    const handleSendMessage = useCallback(
        async (e: React.FormEvent) => {
            e.preventDefault();
            if (!newMessage.trim()) return;
            try {
                // Mensagem otimista para feedback imediato
                const optimisticMessage: ForumMessage = {
                    _id: 'temp-' + Date.now(),
                    content: newMessage,
                    author: currentUser,
                    forum: forumId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    reactions: { likes: [], dislikes: [], custom: [] },
                    ...(replyingTo ? { replyTo: replyingTo } : {}),
                };
                setLocalMessages((prev) => [...prev, optimisticMessage]);
                const sentMessage = await sendChatMessage(newMessage, replyingTo || undefined);
                // Atualiza a mensagem otimista com a real
                const normalizedSent = normalizeMessage(sentMessage, currentUser);
                setLocalMessages((prev) =>
                    prev.map((msg) => (msg._id === optimisticMessage._id ? normalizedSent : msg))
                );
                setNewMessage('');
                setReplyingTo(null);
                setShowFormatting(false);
                scrollToBottom();
            } catch (err) {
                console.error('Error sending message:', err);
                // Aqui poderia adicionar um snackbar de erro
            }
        },
        [newMessage, replyingTo, sendChatMessage, currentUser, forumId, scrollToBottom]
    );
    // Função para editar mensagem
    const handleEditMessage = useCallback(
        async (messageId: string, newContent: string) => {
            if (!newContent.trim()) return;
            try {
                const updated = await editChatMessage(messageId, newContent);
                setLocalMessages((prev) =>
                    prev.map((m) => (m._id === messageId ? normalizeMessage(updated, currentUser) : m))
                );
                setEditingMessage(null);
            } catch (err) {
                console.error('Error editing message:', err);
            }
        },
        [editChatMessage, currentUser]
    );
    // Função para excluir mensagem
    const handleDeleteMessage = useCallback(
        async (messageId: string) => {
            try {
                await deleteChatMessage(messageId);
                setLocalMessages((prev) => prev.filter((m) => m._id !== messageId));
            } catch (err) {
                console.error('Error deleting message:', err);
            }
        },
        [deleteChatMessage]
    );
    // Função para reagir a mensagem
    const handleReaction = useCallback(
        async (messageId: string, reaction: string) => {
            try {
                const updated = await reactToChatMessage(messageId, reaction);
                setLocalMessages((prev) =>
                    prev.map((m) => (m._id === messageId ? normalizeMessage(updated, currentUser) : m))
                );
            } catch (err) {
                console.error('Error reacting to message:', err);
            }
        },
        [reactToChatMessage, currentUser]
    );
    // Notificar digitação
    const handleTyping = useCallback(() => {
        notifyTyping();
    }, [notifyTyping]);
    // Funções para EmojiPicker
    const openEmojiPicker = useCallback((event: React.MouseEvent<HTMLElement>) => {
        setAnchorElEmoji(event.currentTarget);
    }, []);
    const closeEmojiPicker = useCallback(() => {
        setAnchorElEmoji(null);
    }, []);
    const handleEmojiSelect = useCallback(
        (emojiData: any) => {
            setNewMessage((prev) => prev + emojiData.emoji);
            closeEmojiPicker();
            if (inputRef.current) {
                inputRef.current.focus();
            }
        },
        [closeEmojiPicker]
    );
    // Formatação de texto - insere marcação Markdown
    const insertFormatting = useCallback((format: string) => {
        if (!inputRef.current) return;
        const input = inputRef.current;
        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const selectedText = newMessage.substring(start, end);
        let formattedText = '';
        switch (format) {
            case 'bold':
                formattedText = `**${selectedText || 'texto em negrito'}**`;
                break;
            case 'italic':
                formattedText = `*${selectedText || 'texto em itálico'}*`;
                break;
            case 'code':
                formattedText = `\`${selectedText || 'código'}\``;
                break;
            case 'quote':
                formattedText = `> ${selectedText || 'citação'}`;
                break;
            default:
                formattedText = selectedText;
        }
        const newValue =
            newMessage.substring(0, start) +
            formattedText +
            newMessage.substring(end);
        setNewMessage(newValue);
        // Timer para permitir que o estado seja atualizado antes de focar
        setTimeout(() => {
            input.focus();
            input.setSelectionRange(
                start + formattedText.length,
                start + formattedText.length
            );
        }, 10);
    }, [newMessage]);
    // Componente para estados de loading e erro
    const renderLoadingOrError = () => {
        if (loading && localMessages.length === 0) {
            return (
                <Box sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 3
                }}>
                    <CircularProgress size={40} thickness={4} />
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                        Carregando mensagens...
                    </Typography>
                </Box>
            );
        }
        if (error) {
            return (
                <Box sx={{
                    p: 3,
                    textAlign: 'center',
                    border: `1px solid ${theme.palette.error.light}`,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.error.light, 0.1),
                    color: theme.palette.error.main,
                }}>
                    <Typography variant="body2">{error}</Typography>
                    <Button
                        color="error"
                        variant="outlined"
                        sx={{ mt: 2, fontSize: '0.8rem' }}
                    >
                        Tentar novamente
                    </Button>
                </Box>
            );
        }
        if (!isConnected) {
            return (
                <Box sx={{
                    p: 3,
                    textAlign: 'center',
                    border: `1px solid ${theme.palette.warning.light}`,
                    borderRadius: 1,
                    bgcolor: alpha(theme.palette.warning.light, 0.1),
                }}>
                    <Typography variant="body2" color="text.secondary">
                        <CircularProgress size={16} sx={{ mr: 1, verticalAlign: 'text-bottom' }} />
                        Conectando ao chat...
                    </Typography>
                </Box>
            );
        }
        return null;
    };
    return (
        <Paper
            elevation={0}
            sx={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                bgcolor: 'background.default',
                border: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
                borderRadius: 2,
                overflow: 'hidden',
            }}
        >
            {/* Resto do componente continua sem alterações... */}
            {/* (omitido para brevidade) */}
        </Paper>
    );
};

export default ForumChat;
