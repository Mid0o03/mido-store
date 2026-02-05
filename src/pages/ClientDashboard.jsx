import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Download, ExternalLink, Package, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './PageStyles.css';

const ClientDashboard = () => {
    const { t } = useLanguage();
    const { logoutClient, clientUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const handleLogout = () => {
        logoutClient();
        navigate('/');
    };

    // Load purchased items from Supabase
    const [myAssets, setMyAssets] = useState([]);

    useEffect(() => {
        const fetchPurchases = async () => {
            if (!clientUser) return;

            setLoading(true);
            const { data, error } = await supabase
                .from('purchases')
                .select('*')
                .eq('user_id', clientUser.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching purchases:", error);
            } else {
                // Map DB columns to UI expected format if needed (or just use direct)
                const assets = data.map(item => ({
                    id: item.template_id,
                    title: item.template_title,
                    version: item.template_version,
                    date: new Date(item.created_at).toLocaleDateString(),
                    image_url: item.template_image,
                    downloadLink: "#"
                }));
                setMyAssets(assets);
            }
            setLoading(false);
        };

        fetchPurchases();
    }, [clientUser]);

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

            {loading ? (
                <div className="flex-center" style={{ minHeight: '200px' }}>Chargement...</div>
            ) : myAssets.length === 0 ? (
                <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                    <h3 style={{ marginBottom: '1rem' }}>Aucun achat trouvé</h3>
                    <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                        Vos achats apparaîtront ici une fois le paiement validé.
                    </p>
                    <button className="cta-primary" onClick={() => navigate('/store')}>
                        Aller à la boutique
                    </button>
                    {/* Debug Info for Dev */}
                    <div style={{ marginTop: '2rem', fontSize: '0.8rem', opacity: 0.5 }}>
                        User ID: {clientUser?.id}
                    </div>
                </div>
            ) : (
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
            )}

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
