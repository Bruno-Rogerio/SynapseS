import React, { useEffect, useState } from 'react';
import axios from 'axios';
import MissionTimeline from './MissionTimeline';

interface Task {
    id: string;
    title: string;
    status: 'pendente' | 'em-progresso' | 'concluida';
    assignedTo: string;
}

interface Mission {
    id: string;
    title: string;
    description: string;
    leader: string;
    members: string[];
    tasks: Task[];
    startDate: string;
    endDate?: string;
    progress: number;
}

interface MissionDetailsProps {
    missionId: string;
}

const MissionDetails: React.FC<MissionDetailsProps> = ({ missionId }) => {
    const [mission, setMission] = useState<Mission | null>(null);

    useEffect(() => {
        axios.get(`/missions/${missionId}`)
            .then(response => setMission(response.data))
            .catch(err => console.error(err));
    }, [missionId]);

    if (!mission) return <p>Carregando missão...</p>;

    return (
        <div>
            <h2>{mission.title}</h2>
            <p>{mission.description}</p>
            <p><strong>Líder:</strong> {mission.leader}</p>
            <div>
                <label>Progresso:</label>
                <progress value={mission.progress} max={100}></progress> {mission.progress}%
            </div>
            <h3>Tarefas</h3>
            <MissionTimeline tasks={mission.tasks} />
        </div>
    );
};

export default MissionDetails;
