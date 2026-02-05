import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useLanguage } from '../context/LanguageContext';
import './FooterPortal.css';

const FooterPortal = () => {
    const btnRef = useRef(null);
    const { t } = useLanguage();
    const navigate = useNavigate();

    const onEnter = ({ currentTarget }) => {
        gsap.to(currentTarget, { scale: 1.1, duration: 0.3 });
        gsap.to('.portal-bg', { scale: 1.2, opacity: 0.8, duration: 0.5 });
    };

    const onLeave = ({ currentTarget }) => {
        gsap.to(currentTarget, { scale: 1, duration: 0.3 });
        gsap.to('.portal-bg', { scale: 1, opacity: 0.3, duration: 0.5 });
    };

    return (
        <section className="portal-section">
            <div className="portal-bg"></div>
            <div className="container portal-container">
                <h2 className="portal-title">{t('footer.cta')}</h2>
                <div className="portal-cta-wrapper">
                    <button
                        className="portal-btn"
                        ref={btnRef}
                        onMouseEnter={onEnter}
                        onMouseLeave={onLeave}
                        onClick={() => navigate('/contact')}
                    >
                        {t('footer.btn')}
                    </button>
                    <div className="btn-glow"></div>
                </div>
            </div>
        </section>
    );
};

export default FooterPortal;
