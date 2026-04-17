/**
 * Push Notifications Service for Mido Freelance OS
 * Handles permission request, subscription, and dispatching
 */

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || null;

/**
 * Request notification permission from the browser
 * @returns {Promise<boolean>} true if granted
 */
export const requestNotificationPermission = async () => {
    if (!('Notification' in window)) {
        console.warn('This browser does not support notifications.');
        return false;
    }

    if (Notification.permission === 'granted') return true;

    const permission = await Notification.requestPermission();
    return permission === 'granted';
};

/**
 * Check current notification permission status
 */
export const getNotificationPermission = () => {
    if (!('Notification' in window)) return 'unsupported';
    return Notification.permission; // 'default', 'granted', 'denied'
};

/**
 * Send a browser notification (works even when tab is in background)
 * @param {string} title
 * @param {string} body
 * @param {object} options
 */
export const sendLocalNotification = (title, body, options = {}) => {
    if (Notification.permission !== 'granted') return;

    const notification = new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: options.tag || 'mido-notification',
        requireInteraction: options.requireInteraction || false,
        data: { url: options.url || '/' },
        ...options
    });

    notification.onclick = (e) => {
        e.preventDefault();
        window.focus();
        if (e.target?.data?.url) {
            window.location.href = e.target.data.url;
        }
        notification.close();
    };

    return notification;
};

/**
 * Notify admin of a new client message
 */
export const notifyNewMessage = (clientName, projectTitle) => {
    return sendLocalNotification(
        `Nouveau message — ${projectTitle}`,
        `${clientName} vous a envoyé un message.`,
        {
            tag: 'new-message',
            requireInteraction: true,
            url: '/admin?tab=crm'
        }
    );
};

/**
 * Notify admin of a quote signed
 */
export const notifyQuoteSigned = (clientName, quoteNumber) => {
    return sendLocalNotification(
        `Devis signé ! 🎉`,
        `${clientName} a signé et payé l'acompte sur le ${quoteNumber}.`,
        {
            tag: 'quote-signed',
            requireInteraction: true,
            url: '/admin?tab=finance'
        }
    );
};

/**
 * Notify admin of an invoice paid
 */
export const notifyInvoicePaid = (clientName, invoiceNumber, amount) => {
    return sendLocalNotification(
        `Paiement reçu — ${amount}€ 💶`,
        `${clientName} a payé la facture ${invoiceNumber}.`,
        {
            tag: 'invoice-paid',
            requireInteraction: true,
            url: '/admin?tab=finance'
        }
    );
};

/**
 * Initialize notifications on app load — auto-ask permission
 * Call this once in App.jsx or AdminPage
 */
export const initNotifications = async () => {
    const permission = getNotificationPermission();
    if (permission === 'default') {
        // Wait a bit before asking to not be intrusive
        setTimeout(async () => {
            await requestNotificationPermission();
        }, 3000);
    }
    return permission;
};
