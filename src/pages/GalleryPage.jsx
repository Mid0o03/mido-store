import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { useLanguage } from '../context/LanguageContext';
import SEO from '../components/SEO';
import ProjectViewer from '../components/ProjectViewer';
import './GalleryPage.css';
import '../components/ChatViewer.css';

// Project Images
import glowImg from '../assets/gallery/glow.png';
import greenImg from '../assets/gallery/green.png';
import roshiImg from '../assets/gallery/roshi.png';
import japanImg from '../assets/gallery/japan.png';
import kromImg from '../assets/gallery/krom.png';

import { useData } from '../context/DataContext';

const GalleryPage = () => {
    const { t } = useLanguage();
    const { projects, loading } = useData();
    const [filter, setFilter] = useState('all');
    const [viewerProject, setViewerProject] = useState(null);
    const gridRef = useRef(null);

    const filteredProjects = filter === 'all' 
        ? projects 
        : projects.filter(p => p.category === filter);

    useEffect(() => {
        if (!gridRef.current) return;
        const cards = gridRef.current.querySelectorAll('.gallery-card');
        if (!cards.length) return;
        gsap.fromTo(cards, 
            { opacity: 0, y: 30, scale: 0.95 },
            { 
                opacity: 1, 
                y: 0, 
                scale: 1, 
                duration: 0.8, 
                stagger: 0.1, 
                ease: 'power3.out',
                overwrite: true 
            }
        );
    }, [filter, filteredProjects.length]);

    return (
        <div className="gallery-page page-container container">
            <SEO 
                title="Gallery | Portfolio" 
                description="Découvrez nos récentes réalisations : sites e-commerce premium, vitrines élégantes et applications mobiles." 
                url="/gallery" 
            />
            
            <header className="gallery-header">
                <h1 className="page-title text-glitch">
                    {t('gallery.title_prefix')} <span className="text-accent">{t('gallery.title_highlight')}</span>_
                </h1>
                <p className="page-subtitle">
                    {t('gallery.subtitle')}
                </p>

                <div className="gallery-filters font-mono">
                    {['all', 'ecommerce', 'vitrine', 'mobile'].map(cat => (
                        <button 
                            key={cat}
                            className={`filter-btn ${filter === cat ? 'active' : ''}`}
                            onClick={() => setFilter(cat)}
                        >
                            {t(`gallery.categories.${cat}`)}
                        </button>
                    ))}
                </div>
            </header>

            <div className="gallery-grid" ref={gridRef}>
                {loading ? (
                    <div className="col-span-full flex-center py-20">
                        <div style={{
                            width: '40px', height: '40px', borderRadius: '50%',
                            border: '3px solid rgba(255,255,255,0.1)',
                            borderTopColor: 'var(--accent-color)',
                            animation: 'spin 0.8s linear infinite'
                        }} />
                    </div>
                ) : filteredProjects.length > 0 ? (
                    filteredProjects.map(project => (
                        <div key={project.id} className="gallery-card glass-panel">
                            <div className="card-image-wrapper">
                                <img src={project.image_url || project.image} alt={project.title} loading="lazy" />
                                <div className="card-overlay">
                                    {/* Internal Preview Button */}
                                    {project.link && project.link !== '#' ? (
                                        <button
                                            className="view-btn"
                                            onClick={() => setViewerProject(project)}
                                        >
                                            {t('gallery.view_site')}
                                        </button>
                                    ) : (
                                        <span className="view-btn view-btn-soon">Bientôt disponible</span>
                                    )}
                                </div>
                            </div>
                            <div className="card-content">
                                <div className="card-category font-mono">
                                    {t(`gallery.categories.${project.category}`)}
                                </div>
                                <h3 className="card-title">{project.title}</h3>
                                <p className="card-desc">
                                    {project.description || project.desc}
                                </p>
                                {/* External fallback link */}
                                {project.link && project.link !== '#' && (
                                    <a
                                        href={project.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="gallery-ext-link"
                                    >
                                        ↗ Visiter le site
                                    </a>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full text-center py-20 glass-panel">
                        <p className="text-xl text-secondary">No projects found in this category.</p>
                    </div>
                )}
            </div>

            <div className="gallery-cta">
                <p className="font-mono">{t('gallery.coming_soon')}</p>
            </div>

            {/* Project Viewer Modal */}
            {viewerProject && (
                <ProjectViewer
                    url={viewerProject.link}
                    title={viewerProject.title}
                    onClose={() => setViewerProject(null)}
                />
            )}
        </div>
    );
};

export default GalleryPage;
