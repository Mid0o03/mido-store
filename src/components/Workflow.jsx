import React, { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Database, Layout, Rocket, Code2, Sparkles, Box } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import './Workflow.css';

gsap.registerPlugin(ScrollTrigger);

const Workflow = () => {
    const sectionRef = useRef(null);
    const beamRef = useRef(null);
    const { t } = useLanguage();

    // Moved steps inside component to access t()
    const steps = [
        {
            id: 1,
            title: t('workflow.steps.one.title'),
            desc: t('workflow.steps.one.desc'),
            icon: <Sparkles size={32} />
        },
        {
            id: 2,
            title: t('workflow.steps.two.title'),
            desc: t('workflow.steps.two.desc'),
            icon: <Layout size={32} />
        },
        {
            id: 3,
            title: t('workflow.steps.three.title'),
            desc: t('workflow.steps.three.desc'),
            icon: <Box size={32} />
        },
        {
            id: 4,
            title: t('workflow.steps.four.title'),
            desc: t('workflow.steps.four.desc'),
            icon: <Rocket size={32} />
        }
    ];

    useLayoutEffect(() => {
        let ctx = gsap.context(() => {
            // Laser Beam Animation
            gsap.to(beamRef.current, {
                height: "100%",
                ease: "none",
                scrollTrigger: {
                    trigger: sectionRef.current,
                    start: "top center",
                    end: "bottom center",
                    scrub: 1
                }
            });

            // Steps Reveal
            gsap.utils.toArray('.workflow-step').forEach((step, i) => {
                gsap.from(step, {
                    scrollTrigger: {
                        trigger: step,
                        start: "top 80%",
                    },
                    y: 50,
                    opacity: 0,
                    duration: 0.8,
                    ease: "power3.out"
                });
            });

        }, sectionRef);
        return () => ctx.revert();
    }, []);

    return (
        <section className="workflow-section" ref={sectionRef}>
            <div className="container">
                <div className="workflow-header">
                    <h2 className="section-title">{t('workflow.title')}</h2>
                    <p className="section-subtitle">{t('workflow.subtitle')}</p>
                </div>

                <div className="workflow-timeline">
                    {/* The Laser Beam Line */}
                    <div className="timeline-line">
                        <div className="line-beam" ref={beamRef}></div>
                    </div>

                    <div className="workflow-steps">
                        {steps.map((step, index) => (
                            <div key={step.id} className={`workflow-step ${index % 2 === 0 ? 'left' : 'right'}`}>
                                <div className="step-content">
                                    <div className="step-icon">
                                        {step.icon}
                                    </div>
                                    <h3 className="step-title">{step.title}</h3>
                                    <p className="step-desc">{step.desc}</p>
                                </div>
                                <div className="step-connector"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
};

export default Workflow;
