import React, { useEffect, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { ShoppingCart } from 'lucide-react';
import gsap from 'gsap';
import './Header.css';

const Header = () => {
    const location = useLocation();
    const { language, toggleLanguage, t } = useLanguage();
    const { toggleCart, cartCount } = useCart();

    // NavLink handles active class automatically

    return (
        <header className="header glass-panel">
            <div className="header-container container">
                <Link to="/" className="logo">
                    MIDO<span className="text-accent">.</span>
                </Link>
                <nav className="nav">
                    <NavLink to="/store" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{t('nav.store')}</NavLink>
                    <NavLink to="/gallery" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{t('nav.gallery')}</NavLink>
                    <NavLink to="/lab" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{t('nav.lab')}</NavLink>
                    <NavLink to="/contact" className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>{t('nav.contact')}</NavLink>
                </nav>
                <div className="header-actions">
                    <button className="cart-btn" onClick={toggleCart}>
                        <ShoppingCart size={20} />
                        {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
                    </button>
                    <Link to="/client">
                        <button className="client-btn">
                            Client Space
                        </button>
                    </Link>
                    <button className="lang-switch" onClick={toggleLanguage}>
                        <span className={language === 'fr' ? 'active' : ''}>FR</span>
                        <span className="separator">/</span>
                        <span className={language === 'en' ? 'active' : ''}>EN</span>
                    </button>
                </div>
            </div>
        </header>
    );
};

export default Header;
