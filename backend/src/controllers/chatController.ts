import { Request, Response } from 'express';
import ChatMessage, { IChatMessage } from '../models/ChatMessage';
import { Types } from 'mongoose';

export const getChatMessages = async (req: Request, res: Response): Promise<void> => {
    try {
        const { missionId } = req.params;
        const messages = await ChatMessage.find({ missionId: new Types.ObjectId(missionId) }).sort({ createdAt: 1 });
        res.status(200).json(messages);
    } catch (error) {
        console.error('Erro ao buscar mensagens de chat:', error);
        res.status(500).json({ error: 'Erro ao buscar mensagens de chat' });
    }
};

export const postChatMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { missionId } = req.params;
        const { userId, username, message, fileUrl, replyTo } = req.body;
        const newMessage: IChatMessage = new ChatMessage({
            missionId: new Types.ObjectId(missionId),
            userId,
            username,
            message,
            fileUrl,
            reactions: {},
            replyTo: replyTo ? {
                messageId: new Types.ObjectId(replyTo.messageId),
                userId: replyTo.userId,
                username: replyTo.username,
                message: replyTo.message,
            } : undefined,
        });
        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (error) {
        console.error('Erro ao criar mensagem de chat:', error);
        res.status(500).json({ error: 'Erro ao criar mensagem de chat' });
    }
};

export const reactToChatMessage = async (req: Request, res: Response): Promise<void> => {
    try {
        const { missionId, messageId } = req.params;
        const { emoji, userId } = req.body;
        const chatMessage = await ChatMessage.findById(messageId);
        if (!chatMessage) {
            res.status(404).json({ error: 'Mensagem de chat não encontrada' });
            return;
        }
        // Para simplificar, incrementamos o contador para o emoji selecionado.
        const currentCount = chatMessage.reactions[emoji] || 0;
        chatMessage.reactions[emoji] = currentCount + 1;
        await chatMessage.save();
        res.status(200).json(chatMessage);
    } catch (error) {
        console.error('Erro ao reagir à mensagem de chat:', error);
        res.status(500).json({ error: 'Erro ao reagir à mensagem de chat' });
    }
};

// Novo método para buscar uma mensagem específica (útil para carregar detalhes de uma resposta)
export const getChatMessageById = async (req: Request, res: Response): Promise<void> => {
    try {
        const { messageId } = req.params;
        const message = await ChatMessage.findById(messageId);
        if (!message) {
            res.status(404).json({ error: 'Mensagem de chat não encontrada' });
            return;
        }
        res.status(200).json(message);
    } catch (error) {
        console.error('Erro ao buscar mensagem de chat:', error);
        res.status(500).json({ error: 'Erro ao buscar mensagem de chat' });
    }
};
