import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useAuth } from './AuthContext';

const FreelanceContext = createContext();

export const FreelanceProvider = ({ children }) => {
    const { isAdmin } = useAuth();

    // CRM - Clients
    const [clients, setClients] = useState([]);
    // Quotes
    const [quotes, setQuotes] = useState([]);
    // Invoices
    const [invoices, setInvoices] = useState([]);
    // Projects
    const [freelanceProjects, setFreelanceProjects] = useState([]);
    // Expenses
    const [expenses, setExpenses] = useState([]);
    // Unread messages count
    const [unreadCount, setUnreadCount] = useState(0);
    // Vault Documents
    const [clientDocuments, setClientDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    // Only fetch admin data if admin
    useEffect(() => {
        if (isAdmin) {
            Promise.all([
                fetchClients(),
                fetchQuotes(),
                fetchInvoices(),
                fetchFreelanceProjects(),
                fetchExpenses(),
                fetchUnreadCount(),
                fetchClientDocuments(),
            ]).finally(() => setLoading(false));
        } else {
            setLoading(false);
        }
    }, [isAdmin]);

    // =============================================
    // CLIENTS
    // =============================================
    const fetchClients = async () => {
        const { data, error } = await supabase
            .from('clients')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error) setClients(data || []);
    };

    const addClient = async (clientData) => {
        const { data, error } = await supabase
            .from('clients')
            .insert([clientData])
            .select();
        if (error) return { success: false, message: error.message };
        setClients(prev => [data[0], ...prev]);
        return { success: true, data: data[0] };
    };

    const updateClient = async (id, updates) => {
        const { data, error } = await supabase
            .from('clients')
            .update(updates)
            .eq('id', id)
            .select();
        if (error) return { success: false, message: error.message };
        setClients(prev => prev.map(c => c.id === id ? data[0] : c));
        return { success: true };
    };

    const deleteClient = async (id) => {
        const { error } = await supabase.from('clients').delete().eq('id', id);
        if (error) return { success: false, message: error.message };
        setClients(prev => prev.filter(c => c.id !== id));
        return { success: true };
    };

    // =============================================
    // FREELANCE PROJECTS
    // =============================================
    const fetchFreelanceProjects = async () => {
        const { data, error } = await supabase
            .from('freelance_projects')
            .select('*, clients(name, email, avatar_url)')
            .order('created_at', { ascending: false });
        if (!error) setFreelanceProjects(data || []);
    };

    const addFreelanceProject = async (projectData) => {
        const { data, error } = await supabase
            .from('freelance_projects')
            .insert([projectData])
            .select('*, clients(name, email, avatar_url)');
        if (error) return { success: false, message: error.message };
        setFreelanceProjects(prev => [data[0], ...prev]);
        return { success: true, data: data[0] };
    };

    const updateFreelanceProject = async (id, updates) => {
        const { data, error } = await supabase
            .from('freelance_projects')
            .update(updates)
            .eq('id', id)
            .select('*, clients(name, email, avatar_url)');
        if (error) return { success: false, message: error.message };
        setFreelanceProjects(prev => prev.map(p => p.id === id ? data[0] : p));
        return { success: true };
    };

    // =============================================
    // QUOTES
    // =============================================
    const fetchQuotes = async () => {
        const { data, error } = await supabase
            .from('quotes')
            .select('*, clients(name, email)')
            .order('created_at', { ascending: false });
        if (!error) setQuotes(data || []);
    };

    const addQuote = async (quoteData) => {
        // Generate quote number via DB function
        const { data: numData } = await supabase.rpc('generate_quote_number');
        const payload = {
            ...quoteData,
            quote_number: numData || `DEVIS-${Date.now()}`,
            deposit_amount: parseFloat((quoteData.total * 0.30).toFixed(2)),
        };
        const { data, error } = await supabase
            .from('quotes')
            .insert([payload])
            .select('*, clients(name, email)');
        if (error) return { success: false, message: error.message };
        setQuotes(prev => [data[0], ...prev]);
        return { success: true, data: data[0] };
    };

    const updateQuote = async (id, updates) => {
        const { data, error } = await supabase
            .from('quotes')
            .update(updates)
            .eq('id', id)
            .select('*, clients(name, email)');
        if (error) return { success: false, message: error.message };
        setQuotes(prev => prev.map(q => q.id === id ? data[0] : q));
        return { success: true };
    };

    // =============================================
    // INVOICES
    // =============================================
    const fetchInvoices = async () => {
        const { data, error } = await supabase
            .from('invoices')
            .select('*, clients(name, email)')
            .order('created_at', { ascending: false });
        if (!error) setInvoices(data || []);
    };

    const addInvoice = async (invoiceData) => {
        const { data: numData } = await supabase.rpc('generate_invoice_number');
        const payload = {
            ...invoiceData,
            invoice_number: numData || `FACT-${Date.now()}`,
        };
        const { data, error } = await supabase
            .from('invoices')
            .insert([payload])
            .select('*, clients(name, email)');
        if (error) return { success: false, message: error.message };
        setInvoices(prev => [data[0], ...prev]);
        return { success: true, data: data[0] };
    };

    const markInvoicePaid = async (id) => {
        const { data, error } = await supabase
            .from('invoices')
            .update({ status: 'paid', paid_at: new Date().toISOString(), amount_paid: invoices.find(i => i.id === id)?.total })
            .eq('id', id)
            .select();
        if (error) return { success: false, message: error.message };
        setInvoices(prev => prev.map(i => i.id === id ? data[0] : i));
        return { success: true };
    };

    // =============================================
    // EXPENSES
    // =============================================
    const fetchExpenses = async () => {
        const { data, error } = await supabase
            .from('expenses')
            .select('*')
            .order('date', { ascending: false });
        if (!error) setExpenses(data || []);
    };

    const addExpense = async (expenseData) => {
        const { data, error } = await supabase
            .from('expenses')
            .insert([expenseData])
            .select();
        if (error) return { success: false, message: error.message };
        setExpenses(prev => [data[0], ...prev]);
        return { success: true };
    };

    const deleteExpense = async (id) => {
        const { error } = await supabase.from('expenses').delete().eq('id', id);
        if (error) return { success: false, message: error.message };
        setExpenses(prev => prev.filter(e => e.id !== id));
        return { success: true };
    };

    // =============================================
    // MESSAGES / UNREAD COUNT
    // =============================================
    const fetchUnreadCount = async () => {
        const { count, error } = await supabase
            .from('messages')
            .select('*', { count: 'exact', head: true })
            .eq('sender_type', 'client')
            .is('read_at', null);
        if (!error) setUnreadCount(count || 0);
    };

    const markMessagesRead = async (projectId) => {
        await supabase
            .from('messages')
            .update({ read_at: new Date().toISOString() })
            .eq('project_id', projectId)
            .eq('sender_type', 'client')
            .is('read_at', null);
        fetchUnreadCount();
    };

    // =============================================
    // COMPUTED FINANCIALS (Auto-entrepreneur)
    // =============================================
    const computeFinancials = () => {
        const now = new Date();
        const thisMonth = now.getMonth();
        const thisYear = now.getFullYear();

        const paidInvoices = invoices.filter(i => i.status === 'paid');

        const revenueThisMonth = paidInvoices
            .filter(i => {
                const d = new Date(i.paid_at);
                return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
            })
            .reduce((sum, i) => sum + parseFloat(i.total || 0), 0);

        const revenueThisYear = paidInvoices
            .filter(i => new Date(i.paid_at).getFullYear() === thisYear)
            .reduce((sum, i) => sum + parseFloat(i.total || 0), 0);

        const totalExpenses = expenses
            .filter(e => new Date(e.date).getFullYear() === thisYear)
            .reduce((sum, e) => sum + parseFloat(e.amount || 0), 0);

        // Auto-entrepreneur: ~22% social charges on CA (prestations de services BIC)
        const socialChargesRate = 0.215;
        const socialChargesEstimate = revenueThisYear * socialChargesRate;

        return {
            revenueThisMonth,
            revenueThisYear,
            totalExpenses,
            socialChargesEstimate,
            netEstimate: revenueThisYear - totalExpenses - socialChargesEstimate,
        };
    };

    // =============================================
    // VAULT (CLIENT DOCUMENTS)
    // =============================================
    const fetchClientDocuments = async () => {
        const { data, error } = await supabase
            .from('client_documents')
            .select('*')
            .order('created_at', { ascending: false });
        if (!error) setClientDocuments(data || []);
    };

    const addClientDocument = async (docData, file = null) => {
        let file_url = docData.file_url;
        
        if (file) {
            const fileExt = file.name.split('.').pop();
            const filePath = `${docData.client_id}/${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('vault').upload(filePath, file);
            if (uploadError) return { success: false, message: uploadError.message };
            file_url = filePath;
        }

        const { data, error } = await supabase
            .from('client_documents')
            .insert([{ ...docData, file_url }])
            .select();
        if (error) return { success: false, message: error.message };
        setClientDocuments(prev => [data[0], ...prev]);
        return { success: true, data: data[0] };
    };

    const downloadClientDocument = async (filePath) => {
        const { data, error } = await supabase.storage.from('vault').download(filePath);
        if (error) return null;
        return URL.createObjectURL(data);
    };

    const deleteClientDocument = async (id, filePath) => {
        // First delete from storage if there's a file
        if (filePath) {
            await supabase.storage.from('vault').remove([filePath]);
        }
        // Then delete from DB
        const { error } = await supabase.from('client_documents').delete().eq('id', id);
        if (error) return { success: false, message: error.message };
        setClientDocuments(prev => prev.filter(d => d.id !== id));
        return { success: true };
    };

    return (
        <FreelanceContext.Provider value={{
            // Data
            clients, quotes, invoices, freelanceProjects, expenses, unreadCount, clientDocuments, loading,
            // Client CRUD
            addClient, updateClient, deleteClient, fetchClients,
            // Project CRUD
            addFreelanceProject, updateFreelanceProject, fetchFreelanceProjects,
            // Quote CRUD
            addQuote, updateQuote,
            // Invoice
            addInvoice, markInvoicePaid,
            // Expense
            addExpense, deleteExpense,
            // Messaging
            markMessagesRead, fetchUnreadCount,
            // Financials
            computeFinancials,
            // Vault
            fetchClientDocuments, addClientDocument, deleteClientDocument, downloadClientDocument,
        }}>
            {children}
        </FreelanceContext.Provider>
    );
};

export const useFreelance = () => useContext(FreelanceContext);
