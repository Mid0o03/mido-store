import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import './PageStyles.css';

const ClientLoginPage = () => {
    const { loginClient } = useAuth();
    const { t } = useLanguage();
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [error, setError] = useState(null);

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await loginClient(email, password);
            navigate('/client');
        } catch (err) {
            console.error(err);
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="page-container container flex-center" style={{ minHeight: '80vh' }}>
            <div className="glass-panel login-form" style={{ width: '100%', maxWidth: '400px', padding: '3rem' }}>
                <h2 className="mb-4 text-center" style={{ fontSize: '1.8rem' }}>{t('client.title_prefix')} <span className="text-accent">{t('client.title_highlight')}</span></h2>
                <p className="text-center mb-6" style={{ color: 'var(--text-secondary)' }}>
                    Accédez à vos downloads
                </p>

                <form onSubmit={handleLogin}>
                    {error && (
                        <div className="mb-4 text-red-500 text-sm bg-red-500/10 p-2 rounded text-center">
                            {error}
                        </div>
                    )}
                    <div className="form-group mb-4">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            className="admin-input"
                            required
                        />
                    </div>
                    <div className="form-group mb-6">
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('admin.password') || "Password"}
                            className="admin-input"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="cta-primary w-full"
                        disabled={isLoading}
                        style={{ justifyContent: 'center' }}
                    >
                        {isLoading ? 'CONNEXION...' : 'SE CONNECTER'}
                    </button>

                    <div className="text-center mt-4">
                        <a href="#" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Mot de passe oublié ?</a>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ClientLoginPage;
