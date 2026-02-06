import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './PageStyles.css';
import SEO from '../components/SEO';

const LegalPage = () => {
    // ...
    // (omitting body)

    return (
        <div className="page-container container">
            <SEO title={title} description="Legal Information, Privacy Policy and Terms of Service." />
            <h1 className="page-title text-accent">{title}</h1>
            <div className="glass-panel legal-container">
                {content}
            </div>

            <style>{`
                .legal-container {
                    padding: 3rem;
                    margin-top: 2rem;
                    color: var(--text-secondary);
                    font-size: 1rem;
                    line-height: 1.8;
                }
                .legal-content h3 {
                    color: white;
                    margin-top: 2.5rem;
                    margin-bottom: 1rem;
                    font-size: 1.3rem;
                    border-left: 3px solid var(--accent-color);
                    padding-left: 1rem;
                }
                .legal-content p {
                    margin-bottom: 1.5rem;
                }
                .legal-content ul {
                    list-style-type: none;
                    padding-left: 1rem;
                    margin-bottom: 1.5rem;
                }
                .legal-content li {
                    margin-bottom: 0.5rem;
                    position: relative;
                }
            `}</style>
        </div>
    );
};

export default LegalPage;
