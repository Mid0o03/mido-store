import { Resend } from 'resend';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const { to, type, data } = req.body;

    if (!process.env.RESEND_API_KEY) {
        return res.status(500).json({ error: 'Configuration Error: RESEND_API_KEY is missing.' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    
    // Fallback email from VITE_ADMIN_EMAILS if we want to notify admins
    const adminEmails = process.env.VITE_ADMIN_EMAILS ? process.env.VITE_ADMIN_EMAILS.split(',') : ['admin@mido.com'];

    try {
        let subject = '';
        let htmlBody = '';
        let recipient = to;

        // Route routing based on type
        switch (type) {
            case 'store_purchase':
                subject = 'Confirmation de votre achat - Mido Store';
                htmlBody = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
                        <h2 style="color: #000;">Merci pour votre achat ! 🎉</h2>
                        <p>Bonjour,</p>
                        <p>Nous avons bien reçu votre paiement pour l'achat de vos templates de site web.</p>
                        <p>Vous pouvez dès à présent les retrouver dans votre <strong>Espace Client Mido</strong>, section "Mes Achats", et les télécharger immédiatement.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://mido-store.vercel.app/client-portal" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Accéder à mes achats</a>
                        </div>
                        <p>Si vous avez la moindre question, n'hésitez pas à répondre directement à cet e-mail.</p>
                        <p>L'équipe Mido Dev</p>
                    </div>
                `;
                
                // Alert Admins in parallel!
                await resend.emails.send({
                    from: 'Mido Store Alerts <onboarding@resend.dev>',
                    to: adminEmails,
                    subject: '💰 Nouvelle Vente sur le Store !',
                    html: `<p>Félicitations, un nouvel achat vient d'être effectué par ${to}. Connecte-toi à Mido OS pour voir ça !</p>`
                });
                break;

            case 'deposit_paid':
                subject = `Acompte Reçu - Projet ${data?.quote_number || ''}`;
                htmlBody = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
                        <h2 style="color: #000;">Paiement bien reçu</h2>
                        <p>Bonjour,</p>
                        <p>Nous vous confirmons la bonne réception de l'acompte correspondant au devis <strong>${data?.quote_number || ''}</strong>.</p>
                        <p>Le projet est officiellement lancé ! Vous pouvez suivre l'avancement des tâches et de la production directement sur votre portail client.</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://mido-store.vercel.app/client-portal" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Accéder à mon portail</a>
                        </div>
                        <p>Merci pour votre confiance,</p>
                        <p>Maël - Mido Dev</p>
                    </div>
                `;
                break;

            case 'crm_notification':
                subject = 'Nouveau document ajouté à votre projet';
                htmlBody = `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
                        <h2 style="color: #000;">Mise à jour de votre projet</h2>
                        <p>Bonjour,</p>
                        <p>L'agence Mido Web vient d'ajouter une nouvelle notification ou un document (Facture, Maquette, Fichier) à votre Espace Client.</p>
                        <p>Message: <em>"${data?.message || 'Nouvel élément disponible.'}"</em></p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="https://mido-store.vercel.app/client-portal" style="background-color: #000; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold;">Voir mon espace</a>
                        </div>
                        <p>À bientôt !</p>
                    </div>
                `;
                break;

            default:
                return res.status(400).json({ error: 'Type de notification inconnu.' });
        }

        const dataResend = await resend.emails.send({
            from: 'Mido Dev <onboarding@resend.dev>', // Change this once you have a real domain verified in Resend (e.g. contact@midodev.fr)
            to: [recipient],
            subject: subject,
            html: htmlBody
        });

        res.status(200).json({ success: true, data: dataResend });
    } catch (error) {
        console.error("Resend Email Error:", error);
        res.status(500).json({ error: error.message });
    }
}
