import React, { useState, useMemo } from 'react';
import { useFreelance } from '../context/FreelanceContext';
import { generateInvoicePDF } from '../services/pdfService';

// Auto-entrepreneur social charges rate for services (prestations BIC)
const AE_RATE = 0.215; // 21.5%

// Mini bar chart component (no external deps)
const BarChart = ({ data, maxValue }) => (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '6px', height: '80px' }}>
        {data.map((bar, i) => {
            const height = maxValue > 0 ? (bar.value / maxValue) * 100 : 0;
            return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                        {bar.value > 0 ? `${Math.round(bar.value)}€` : ''}
                    </span>
                    <div
                        style={{
                            width: '100%',
                            height: `${Math.max(height, bar.value > 0 ? 4 : 0)}%`,
                            background: bar.isCurrentMonth
                                ? 'linear-gradient(to top, rgba(57,255,20,0.8), rgba(57,255,20,0.3))'
                                : 'rgba(255,255,255,0.08)',
                            borderRadius: '3px 3px 0 0',
                            transition: 'height 0.6s ease',
                            minHeight: bar.value > 0 ? '4px' : '0',
                        }}
                    />
                    <span style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
                        {bar.label}
                    </span>
                </div>
            );
        })}
    </div>
);

const StatCard = ({ label, value, sub, color = 'var(--accent-color)', icon }) => (
    <div className="glass-panel" style={{ padding: '1.25rem 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.65rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>{label}</span>
            <span style={{ fontSize: '1.2rem' }}>{icon}</span>
        </div>
        <div style={{ fontSize: '1.6rem', fontWeight: 700, color, fontFamily: 'var(--font-mono)', lineHeight: 1.2 }}>
            {value}
        </div>
        {sub && <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)', marginTop: '0.4rem' }}>{sub}</p>}
    </div>
);

const EXPENSE_CATEGORIES = ['software', 'hardware', 'marketing', 'office', 'transport', 'other'];
const CATEGORY_LABELS = {
    software: '💻 Logiciels',
    hardware: '🖥 Matériel',
    marketing: '📣 Marketing',
    office: '🏠 Bureau',
    transport: '🚗 Transport',
    other: '📦 Autre',
};

const FinanceDashboard = () => {
    const { invoices, expenses, clients, addExpense, deleteExpense, computeFinancials } = useFreelance();

    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();

    const financials = useMemo(() => computeFinancials(), [invoices, expenses]);

    // Build monthly revenue chart (last 6 months)
    const monthlyData = useMemo(() => {
        const months = [];
        const MONTH_NAMES = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

        for (let i = 5; i >= 0; i--) {
            const d = new Date(thisYear, thisMonth - i, 1);
            const monthIndex = d.getMonth();
            const year = d.getFullYear();
            const value = invoices
                .filter(inv => inv.status === 'paid' && inv.paid_at)
                .filter(inv => {
                    const paidDate = new Date(inv.paid_at);
                    return paidDate.getMonth() === monthIndex && paidDate.getFullYear() === year;
                })
                .reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);

            months.push({
                label: MONTH_NAMES[monthIndex],
                value,
                isCurrentMonth: i === 0,
            });
        }
        return months;
    }, [invoices]);

    const chartMax = Math.max(...monthlyData.map(m => m.value), 1);

    // Expense breakdown by category this year
    const expenseByCategory = useMemo(() => {
        const breakdown = {};
        EXPENSE_CATEGORIES.forEach(cat => { breakdown[cat] = 0; });
        expenses
            .filter(e => new Date(e.date).getFullYear() === thisYear)
            .forEach(e => {
                breakdown[e.category] = (breakdown[e.category] || 0) + parseFloat(e.amount || 0);
            });
        return breakdown;
    }, [expenses]);

    // Expense form
    const [expenseForm, setExpenseForm] = useState({
        date: new Date().toISOString().slice(0, 10),
        category: 'software',
        description: '',
        amount: '',
    });
    const [savingExpense, setSavingExpense] = useState(false);

    const handleAddExpense = async (e) => {
        e.preventDefault();
        if (!expenseForm.description || !expenseForm.amount) return;
        setSavingExpense(true);
        await addExpense(expenseForm);
        setExpenseForm(prev => ({ ...prev, description: '', amount: '' }));
        setSavingExpense(false);
    };

    // Invoice status filter
    const [invoiceFilter, setInvoiceFilter] = useState('all');
    const filteredInvoices = invoiceFilter === 'all'
        ? invoices
        : invoices.filter(i => i.status === invoiceFilter);

    const pendingAmount = invoices
        .filter(i => i.status === 'pending' || i.status === 'overdue')
        .reduce((sum, i) => sum + parseFloat(i.total || 0), 0);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* ── KPI CARDS ─────────────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                <StatCard
                    label="CA CE MOIS"
                    value={`${financials.revenueThisMonth.toFixed(0)} €`}
                    sub="Factures encaissées"
                    icon="📈"
                    color="var(--accent-color)"
                />
                <StatCard
                    label="CA CETTE ANNÉE"
                    value={`${financials.revenueThisYear.toFixed(0)} €`}
                    sub={`${thisYear}`}
                    icon="💶"
                    color="var(--accent-color)"
                />
                <StatCard
                    label="EN ATTENTE"
                    value={`${pendingAmount.toFixed(0)} €`}
                    sub="Factures non encaissées"
                    icon="⏳"
                    color={pendingAmount > 0 ? '#ffcc44' : 'rgba(255,255,255,0.4)'}
                />
                <StatCard
                    label="CHARGES SOCIALES EST."
                    value={`${financials.socialChargesEstimate.toFixed(0)} €`}
                    sub={`21.5% AE (services BIC)`}
                    icon="🏛"
                    color="#ff8c44"
                />
                <StatCard
                    label="DÉPENSES"
                    value={`${financials.totalExpenses.toFixed(0)} €`}
                    sub={`${thisYear}`}
                    icon="💸"
                    color="rgba(255,100,100,0.9)"
                />
                <StatCard
                    label="NET ESTIMÉ"
                    value={`${financials.netEstimate.toFixed(0)} €`}
                    sub="Après charges & dépenses"
                    icon="✅"
                    color={financials.netEstimate > 0 ? 'var(--accent-color)' : '#ff8080'}
                />
            </div>

            {/* ── REVENUE CHART ─────────────────────────────── */}
            <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
                <h3 style={{ fontSize: '0.75rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginBottom: '1.5rem' }}>
                    CA MENSUEL — 6 DERNIERS MOIS
                </h3>
                <BarChart data={monthlyData} maxValue={chartMax} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>

                {/* ── EXPENSE FORM ──────────────────────────── */}
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '0.75rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginBottom: '1.25rem' }}>
                        AJOUTER UNE DÉPENSE
                    </h3>
                    <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                            <input type="date" className="admin-input" value={expenseForm.date}
                                onChange={e => setExpenseForm(p => ({ ...p, date: e.target.value }))}
                                style={{ colorScheme: 'dark', fontSize: '0.85rem' }} />
                            <select className="admin-input" value={expenseForm.category}
                                onChange={e => setExpenseForm(p => ({ ...p, category: e.target.value }))}
                                style={{ fontSize: '0.85rem' }}>
                                {EXPENSE_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                                ))}
                            </select>
                        </div>
                        <input type="text" className="admin-input" placeholder="Description (ex: Abonnement Figma)" value={expenseForm.description}
                            onChange={e => setExpenseForm(p => ({ ...p, description: e.target.value }))}
                            style={{ fontSize: '0.85rem' }} required />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input type="number" className="admin-input" placeholder="Montant (€)" min="0" step="0.01" value={expenseForm.amount}
                                onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))}
                                style={{ fontSize: '0.85rem' }} required />
                            <button type="submit" className="cta-primary" disabled={savingExpense} style={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                {savingExpense ? '...' : '+ Ajouter'}
                            </button>
                        </div>
                    </form>

                    {/* Expense breakdown by category */}
                    <div style={{ marginTop: '1.5rem' }}>
                        <p style={{ fontSize: '0.65rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.3)', marginBottom: '0.75rem', fontFamily: 'var(--font-mono)' }}>
                            RÉPARTITION {thisYear}
                        </p>
                        {EXPENSE_CATEGORIES.map(cat => {
                            const amount = expenseByCategory[cat] || 0;
                            const total = financials.totalExpenses || 1;
                            const pct = Math.round((amount / total) * 100);
                            return amount > 0 ? (
                                <div key={cat} style={{ marginBottom: '0.6rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{CATEGORY_LABELS[cat]}</span>
                                        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.5)' }}>{amount.toFixed(0)} €</span>
                                    </div>
                                    <div style={{ height: '4px', background: 'rgba(255,255,255,0.06)', borderRadius: '2px' }}>
                                        <div style={{ height: '100%', width: `${pct}%`, background: 'rgba(255,100,100,0.7)', borderRadius: '2px', transition: 'width 0.5s' }} />
                                    </div>
                                </div>
                            ) : null;
                        })}
                    </div>
                </div>

                {/* ── EXPENSE LIST ──────────────────────────── */}
                <div className="glass-panel" style={{ padding: '1.5rem', overflowY: 'auto', maxHeight: '420px' }}>
                    <h3 style={{ fontSize: '0.75rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)', marginBottom: '1.25rem' }}>
                        DERNIÈRES DÉPENSES
                    </h3>
                    {expenses.length === 0 ? (
                        <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem' }}>Aucune dépense enregistrée.</p>
                    ) : (
                        expenses.slice(0, 20).map(expense => (
                            <div key={expense.id} style={{
                                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                                padding: '0.6rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)',
                            }}>
                                <div>
                                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', marginBottom: '0.1rem' }}>{expense.description}</p>
                                    <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>
                                        {CATEGORY_LABELS[expense.category]} · {new Date(expense.date).toLocaleDateString('fr-FR')}
                                    </p>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                    <span style={{ fontFamily: 'var(--font-mono)', color: 'rgba(255,100,100,0.9)', fontWeight: 700, fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                                        -{expense.amount} €
                                    </span>
                                    <button
                                        onClick={() => deleteExpense(expense.id)}
                                        style={{ background: 'none', border: 'none', color: 'rgba(255,80,80,0.5)', cursor: 'pointer', fontSize: '0.85rem', padding: '0' }}
                                        title="Supprimer"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* ── INVOICES LIST ─────────────────────────────── */}
            <div className="glass-panel" style={{ padding: '1.5rem 2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontSize: '0.75rem', letterSpacing: '2px', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                        FACTURES
                    </h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['all', 'pending', 'paid', 'overdue'].map(status => (
                            <button
                                key={status}
                                onClick={() => setInvoiceFilter(status)}
                                className={`filter-btn ${invoiceFilter === status ? 'active' : ''}`}
                                style={{ padding: '0.3rem 0.75rem', fontSize: '0.7rem' }}
                            >
                                {status === 'all' ? 'Toutes' : status === 'pending' ? 'En attente' : status === 'paid' ? 'Payées' : 'En retard'}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredInvoices.length === 0 ? (
                    <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.85rem', textAlign: 'center', padding: '2rem' }}>Aucune facture.</p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        {filteredInvoices.map(inv => {
                            const statusStyles = {
                                paid: { color: '#39ff14', bg: 'rgba(57,255,20,0.1)', label: '✓ Payée' },
                                pending: { color: '#ffcc44', bg: 'rgba(255,200,50,0.1)', label: '⏳ En attente' },
                                overdue: { color: '#ff5050', bg: 'rgba(255,80,80,0.1)', label: '⚠ En retard' },
                                draft: { color: '#888', bg: 'rgba(128,128,128,0.1)', label: 'Brouillon' },
                                sent: { color: '#44aaff', bg: 'rgba(68,170,255,0.1)', label: '✉ Envoyée' },
                            };
                            const s = statusStyles[inv.status] || statusStyles.draft;

                            return (
                                <div key={inv.id} style={{
                                    display: 'flex', alignItems: 'center', gap: '1rem',
                                    padding: '0.75rem 1rem',
                                    background: 'rgba(255,255,255,0.03)',
                                    borderRadius: '10px',
                                    border: '1px solid rgba(255,255,255,0.05)',
                                }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <p style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', marginBottom: '0.2rem' }}>
                                            {inv.invoice_number}
                                        </p>
                                        <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.35)' }}>
                                            {inv.clients?.name || '—'} · {inv.type === 'deposit' ? 'Acompte' : 'Solde'}
                                        </p>
                                    </div>
                                    <span style={{
                                        padding: '0.25rem 0.6rem', borderRadius: '6px',
                                        background: s.bg, color: s.color,
                                        fontSize: '0.7rem', fontFamily: 'var(--font-mono)', whiteSpace: 'nowrap'
                                    }}>
                                        {s.label}
                                    </span>
                                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--accent-color)', fontWeight: 700, whiteSpace: 'nowrap' }}>
                                        {parseFloat(inv.total || 0).toFixed(0)} €
                                    </span>
                                    <button
                                        onClick={() => generateInvoicePDF(inv, inv.clients)}
                                        className="filter-btn"
                                        style={{ padding: '0.25rem 0.6rem', fontSize: '0.7rem', whiteSpace: 'nowrap' }}
                                        title="Télécharger PDF"
                                    >
                                        📄 PDF
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default FinanceDashboard;
