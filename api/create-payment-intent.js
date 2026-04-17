import Stripe from 'stripe';

export default async function handler(req, res) {
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error("Critical: STRIPE_SECRET_KEY is missing from environment variables.");
        return res.status(500).json({
            statusCode: 500,
            message: "Configuration Error: STRIPE_SECRET_KEY is not defined in Vercel."
        });
    }

    // SANITIZATION: Remove whitespace and potential quotes commonly added by mistake
    const secretKey = process.env.STRIPE_SECRET_KEY.trim().replace(/^['"]|['"]$/g, '');

    const stripe = new Stripe(secretKey);

    if (req.method === 'POST') {
        try {
            const { items, amount, user_id, client_email, template_ids } = req.body;

            // In a real app, calculate amount on server based on items to avoid manipulation.
            const amountInCents = Math.round(amount * 100);

            // Create a PaymentIntent
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amountInCents,
                currency: 'eur',
                automatic_payment_methods: {
                    enabled: true,
                },
                metadata: {
                    type: 'store_purchase',
                    user_id: user_id || '',
                    template_ids: template_ids ? template_ids.join(',') : '', // store as comma separated
                    client_email: client_email || ''
                },
                receipt_email: client_email || undefined,
                description: `Achat Store Mido - ${template_ids?.length || items?.length || 0} template(s)`
            });

            res.status(200).json({
                clientSecret: paymentIntent.client_secret,
            });
        } catch (err) {
            console.error("Stripe API Error:", err.message);
            res.status(500).json({ statusCode: 500, message: `Stripe Error: ${err.message}` });
        }
    } else {
        res.setHeader('Allow', 'POST');
        res.status(405).end('Method Not Allowed');
    }
}
