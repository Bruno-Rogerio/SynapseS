import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

interface Mission {
    id: string;
    title: string;
    progress: number;
    startDate: string;
}

const MissionList: React.FC = () => {
    const [missions, setMissions] = useState<Mission[]>([]);

    useEffect(() => {
        axios.get('/missions')
            .then(response => setMissions(response.data))
            .catch(err => console.error(err));
    }, []);

    return (
        <div>
            <h2>Lista de Missões</h2>
            <ul>
                {missions.map(m => (
                    <li key={m.id}>
                        <Link to={`/missions/${m.id}`}>
                            {m.title} - Progresso: {m.progress}%
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default MissionList;
