const { Resend } = require('resend');
const resend = new Resend(process.env.RESEND_API_KEY);

const sendSaleReceiptEmail = async (sale, items = []) => {
  if (!process.env.RESEND_API_KEY) return;
  if (!sale.customer_phone) return;

  const itemRows = items.map(it => `
    <tr>
      <td style="padding:8px;border-bottom:1px solid #eee">${it.medicine.name}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${it.quantity}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${Number(it.unit_price).toFixed(2)}</td>
      <td style="padding:8px;border-bottom:1px solid #eee;text-align:right">₹${Number(it.subtotal).toFixed(2)}</td>
    </tr>
  `).join('');

  await resend.emails.send({
    from: 'PharmaTrack <onboarding@resend.dev>',
    to: sale.customer_phone,
    subject: `Receipt - Invoice ${sale.invoice_number}`,
    html: `
      <div style="font-family:sans-serif;max-width:500px;margin:auto;padding:32px">
        <h2 style="color:#028090">PharmaTrack</h2>
        <p>Invoice: <b>${sale.invoice_number}</b></p>
        <p>Customer: <b>${sale.customer_name || 'Walk-in'}</b></p>
        <table width="100%" style="border-collapse:collapse;margin-top:16px">
          <thead>
            <tr style="background:#028090;color:white">
              <th style="padding:8px;text-align:left">Item</th>
              <th style="padding:8px">Qty</th>
              <th style="padding:8px">Price</th>
              <th style="padding:8px">Total</th>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
        <h3 style="text-align:right;color:#028090">
          Total: ₹${Number(sale.total_amount).toFixed(2)}
        </h3>
        <p style="color:#999;font-size:12px">Thank you for your purchase!</p>
      </div>
    `,
  });
};

module.exports = { sendSaleReceiptEmail };