import React from 'react';
import Hero from '../components/Hero';
import BentoGrid from '../components/BentoGrid';
import Workflow from '../components/Workflow';
import TechStack from '../components/TechStack';
import FooterPortal from '../components/FooterPortal';
import SEO from '../components/SEO';

const Home = () => {
    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": "Mido",
        "url": "https://www.midodev.fr",
        "logo": "https://www.midodev.fr/logo.png",
        "description": "Premium React Templates & Web Development",
        "contactPoint": {
            "@type": "ContactPoint",
            "email": "contact@midodev.fr",
            "contactType": "customer service"
        }
    };

    return (
        <div className="home-container">
            <SEO
                title="Premium React Templates"
                description="Elevate your web presence with high-quality, modern React templates and components."
                structuredData={organizationSchema}
            />
            <Hero />
            <TechStack />
            <BentoGrid />
            <Workflow />
            <FooterPortal />
        </div>
    );
};

export default Home;
