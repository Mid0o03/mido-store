import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { X, Trash2, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from '../stripe';
import CheckoutForm from './CheckoutForm';
import './CartDrawer.css';

const CartDrawer = () => {
    const { cartItems, isCartOpen, toggleCart, removeFromCart, clearCart, cartTotal } = useCart();
    const { t } = useLanguage();
    const { clientUser, loginClient, signUpClient } = useAuth();
    const [paymentStep, setPaymentStep] = useState('cart'); // 'cart', 'auth', 'payment', 'processing', 'success'

    // Stripe State
    const [clientSecret, setClientSecret] = useState(null);
    const [stripeError, setStripeError] = useState(null);

    // Auth State in Drawer
    const [authMode, setAuthMode] = useState('login');
    const [authEmail, setAuthEmail] = useState('');
    const [authPassword, setAuthPassword] = useState('');
    const [authError, setAuthError] = useState(null);
    const [isAuthLoading, setIsAuthLoading] = useState(false);

    const navigate = useNavigate();

    const isPaymentMode = paymentStep === 'payment';

    // Fetch PaymentIntent when entering payment step
    useEffect(() => {
        if (paymentStep === 'payment' && cartTotal > 0) {
            setClientSecret(null); // Reset

            // Call Vercel API
            fetch('/api/create-payment-intent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: cartItems,
                    amount: cartTotal
                }),
            })
                .then(async res => {
                    if (!res.ok) {
                        const errorData = await res.json().catch(() => ({}));
                        const errorMessage = errorData.message || `Erreur Serveur (${res.status})`;
                        throw new Error(errorMessage);
                    }
                    return res.json();
                })
                .then(data => {
                    if (data.clientSecret) {
                        setClientSecret(data.clientSecret);
                    } else {
                        throw new Error("Pas de clientSecret retourné par le serveur.");
                    }
                })
                .catch(err => {
                    console.error('Transaction Error:', err);
                    setStripeError(err.message);
                });
        }
    }, [paymentStep, cartTotal, cartItems]);

    const handleCheckoutClick = () => {
        if (clientUser) {
            setPaymentStep('payment');
        } else {
            setPaymentStep('auth');
        }
    };

    const handleAuthSubmit = async (e) => {
        e.preventDefault();
        setAuthError(null);
        setIsAuthLoading(true);

        try {
            if (authMode === 'login') {
                await loginClient(authEmail, authPassword);
            } else {
                await signUpClient(authEmail, authPassword);
            }
            // If successful, move to payment
            setPaymentStep('payment');
        } catch (err) {
            console.error(err);
            setAuthError(err.message || "Authentication failed");
        } finally {
            setIsAuthLoading(false);
        }
    };

    const handlePaymentSuccess = async () => {
        setPaymentStep('success');

        // Save to Supabase
        if (clientUser) {
            const purchases = cartItems.map(item => ({
                user_id: clientUser.id,
                template_id: item.id,
                template_title: item.title,
                template_image: item.image_url || item.image,
                price_paid: parseFloat(item.price.replace('€', '')),
                template_version: 'v1.0.0'
            }));

            const { error } = await supabase.from('purchases').insert(purchases);

            if (error) {
                console.error("Error saving purchase:", error);
            }
        }

        setTimeout(() => {
            clearCart();
            setPaymentStep('cart');
            setAuthEmail('');
            setAuthPassword('');
            toggleCart();
            navigate('/client');
        }, 3000);
    };

    const handleCancelPayment = () => {
        setPaymentStep('cart');
        setClientSecret(null);
    };

    if (!isCartOpen) return null;

    const stripeOptions = {
        clientSecret,
        appearance: {
            theme: 'night',
            variables: {
                colorPrimary: '#39FF14',
                colorBackground: '#1a1a1a',
                colorText: '#ffffff',
                colorDanger: '#ff4444',
                fontFamily: 'Inter, sans-serif',
                spacingUnit: '4px',
                borderRadius: '8px',
            },
        },
    };

    return (
        <>
            <div className="cart-overlay" onClick={toggleCart}></div>
            <div className="cart-drawer glass-panel">
                <div className="cart-header">
                    <h2>
                        {paymentStep === 'cart' && t('cart.title')}
                        {paymentStep === 'auth' && (authMode === 'login' ? 'Connexion' : 'Inscription')}
                        {paymentStep === 'payment' && 'Paiement Sécurisé'}
                    </h2>
                    <button className="close-btn" onClick={toggleCart}>
                        <X size={24} color="white" />
                    </button>
                </div>

                {paymentStep === 'success' ? (
                    <div className="cart-success">
                        <div className="success-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#39FF14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        </div>
                        <h3>Paiement Réussi !</h3>
                        <p>Merci pour votre achat.</p>
                    </div>
                ) : paymentStep === 'auth' ? (
                    <div className="payment-form">
                        <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                            {authMode === 'login' ? 'Connectez-vous pour finaliser votre achat.' : 'Créez un compte pour accéder à vos téléchargements.'}
                        </p>
                        <form onSubmit={handleAuthSubmit}>
                            {authError && (
                                <div className="mb-4 text-red-500 text-sm bg-red-500/10 p-2 rounded">
                                    {authError}
                                </div>
                            )}
                            <div className="form-group mb-4">
                                <label>Email</label>
                                <input
                                    type="email"
                                    className="admin-input"
                                    placeholder="email@example.com"
                                    value={authEmail}
                                    onChange={(e) => setAuthEmail(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="form-group mb-6">
                                <label>Mot de passe</label>
                                <input
                                    type="password"
                                    className="admin-input"
                                    placeholder="••••••••"
                                    value={authPassword}
                                    onChange={(e) => setAuthPassword(e.target.value)}
                                    required
                                />
                            </div>
                            <button disabled={isAuthLoading} className="cta-primary w-full mb-4" style={{ justifyContent: 'center', width: '100%' }}>
                                {isAuthLoading ? 'CHARGEMENT...' : (authMode === 'login' ? 'SE CONNECTER & PAYER' : 'S\'INSCRIRE & PAYER')}
                            </button>
                        </form>
                        <div className="text-center">
                            <button
                                className="text-accent text-sm"
                                onClick={() => setAuthMode(authMode === 'login' ? 'signup' : 'login')}
                            >
                                {authMode === 'login' ? 'Pas encore de compte ? Créer un compte' : 'Déjà un compte ? Se connecter'}
                            </button>
                        </div>
                        <button
                            className="text-secondary text-sm mt-6 hover:text-white text-center"
                            onClick={() => setPaymentStep('cart')}
                        >
                            &larr; Retour au panier
                        </button>
                    </div>
                ) : isPaymentMode ? (
                    <div className="stripe-container" style={{ padding: '1rem' }}>
                        {stripeError ? (
                            <div className="error-message" style={{ color: 'red', textAlign: 'center' }}>
                                <p>{stripeError}</p>
                                <p style={{ fontSize: '0.8rem', marginTop: '0.5rem', opacity: 0.7 }}>
                                    (Avez-vous configuré les clés Stripe dans .env ?)
                                </p>
                                <button
                                    className="text-secondary text-sm mt-4 hover:text-white"
                                    onClick={handleCancelPayment}
                                >
                                    Retour
                                </button>
                            </div>
                        ) : clientSecret ? (
                            <Elements options={stripeOptions} stripe={stripePromise}>
                                <CheckoutForm
                                    onSuccess={handlePaymentSuccess}
                                    onCancel={handleCancelPayment}
                                    amount={cartTotal.toFixed(2)}
                                />
                            </Elements>
                        ) : (
                            <div className="loading-spinner" style={{ textAlign: 'center', padding: '2rem' }}>
                                <div className="spinner"></div>
                                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>Initialisation sécurisée...</p>
                            </div>
                        )}
                    </div>
                ) : (
                    // Default Cart View
                    <div className="cart-content-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                        <div className="cart-items">
                            {cartItems.length === 0 ? (
                                <div className="empty-cart">
                                    <p>{t('cart.empty')}</p>
                                </div>
                            ) : (
                                cartItems.map((item, index) => (
                                    <div key={`${item.id}-${index}`} className="cart-item">
                                        <div className="item-image" style={{ backgroundImage: `url(${item.image_url || item.image})` }}></div>
                                        <div className="item-details">
                                            <h3>{item.title}</h3>
                                            <span className="item-price">{item.price}</span>
                                        </div>
                                        <button className="remove-btn" onClick={() => removeFromCart(item.id)}>
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>

                        {cartItems.length > 0 && (
                            <div className="cart-footer">
                                <div className="cart-total">
                                    <span>{t('cart.total')}</span>
                                    <span className="total-amount">{cartTotal.toFixed(2)}€</span>
                                </div>
                                <button
                                    className="checkout-btn"
                                    onClick={handleCheckoutClick}
                                >
                                    {t('cart.checkout')} <CreditCard size={20} />
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </>
    );
};
export default CartDrawer;
