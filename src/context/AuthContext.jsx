import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Unified Auth State
    const [session, setSession] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Initial Session Check
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            checkAdmin(session);
            setLoading(false);
        });

        // Listen for changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            checkAdmin(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkAdmin = (session) => {
        // Simple Admin Check: In detailed apps, use Public Profile table or App Metadata.
        // For MVP: Check email.
        if (session?.user?.email === 'admin@mido.com' || session?.user?.email === 'midodev.fr@gmail.com') { // REPLACE with actual admin email if known, or use metadata
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
    };

    // Generic Login (Used by Admin & Client)
    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            console.error("Login Error:", error.message);
            throw error;
        }
        return data; // { session, user }
    };

    const signUpClient = async (email, password) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                // Disable email confirmation requirement in Supabase Dashboard for this to allow instant login
                // Or handle "Check Email" flow
            }
        });

        if (error) {
            console.error("SignUp Error:", error.message);
            throw error;
        }
        return data;
    };

    const logout = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setIsAdmin(false);
        // Clear local storage if we stored anything extra
        localStorage.removeItem('clientUser');
    };

    // Alias for backward compatibility (optional) or clarity
    const loginClient = login;
    const clientUser = session?.user || null; // Now clientUser IS the session user

    const resetPassword = async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: window.location.origin + '/reset-password',
        });
        if (error) throw error;
    };

    return (
        <AuthContext.Provider value={{ session, isAdmin, login, logout, clientUser, loginClient, signUpClient, resetPassword, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
