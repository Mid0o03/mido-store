import React from 'react';
import { useFreelance } from '../context/FreelanceContext';

const KanbanBoard = ({ projects, clients, updateProjectStatus }) => {
    const COLUMNS = [
        { id: 'discovery', label: 'Briefing', icon: '💬', color: '#aaaaff' },
        { id: 'design', label: 'Design', icon: '🎨', color: '#ff9944' },
        { id: 'development', label: 'Dev', icon: '⚙️', color: '#44aaff' },
        { id: 'review', label: 'Révision', icon: '🔍', color: '#ffcc44' },
        { id: 'delivered', label: 'Livré', icon: '✅', color: '#39ff14' },
    ];

    const onDragStart = (e, projectId) => {
        e.dataTransfer.setData('projectId', projectId);
    };

    const onDrop = (e, status) => {
        const projectId = e.dataTransfer.getData('projectId');
        updateProjectStatus(projectId, { status });
    };

    const onDragOver = (e) => {
        e.preventDefault();
    };

    const getClientName = (clientId) => {
        const client = clients.find(c => c.id === clientId);
        return client ? client.name : 'Unknown Client';
    };

    return (
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(5, 1fr)', 
            gap: '1rem', 
            minHeight: '600px',
            overflowX: 'auto',
            paddingBottom: '1rem'
        }}>
            {COLUMNS.map(col => (
                <div 
                    key={col.id}
                    onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, col.id)}
                    style={{
                        background: 'rgba(255,255,255,0.02)',
                        borderRadius: '16px',
                        border: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        flexDirection: 'column',
                        minWidth: '220px'
                    }}
                >
                    <div style={{ 
                        padding: '1rem', 
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span>{col.icon}</span>
                            <h4 style={{ 
                                fontSize: '0.75rem', 
                                fontFamily: 'var(--font-mono)', 
                                color: col.color,
                                textTransform: 'uppercase',
                                letterSpacing: '1px'
                            }}>
                                {col.label}
                            </h4>
                        </div>
                        <span style={{ 
                            fontSize: '0.7rem', 
                            background: 'rgba(255,255,255,0.05)', 
                            padding: '0.1rem 0.4rem', 
                            borderRadius: '10px',
                            color: 'rgba(255,255,255,0.3)'
                        }}>
                            {projects.filter(p => p.status === col.id).length}
                        </span>
                    </div>

                    <div style={{ padding: '0.75rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {projects.filter(p => p.status === col.id).map(proj => (
                            <div
                                key={proj.id}
                                draggable
                                onDragStart={(e) => onDragStart(e, proj.id)}
                                className="glass-panel"
                                style={{
                                    padding: '1rem',
                                    cursor: 'grab',
                                    border: '1px solid rgba(255,255,255,0.08)',
                                    transition: 'transform 0.1s, border-color 0.2s',
                                }}
                                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
                            >
                                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff', marginBottom: '0.25rem' }}>
                                    {proj.title}
                                </p>
                                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', marginBottom: '0.75rem' }}>
                                    👤 {getClientName(proj.client_id)}
                                </p>
                                
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ flex: 1, height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', marginRight: '0.75rem' }}>
                                        <div style={{ width: `${proj.progress || 0}%`, height: '100%', background: col.color, borderRadius: '2px' }} />
                                    </div>
                                    <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
                                        {proj.progress || 0}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default KanbanBoard;
