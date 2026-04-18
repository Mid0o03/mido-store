/**
 * DepositPayment.jsx
 * Handles the quote acceptance flow:
 * Client signs → Stripe deposit 30% → quote becomes 'accepted' → project activates
 */
import React, { useState } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { stripePromise } from '../stripe';
import { supabase } from '../supabase';

// ─── Inner payment form (needs to be inside <Elements>) ─────
const DepositForm = ({ amount, quote, onSuccess, onCancel }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!stripe || !elements) return;

        setProcessing(true);
        setError('');

        const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: { return_url: window.location.origin + '/client?tab=invoices' },
            redirect: 'if_required',
        });

        if (stripeError) {
            setError(stripeError.message);
            setProcessing(false);
        } else if (paymentIntent?.status === 'succeeded') {
            // Update quote status in Supabase
            const { error: qErr } = await supabase
                .from('quotes')
                .update({ status: 'accepted', signed_at: new Date().toISOString() })
                .eq('id', quote.id);
                
            if (qErr) {
                setError("Payment succeeded but quote update failed: " + qErr.message);
                setProcessing(false);
                return;
            }

            // Create the deposit invoice
            const { data: numData } = await supabase.rpc('generate_invoice_number');
            const { error: iErr } = await supabase.from('invoices').insert([{
                quote_id: quote.id,
                client_id: quote.client_id,
                invoice_number: numData || `FACT-${Date.now()}`,
                type: 'deposit',
                status: 'paid',
                total: amount,
                subtotal: amount,
                paid_at: new Date().toISOString(),
                stripe_payment_intent: paymentIntent.id,
            }]);
            
            if (iErr) {
                 console.error("Invoice insert failed after success:", iErr.message);
            }

            setProcessing(false);
            onSuccess();
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <PaymentElement />
            {error && (
                <div style={{ color: '#ff8080', background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '8px', padding: '0.75rem 1rem', marginTop: '1rem', fontSize: '0.85rem' }}>
                    ⚠️ {error}
                </div>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
                <button type="button" onClick={onCancel} style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', borderRadius: '8px', padding: '0.75rem', cursor: 'pointer', fontSize: '0.9rem' }}>
                    Annuler
                </button>
                <button
                    type="submit"
                    disabled={processing || !stripe}
                    style={{
                        flex: 2, background: processing ? 'rgba(57,255,20,0.5)' : 'var(--accent-color)',
                        border: 'none', color: '#000', borderRadius: '8px',
                        padding: '0.75rem', cursor: processing ? 'not-allowed' : 'pointer',
                        fontSize: '0.9rem', fontWeight: 700,
                    }}
                >
                    {processing ? '⏳ Traitement...' : `🔒 Payer ${amount} €`}
                </button>
            </div>
        </form>
    );
};

// ─── Main component ─────────────────────────────────────────
const DepositPayment = ({ quote, onSuccess, onClose }) => {
    const [clientSecret, setClientSecret] = useState(null);
    const [loadingIntent, setLoadingIntent] = useState(false);
    const [intentError, setIntentError] = useState('');
    const [step, setStep] = useState('confirm'); // 'confirm' | 'payment' | 'success'

    const depositAmount = parseFloat(quote.deposit_amount || 0).toFixed(2);

    const handleAccept = async () => {
        setLoadingIntent(true);
        setIntentError('');

        // BYPASS STRIPE FOR 0€ QUOTES
        if (parseFloat(depositAmount) <= 0) {
            try {
                // Update quote status
                const { error: quoteErr } = await supabase
                    .from('quotes')
                    .update({ status: 'accepted', signed_at: new Date().toISOString() })
                    .eq('id', quote.id);
                    
                if (quoteErr) throw new Error("Quote update error: " + quoteErr.message);

                // Create a 0€ deposit invoice marking it as paid
                const { data: numData, error: rpcErr } = await supabase.rpc('generate_invoice_number');
                if (rpcErr) throw new Error("RPC error: " + rpcErr.message);

                const { error: invErr } = await supabase.from('invoices').insert([{
                    quote_id: quote.id,
                    client_id: quote.client_id,
                    invoice_number: numData || `FACT-${Date.now()}`,
                    type: 'deposit',
                    status: 'paid',
                    total: 0,
                    subtotal: 0,
                    paid_at: new Date().toISOString(),
                    stripe_payment_intent: 'bypass_0_euros',
                }]);

                if (invErr) throw new Error("Invoice insert error: " + invErr.message);

                // Trigger automation email for 0€ bypass
                if (quote.clients?.email) {
                    try {
                        await fetch('/api/send-automation-email', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                to: quote.clients.email,
                                type: 'deposit_paid',
                                data: { quote_id: quote.id, quote_number: quote.quote_number }
                            })
                        });
                    } catch (e) {
                        console.error("Bypass email send error:", e);
                    }
                }

                handleSuccess();
            } catch (err) {
                setIntentError("Erreur lors de l'acceptation: " + err.message);
            } finally {
                setLoadingIntent(false);
            }
            return;
        }

        try {
            const res = await fetch('/api/create-deposit-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    quoteId: quote.id,
                    quoteNumber: quote.quote_number,
                    amount: depositAmount,
                    clientEmail: quote.clients?.email || '',
                }),
            });

            const data = await res.json();
            if (!res.ok || !data.clientSecret) throw new Error(data.message || 'Erreur de création du paiement.');

            setClientSecret(data.clientSecret);
            setStep('payment');
        } catch (err) {
            setIntentError(err.message);
        } finally {
            setLoadingIntent(false);
        }
    };

    const handleSuccess = () => {
        setStep('success');
        setTimeout(() => { onSuccess?.(); }, 2500);
    };

    const stripeOptions = {
        clientSecret,
        appearance: {
            theme: 'night',
            variables: {
                colorPrimary: '#39ff14',
                colorBackground: '#111122',
                colorText: '#ffffff',
                colorDanger: '#ff4444',
                fontFamily: 'Inter, sans-serif',
                borderRadius: '8px',
            },
        },
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content glass-panel"
                style={{ maxWidth: '480px', padding: '2rem' }}
                onClick={e => e.stopPropagation()}
            >
                {/* ── SUCCESS ── */}
                {step === 'success' && (
                    <div style={{ textAlign: 'center', padding: '2rem 0' }}>
                        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎉</div>
                        <h2 style={{ color: 'var(--accent-color)', fontSize: '1.3rem', marginBottom: '0.5rem' }}>Acompte reçu !</h2>
                        <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.9rem' }}>Merci. Votre projet va démarrer très prochainement. Vous recevrez une confirmation par email.</p>
                    </div>
                )}

                {/* ── CONFIRM STEP ── */}
                {step === 'confirm' && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                            <div>
                                <h2 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.3rem' }}>Accepting Devis</h2>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', fontFamily: 'var(--font-mono)' }}>{quote.quote_number}</p>
                            </div>
                            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
                        </div>

                        {/* Summary */}
                        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Total du projet</span>
                                <span style={{ color: '#fff', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{parseFloat(quote.total || 0).toFixed(2)} €</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '0.6rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                                <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>Acompte à payer (30%)</span>
                                <span style={{ color: 'var(--accent-color)', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.1rem' }}>{depositAmount} €</span>
                            </div>
                            {quote.payment_type === 'subscription' ? (
                                <p style={{ fontSize: '0.75rem', color: 'var(--accent-color)', marginTop: '0.8rem', fontFamily: 'var(--font-mono)', padding: '0.5rem', background: 'rgba(57,255,20,0.05)', borderRadius: '6px' }}>
                                    À la livraison, un abonnement automatique de {parseFloat(quote.monthly_fee || 0).toFixed(2)} € / mois sera déclenché {quote.duration_months > 0 ? `pour ${quote.duration_months} mois` : 'sans engagement'}. 💳 
                                    <br/><span style={{opacity: 0.7, fontSize: '0.65rem'}}>Votre carte web sécurisée sera prélevée automatiquement.</span>
                                </p>
                            ) : (
                                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.4)', marginTop: '0.8rem', fontFamily: 'var(--font-mono)' }}>
                                    Le solde ({(parseFloat(quote.total) - parseFloat(depositAmount)).toFixed(2)} €) sera facturé à la livraison.
                                </p>
                            )}
                        </div>

                        {/* Terms */}
                        <div style={{ background: 'rgba(57,255,20,0.05)', border: '1px solid rgba(57,255,20,0.1)', borderRadius: '10px', padding: '1rem', marginBottom: '1.5rem', fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                            En cliquant sur le bouton ci-dessous, je reconnais avoir lu le devis {quote.quote_number} et j'accepte les termes de la prestation. {parseFloat(depositAmount) > 0 ? `Le versement de l'acompte de ${depositAmount} € déclenche le démarrage du projet.` : "Cette acceptation déclenche le démarrage du projet."}
                        </div>

                        {intentError && (
                            <div style={{ color: '#ff8080', background: 'rgba(255,80,80,0.1)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.85rem' }}>
                                ⚠️ {intentError}
                            </div>
                        )}

                        <button
                            onClick={handleAccept}
                            disabled={loadingIntent}
                            className="cta-primary"
                            style={{ width: '100%', justifyContent: 'center', padding: '1rem', fontSize: '1rem' }}
                        >
                            {loadingIntent ? '⏳ Initialisation...' : (parseFloat(depositAmount) > 0 ? `✓ J'accepte et je paye ${depositAmount} €` : `✓ J'accepte le devis`)}
                        </button>
                        <button onClick={onClose} style={{ width: '100%', marginTop: '0.75rem', background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', fontSize: '0.85rem', padding: '0.5rem' }}>
                            Annuler
                        </button>
                    </>
                )}

                {/* ── PAYMENT STEP ── */}
                {step === 'payment' && clientSecret && (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                            <div>
                                <h2 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '0.2rem' }}>🔒 Paiement sécurisé</h2>
                                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem' }}>Acompte — {depositAmount} €</p>
                            </div>
                        </div>
                        <Elements options={stripeOptions} stripe={stripePromise}>
                            <DepositForm
                                amount={depositAmount}
                                quote={quote}
                                onSuccess={handleSuccess}
                                onCancel={() => setStep('confirm')}
                            />
                        </Elements>
                    </>
                )}
            </div>
        </div>
    );
};

export default DepositPayment;
