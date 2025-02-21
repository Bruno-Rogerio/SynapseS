import React from 'react';

interface Task {
    id: string;
    title: string;
    status: 'pendente' | 'em-progresso' | 'concluida';
    assignedTo: string;
}

interface MissionTimelineProps {
    tasks: Task[];
}

const statusColor = {
    'pendente': '#f39c12',
    'em-progresso': '#3498db',
    'concluida': '#2ecc71'
};

const MissionTimeline: React.FC<MissionTimelineProps> = ({ tasks }) => {
    // Garante que tasks é um array antes de chamar .map
    if (!Array.isArray(tasks)) {
        return <p>Nenhuma missão encontrada</p>;
    }

    // Definição do mapeamento de status para cores
    const statusColor: { [key: string]: string } = {
        "pendente": "#f39c12",
        "em andamento": "#3498db",
        "concluído": "#2ecc71",
        "atrasado": "#e74c3c"
    };

    return (
        <div style={{ position: 'relative', margin: '20px 0', paddingLeft: '20px', borderLeft: '2px solid #ccc' }}>
            {tasks.map(task => (
                <div key={task.id} style={{ position: 'relative', marginBottom: '20px' }}>
                    <div
                        style={{
                            position: 'absolute',
                            left: '-11px',
                            top: '0',
                            width: '20px',
                            height: '20px',
                            backgroundColor: statusColor[task.status] || '#bdc3c7', // Cor padrão se o status não estiver no objeto
                            borderRadius: '50%',
                            border: '2px solid #fff'
                        }}
                    />
                    <div style={{ marginLeft: '20px' }}>
                        <strong>{task.title}</strong> <em>({task.status})</em>
                        <p>Atribuído a: {task.assignedTo}</p>
                    </div>
                </div>
            ))}
        </div>
    );
};


export default MissionTimeline;
