// ============================================================
//  WhatsApp notifier — Meta WhatsApp Cloud API
// ============================================================
//  IMPORTANT (read before assuming this "just works"):
//  This wraps the official Meta WhatsApp Cloud API. It will only
//  actually send a message once you provide YOUR OWN credentials
//  from a Meta for Developers account:
//    WHATSAPP_TOKEN            - permanent or temporary access token
//    WHATSAPP_PHONE_NUMBER_ID  - the sender number's ID from Meta
//    OWNER_WHATSAPP_NUMBER     - recipient, E.164 format e.g. 919100491753
//
//  No code can make WhatsApp messages send without those values —
//  that requires creating an app at developers.facebook.com,
//  adding the WhatsApp product, and verifying a sender number.
//
//  Until those env vars are set, this module safely no-ops and
//  logs to the console instead of sending, so the rest of the
//  app (sales, alerts) keeps working without crashing.
// ============================================================

const isConfigured = () =>
  Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);

/**
 * Send a WhatsApp text message to the configured owner number.
 * Always resolves — never throws — so a notification failure
 * never breaks a sale or alert flow.
 */
const sendWhatsAppMessage = async (message) => {
  const to = process.env.OWNER_WHATSAPP_NUMBER;

  if (!isConfigured() || !to) {
    console.log('📵 [WhatsApp] Not configured — would have sent:', message);
    return { sent: false, reason: 'not_configured' };
  }

  try {
    const url = `https://graph.facebook.com/v19.0/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body: message },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ [WhatsApp] API error:', data);
      return { sent: false, reason: 'api_error', data };
    }

    console.log('✅ [WhatsApp] Message sent to', to);
    return { sent: true, data };
  } catch (err) {
    console.error('❌ [WhatsApp] Send failed:', err.message);
    return { sent: false, reason: 'network_error' };
  }
};

const notifySaleCompleted = (sale) => {
  const message =
    `🧾 New sale recorded\n` +
    `Invoice: ${sale.invoice_number}\n` +
    `Customer: ${sale.customer_name || 'Walk-in'}\n` +
    `Total: ₹${Number(sale.total_amount).toFixed(2)}\n` +
    `Time: ${new Date().toLocaleString('en-IN')}`;
  return sendWhatsAppMessage(message);
};

const notifyLowStock = (medicine) => {
  const message =
    `⚠️ Low stock alert\n` +
    `"${medicine.name}" has only ${medicine.stock_quantity} unit(s) left.\n` +
    `Batch: ${medicine.batch_number}`;
  return sendWhatsAppMessage(message);
};

module.exports = { sendWhatsAppMessage, notifySaleCompleted, notifyLowStock, isConfigured };
