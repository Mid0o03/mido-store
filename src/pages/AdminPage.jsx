import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../supabase';
import './PageStyles.css';

const CATEGORIES = {
    Web: ['SaaS', 'Portfolio', 'E-commerce', 'Landing Page', 'UI Kit'],
    App: ['Mobile UI', 'AI Interfaces', 'AR/VR', 'Design System']
};

const TECH_STACKS = [
    'React', 'Next.js', 'Vue', 'Tailwind', 'Framer Motion', 'GSAP',
    'Three.js', 'Supabase', 'Figma', 'TypeScript', 'Node.js',
    'React Native', 'Expo', 'Swift', 'Kotlin'
];

const AdminPage = () => {
    const { session, isAdmin, login, logout } = useAuth();
    const { templates, addTemplate, updateTemplate, deleteTemplate } = useData();
    const { t } = useLanguage();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Analytics State
    const [stats, setStats] = useState(null);
    const [statsLoading, setStatsLoading] = useState(true);

    // Fetch Stats on mount (if admin)
    useEffect(() => {
        if (isAdmin && session) {
            fetchStats();
        }
    }, [isAdmin, session]);

    const fetchStats = async () => {
        try {
            const { data, error } = await supabase.rpc('get_admin_stats');
            if (error) throw error;
            setStats(data);
        } catch (err) {
            console.error("Error fetching stats:", err);
        } finally {
            setStatsLoading(false);
        }
    };

    // Edit Mode State
    const [editMode, setEditMode] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const [formData, setFormData] = useState({
        title: '',
        category: 'Web',
        subCategory: '',
        price: '',
        tech: '',
        image_url: '',
        image_file: null,
        status: 'published',
        is_featured: false,
        file_url: null,
        zip_file: null
    });

    const [isDragging, setIsDragging] = useState(false);
    const [isDraggingZip, setIsDraggingZip] = useState(false);

    // Filter & Search State
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [filterStatus, setFilterStatus] = useState('All');

    // Initial subCategory based on default category
    useEffect(() => {
        // Only reset subCategory if we are NOT in edit mode (to avoid overwriting existing data on load)
        if (!editMode && !formData.subCategory && CATEGORIES[formData.category]) {
            setFormData(prev => ({ ...prev, subCategory: CATEGORIES[prev.category][0] }));
        }
    }, [formData.category, editMode]);

    const handleCategoryChange = (e) => {
        const newCat = e.target.value;
        const newSubCat = CATEGORIES[newCat] ? CATEGORIES[newCat][0] : '';
        setFormData(prev => ({
            ...prev,
            category: newCat,
            subCategory: newSubCat
        }));
    };

    const toggleTech = (tech) => {
        const currentTechs = formData.tech ? formData.tech.split(',').map(t => t.trim()).filter(Boolean) : [];
        if (currentTechs.includes(tech)) {
            setFormData({ ...formData, tech: currentTechs.filter(t => t !== tech).join(', ') });
        } else {
            setFormData({ ...formData, tech: [...currentTechs, tech].join(', ') });
        }
    };

    const handleEdit = (template) => {
        setEditMode(true);
        setEditingId(template.id);
        setFormData({
            title: template.title,
            category: template.category,
            subCategory: template.sub_category || template.subCategory, // Handle potential DB naming diffs
            price: template.price,
            tech: Array.isArray(template.tech) ? template.tech.join(', ') : template.tech,
            image_url: template.image_url,
            image_file: null,
            status: template.status || 'published',
            is_featured: template.is_featured || false,
            file_url: template.file_url || null,
            zip_file: null
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditMode(false);
        setEditingId(null);
        setFormData({
            title: '',
            category: 'Web',
            subCategory: CATEGORIES['Web'][0],
            price: '',
            tech: '',
            image_url: '',
            image_file: null,
            status: 'published',
            is_featured: false,
            file_url: null,
            zip_file: null
        });
    };

    const handleDuplicate = (template) => {
        setEditMode(false); // We are adding a NEW item, not editing the old one
        setEditingId(null);
        setFormData({
            title: `${template.title} (Copy)`,
            category: template.category,
            subCategory: template.sub_category || template.subCategory,
            price: template.price,
            tech: Array.isArray(template.tech) ? template.tech.join(', ') : template.tech,
            image_url: template.image_url, // Keeps the same image URL initially
            image_file: null,
            status: 'draft', // Safety: Duplicate as draft by default
            is_featured: false,
            file_url: template.file_url || null, // Might want to not copy this? But usually convenient.
            zip_file: null
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files[0];
        if (file && file.type.startsWith('image/')) {
            const url = URL.createObjectURL(file);
            setFormData({ ...formData, image_url: url, image_file: file });
        }
    };

    // Handle manual file selection if needed (could add a hidden input)
    // For now, dragging is the primary way or pasting URL

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await login(email, password);
        } catch (error) {
            console.error("Login exception:", error);
            alert(`Login Failed: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const formatPrice = (price) => {
        let p = price.toString();
        if (!p.includes('€')) return `${p}€`;
        return p;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...formData,
            price: formatPrice(formData.price),
            tech: formData.tech.split(',').map(tag => tag.trim()).filter(Boolean)
        };

        let result;
        if (editMode) {
            result = await updateTemplate(editingId, payload);
        } else {
            result = await addTemplate(payload);
        }

        setLoading(false);
        if (result.success) {
            alert(editMode ? "Product updated successfully!" : "Product added successfully!");
            handleCancelEdit(); // Reset form
        } else {
            alert(`Error saving template: ${result.message}`);
        }
    };

    if (loading) return <div className="flex-center">Loading...</div>;

    if (!session || !isAdmin) {
        return (
            <div className="page-container container flex-center">
                <form onSubmit={handleLogin} className="glass-panel login-form">
                    <h2 className="mb-4 text-center">{t('admin.login')}</h2>

                    {session && !isAdmin && (
                        <div className="mb-4 text-red-500 text-center bg-red-500/10 p-2 rounded">
                            Access Denied for {session.user.email}
                            <button onClick={logout} className="text-sm underline ml-2 block mx-auto mt-1">
                                Logout
                            </button>
                        </div>
                    )}

                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        className="admin-input mb-4"
                        required
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder={t('admin.password')}
                        className="admin-input mb-4"
                        required
                    />
                    <button type="submit" className="cta-primary w-full" disabled={loading}>
                        {loading ? 'LOADING...' : t('admin.enter')}
                    </button>
                </form>
            </div>
        );
    }

    const currentTechs = formData.tech ? formData.tech.split(',').map(t => t.trim()) : [];

    // Filter Logic
    const filteredTemplates = templates.filter(t => {
        if (!t) return false;
        const title = t.title || '';
        const tech = t.tech || '';

        const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (tech && tech.toString().toLowerCase().includes(searchTerm.toLowerCase()));

        const matchesCategory = filterCategory === 'All' || t.category === filterCategory;

        const itemStatus = t.status || 'published';
        const matchesStatus = filterStatus === 'All' ||
            (filterStatus === 'Featured' ? !!t.is_featured : (itemStatus === filterStatus));

        return matchesSearch && matchesCategory && matchesStatus;
    });

    return (
        <div className="page-container container">
            <div className="admin-header">
                <h1 className="page-title mb-0">{t('admin.dashboard')}</h1>
                <button onClick={logout} className="cta-secondary">Logout</button>
            </div>

            {/* ANALYTICS SECTION */}
            {stats && (
                <div className="glass-panel p-6 mb-8 border border-white/10" style={{ background: 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(0,0,0,0) 100%)' }}>
                    <h3 className="text-xl mb-6 text-accent flex items-center gap-2">
                        📊 Performance
                    </h3>

                    <div className="stats-grid">
                        {/* CARD 1: REVENUE */}
                        <div className="stat-card">
                            <span className="stat-label">Revenu Total</span>
                            <span className="stat-value">{stats.total_revenue}€</span>
                            <span className="stat-trend text-green-400">Lifetime</span>
                        </div>

                        {/* CARD 2: SALES */}
                        <div className="stat-card">
                            <span className="stat-label">Ventes Totales</span>
                            <span className="stat-value">{stats.total_sales}</span>
                            <span className="stat-trend text-blue-400">Transactions</span>
                        </div>

                        {/* CARD 3: AVG ORDER */}
                        <div className="stat-card">
                            <span className="stat-label">Panier Moyen</span>
                            <span className="stat-value">
                                {stats.total_sales > 0 ? (stats.total_revenue / stats.total_sales).toFixed(2) : 0}€
                            </span>
                            <span className="stat-trend text-purple-400">Avg / Order</span>
                        </div>
                    </div>

                    {/* CHART & RECENT SALES */}
                    <div className="analytics-details mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">

                        {/* CSS CHART */}
                        <div className="chart-container">
                            <h4 className="text-sm text-secondary mb-4 uppercase tracking-wider">Ventes 30 derniers jours</h4>
                            <div className="simple-bar-chart">
                                {stats.sales_by_date && stats.sales_by_date.length > 0 ? (
                                    stats.sales_by_date.map((day, i) => (
                                        <div key={i} className="chart-bar-col" title={`${day.date}: ${day.count} ventes (${day.total}€)`}>
                                            <div
                                                className="chart-bar"
                                                style={{ height: `${Math.min(day.count * 20, 100)}%` }} // Simple scaling
                                            ></div>
                                            <span className="chart-date">{day.date.slice(5)}</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-secondary text-sm italic">Pas de données récentes</div>
                                )}
                            </div>
                        </div>

                        {/* RECENT TRANSACTIONS TABLE */}
                        <div className="transactions-list">
                            <h4 className="text-sm text-secondary mb-4 uppercase tracking-wider">Dernières Commandes</h4>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead>
                                        <tr className="border-b border-white/10 text-secondary">
                                            <th className="pb-2">Produit</th>
                                            <th className="pb-2 text-right">Prix</th>
                                            <th className="pb-2 text-right">Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {stats.recent_sales && stats.recent_sales.length > 0 ? (
                                            stats.recent_sales.map((sale) => (
                                                <tr key={sale.id} className="border-b border-white/5 hover:bg-white/5">
                                                    <td className="py-2 text-white/80 truncate max-w-[150px]">{sale.template_title}</td>
                                                    <td className="py-2 text-right font-mono text-accent">{sale.price_paid}€</td>
                                                    <td className="py-2 text-right text-xs text-secondary">
                                                        {new Date(sale.created_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="3" className="py-4 text-center text-secondary">Aucune vente</td></tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="glass-panel admin-panel">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-accent mb-0">{editMode ? `EDIT PRODUCT` : t('admin.add_product')}</h3>
                    {editMode && (
                        <button onClick={handleCancelEdit} className="text-secondary text-sm hover:text-white">
                            CANCEL EDIT
                        </button>
                    )}
                </div>

                <form onSubmit={handleSubmit} className="admin-form">
                    <input
                        placeholder="Title"
                        value={formData.title}
                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                        className="admin-input"
                        required
                    />

                    <div className="price-input-wrapper">
                        <input
                            type="number"
                            placeholder="Price"
                            value={formData.price.replace('€', '')}
                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                            className="admin-input"
                            required
                        />
                        <span className="currency-symbol">€</span>
                    </div>

                    <select
                        value={formData.category}
                        onChange={handleCategoryChange}
                        className="admin-input"
                    >
                        <option value="Web">Web</option>
                        <option value="App">App</option>
                    </select>

                    <select
                        value={formData.subCategory}
                        onChange={e => setFormData({ ...formData, subCategory: e.target.value })}
                        className="admin-input"
                        required
                    >
                        {CATEGORIES[formData.category]?.map(sub => (
                            <option key={sub} value={sub}>{sub}</option>
                        ))}
                    </select>

                    <select
                        value={formData.status}
                        onChange={e => setFormData({ ...formData, status: e.target.value })}
                        className="admin-input"
                    >
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                        <option value="archived">Archived</option>
                    </select>

                    <div className="flex items-center admin-input">
                        <input
                            type="checkbox"
                            id="featured"
                            checked={formData.is_featured}
                            onChange={e => setFormData({ ...formData, is_featured: e.target.checked })}
                            className="mr-2"
                        />
                        <label htmlFor="featured" className="cursor-pointer select-none">Feature on Homepage</label>
                    </div>

                    {/* Drag & Drop Zone - IMAGE */}
                    <div
                        className={`image-drop-zone ${isDragging ? 'dragging' : ''}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                    >
                        {formData.image_url ? (
                            <div className="preview-container">
                                <img src={formData.image_url} alt="Preview" className="image-preview" />
                                <button
                                    type="button"
                                    className="remove-image-btn"
                                    onClick={() => setFormData({ ...formData, image_url: '', image_file: null })}
                                >
                                    X
                                </button>
                            </div>
                        ) : (
                            <div className="drop-placeholder">
                                <p className="mb-2">Drag & Drop Image (JPG/PNG)</p>
                                <span className="text-secondary text-sm">Or paste URL below</span>
                            </div>
                        )}
                    </div>

                    {/* NEW: Drag & Drop Zone - ZIP FILE */}
                    <div
                        className={`image-drop-zone ${isDraggingZip ? 'dragging' : ''}`}
                        onDragOver={(e) => { e.preventDefault(); setIsDraggingZip(true); }}
                        onDragLeave={(e) => { e.preventDefault(); setIsDraggingZip(false); }}
                        onDrop={(e) => {
                            e.preventDefault();
                            setIsDraggingZip(false);
                            const file = e.dataTransfer.files[0];
                            if (file && (file.name.endsWith('.zip') || file.type.includes('zip'))) {
                                setFormData({ ...formData, zip_file: file, file_url: file.name });
                            } else {
                                alert("Please upload a .zip file");
                            }
                        }}
                    >
                        {formData.file_url ? (
                            <div className="preview-container" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                                <div className="text-4xl">📦</div>
                                <span className="text-sm mt-2 text-accent truncate w-full px-2" title={formData.file_url}>
                                    {formData.zip_file ? `Ready to upload: ${formData.zip_file.name}` : `Linked: ${formData.file_url.substring(0, 15)}...`}
                                </span>
                                <button
                                    type="button"
                                    className="remove-image-btn"
                                    onClick={() => setFormData({ ...formData, file_url: null, zip_file: null })}
                                    style={{ top: '-10px', right: '-10px' }}
                                >
                                    X
                                </button>
                            </div>
                        ) : (
                            <div className="drop-placeholder">
                                <p className="mb-2">Drag & Drop Product File (.ZIP)</p>
                                <span className="text-secondary text-sm">Max 50MB</span>
                            </div>
                        )}
                    </div>

                    <input
                        placeholder="Image URL (Unsplash, etc.)"
                        value={formData.image_url}
                        onChange={e => setFormData({ ...formData, image_url: e.target.value })}
                        className="admin-input full-width"
                    />

                    <div className="full-width">
                        <label className="text-sm text-secondary mb-2 block">Tech Stack</label>
                        <div className="tech-tags-container">
                            {TECH_STACKS.map(tech => (
                                <button
                                    type="button"
                                    key={tech}
                                    className={`tech-chip ${currentTechs.includes(tech) ? 'active' : ''}`}
                                    onClick={() => toggleTech(tech)}
                                >
                                    {tech}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ gridColumn: '1 / -1', marginTop: '1rem' }}>
                        <button type="submit" className="cta-primary w-full" disabled={loading}>
                            {loading ? (editMode ? 'UPDATING...' : 'SAVING...') : (editMode ? 'UPDATE PRODUCT' : 'ADD TO STORE')}
                        </button>
                    </div>
                </form>
            </div>

            {/* Search & Filter Bar */}
            <div className="glass-panel p-4 mb-6 sticky top-20 z-10 backdrop-blur-md border border-white/10 rounded-xl">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <h3 className="mb-0 whitespace-nowrap">Products ({filteredTemplates.length})</h3>

                    <div className="flex flex-wrap gap-4 w-full md:w-auto">
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="admin-input !mb-0 min-w-[200px]"
                        />

                        <select
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="admin-input !mb-0 w-auto"
                        >
                            <option value="All">All Categories</option>
                            <option value="Web">Web</option>
                            <option value="App">App</option>
                        </select>

                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="admin-input !mb-0 w-auto"
                        >
                            <option value="All">All Status</option>
                            <option value="published">Published</option>
                            <option value="draft">Draft</option>
                            <option value="Featured">★ Featured</option>
                        </select>
                    </div>
                </div>
            </div>

            <div className="store-grid">
                {filteredTemplates.length > 0 ? (
                    filteredTemplates.map(t => (
                        <div key={t.id} className="store-card glass-panel cursor-default">
                            {t.is_featured && <div className="absolute top-2 right-2 text-yellow-400 text-xl z-10" title="Featured">★</div>}
                            <div className="card-preview">
                                <div className="preview-placeholder" style={{ backgroundImage: t.image_url ? `url(${t.image_url})` : 'none' }}>
                                    {t.status === 'draft' && <span className="absolute top-2 left-2 bg-gray-600 text-white text-xs px-2 py-1 rounded shadow">DRAFT</span>}
                                    <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                                        <span>👁️</span> {t.views || 0}
                                    </div>
                                </div>
                            </div>
                            <div className="card-content">
                                <h4 className="card-title">{t.title}</h4>
                                <div className="card-tags">
                                    <span className="tech-tag">{t.category}</span>
                                    <span className="tech-tag">{t.sub_category || t.subCategory}</span>
                                </div>
                                <div className="card-footer" style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
                                    <span className="card-price mr-auto">{t.price}</span>
                                    <button
                                        onClick={() => handleEdit(t)}
                                        className="cta-secondary"
                                        style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                                    >
                                        EDIT
                                    </button>
                                    <button
                                        onClick={() => handleDuplicate(t)}
                                        className="cta-secondary"
                                        style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                                        title="Duplicate"
                                    >
                                        📑
                                    </button>
                                    <button
                                        onClick={() => { if (window.confirm('Delete?')) deleteTemplate(t.id); }}
                                        className="text-red font-mono delete-btn"
                                    >
                                        X
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center w-full py-10 glass-panel col-span-full">
                        <p className="text-xl text-secondary">No products found matching your filters.</p>
                        <button
                            className="cta-secondary mt-4"
                            onClick={() => { setSearchTerm(''); setFilterCategory('All'); setFilterStatus('All'); }}
                        >
                            Clear Filters
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                .flex-center { display: flex; justify-content: center; align-items: center; min-height: 60vh; }
                .login-form { padding: 3rem; width: 100%; max-width: 450px; }
                .w-full { width: 100%; }
                .admin-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
                .admin-panel { padding: 3rem; margin-bottom: 4rem; }
                .admin-form { display: grid; gap: 1.5rem; grid-template-columns: 1fr 1fr; }
                .full-width { grid-column: 1 / -1; }
                .admin-input {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 1rem;
                    color: white;
                    border-radius: 8px;
                    transition: all 0.3s ease;
                    width: 100%;
                }
                .admin-input:focus { border-color: var(--accent-color); outline: none; background: rgba(255,255,255,0.05); }
                
                .price-input-wrapper { position: relative; }
                .currency-symbol {
                    position: absolute;
                    right: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    color: var(--text-secondary);
                }

                .image-drop-zone {
                    grid-column: 1 / -1;
                    border: 2px dashed rgba(255,255,255,0.2);
                    border-radius: 12px;
                    padding: 3rem;
                    text-align: center;
                    transition: all 0.3s ease;
                    background: rgba(0,0,0,0.2);
                    cursor: pointer;
                }
                .image-drop-zone.dragging { border-color: var(--accent-color); background: rgba(57, 255, 20, 0.05); }
                .cursor-default { cursor: default !important; }
                .delete-btn { background: none; border: 1px solid #ff5f56; color: #ff5f56; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; transition: all 0.2s; }
                .delete-btn:hover { background: #ff5f56; color: white; }
                .text-center { text-align: center; }
                
                /* Fixed Preview Size */
                .preview-container {
                    position: relative;
                    width: 150px;
                    height: 150px;
                    margin: 0 auto;
                    overflow: hidden;
                    border-radius: 8px;
                    border: 1px solid rgba(255,255,255,0.2);
                }
                .image-preview {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                
                /* Tech Tags */
                .tech-tags-container {
                    display: flex;
                    flex-wrap: wrap;
                    gap: 0.5rem;
                }
                .tech-chip {
                    background: rgba(255,255,255,0.05);
                    border: 1px solid rgba(255,255,255,0.1);
                    color: var(--text-secondary);
                    padding: 0.4rem 0.8rem;
                    border-radius: 20px;
                    font-size: 0.85rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .tech-chip:hover {
                    background: rgba(255,255,255,0.1);
                    color: white;
                }
                .tech-chip.active {
                    background: var(--accent-color);
                    color: black;
                    border-color: var(--accent-color);
                    font-weight: 600;
                }

                /* CTA Button Styling Ensure Visibility */
                .cta-primary {
                    background: var(--accent-color);
                    color: #000;
                    border: none;
                    padding: 1rem 2rem;
                    font-weight: 700;
                    letter-spacing: 0.05em;
                    text-transform: uppercase;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    border-radius: 8px;
                }
                .cta-primary:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 5px 15px rgba(57, 255, 20, 0.3);
                }
                .cta-primary:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }
                .cta-secondary {
                    background: transparent;
                    color: white;
                    border: 1px solid rgba(255,255,255,0.3);
                    padding: 0.8rem 1.5rem;
                    border-radius: 8px;
                    cursor: pointer;
                }
                .block { display: block; }

                /* ANALYTICS STYLES */
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 1.5rem;
                }
                .stat-card {
                    background: rgba(255,255,255,0.03);
                    border: 1px solid rgba(255,255,255,0.1);
                    padding: 1.5rem;
                    border-radius: 12px;
                    display: flex;
                    flex-direction: column;
                }
                .stat-label { font-size: 0.85rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem; }
                .stat-value { font-size: 2rem; font-weight: 700; color: white; margin-bottom: 0.2rem; }
                .stat-trend { font-size: 0.8rem; font-weight: 500; }

                /* Simple Bar Chart */
                .simple-bar-chart {
                    height: 150px;
                    display: flex;
                    align-items: flex-end;
                    gap: 8px;
                    border-bottom: 1px solid rgba(255,255,255,0.1);
                    padding-bottom: 5px;
                }
                .chart-bar-col {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    height: 100%;
                    justify-content: flex-end;
                }
                .chart-bar {
                    width: 100%;
                    background: var(--accent-color);
                    border-radius: 4px 4px 0 0;
                    opacity: 0.7;
                    transition: all 0.2s;
                    min-height: 4px;
                }
                .chart-bar:hover { opacity: 1; transform: scaleY(1.05); }
                .chart-date { font-size: 0.65rem; color: var(--text-secondary); margin-top: 5px; }
            `}</style>
        </div>
    );
};

export default AdminPage;
