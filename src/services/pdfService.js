/**
 * MIDO Invoice PDF Service
 * Generates professional PDF invoices and quotes for Auto-entrepreneur status
 */
import { jsPDF } from 'jspdf';

// Mido Brand Constants
const BRAND = {
    name: 'Mido Dev',
    tagline: 'Développement Web & Mobile',
    email: 'contact@midodev.fr',
    website: 'www.midodev.fr',
    phone: '+33 6 XX XX XX XX', // Update with real number
    siret: 'XXX XXX XXX XXXXX',  // Update with real SIRET
    address: 'France',
    legal_mention: 'TVA non applicable, art. 293 B du CGI',
    accent: [57, 255, 20],   // #39ff14
    primary: [10, 10, 20],   // dark bg
    text: [20, 20, 30],      // near-black text
    secondary: [100, 100, 110],
};

const STATUS_COLORS = {
    paid: [57, 255, 20],
    pending: [255, 200, 50],
    overdue: [255, 80, 80],
    draft: [150, 150, 150],
};

/**
 * Format currency
 */
const formatAmount = (amount) => `${parseFloat(amount || 0).toFixed(2)} €`;

/**
 * Format date to French locale
 */
const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
        day: 'numeric', month: 'long', year: 'numeric'
    });
};

/**
 * Generate a Quote PDF
 * @param {object} quote - Quote data from Supabase
 * @param {object} client - Client data
 */
export const generateQuotePDF = (quote, client) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const pageH = 297;
    const margin = 20;
    let y = margin;

    // ─── BACKGROUND ───────────────────────────────────────────
    doc.setFillColor(10, 10, 20);
    doc.rect(0, 0, pageW, pageH, 'F');

    // Top accent bar
    doc.setFillColor(...BRAND.accent);
    doc.rect(0, 0, pageW, 3, 'F');

    // ─── HEADER ───────────────────────────────────────────────
    // Logo text
    doc.setTextColor(...BRAND.accent);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('MIDO', margin, y + 15);

    doc.setTextColor(180, 180, 200);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(BRAND.tagline, margin, y + 21);

    // Document type badge
    doc.setFillColor(30, 30, 45);
    doc.roundedRect(pageW - margin - 60, y + 5, 60, 20, 3, 3, 'F');
    doc.setTextColor(...BRAND.accent);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('DEVIS', pageW - margin - 30, y + 17, { align: 'center' });

    y += 35;

    // Quote number & date
    doc.setTextColor(100, 100, 120);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`N° ${quote.quote_number}`, pageW - margin, y, { align: 'right' });
    doc.text(`Émis le ${formatDate(quote.created_at)}`, pageW - margin, y + 5, { align: 'right' });
    doc.text(`Valable jusqu'au ${formatDate(quote.valid_until)}`, pageW - margin, y + 10, { align: 'right' });

    y += 20;

    // ─── SEPARATOR LINE ───────────────────────────────────────
    doc.setDrawColor(...BRAND.accent);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 10;

    // ─── FROM / TO ────────────────────────────────────────────
    // FROM
    doc.setTextColor(100, 100, 120);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('DE', margin, y);

    doc.setTextColor(220, 220, 240);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(BRAND.name, margin, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 160);
    doc.text(BRAND.email, margin, y + 12);
    doc.text(BRAND.website, margin, y + 17);
    doc.text(`SIRET: ${BRAND.siret}`, margin, y + 22);

    // TO
    const toX = pageW / 2 + 5;
    doc.setTextColor(100, 100, 120);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('POUR', toX, y);

    doc.setTextColor(220, 220, 240);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(client?.name || 'Client', toX, y + 6);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 160);
    doc.text(client?.email || '', toX, y + 12);
    if (client?.company) doc.text(client.company, toX, y + 17);
    if (client?.phone) doc.text(client.phone, toX, y + 22);

    y += 35;

    // ─── LINE ITEMS TABLE ─────────────────────────────────────
    const lineItems = Array.isArray(quote.line_items) ? quote.line_items : [];

    // Table header
    doc.setFillColor(25, 25, 40);
    doc.rect(margin, y, pageW - margin * 2, 10, 'F');

    doc.setTextColor(100, 100, 120);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    const cols = { desc: margin + 3, qty: 115, unit: 140, total: 168 };

    doc.text('DESCRIPTION', cols.desc, y + 7);
    doc.text('QTÉ', cols.qty, y + 7);
    doc.text('P.U.', cols.unit, y + 7);
    doc.text('TOTAL', cols.total, y + 7);
    y += 12;

    // Table rows
    lineItems.forEach((item, i) => {
        const rowH = 10;
        if (i % 2 === 0) {
            doc.setFillColor(18, 18, 30);
            doc.rect(margin, y - 2, pageW - margin * 2, rowH, 'F');
        }

        doc.setTextColor(200, 200, 220);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(String(item.description || ''), cols.desc, y + 5, { maxWidth: 70 });
        doc.text(String(item.quantity || 1), cols.qty, y + 5);
        doc.text(formatAmount(item.unit_price), cols.unit, y + 5);

        doc.setTextColor(...BRAND.accent);
        doc.setFont('helvetica', 'bold');
        doc.text(formatAmount((item.quantity || 1) * (item.unit_price || 0)), cols.total, y + 5);

        y += rowH;
    });

    y += 5;

    // ─── TOTALS BOX ───────────────────────────────────────────
    doc.setFillColor(20, 20, 35);
    doc.roundedRect(pageW - margin - 80, y, 80, 45, 3, 3, 'F');

    const totX = pageW - margin - 5;
    const labX = pageW - margin - 75;

    y += 8;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 160);
    doc.text('Sous-total HT', labX, y);
    doc.setTextColor(200, 200, 220);
    doc.text(formatAmount(quote.subtotal), totX, y, { align: 'right' });

    y += 8;
    doc.setTextColor(140, 140, 160);
    doc.text(BRAND.legal_mention.substring(0, 35), labX, y);

    y += 8;
    doc.setDrawColor(50, 50, 70);
    doc.setLineWidth(0.2);
    doc.line(totX - 75, y, totX, y);

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(220, 220, 240);
    doc.text('TOTAL TTC', labX, y);
    doc.setTextColor(...BRAND.accent);
    doc.text(formatAmount(quote.total), totX, y, { align: 'right' });

    y += 15;

    // ─── DEPOSIT BOX ──────────────────────────────────────────
    doc.setFillColor(...BRAND.accent);
    doc.roundedRect(margin, y, pageW - margin * 2, 22, 4, 4, 'F');

    doc.setTextColor(0, 0, 0);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('ACOMPTE REQUIS À LA SIGNATURE (30%)', margin + 5, y + 8);

    doc.setFontSize(16);
    doc.text(formatAmount(quote.deposit_amount), pageW - margin - 5, y + 14, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Le projet demarrera a reception de l'acompte.`, margin + 5, y + 17);


    y += 32;

    // ─── NOTES ────────────────────────────────────────────────
    if (quote.notes) {
        doc.setTextColor(100, 100, 120);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text('NOTES', margin, y);

        doc.setFont('helvetica', 'normal');
        doc.setTextColor(140, 140, 160);
        doc.setFontSize(8);
        const noteLines = doc.splitTextToSize(quote.notes, pageW - margin * 2);
        doc.text(noteLines, margin, y + 6);
        y += 6 + noteLines.length * 5;
    }

    y += 10;

    // ─── FOOTER ───────────────────────────────────────────────
    doc.setDrawColor(...BRAND.accent);
    doc.setLineWidth(0.2);
    doc.line(margin, pageH - 20, pageW - margin, pageH - 20);

    doc.setTextColor(80, 80, 100);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${BRAND.name} — ${BRAND.email} — SIRET: ${BRAND.siret}`, pageW / 2, pageH - 15, { align: 'center' });
    doc.text(BRAND.legal_mention, pageW / 2, pageH - 10, { align: 'center' });

    // ─── SAVE ─────────────────────────────────────────────────
    doc.save(`${quote.quote_number}.pdf`);
};

/**
 * Generate an Invoice PDF
 * @param {object} invoice - Invoice data from Supabase
 * @param {object} client - Client data
 * @param {object} project - Project data (optional)
 */
export const generateInvoicePDF = (invoice, client, project = null) => {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const pageW = 210;
    const pageH = 297;
    const margin = 20;
    let y = margin;

    const statusColor = STATUS_COLORS[invoice.status] || STATUS_COLORS.pending;

    // ─── BACKGROUND ───────────────────────────────────────────
    doc.setFillColor(10, 10, 20);
    doc.rect(0, 0, pageW, pageH, 'F');

    // Top accent bar (color based on status)
    doc.setFillColor(...statusColor);
    doc.rect(0, 0, pageW, 3, 'F');

    // ─── HEADER ───────────────────────────────────────────────
    doc.setTextColor(...BRAND.accent);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(28);
    doc.text('MIDO', margin, y + 15);

    doc.setTextColor(180, 180, 200);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(BRAND.tagline, margin, y + 21);

    // Invoice type badge
    const invoiceLabel = invoice.type === 'deposit' ? `FACTURE D'ACOMPTE` : 'FACTURE';
    doc.setFillColor(30, 30, 45);
    doc.roundedRect(pageW - margin - 70, y + 5, 70, 20, 3, 3, 'F');
    doc.setTextColor(...BRAND.accent);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text(invoiceLabel, pageW - margin - 35, y + 17, { align: 'center' });

    y += 35;

    // Invoice number & dates
    doc.setTextColor(100, 100, 120);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`N° ${invoice.invoice_number}`, pageW - margin, y, { align: 'right' });
    doc.text(`Date d'émission : ${formatDate(invoice.created_at)}`, pageW - margin, y + 5, { align: 'right' });
    doc.text(`Échéance : ${formatDate(invoice.due_date)}`, pageW - margin, y + 10, { align: 'right' });

    // Status badge
    doc.setFillColor(...statusColor, 30);
    doc.setDrawColor(...statusColor);
    doc.setLineWidth(0.3);
    const statusLabels = { paid: 'PAYÉE', pending: 'EN ATTENTE', overdue: 'EN RETARD', draft: 'BROUILLON' };
    const statusLabel = statusLabels[invoice.status] || 'EN ATTENTE';
    doc.roundedRect(pageW - margin - 70, y + 14, 70, 8, 2, 2, 'S');
    doc.setTextColor(...statusColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(statusLabel, pageW - margin - 35, y + 19.5, { align: 'center' });

    y += 28;

    // ─── SEPARATOR ────────────────────────────────────────────
    doc.setDrawColor(...BRAND.accent);
    doc.setLineWidth(0.3);
    doc.line(margin, y, pageW - margin, y);
    y += 10;

    // ─── FROM / TO ────────────────────────────────────────────
    doc.setTextColor(80, 80, 100);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('ÉMETTEUR', margin, y);

    doc.setTextColor(220, 220, 240);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(BRAND.name, margin, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 160);
    doc.text(BRAND.email, margin, y + 13);
    doc.text(`SIRET: ${BRAND.siret}`, margin, y + 18);

    const toX = pageW / 2 + 5;
    doc.setTextColor(80, 80, 100);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text('CLIENT', toX, y);

    doc.setTextColor(220, 220, 240);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(client?.name || 'Client', toX, y + 7);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 160);
    doc.text(client?.email || '', toX, y + 13);
    if (project?.title) doc.text(`Projet: ${project.title}`, toX, y + 18);

    y += 30;

    // ─── LINE ITEMS ───────────────────────────────────────────
    const lineItems = Array.isArray(invoice.line_items) ? invoice.line_items : [];

    doc.setFillColor(25, 25, 40);
    doc.rect(margin, y, pageW - margin * 2, 10, 'F');
    doc.setTextColor(80, 80, 100);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    const cols = { desc: margin + 3, qty: 115, unit: 140, total: 168 };
    doc.text('PRESTATION', cols.desc, y + 7);
    doc.text('QTÉ', cols.qty, y + 7);
    doc.text('P.U.', cols.unit, y + 7);
    doc.text('MONTANT', cols.total, y + 7);
    y += 12;

    lineItems.forEach((item, i) => {
        if (i % 2 === 0) {
            doc.setFillColor(18, 18, 30);
            doc.rect(margin, y - 2, pageW - margin * 2, 10, 'F');
        }
        doc.setTextColor(200, 200, 220);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.text(String(item.description || ''), cols.desc, y + 5, { maxWidth: 70 });
        doc.text(String(item.quantity || 1), cols.qty, y + 5);
        doc.text(formatAmount(item.unit_price), cols.unit, y + 5);
        doc.setTextColor(...BRAND.accent);
        doc.setFont('helvetica', 'bold');
        doc.text(formatAmount((item.quantity || 1) * (item.unit_price || 0)), cols.total, y + 5);
        y += 10;
    });

    y += 5;

    // ─── TOTAL BOX ────────────────────────────────────────────
    doc.setFillColor(20, 20, 35);
    doc.roundedRect(pageW - margin - 80, y, 80, 35, 3, 3, 'F');

    const totX = pageW - margin - 5;
    const labX = pageW - margin - 75;
    y += 7;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 140);
    doc.text('Sous-total HT', labX, y);
    doc.setTextColor(200, 200, 220);
    doc.text(formatAmount(invoice.subtotal), totX, y, { align: 'right' });

    y += 7;
    doc.setTextColor(80, 80, 100);
    doc.setFontSize(6.5);
    doc.text('TVA non applicable (293B)', labX, y);

    y += 5;
    doc.setDrawColor(50, 50, 70);
    doc.setLineWidth(0.2);
    doc.line(labX, y, totX, y);

    y += 6;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(220, 220, 240);
    doc.text('TOTAL', labX, y);
    doc.setTextColor(...BRAND.accent);
    doc.text(formatAmount(invoice.total), totX, y, { align: 'right' });

    y += 20;

    // Paid stamp if applicable
    if (invoice.status === 'paid') {
        doc.setTextColor(...STATUS_COLORS.paid, 60);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(40);
        doc.setGState(new doc.GState({ opacity: 0.15 }));
        doc.text('PAYÉE', pageW / 2, pageH / 2, { angle: -30, align: 'center' });
        doc.setGState(new doc.GState({ opacity: 1 }));
    }

    // ─── PAYMENT INFO ─────────────────────────────────────────
    if (invoice.status !== 'paid') {
        doc.setFillColor(20, 20, 35);
        doc.roundedRect(margin, y, pageW - margin * 2, 22, 3, 3, 'F');
        doc.setTextColor(100, 100, 120);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7);
        doc.text('RÈGLEMENT', margin + 5, y + 7);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 180);
        doc.text('Paiement en ligne sécurisé via votre espace client Mido', margin + 5, y + 14);
        doc.setTextColor(...BRAND.accent);
        doc.text(BRAND.website, margin + 5, y + 19);
        y += 30;
    }

    // ─── FOOTER ───────────────────────────────────────────────
    doc.setDrawColor(...BRAND.accent);
    doc.setLineWidth(0.2);
    doc.line(margin, pageH - 20, pageW - margin, pageH - 20);
    doc.setTextColor(70, 70, 90);
    doc.setFontSize(6.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`${BRAND.name} — SIRET: ${BRAND.siret} — ${BRAND.email}`, pageW / 2, pageH - 14, { align: 'center' });
    doc.text(BRAND.legal_mention, pageW / 2, pageH - 9, { align: 'center' });

    doc.save(`${invoice.invoice_number}.pdf`);
};
