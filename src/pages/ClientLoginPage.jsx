import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import './PageStyles.css';

const ClientLoginPage = () => {
    const { loginClient, signUpClient, resetPassword, sendMagicLink } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(true);
    const [isResetMode, setIsResetMode] = useState(false);
    const [isMagicMode, setIsMagicMode] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);
        setSuccessMsg(null);

        try {
            if (isMagicMode) {
                await sendMagicLink(email);
                setSuccessMsg('✅ Lien de connexion envoyé ! Vérifie ta boîte mail et clique sur le lien.');
                return;
            }

            if (isResetMode) {
                await resetPassword(email);
                setSuccessMsg(t('auth.success_reset'));
                return;
            }

            if (isLogin) {
                await loginClient(email, password);
                navigate('/client');
            } else {
                await signUpClient(email, password);
                setSuccessMsg(t('auth.success_signup'));
                setTimeout(() => navigate('/client'), 1500);
            }
        } catch (err) {
            console.error(err);
            setError(err.message || t('auth.error_generic'));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page-container container flex-center" style={{ minHeight: '85vh', position: 'relative' }}>
            {/* Background Decoration */}
            <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(57, 255, 20, 0.05) 0%, transparent 70%)', zIndex: -1, pointerEvents: 'none' }}></div>

            <div className="glass-panel login-form" style={{ width: '100%', maxWidth: '420px', padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>

                {!isResetMode ? (
                    <>
                        {/* Header Tabs */}
                        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                            <button
                                onClick={() => { setIsLogin(true); setError(null); }}
                                style={{
                                    flex: 1,
                                    padding: '1.5rem',
                                    background: isLogin ? 'rgba(255,255,255,0.03)' : 'transparent',
                                    color: isLogin ? 'white' : 'var(--text-secondary)',
                                    fontWeight: isLogin ? '600' : '400',
                                    borderBottom: isLogin ? '2px solid var(--accent-color)' : '2px solid transparent',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {t('auth.login_tab')}
                            </button>
                            <button
                                onClick={() => { setIsLogin(false); setError(null); }}
                                style={{
                                    flex: 1,
                                    padding: '1.5rem',
                                    background: !isLogin ? 'rgba(255,255,255,0.03)' : 'transparent',
                                    color: !isLogin ? 'white' : 'var(--text-secondary)',
                                    fontWeight: !isLogin ? '600' : '400',
                                    borderBottom: !isLogin ? '2px solid var(--accent-color)' : '2px solid transparent',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                {t('auth.signup_tab')}
                            </button>
                        </div>

                        <div style={{ padding: '3rem 2.5rem' }}>
                            <h2 className="mb-2 text-center" style={{ fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                                {isLogin ? t('auth.login_title') : t('auth.signup_title')}
                            </h2>
                            <p className="text-center mb-8" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                                {isLogin ? t('auth.login_desc') : t('auth.signup_desc')}
                            </p>

                            <form onSubmit={handleSubmit}>
                                {error && (
                                    <div className="mb-6 text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded text-center">
                                        {error}
                                    </div>
                                )}
                                {successMsg && (
                                    <div className="mb-6 text-green-400 text-sm bg-green-500/10 border border-green-500/20 p-3 rounded text-center">
                                        {successMsg}
                                    </div>
                                )}

                                <div className="form-group mb-5">
                                    <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{t('auth.email_label')}</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="exemple@email.com"
                                        className="admin-input"
                                        style={{
                                            background: 'rgba(0,0,0,0.2)',
                                            border: '1px solid var(--accent-color)',
                                            padding: '1.2rem',
                                            fontSize: '1.1rem',
                                            height: 'auto',
                                            outline: 'none',
                                            boxShadow: '0 0 10px rgba(57, 255, 20, 0.1)'
                                        }}
                                        required
                                    />
                                </div>
                                <div className="form-group mb-8">
                                    <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>{t('auth.password_label')}</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="••••••••"
                                        className="admin-input"
                                        style={{
                                            background: 'rgba(0,0,0,0.2)',
                                            border: '1px solid var(--accent-color)',
                                            padding: '1.2rem',
                                            fontSize: '1.1rem',
                                            height: 'auto',
                                            outline: 'none',
                                            boxShadow: '0 0 10px rgba(57, 255, 20, 0.1)'
                                        }}
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    className="cta-primary w-full"
                                    disabled={isLoading}
                                    style={{
                                        justifyContent: 'center',
                                        padding: '1rem',
                                        fontSize: '1rem',
                                        letterSpacing: '0.05em',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        background: 'var(--accent-color)', // Added explicit background
                                        color: 'black', // Added contrast text
                                        border: 'none',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        fontWeight: '700',
                                        marginTop: '1rem'
                                    }}
                                >
                                    {isLoading ? t('auth.processing') : (isLogin ? t('auth.submit_login') : t('auth.submit_signup'))}
                                    {!isLoading && <ArrowRight size={20} />}
                                </button>

                            {isLogin && (
                                    <div className="text-center mt-6">
                                        <button
                                            type="button"
                                            onClick={() => { setIsResetMode(true); setError(null); setSuccessMsg(null); }}
                                            style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', textDecoration: 'underline', cursor: 'pointer' }}
                                            onMouseOver={e => e.target.style.color = 'white'}
                                            onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}
                                        >
                                            {t('auth.forgot_password')}
                                        </button>
                                    </div>
                                )}
                            </form>

                            {/* Magic link separator */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', margin: '1.5rem 0', padding: '0' }}>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                                <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', letterSpacing: '1px' }}>OU</span>
                                <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.08)' }} />
                            </div>

                            {!isMagicMode ? (
                                <div style={{ textAlign: 'center', paddingBottom: '1.5rem' }}>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
                                        Pas de mot de passe ? Reçois un lien de connexion par email.
                                    </p>
                                    <button
                                        onClick={() => { setIsMagicMode(true); setError(null); setSuccessMsg(null); }}
                                        style={{ background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.25)', color: '#39ff14', borderRadius: '8px', padding: '0.75rem 1.5rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: '600', letterSpacing: '0.03em' }}
                                    >
                                        ✉️ Connexion sans mot de passe
                                    </button>
                                </div>
                            ) : (
                                <div style={{ paddingBottom: '1.5rem' }}>
                                    <h3 style={{ color: 'white', fontSize: '1rem', marginBottom: '0.5rem', textAlign: 'center' }}>Connexion sans mot de passe</h3>
                                    <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', textAlign: 'center', marginBottom: '1.25rem' }}>Entre ton email et reçois un lien magique valable 24h.</p>
                                    {error && <div style={{ color: '#ff8080', background: 'rgba(255,80,80,0.1)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem', textAlign: 'center' }}>{error}</div>}
                                    {successMsg && <div style={{ color: '#39ff14', background: 'rgba(57,255,20,0.08)', border: '1px solid rgba(57,255,20,0.2)', borderRadius: '8px', padding: '0.75rem', marginBottom: '1rem', fontSize: '0.85rem', textAlign: 'center' }}>{successMsg}</div>}
                                    <form onSubmit={handleSubmit}>
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="ton@email.com"
                                            className="admin-input"
                                            style={{ width: '100%', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(57,255,20,0.3)', padding: '0.9rem 1rem', fontSize: '1rem', borderRadius: '8px', color: 'white', marginBottom: '0.75rem', boxSizing: 'border-box' }}
                                            required
                                        />
                                        <button
                                            type="submit"
                                            disabled={isLoading}
                                            style={{ width: '100%', background: '#39ff14', color: '#000', border: 'none', borderRadius: '8px', padding: '0.9rem', fontSize: '0.9rem', fontWeight: '800', cursor: 'pointer', letterSpacing: '0.03em' }}
                                        >
                                            {isLoading ? 'Envoi...' : '✉️ Recevoir le lien de connexion'}
                                        </button>
                                    </form>
                                    <div style={{ textAlign: 'center', marginTop: '0.75rem' }}>
                                        <button onClick={() => { setIsMagicMode(false); setError(null); setSuccessMsg(null); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', fontSize: '0.8rem', cursor: 'pointer', textDecoration: 'underline' }}>
                                            ← Retour à la connexion classique
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    // RESET PASSWORD VIEW
                    <div style={{ padding: '3rem 2.5rem' }}>
                        <h2 className="mb-2 text-center" style={{ fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                            {t('auth.reset_title')}
                        </h2>
                        <p className="text-center mb-8" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                            {t('auth.reset_desc')}
                        </p>

                        <form onSubmit={handleSubmit}>
                            {error && (
                                <div className="mb-6 text-red-400 text-sm bg-red-500/10 border border-red-500/20 p-3 rounded text-center">
                                    {error}
                                </div>
                            )}
                            {successMsg && (
                                <div className="mb-6 text-green-400 text-sm bg-green-500/10 border border-green-500/20 p-3 rounded text-center">
                                    {successMsg}
                                </div>
                            )}

                            <div className="form-group mb-8">
                                <label style={{ display: 'block', marginBottom: '0.8rem', fontSize: '0.9rem', color: 'var(--text-secondary)', fontWeight: '500' }}>EMAIL</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="exemple@email.com"
                                    className="admin-input"
                                    style={{
                                        background: 'rgba(0,0,0,0.2)',
                                        border: '1px solid var(--accent-color)',
                                        padding: '1.2rem',
                                        fontSize: '1.1rem',
                                        height: 'auto',
                                        outline: 'none',
                                        boxShadow: '0 0 10px rgba(57, 255, 20, 0.1)'
                                    }}
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                className="cta-primary w-full"
                                disabled={isLoading}
                                style={{
                                    justifyContent: 'center',
                                    padding: '1rem',
                                    fontSize: '1rem',
                                    letterSpacing: '0.05em',
                                    background: 'var(--accent-color)', // Added explicit background
                                    color: 'black', // Added contrast text
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontWeight: '700'
                                }}
                            >
                                {isLoading ? t('auth.reset_sending') : t('auth.reset_submit')}
                            </button>

                            <div className="text-center mt-6">
                                <button
                                    type="button"
                                    onClick={() => { setIsResetMode(false); setError(null); setSuccessMsg(null); }}
                                    style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '0.85rem', cursor: 'pointer' }}
                                    onMouseOver={e => e.target.style.color = 'white'}
                                    onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}
                                >
                                    {t('auth.back_to_login')}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClientLoginPage;
