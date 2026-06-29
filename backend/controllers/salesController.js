const { pool } = require('../config/db');
const { syncAlerts } = require('./medicineController');
const { notifySaleCompleted } = require('../utils/whatsapp');

const generateInvoiceNumber = () => {
  const now = new Date();
  const datePart = now.toISOString().slice(0, 10).replace(/-/g, '');
  const randPart = Math.floor(1000 + Math.random() * 9000);
  return `INV-${datePart}-${randPart}`;
};

const createSale = async (req, res) => {
  const { customer_name, customer_phone, items } = req.body;
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, message: 'At least one item is required.' });
  }
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const lineItems = [];
    let totalAmount = 0;
    for (const it of items) {
      const [rows] = await conn.query(
        'SELECT id, name, batch_number, stock_quantity, price FROM medicines WHERE id = ? AND created_by = ? FOR UPDATE',
        [it.medicine_id, req.user.id]
      );
      if (rows.length === 0) { await conn.rollback(); return res.status(404).json({ success: false, message: `Medicine not found.` }); }
      const med = rows[0];
      const qty = Number(it.quantity);
      if (med.stock_quantity < qty) { await conn.rollback(); return res.status(400).json({ success: false, message: `Not enough stock for "${med.name}".` }); }
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
    for (const li of lineItems) {
      await conn.query(
        'INSERT INTO sale_items (sale_id, medicine_id, medicine_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        [saleId, li.medicine.id, li.medicine.name, li.quantity, li.unit_price, li.subtotal]
      );
      await conn.query('UPDATE medicines SET stock_quantity = stock_quantity - ? WHERE id = ?', [li.quantity, li.medicine.id]);
    }
    await conn.commit();
    for (const li of lineItems) {
      const [fresh] = await pool.query('SELECT id, name, stock_quantity, expiry_date FROM medicines WHERE id = ?', [li.medicine.id]);
      if (fresh.length) await syncAlerts(fresh[0]).catch(() => {});
    }
    const [saleRows] = await pool.query('SELECT * FROM sales WHERE id = ?', [saleId]);
    const sale = saleRows[0];
    notifySaleCompleted(sale).catch(() => {});
    res.status(201).json({
      success: true,
      message: 'Sale completed successfully.',
      data: { ...sale, items: lineItems.map((li) => ({
        medicine_id: li.medicine.id,
        medicine_name: li.medicine.name,
        batch_number: li.medicine.batch_number,
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

const getAllSales = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM sales WHERE created_by = ? ORDER BY created_at DESC LIMIT 200', [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch sales.' });
  }
};

const getSaleById = async (req, res) => {
  try {
    const [saleRows] = await pool.query('SELECT * FROM sales WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (saleRows.length === 0) return res.status(404).json({ success: false, message: 'Sale not found.' });
    const [items] = await pool.query('SELECT * FROM sale_items WHERE sale_id = ?', [req.params.id]);
    res.json({ success: true, data: { ...saleRows[0], items } });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch sale.' });
  }
};

module.exports = { createSale, getAllSales, getSaleById };