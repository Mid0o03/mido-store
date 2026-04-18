import Stripe from 'stripe';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    if (!process.env.STRIPE_SECRET_KEY) {
        return res.status(500).json({ message: 'STRIPE_SECRET_KEY manquant.' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY.trim());

    try {
        const { clientEmail, monthlyFee, quoteId } = req.body;

        if (!clientEmail || !monthlyFee) {
            return res.status(400).json({ message: 'Email et mensualité requis.' });
        }

        // 1. Chercher le client
        const customers = await stripe.customers.list({ email: clientEmail, limit: 1 });
        if (customers.data.length === 0) {
            return res.status(404).json({ message: "Client Stripe introuvable. A-t-il payé l'acompte ?" });
        }
        const customer = customers.data[0];

        // 2. Vérifier qu'il a une méthode de paiement par défaut ou attachée
        const paymentMethods = await stripe.paymentMethods.list({ customer: customer.id, type: 'card' });
        if (paymentMethods.data.length === 0) {
            return res.status(400).json({ message: "Aucune carte bancaire enregistrée pour ce client." });
        }
        
        const paymentMethodId = paymentMethods.data[0].id;

        // Attacher cette méthode par défaut si ce n'est pas le cas
        await stripe.customers.update(customer.id, {
            invoice_settings: { default_payment_method: paymentMethodId }
        });

        // 3. Créer le produit/prix d'abonnement dynamiquement
        const amountInCents = Math.round(parseFloat(monthlyFee) * 100);
        
        // On cherche un produit existant pour éviter les doublons, ou on le crée
        const products = await stripe.products.search({ query: `metadata['quoteId']:'${quoteId}'` });
        let productId;
        
        if (products.data.length > 0) {
            productId = products.data[0].id;
        } else {
            const product = await stripe.products.create({
                name: `Abonnement - Projet Mido OS`,
                metadata: { quoteId }
            });
            productId = product.id;
        }

        const price = await stripe.prices.create({
            unit_amount: amountInCents,
            currency: 'eur',
            recurring: { interval: 'month' },
            product: productId,
        });

        // 4. Lancer l'abonnement
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: price.id }],
            metadata: { quoteId },
            expand: ['latest_invoice.payment_intent'],
        });

        return res.status(200).json({ success: true, subscriptionId: subscription.id });

    } catch (err) {
        console.error('[start-subscription] Error:', err.message);
        return res.status(500).json({ message: `Stripe Error: ${err.message}` });
    }
}
