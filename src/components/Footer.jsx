import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './Footer.css';

const Footer = () => {
    const { t } = useLanguage();

    return (
        <footer className="global-footer">
            <div className="container footer-container">
                <span className="copyright">© 2024 MIDO. {t('footer.rights')}</span>
                <div className="social-links">
                    <a href="#">TWITTER</a>
                    <a href="#">LINKEDIN</a>
                    <a href="#">INSTAGRAM</a>
                </div>
                <div className="footer-legal">
                    <Link to="/mentions-legales">{t('legal.mentions.link')}</Link>
                    <Link to="/confidentialite">{t('legal.privacy.link')}</Link>
                    <Link to="/cgu">{t('legal.terms.link')}</Link>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
