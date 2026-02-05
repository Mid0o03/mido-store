import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header';
import Home from './pages/Home';
import StorePage from './pages/StorePage';
import LabPage from './pages/LabPage';
import ContactPage from './pages/ContactPage';
import AdminPage from './pages/AdminPage';
import ClientDashboard from './pages/ClientDashboard';
import ClientLoginPage from './pages/ClientLoginPage';
import LegalPage from './pages/LegalPage';
import { DataProvider } from './context/DataContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { CartProvider } from './context/CartContext';
import CartDrawer from './components/CartDrawer';
import Lenis from 'lenis';
import Footer from './components/Footer';

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
          <DataProvider>
            <CartProvider>
              <div className="App">
                <ScrollToTop />

                <>
                  <Header />
                  <CartDrawer />
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/store" element={<StorePage />} />
                    <Route path="/lab" element={<LabPage />} />
                    <Route path="/contact" element={<ContactPage />} />

                    {/* Allow Admin Access directly for now to fix black screen */}
                    <Route path="/admin" element={<AdminPage />} />

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
                  <Footer />
                </>

              </div>
            </CartProvider>
          </DataProvider>
        </AuthProvider>
      </LanguageProvider>
    </Router>
  );
}

export default App;
