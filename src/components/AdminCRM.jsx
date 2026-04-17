import React, { useState } from 'react';
import { useFreelance } from '../context/FreelanceContext';
import { generateQuotePDF } from '../services/pdfService';
import QuoteBuilder from './QuoteBuilder';

const STATUS_STYLES = {
    draft:    { label: 'Brouillon',  color: '#888',    bg: 'rgba(128,128,128,0.1)' },
    sent:     { label: 'Envoyé',     color: '#44aaff', bg: 'rgba(68,170,255,0.1)' },
    accepted: { label: 'Accepté',    color: '#39ff14', bg: 'rgba(57,255,20,0.1)' },
    declined: { label: 'Refusé',     color: '#ff5050', bg: 'rgba(255,80,80,0.1)' },
    expired:  { label: 'Expiré',     color: '#ff9944', bg: 'rgba(255,153,68,0.1)' },
};

const AdminCRM = () => {
    const { clients, quotes, freelanceProjects, addClient, updateClient, deleteClient, addFreelanceProject, updateFreelanceProject } = useFreelance();
    const [activeTab, setActiveTab] = useState('clients');
    const [showQuoteBuilder, setShowQuoteBuilder] = useState(false);
    const [editQuote, setEditQuote] = useState(null);
    const [showClientForm, setShowClientForm] = useState(false);
    const [editClient, setEditClient] = useState(null);
    const [clientForm, setClientForm] = useState({ name: '', email: '', phone: '', company: '', status: 'active' });
    const [saving, setSaving] = useState(false);
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [projectForm, setProjectForm] = useState({ client_id: '', title: '', description: '', status: 'discovery', total_amount: '', deadline: '' });

    // ── CLIENT FORM ───────────────────────────────────────
    const openClientForm = (client = null) => {
        setEditClient(client);
        setClientForm(client || { name: '', email: '', phone: '', company: '', status: 'active' });
        setShowClientForm(true);
    };

    const handleSaveClient = async (e) => {
        e.preventDefault();
        setSaving(true);
        if (editClient) {
            await updateClient(editClient.id, clientForm);
        } else {
            await addClient(clientForm);
        }
        setSaving(false);
        setShowClientForm(false);
    };

    // ── PROJECT FORM ──────────────────────────────────────
    const handleSaveProject = async (e) => {
        e.preventDefault();
        setSaving(true);
        await addFreelanceProject(projectForm);
        setSaving(false);
        setShowProjectForm(false);
        setProjectForm({ client_id: '', title: '', description: '', status: 'discovery', total_amount: '', deadline: '' });
    };

    const PROJECT_STATUSES = {
        discovery:   { label: 'Briefing',     color: '#aaaaff', icon: '💬' },
        design:      { label: 'Design',       color: '#ff9944', icon: '🎨' },
        development: { label: 'Développement', color: '#44aaff', icon: '⚙️' },
        review:      { label: 'Révision',     color: '#ffcc44', icon: '🔍' },
        delivered:   { label: 'Livré',        color: '#39ff14', icon: '✅' },
        archived:    { label: 'Archivé',      color: '#555',    icon: '📦' },
    };

    return (
        <div>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '1rem' }}>
                {[
                    { id: 'clients',  label: '👥 Clients' },
                    { id: 'projects', label: '🏗 Projets' },
                    { id: 'quotes',   label: '📋 Devis' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`filter-btn ${activeTab === tab.id ? 'active' : ''}`}
                        style={{ fontSize: '0.85rem' }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── CLIENTS ─────────────────────────────────── */}
            {activeTab === 'clients' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: '0.75rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                            {clients.length} CLIENT{clients.length !== 1 ? 'S' : ''}
                        </h3>
                        <button className="cta-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }} onClick={() => openClientForm()}>
                            + Nouveau client
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {clients.length === 0 ? (
                            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Aucun client. Commence par en ajouter un !</p>
                            </div>
                        ) : clients.map(client => {
                            const projectCount = freelanceProjects.filter(p => p.client_id === client.id).length;
                            const quoteCount = quotes.filter(q => q.client_id === client.id).length;
                            return (
                                <div key={client.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)',
                                }}>
                                    <div style={{
                                        width: '44px', height: '44px', borderRadius: '50%',
                                        background: 'linear-gradient(135deg, rgba(57,255,20,0.3), rgba(0,212,255,0.2))',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontWeight: 700, fontSize: '1.1rem', color: 'var(--accent-color)', flexShrink: 0,
                                    }}>
                                        {client.name?.[0]?.toUpperCase()}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontWeight: 600, color: '#fff', marginBottom: '0.2rem' }}>{client.name}</p>
                                        <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>{client.email}</p>
                                        {client.company && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)' }}>{client.company}</p>}
                                    </div>
                                    <div style={{ display: 'flex', gap: '1.5rem', flexShrink: 0, textAlign: 'center' }}>
                                        <div>
                                            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-color)', fontFamily: 'var(--font-mono)' }}>{projectCount}</p>
                                            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>Projets</p>
                                        </div>
                                        <div>
                                            <p style={{ fontSize: '1.1rem', fontWeight: 700, color: '#44aaff', fontFamily: 'var(--font-mono)' }}>{quoteCount}</p>
                                            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)' }}>Devis</p>
                                        </div>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        <button className="cta-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={() => openClientForm(client)}>
                                            ✏️
                                        </button>
                                        <button
                                            style={{ background: 'none', border: 'none', color: 'rgba(255,80,80,0.6)', cursor: 'pointer', fontSize: '0.9rem' }}
                                            onClick={() => { if (window.confirm(`Supprimer ${client.name} ?`)) deleteClient(client.id); }}
                                        >
                                            ✕
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── PROJECTS ─────────────────────────────────── */}
            {activeTab === 'projects' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: '0.75rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                            {freelanceProjects.length} PROJET{freelanceProjects.length !== 1 ? 'S' : ''}
                        </h3>
                        <button className="cta-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }} onClick={() => setShowProjectForm(true)}>
                            + Nouveau projet
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {freelanceProjects.length === 0 ? (
                            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Aucun projet. Crée-en un depuis un client !</p>
                            </div>
                        ) : freelanceProjects.map(proj => {
                            const st = PROJECT_STATUSES[proj.status] || PROJECT_STATUSES.discovery;
                            return (
                                <div key={proj.id} style={{
                                    padding: '1.25rem 1.5rem',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '12px',
                                    border: `1px solid ${st.color}22`,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                                                <h4 style={{ color: '#fff', fontSize: '0.95rem' }}>{proj.title}</h4>
                                                <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', background: `${st.color}18`, color: st.color, fontSize: '0.7rem', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                                                    {st.icon} {st.label}
                                                </span>
                                            </div>
                                            <p style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)' }}>
                                                {proj.clients?.name || '—'} {proj.deadline ? `· Deadline: ${new Date(proj.deadline).toLocaleDateString('fr-FR')}` : ''}
                                            </p>
                                        </div>
                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                            {proj.total_amount > 0 && (
                                                <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-color)', fontWeight: 700 }}>{parseFloat(proj.total_amount).toFixed(0)} €</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Progress bar */}
                                    <div style={{ marginTop: '0.75rem' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>PROGRESSION</span>
                                            <span style={{ fontSize: '0.65rem', color: st.color, fontFamily: 'var(--font-mono)' }}>{proj.progress || 0}%</span>
                                        </div>
                                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${proj.progress || 0}%`,
                                                background: `linear-gradient(to right, ${st.color}66, ${st.color})`,
                                                borderRadius: '2px',
                                                transition: 'width 0.5s',
                                            }} />
                                        </div>
                                    </div>

                                    {/* Quick progress update */}
                                    <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        {[0, 25, 50, 75, 100].map(p => (
                                            <button
                                                key={p}
                                                onClick={() => updateFreelanceProject(proj.id, { progress: p })}
                                                style={{
                                                    padding: '0.2rem 0.6rem', borderRadius: '6px', border: 'none',
                                                    background: proj.progress === p ? st.color : 'rgba(255,255,255,0.06)',
                                                    color: proj.progress === p ? '#000' : 'rgba(255,255,255,0.4)',
                                                    fontSize: '0.7rem', cursor: 'pointer', fontFamily: 'var(--font-mono)',
                                                }}
                                            >
                                                {p}%
                                            </button>
                                        ))}
                                        {/* Status selector */}
                                        <select
                                            value={proj.status}
                                            onChange={e => updateFreelanceProject(proj.id, { status: e.target.value })}
                                            style={{
                                                marginLeft: 'auto',
                                                background: 'rgba(255,255,255,0.06)', border: 'none',
                                                color: st.color, borderRadius: '6px', padding: '0.2rem 0.5rem',
                                                fontSize: '0.7rem', cursor: 'pointer',
                                            }}
                                        >
                                            {Object.entries(PROJECT_STATUSES).map(([key, val]) => (
                                                <option key={key} value={key}>{val.icon} {val.label}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── QUOTES ───────────────────────────────────── */}
            {activeTab === 'quotes' && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: '0.75rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                            {quotes.length} DEVIS
                        </h3>
                        <button className="cta-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }} onClick={() => { setEditQuote(null); setShowQuoteBuilder(true); }}>
                            + Nouveau devis
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {quotes.length === 0 ? (
                            <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                                <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.9rem' }}>Aucun devis. Crée ton premier devis !</p>
                            </div>
                        ) : quotes.map(quote => {
                            const s = STATUS_STYLES[quote.status] || STATUS_STYLES.draft;
                            return (
                                <div key={quote.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '0.75rem 1.25rem', background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)',
                                }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.2rem' }}>{quote.quote_number}</p>
                                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>{quote.clients?.name || '—'} {quote.valid_until ? `· Valable jusqu'au ${new Date(quote.valid_until).toLocaleDateString('fr-FR')}` : ''}</p>
                                    </div>
                                    <span style={{ padding: '0.2rem 0.6rem', borderRadius: '6px', background: s.bg, color: s.color, fontSize: '0.7rem', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>
                                        {s.label}
                                    </span>
                                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                        <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-color)', fontWeight: 700, fontSize: '0.9rem' }}>{parseFloat(quote.total || 0).toFixed(0)} €</p>
                                        <p style={{ fontSize: '0.7rem', color: 'rgba(57,255,20,0.6)', fontFamily: 'var(--font-mono)' }}>Acompte : {parseFloat(quote.deposit_amount || 0).toFixed(0)} €</p>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                                        <button className="filter-btn" style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem' }}
                                            onClick={() => generateQuotePDF(quote, quote.clients)}>
                                            📄 PDF
                                        </button>
                                        <button className="cta-secondary" style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem' }}
                                            onClick={() => { setEditQuote(quote); setShowQuoteBuilder(true); }}>
                                            ✏️
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* ── CLIENT FORM MODAL ────────────────────────── */}
            {showClientForm && (
                <div className="modal-overlay" onClick={() => setShowClientForm(false)}>
                    <div className="modal-content glass-panel" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2 style={{ color: 'var(--accent-color)', fontFamily: 'var(--font-mono)', fontSize: '1rem', letterSpacing: '2px' }}>
                                {editClient ? 'MODIFIER LE CLIENT' : 'NOUVEAU CLIENT'}
                            </h2>
                            <button className="close-btn" onClick={() => setShowClientForm(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSaveClient} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <input className="admin-input" placeholder="Nom complet *" value={clientForm.name} onChange={e => setClientForm(p => ({ ...p, name: e.target.value }))} required />
                            <input className="admin-input" type="email" placeholder="Email *" value={clientForm.email} onChange={e => setClientForm(p => ({ ...p, email: e.target.value }))} required />
                            <input className="admin-input" placeholder="Téléphone" value={clientForm.phone || ''} onChange={e => setClientForm(p => ({ ...p, phone: e.target.value }))} />
                            <input className="admin-input" placeholder="Entreprise" value={clientForm.company || ''} onChange={e => setClientForm(p => ({ ...p, company: e.target.value }))} />
                            <select className="admin-input" value={clientForm.status} onChange={e => setClientForm(p => ({ ...p, status: e.target.value }))}>
                                <option value="prospect">Prospect</option>
                                <option value="active">Actif</option>
                                <option value="archived">Archivé</option>
                            </select>
                            <button type="submit" className="cta-primary" disabled={saving} style={{ marginTop: '0.5rem' }}>
                                {saving ? 'Enregistrement...' : editClient ? 'Mettre à jour' : 'Créer le client'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── PROJECT FORM MODAL ───────────────────────── */}
            {showProjectForm && (
                <div className="modal-overlay" onClick={() => setShowProjectForm(false)}>
                    <div className="modal-content glass-panel" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                            <h2 style={{ color: 'var(--accent-color)', fontFamily: 'var(--font-mono)', fontSize: '1rem', letterSpacing: '2px' }}>NOUVEAU PROJET</h2>
                            <button className="close-btn" onClick={() => setShowProjectForm(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSaveProject} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <select className="admin-input" value={projectForm.client_id} onChange={e => setProjectForm(p => ({ ...p, client_id: e.target.value }))} required>
                                <option value="">— Sélectionner un client —</option>
                                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                            <input className="admin-input" placeholder="Titre du projet *" value={projectForm.title} onChange={e => setProjectForm(p => ({ ...p, title: e.target.value }))} required />
                            <textarea className="admin-input" rows={2} placeholder="Description" value={projectForm.description} onChange={e => setProjectForm(p => ({ ...p, description: e.target.value }))} />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                                <input className="admin-input" type="number" placeholder="Budget total (€)" value={projectForm.total_amount} onChange={e => setProjectForm(p => ({ ...p, total_amount: e.target.value }))} />
                                <input className="admin-input" type="date" value={projectForm.deadline} onChange={e => setProjectForm(p => ({ ...p, deadline: e.target.value }))} style={{ colorScheme: 'dark' }} />
                            </div>
                            <button type="submit" className="cta-primary" disabled={saving}>
                                {saving ? 'Création...' : 'Créer le projet'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── QUOTE BUILDER ────────────────────────────── */}
            {showQuoteBuilder && (
                <QuoteBuilder
                    clients={clients}
                    editQuote={editQuote}
                    onClose={() => { setShowQuoteBuilder(false); setEditQuote(null); }}
                />
            )}
        </div>
    );
};

export default AdminCRM;
