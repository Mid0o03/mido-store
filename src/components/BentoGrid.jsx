import React, { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './BentoGrid.css';

gsap.registerPlugin(ScrollTrigger);

const BentoGrid = () => {
    const containerRef = useRef(null);
    const { t } = useLanguage();

    // Moved projects inside component to access t()
    const projects = [
        {
            id: 1,
            title: "NEON REALTY",
            category: "Real Estate Template",
            image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&q=80&w=1000",
            size: "large"
        },
        {
            id: 2,
            title: t('bento.cards.ecommerce.title') === 'bento.cards.ecommerce.title' ? "CYBER COMMERCE" : t('bento.cards.ecommerce.title'),
            category: t('bento.cards.ecommerce.desc') === 'bento.cards.ecommerce.desc' ? "E-commerce UI" : t('bento.cards.ecommerce.desc'),
            image: "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1000",
            size: "medium"
        },
        {
            id: 3,
            title: t('bento.cards.portfolio.title') === 'bento.cards.portfolio.title' ? "ZEN PORTFOLIO" : t('bento.cards.portfolio.title'),
            category: t('bento.cards.portfolio.desc') === 'bento.cards.portfolio.desc' ? "Personal Brand" : t('bento.cards.portfolio.desc'),
            image: "https://images.unsplash.com/photo-1517816428104-797678c7cf0c?auto=format&fit=crop&q=80&w=1000",
            size: "medium"
        },
        {
            id: 4,
            title: t('bento.cards.saas.title') === 'bento.cards.saas.title' ? "MIDO DASHBOARD" : t('bento.cards.saas.title'),
            category: t('bento.cards.saas.desc') === 'bento.cards.saas.desc' ? "SaaS Interface" : t('bento.cards.saas.desc'),
            image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1000",
            size: "wide"
        }
    ];

    useLayoutEffect(() => {
        const ctx = gsap.context(() => {
            gsap.from(".bento-card", {
                scrollTrigger: {
                    trigger: containerRef.current,
                    start: "top 80%",
                },
                y: 100,
                opacity: 0,
                duration: 1,
                stagger: 0.2,
                ease: "power4.out"
            });
        }, containerRef);

        return () => ctx.revert();
    }, []);

    const handleMouseMove = (e) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotateX = ((y - centerY) / centerY) * -10;
        const rotateY = ((x - centerX) / centerX) * 10;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    };

    const handleMouseLeave = (e) => {
        e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    };

    return (
        <section className="bento-section" ref={containerRef}>
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">{t('bento.title')}</h2>
                    <p className="section-subtitle">{t('bento.subtitle')}</p>
                </div>

                <div className="bento-grid">
                    {projects.map((project) => (
                        <div
                            key={project.id}
                            className={`bento-card ${project.size}`}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                        >
                            <div className="card-inner">
                                <div className="card-image" style={{ backgroundImage: `url(${project.image})` }}></div>
                                <div className="card-overlay"></div>
                                <div className="card-content">
                                    <div className="card-info">
                                        <h3 className="project-title">{project.title}</h3>
                                        <span className="project-category">{project.category}</span>
                                    </div>
                                    <button className="card-btn">
                                        <ArrowUpRight size={24} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default BentoGrid;
