import React, { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import CartDrawer from './components/CartDrawer';
import Footer from './components/Footer';
import Lenis from 'lenis';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import { FreelanceProvider } from './context/FreelanceContext';

// Lazy load all pages for maximum performance
const Home = lazy(() => import('./pages/Home'));
const StorePage = lazy(() => import('./pages/StorePage'));
const GalleryPage = lazy(() => import('./pages/GalleryPage'));
const LabPage = lazy(() => import('./pages/LabPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const AdminPage = lazy(() => import('./pages/AdminPage'));
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'));
const ClientLoginPage = lazy(() => import('./pages/ClientLoginPage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));

// Premium loading skeleton while lazy components load
const PageLoader = () => (
    <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '80vh', flexDirection: 'column', gap: '1.5rem'
    }}>
        <div style={{
            width: '48px', height: '48px', borderRadius: '50%',
            border: '3px solid rgba(255,255,255,0.1)',
            borderTopColor: 'var(--accent-color, #39ff14)',
            animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
);

// Use Navigate instead of redirect for cleaner v6 routing
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const { clientUser, loading } = useAuth();
  if (loading) return null; // Or a spinner
  if (!clientUser) return <Navigate to="/client-login" replace />;
  return children;
};

// Wrapper for scrolling to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      direction: 'vertical',
      gestureDirection: 'vertical',
      smooth: true,
      mouseMultiplier: 1,
      smoothTouch: false,
      touchMultiplier: 2,
    });

    function raf(time) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // Subdomain Check
  const hostname = window.location.hostname;
  // Check for 'admin' subdomain (e.g., admin.mido.com or admin.localhost for dev)
  const isAdminSubdomain = hostname.startsWith('admin.');

  return (
    <Router>
      <LanguageProvider>
        <AuthProvider>
          <FreelanceProvider>
            <DataProvider>
              <CartProvider>
                <div className="App">
                  <ScrollToTop />

                {isAdminSubdomain ? (
                  /* --- ADMIN APP --- */
                  <div className="admin-subdomain-wrapper">
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<AdminPage />} />
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    </Suspense>
                  </div>
                ) : (
                  /* --- PUBLIC / CLIENT APP --- */
                  <>
                    <Header />
                    <CartDrawer />
                    <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/store" element={<StorePage />} />
                      <Route path="/gallery" element={<GalleryPage />} />
                      <Route path="/lab" element={<LabPage />} />
                      <Route path="/contact" element={<ContactPage />} />

                      {/* Admin route redirect if accessed from main domain */}
                      <Route path="/admin" element={
                        <div className="page-container container flex-center" style={{ minHeight: '60vh', textAlign: 'center' }}>
                          <div className="glass-panel" style={{ padding: '3rem' }}>
                            <h2 className="mb-4">Espace Administration</h2>
                            <p className="mb-6 text-secondary">
                              L'interface d'administration est maintenant sur un sous-domaine dédié.
                            </p>
                            <a
                              href={`//admin.${hostname.replace('www.', '')}`}
                              className="cta-primary"
                            >
                              Aller sur admin.{hostname.replace('www.', '')}
                            </a>
                          </div>
                        </div>
                      } />

                      <Route path="/client-login" element={<ClientLoginPage />} />
                      <Route path="/client" element={
                        <ProtectedRoute>
                          <ClientDashboard />
                        </ProtectedRoute>
                      } />
                      <Route path="/mentions-legales" element={<LegalPage />} />
                      <Route path="/confidentialite" element={<LegalPage />} />
                      <Route path="/cgu" element={<LegalPage />} />
                    </Routes>
                    </Suspense>
                    <Footer />
                  </>
                )}

                </div>
              </CartProvider>
            </DataProvider>
          </FreelanceProvider>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
