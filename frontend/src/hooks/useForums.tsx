// hooks/useForums.tsx
import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Forum } from '../types';

// Defina a URL base fora do componente para evitar problemas de tipagem
// @ts-ignore - Ignora verificação de tipos para import.meta.env
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

type SortType = 'recent' | 'popular' | 'activity' | 'messages';
type FilterType = 'all' | 'popular' | 'recent' | 'following';

export const useForums = (initialPage = 1) => {
    const [forums, setForums] = useState<Forum[]>([]);
    const [filteredForums, setFilteredForums] = useState<Forum[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState<number>(initialPage);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentSort, setCurrentSort] = useState<SortType>('recent');
    const [currentFilter, setCurrentFilter] = useState<FilterType>('all');

    // Função para carregar fóruns com parâmetros
    const fetchForums = useCallback(async (pageNum = 1, sort: SortType = currentSort, filter: FilterType = currentFilter) => {
        setLoading(true);
        setError(null);
        try {
            // Na API real, você enviaria os parâmetros de ordenação e filtragem
            // Neste exemplo, vamos ordenar e filtrar no cliente
            const response = await axios.get(
                `${API_BASE_URL}/api/forums?page=${pageNum}`,
                { withCredentials: true }
            );
            if (response.data) {
                setForums(response.data.forums || []);
                setTotalPages(response.data.totalPages || 1);
                setPage(pageNum);
                setCurrentSort(sort);
                setCurrentFilter(filter);
            }
        } catch (err) {
            console.error('Erro ao carregar fóruns:', err);
            if (axios.isAxiosError(err)) {
                setError(err.response?.data?.message || 'Erro ao carregar fóruns');
            } else {
                setError('Erro desconhecido ao carregar fóruns');
            }
        } finally {
            setLoading(false);
        }
    }, [currentSort, currentFilter]);

    // Efeito para aplicar ordenação e filtragem aos fóruns carregados
    useEffect(() => {
        if (!forums.length) return;
        let result = [...forums];

        // Aplicar filtragem
        if (currentFilter === 'popular') {
            result = result.filter(forum => forum.viewCount > 50 || forum.followers.length > 5);
        } else if (currentFilter === 'recent') {
            // Ordena por data de criação, presumindo que há uma propriedade createdAt
            result = result.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        } else if (currentFilter === 'following' && localStorage.getItem('userId')) {
            // Filtra apenas fóruns que o usuário segue
            const userId = localStorage.getItem('userId');
            result = result.filter(forum => forum.followers.includes(userId as string));
        }

        // Aplicar ordenação
        if (currentSort === 'recent') {
            result = result.sort((a, b) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
        } else if (currentSort === 'popular') {
            result = result.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        } else if (currentSort === 'activity') {
            result = result.sort((a, b) =>
                new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
            );
        } else if (currentSort === 'messages') {
            result = result.sort((a, b) => (b.messageCount || 0) - (a.messageCount || 0));
        }

        // Aplicar termo de pesquisa
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(forum =>
                forum.title.toLowerCase().includes(term) ||
                forum.description.toLowerCase().includes(term) ||
                forum.tags.some(tag => tag.toLowerCase().includes(term))
            );
        }

        setFilteredForums(result);
    }, [forums, currentSort, currentFilter, searchTerm]);

    const refetchForums = useCallback(() => {
        fetchForums(page, currentSort, currentFilter);
    }, [fetchForums, page, currentSort, currentFilter]);

    // Efeito inicial para carregar fóruns
    useEffect(() => {
        fetchForums(initialPage);
    }, [fetchForums, initialPage]);

    const changeSort = useCallback((sort: SortType) => {
        setCurrentSort(sort);
        fetchForums(1, sort, currentFilter);
    }, [fetchForums, currentFilter]);

    const changeFilter = useCallback((filter: FilterType) => {
        setCurrentFilter(filter);
        fetchForums(1, currentSort, filter);
    }, [fetchForums, currentSort]);

    const search = useCallback((term: string) => {
        setSearchTerm(term);
    }, []);

    return {
        forums: filteredForums,
        allForums: forums,
        loading,
        error,
        page,
        totalPages,
        fetchForums,
        refetchForums,
        changeSort,
        changeFilter,
        search,
        searchTerm,
        currentSort,
        currentFilter
    };
};
