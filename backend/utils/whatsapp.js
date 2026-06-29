const isConfigured = () =>
  Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);

const sendWhatsAppMessage = async (to, message) => {
  if (!isConfigured()) {
    console.log('WhatsApp not configured. Message:', message);
    return { sent: false };
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
    console.log('WhatsApp sent:', data);
    return { sent: true, data };
  } catch (err) {
    console.error('WhatsApp error:', err.message);
    return { sent: false };
  }
};

const notifySaleCompleted = (sale) => {
  const ownerNumber = process.env.OWNER_WHATSAPP_NUMBER;
  const message =
    `🧾 New Sale - PharmaTrack\n` +
    `Invoice: ${sale.invoice_number}\n` +
    `Customer: ${sale.customer_name || 'Walk-in'}\n` +
    `Phone: ${sale.customer_phone || 'N/A'}\n` +
    `Total: ₹${Number(sale.total_amount).toFixed(2)}\n` +
    `Time: ${new Date().toLocaleString('en-IN')}`;
  return sendWhatsAppMessage(ownerNumber, message);
};

const notifyLowStock = (medicine) => {
  const ownerNumber = process.env.OWNER_WHATSAPP_NUMBER;
  const message =
    `⚠️ Low Stock Alert - PharmaTrack\n` +
    `Medicine: ${medicine.name}\n` +
    `Batch: ${medicine.batch_number}\n` +
    `Stock Left: ${medicine.stock_quantity} units`;
  return sendWhatsAppMessage(ownerNumber, message);
};

module.exports = { sendWhatsAppMessage, notifySaleCompleted, notifyLowStock, isConfigured };