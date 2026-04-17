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
    <div className="admin-stat-card">
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span className="admin-stat-label">{label}</span>
            <span style={{ fontSize: '1.2rem', opacity: 0.8 }}>{icon}</span>
        </div>
        <div className="admin-stat-value" style={{ color }}>
            {value}
        </div>
        {sub && <p className="admin-stat-trend">{sub}</p>}
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
            <div className="admin-stats-grid">
                <StatCard label="CA CE MOIS" value={`${financials.revenueThisMonth.toFixed(0)} €`} sub="Factures encaissées" icon="📈" color="var(--accent-color)" />
                <StatCard label="CA CETTE ANNÉE" value={`${financials.revenueThisYear.toFixed(0)} €`} sub={`${thisYear}`} icon="💶" color="var(--accent-color)" />
                <StatCard label="EN ATTENTE" value={`${pendingAmount.toFixed(0)} €`} sub="Factures non encaissées" icon="⏳" color={pendingAmount > 0 ? '#ffcc44' : 'rgba(255,255,255,0.4)'} />
                <StatCard label="CHARGES SOCIALES EST." value={`${financials.socialChargesEstimate.toFixed(0)} €`} sub={`21.5% AE (services BIC)`} icon="🏛" color="#ff8c44" />
                <StatCard label="DÉPENSES" value={`${financials.totalExpenses.toFixed(0)} €`} sub={`${thisYear}`} icon="💸" color="rgba(255,100,100,0.9)" />
                <StatCard label="NET ESTIMÉ" value={`${financials.netEstimate.toFixed(0)} €`} sub="Après charges & dépenses" icon="✅" color={financials.netEstimate > 0 ? 'var(--accent-color)' : '#ff8080'} />
            </div>

            {/* ── REVENUE CHART ─────────────────────────────── */}
            <div className="admin-panel">
                <h3 className="admin-stat-label" style={{ marginBottom: '1.5rem' }}>CA MENSUEL — 6 DERNIERS MOIS</h3>
                <BarChart data={monthlyData} maxValue={chartMax} />
            </div>

            <div className="admin-form-grid">

                {/* ── EXPENSE FORM ──────────────────────────── */}
                <div className="admin-panel">
                    <h3 className="admin-stat-label" style={{ marginBottom: '1.25rem' }}>AJOUTER UNE DÉPENSE</h3>
                    <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <div className="admin-form-grid">
                            <input type="date" className="admin-input" value={expenseForm.date}
                                onChange={e => setExpenseForm(p => ({ ...p, date: e.target.value }))}
                                style={{ colorScheme: 'dark' }} />
                            <select className="admin-select" value={expenseForm.category}
                                onChange={e => setExpenseForm(p => ({ ...p, category: e.target.value }))}>
                                {EXPENSE_CATEGORIES.map(cat => (
                                    <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                                ))}
                            </select>
                        </div>
                        <input type="text" className="admin-input" placeholder="Description (ex: Abonnement Figma)" value={expenseForm.description}
                            onChange={e => setExpenseForm(p => ({ ...p, description: e.target.value }))} required />
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <input type="number" className="admin-input" placeholder="Montant (€)" min="0" step="0.01" value={expenseForm.amount}
                                onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))} required />
                            <button type="submit" className="btn-primary" disabled={savingExpense}>
                                {savingExpense ? '...' : '+ Ajouter'}
                            </button>
                        </div>
                    </form>

                    {/* Expense breakdown by category */}
                    <div style={{ marginTop: '2rem' }}>
                        <p className="admin-stat-label" style={{ marginBottom: '0.75rem' }}>RÉPARTITION {thisYear}</p>
                        {EXPENSE_CATEGORIES.map(cat => {
                            const amount = expenseByCategory[cat] || 0;
                            const total = financials.totalExpenses || 1;
                            const pct = Math.round((amount / total) * 100);
                            return amount > 0 ? (
                                <div key={cat} style={{ marginBottom: '0.6rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                                        <span style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)' }}>{CATEGORY_LABELS[cat]}</span>
                                        <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'rgba(255,255,255,0.7)' }}>{amount.toFixed(0)} €</span>
                                    </div>
                                    <div className="admin-progress">
                                        <div className="admin-progress-fill" style={{ width: `${pct}%`, background: 'rgba(255,100,100,0.7)' }} />
                                    </div>
                                </div>
                            ) : null;
                        })}
                    </div>
                </div>

                {/* ── EXPENSE LIST ──────────────────────────── */}
                <div className="admin-panel" style={{ overflowY: 'auto', maxHeight: '420px', padding: '1.5rem' }}>
                    <h3 className="admin-stat-label" style={{ marginBottom: '1.25rem' }}>DERNIÈRES DÉPENSES</h3>
                    {expenses.length === 0 ? (
                        <p className="admin-empty" style={{ padding: '1rem 0' }}>Aucune dépense enregistrée.</p>
                    ) : (
                        <div className="admin-list">
                            {expenses.slice(0, 20).map(expense => (
                                <div key={expense.id} className="admin-list-item" style={{ cursor: 'default' }}>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.9)', marginBottom: '0.1rem' }}>{expense.description}</p>
                                        <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>
                                            {CATEGORY_LABELS[expense.category]} · {new Date(expense.date).toLocaleDateString('fr-FR')}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                        <span style={{ fontFamily: 'var(--font-mono)', color: '#ff8080', fontWeight: 600, fontSize: '0.9rem' }}>
                                            -{expense.amount} €
                                        </span>
                                        <button
                                            onClick={() => deleteExpense(expense.id)}
                                            className="btn-ghost"
                                            title="Supprimer"
                                            style={{ color: '#ff8080' }}
                                        >✕</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── INVOICES LIST ─────────────────────────────── */}
            <div className="admin-panel">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 className="admin-stat-label" style={{ marginBottom: 0 }}>FACTURES</h3>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {['all', 'pending', 'paid', 'overdue'].map(status => (
                            <button
                                key={status}
                                onClick={() => setInvoiceFilter(status)}
                                className={invoiceFilter === status ? 'btn-secondary' : 'btn-ghost'}
                                style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem', borderColor: invoiceFilter === status ? 'var(--accent-color)' : 'transparent', color: invoiceFilter === status ? 'var(--accent-color)' : 'inherit' }}
                            >
                                {status === 'all' ? 'Toutes' : status === 'pending' ? 'En attente' : status === 'paid' ? 'Payées' : 'En retard'}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredInvoices.length === 0 ? (
                    <div className="admin-empty">
                        <div className="admin-empty-icon">📄</div>
                        <p>Aucune facture avec ce statut.</p>
                    </div>
                ) : (
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Nº Facture</th>
                                <th>Client (Type)</th>
                                <th>Statut</th>
                                <th style={{ textAlign: 'right' }}>Total</th>
                                <th style={{ textAlign: 'right' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredInvoices.map(inv => {
                                const statusClass = inv.status;
                                const statusLabels = {
                                    paid: 'Payée', pending: 'En attente', overdue: 'En retard', draft: 'Brouillon', sent: 'Envoyée'
                                };
                                return (
                                    <tr key={inv.id}>
                                        <td style={{ fontFamily: 'var(--font-mono)' }}>{inv.invoice_number}</td>
                                        <td>{inv.clients?.name || '—'} <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem' }}>({inv.type === 'deposit' ? 'Acompte' : 'Solde'})</span></td>
                                        <td><span className={`status-badge ${statusClass}`}>{statusLabels[statusClass] || 'Doc'}</span></td>
                                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-color)' }}>
                                            {parseFloat(inv.total || 0).toFixed(0)} €
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <button onClick={() => generateInvoicePDF(inv, inv.clients)} className="btn-secondary" style={{ display: 'inline-flex', padding: '0.4rem 0.8rem' }} title="Télécharger PDF">
                                                📄 PDF
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default FinanceDashboard;
