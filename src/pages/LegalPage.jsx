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
                    title: "Mentions Légales",
                    content: (
                        <div className="legal-content">
                            <h3>1. Éditeur du Site</h3>
                            <p>
                                <strong>Dénomination sociale :</strong> [VOTRE ENTREPRISE] (ex: Mido Agency)<br />
                                <strong>Forme juridique :</strong> [STATUT] (ex: Auto-entrepreneur, SAS, SARL)<br />
                                <strong>Siège social :</strong> [VOTRE ADRESSE]<br />
                                <strong>SIRET :</strong> [VOTRE NUMERO SIRET]<br />
                                <strong>TVA Intracommunautaire :</strong> [NUMERO TVA]<br />
                                <strong>Directeur de la publication :</strong> [VOTRE NOM]<br />
                                <strong>Contact :</strong> contact@midodev.fr
                            </p>

                            <h3>2. Hébergement</h3>
                            <p>
                                Ce site est hébergé par :<br />
                                <strong>Vercel Inc.</strong><br />
                                340 S Lemon Ave #4133<br />
                                Walnut, CA 91789, USA.
                            </p>
                        </div>
                    )
                };
            case '/confidentialite':
                return {
                    title: "Politique de Confidentialité (RGPD)",
                    content: (
                        <div className="legal-content">
                            <p>Dernière mise à jour : {new Date().toLocaleDateString()}</p>

                            <p>
                                La protection de vos données personnelles est une priorité pour nous.
                                Cette politique détaille comment nous collectons et traitons vos informations.
                            </p>

                            <h3>1. Données Collectées</h3>
                            <p>Nous collectons les informations suivantes nécessaires à l'exécution du contrat de vente :</p>
                            <ul>
                                <li>Nom et Prénom</li>
                                <li>Adresse Email (pour l'envoi des reçus et l'accès au compte)</li>
                                <li>Détails de la commande (Produits achetés, Date, Montant)</li>
                            </ul>
                            <p><em>Nous ne stockons JAMAIS vos coordonnées bancaires. Celles-ci sont traitées exclusivement par notre partenaire de paiement sécurisé, Stripe.</em></p>

                            <h3>2. Sous-traitants et Partenaires</h3>
                            <p>Vos données peuvent être transmises à nos partenaires techniques pour le bon fonctionnement du service :</p>
                            <ul>
                                <li><strong>Stripe :</strong> Gestion des paiements sécurisés.</li>
                                <li><strong>Supabase :</strong> Hébergement de la base de données et authentification.</li>
                                <li><strong>Resend :</strong> Envoi des emails transactionnels (reçus, réinitialisation de mot de passe).</li>
                                <li><strong>Vercel :</strong> Hébergement du site web.</li>
                            </ul>

                            <h3>3. Vos Droits</h3>
                            <p>
                                Conformément au RGPD, vous disposez d'un droit d'accès, de rectification et de suppression de vos données.
                                Pour exercer ce droit, contactez-nous à : <strong>contact@midodev.fr</strong>.
                            </p>

                            <h3>4. Cookies</h3>
                            <p>
                                Ce site utilise uniquement des cookies "techniques" strictement nécessaires au fonctionnement
                                (session utilisateur, panier d'achat). Aucun cookie publicitaire ou de traçage tiers n'est utilisé sans votre consentement.
                            </p>
                        </div>
                    )
                };
            case '/cgu':
                return {
                    title: "Conditions Générales de Vente (CGV)",
                    content: (
                        <div className="legal-content">
                            <div className="alert-box" style={{ background: 'rgba(255, 95, 86, 0.1)', border: '1px solid var(--text-error)', padding: '1rem', borderRadius: '8px', marginBottom: '2rem' }}>
                                <strong>⚠️ Important - Produits Numériques</strong>
                                <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.9rem' }}>
                                    L'achat de produits numériques (code source, templates) est ferme et définitif dès le téléchargement.
                                </p>
                            </div>

                            <h3>1. Objet</h3>
                            <p>
                                Les présentes Conditions Générales de Vente (CGV) régissent la vente de produits numériques (templates, code source)
                                sur le site Mido Store.
                            </p>

                            <h3>2. Nature des Produits et Licence</h3>
                            <p>
                                En achetant un produit sur Mido Store, vous n'achetez pas la propriété intellectuelle du produit,
                                mais <strong>une licence d'utilisation</strong> non-exclusive.
                            </p>
                            <ul>
                                <li>✅ <strong>Autorisé :</strong> Utiliser le code pour vos projets personnels ou commerciaux (clients).</li>
                                <li>✅ <strong>Autorisé :</strong> Modifier le code selon vos besoins.</li>
                                <li>❌ <strong>Interdit :</strong> Revendre, redistribuer ou sous-licencier le code source "tel quel" (même modifié) sur une autre marketplace.</li>
                            </ul>

                            <h3>3. Prix et Paiement</h3>
                            <p>
                                Les prix sont indiqués en Euros (€) et sont payables comptant au moment de la commande.
                                Le paiement est sécurisé par Stripe.
                            </p>

                            <h3>4. Renonciation au Droit de Rétractation</h3>
                            <p>
                                Conformément à l'article L.221-28 du Code de la consommation, le droit de rétractation ne peut être exercé
                                pour les contrats de fourniture d'un contenu numérique non fourni sur un support matériel dont l'exécution
                                a commencé après accord préalable exprès du consommateur et renoncement exprès à son droit de rétractation.
                                <br /><br />
                                <strong>Par conséquent, tout achat de produit numérique téléchargé est définitif et non remboursable.</strong>
                            </p>

                            <h3>5. Limitation de Responsabilité</h3>
                            <p>
                                Les produits sont fournis "tels quels". Bien que nous nous efforcions de fournir un code de haute qualité,
                                nous ne garantissons pas que les produits seront exempts d'erreurs ou fonctionneront avec toutes les configurations serveur futures.
                                La responsabilité de l'éditeur ne saurait être engagée en cas de dommages indirects résultant de l'utilisation des produits.
                            </p>
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
