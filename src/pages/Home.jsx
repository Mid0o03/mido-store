import React from 'react';
import Hero from '../components/Hero';
import BentoGrid from '../components/BentoGrid';
import Workflow from '../components/Workflow';
import TechStack from '../components/TechStack';
import FooterPortal from '../components/FooterPortal';

const Home = () => {
    return (
        <div className="home-page">
            <Hero />
            <TechStack />
            <BentoGrid />
            <Workflow />
            <FooterPortal />
        </div>
    );
};

export default Home;
