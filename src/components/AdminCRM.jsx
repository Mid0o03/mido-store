import React, { useState } from 'react';
import { useFreelance } from '../context/FreelanceContext';
import { generateQuotePDF } from '../services/pdfService';
import QuoteBuilder from './QuoteBuilder';
import ProjectViewer from './ProjectViewer';
import ChatPanel from './ChatPanel';

const STATUS_STYLES = {
    draft:    { label: 'Brouillon',  color: '#888',    bg: 'rgba(128,128,128,0.1)' },
    sent:     { label: 'Envoyé',     color: '#44aaff', bg: 'rgba(68,170,255,0.1)' },
    accepted: { label: 'Accepté',    color: '#39ff14', bg: 'rgba(57,255,20,0.1)' },
    declined: { label: 'Refusé',     color: '#ff5050', bg: 'rgba(255,80,80,0.1)' },
    expired:  { label: 'Expiré',     color: '#ff9944', bg: 'rgba(255,153,68,0.1)' },
};

const AdminCRM = () => {
    const { clients, quotes, freelanceProjects, addClient, updateClient, deleteClient, addFreelanceProject, updateFreelanceProject, clientDocuments, addClientDocument, deleteClientDocument, downloadClientDocument } = useFreelance();
    const [activeTab, setActiveTab] = useState('clients');
    const [showQuoteBuilder, setShowQuoteBuilder] = useState(false);
    const [editQuote, setEditQuote] = useState(null);
    const [showClientForm, setShowClientForm] = useState(false);
    const [editClient, setEditClient] = useState(null);
    const [selectedClient, setSelectedClient] = useState(null); // The client whose profile is open
    const [clientForm, setClientForm] = useState({ name: '', email: '', phone: '', company: '', status: 'active' });
    const [saving, setSaving] = useState(false);
    const [showProjectForm, setShowProjectForm] = useState(false);
    const [projectForm, setProjectForm] = useState({ client_id: '', title: '', description: '', status: 'discovery', total_amount: '', deadline: '', preview_url: '' });
    const [viewingProjectUrl, setViewingProjectUrl] = useState(null);
    const [activeProjectChat, setActiveProjectChat] = useState(null); // Which project chat is open
    const [uploadingDoc, setUploadingDoc] = useState(false);

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
        setProjectForm({ client_id: '', title: '', description: '', status: 'discovery', total_amount: '', deadline: '', preview_url: '' });
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
                <button
                    onClick={() => { setSelectedClient(null); setActiveTab('clients'); }}
                    className={`filter-btn ${!selectedClient ? 'active' : ''}`}
                    style={{ fontSize: '0.85rem' }}
                >
                    👥 Base Clients
                </button>
                {selectedClient && (
                    <button
                        className="filter-btn active"
                        style={{ fontSize: '0.85rem', background: 'rgba(57,255,20,0.1)', color: 'var(--accent-color)' }}
                    >
                        👤 Profil : {selectedClient.name}
                    </button>
                )}
            </div>

            {/* ── CLIENTS ─────────────────────────────────── */}
            {activeTab === 'clients' && !selectedClient && (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 style={{ fontSize: '0.75rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                            {clients.length} CLIENT{clients.length !== 1 ? 'S' : ''}
                        </h3>
                        <button className="btn-primary" style={{ fontSize: '0.85rem' }} onClick={() => openClientForm()}>
                            + Nouveau client
                        </button>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {clients.length === 0 ? (
                            <div className="admin-panel" style={{ padding: '3rem', textAlign: 'center' }}>
                                <p className="admin-empty">Aucun client. Commence par en ajouter un !</p>
                            </div>
                        ) : clients.map(client => {
                            const projectCount = freelanceProjects.filter(p => p.client_id === client.id).length;
                            const quoteCount = quotes.filter(q => q.client_id === client.id).length;
                            return (
                                <div key={client.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '1rem 1.25rem', background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)',
                                    cursor: 'pointer', transition: 'all 0.2s',
                                }} onClick={() => setSelectedClient(client)}
                                  onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                  onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
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
                                        <button className="btn-secondary" style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }} onClick={(e) => { e.stopPropagation(); openClientForm(client); }}>
                                            ✏️
                                        </button>
                                        <button
                                            className="btn-danger"
                                            style={{ padding: '0.35rem 0.75rem' }}
                                            onClick={(e) => { e.stopPropagation(); if (window.confirm(`Supprimer ${client.name} ?`)) deleteClient(client.id); }}
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

            {/* ── CLIENT PROFILE VIEW ───────────────────────── */}
            {selectedClient && (
                <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                    <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)', marginBottom: '2rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
                                <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(57,255,20,0.3), rgba(0,212,255,0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '1.75rem', color: 'var(--accent-color)' }}>
                                    {selectedClient.name?.[0]?.toUpperCase()}
                                </div>
                                <div>
                                    <h2 style={{ fontSize: '1.5rem', color: '#fff', marginBottom: '0.2rem' }}>{selectedClient.name}</h2>
                                    <p style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>{selectedClient.email} {selectedClient.phone ? `· ${selectedClient.phone}` : ''}</p>
                                    {selectedClient.company && <p style={{ color: 'var(--accent-color)', fontSize: '0.85rem', marginTop: '0.2rem' }}>🏢 {selectedClient.company}</p>}
                                </div>
                            </div>
                            <button className="btn-secondary" onClick={() => openClientForm(selectedClient)}>✏️ Éditer Profil</button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
                        
                        {/* PROJECTS COLUMN */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '0.85rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>PROJETS</h3>
                                <button className="btn-secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }} onClick={() => { setProjectForm(p => ({...p, client_id: selectedClient.id})); setShowProjectForm(true); }}>+ Projet</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {freelanceProjects.filter(p => p.client_id === selectedClient.id).length === 0 ? (
                                    <p className="admin-empty" style={{ fontSize: '0.8rem', padding: '1.5rem' }}>Aucun projet pour ce client.</p>
                                ) : freelanceProjects.filter(p => p.client_id === selectedClient.id).map(proj => {
                                    const st = PROJECT_STATUSES[proj.status] || PROJECT_STATUSES.discovery;
                                    return (
                                        <div key={proj.id} style={{ padding: '1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: `1px solid ${st.color}22` }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                                                <h4 style={{ color: '#fff', fontSize: '0.9rem' }}>{proj.title}</h4>
                                                <span style={{ padding: '0.2rem 0.5rem', borderRadius: '4px', background: `${st.color}18`, color: st.color, fontSize: '0.65rem', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap' }}>{st.icon} {st.label}</span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                                <span style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>PROGRESSION</span>
                                                <span style={{ fontSize: '0.65rem', color: st.color, fontFamily: 'var(--font-mono)' }}>{proj.progress || 0}%</span>
                                            </div>
                                            <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px', marginBottom: '1rem' }}>
                                                <div style={{ height: '100%', width: `${proj.progress || 0}%`, background: `linear-gradient(to right, ${st.color}66, ${st.color})`, borderRadius: '2px' }} />
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                                <select
                                                    value={proj.status}
                                                    onChange={e => updateFreelanceProject(proj.id, { status: e.target.value })}
                                                    style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: st.color, borderRadius: '6px', padding: '0.2rem 0.5rem', fontSize: '0.7rem', cursor: 'pointer' }}
                                                >
                                                    {Object.entries(PROJECT_STATUSES).map(([key, val]) => (
                                                        <option key={key} value={key}>{val.icon} {val.label}</option>
                                                    ))}
                                                </select>
                                                <button onClick={() => setActiveProjectChat(activeProjectChat === proj.id ? null : proj.id)} className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>
                                                    💬 Chat
                                                </button>
                                                {proj.preview_url && <button onClick={() => setViewingProjectUrl(proj.preview_url)} className="btn-secondary" style={{ padding: '0.2rem 0.5rem', fontSize: '0.7rem' }}>👁 Live</button>}
                                            </div>

                                            {/* Chat Box Expansion */}
                                            {activeProjectChat === proj.id && (
                                                <div style={{ marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                                                    <div style={{ height: '400px', background: '#000', borderRadius: '8px', overflow: 'hidden' }}>
                                                        <ChatPanel projectId={proj.id} projectTitle={proj.title} clientEmail={selectedClient.email} />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* QUOTES COLUMN */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '0.85rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>DEVIS</h3>
                                <button className="btn-secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem' }} onClick={() => { setEditQuote({ client_id: selectedClient.id }); setShowQuoteBuilder(true); }}>+ Devis</button>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {quotes.filter(q => q.client_id === selectedClient.id).length === 0 ? (
                                    <p className="admin-empty" style={{ fontSize: '0.8rem', padding: '1.5rem' }}>Aucun devis pour ce client.</p>
                                ) : quotes.filter(q => q.client_id === selectedClient.id).map(quote => {
                                    const s = STATUS_STYLES[quote.status] || STATUS_STYLES.draft;
                                    return (
                                        <div key={quote.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }}>{quote.quote_number}</p>
                                                <p style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-color)', fontWeight: 700, fontSize: '0.85rem', marginTop: '0.2rem' }}>{parseFloat(quote.total || 0).toFixed(0)} €</p>
                                            </div>
                                            <span style={{ padding: '0.2rem 0.6rem', borderRadius: '4px', background: s.bg, color: s.color, fontSize: '0.65rem', fontFamily: 'var(--font-mono)' }}>{s.label}</span>
                                            <div style={{ display: 'flex', gap: '0.4rem' }}>
                                                {quote.status === 'accepted' && quote.payment_type === 'subscription' && (
                                                    <button 
                                                        className="cta-primary" 
                                                        style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} 
                                                        onClick={async () => {
                                                            if (!window.confirm("Lancer l'abonnement mensuel pour ce client ?")) return;
                                                            try {
                                                                const res = await fetch('/api/start-subscription', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    body: JSON.stringify({
                                                                        clientEmail: selectedClient.email,
                                                                        monthlyFee: quote.monthly_fee,
                                                                        quoteId: quote.id
                                                                    })
                                                                });
                                                                const data = await res.json();
                                                                if (data.success) alert("Abonnement lancé avec succès !");
                                                                else alert("Erreur: " + data.message);
                                                            } catch (e) {
                                                                alert("Erreur système.");
                                                            }
                                                        }}>
                                                        🚀 Abonner ({quote.monthly_fee}€/m)
                                                    </button>
                                                )}
                                                <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={() => generateQuotePDF(quote, selectedClient)}>📄</button>
                                                <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={() => { setEditQuote(quote); setShowQuoteBuilder(true); }}>✏️</button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* VAULT COLUMN */}
                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                <h3 style={{ fontSize: '0.85rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>VAULT</h3>
                                <label className="btn-secondary" style={{ padding: '0.2rem 0.6rem', fontSize: '0.75rem', cursor: uploadingDoc ? 'wait' : 'pointer' }}>
                                    {uploadingDoc ? '⏳' : '+ Doc'}
                                    <input type="file" style={{ display: 'none' }} disabled={uploadingDoc} onChange={async (e) => {
                                        const file = e.target.files[0];
                                        if (!file) return;
                                        setUploadingDoc(true);
                                        await addClientDocument({
                                            client_id: selectedClient.id,
                                            title: file.name,
                                            type: 'other'
                                        }, file);
                                        setUploadingDoc(false);
                                    }} />
                                </label>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                {clientDocuments.filter(d => d.client_id === selectedClient.id).length === 0 ? (
                                    <p className="admin-empty" style={{ fontSize: '0.8rem', padding: '1.5rem' }}>Coffre vide.</p>
                                ) : clientDocuments.filter(d => d.client_id === selectedClient.id).map(doc => (
                                    <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 1rem', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</p>
                                            <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.2rem' }}>{doc.type.toUpperCase()}</p>
                                        </div>
                                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                                            <button className="btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={async () => {
                                                const url = await downloadClientDocument(doc.file_url);
                                                if (url) window.open(url, '_blank');
                                            }}>👁</button>
                                            <button className="btn-danger" style={{ padding: '0.25rem 0.5rem', fontSize: '0.7rem' }} onClick={() => {
                                                if(window.confirm('Supprimer ce document ?')) deleteClientDocument(doc.id, doc.file_url);
                                            }}>✕</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* ── CLIENT FORM MODAL ────────────────────────── */}
            {showClientForm && (
                <div className="modal-overlay" onClick={() => setShowClientForm(false)}>
                    <div className="modal-content admin-panel" style={{ maxWidth: '500px' }} onClick={e => e.stopPropagation()}>
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
                            <button type="submit" className="btn-primary" disabled={saving} style={{ marginTop: '0.5rem' }}>
                                {saving ? 'Enregistrement...' : editClient ? 'Mettre à jour' : 'Créer le client'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── PROJECT FORM MODAL ───────────────────────── */}
            {showProjectForm && (
                <div className="modal-overlay" onClick={() => setShowProjectForm(false)}>
                    <div className="modal-content admin-panel" style={{ maxWidth: '520px' }} onClick={e => e.stopPropagation()}>
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
                                <input className="admin-input" style={{ gridColumn: '1 / -1' }} type="url" placeholder="URL de prévisualisation (ex: https://...)" value={projectForm.preview_url || ''} onChange={e => setProjectForm(p => ({ ...p, preview_url: e.target.value }))} />
                            </div>
                            <button type="submit" className="btn-primary" disabled={saving}>
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
            {/* ── PROJECT VIEWER ───────────────────────────── */}
            {viewingProjectUrl && (
                <ProjectViewer
                    url={viewingProjectUrl}
                    title="Aperçu du Projet"
                    onClose={() => setViewingProjectUrl(null)}
                />
            )}
        </div>
    );
};

export default AdminCRM;
