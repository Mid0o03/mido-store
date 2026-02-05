import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './PageStyles.css';

const LegalPage = () => {
    const { pathname } = useLocation();
    const { t } = useLanguage();

    const getContent = () => {
        switch (pathname) {
            case '/mentions-legales':
                return {
                    title: t('legal.mentions.title'),
                    content: (
                        <div className="legal-content">
                            <p><strong>Éditeur du site :</strong> MIDO Agency</p>
                            <p><strong>Siège social :</strong> 123 Avenue de l'Innovation, 75001 Paris</p>
                            <p><strong>Contact :</strong> contact@mido.agency</p>
                            <p><strong>Hébergement :</strong> Vercel Inc.</p>
                        </div>
                    )
                };
            case '/confidentialite':
                return {
                    title: t('legal.privacy.title'),
                    content: (
                        <div className="legal-content">
                            <p>Nous accordons une grande importance à la confidentialité de vos données.</p>
                            <h3>1. Collecte des données</h3>
                            <p>Nous collectons uniquement les données nécessaires au bon fonctionnement du service (nom, email via formulaire).</p>
                            <h3>2. Utilisation</h3>
                            <p>Vos données sont utilisées pour vous contacter suite à votre demande.</p>
                            <h3>3. Cookies</h3>
                            <p>Ce site utilise des cookies techniques pour améliorer l'expérience utilisateur.</p>
                        </div>
                    )
                };
            case '/cgu':
                return {
                    title: t('legal.terms.title'),
                    content: (
                        <div className="legal-content">
                            <h3>1. Objet</h3>
                            <p>Les présentes CGU régissent l'utilisation du site et des services MIDO.</p>
                            <h3>2. Accès</h3>
                            <p>Le service est accessible gratuitement à tout utilisateur disposant d'un accès internet.</p>
                            <h3>3. Propriété intellectuelle</h3>
                            <p>Tous les contenus présents sur le site sont la propriété exclusive de MIDO.</p>
                        </div>
                    )
                };
            default:
                return { title: 'Page Non Trouvée', content: <p>Contenu indisponible.</p> };
        }
    };

    const { title, content } = getContent();

    useEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <div className="page-container container">
            <h1 className="page-title text-accent">{title}</h1>
            <div className="glass-panel" style={{ padding: '2rem', marginTop: '2rem', lineHeight: '1.8', color: 'var(--text-secondary)' }}>
                {content}
            </div>
        </div>
    );
};

export default LegalPage;
