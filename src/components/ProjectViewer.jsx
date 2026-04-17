import React, { useState, useEffect } from 'react';
import './ProjectViewer.css';

const DEVICES = [
    {
        id: 'desktop',
        label: 'Desktop',
        icon: '🖥',
        width: '100%',
        maxWidth: '1440px',
        height: '720px',
        frameStyle: {},
        iframeStyle: { borderRadius: '4px' }
    },
    {
        id: 'tablet',
        label: 'Tablet',
        icon: '⬜',
        width: '768px',
        maxWidth: '768px',
        height: '1024px',
        frameStyle: {
            border: '12px solid #1a1a1a',
            borderRadius: '20px',
            boxShadow: '0 0 0 2px #333, 0 30px 60px rgba(0,0,0,0.8)'
        },
        iframeStyle: { borderRadius: '10px' }
    },
    {
        id: 'mobile',
        label: 'Mobile',
        icon: '📱',
        width: '390px',
        maxWidth: '390px',
        height: '844px',
        frameStyle: {
            border: '14px solid #111',
            borderRadius: '44px',
            boxShadow: '0 0 0 3px #333, 0 0 0 4px #555, 0 40px 80px rgba(0,0,0,0.9)',
            position: 'relative'
        },
        iframeStyle: { borderRadius: '32px' },
        notch: true
    }
];

const ProjectViewer = ({ url, title, onClose }) => {
    const [activeDevice, setActiveDevice] = useState('desktop');
    const [refreshKey, setRefreshKey] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const device = DEVICES.find(d => d.id === activeDevice);

    const handleIframeLoad = () => {
        setIsLoading(false);
    };

    // Fallback for sites that block iframes
    const handleIframeError = () => {
        setIsLoading(false);
    };

    // Prevent body scrolling when the viewer is open
    useEffect(() => {
        if (url) {
            const originalStyle = window.getComputedStyle(document.body).overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = originalStyle;
            };
        }
    }, [url]);

    if (!url) return null;

    return (
        <div className="viewer-overlay" onClick={onClose}>
            <div className="viewer-wrapper" onClick={(e) => e.stopPropagation()}>

                {/* Top Bar */}
                <div className="viewer-topbar glass-panel">
                    <div className="viewer-url-bar">
                        <span className="viewer-url-icon">🔒</span>
                        <span className="viewer-url-text">{url}</span>
                    </div>

                    <div className="viewer-device-switcher">
                        {DEVICES.map(d => (
                            <button
                                key={d.id}
                                className={`viewer-device-btn ${activeDevice === d.id ? 'active' : ''}`}
                                onClick={() => { setActiveDevice(d.id); setIsLoading(true); }}
                                title={d.label}
                            >
                                <span>{d.icon}</span>
                                <span className="viewer-device-label">{d.label}</span>
                            </button>
                        ))}
                    </div>

                    <div className="viewer-actions">
                        <button
                            className="viewer-action-btn"
                            onClick={() => { setRefreshKey(k => k + 1); setIsLoading(true); }}
                            title="Actualiser"
                        >
                            🔄
                        </button>
                        <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="viewer-action-btn"
                            title="Ouvrir dans un nouvel onglet"
                        >
                            ↗
                        </a>
                        <button className="viewer-action-btn viewer-close" onClick={onClose} title="Fermer">
                            ✕
                        </button>
                    </div>
                </div>

                {/* Device Frame + Iframe */}
                <div className="viewer-stage">
                    <div
                        className={`viewer-device-frame device-${activeDevice}`}
                        style={{
                            width: device.width,
                            maxWidth: device.maxWidth,
                            height: device.height,
                            ...device.frameStyle,
                        }}
                    >
                        {/* Mobile notch */}
                        {device.notch && (
                            <div className="viewer-notch">
                                <div className="viewer-notch-camera" />
                                <div className="viewer-notch-speaker" />
                            </div>
                        )}

                        {/* Loading overlay */}
                        {isLoading && (
                            <div className="viewer-loading-overlay">
                                <div className="viewer-spinner" />
                                <p>Chargement de {title}...</p>
                            </div>
                        )}

                        <iframe
                            key={refreshKey}
                            src={url}
                            title={title}
                            style={{
                                width: '100%',
                                height: '100%',
                                border: 'none',
                                display: 'block',
                                ...device.iframeStyle
                            }}
                            onLoad={handleIframeLoad}
                            onError={handleIframeError}
                            allow="fullscreen"
                            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                        />

                        {/* Mobile home indicator */}
                        {device.notch && (
                            <div className="viewer-home-indicator" />
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ProjectViewer;
