/**
 * /api/create-deposit-intent.js
 * Creates a Stripe PaymentIntent for the 30% deposit on a freelance quote.
 * Expects: { quoteId, amount, clientEmail, quoteNumber }
 */
import Stripe from 'stripe';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ message: 'Configuration Error: STRIPE_SECRET_KEY manquant.' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY.trim());

    try {
        const { quoteId, amount, clientEmail, quoteNumber } = req.body;

        if (!quoteId || !amount || amount <= 0) {
            return res.status(400).json({ message: 'Paramètres invalides (quoteId, amount requis).' });
        }

        const amountInCents = Math.round(parseFloat(amount) * 100);

        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: 'eur',
            automatic_payment_methods: { enabled: true },
            metadata: {
                quote_id: quoteId,
                quote_number: quoteNumber || '',
                client_email: clientEmail || '',
                type: 'deposit_30_percent',
            },
            description: `Acompte 30% — ${quoteNumber || quoteId}`,
            receipt_email: clientEmail || undefined,
        });

        return res.status(200).json({ clientSecret: paymentIntent.client_secret });

    } catch (err) {
        console.error('[create-deposit-intent] Error:', err.message);
        return res.status(500).json({ message: `Stripe Error: ${err.message}` });
    }
}
