import React, { useRef, useLayoutEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { useData } from '../context/DataContext';
import './BentoGrid.css';

gsap.registerPlugin(ScrollTrigger);

const BentoGrid = () => {
    const containerRef = useRef(null);
    const { t } = useLanguage();
    const { templates } = useData();
    const navigate = useNavigate();

    // Use top 4 published templates
    const projects = useMemo(() => {
        return templates
            .filter(t => t.status !== 'draft' && t.status !== 'archived')
            .slice(0, 4)
            .map((t, index) => ({
                id: t.id,
                title: t.title,
                category: t.category,
                image: t.image_url,
                // Assign different sizes based on index for the bento layout
                size: index === 0 ? "large" : (index === 3 ? "wide" : "medium")
            }));
    }, [templates]);

    useLayoutEffect(() => {
        if (projects.length === 0) return;

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
    }, [projects]);

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

    const handleCardClick = (id) => {
        navigate('/store'); // Or navigate to specific detail if we have a route
    };

    if (projects.length === 0) return null; // Hide section if no projects

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
                            onClick={() => handleCardClick(project.id)}
                            style={{ cursor: 'pointer' }}
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
