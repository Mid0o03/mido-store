import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './PageStyles.css';

const ContactPage = () => {
    const { t } = useLanguage();

    return (
        <div className="page-container container">
            <h1 className="page-title">{t('contact.title_prefix')} <span className="text-accent">{t('contact.title_highlight')}</span></h1>
            <p className="page-subtitle" style={{ marginBottom: '3rem', color: 'var(--text-secondary)' }}>
                {t('contact.subtitle')}
            </p>

            <div className="glass-panel" style={{ maxWidth: '600px', margin: '0 auto', padding: '3rem' }}>
                <form className="contact-form">
                    <div className="form-group">
                        <label className="form-label font-mono">{t('contact.form.name')}</label>
                        <input type="text" className="form-input" />
                    </div>
                    <div className="form-group">
                        <label className="form-label font-mono">{t('contact.form.email')}</label>
                        <input type="email" className="form-input" />
                    </div>
                    <div className="form-group">
                        <label className="form-label font-mono">{t('contact.form.message')}</label>
                        <textarea rows="6" className="form-input"></textarea>
                    </div>
                    <button type="submit" className="cta-primary w-full">
                        {t('contact.form.submit')}
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
