import React, { useState } from 'react';
import { useFreelance } from '../context/FreelanceContext';
import { generateQuotePDF } from '../services/pdfService';
import Portal from './Portal';

const EMPTY_LINE_ITEM = { description: '', quantity: 1, unit_price: 0 };

const QuoteBuilder = ({ clients, onClose, editQuote = null, defaultClientId = '' }) => {
    const { addQuote, updateQuote } = useFreelance();

    const [form, setForm] = useState({
        client_id: editQuote?.client_id || defaultClientId || '',
        line_items: editQuote?.line_items || [{ ...EMPTY_LINE_ITEM }],
        valid_until: editQuote?.valid_until || '',
        notes: editQuote?.notes || '',
        status: editQuote?.status || 'draft',
        payment_type: editQuote?.payment_type || 'one_off',
        monthly_fee: editQuote?.monthly_fee || 0,
        duration_months: editQuote?.duration_months || 0,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    // Compute subtotal & total from line items
    const subtotal = form.line_items.reduce((sum, item) =>
        sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unit_price) || 0), 0
    );
    const total = subtotal; // Auto-entrepreneur: no VAT
    const deposit = parseFloat((total * 0.30).toFixed(2));

    const updateLineItem = (index, field, value) => {
        setForm(prev => {
            const items = [...prev.line_items];
            items[index] = { ...items[index], [field]: value };
            return { ...prev, line_items: items };
        });
    };

    const addLineItem = () => {
        setForm(prev => ({
            ...prev,
            line_items: [...prev.line_items, { ...EMPTY_LINE_ITEM }]
        }));
    };

    const removeLineItem = (index) => {
        setForm(prev => ({
            ...prev,
            line_items: prev.line_items.filter((_, i) => i !== index)
        }));
    };

    const handleSave = async (sendStatus = null) => {
        if (!form.client_id) { setError('Sélectionne un client.'); return; }
        if (form.line_items.length === 0 || !form.line_items[0].description) {
            setError('Ajoute au moins une prestation.'); return;
        }
        setError('');
        setSaving(true);

        const payload = {
            ...form,
            subtotal: parseFloat(subtotal.toFixed(2)),
            total: parseFloat(total.toFixed(2)),
            deposit_amount: deposit,
            status: sendStatus || form.status,
            payment_type: form.payment_type,
            monthly_fee: parseFloat(form.monthly_fee || 0),
            duration_months: parseInt(form.duration_months || 0),
        };

        let result;
        if (editQuote) {
            result = await updateQuote(editQuote.id, payload);
        } else {
            result = await addQuote(payload);
        }

        setSaving(false);
        if (!result.success) {
            setError(result.message || 'Erreur lors de la sauvegarde');
        } else {
            onClose?.();
        }
    };

    const handlePreviewPDF = () => {
        const client = clients.find(c => c.id === form.client_id);
        const mockQuote = {
            ...form,
            quote_number: editQuote?.quote_number || 'DEVIS-PREVIEW',
            created_at: new Date().toISOString(),
            subtotal,
            total,
            deposit_amount: deposit,
            payment_type: form.payment_type,
            monthly_fee: form.monthly_fee,
            duration_months: form.duration_months,
        };
        generateQuotePDF(mockQuote, client);
    };

    return (
        <Portal>
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content glass-panel quote-builder"
                style={{ maxWidth: '780px' }}
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                    <div>
                        <h2 style={{ color: 'var(--accent-color)', fontFamily: 'var(--font-mono)', fontSize: '1.1rem', letterSpacing: '2px' }}>
                            {editQuote ? '✏️ MODIFIER LE DEVIS' : '✦ NOUVEAU DEVIS'}
                        </h2>
                        {editQuote && <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginTop: '0.25rem', fontFamily: 'var(--font-mono)' }}>{editQuote.quote_number}</p>}
                    </div>
                    <button className="close-btn" onClick={onClose}>✕</button>
                </div>

                {error && (
                    <div style={{ background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.3)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1.5rem', color: '#ff8080', fontSize: '0.85rem' }}>
                        ⚠️ {error}
                    </div>
                )}

                {/* Client */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label className="admin-label">CLIENT *</label>
                    <select
                        className="admin-input"
                        value={form.client_id}
                        onChange={e => setForm(prev => ({ ...prev, client_id: e.target.value }))}
                    >
                        <option value="">— Sélectionner un client —</option>
                        {clients.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.email})</option>
                        ))}
                    </select>
                </div>

                {/* Validity */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label className="admin-label">VALABLE JUSQU'AU</label>
                    <input
                        type="date"
                        className="admin-input"
                        value={form.valid_until}
                        onChange={e => setForm(prev => ({ ...prev, valid_until: e.target.value }))}
                        style={{ colorScheme: 'dark' }}
                    />
                </div>

                {/* Line Items */}
                <div style={{ marginBottom: '1.5rem' }}>
                    <label className="admin-label">PRESTATIONS *</label>

                    <div style={{ overflowX: 'auto' }}>
                        {/* Column headers */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 24px', gap: '0.5rem', padding: '0.4rem 0.5rem', background: 'rgba(255,255,255,0.03)', borderRadius: '8px 8px 0 0', marginBottom: '2px' }}>
                            <span style={{ fontSize: '0.65rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>DESCRIPTION</span>
                            <span style={{ fontSize: '0.65rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>QTÉ</span>
                            <span style={{ fontSize: '0.65rem', letterSpacing: '1px', color: 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-mono)' }}>P.U. (€)</span>
                            <span />
                        </div>

                        {form.line_items.map((item, index) => (
                            <div key={index} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 24px', gap: '0.5rem', marginBottom: '0.4rem', alignItems: 'center' }}>
                                <input
                                    type="text"
                                    className="admin-input"
                                    placeholder="Développement site web, Design UI..."
                                    value={item.description}
                                    onChange={e => updateLineItem(index, 'description', e.target.value)}
                                    style={{ fontSize: '0.85rem' }}
                                />
                                <input
                                    type="number"
                                    className="admin-input"
                                    min="1"
                                    value={item.quantity}
                                    onChange={e => updateLineItem(index, 'quantity', e.target.value)}
                                    style={{ fontSize: '0.85rem', textAlign: 'center' }}
                                />
                                <input
                                    type="number"
                                    className="admin-input"
                                    min="0"
                                    step="0.01"
                                    placeholder="0.00"
                                    value={item.unit_price}
                                    onChange={e => updateLineItem(index, 'unit_price', e.target.value)}
                                    style={{ fontSize: '0.85rem', textAlign: 'right' }}
                                />
                                <button
                                    onClick={() => removeLineItem(index)}
                                    style={{ background: 'none', border: 'none', color: 'rgba(255,80,80,0.7)', cursor: 'pointer', fontSize: '0.9rem', padding: '0' }}
                                    disabled={form.line_items.length <= 1}
                                >
                                    ✕
                                </button>
                            </div>
                        ))}
                    </div>

                    <button
                        onClick={addLineItem}
                        className="cta-secondary"
                        style={{ marginTop: '0.75rem', padding: '0.4rem 1rem', fontSize: '0.8rem' }}
                    >
                        + Ajouter une ligne
                    </button>
                </div>

                {/* Totals Summary */}
                <div style={{
                    background: 'rgba(57,255,20,0.05)',
                    border: '1px solid rgba(57,255,20,0.15)',
                    borderRadius: '12px',
                    padding: '1.25rem 1.5rem',
                    marginBottom: '1.5rem',
                }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Sous-total</span>
                        <span style={{ fontFamily: 'var(--font-mono)', color: '#fff' }}>{subtotal.toFixed(2)} €</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', paddingBottom: '0.75rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontFamily: 'var(--font-mono)' }}>TVA non applicable, art. 293 B du CGI</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <span style={{ color: '#fff', fontWeight: 700, fontSize: '1rem' }}>TOTAL TTC</span>
                        <span style={{ color: 'var(--accent-color)', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem' }}>{total.toFixed(2)} €</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', background: 'rgba(57,255,20,0.1)', borderRadius: '8px', padding: '0.6rem 0.75rem' }}>
                        <span style={{ color: 'var(--accent-color)', fontSize: '0.85rem' }}>⬇ Acompte 30%</span>
                        <span style={{ color: 'var(--accent-color)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{deposit.toFixed(2)} €</span>
                    </div>
                </div>

                {/* Paiement / Abonnement */}
                <div style={{ marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '1.25rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <label className="admin-label">MODE DE FACTURATION</label>
                        <select
                            className="admin-input"
                            value={form.payment_type}
                            onChange={e => setForm(prev => ({ ...prev, payment_type: e.target.value }))}
                        >
                            <option value="one_off">Paiement Comptant (Acompte + Reste à la livraison)</option>
                            <option value="subscription">Abonnement Mensuel (Acompte + Abonn. post-livraison)</option>
                        </select>
                    </div>

                    {form.payment_type === 'subscription' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '1rem' }}>
                            <div>
                                <label className="admin-label">MENSUALITÉ (€ / MOIS)</label>
                                <input
                                    type="number"
                                    className="admin-input"
                                    min="0"
                                    step="0.01"
                                    placeholder="ex: 299.00"
                                    value={form.monthly_fee}
                                    onChange={e => setForm(prev => ({ ...prev, monthly_fee: e.target.value }))}
                                />
                            </div>
                            <div>
                                <label className="admin-label">DURÉE (EN MOIS)</label>
                                <input
                                    type="number"
                                    className="admin-input"
                                    min="0"
                                    placeholder="ex: 12 (0 = sans engagement)"
                                    value={form.duration_months}
                                    onChange={e => setForm(prev => ({ ...prev, duration_months: e.target.value }))}
                                />
                                <p style={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.3)', marginTop: '0.3rem' }}>0 = Renouvellement illimité</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Notes */}
                <div style={{ marginBottom: '2rem' }}>
                    <label className="admin-label">NOTES / CONDITIONS</label>
                    <textarea
                        className="admin-input"
                        rows={3}
                        placeholder="Conditions de paiement, délais, mentions particulières..."
                        value={form.notes}
                        onChange={e => setForm(prev => ({ ...prev, notes: e.target.value }))}
                        style={{ resize: 'vertical' }}
                    />
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                    <button className="filter-btn" onClick={handlePreviewPDF} style={{ fontSize: '0.85rem' }}>
                        📄 Aperçu PDF
                    </button>
                    <button
                        className="cta-secondary"
                        onClick={() => handleSave('draft')}
                        disabled={saving}
                        style={{ fontSize: '0.85rem' }}
                    >
                        Sauvegarder (Brouillon)
                    </button>
                    <button
                        className="cta-primary"
                        onClick={() => handleSave('sent')}
                        disabled={saving}
                        style={{ marginLeft: 'auto', fontSize: '0.85rem' }}
                    >
                        {saving ? 'Envoi...' : '✉ Envoyer au client'}
                    </button>
                </div>
            </div>
        </div>
        </Portal>
    );
};

export default QuoteBuilder;
