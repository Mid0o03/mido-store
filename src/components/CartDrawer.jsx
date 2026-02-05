import React from 'react';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { X, Trash2, CreditCard } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './CartDrawer.css';

const CartDrawer = () => {
    const { cartItems, isCartOpen, toggleCart, removeFromCart, clearCart, cartTotal } = useCart();
    const { t } = useLanguage();
    const { clientUser, loginClient } = useAuth(); // Get auth context
    const [paymentStep, setPaymentStep] = React.useState('cart'); // 'cart', 'auth', 'payment', 'processing', 'success'
    const [cardDetails, setCardDetails] = React.useState({ number: '', expiry: '', cvc: '' });

    // Auth State in Drawer
    const [authMode, setAuthMode] = React.useState('login'); // 'login' or 'signup'
    const [authEmail, setAuthEmail] = React.useState('');
    const [authPassword, setAuthPassword] = React.useState('');

    const navigate = useNavigate();

    const isPaymentMode = paymentStep === 'payment';
    const isAuthMode = paymentStep === 'auth';

    const handleCheckoutClick = () => {
        if (clientUser) {
            setPaymentStep('payment');
        } else {
            setPaymentStep('auth');
        }
    };

    const handleAuthSubmit = (e) => {
        e.preventDefault();
        // Mock Login/Signup
        loginClient(authEmail);
        setPaymentStep('payment');
    };

    const handlePaymentSubmit = (e) => {
        e.preventDefault();
        setPaymentStep('processing');

        // Simulate API call
        setTimeout(() => {
            // Save purchased items to mock DB (localStorage)
            const currentPurchases = JSON.parse(localStorage.getItem('purchasedAssets') || '[]');
            const newPurchases = cartItems.map(item => ({
                ...item,
                purchaseDate: new Date().toLocaleDateString(),
                version: 'v1.0.0'
            }));
            localStorage.setItem('purchasedAssets', JSON.stringify([...newPurchases, ...currentPurchases]));

            setPaymentStep('success');
            setTimeout(() => {
                clearCart();
                setPaymentStep('cart');
                setCardDetails({ number: '', expiry: '', cvc: '' });
                setAuthEmail('');
                setAuthPassword('');
                toggleCart();
                navigate('/client');
            }, 2000);
        }, 2000);
    };

    const handleCardChange = (e) => {
        const { name, value } = e.target;
        let formattedValue = value;

        if (name === 'number') {
            formattedValue = value.replace(/\D/g, '').substring(0, 16).replace(/(\d{4})/g, '$1 ').trim();
        } else if (name === 'expiry') {
            formattedValue = value.replace(/\D/g, '').substring(0, 4).replace(/(\d{2})(\d{1,2})/, '$1/$2');
        } else if (name === 'cvc') {
            formattedValue = value.replace(/\D/g, '').substring(0, 3);
        }

        setCardDetails(prev => ({ ...prev, [name]: formattedValue }));
    };

    if (!isCartOpen) return null;

    return (
        <>
            <div className="cart-overlay" onClick={toggleCart}></div>
            <div className="cart-drawer glass-panel">
                <div className="cart-header">
                    <h2>
                        {paymentStep === 'cart' && t('cart.title')}
                        {paymentStep === 'auth' && (authMode === 'login' ? 'Connexion' : 'Inscription')}
                        {paymentStep === 'payment' && 'Paiement'}
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
                        <p>Vos assets sont en route.</p>
                    </div>
                ) : paymentStep === 'processing' ? (
                    <div className="cart-success">
                        <div className="spinner"></div>
                        <h3 className="mt-4">Traitement...</h3>
                    </div>
                ) : paymentStep === 'auth' ? (
                    <div className="payment-form">
                        <p style={{ marginBottom: '1.5rem', color: 'var(--text-secondary)' }}>
                            {authMode === 'login' ? 'Connectez-vous pour finaliser votre achat.' : 'Créez un compte pour accéder à vos téléchargements.'}
                        </p>
                        <form onSubmit={handleAuthSubmit}>
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
                            <button className="cta-primary w-full mb-4" style={{ justifyContent: 'center', width: '100%' }}>
                                {authMode === 'login' ? 'SE CONNECTER & PAYER' : 'S\'INSCRIRE & PAYER'}
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
                ) : (
                    <>
                        <div className="cart-content-wrapper" style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                            {/* If we check 'isCheckingOut' state we could toggle views. 
                                For better UX, let's keep it simple: List -> Button "Checkout" -> Form expands or replaces list 
                            */}

                            {/* For this iteration, let's keep the items visible but maybe shrink them? 
                                Or better: Replace items with form when clicking checkout.
                            */}

                            {!isPaymentMode ? (
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
                            ) : (
                                <form onSubmit={handlePaymentSubmit} className="payment-form">
                                    <div className="payment-summary mb-4">
                                        <span>Total à payer</span>
                                        <span className="text-accent font-mono text-xl">{cartTotal.toFixed(2)}€</span>
                                    </div>

                                    <div className="form-group mb-3">
                                        <label>Numéro de carte</label>
                                        <div className="input-icon-wrapper">
                                            <CreditCard size={18} className="input-icon" />
                                            <input
                                                name="number"
                                                value={cardDetails.number}
                                                onChange={handleCardChange}
                                                placeholder="0000 0000 0000 0000"
                                                className="admin-input"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="form-row" style={{ display: 'flex', gap: '1rem' }}>
                                        <div className="form-group mb-3" style={{ flex: 1 }}>
                                            <label>Expiration</label>
                                            <input
                                                name="expiry"
                                                value={cardDetails.expiry}
                                                onChange={handleCardChange}
                                                placeholder="MM/YY"
                                                className="admin-input"
                                                required
                                            />
                                        </div>
                                        <div className="form-group mb-3" style={{ flex: 1 }}>
                                            <label>CVC</label>
                                            <input
                                                name="cvc"
                                                value={cardDetails.cvc}
                                                onChange={handleCardChange}
                                                placeholder="123"
                                                className="admin-input"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <button
                                        type="button"
                                        className="text-secondary text-sm mb-4 hover:text-white"
                                        onClick={() => setPaymentStep('cart')}
                                    >
                                        &larr; Retour au panier
                                    </button>

                                    <button className="checkout-btn">
                                        Payer {cartTotal.toFixed(2)}€
                                    </button>
                                </form>
                            )}

                            {!isPaymentMode && cartItems.length > 0 && (
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
                    </>
                )}
            </div>
        </>
    );
};

export default CartDrawer;
