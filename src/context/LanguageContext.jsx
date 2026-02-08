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
            title_prefix: 'LE',
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
            },
            view_details: 'Voir Détails',
            live_preview: 'Aperçu Live',
            free: 'Gratuit',
            premium: 'Premium',
            owned: 'ACQUIS',
            add_to_cart: 'Ajouter au panier',
            added_to_cart: 'Ajouté !',
            already_owned: 'Déjà acquis',
            technologies: 'Technologies :',
            description_placeholder: 'Description pour cet élément.'
        },
        auth: {
            login_tab: 'CONNEXION',
            signup_tab: 'INSCRIPTION',
            login_title: 'Bon retour parmi nous',
            signup_title: 'Rejoignez Mido',
            login_desc: 'Accédez à votre espace et vos téléchargements',
            signup_desc: 'Créez un compte pour gérer vos achats',
            email_label: 'EMAIL',
            password_label: 'MOT DE PASSE',
            forgot_password: 'Mot de passe oublié ?',
            submit_login: 'SE CONNECTER',
            submit_signup: 'CRÉER UN COMPTE',
            processing: 'TRAITEMENT...',
            reset_title: 'Réinitialisation',
            reset_desc: 'Entrez votre email pour recevoir un lien de réinitialisation.',
            reset_submit: 'ENVOYER LE LIEN',
            reset_sending: 'ENVOI...',
            back_to_login: '← Retour à la connexion',
            success_reset: 'Email de réinitialisation envoyé !',
            success_signup: 'Compte créé avec succès !',
            error_generic: 'Une erreur est survenue.'
        },
        cart: {
            title: 'VOTRE PANIER',
            total: 'TOTAL',
            checkout: 'PAYER',
            empty: 'Votre panier est vide.',
            remove: 'Retirer',
            secure_payment: 'Paiement Sécurisé',
            success_title: 'Paiement Réussi !',
            success_desc: 'Merci pour votre achat.',
            auth_login_desc: 'Connectez-vous pour finaliser votre achat.',
            auth_signup_desc: 'Créez un compte pour accéder à vos téléchargements.',
            pay_btn: 'PAYER',
            signup_pay_btn: 'S\'INSCRIRE & PAYER',
            back_to_cart: '← Retour au panier',
            back: 'Retour',
            init_secure: 'Initialisation sécurisée...',
            stripe_config_warning: '(Avez-vous configuré les clés Stripe dans .env ?)'
        },
        client: {
            title_prefix: 'ESPACE',
            title_highlight: 'CLIENT',
            welcome: 'Bienvenue',
            member_since: 'Membre depuis',
            my_assets: 'Mes Assets',
            download: 'Télécharger',
            purchased: 'Acheté le',
            documentation: 'Documentation',
            modal: {
                title: 'Documentation & Accès',
                desc: 'Merci pour votre achat ! Vous pouvez télécharger le code source ZIP ci-dessous.',
                support: 'Besoin d\'aide ? Contactez contact@midodev.fr avec votre ID :',
                demo_label: 'Lien Demo Live :',
                download_btn: 'Télécharger .ZIP',
                close: 'Fermer',
                no_purchase: 'Aucun achat trouvé',
                no_purchase_desc: 'Vos achats apparaîtront ici une fois le paiement validé.',
                go_store: 'Aller à la boutique'
            }
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
            title_prefix: 'THE',
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
            },
            view_details: 'View Details',
            live_preview: 'Live Preview',
            free: 'Free',
            premium: 'Premium',
            owned: 'OWNED',
            add_to_cart: 'Add to Cart',
            added_to_cart: 'In Cart',
            already_owned: 'Already Owned',
            technologies: 'Technologies:',
            description_placeholder: 'Description placeholder for items.'
        },
        auth: {
            login_tab: 'LOGIN',
            signup_tab: 'SIGNUP',
            login_title: 'Welcome Back',
            signup_title: 'Join Mido',
            login_desc: 'Access your dashboard and downloads',
            signup_desc: 'Create an account to manage purchases',
            email_label: 'EMAIL',
            password_label: 'PASSWORD',
            forgot_password: 'Forgot Password?',
            submit_login: 'LOG IN',
            submit_signup: 'CREATE ACCOUNT',
            processing: 'PROCESSING...',
            reset_title: 'Reset Password',
            reset_desc: 'Enter your email to receive a reset link.',
            reset_submit: 'SEND LINK',
            reset_sending: 'SENDING...',
            back_to_login: '← Back to Login',
            success_reset: 'Reset email sent!',
            success_signup: 'Account created successfully!',
            error_generic: 'An error occurred.'
        },
        cart: {
            title: 'YOUR CART',
            total: 'TOTAL',
            checkout: 'CHECKOUT',
            empty: 'Your cart is empty.',
            remove: 'Remove',
            secure_payment: 'Secure Payment',
            success_title: 'Payment Successful!',
            success_desc: 'Thank you for your purchase.',
            auth_login_desc: 'Log in to complete your purchase.',
            auth_signup_desc: 'Create an account to access your downloads.',
            pay_btn: 'PAY',
            signup_pay_btn: 'SIGNUP & PAY',
            back_to_cart: '← Back to Cart',
            back: 'Back',
            init_secure: 'Secure initialization...',
            stripe_config_warning: '(Have you configured Stripe keys in .env?)'
        },
        client: {
            title_prefix: 'CLIENT',
            title_highlight: 'SPACE',
            welcome: 'Welcome',
            member_since: 'Member since',
            my_assets: 'My Assets',
            download: 'Download',
            purchased: 'Purchased on',
            documentation: 'Documentation',
            modal: {
                title: 'Documentation & Access',
                desc: 'Thank you for your purchase! You can download the source code ZIP directly below.',
                support: 'Need support? Contact contact@midodev.fr with Purchase ID:',
                demo_label: 'Live Demo Link:',
                download_btn: 'Download .ZIP',
                close: 'Close',
                no_purchase: 'No purchases found',
                no_purchase_desc: 'Your purchases will appear here once payment is validated.',
                go_store: 'Go to Store'
            }
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
