import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import './PageStyles.css';

const ClientLoginPage = () => {
    const { loginClient, signUpClient } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();

    const [isLogin, setIsLogin] = useState(true); // Toggle between Login and Signup
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
            if (isLogin) {
                await loginClient(email, password);
                navigate('/client');
            } else {
                await signUpClient(email, password);
                setSuccessMsg("Compte créé avec succès ! Vous êtes connecté.");
                setTimeout(() => navigate('/client'), 1500);
            }
        } catch (err) {
            console.error(err);
            setError(err.message || 'Une erreur est survenue.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page-container container flex-center" style={{ minHeight: '85vh', position: 'relative' }}>
            {/* Background Decoration */}
            <div style={{ position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)', width: '600px', height: '600px', background: 'radial-gradient(circle, rgba(57, 255, 20, 0.05) 0%, transparent 70%)', zIndex: -1, pointerEvents: 'none' }}></div>

            <div className="glass-panel login-form" style={{ width: '100%', maxWidth: '420px', padding: '0', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>

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
                        CONNEXION
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
                        INSCRIPTION
                    </button>
                </div>

                <div style={{ padding: '3rem 2.5rem' }}>
                    <h2 className="mb-2 text-center" style={{ fontSize: '1.5rem', letterSpacing: '-0.02em' }}>
                        {isLogin ? 'Bon retour parmi nous' : 'Rejoignez Mido'}
                    </h2>
                    <p className="text-center mb-8" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        {isLogin ? 'Accédez à votre espace et vos téléchargements' : 'Créez un compte pour gérer vos achats'}
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
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>EMAIL</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="exemple@email.com"
                                className="admin-input"
                                style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.1)' }}
                                required
                            />
                        </div>
                        <div className="form-group mb-8">
                            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: '500' }}>MOT DE PASSE</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="admin-input"
                                style={{ background: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,255,255,0.1)' }}
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="cta-primary w-full"
                            disabled={isLoading}
                            style={{ justifyContent: 'center', padding: '1rem', fontSize: '1rem', letterSpacing: '0.05em' }}
                        >
                            {isLoading ? 'TRAITEMENT...' : (isLogin ? 'SE CONNECTER' : 'CRÉER UN COMPTE')}
                        </button>

                        {isLogin && (
                            <div className="text-center mt-6">
                                <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textDecoration: 'none' }} onMouseOver={e => e.target.style.color = 'white'} onMouseOut={e => e.target.style.color = 'var(--text-secondary)'}>
                                    Mot de passe oublié ?
                                </a>
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ClientLoginPage;
