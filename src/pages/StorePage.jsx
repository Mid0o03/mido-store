import React, { useState, useMemo, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { Plus, Eye, ShoppingBag, X, Search } from 'lucide-react';
import './PageStyles.css';
import SEO from '../components/SEO';

/* Inline styles for demo button in card overlay */


// Inject styles (Temporary hack since we are editing JSX file but want CSS)
// A better way is to put this in PageStyles.css
// I will append a <style> tag to the component render for simplicity in this file-flow


const StorePage = () => {
    const { templates, incrementViews } = useData();
    const { t } = useLanguage();
    const { addToCart } = useCart(); // Use Cart Context
    const { clientUser } = useAuth(); // Get current logged in client
    const [activeCategory, setActiveCategory] = useState("All");
    const [activeSubCategory, setActiveSubCategory] = useState("All");
    const [addedItems, setAddedItems] = useState({});
    const [selectedItem, setSelectedItem] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest'); // 'popular', 'newest', 'price-asc', 'price-desc'
    const [isSortOpen, setIsSortOpen] = useState(false);

    // Store purchased template IDs
    const [purchasedIds, setPurchasedIds] = useState(new Set());

    // Fetch purchases on mount or user change
    useEffect(() => {
        if (clientUser) {
            const fetchPurchases = async () => {
                const { data } = await supabase
                    .from('purchases')
                    .select('template_id')
                    .eq('user_id', clientUser.id);

                if (data) {
                    const ids = new Set(data.map(p => p.template_id));
                    setPurchasedIds(ids);
                }
            };
            fetchPurchases();
        } else {
            setPurchasedIds(new Set());
        }
    }, [clientUser]);

    const [notification, setNotification] = useState(null);

    const showNotification = (msg) => {
        setNotification(msg);
        setTimeout(() => setNotification(null), 3000);
    };

    const handleAddToCart = (e, item) => {
        e.stopPropagation();
        if (purchasedIds.has(item.id)) {
            showNotification(t('store.already_owned'));
            return;
        }
        addToCart(item); // Add to real cart
        setAddedItems(prev => ({ ...prev, [item.id]: true }));
        setTimeout(() => {
            setAddedItems(prev => ({ ...prev, [item.id]: false }));
        }, 2000);
    };

    const handleViewDetails = (item) => {
        setSelectedItem(item);
        incrementViews(item.id);
    };

    const categories = useMemo(() => {
        const cats = {
            "All": [],
            "Web": ["All", "Landing Page", "SaaS", "Dashboard", "Portfolio", "E-commerce", "Blog"],
            "App": ["All", "Mobile UI", "PWA", "Desktop App", "AI Interfaces"]
        };
        return cats;
    }, []);

    const parsePrice = (priceStr) => {
        if (!priceStr) return 0;
        if (priceStr === 'Free' || priceStr === '$0') return 0;
        return parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
    };

    const filteredTemplates = useMemo(() => {
        // 1. Filter
        let result = templates.filter(t => {
            if (!t) return false;
            // Only show published items in store
            if (t.status && t.status !== 'published') return false;

            const catMatch = activeCategory === "All" || t.category === activeCategory;
            const subMatch = activeSubCategory === "All" || (t.sub_category || t.subCategory) === activeSubCategory;

            const title = t.title || '';
            const tech = t.tech ? (Array.isArray(t.tech) ? t.tech.join(' ') : t.tech) : '';
            const searchMatch = !searchTerm ||
                title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                tech.toLowerCase().includes(searchTerm.toLowerCase());

            return catMatch && subMatch && searchMatch;
        });

        // 2. Sort
        return result.sort((a, b) => {
            switch (sortBy) {
                case 'popular':
                    return (b.views || 0) - (a.views || 0);
                case 'price-asc':
                    return parsePrice(a.price) - parsePrice(b.price);
                case 'price-desc':
                    return parsePrice(b.price) - parsePrice(a.price);
                case 'newest':
                default:
                    return b.id - a.id; // Assuming higher ID = newer
            }
        });
    }, [templates, activeCategory, activeSubCategory, searchTerm, sortBy]);

    return (
        <div className="page-container container">
            <SEO
                title="Store"
                description="Browse our collection of premium React templates. Landing pages, dashboards, and e-commerce solutions."
                url="/store"
            />
            <h1 className="page-title">{t('store.title_prefix')} <span className="text-accent">{t('store.title_highlight')}</span></h1>
            <p className="page-subtitle" style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                {t('store.subtitle')}
            </p>

            {/* Notification Toast */}
            {notification && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: 'rgba(57, 255, 20, 0.1)',
                    border: '1px solid var(--accent-color)',
                    color: 'white',
                    padding: '1rem 2rem',
                    borderRadius: '8px',
                    zIndex: 1000,
                    backdropFilter: 'blur(10px)',
                    animation: 'fadeIn 0.3s ease'
                }}>
                    {notification}
                </div>
            )}

            <div className="filters-container glass-panel">
                <div className="store-filter-bar">
                    {/* Search Bar */}
                    <div className="search-container">
                        <input
                            type="text"
                            placeholder={t('store.search_placeholder')}
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="search-input"
                        />
                        <div className="search-icon"><Search size={20} /></div>
                    </div>

                    {/* Sort Dropdown - Custom React Implementation */}
                    <div className="sort-container" style={{ position: 'relative' }}>
                        <span className="sort-label hidden md:block">{t('store.sort.label')}:</span>

                        <div
                            className="custom-select-trigger"
                            onClick={() => setIsSortOpen(!isSortOpen)}
                        >
                            {t(`store.sort.${sortBy.replace('-', '_')}`) || sortBy}
                            <span className={`chevron ${isSortOpen ? 'open' : ''}`}>▼</span>
                        </div>

                        {isSortOpen && (
                            <div className="custom-options glass-panel">
                                {['newest', 'popular', 'price-asc', 'price-desc'].map(opt => (
                                    <div
                                        key={opt}
                                        className={`custom-option ${sortBy === opt ? 'selected' : ''}`}
                                        onClick={() => {
                                            setSortBy(opt);
                                            setIsSortOpen(false);
                                        }}
                                    >
                                        {t(`store.sort.${opt.replace('-', '_')}`)}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                <div className="filter-group">
                    <span className="filter-label font-mono">Category:</span>
                    {Object.keys(categories).map(cat => (
                        <button
                            key={cat}
                            className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => {
                                setActiveCategory(cat);
                                setActiveSubCategory("All"); // Reset sub on cat change
                            }}
                        >
                            {cat === "All" ? t('store.filters.all') : cat}
                        </button>
                    ))}
                </div>

                {activeCategory !== "All" && (
                    <div className="filter-group sub-filters">
                        <span className="filter-label font-mono">Type:</span>
                        {categories[activeCategory].map(sub => (
                            <button
                                key={sub}
                                className={`filter-btn ${activeSubCategory === sub ? 'active sub-active' : ''}`}
                                onClick={() => setActiveSubCategory(sub)}
                            >
                                {sub === "All" ? t('store.filters.all') : sub}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="store-grid">
                {filteredTemplates.length > 0 ? (
                    filteredTemplates.map((item) => {
                        const isOwned = purchasedIds.has(item.id);
                        return (
                            <div key={item.id} className="store-card glass-panel" onClick={() => handleViewDetails(item)}>
                                <div className="card-preview">
                                    <div className="preview-placeholder" style={{ backgroundImage: item.image_url ? `url(${item.image_url})` : 'none' }}></div>
                                    <div className="card-overlay">
                                        <button className="view-btn">{t('store.view_details')}</button>
                                        {item.demo_url && (
                                            <a
                                                href={item.demo_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="demo-btn-card"
                                                onClick={(e) => e.stopPropagation()}
                                                title={t('store.live_preview')}
                                            >
                                                <Eye size={20} />
                                            </a>
                                        )}
                                    </div>

                                    <span className={`tier-badge ${item.price === "Free" || item.price === "$0" ? 'free' : 'premium'}`}>
                                        {item.price === "Free" || item.price === "$0" ? t('store.free') : t('store.premium')}
                                    </span>

                                    <div className="category-badge-corner">
                                        <span className="badge category">{item.category}</span>
                                        {item.subCategory !== "All" && <span className="badge sub-category">{item.subCategory}</span>}
                                    </div>
                                </div>
                                <div className="card-content">
                                    <div className="card-header">
                                        <h3 className="card-title">{item.title}</h3>
                                    </div>

                                    <div className="card-divider"></div>

                                    <div className="card-footer">
                                        <span className="card-price font-mono">{item.price}</span>
                                        <button
                                            className={`add-cart-btn ${addedItems[item.id] ? 'added' : ''} ${isOwned ? 'opacity-50 cursor-not-allowed bg-green-900/40 border-green-500/50' : ''}`}
                                            aria-label={isOwned ? t('store.already_owned') : t('store.add_to_cart')}
                                            onClick={(e) => handleAddToCart(e, item)}
                                            disabled={isOwned}
                                            title={isOwned ? t('store.already_owned') : t('store.add_to_cart')}
                                            style={isOwned ? { borderColor: 'var(--accent-color)', color: 'var(--accent-color)' } : {}}
                                        >
                                            {isOwned ? (
                                                <span style={{ fontSize: '0.75rem', fontWeight: 'bold' }}>{t('store.owned')}</span>
                                            ) : addedItems[item.id] ? (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                            ) : (
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="no-results font-mono">{t('store.coming_soon')}</div>
                )}
            </div>

            {selectedItem && (
                <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
                    <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
                        <button className="modal-close" onClick={() => setSelectedItem(null)}>
                            <X size={24} />
                        </button>

                        <div className="modal-body">
                            <div className="modal-image-container">
                                <div
                                    className="modal-image"
                                    style={{ backgroundImage: selectedItem.image_url ? `url(${selectedItem.image_url})` : 'none' }}
                                ></div>
                            </div>

                            <div className="modal-details">
                                <div className="modal-header">
                                    <div className="modal-badges">
                                        <span className="badge category">{selectedItem.category}</span>
                                        {selectedItem.subCategory !== "All" && <span className="badge sub-category">{selectedItem.subCategory}</span>}
                                    </div>
                                    <h2 className="modal-title">{selectedItem.title}</h2>
                                    <span className="modal-price">{selectedItem.price}</span>
                                </div>

                                <div className="modal-description">
                                    <p>{selectedItem.description || t('store.description_placeholder')}</p>
                                </div>

                                <div className="modal-tags">
                                    <span className="tag-label font-mono">{t('store.technologies')}</span>
                                    <div className="tags-list">
                                        {selectedItem.tech && selectedItem.tech.map((tag, i) => (
                                            <span key={i} className="tech-tag font-mono">{tag}</span>
                                        ))}
                                    </div>
                                </div>

                                <div className="modal-actions">
                                    <button
                                        className={`modal-buy-btn ${addedItems[selectedItem.id] ? 'added' : ''} ${purchasedIds.has(selectedItem.id) ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        onClick={(e) => handleAddToCart(e, selectedItem)}
                                        disabled={purchasedIds.has(selectedItem.id)}
                                    >
                                        <>
                                            <span>{purchasedIds.has(selectedItem.id) ? t('store.already_owned') : addedItems[selectedItem.id] ? t('store.added_to_cart') : t('store.add_to_cart')}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                                        </>
                                    </button>

                                    {selectedItem.demo_url && (
                                        <a
                                            href={selectedItem.demo_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="modal-demo-btn"
                                            style={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '0.5rem',
                                                padding: '1rem 2rem',
                                                border: '1px solid rgba(255,255,255,0.2)',
                                                borderRadius: '8px',
                                                color: 'white',
                                                textDecoration: 'none',
                                                fontWeight: '600',
                                                transition: 'all 0.3s ease'
                                            }}
                                            onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--accent-color)'; e.currentTarget.style.color = 'var(--accent-color)'; }}
                                            onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'white'; }}
                                        >
                                            <Eye size={20} />
                                            {t('store.live_preview')}
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StorePage;
