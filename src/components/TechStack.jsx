import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './TechStack.css';

const techStack = [
    "REACT", "THREE.JS", "GSAP", "SUPABASE", "NEXT.JS", "TYPESCRIPT", "TAILWIND", "WEBGL", "STRIPE", "FRAMER MOTION"
];

const TechStack = () => {
    const { t } = useLanguage();

    return (
        <section className="stack-section">
            <div className="container stack-header">
                <h2 className="stack-title">{t('techstack.title')}</h2>
                <p className="stack-subtitle">{t('techstack.subtitle')}</p>
            </div>
            <div className="marquee-container">
                <div className="marquee-content">
                    {/* Double the array for seamless loop */}
                    {[...techStack, ...techStack].map((tech, index) => (
                        <div key={index} className="tech-item">
                            {tech} <span className="separator">///</span>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TechStack;
