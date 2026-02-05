import React, { useLayoutEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import ThreeScene from './ThreeScene';
import GlitchText from './GlitchText';
import './Hero.css';
import { useLanguage } from '../context/LanguageContext';

const Hero = () => {
    const sectionRef = useRef(null);
    const { t } = useLanguage();
    const navigate = useNavigate();

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

            // 1. Title Animation (Staggered fade up)
            tl.from(".hero-title .title-line", {
                y: 100,
                opacity: 0,
                duration: 1.2,
                stagger: 0.15,
                skewY: 5
            })
                // 2. Subtitle Animation
                .to(".hero-subtitle", {
                    opacity: 0.9,
                    duration: 1,
                    y: 0,
                    startAt: { y: 20 }
                }, "-=0.5")
                // 3. Buttons Animation
                .to(".hero-btn-group", {
                    opacity: 1,
                    y: 0,
                    startAt: { y: 20 },
                    duration: 0.8
                }, "-=0.8");

        }, sectionRef);

        return () => ctx.revert();
    }, []);

    return (
        <section className="hero-section" ref={sectionRef}>
            {/* Layer 1: Background 3D */}
            <div className="hero-background-layer">
                <ThreeScene />
            </div>

            {/* Layer 2: Content */}
            <div className="hero-content-layer">
                <h1 className="hero-title">
                    <span className="title-line">L'ART DE LA</span>
                    <GlitchText text="PERFORMANCE" className="title-line text-outline" />
                </h1>

                <p className="hero-subtitle">
                    {t('hero.subtitle')}
                </p>

                <div className="hero-btn-group">
                    <button className="btn-primary" onClick={() => navigate('/store')}>{t('hero.cta_primary')}</button>
                    <button className="btn-secondary" onClick={() => navigate('/contact')}>{t('hero.cta_secondary')}</button>
                </div>
            </div>
        </section>
    );
};

export default Hero;
