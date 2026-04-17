import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

// Vercel raw body config required for Stripe webhooks
export const config = {
    api: {
        bodyParser: false,
    },
};

const buffer = (req) => {
    return new Promise((resolve, reject) => {
        const chunks = [];
        req.on('data', (chunk) => chunks.push(chunk));
        req.on('end', () => resolve(Buffer.concat(chunks)));
        req.on('error', reject);
    });
};

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    const secretKey = process.env.STRIPE_SECRET_KEY ? process.env.STRIPE_SECRET_KEY.trim() : null;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET ? process.env.STRIPE_WEBHOOK_SECRET.trim() : null;

    if (!secretKey) {
        return res.status(500).json({ message: "Configuration Error: STRIPE_SECRET_KEY is not defined in Vercel." });
    }

    const stripe = new Stripe(secretKey);
    const buf = await buffer(req);

    // If STRIPE_WEBHOOK_SECRET is set, verify the signature. 
    // If not, allow processing for development only if strict checking is disabled, but usually it's required.
    let event;
    if (endpointSecret) {
        const sig = req.headers['stripe-signature'];
        try {
            event = stripe.webhooks.constructEvent(buf.toString(), sig, endpointSecret);
        } catch (err) {
            console.error(`⚠️ Webhook signature verification failed: ${err.message}`);
            return res.status(400).send(`Webhook Error: ${err.message}`);
        }
    } else {
        // Fallback for local testing without signature (not recommended for production)
        console.warn("⚠️ STRIPE_WEBHOOK_SECRET is missing. Proceeding without signature verification (dev mode).");
        event = JSON.parse(buf.toString());
    }

    if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object;
        const metadata = paymentIntent.metadata;

        console.log(`💰 PaymentIntent succeeded: ${paymentIntent.id}`);

        const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
        const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        let supabase = null;
        if (supabaseUrl && supabaseServiceKey) {
            supabase = createClient(supabaseUrl, supabaseServiceKey);
        } else {
            console.error("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in webhook.");
        }

        if (metadata && supabase) {
            // SCENARIO 1: ACHAT VÍA STORE
            if (metadata.type === 'store_purchase') {
                const userId = metadata.user_id;
                const templateIdsString = metadata.template_ids;
                const clientEmail = metadata.client_email;

                if (userId && templateIdsString) {
                    const templateIds = templateIdsString.split(',');
                    const purchasesToInsert = templateIds.map(tempId => ({
                        user_id: userId,
                        template_id: parseInt(tempId, 10),
                        purchased_at: new Date().toISOString()
                    }));

                    // Insérer dans Supabase
                    const { error } = await supabase.from('purchases').insert(purchasesToInsert);
                    
                    if (error) {
                        console.error("❌ Erreur d'insertion dans purchases:", error);
                    } else {
                        console.log(`✅ Store: Achats insérés pour l'utilisateur: ${userId} (${templateIds.length} items)`);
                        
                        // Déclencher l'email via la route API locale
                        if (clientEmail) {
                            try {
                                await fetch(`https://${req.headers.host || process.env.VERCEL_URL || 'localhost:5173'}/api/send-automation-email`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        to: clientEmail,
                                        type: 'store_purchase',
                                        data: { template_ids: templateIdsString }
                                    })
                                });
                            } catch (e) {
                                console.error("❌ Failed to trigger email via /api/send-automation-email", e.message);
                            }
                        }
                    }
                }
            }

            // SCENARIO 2: PAIEMENT DEVIS (ACOMPTE 30%)
            else if (metadata.type === 'deposit_30_percent') {
                const quoteId = metadata.quote_id;
                const clientEmail = metadata.client_email;
                if (quoteId) {
                    const { error } = await supabase.from('invoices').update({ status: 'paid' }).eq('id', quoteId);
                    
                    if (error) {
                        console.error("❌ Erreur update invoice:", error);
                    } else {
                        console.log(`✅ Facture/Devis mis à jour en payé: ${quoteId}`);
                        
                        if (clientEmail) {
                            try {
                                await fetch(`https://${req.headers.host || process.env.VERCEL_URL || 'localhost:5173'}/api/send-automation-email`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                        to: clientEmail,
                                        type: 'deposit_paid',
                                        data: { quote_id: quoteId, quote_number: metadata.quote_number }
                                    })
                                });
                            } catch (e) {
                                console.error("❌ Failed to trigger email via /api/send-automation-email", e.message);
                            }
                        }
                    }
                }
            }
        }
    }

    res.json({ received: true });
}
