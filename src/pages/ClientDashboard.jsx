import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import ChatPanel from '../components/ChatPanel';
import DepositPayment from '../components/DepositPayment';
import { generateInvoicePDF } from '../services/pdfService';
import '../components/ChatViewer.css';
import './PageStyles.css';

// ─── Tab Icons & Labels ─────────────────────────────────────
const TABS = [
    { id: 'overview',  label: 'Accueil',   icon: '🏠' },
    { id: 'project',   label: 'Projet',    icon: '🏗' },
    { id: 'chat',      label: 'Messages',  icon: '💬' },
    { id: 'invoices',  label: 'Factures',  icon: '📄' },
    { id: 'files',     label: 'Fichiers',  icon: '📂' },
];

// ─── Progress Stage Map ─────────────────────────────────────
const STAGES = [
    { key: 'discovery',   label: 'Briefing',     icon: '💬', color: '#aaaaff' },
    { key: 'design',      label: 'Design',       icon: '🎨', color: '#ff9944' },
    { key: 'development', label: 'Développement', icon: '⚙️', color: '#44aaff' },
    { key: 'review',      label: 'Révision',     icon: '🔍', color: '#ffcc44' },
    { key: 'delivered',   label: 'Livré',        icon: '✅', color: '#39ff14' },
];

const ClientDashboard = () => {
    const { logout, clientUser } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('overview');
    const [loading, setLoading] = useState(true);
    const [selectedQuote, setSelectedQuote] = useState(null); // For deposit payment modal

    // Client Data
    const [clientProfile, setClientProfile] = useState(null);
    const [activeProject, setActiveProject] = useState(null);
    const [projectTasks, setProjectTasks] = useState([]);
    const [invoices, setInvoices] = useState([]);
    const [quotes, setQuotes] = useState([]);
    const [messages, setMessages] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Legacy store purchases
    const [myAssets, setMyAssets] = useState([]);

    const handleLogout = async () => {
        await logout();
        navigate('/');
    };

    // ─── Fetch All Client Data ───────────────────────────────
    const fetchClientData = useCallback(async () => {
        if (!clientUser?.email) return;
        setLoading(true);

        try {
            // 1. Find client profile by email
            const { data: clientData } = await supabase
                .from('clients')
                .select('*')
                .eq('email', clientUser.email)
                .single();

            setClientProfile(clientData);

            if (clientData) {
                // 2. Active project (most recent non-archived)
                const { data: projectData } = await supabase
                    .from('freelance_projects')
                    .select('*')
                    .eq('client_id', clientData.id)
                    .neq('status', 'archived')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .single();

                setActiveProject(projectData);

                if (projectData) {
                    // 3. Project tasks/milestones
                    const { data: tasks } = await supabase
                        .from('project_tasks')
                        .select('*')
                        .eq('project_id', projectData.id)
                        .order('order_index', { ascending: true });

                    setProjectTasks(tasks || []);

                    // 4. Unread message count
                    const { count } = await supabase
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('project_id', projectData.id)
                        .eq('sender_type', 'admin')
                        .is('read_at', null);

                    setUnreadCount(count || 0);
                }

                // 5. Invoices
                const { data: invData } = await supabase
                    .from('invoices')
                    .select('*')
                    .eq('client_id', clientData.id)
                    .order('created_at', { ascending: false });

                setInvoices(invData || []);

                // 6. Quotes
                const { data: quoteData } = await supabase
                    .from('quotes')
                    .select('*')
                    .eq('client_id', clientData.id)
                    .order('created_at', { ascending: false });

                setQuotes(quoteData || []);
            }

            // 7. Legacy store purchases (existing feature)
            const { data: purchasesData } = await supabase
                .from('purchases')
                .select('*')
                .eq('user_id', clientUser.id)
                .order('created_at', { ascending: false });

            if (purchasesData?.length > 0) {
                const templateIds = purchasesData.map(p => p.template_id);
                const { data: templatesData } = await supabase
                    .from('templates')
                    .select('id, file_url, demo_url')
                    .in('id', templateIds);

                const fileMap = {};
                templatesData?.forEach(t => { fileMap[t.id] = t; });

                setMyAssets(purchasesData.map(item => ({
                    id: item.template_id,
                    purchaseId: item.id,
                    title: item.template_title,
                    date: new Date(item.created_at).toLocaleDateString('fr-FR'),
                    image_url: item.template_image,
                    file_url: fileMap[item.template_id]?.file_url,
                    demo_url: fileMap[item.template_id]?.demo_url,
                })));
            }

        } catch (err) {
            console.error('Error fetching client data:', err);
        } finally {
            setLoading(false);
        }
    }, [clientUser]);

    useEffect(() => {
        fetchClientData();
    }, [fetchClientData]);

    // Mark admin messages as read when opening chat
    useEffect(() => {
        if (activeTab === 'chat' && activeProject) {
            supabase
                .from('messages')
                .update({ read_at: new Date().toISOString() })
                .eq('project_id', activeProject.id)
                .eq('sender_type', 'admin')
                .is('read_at', null)
                .then(() => setUnreadCount(0));
        }
    }, [activeTab, activeProject]);

    // ─── Helpers ─────────────────────────────────────────────
    const currentStageIndex = STAGES.findIndex(s => s.key === activeProject?.status);
    const pendingAmount = invoices
        .filter(i => i.status === 'pending' || i.status === 'overdue')
        .reduce((sum, i) => sum + parseFloat(i.total || 0), 0);

    const handleDownload = async (asset) => {
        if (!asset.file_url) { alert('Fichier non disponible.'); return; }
        if (asset.file_url.startsWith('http')) { window.open(asset.file_url, '_blank'); return; }
        const { data, error } = await supabase.storage.from('assets').createSignedUrl(asset.file_url, 3600);
        if (error) { alert('Erreur: ' + error.message); return; }
        const link = document.createElement('a');
        link.href = data.signedUrl;
        link.setAttribute('download', `${asset.title}.zip`);
        document.body.appendChild(link);
        link.click();
        link.remove();
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '80vh' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-color)', animation: 'spin 0.8s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    const displayName = clientProfile?.name || clientUser?.email?.split('@')[0] || 'Client';

    return (
        <>
        <div style={{ minHeight: '100vh', paddingTop: '80px', paddingBottom: '4rem' }}>
            <div className="container" style={{ maxWidth: '1100px', margin: '0 auto', padding: '0 1.5rem' }}>

                {/* ── HEADER ─────────────────────────────────── */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{
                            width: '52px', height: '52px', borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(57,255,20,0.4), rgba(0,212,255,0.3))',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '1.3rem', fontWeight: 700, color: 'var(--accent-color)',
                            border: '2px solid rgba(57,255,20,0.3)',
                        }}>
                            {displayName[0]?.toUpperCase()}
                        </div>
                        <div>
                            <h1 style={{ fontSize: '1.3rem', fontWeight: 700, color: '#fff', marginBottom: '0.2rem' }}>
                                Bonjour, {displayName} 👋
                            </h1>
                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                                Espace Client Mido
                            </p>
                        </div>
                    </div>
                    <button onClick={handleLogout} style={{
                        background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)',
                        color: '#ff9090', borderRadius: '8px', padding: '0.5rem 1rem',
                        cursor: 'pointer', fontSize: '0.85rem',
                    }}>
                        Déconnexion
                    </button>
                </div>

                {/* ── TAB BAR ────────────────────────────────── */}
                <div style={{
                    display: 'flex', gap: '0.25rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    borderRadius: '14px', padding: '6px',
                    marginBottom: '2rem', flexWrap: 'wrap',
                }}>
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                flex: '1 1 auto',
                                padding: '0.6rem 1rem',
                                borderRadius: '10px',
                                border: 'none',
                                background: activeTab === tab.id
                                    ? 'linear-gradient(135deg, rgba(57,255,20,0.2), rgba(0,212,255,0.1))'
                                    : 'transparent',
                                border: activeTab === tab.id ? '1px solid rgba(57,255,20,0.3)' : '1px solid transparent',
                                color: activeTab === tab.id ? '#fff' : 'rgba(255,255,255,0.4)',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                fontSize: '0.85rem', fontWeight: activeTab === tab.id ? 600 : 400,
                                position: 'relative',
                            }}
                        >
                            {tab.icon} {tab.label}
                            {tab.id === 'chat' && unreadCount > 0 && (
                                <span style={{
                                    position: 'absolute', top: '4px', right: '6px',
                                    background: 'var(--accent-color)', color: '#000',
                                    borderRadius: '50%', width: '18px', height: '18px',
                                    fontSize: '0.65rem', fontWeight: 700,
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    {unreadCount}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* ══════════════════════════════════════════════
                    TAB: OVERVIEW
                ════════════════════════════════════════════════ */}
                {activeTab === 'overview' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Quick Stats */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
                            {[
                                { label: 'Projet actif', value: activeProject ? activeProject.title : 'Aucun', icon: '🏗', color: '#44aaff' },
                                { label: 'À payer', value: pendingAmount > 0 ? `${pendingAmount.toFixed(0)} €` : '0 €', icon: '💶', color: pendingAmount > 0 ? '#ffcc44' : 'var(--accent-color)' },
                                { label: 'Progression', value: activeProject ? `${activeProject.progress || 0}%` : 'N/A', icon: '📊', color: 'var(--accent-color)' },
                                { label: 'Factures', value: invoices.length, icon: '📄', color: '#aaa' },
                            ].map((stat, i) => (
                                <div key={i} className="glass-panel" style={{ padding: '1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                        <span style={{ fontSize: '0.65rem', letterSpacing: '1.5px', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase' }}>{stat.label}</span>
                                        <span style={{ fontSize: '1.2rem' }}>{stat.icon}</span>
                                    </div>
                                    <p style={{ fontSize: '1.4rem', fontWeight: 700, color: stat.color, fontFamily: 'var(--font-mono)', lineHeight: 1.2, wordBreak: 'break-word' }}>
                                        {stat.value}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Active Project Preview */}
                        {activeProject ? (
                            <div className="glass-panel" style={{ padding: '1.75rem' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                    <div>
                                        <p style={{ fontSize: '0.65rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', marginBottom: '0.4rem' }}>PROJET EN COURS</p>
                                        <h2 style={{ fontSize: '1.2rem', color: '#fff' }}>{activeProject.title}</h2>
                                    </div>
                                    <button onClick={() => setActiveTab('project')} className="cta-secondary" style={{ fontSize: '0.8rem', padding: '0.4rem 1rem' }}>
                                        Voir les détails →
                                    </button>
                                </div>

                                {/* Stage progress */}
                                <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
                                    {STAGES.map((stage, i) => {
                                        const isDone = i < currentStageIndex;
                                        const isCurrent = i === currentStageIndex;
                                        return (
                                            <div key={stage.key} style={{
                                                display: 'flex', alignItems: 'center', gap: '0.4rem',
                                                padding: '0.3rem 0.75rem', borderRadius: '20px',
                                                background: isCurrent ? `${stage.color}18` : isDone ? 'rgba(57,255,20,0.08)' : 'rgba(255,255,255,0.03)',
                                                border: isCurrent ? `1px solid ${stage.color}44` : isDone ? '1px solid rgba(57,255,20,0.2)' : '1px solid rgba(255,255,255,0.06)',
                                                fontSize: '0.75rem',
                                                color: isCurrent ? stage.color : isDone ? '#39ff14' : 'rgba(255,255,255,0.25)',
                                            }}>
                                                <span>{isDone ? '✓' : stage.icon}</span>
                                                {stage.label}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Progress bar */}
                                <div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)' }}>Avancement global</span>
                                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-color)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{activeProject.progress || 0}%</span>
                                    </div>
                                    <div style={{ height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                                        <div style={{
                                            height: '100%',
                                            width: `${activeProject.progress || 0}%`,
                                            background: 'linear-gradient(to right, rgba(57,255,20,0.5), #39ff14)',
                                            borderRadius: '4px',
                                            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                                        }} />
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                                <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>🏗</p>
                                <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Aucun projet actif</h3>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>Tu seras notifié dès que ton projet démarre.</p>
                                {clientProfile === null && (
                                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', marginTop: '1rem', fontFamily: 'var(--font-mono)' }}>
                                        Note : Ton email n'est pas encore lié à un profil client. Contacte Mido pour démarrer. 👇
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Pending invoices alert */}
                        {pendingAmount > 0 && (
                            <div style={{
                                background: 'rgba(255,200,50,0.08)',
                                border: '1px solid rgba(255,200,50,0.25)',
                                borderRadius: '12px', padding: '1rem 1.5rem',
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            }}>
                                <div>
                                    <p style={{ color: '#ffcc44', fontWeight: 600, marginBottom: '0.2rem' }}>💶 Paiement en attente</p>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>{pendingAmount.toFixed(2)} € à régler</p>
                                </div>
                                <button onClick={() => setActiveTab('invoices')} className="cta-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem', background: '#ffcc44', color: '#000' }}>
                                    Voir les factures
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════
                    TAB: PROJECT TIMELINE
                ════════════════════════════════════════════════ */}
                {activeTab === 'project' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        {!activeProject ? (
                            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                                <p style={{ color: 'rgba(255,255,255,0.4)' }}>Aucun projet actif.</p>
                            </div>
                        ) : (
                            <>
                                {/* Project info card */}
                                <div className="glass-panel" style={{ padding: '1.75rem' }}>
                                    <h2 style={{ fontSize: '1.2rem', color: '#fff', marginBottom: '0.5rem' }}>{activeProject.title}</h2>
                                    {activeProject.description && (
                                        <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', lineHeight: 1.6 }}>{activeProject.description}</p>
                                    )}
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '1rem', marginTop: '1.25rem' }}>
                                        {activeProject.deadline && (
                                            <div>
                                                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', fontFamily: 'var(--font-mono)' }}>DEADLINE</p>
                                                <p style={{ color: '#ffcc44', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{new Date(activeProject.deadline).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</p>
                                            </div>
                                        )}
                                        {activeProject.total_amount > 0 && (
                                            <div>
                                                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', fontFamily: 'var(--font-mono)' }}>BUDGET</p>
                                                <p style={{ color: 'var(--accent-color)', fontFamily: 'var(--font-mono)', fontSize: '0.9rem' }}>{parseFloat(activeProject.total_amount).toFixed(0)} €</p>
                                            </div>
                                        )}
                                        {activeProject.preview_url && (
                                            <div>
                                                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', letterSpacing: '1px', fontFamily: 'var(--font-mono)' }}>APERÇU</p>
                                                <a href={activeProject.preview_url} target="_blank" rel="noopener noreferrer" style={{ color: '#44aaff', fontSize: '0.85rem' }}>Voir le site →</a>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Stage timeline */}
                                <div className="glass-panel" style={{ padding: '1.75rem' }}>
                                    <h3 style={{ fontSize: '0.75rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginBottom: '1.5rem' }}>ÉTAPES DU PROJET</h3>
                                    <div style={{ position: 'relative' }}>
                                        {/* Vertical line */}
                                        <div style={{ position: 'absolute', left: '17px', top: '10px', bottom: '10px', width: '2px', background: 'rgba(255,255,255,0.08)', zIndex: 0 }} />

                                        {STAGES.map((stage, i) => {
                                            const isDone = i < currentStageIndex;
                                            const isCurrent = i === currentStageIndex;
                                            return (
                                                <div key={stage.key} style={{ display: 'flex', gap: '1.25rem', marginBottom: '1.5rem', position: 'relative', zIndex: 1 }}>
                                                    {/* Node */}
                                                    <div style={{
                                                        width: '36px', height: '36px', borderRadius: '50%',
                                                        flexShrink: 0,
                                                        background: isDone ? 'rgba(57,255,20,0.2)' : isCurrent ? `${stage.color}22` : 'rgba(255,255,255,0.04)',
                                                        border: isDone ? '2px solid #39ff14' : isCurrent ? `2px solid ${stage.color}` : '2px solid rgba(255,255,255,0.1)',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '1rem',
                                                        boxShadow: isCurrent ? `0 0 16px ${stage.color}44` : 'none',
                                                    }}>
                                                        {isDone ? '✓' : stage.icon}
                                                    </div>
                                                    {/* Content */}
                                                    <div style={{ paddingTop: '0.5rem' }}>
                                                        <p style={{
                                                            fontSize: '0.95rem', fontWeight: isCurrent ? 700 : 400,
                                                            color: isDone ? '#39ff14' : isCurrent ? stage.color : 'rgba(255,255,255,0.35)',
                                                            marginBottom: '0.2rem',
                                                        }}>
                                                            {stage.label}
                                                            {isCurrent && <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', marginLeft: '0.5rem', background: `${stage.color}22`, padding: '0.1rem 0.4rem', borderRadius: '4px' }}>EN COURS</span>}
                                                        </p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Tasks list */}
                                {projectTasks.length > 0 && (
                                    <div className="glass-panel" style={{ padding: '1.75rem' }}>
                                        <h3 style={{ fontSize: '0.75rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginBottom: '1.25rem' }}>TÂCHES DÉTAILLÉES</h3>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                            {projectTasks.map(task => (
                                                <div key={task.id} style={{
                                                    display: 'flex', alignItems: 'center', gap: '0.75rem',
                                                    padding: '0.75rem 1rem',
                                                    background: 'rgba(255,255,255,0.03)',
                                                    borderRadius: '10px',
                                                }}>
                                                    <div style={{
                                                        width: '22px', height: '22px', borderRadius: '50%',
                                                        border: task.status === 'completed' ? '2px solid #39ff14' : '2px solid rgba(255,255,255,0.15)',
                                                        background: task.status === 'completed' ? 'rgba(57,255,20,0.15)' : 'transparent',
                                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        fontSize: '0.75rem', color: '#39ff14', flexShrink: 0,
                                                    }}>
                                                        {task.status === 'completed' ? '✓' : ''}
                                                    </div>
                                                    <div style={{ flex: 1 }}>
                                                        <p style={{ fontSize: '0.9rem', color: task.status === 'completed' ? 'rgba(255,255,255,0.4)' : '#fff', textDecoration: task.status === 'completed' ? 'line-through' : 'none' }}>
                                                            {task.title}
                                                        </p>
                                                        {task.description && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.1rem' }}>{task.description}</p>}
                                                    </div>
                                                    {task.due_date && (
                                                        <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.25)', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                                                            {new Date(task.due_date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════
                    TAB: CHAT
                ════════════════════════════════════════════════ */}
                {activeTab === 'chat' && (
                    <div style={{ height: 'calc(100vh - 280px)', minHeight: '500px' }}>
                        {activeProject ? (
                            <ChatPanelClient
                                projectId={activeProject.id}
                                projectTitle={activeProject.title}
                                clientEmail={clientUser?.email}
                            />
                        ) : (
                            <div className="glass-panel" style={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem' }}>
                                <p style={{ fontSize: '2.5rem' }}>💬</p>
                                <p style={{ color: 'rgba(255,255,255,0.4)' }}>La messagerie sera disponible une fois ton projet démarré.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* ══════════════════════════════════════════════
                    TAB: INVOICES
                ════════════════════════════════════════════════ */}
                {activeTab === 'invoices' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

                        {/* Quotes section */}
                        {quotes.length > 0 && (
                            <div className="glass-panel" style={{ padding: '1.75rem' }}>
                                <h3 style={{ fontSize: '0.75rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginBottom: '1.25rem' }}>📋 DEVIS</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {quotes.map(quote => {
                                        const sMap = {
                                            draft:    { label: 'Brouillon',  color: '#888' },
                                            sent:     { label: '⚡ À accepter',  color: '#44aaff' },
                                            accepted: { label: '✓ Signé',    color: '#39ff14' },
                                            declined: { label: 'Refusé',     color: '#ff5050' },
                                            expired:  { label: 'Expiré',     color: '#ff9944' },
                                        };
                                        const s = sMap[quote.status] || sMap.draft;
                                        const canAccept = quote.status === 'sent';
                                        return (
                                            <div key={quote.id} style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '1rem 1.25rem',
                                                background: canAccept ? 'rgba(68,170,255,0.06)' : 'rgba(255,255,255,0.03)',
                                                border: canAccept ? '1px solid rgba(68,170,255,0.2)' : '1px solid transparent',
                                                borderRadius: '12px', gap: '1rem',
                                                transition: 'all 0.2s',
                                            }}>
                                                <div>
                                                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: canAccept ? '#fff' : 'rgba(255,255,255,0.7)', marginBottom: '0.2rem' }}>{quote.quote_number}</p>
                                                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>Emis le {new Date(quote.created_at).toLocaleDateString('fr-FR')}</p>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-color)', fontWeight: 700 }}>{parseFloat(quote.total || 0).toFixed(0)} €</p>
                                                        <p style={{ fontSize: '0.7rem', color: s.color, fontFamily: 'var(--font-mono)' }}>{s.label}</p>
                                                    </div>
                                                    {canAccept && (
                                                        <button
                                                            onClick={() => setSelectedQuote(quote)}
                                                            className="cta-primary"
                                                            style={{ padding: '0.5rem 1rem', fontSize: '0.8rem', background: 'var(--accent-color)', color: '#000', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 700, whiteSpace: 'nowrap' }}
                                                        >
                                                            ✓ Accepter
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Invoices section */}
                        <div className="glass-panel" style={{ padding: '1.75rem' }}>
                            <h3 style={{ fontSize: '0.75rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginBottom: '1.25rem' }}>📄 FACTURES</h3>
                            {invoices.length === 0 ? (
                                <p style={{ color: 'rgba(255,255,255,0.3)', textAlign: 'center', padding: '2rem' }}>Aucune facture pour le moment.</p>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                                    {invoices.map(inv => {
                                        const sMap = {
                                            paid:    { label: '✓ Payée',     color: '#39ff14', bg: 'rgba(57,255,20,0.08)' },
                                            pending: { label: '⏳ En attente', color: '#ffcc44', bg: 'rgba(255,200,50,0.08)' },
                                            overdue: { label: '⚠ En retard',  color: '#ff5050', bg: 'rgba(255,80,80,0.08)' },
                                            sent:    { label: '✉ Envoyée',   color: '#44aaff', bg: 'rgba(68,170,255,0.08)' },
                                            draft:   { label: 'Brouillon',   color: '#888',    bg: 'rgba(128,128,128,0.08)' },
                                        };
                                        const s = sMap[inv.status] || sMap.draft;
                                        return (
                                            <div key={inv.id} style={{
                                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                                padding: '1rem 1.25rem',
                                                background: s.bg,
                                                border: `1px solid ${s.color}22`,
                                                borderRadius: '12px', gap: '1rem',
                                            }}>
                                                <div>
                                                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.2rem' }}>
                                                        {inv.invoice_number}
                                                    </p>
                                                    <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                                                        {inv.type === 'deposit' ? 'Acompte 30%' : 'Facture finale'} · {new Date(inv.created_at).toLocaleDateString('fr-FR')}
                                                    </p>
                                                </div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                                                    <div style={{ textAlign: 'right' }}>
                                                        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-color)', fontWeight: 700 }}>{parseFloat(inv.total || 0).toFixed(0)} €</p>
                                                        <p style={{ fontSize: '0.7rem', color: s.color, fontFamily: 'var(--font-mono)' }}>{s.label}</p>
                                                    </div>
                                                    <button
                                                        onClick={() => generateInvoicePDF(inv, clientProfile)}
                                                        style={{
                                                            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
                                                            color: 'rgba(255,255,255,0.6)', borderRadius: '8px',
                                                            padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.75rem',
                                                        }}
                                                        title="Télécharger PDF"
                                                    >
                                                        📄 PDF
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ══════════════════════════════════════════════
                    TAB: FILES (legacy store purchases)
                ════════════════════════════════════════════════ */}
                {activeTab === 'files' && (
                    <div>
                        {myAssets.length === 0 ? (
                            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                                <p style={{ fontSize: '2rem', marginBottom: '1rem' }}>📂</p>
                                <h3 style={{ color: '#fff', marginBottom: '0.5rem' }}>Aucun fichier disponible</h3>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>Tes achats de templates apparaîtront ici.</p>
                                <button className="cta-primary" onClick={() => navigate('/store')}>
                                    Voir le store →
                                </button>
                            </div>
                        ) : (
                            <div className="store-grid">
                                {myAssets.map(asset => (
                                    <div key={asset.id} className="store-card glass-panel" style={{ cursor: 'default' }}>
                                        <div className="card-preview" style={{ height: '180px' }}>
                                            <div className="preview-placeholder" style={{ backgroundImage: `url(${asset.image_url})` }} />
                                        </div>
                                        <div className="card-content">
                                            <h3 className="card-title">{asset.title}</h3>
                                            <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', marginBottom: '1rem' }}>Acheté le {asset.date}</p>
                                            <button className="cta-primary" style={{ width: '100%', justifyContent: 'center', gap: '0.5rem' }} onClick={() => handleDownload(asset)}>
                                                ⬇ Télécharger
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>

        {/* ── DEPOSIT PAYMENT MODAL ──────────────────────── */}
        {selectedQuote && (
            <DepositPayment
                quote={selectedQuote}
                onSuccess={() => {
                    setSelectedQuote(null);
                    fetchClientData(); // Refresh quotes + invoices
                }}
                onClose={() => setSelectedQuote(null)}
            />
        )}
    </>
    );
};

// ─── Client-side ChatPanel wrapper ──────────────────────────
// Uses sender_type 'client' instead of 'admin'
const ChatPanelClient = ({ projectId, projectTitle, clientEmail }) => {
    const { clientUser } = useAuth();
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [isOnline, setIsOnline] = useState(false);
    const messagesEndRef = React.useRef(null);
    const fileInputRef = React.useRef(null);

    const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };
    React.useEffect(() => { scrollToBottom(); }, [messages]);

    React.useEffect(() => {
        if (!projectId) return;
        const fetchMessages = async () => {
            const { data } = await supabase.from('messages').select('*').eq('project_id', projectId).order('created_at', { ascending: true });
            setMessages(data || []);
        };
        fetchMessages();

        const channel = supabase.channel(`chat-client:${projectId}`)
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `project_id=eq.${projectId}` }, (payload) => {
                setMessages(prev => prev.find(m => m.id === payload.new.id) ? prev : [...prev, payload.new]);
            })
            .on('presence', { event: 'sync' }, () => {
                setIsOnline(Object.keys(channel.presenceState()).length > 1);
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') await channel.track({ online_at: new Date().toISOString(), role: 'client' });
            });

        // Mark admin messages as read
        supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('project_id', projectId).eq('sender_type', 'admin').is('read_at', null).then(() => {});

        return () => { supabase.removeChannel(channel); };
    }, [projectId]);

    const sendMessage = async (e) => {
        e?.preventDefault();
        if (!newMessage.trim() || sending) return;
        setSending(true);
        await supabase.from('messages').insert([{ project_id: projectId, sender_type: 'client', sender_email: clientUser?.email, content: newMessage.trim() }]);
        setNewMessage('');
        setSending(false);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const path = `chat/${projectId}/${Date.now()}.${file.name.split('.').pop()}`;
            await supabase.storage.from('assets').upload(path, file);
            const { data: urlData } = supabase.storage.from('assets').getPublicUrl(path);
            await supabase.from('messages').insert([{ project_id: projectId, sender_type: 'client', sender_email: clientUser?.email, file_url: urlData.publicUrl, file_name: file.name, file_type: file.type.startsWith('image/') ? 'image' : 'file' }]);
        } catch (err) { alert('Erreur upload: ' + err.message); }
        finally { setUploading(false); }
    };

    const formatTime = (ts) => new Date(ts).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    return (
        <div className="chat-panel">
            <div className="chat-header glass-panel">
                <div className="chat-header-info">
                    <div className="chat-avatar" style={{ background: 'linear-gradient(135deg, #0a0a14, #1a1a2e)', color: 'var(--accent-color)', fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                        M
                    </div>
                    <div>
                        <h4 className="chat-header-name">Mido Dev</h4>
                        <span className={`chat-status-dot ${isOnline ? 'online' : 'offline'}`}>
                            {isOnline ? '● En ligne' : '○ Hors ligne'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="chat-messages">
                {messages.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>
                        <p style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>👋</p>
                        Envoie un message pour démarrer la conversation avec Mido.
                    </div>
                )}
                {messages.map(msg => {
                    const isClient = msg.sender_type === 'client';
                    return (
                        <div key={msg.id} className={`chat-bubble-row ${isClient ? 'sent' : 'received'}`}>
                            <div className={`chat-bubble ${isClient ? 'bubble-sent' : 'bubble-received'}`}>
                                {msg.file_type === 'image' ? (
                                    <img src={msg.file_url} alt={msg.file_name} className="chat-image" onClick={() => window.open(msg.file_url, '_blank')} />
                                ) : msg.file_url ? (
                                    <a href={msg.file_url} target="_blank" rel="noopener noreferrer" className="chat-file-attachment">📎 {msg.file_name}</a>
                                ) : (
                                    <p>{msg.content}</p>
                                )}
                                <div className="chat-meta">
                                    <span className="chat-time">{formatTime(msg.created_at)}</span>
                                    {isClient && <span className="chat-read-receipt">{msg.read_at ? '✓✓' : '✓'}</span>}
                                </div>
                            </div>
                        </div>
                    );
                })}
                {uploading && <div className="chat-bubble-row sent"><div className="chat-bubble bubble-sent uploading"><div className="upload-spinner" /><span>Envoi...</span></div></div>}
                <div ref={messagesEndRef} />
            </div>

            <form className="chat-input-bar" onSubmit={sendMessage}>
                <button type="button" className="chat-attach-btn" onClick={() => fileInputRef.current?.click()}>📎</button>
                <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={handleFileUpload} />
                <input type="text" className="chat-input" placeholder="Écris un message à Mido..." value={newMessage} onChange={e => setNewMessage(e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} disabled={sending} />
                <button type="submit" className="chat-send-btn" disabled={sending || !newMessage.trim()}>
                    {sending ? '...' : '➤'}
                </button>
            </form>
        </div>
    );
};

export default ClientDashboard;
