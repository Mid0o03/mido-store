import React, { useState } from 'react';
import { useFreelance } from '../context/FreelanceContext';

const DocumentVault = ({ clientId, projectId = null, isAdmin = false }) => {
    const { clientDocuments, addClientDocument, deleteClientDocument, downloadClientDocument } = useFreelance();
    const [uploading, setUploading] = useState(false);
    const [filter, setFilter] = useState('all');

    // Filter documents for this client/project
    const docs = clientDocuments.filter(d => {
        const matchClient = d.client_id === clientId;
        const matchProject = projectId ? d.project_id === projectId : true;
        const matchFilter = filter === 'all' ? true : d.type === filter;
        return matchClient && matchProject && matchFilter;
    });

    const handleUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setUploading(true);
        const docData = {
            client_id: clientId,
            project_id: projectId,
            title: file.name,
            type: inferType(file.name),
            status: 'active'
        };

        const result = await addClientDocument(docData, file);
        setUploading(false);
        if (!result.success) alert('Erreur upload: ' + result.message);
    };

    const inferType = (filename) => {
        const ext = filename.split('.').pop().toLowerCase();
        if (['pdf'].includes(ext)) return 'pdf';
        if (['jpg', 'jpeg', 'png', 'svg', 'webp'].includes(ext)) return 'image';
        if (['zip', 'rar', '7z'].includes(ext)) return 'archive';
        return 'other';
    };

    const handleDownload = async (doc) => {
        const url = await downloadClientDocument(doc.file_url);
        if (url) {
            const link = document.createElement('a');
            link.href = url;
            link.download = doc.title;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const getIcon = (type) => {
        switch (type) {
            case 'pdf': return '📄';
            case 'image': return '🖼️';
            case 'archive': return '📦';
            case 'invoice': return '🧾';
            case 'quote': return '📝';
            default: return '📄';
        }
    };

    return (
        <div className="document-vault" style={{ color: '#fff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)', color: 'var(--accent-color)' }}>
                    🔐 COFFRE-FORT NUMÉRIQUE
                </h3>
                
                {isAdmin && (
                    <label className="cta-secondary" style={{ fontSize: '0.8rem', padding: '0.5rem 1rem', cursor: 'pointer' }}>
                        {uploading ? '⏳ Upload...' : '+ Ajouter un fichier'}
                        <input type="file" hidden onChange={handleUpload} disabled={uploading} />
                    </label>
                )}
            </div>

            {/* Filter Bar */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                {['all', 'pdf', 'image', 'invoice', 'quote', 'archive'].map(t => (
                    <button
                        key={t}
                        onClick={() => setFilter(t)}
                        style={{
                            padding: '0.3rem 0.8rem',
                            borderRadius: '20px',
                            fontSize: '0.7rem',
                            background: filter === t ? 'var(--accent-color)' : 'rgba(255,255,255,0.05)',
                            color: filter === t ? '#000' : 'rgba(255,255,255,0.6)',
                            border: '1px solid ' + (filter === t ? 'var(--accent-color)' : 'rgba(255,255,255,0.1)'),
                            textTransform: 'uppercase',
                            transition: 'all 0.2s'
                        }}
                    >
                        {t === 'all' ? 'Tout' : t}
                    </button>
                ))}
            </div>

            {docs.length === 0 ? (
                <div style={{ padding: '3rem', textAlign: 'center', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Aucun document pour le moment.</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
                    {docs.map(doc => (
                        <div 
                            key={doc.id} 
                            className="glass-panel" 
                            style={{ 
                                padding: '1rem', 
                                position: 'relative',
                                transition: 'transform 0.2s',
                                cursor: 'default'
                            }}
                        >
                            <div style={{ fontSize: '2rem', marginBottom: '0.75rem', textAlign: 'center' }}>
                                {getIcon(doc.type)}
                            </div>
                            <div style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.25rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {doc.title}
                            </div>
                            <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                                {new Date(doc.created_at).toLocaleDateString()}
                            </div>

                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <button 
                                    onClick={() => handleDownload(doc)}
                                    className="cta-secondary"
                                    style={{ flex: 1, padding: '0.4rem', fontSize: '0.75rem' }}
                                >
                                    💾 Ouvrir
                                </button>
                                {isAdmin && (
                                    <button 
                                        onClick={() => {
                                            if (window.confirm('Supprimer ce document ?')) deleteClientDocument(doc.id, doc.file_url);
                                        }}
                                        style={{ width: '32px', background: 'rgba(255,80,80,0.1)', color: '#ff5050', borderRadius: '6px' }}
                                    >
                                        ✕
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DocumentVault;
