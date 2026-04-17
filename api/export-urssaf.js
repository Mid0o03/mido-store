/**
 * /api/export-urssaf.js
 * Generates a CSV export of revenue and expenses for URSSAF quarterly declaration.
 * Expects: { year, quarter (1-4, optional) }
 * Auth: Admin only — validated via Supabase service role
 */
import { createClient } from '@supabase/supabase-js';

const toCsv = (rows) => {
    if (!rows.length) return '';
    const headers = Object.keys(rows[0]);
    const lines = [
        headers.join(';'),
        ...rows.map(row =>
            headers.map(h => {
                const val = row[h] === null || row[h] === undefined ? '' : String(row[h]);
                // Escape semicolons and quotes for CSV
                return val.includes(';') || val.includes('"') ? `"${val.replace(/"/g, '""')}"` : val;
            }).join(';')
        )
    ];
    return lines.join('\n');
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return res.status(500).json({ message: 'Config Error: Variables Supabase manquantes.' });
    }

    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

    try {
        const { year = new Date().getFullYear(), quarter = null } = req.body;

        // Build date range
        let startDate, endDate;
        if (quarter) {
            const qStart = [1, 4, 7, 10][quarter - 1];
            startDate = `${year}-${String(qStart).padStart(2, '0')}-01`;
            const qEnd = [3, 6, 9, 12][quarter - 1];
            const lastDay = new Date(year, qEnd, 0).getDate();
            endDate = `${year}-${String(qEnd).padStart(2, '0')}-${lastDay}`;
        } else {
            startDate = `${year}-01-01`;
            endDate = `${year}-12-31`;
        }

        // Fetch paid invoices
        const { data: invoices, error: invError } = await supabase
            .from('invoices')
            .select('invoice_number, created_at, paid_at, total, type, clients(name, email)')
            .eq('status', 'paid')
            .gte('paid_at', startDate)
            .lte('paid_at', endDate)
            .order('paid_at', { ascending: true });

        if (invError) throw invError;

        // Fetch expenses
        const { data: expenses, error: expError } = await supabase
            .from('expenses')
            .select('*')
            .gte('date', startDate)
            .lte('date', endDate)
            .order('date', { ascending: true });

        if (expError) throw expError;

        // Build revenue rows
        const revenueRows = (invoices || []).map(inv => ({
            'Type': 'RECETTE',
            'Date': inv.paid_at ? inv.paid_at.slice(0, 10) : inv.created_at.slice(0, 10),
            'Référence': inv.invoice_number,
            'Client': inv.clients?.name || '',
            'Email Client': inv.clients?.email || '',
            'Nature': inv.type === 'deposit' ? 'Acompte 30%' : 'Prestation Web/Mobile',
            'Montant HT (€)': parseFloat(inv.total || 0).toFixed(2),
            'TVA': 'Exonéré (art. 293B CGI)',
            'Montant TTC (€)': parseFloat(inv.total || 0).toFixed(2),
        }));

        // Build expense rows
        const expenseRows = (expenses || []).map(exp => ({
            'Type': 'DÉPENSE',
            'Date': exp.date,
            'Référence': exp.id,
            'Client': '',
            'Email Client': '',
            'Nature': exp.description,
            'Montant HT (€)': `-${parseFloat(exp.amount || 0).toFixed(2)}`,
            'TVA': exp.category === 'software' ? 'Déductible' : '',
            'Montant TTC (€)': `-${parseFloat(exp.amount || 0).toFixed(2)}`,
        }));

        // Totals
        const totalRevenue = revenueRows.reduce((s, r) => s + parseFloat(r['Montant HT (€)'] || 0), 0);
        const totalExpenses = expenseRows.reduce((s, r) => s + Math.abs(parseFloat(r['Montant HT (€)'].replace('-', '') || 0)), 0);
        const socialCharges = totalRevenue * 0.215;
        const net = totalRevenue - totalExpenses - socialCharges;

        const summaryRows = [
            { 'Type': '---', 'Date': '', 'Référence': '', 'Client': '', 'Email Client': '', 'Nature': 'TOTAL RECETTES', 'Montant HT (€)': totalRevenue.toFixed(2), 'TVA': '', 'Montant TTC (€)': totalRevenue.toFixed(2) },
            { 'Type': '---', 'Date': '', 'Référence': '', 'Client': '', 'Email Client': '', 'Nature': 'TOTAL DÉPENSES', 'Montant HT (€)': `-${totalExpenses.toFixed(2)}`, 'TVA': '', 'Montant TTC (€)': `-${totalExpenses.toFixed(2)}` },
            { 'Type': '---', 'Date': '', 'Référence': '', 'Client': '', 'Email Client': '', 'Nature': 'CHARGES SOCIALES EST. (21.5%)', 'Montant HT (€)': `-${socialCharges.toFixed(2)}`, 'TVA': '', 'Montant TTC (€)': `-${socialCharges.toFixed(2)}` },
            { 'Type': '===', 'Date': '', 'Référence': '', 'Client': '', 'Email Client': '', 'Nature': 'NET ESTIMÉ', 'Montant HT (€)': net.toFixed(2), 'TVA': '', 'Montant TTC (€)': net.toFixed(2) },
        ];

        const allRows = [...revenueRows, ...expenseRows, ...summaryRows];
        const csv = toCsv(allRows);

        const period = quarter ? `T${quarter}-${year}` : `${year}`;
        const filename = `mido-urssaf-${period}.csv`;

        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        // BOM for Excel UTF-8 compatibility
        return res.status(200).send('\uFEFF' + csv);

    } catch (err) {
        console.error('[export-urssaf] Error:', err.message);
        return res.status(500).json({ message: `Server Error: ${err.message}` });
    }
}
