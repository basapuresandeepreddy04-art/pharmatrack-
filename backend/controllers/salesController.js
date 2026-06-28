const { sendSaleReceiptEmail } = require('../utils/emailReceipt');
const { pool } = require('../config/db');
const { syncAlerts } = require('./medicineController');
const { notifySaleCompleted } = require('../utils/whatsapp');

const generateInvoiceNumber = () => {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randPart = Math.floor(1000 + Math.random() * 9000);
  return `INV-${datePart}-${randPart}`;
};

// POST /api/sales  — create a new sale (checkout)
const createSale = async (req, res) => {
  const { customer_name, customer_phone, items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one item is required to complete a sale.' });
  }
  for (const it of items) {
    if (!it.medicine_id || !it.quantity || Number(it.quantity) <= 0) {
      return res.status(400).json({ success: false, message: 'Each item needs a valid medicine_id and a quantity greater than 0.' });
    }
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    const lineItems = [];
    let totalAmount = 0;

    // Lock and validate every medicine row before writing anything
    for (const it of items) {
      const [rows] = await conn.query(
        'SELECT id, name, batch_number, stock_quantity, price FROM medicines WHERE id = ? FOR UPDATE',
        [it.medicine_id]
      );
      if (rows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ success: false, message: `Medicine #${it.medicine_id} not found.` });
      }
      const med = rows[0];
      const qty = Number(it.quantity);
      if (med.stock_quantity < qty) {
        await conn.rollback();
        return res.status(400).json({
          success: false,
          message: `Not enough stock for "${med.name}". Available: ${med.stock_quantity}, requested: ${qty}.`,
        });
      }
      const subtotal = Number(med.price) * qty;
      totalAmount += subtotal;
      lineItems.push({ medicine: med, quantity: qty, unit_price: Number(med.price), subtotal });
    }

    const invoiceNumber = generateInvoiceNumber();
    const [saleResult] = await conn.query(
      'INSERT INTO sales (invoice_number, customer_name, customer_phone, total_amount, created_by) VALUES (?, ?, ?, ?, ?)',
      [invoiceNumber, customer_name?.trim() || null, customer_phone?.trim() || null, totalAmount, req.user.id]
    );
    const saleId = saleResult.insertId;

    const affectedMedicines = [];
    for (const li of lineItems) {
      await conn.query(
        'INSERT INTO sale_items (sale_id, medicine_id, medicine_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        [saleId, li.medicine.id, li.medicine.name, li.quantity, li.unit_price, li.subtotal]
      );
      const newStock = li.medicine.stock_quantity - li.quantity;
      await conn.query('UPDATE medicines SET stock_quantity = ? WHERE id = ?', [newStock, li.medicine.id]);
      affectedMedicines.push({ id: li.medicine.id, name: li.medicine.name, batch_number: li.medicine.batch_number, stock_quantity: newStock });
    }

    await conn.commit();

    // Re-sync low-stock/expiry alerts for every medicine touched by this sale.
    // Done after commit so it never risks rolling back a completed sale.
    for (const m of affectedMedicines) {
      const [fresh] = await pool.query('SELECT id, name, stock_quantity, expiry_date FROM medicines WHERE id = ?', [m.id]);
      if (fresh.length) await syncAlerts(fresh[0]).catch(() => {});
    }

    const [saleRows] = await pool.query('SELECT * FROM sales WHERE id = ?', [saleId]);
    const sale = saleRows[0];

    // Fire-and-forget WhatsApp notification — never blocks or fails the response.
    notifySaleCompleted(sale).catch(() => {});
    sendSaleReceiptEmail(sale, lineItems).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Sale completed successfully.',
      data: { ...sale, items: lineItems.map((li) => ({
        medicine_id: li.medicine.id,
        medicine_name: li.medicine.name,
        quantity: li.quantity,
        unit_price: li.unit_price,
        subtotal: li.subtotal,
      })) },
    });
  } catch (err) {
    await conn.rollback();
    console.error('Create sale error:', err);
    res.status(500).json({ success: false, message: 'Failed to complete sale.' });
  } finally {
    conn.release();
  }
};

// GET /api/sales — list sales (most recent first), optional ?search= on invoice/customer
const getAllSales = async (req, res) => {
  const { search } = req.query;
  try {
    let query = 'SELECT * FROM sales';
    const params = [];
    if (search) {
      query += ' WHERE invoice_number LIKE ? OR customer_name LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }
    query += ' ORDER BY created_at DESC LIMIT 200';
    const [rows] = await pool.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Get sales error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch sales.' });
  }
};

// GET /api/sales/:id — full invoice with line items
const getSaleById = async (req, res) => {
  try {
    const [saleRows] = await pool.query('SELECT * FROM sales WHERE id = ?', [req.params.id]);
    if (saleRows.length === 0) return res.status(404).json({ success: false, message: 'Sale not found.' });

    const [items] = await pool.query('SELECT * FROM sale_items WHERE sale_id = ?', [req.params.id]);
    res.json({ success: true, data: { ...saleRows[0], items } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch sale.' });
  }
};

module.exports = { createSale, getAllSales, getSaleById };
