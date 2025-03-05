// src/hooks/useForums.ts
import { useState, useEffect } from 'react';
import axios from 'axios';
import { Forum } from '../types';

export const useForums = () => {
    const [forums, setForums] = useState<Forum[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchForums = async (pageNum: number = 1) => {
        setLoading(true);
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/forums`, {
                params: { page: pageNum, limit: 10 },
            });
            console.log('API response:', response.data); // Log da resposta
            setForums(response.data.forums || []);
            setTotalPages(response.data.totalPages || 1);
            setPage(pageNum);
            setError('');
        } catch (err) {
            console.error('Error fetching forums:', err);
            setError('Failed to fetch forums');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchForums();
    }, []);

    return { forums, loading, error, page, totalPages, fetchForums };
};
