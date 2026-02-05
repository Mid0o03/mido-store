import Stripe from 'stripe';

export default async function handler(req, res) {
    if (!process.env.STRIPE_SECRET_KEY) {
        console.error("Critical: STRIPE_SECRET_KEY is missing from environment variables.");
        return res.status(500).json({
            statusCode: 500,
            message: "Configuration Error: STRIPE_SECRET_KEY is not defined in Vercel."
        });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

    if (req.method === 'POST') {
        try {
            const { items, amount } = req.body;

            // In a real app, calculate amount on server based on items to avoid manipulation.
            const amountInCents = Math.round(amount * 100);

            // Create a PaymentIntent
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amountInCents,
                currency: 'eur',
                automatic_payment_methods: {
                    enabled: true,
                },
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
