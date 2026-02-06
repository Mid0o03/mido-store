import { Resend } from 'resend';

export default async function handler(req, res) {
    // 1. Validate Environment
    if (!process.env.RESEND_API_KEY) {
        console.error("Critical: RESEND_API_KEY is missing.");
        return res.status(500).json({ message: "Server Misconfiguration: Missing Email Key" });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // 2. Validate Request
    if (req.method !== 'POST') {
        res.setHeader('Allow', 'POST');
        return res.status(405).end('Method Not Allowed');
    }

    try {
        const { name, email, message } = req.body;

        if (!name || !email || !message) {
            return res.status(400).json({ message: "Missing required fields (name, email, message)" });
        }

        // 3. Construct Email HTML
        const htmlContent = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
                <h2 style="color: #333;">New Contact Message 📩</h2>
                <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Name:</strong> ${name}</p>
                    <p><strong>Email:</strong> ${email}</p>
                    <p><strong>Message:</strong></p>
                    <div style="background: white; padding: 10px; border: 1px solid #eee; border-radius: 4px; white-space: pre-wrap;">${message}</div>
                </div>
                <div style="font-size: 12px; color: #888; text-align: center;">
                    Sent from Mido Website Contact Form
                </div>
            </div>
        `;

        // 4. Send Email via Resend
        const data = await resend.emails.send({
            from: 'Mido Website <contact@midodev.fr>', // Must use verified domain
            to: ['contact@midodev.fr'],
            reply_to: email, // Allow hitting "Reply" to answer the user
            subject: `[Contact] New message from ${name}`,
            html: htmlContent,
        });

        if (data.error) {
            console.error("Resend API Error:", data.error);
            return res.status(400).json({ message: "Email delivery failed", error: data.error });
        }

        return res.status(200).json({ success: true, id: data.id });

    } catch (err) {
        console.error("Server Error:", err);
        return res.status(500).json({ message: "Internal Server Error", error: err.message });
    }
}
