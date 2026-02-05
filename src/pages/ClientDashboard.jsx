import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Download, ExternalLink, Package, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './PageStyles.css';

const ClientDashboard = () => {
    const { t } = useLanguage();
    const { logoutClient } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logoutClient();
        navigate('/');
    };
    // Load purchased items
    const [myAssets, setMyAssets] = useState(() => {
        const saved = localStorage.getItem('purchasedAssets');
        const defaultAssets = [
            {
                id: 101,
                title: "NEON DASHBOARD",
                version: "v2.0.1",
                date: "2023-10-24",
                image_url: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=800",
                downloadLink: "#"
            }
        ];
        return saved ? JSON.parse(saved) : defaultAssets;
    });

    const [viewingCode, setViewingCode] = useState(null);

    return (
        <div className="page-container container">
            <h1 className="page-title">{t('client.title_prefix')} <span className="text-accent">{t('client.title_highlight')}</span></h1>

            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem' }}>
                <div className="user-welcome" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{t('client.welcome')}, User</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>{t('client.member_since')} 2023</p>
                    </div>
                    <button onClick={handleLogout} className="filter-btn" style={{ borderColor: 'rgba(255,100,100,0.3)', color: '#ffaaaa' }}>
                        <LogOut size={16} style={{ marginRight: '0.5rem' }} /> {t('admin.logout') || 'Logout'}
                    </button>
                </div>
            </div>

            <h2 className="section-title" style={{ marginBottom: '1.5rem', fontSize: '1.5rem' }}>{t('client.my_assets')}</h2>

            <div className="store-grid">
                {myAssets.map(asset => (
                    <div key={asset.id} className="store-card glass-panel" style={{ cursor: 'default' }}>
                        <div className="card-preview" style={{ height: '180px' }}>
                            <div className="preview-placeholder" style={{ backgroundImage: `url(${asset.image_url})` }}></div>
                            <div className="card-overlay">
                                <button className="view-btn" onClick={() => setViewingCode(asset)}>
                                    <Download size={18} style={{ marginRight: '0.5rem' }} />
                                    {t('client.download')}
                                </button>
                            </div>
                        </div>
                        <div className="card-content">
                            <div className="card-header">
                                <h3 className="card-title">{asset.title}</h3>
                                <span className="badge category">{asset.version || 'v1.0'}</span>
                            </div>
                            <div className="card-tags">
                                <span className="tech-tag font-mono">{t('client.purchased')}: {asset.date || asset.purchaseDate}</span>
                            </div>
                            <div className="card-divider"></div>
                            <div className="card-footer">
                                <button
                                    className="filter-btn"
                                    onClick={() => setViewingCode(asset)}
                                    style={{ width: '100%', justifyContent: 'center', display: 'flex', gap: '0.5rem', alignItems: 'center' }}
                                >
                                    <Package size={16} /> {t('client.documentation')}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {viewingCode && (
                <div className="modal-overlay" onClick={() => setViewingCode(null)}>
                    <div className="modal-content glass-panel" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2 style={{ color: 'var(--accent-color)' }}>Source Code: {viewingCode.title}</h2>
                            <button className="close-btn" onClick={() => setViewingCode(null)}>X</button>
                        </div>
                        <pre style={{
                            background: '#0a0a0a',
                            padding: '1.5rem',
                            borderRadius: '8px',
                            overflowX: 'auto',
                            color: '#e0e0e0',
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            border: '1px solid rgba(255,255,255,0.1)'
                        }}>
                            {viewingCode.code_snippet || "// Code reference implementation not available in this demo."}
                        </pre>
                        <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                            <button className="cta-primary">Download .ZIP</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientDashboard;
