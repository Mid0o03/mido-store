import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { useCart } from '../context/CartContext';
import { Plus, Eye, ShoppingBag, X } from 'lucide-react';
import './PageStyles.css';

/* Inline styles for demo button in card overlay */
const demoBtnCardStyle = `
    .demo-btn-card {
        background: rgba(0, 0, 0, 0.7);
        width: 40px;
        height: 40px;
        border-radius: 50%;
        display: flex;
        justify-content: center;
        align-items: center;
        color: white;
        transition: all 0.3s ease;
        border: 1px solid rgba(255, 255, 255, 0.2);
    }
    .demo-btn-card:hover {
        background: var(--accent-color);
        color: black;
        border-color: var(--accent-color);
        transform: scale(1.1);
    }
    .card-overlay {
        gap: 10px; /* Space between View Details and Eye Icon */
    }
`;

// Inject styles (Temporary hack since we are editing JSX file but want CSS)
// A better way is to put this in PageStyles.css
// I will append a <style> tag to the component render for simplicity in this file-flow


const StorePage = () => {
    const { templates, incrementViews } = useData();
    const { t } = useLanguage();
    const { addToCart } = useCart(); // Use Cart Context
    const [activeCategory, setActiveCategory] = useState("All");
    const [activeSubCategory, setActiveSubCategory] = useState("All");
    const [addedItems, setAddedItems] = useState({});
    const [selectedItem, setSelectedItem] = useState(null);

    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('newest'); // 'popular', 'newest', 'price-asc', 'price-desc'
    const [isSortOpen, setIsSortOpen] = useState(false);

    const handleAddToCart = (e, item) => {
        e.stopPropagation();
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
            <style>{demoBtnCardStyle}</style>
            <h1 className="page-title">{t('store.title_prefix')} <span className="text-accent">{t('store.title_highlight')}</span></h1>
            <p className="page-subtitle" style={{ marginBottom: '2rem', color: 'var(--text-secondary)' }}>
                {t('store.subtitle')}
            </p>

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
                        <svg className="search-icon" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
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
                    filteredTemplates.map((item) => (
                        <div key={item.id} className="store-card glass-panel" onClick={() => handleViewDetails(item)}>
                            <div className="card-preview">
                                <div className="preview-placeholder" style={{ backgroundImage: item.image_url ? `url(${item.image_url})` : 'none' }}></div>
                                <div className="card-overlay">
                                    <button className="view-btn">{t('store.view_details') || "View Details"}</button>
                                    {item.demo_url && (
                                        <a
                                            href={item.demo_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="demo-btn-card"
                                            onClick={(e) => e.stopPropagation()}
                                            title="Live Preview"
                                        >
                                            <Eye size={20} />
                                        </a>
                                    )}
                                </div>

                                {/* ... (lines 178-258 untouched) ... */}

                                <div className="modal-actions">
                                    <button
                                        className={`modal-buy-btn ${addedItems[selectedItem.id] ? 'added' : ''}`}
                                        onClick={(e) => handleAddToCart(e, selectedItem)}
                                    >
                                        {addedItems[selectedItem.id] ? (
                                            <>
                                                <span>Added to Cart</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                            </>
                                        ) : (
                                            <>
                                                <span>Add to Cart</span>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
                                            </>
                                        )}
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
                                            Live Preview
                                        </a>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
        </div>
    )
}
        </div >
    );
};

export default StorePage;
