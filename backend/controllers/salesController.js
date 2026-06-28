const { pool } = require('../config/db');
const { notifySaleCompleted } = require('../utils/whatsapp');
const { sendSaleReceiptEmail } = require('../utils/emailReceipt');

const checkout = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { customer_name, customer_phone, items } = req.body;
    const created_by = req.user.id;

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart is empty.' });
    }

    let total_amount = 0;
    const lineItems = [];

    // Process items and validate stock
    for (const item of items) {
      const [meds] = await connection.query(
        'SELECT * FROM medicines WHERE id = ? AND created_by = ? FOR UPDATE',
        [item.medicine_id, created_by]
      );

      if (meds.length === 0) {
        throw new Error(`Medicine ID ${item.medicine_id} not found.`);
      }

      const medicine = meds[0];
      if (medicine.stock_quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${medicine.name}. Available: ${medicine.stock_quantity}`);
      }

      const subtotal = medicine.price * item.quantity;
      total_amount += subtotal;

      lineItems.push({
        medicine_id: medicine.id,
        quantity: item.quantity,
        unit_price: medicine.price,
        subtotal,
        medicine: { name: medicine.name, batch_number: medicine.batch_number }
      });

      // Reduce stock balance
      await connection.query(
        'UPDATE medicines SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, medicine.id]
      );
    }

    // Create unique invoice number
    const invoice_number = 'INV-' + Date.now();

    // Insert sale record
    const [saleResult] = await connection.query(
      'INSERT INTO sales (invoice_number, customer_name, customer_phone, total_amount, created_by) VALUES (?, ?, ?, ?, ?)',
      [invoice_number, customer_name, customer_phone, total_amount, created_by]
    );

    const sale_id = saleResult.insertId;

    // Insert line items
    for (const line of lineItems) {
      await connection.query(
        'INSERT INTO sale_items (sale_id, medicine_id, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?)',
        [sale_id, line.medicine_id, line.quantity, line.unit_price, line.subtotal]
      );
    }

    await connection.commit();

    const completeSale = {
      id: sale_id,
      invoice_number,
      customer_name,
      customer_phone,
      total_amount,
      created_by
    };

    // Dispatch background notification handlers
    notifySaleCompleted(completeSale).catch(() => {});
    sendSaleReceiptEmail(completeSale, lineItems).catch(() => {});

    res.status(201).json({
      success: true,
      message: 'Checkout completed successfully.',
      sale: completeSale,
      items: lineItems
    });
  } catch (error) {
    await connection.rollback();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    connection.release();
  }
};

const getSales = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM sales WHERE created_by = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getSaleById = async (req, res) => {
  try {
    const [sales] = await pool.query(
      'SELECT * FROM sales WHERE id = ? AND created_by = ?',
      [req.params.id, req.user.id]
    );
    if (sales.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice record missing.' });
    }

    const [items] = await pool.query(
      `SELECT si.*, m.name, m.batch_number 
       FROM sale_items si 
       JOIN medicines m ON si.medicine_id = m.id 
       WHERE si.sale_id = ?`,
      [req.params.id]
    );

    res.json({ sale: sales[0], items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { checkout, getSales, getSaleById };