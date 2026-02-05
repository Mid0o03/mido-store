import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

export default function CheckoutForm({ onSuccess, onCancel, amount }) {
    const stripe = useStripe();
    const elements = useElements();
    const [message, setMessage] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsProcessing(true);

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // Return URL is required for redirect-based payment methods
                // For card payments, we can handle it without redirect if we want, 
                // but Stripe recommends a return_url.
                // We will just point to the current page or a success page.
                return_url: window.location.origin + '/client',
            },
            redirect: 'if_required', // Attempt to handle without redirect
        });

        if (error) {
            setMessage(error.message);
            setIsProcessing(false);
        } else if (paymentIntent && paymentIntent.status === 'succeeded') {
            // Payment success!
            setIsProcessing(false);
            onSuccess();
        } else {
            setMessage("Une erreur inattendue s'est produite.");
            setIsProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="payment-form">
            <PaymentElement id="payment-element" />

            {message && <div style={{ color: '#ff4444', marginTop: '1rem', fontSize: '0.9rem' }}>{message}</div>}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                <button
                    type="button"
                    className="text-secondary text-sm hover:text-white"
                    onClick={onCancel}
                    style={{ flex: 1 }}
                >
                    Annuler
                </button>

                <button
                    disabled={isProcessing || !stripe || !elements}
                    className="checkout-btn"
                    style={{ flex: 2 }}
                >
                    {isProcessing ? "Traitement..." : `Payer ${amount}€`}
                </button>
            </div>
        </form>
    );
}
