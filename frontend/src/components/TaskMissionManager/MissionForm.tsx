import React, { useState } from 'react';
import axios from 'axios';

const MissionForm: React.FC = () => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [leader, setLeader] = useState('');
    const [members, setMembers] = useState('');
    const [tasks, setTasks] = useState<{ title: string; assignedTo: string }[]>([]);
    const [startDate, setStartDate] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const membersArray = members.split(',').map(m => m.trim());
        axios.post('/missions', {
            title,
            description,
            leader,
            members: membersArray,
            tasks,
            startDate
        })
            .then(response => {
                alert('Missão criada com sucesso!');
                // Aqui você pode redirecionar ou limpar os campos
            })
            .catch(err => {
                console.error(err);
                alert('Erro ao criar missão');
            });
    };

    return (
        <form onSubmit={handleSubmit}>
            <div>
                <label>Título da Missão:</label>
                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div>
                <label>Descrição:</label>
                <textarea value={description} onChange={e => setDescription(e.target.value)} required />
            </div>
            <div>
                <label>Líder:</label>
                <input type="text" value={leader} onChange={e => setLeader(e.target.value)} required />
            </div>
            <div>
                <label>Membros (separados por vírgula):</label>
                <input type="text" value={members} onChange={e => setMembers(e.target.value)} required />
            </div>
            <div>
                <label>Data de Início:</label>
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            <div>
                <h4>Adicionar Tarefa Inicial</h4>
                <input type="text" placeholder="Título da Tarefa" onBlur={e => {
                    if (e.target.value) {
                        setTasks([...tasks, { title: e.target.value, assignedTo: '' }]);
                    }
                }} />
            </div>
            <button type="submit">Criar Missão</button>
        </form>
    );
};

export default MissionForm;
