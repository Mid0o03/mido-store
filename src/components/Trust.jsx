import React from 'react';
import './Trust.css';

const Trust = () => {
    const pillars = [
        {
            title: "SEO Optimized",
            desc: "Perfect Lighthouse scores. Semantic HTML and metadata structured for visibility.",
            icon: "⚡"
        },
        {
            title: "Accessibility (A11y)",
            desc: "Inclusive design standards. Usable by everyone, regardless of device or ability.",
            icon: "👁️"
        },
        {
            title: "AI-Enhanced Workflow",
            desc: "Leveraging LLMs for rapid prototyping and optimized code generation.",
            icon: "🤖"
        }
    ];

    return (
        <section id="trust" className="trust-section">
            <div className="container">
                <h2 className="section-title text-center">Technical <span className="text-accent">Mastery</span></h2>
                <div className="trust-grid">
                    {pillars.map((pillar, index) => (
                        <div key={index} className="trust-card glass-panel">
                            <div className="trust-icon">{pillar.icon}</div>
                            <h3 className="trust-title">{pillar.title}</h3>
                            <p className="trust-desc">{pillar.desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Trust;
