import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Download, ExternalLink, Package, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './PageStyles.css';

const ClientDashboard = () => {
    const { t } = useLanguage();
    const { logout, clientUser } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);

    const handleLogout = async () => {
        await logout();
        navigate('/');
        // Optional: Force reload to clear any residual state if needed
        // window.location.reload(); 
    };

    // Load purchased items from Supabase
    const [myAssets, setMyAssets] = useState([]);

    useEffect(() => {
        const fetchPurchases = async () => {
            if (!clientUser) {
                return;
            }

            setLoading(true);
            const { data, error } = await supabase
                .from('purchases')
                .select('*')
                .eq('user_id', clientUser.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching purchases:", error);
                // alert(`Error Fetching: ${error.message}`);
            } else {
                // Fetch template details (specifically file_url) for purchased items
                // This is needed because 'purchases' might effectively be a snapshot logs, 
                // but the file mapping is in 'templates'
                const templateIds = data.map(p => p.template_id);
                let fileMap = {};

                if (templateIds.length > 0) {
                    const { data: templatesData } = await supabase
                        .from('templates')
                        .select('id, file_url, demo_url')
                        .in('id', templateIds);

                    if (templatesData) {
                        templatesData.forEach(t => {
                            fileMap[t.id] = t;
                        });
                    }
                }

                const assets = data.map(item => ({
                    id: item.template_id,
                    purchaseId: item.id,
                    title: item.template_title,
                    version: item.template_version,
                    date: new Date(item.created_at).toLocaleDateString(),
                    image_url: item.template_image,
                    file_url: fileMap[item.template_id]?.file_url,
                    demo_url: fileMap[item.template_id]?.demo_url
                }));
                setMyAssets(assets);
            }
            setLoading(false);
        };

        fetchPurchases();
    }, [clientUser]);

    const [viewingCode, setViewingCode] = useState(null);

    const handleDownload = async (asset) => {
        if (!asset.file_url) {
            alert("Download file not configured for this item.");
            return;
        }

        try {
            // file_url is stored as full URL or path? 
            // In AdminPage we stored the full public URL for images, but for ZIPs we likely stored the path or public URL.
            // If it's in 'assets' private bucket, we need a signed URL.
            // Assuming Admin uploaded to 'assets' bucket and stored the path.

            // Check if it's a full URL (public) or a path
            if (asset.file_url.startsWith('http')) {
                window.open(asset.file_url, '_blank');
                return;
            }

            // It's a path in storage, generate signed URL
            const { data, error } = await supabase
                .storage
                .from('assets') // Bucket name
                .createSignedUrl(asset.file_url, 60); // 60 seconds validity

            if (error) throw error;

            // Trigger download
            const link = document.createElement('a');
            link.href = data.signedUrl;
            link.setAttribute('download', `${asset.title}.zip`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Download error:", err);
            alert("Error downloading file: " + err.message);
        }
    };

    return (
        <div className="page-container container">
            <h1 className="page-title">{t('client.title_prefix')} <span className="text-accent">{t('client.title_highlight')}</span></h1>

            <div className="glass-panel" style={{ padding: '2rem', marginBottom: '3rem' }}>
                <div className="user-welcome" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{t('client.welcome')}, {clientUser?.email?.split('@')[0] || 'User'}</h2>
                        <p style={{ color: 'var(--text-secondary)' }}>{t('client.member_since')} 2024</p>
                    </div>
                    <button onClick={handleLogout} className="filter-btn" style={{ borderColor: 'rgba(255,100,100,0.3)', color: '#ffaaaa' }}>
                        <LogOut size={16} style={{ marginRight: '0.5rem' }} /> Déconnexion
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
                                    <button className="view-btn" onClick={() => handleDownload(asset)}>
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
                            <h2 style={{ color: 'var(--accent-color)' }}>{viewingCode.title}</h2>
                            <button className="close-btn" onClick={() => setViewingCode(null)}>X</button>
                        </div>

                        <div style={{ marginBottom: '2rem' }}>
                            <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Documentation & Access</h3>
                            <p style={{ color: '#ccc', lineHeight: '1.6' }}>
                                Thank you for your purchase! You can download the source code ZIP directly below.
                                If you need support, please contact support@midodev.fr with your Purchase ID: <span className="font-mono text-accent">{viewingCode.purchaseId}</span>.
                            </p>
                        </div>

                        {viewingCode.demo_url && (
                            <div style={{ marginBottom: '2rem' }}>
                                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#888' }}>Live Demo Link:</label>
                                <a href={viewingCode.demo_url} target="_blank" rel="noopener" style={{ color: 'var(--accent-color)' }}>{viewingCode.demo_url}</a>
                            </div>
                        )}

                        <div style={{ marginTop: '1.5rem', textAlign: 'right', display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className="filter-btn" onClick={() => setViewingCode(null)}>Close</button>
                            <button className="cta-primary" onClick={() => handleDownload(viewingCode)}>
                                <Download size={18} style={{ marginRight: '0.5rem' }} />
                                Download .ZIP
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
export default ClientDashboard;
