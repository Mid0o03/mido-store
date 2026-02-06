import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './PageStyles.css';
import SEO from '../components/SEO';

const ContactPage = () => {
    const { t } = useLanguage();
    const [formData, setFormData] = React.useState({
        name: '',
        email: '',
        message: ''
    });
    const [status, setStatus] = React.useState({ loading: false, success: null, error: null });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ loading: true, success: null, error: null });

        try {
            const response = await fetch('/api/send-contact', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            // Handle Local Dev (Vite) where API doesn't exist
            if (response.status === 404 && import.meta.env.DEV) {
                console.warn("Dev Mode: API not found (expected). Simulating success.");
                setTimeout(() => {
                    setStatus({ loading: false, success: true, error: null });
                    setFormData({ name: '', email: '', message: '' });
                    alert("Mode Dev : Email simulé (L'API nécessite un déploiement Vercel ou 'vercel dev')");
                }, 1000);
                return;
            }

            const data = await response.json();

            if (!response.ok) throw new Error(data.message || 'Something went wrong');

            setStatus({ loading: false, success: true, error: null });
            setFormData({ name: '', email: '', message: '' }); // Reset form
        } catch (err) {
            console.error(err);
            setStatus({ loading: false, success: false, error: err.message || 'Une erreur est survenue' });
        }
    };

    return (
        <div className="page-container container">
            <SEO title="Contact" description="Get in touch with Mido Agency for your next premium web project." url="/contact" />
            <h1 className="page-title">{t('contact.title_prefix')} <span className="text-accent">{t('contact.title_highlight')}</span></h1>
            <p className="page-subtitle" style={{ marginBottom: '3rem', color: 'var(--text-secondary)' }}>
                {t('contact.subtitle')}
            </p>

            <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem' }}>
                <form className="contact-form" onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label className="form-label font-mono">{t('contact.form.name')}</label>
                        <input
                            type="text"
                            name="name"
                            className="form-input"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label font-mono">{t('contact.form.email')}</label>
                        <input
                            type="email"
                            name="email"
                            className="form-input"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label className="form-label font-mono">{t('contact.form.message')}</label>
                        <textarea
                            name="message"
                            rows="6"
                            className="form-input"
                            value={formData.message}
                            onChange={handleChange}
                            required
                        ></textarea>
                    </div>

                    {status.error && (
                        <div style={{ color: '#ff4d4d', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            {status.error}
                        </div>
                    )}

                    {status.success && (
                        <div style={{ color: '#4dff88', marginBottom: '1rem', fontSize: '0.9rem' }}>
                            Message sent successfully! We will get back to you shortly.
                        </div>
                    )}

                    <button
                        type="submit"
                        className="cta-primary w-full"
                        disabled={status.loading}
                        style={{ opacity: status.loading ? 0.7 : 1 }}
                    >
                        {status.loading ? 'Envoi...' : (t('contact.form.submit') || 'Envoyer')}
                    </button>
                </form>
            </div>

            <style>{`
                .form-group { margin-bottom: 2rem; }
                .form-label { display: block; margin-bottom: 0.5rem; font-size: 0.9rem; color: #888; }
                .form-input {
                    width: 100%;
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 1rem;
                    color: white;
                    border-radius: 4px;
                    transition: border-color 0.3s;
                }
                .form-input:focus {
                    border-color: var(--accent-color);
                    outline: none;
                }
            `}</style>
        </div>
    );
};

export default ContactPage;
