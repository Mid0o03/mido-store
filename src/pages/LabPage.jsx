import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { useLanguage } from '../context/LanguageContext';
import './PageStyles.css';
import SEO from '../components/SEO';

const LabPage = () => {
    const { t } = useLanguage();

    const experiments = [
        {
            id: 'EXP-001',
            title: 'AI Template Generator',
            desc: 'Generate custom templates using AI based on your requirements and design preferences.',
            status: 'In Development',
            color: '#39FF14',
            locked: true
        },
        {
            id: 'EXP-002',
            title: 'Live Preview Editor',
            desc: 'Edit and customize templates in real-time with instant visual feedback.',
            status: 'Coming Soon',
            color: '#FF3366',
            locked: true
        },
        {
            id: 'EXP-003',
            title: 'Component Library',
            desc: 'Reusable UI components extracted from premium templates for rapid prototyping.',
            status: 'Planning',
            color: '#00D9FF',
            locked: true
        }
    ];

    return (
        <div className="page-container container">
            <SEO title="Lab" description="Experimental features and R&D playground." url="/lab" />
            <h1 className="page-title text-glitch" style={{ fontSize: '4rem', letterSpacing: '-2px' }}>
                MIDO <span className="text-accent">LAB</span>_
            </h1>
            <p className="page-subtitle" style={{ color: 'var(--text-secondary)', marginBottom: '4rem', maxWidth: '600px' }}>
                {t('lab.desc') || "Experimental zone for upcoming features and R&D projects. Access restricted to early adopters."}
            </p>

            <div className="lab-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem'
            }}>
                {experiments.map((exp, index) => (
                    <div
                        key={exp.id}
                        className="lab-card glass-panel"
                        style={{
                            padding: '2rem',
                            position: 'relative',
                            overflow: 'hidden',
                            borderTop: `1px solid ${exp.color}40`,
                            minHeight: '280px',
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'space-between'
                        }}
                    >
                        <div className="card-bg-glow" style={{
                            position: 'absolute',
                            top: '-50%',
                            right: '-50%',
                            width: '200px',
                            height: '200px',
                            background: exp.color,
                            opacity: 0.1,
                            filter: 'blur(60px)',
                            borderRadius: '50%'
                        }}></div>

                        <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                <span className="font-mono" style={{ color: exp.color, fontSize: '0.8rem', opacity: 0.8 }}>
                                    {exp.id}
                                </span>
                                <span className="badge" style={{
                                    background: 'rgba(255,255,255,0.05)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    padding: '0.2rem 0.6rem',
                                    borderRadius: '100px',
                                    fontSize: '0.7rem'
                                }}>
                                    {exp.status}
                                </span>
                            </div>
                            <h3 style={{ fontSize: '1.8rem', marginBottom: '1rem', fontWeight: 300 }}>{exp.title}</h3>
                            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.6 }}>{exp.desc}</p>
                        </div>

                        {exp.locked && (
                            <div style={{
                                marginTop: '2rem',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                color: 'var(--text-secondary)',
                                fontSize: '0.9rem'
                            }}>
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                                <span>Locked</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div style={{ marginTop: '5rem', textAlign: 'center', opacity: 0.5 }}>
                <p className="font-mono text-xs">RESEARCH AND DEVELOPMENT // PROTOCOLS ACTIVATED</p>
            </div>
        </div>
    );
};

export default LabPage;
