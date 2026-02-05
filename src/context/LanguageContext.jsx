import React, { createContext, useState, useContext } from 'react';

const LanguageContext = createContext();

export const translations = {
    fr: {
        nav: {
            store: 'STORE',
            lab: 'LAB',
            contact: 'CONTACT'
        },
        hero: {
            subtitle: 'TEMPLATES IA & EXPÉRIENCES DIGITALES SUR-MESURE',
            cta_primary: 'EXPLORER LE STORE',
            cta_secondary: 'DÉMARRER UN PROJET'
        },
        techstack: {
            title: "L'ENGINE",
            subtitle: 'NOS OUTILS DE PRÉDILECTION'
        },
        bento: {
            title: 'THE VAULT',
            subtitle: 'NOS CRÉATIONS RÉCENTES',
            cards: {
                ecommerce: { title: 'E-COMMERCE NEXT.GEN', desc: 'Une boutique immersive avec 3D product view.' },
                portfolio: { title: 'PORTFOLIO MINIMAL', desc: 'Pour les créatifs qui exigent la perfection.' },
                saas: { title: 'DASHBOARD SAAS', desc: 'Interface data-driven ultra réactive.' },
                landing: { title: 'LANDING PAGE', desc: 'Conversion maximale, design impactant.' }
            }
        },
        workflow: {
            title: 'THE BLUEPRINT',
            subtitle: 'NOTRE PROCESSUS',
            steps: {
                one: { title: 'DISCOVERY', desc: 'Analyse de vos besoins et définition de la stratégie.' },
                two: { title: 'DESIGN', desc: 'Création des maquettes et prototypes interactifs.' },
                three: { title: 'BUILD', desc: 'Développement sur-mesure avec les meilleures technos.' },
                four: { title: 'LAUNCH', desc: 'Mise en ligne, optimisation et suivi des performances.' }
            }
        },
        footer: {
            cta: 'PRÊT À SCALER ?',
            btn: 'DÉMARRER UN PROJET',
            rights: 'TOUS DROITS RÉSERVÉS.'
        },
        store: {
            title_highlight: 'STORE',
            subtitle: 'ASSETS PREMIUM POUR CRÉATEURS',
            filters: { all: 'TOUT', ui: 'UI KITS', templates: 'TEMPLATES', args: 'AUGMENTED REALITY' },
            coming_soon: 'BIENTÔT DISPONIBLE',
            search_placeholder: 'Rechercher...',
            sort: {
                label: 'Trier par',
                popular: 'Populaire 🔥',
                newest: 'Nouveautés ✨',
                price_asc: 'Prix: Croissant',
                price_desc: 'Prix: Décroissant'
            }
        },
        cart: {
            title: 'VOTRE PANIER',
            total: 'TOTAL',
            checkout: 'PAYER',
            empty: 'Votre panier est vide.',
            remove: 'Retirer'
        },
        client: {
            title_prefix: 'ESPACE',
            title_highlight: 'CLIENT',
            welcome: 'Bienvenue',
            member_since: 'Membre depuis',
            my_assets: 'Mes Assets',
            download: 'Télécharger',
            purchased: 'Acheté le',
            documentation: 'Documentation'
        },
        lab: {
            title_prefix: 'LE',
            title_highlight: 'LAB',
            status: 'EN CONSTRUCTION',
            desc: 'EXPERIMENTATIONS R&D EN COURS...'
        },
        contact: {
            title_prefix: 'DÉMARRER UN',
            title_highlight: 'PROJET',
            subtitle: 'DÉMARRONS QUELQUE CHOSE',
            form: {
                name: 'NOM',
                email: 'EMAIL',
                message: 'MESSAGE',
                submit: 'ENVOYER'
            }
        },
        admin: {
            login: 'IDENTIFICATION',
            password: 'PASSWORD',
            enter: 'ENTRER',
            dashboard: 'DASHBOARD',
            add_product: 'AJOUTER UN PRODUIT'
        },
        legal: {
            mentions: { title: 'MENTIONS LÉGALES', link: 'Mentions Légales' },
            privacy: { title: 'POLITIQUE DE CONFIDENTIALITÉ', link: 'Confidentialité' },
            terms: { title: "CONDITIONS D'UTILISATION", link: 'CGU' }
        }
    },
    en: {
        nav: {
            store: 'STORE',
            lab: 'LAB',
            contact: 'CONTACT'
        },
        hero: {
            subtitle: 'AI TEMPLATES & TAILORED DIGITAL EXPERIENCES',
            cta_primary: 'EXPLORE STORE',
            cta_secondary: 'START PROJECT'
        },
        techstack: {
            title: 'THE ENGINE',
            subtitle: 'OUR PREFERRED TOOLS'
        },
        bento: {
            title: 'THE VAULT',
            subtitle: 'OUR RECENT CREATIONS',
            cards: {
                ecommerce: { title: 'NEXT.GEN E-COMMERCE', desc: 'Immersive shop with 3D product view.' },
                portfolio: { title: 'MINIMAL PORTFOLIO', desc: 'For creatives demanding perfection.' },
                saas: { title: 'SAAS DASHBOARD', desc: 'Ultra-reactive data-driven interface.' },
                landing: { title: 'LANDING PAGE', desc: 'Max conversion, impactful design.' }
            }
        },
        workflow: {
            title: 'THE BLUEPRINT',
            subtitle: 'OUR PROCESS',
            steps: {
                one: { title: 'DISCOVERY', desc: 'Needs analysis and strategy definition.' },
                two: { title: 'DESIGN', desc: 'Creation of mockups and interactive prototypes.' },
                three: { title: 'BUILD', desc: 'Custom development with top-tier tech.' },
                four: { title: 'LAUNCH', desc: 'Deployment, optimization, and performance tracking.' }
            }
        },
        footer: {
            cta: 'READY TO SCALE?',
            btn: 'START PROJECT',
            rights: 'ALL RIGHTS RESERVED.'
        },
        store: {
            title_highlight: 'STORE',
            subtitle: 'PREMIUM ASSETS FOR CREATORS',
            filters: { all: 'ALL', ui: 'UI KITS', templates: 'TEMPLATES', args: 'AUGMENTED REALITY' },
            coming_soon: 'COMING SOON',
            search_placeholder: 'Search...',
            sort: {
                label: 'Sort by',
                popular: 'Popular 🔥',
                newest: 'Newest ✨',
                price_asc: 'Price: Low to High',
                price_desc: 'Price: High to Low'
            }
        },
        cart: {
            title: 'YOUR CART',
            total: 'TOTAL',
            checkout: 'CHECKOUT',
            empty: 'Your cart is empty.',
            remove: 'Remove'
        },
        client: {
            title_prefix: 'CLIENT',
            title_highlight: 'SPACE',
            welcome: 'Welcome',
            member_since: 'Member since',
            my_assets: 'My Assets',
            download: 'Download',
            purchased: 'Purchased on',
            documentation: 'Documentation'
        },
        lab: {
            title_prefix: 'THE',
            title_highlight: 'LAB',
            status: 'UNDER CONSTRUCTION',
            desc: 'ONGOING R&D EXPERIMENTS...'
        },
        contact: {
            title_prefix: 'START A',
            title_highlight: 'PROJECT',
            subtitle: "LET'S START SOMETHING",
            form: {
                name: 'NAME',
                email: 'EMAIL',
                message: 'MESSAGE',
                submit: 'SEND'
            }
        },
        admin: {
            login: 'LOGIN',
            password: 'PASSWORD',
            enter: 'ENTER',
            dashboard: 'DASHBOARD',
            add_product: 'ADD PRODUCT'
        },
        legal: {
            mentions: { title: 'LEGAL NOTICE', link: 'Legal Notice' },
            privacy: { title: 'PRIVACY POLICY', link: 'Privacy Policy' },
            terms: { title: 'TERMS OF SERVICE', link: 'Terms of Service' }
        }
    }
};

export const LanguageProvider = ({ children }) => {
    const [language, setLanguage] = useState('fr');

    const t = (path) => {
        const keys = path.split('.');
        let value = translations[language];
        for (let key of keys) {
            value = value?.[key];
        }
        return value || path;
    };

    const toggleLanguage = () => {
        setLanguage((prev) => (prev === 'fr' ? 'en' : 'fr'));
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => useContext(LanguageContext);
