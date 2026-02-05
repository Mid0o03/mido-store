import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [session, setSession] = useState(null);
    const [clientUser, setClientUser] = useState(null); // Mock client session
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // ... (Supabase session logic for Admin) ...
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            // Check for saved client session
            const storedClient = localStorage.getItem('clientUser');
            if (storedClient) setClientUser(JSON.parse(storedClient));
            setLoading(false);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    const login = async (email, password) => {
        // ... (Admin login) ...
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("Login Error:", error.message);
            return false;
        }
        return true;
    };

    const logout = async () => {
        await supabase.auth.signOut();
    };

    // Client Mock Auth
    const loginClient = (email) => {
        const user = { email, role: 'client', id: 'client-123' };
        setClientUser(user);
        localStorage.setItem('clientUser', JSON.stringify(user));
        return true;
    };

    const logoutClient = () => {
        setClientUser(null);
        localStorage.removeItem('clientUser');
    };

    return (
        <AuthContext.Provider value={{ session, login, logout, clientUser, loginClient, logoutClient, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
