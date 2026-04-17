import React, { useState, useEffect, useCallback } from 'react';
import { useFreelance } from '../context/FreelanceContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase';

// ─── Mini stat card ─────────────────────────────────────────
const KpiCard = ({ label, value, icon, color = 'var(--accent-color)', onClick, pulse }) => (
    <div
        onClick={onClick}
        className="admin-stat-card"
        style={{
            cursor: onClick ? 'pointer' : 'default',
            border: pulse ? `1px solid ${color}44` : undefined,
        }}
    >
        {pulse && (
            <div style={{ position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: '50%', background: color, animation: 'pulse-dot 2s ease-in-out infinite' }} />
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span className="admin-stat-label">{label}</span>
            <span style={{ fontSize: '1.2rem', opacity: 0.8 }}>{icon}</span>
        </div>
        <p className="admin-stat-value" style={{ color }}>{value}</p>
    </div>
);

// ─── Activity item ─────────────────────────────────────────
const ActivityItem = ({ icon, text, time, color = 'rgba(255,255,255,0.4)', onClick }) => (
    <div
        onClick={onClick}
        style={{
            display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
            padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
            cursor: onClick ? 'pointer' : 'default',
        }}
    >
        <span style={{ fontSize: '1rem', flexShrink: 0, marginTop: '1px' }}>{icon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '0.85rem', color: '#fff', margin: 0, lineHeight: 1.4 }}>{text}</p>
            <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)', margin: '2px 0 0' }}>{time}</p>
        </div>
    </div>
);

// ─── Relative time helper ───────────────────────────────────
const relTime = (ts) => {
    if (!ts) return '';
    const diff = (Date.now() - new Date(ts)) / 1000;
    if (diff < 60) return 'à l\'instant';
    if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
    if (diff < 86400) return `il y a ${Math.floor(diff / 3600)} h`;
    return `il y a ${Math.floor(diff / 86400)} j`;
};

// ─── URSSAF Export helper ────────────────────────────────────
const exportUrssaf = async (year, quarter = null) => {
    const res = await fetch('/api/export-urssaf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ year, quarter }),
    });

    if (!res.ok) {
        const err = await res.json();
        alert('Erreur export: ' + (err.message || 'Inconnue'));
        return;
    }

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mido-urssaf-${quarter ? `T${quarter}-` : ''}${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
};

// ─── Send quote email helper ─────────────────────────────────
const sendQuoteEmail = async (quote, client) => {
    const res = await fetch('/api/send-quote-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            clientEmail: client?.email,
            clientName: client?.name,
            quoteNumber: quote.quote_number,
            total: parseFloat(quote.total).toFixed(2),
            depositAmount: parseFloat(quote.deposit_amount).toFixed(2),
            validUntil: quote.valid_until ? new Date(quote.valid_until).toLocaleDateString('fr-FR') : null,
            notes: quote.notes,
        }),
    });
    return res.ok;
};

// ─── Invite client helper ────────────────────────────────────
const inviteClient = async (client, projectTitle = '') => {
    const res = await fetch('/api/invite-client', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clientEmail: client.email, clientName: client.name, projectTitle }),
    });
    return res.ok;
};

// ══════════════════════════════════════════════════════════════
// COMMAND CENTER COMPONENT
// ══════════════════════════════════════════════════════════════
const AdminCommandCenter = ({ onNavigate }) => {
    const { clients, quotes, invoices, freelanceProjects, expenses, unreadCount, computeFinancials, updateQuote, markInvoicePaid } = useFreelance();
    const [recentMessages, setRecentMessages] = useState([]);
    const [sendingInvite, setSendingInvite] = useState(null);
    const [sendingQuote, setSendingQuote] = useState(null);
    const [exportYear] = useState(new Date().getFullYear());
    const [exportQ, setExportQ] = useState(null);

    // Fetch recent messages for the activity feed
    useEffect(() => {
        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*, freelance_projects(title)')
                .eq('sender_type', 'client')
                .order('created_at', { ascending: false })
                .limit(5);
            setRecentMessages(data || []);
        };
        fetchMessages();

        // Realtime subscription for new messages
        const channel = supabase.channel('admin-activity')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'sender_type=eq.client' }, () => {
                fetchMessages();
            })
            .subscribe();

        return () => supabase.removeChannel(channel);
    }, []);

    // Computed values
    const financials = computeFinancials();
    const pendingQuotes = quotes.filter(q => q.status === 'draft' || q.status === 'sent');
    const pendingInvoices = invoices.filter(i => i.status === 'pending' || i.status === 'overdue');
    const overdueInvoices = invoices.filter(i => i.status === 'overdue');
    const activeProjects = freelanceProjects.filter(p => !['archived', 'delivered'].includes(p.status));
    const pendingRevenue = pendingInvoices.reduce((s, i) => s + parseFloat(i.total || 0), 0);
    const thisMonthRevenue = financials.revenueThisMonth;

    // Activity feed (merging events)
    const activities = [
        ...recentMessages.map(m => ({
            icon: '💬', color: '#39ff14',
            text: `Message de ${m.sender_email?.split('@')[0] || 'client'} — ${m.freelance_projects?.title || m.content?.substring(0, 30) || 'Message'}`,
            time: relTime(m.created_at),
            ts: m.created_at,
            onClick: () => onNavigate('crm'),
        })),
        ...quotes.filter(q => q.status === 'accepted').slice(0, 3).map(q => ({
            icon: '✅', color: '#39ff14',
            text: `Devis accepté — ${q.quote_number} (${q.clients?.name})`,
            time: relTime(q.accepted_at || q.updated_at),
            ts: q.accepted_at || q.updated_at,
            onClick: () => onNavigate('crm'),
        })),
        ...invoices.filter(i => i.status === 'paid').slice(0, 3).map(i => ({
            icon: '💶', color: '#44aaff',
            text: `Paiement reçu — ${i.invoice_number} — ${parseFloat(i.total || 0).toFixed(0)} €`,
            time: relTime(i.paid_at),
            ts: i.paid_at,
            onClick: () => onNavigate('finance'),
        })),
    ].sort((a, b) => new Date(b.ts) - new Date(a.ts)).slice(0, 8);

    const handleInviteClient = async (client) => {
        setSendingInvite(client.id);
        const ok = await inviteClient(client);
        setSendingInvite(null);
        alert(ok ? `✅ Invitation envoyée à ${client.email}` : `❌ Erreur d'envoi`);
    };

    const handleSendQuote = async (quote) => {
        setSendingQuote(quote.id);
        const ok = await sendQuoteEmail(quote, quote.clients);
        if (ok) await updateQuote(quote.id, { status: 'sent' });
        setSendingQuote(null);
        alert(ok ? `✅ Devis envoyé à ${quote.clients?.email}` : `❌ Erreur d'envoi`);
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* ── WELCOME BAR ───────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ color: 'var(--accent-color)', fontFamily: 'var(--font-mono)', fontSize: '1rem', letterSpacing: '2px', margin: 0 }}>
                        ⚡ COMMAND CENTER
                    </h2>
                    <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', margin: '4px 0 0', fontFamily: 'var(--font-mono)' }}>
                        {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </p>
                </div>

                {/* Quick URSSAF export */}
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)' }}>Export URSSAF</span>
                    {[1, 2, 3, 4].map(q => (
                        <button key={q} onClick={() => exportUrssaf(exportYear, q)} className="filter-btn" style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}>
                            T{q}
                        </button>
                    ))}
                    <button onClick={() => exportUrssaf(exportYear)} className="filter-btn" style={{ padding: '0.3rem 0.75rem', fontSize: '0.7rem', borderColor: 'rgba(57,255,20,0.3)', color: 'var(--accent-color)' }}>
                        {exportYear} complet
                    </button>
                </div>
            </div>

            {/* ── KPI GRID ──────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
                <KpiCard label="CA CE MOIS" value={`${thisMonthRevenue.toFixed(0)} €`} icon="📈" color="var(--accent-color)" onClick={() => onNavigate('finance')} />
                <KpiCard label="EN ATTENTE" value={`${pendingRevenue.toFixed(0)} €`} icon="⏳" color={pendingRevenue > 0 ? '#ffcc44' : 'rgba(255,255,255,0.3)'} onClick={() => onNavigate('finance')} pulse={pendingRevenue > 0} />
                <KpiCard label="MESSAGES" value={unreadCount} icon="💬" color={unreadCount > 0 ? '#39ff14' : 'rgba(255,255,255,0.3)'} onClick={() => onNavigate('crm')} pulse={unreadCount > 0} />
                <KpiCard label="DEVIS EN ATTENTE" value={pendingQuotes.length} icon="📋" color={pendingQuotes.length > 0 ? '#ffcc44' : 'rgba(255,255,255,0.3)'} onClick={() => onNavigate('crm')} />
                <KpiCard label="PROJETS ACTIFS" value={activeProjects.length} icon="🏗" color="#44aaff" onClick={() => onNavigate('crm')} />
                <KpiCard label="EN RETARD" value={overdueInvoices.length} icon="⚠️" color={overdueInvoices.length > 0 ? '#ff5050' : 'rgba(255,255,255,0.3)'} pulse={overdueInvoices.length > 0} onClick={() => onNavigate('finance')} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                {/* ── TODO LIST ─────────────────────────────── */}
                <div className="admin-panel">
                    <h3 className="admin-stat-label" style={{ marginBottom: '1.25rem' }}>
                        🔥 À FAIRE MAINTENANT
                    </h3>

                    {pendingQuotes.filter(q => q.status === 'draft').length === 0 &&
                     overdueInvoices.length === 0 &&
                     unreadCount === 0 &&
                     clients.filter(c => c.status === 'prospect').length === 0 ? (
                        <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem' }}>✓ Rien à faire ! T'es à jour 🎉</p>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                            {/* Draft quotes to send */}
                            {pendingQuotes.filter(q => q.status === 'draft').slice(0, 3).map(q => (
                                <div key={q.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,200,50,0.08)', border: '1px solid rgba(255,200,50,0.1)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                                    <div>
                                        <p style={{ fontSize: '0.85rem', color: '#fff', margin: 0 }}>Envoyer {q.quote_number}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0', fontFamily: 'var(--font-mono)' }}>{q.clients?.name} · {parseFloat(q.total).toFixed(0)} €</p>
                                    </div>
                                    <button
                                        onClick={() => handleSendQuote(q)}
                                        disabled={sendingQuote === q.id}
                                        className="btn-primary"
                                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                                    >
                                        {sendingQuote === q.id ? '...' : '✉ Envoyer'}
                                    </button>
                                </div>
                            ))}

                            {/* Overdue invoices */}
                            {overdueInvoices.slice(0, 3).map(inv => (
                                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.15)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                                    <div>
                                        <p style={{ fontSize: '0.85rem', color: '#ff8080', margin: 0 }}>⚠ {inv.invoice_number} en retard</p>
                                        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', margin: '2px 0 0', fontFamily: 'var(--font-mono)' }}>{inv.clients?.name} · {parseFloat(inv.total).toFixed(0)} €</p>
                                    </div>
                                    <button
                                        onClick={() => onNavigate('finance')}
                                        className="filter-btn"
                                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', borderColor: 'rgba(255,80,80,0.3)', color: '#ff8080' }}
                                    >
                                        Voir →
                                    </button>
                                </div>
                            ))}

                            {/* Prospects to invite */}
                            {clients.filter(c => c.status === 'prospect').slice(0, 2).map(c => (
                                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(68,170,255,0.06)', border: '1px solid rgba(68,170,255,0.1)', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                                    <div>
                                        <p style={{ fontSize: '0.85rem', color: '#fff', margin: 0 }}>Inviter {c.name}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.35)', margin: '2px 0 0', fontFamily: 'var(--font-mono)' }}>Prospect non invité</p>
                                    </div>
                                    <button
                                        onClick={() => handleInviteClient(c)}
                                        disabled={sendingInvite === c.id}
                                        className="btn-secondary"
                                        style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem' }}
                                    >
                                        {sendingInvite === c.id ? '...' : '📨 Inviter'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* ── ACTIVITY FEED ─────────────────────────── */}
                <div className="admin-panel">
                    <h3 className="admin-stat-label" style={{ marginBottom: '1.25rem' }}>
                        ⏱ ACTIVITÉ RÉCENTE
                    </h3>

                    {activities.length === 0 ? (
                        <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.85rem', textAlign: 'center', padding: '1.5rem' }}>Aucune activité récente.</p>
                    ) : activities.map((a, i) => (
                        <ActivityItem key={i} {...a} />
                    ))}
                </div>
            </div>

            {/* ── PROJECTS OVERVIEW ─────────────────────────── */}
            {activeProjects.length > 0 && (
                <div className="admin-panel">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                        <h3 className="admin-stat-label">
                            🏗 PROJETS EN COURS
                        </h3>
                        <button onClick={() => onNavigate('crm')} className="btn-ghost" style={{ fontSize: '0.8rem', color: 'var(--accent-color)' }}>
                            Voir tous →
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        {activeProjects.slice(0, 4).map(p => {
                            const STATUS_COLORS = { discovery: '#aaaaff', design: '#ff9944', development: '#44aaff', review: '#ffcc44', delivered: '#39ff14' };
                            const sc = STATUS_COLORS[p.status] || '#aaa';
                            return (
                                <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                                            <span style={{ fontSize: '0.85rem', color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</span>
                                            <span style={{ fontSize: '0.75rem', color: sc, fontFamily: 'var(--font-mono)', flexShrink: 0, marginLeft: '0.5rem' }}>{p.progress || 0}%</span>
                                        </div>
                                        <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                                            <div style={{ height: '100%', width: `${p.progress || 0}%`, background: `linear-gradient(to right, ${sc}66, ${sc})`, borderRadius: '2px', transition: 'width 0.5s' }} />
                                        </div>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>{p.clients?.name || '—'}</span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse-dot {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.5; transform: scale(1.5); }
                }
            `}</style>
        </div>
    );
};

export default AdminCommandCenter;
