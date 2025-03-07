// src/hooks/useForums.ts
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Forum } from '../types';

export const useForums = () => {
    const [forums, setForums] = useState<Forum[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchForums = useCallback(async (pageNum: number = 1) => {
        setLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/forums`, {
                params: { page: pageNum, limit: 10 },
                withCredentials: true, // Importante para enviar cookies de autenticação
            });
            setForums(response.data.forums);
            setTotalPages(response.data.totalPages);
            setPage(pageNum);
            setError('');
        } catch (err) {
            setError('Failed to fetch forums');
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchForums();
    }, [fetchForums]);

    const refetchForums = useCallback(() => {
        fetchForums(page);
    }, [fetchForums, page]);

    return { forums, loading, error, page, totalPages, fetchForums, refetchForums };
};
