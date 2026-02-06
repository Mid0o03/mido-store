import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // Unified Auth State
    const [session, setSession] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loading, setLoading] = useState(true);

    const checkAdmin = (session) => {
        // Admin Check using Environment Variables
        const adminEmails = import.meta.env.VITE_ADMIN_EMAILS
            ? import.meta.env.VITE_ADMIN_EMAILS.split(',')
            : [];

        if (session?.user?.email && adminEmails.includes(session.user.email)) {
            setIsAdmin(true);
        } else {
            setIsAdmin(false);
        }
    };

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
