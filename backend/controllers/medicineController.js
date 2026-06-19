const { pool } = require('../config/db');

// Helper: auto-generate alerts for a medicine
const syncAlerts = async (medicine) => {
  const { id, stock_quantity, expiry_date, name } = medicine;

  // Remove old alerts for this medicine
  await pool.query('DELETE FROM alerts WHERE medicine_id = ?', [id]);

  const today = new Date();
  const expiry = new Date(expiry_date);
  const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

  if (stock_quantity < 10) {
    await pool.query(
      'INSERT INTO alerts (medicine_id, alert_type, message) VALUES (?, ?, ?)',
      [id, 'low_stock', `Low stock alert: "${name}" has only ${stock_quantity} unit(s) remaining.`]
    );
  }

  if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
    await pool.query(
      'INSERT INTO alerts (medicine_id, alert_type, message) VALUES (?, ?, ?)',
      [id, 'expiry', `Expiry alert: "${name}" expires in ${daysUntilExpiry} day(s) (${expiry_date}).`]
    );
  } else if (daysUntilExpiry <= 0) {
    await pool.query(
      'INSERT INTO alerts (medicine_id, alert_type, message) VALUES (?, ?, ?)',
      [id, 'expiry', `Expired: "${name}" expired on ${expiry_date}.`]
    );
  }
};

// GET /api/medicines
const getAllMedicines = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.*, u.name AS created_by_name,
        DATEDIFF(m.expiry_date, CURDATE()) AS days_until_expiry
      FROM medicines m
      LEFT JOIN users u ON m.created_by = u.id
      ORDER BY m.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('Get medicines error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch medicines.' });
  }
};

// GET /api/medicines/:id
const getMedicineById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT m.*, DATEDIFF(m.expiry_date, CURDATE()) AS days_until_expiry
       FROM medicines m WHERE m.id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Medicine not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch medicine.' });
  }
};

// POST /api/medicines
const createMedicine = async (req, res) => {
  const { name, batch_number, stock_quantity, price, expiry_date } = req.body;

  if (!name || !batch_number || stock_quantity === undefined || !expiry_date) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  if (isNaN(stock_quantity) || Number(stock_quantity) < 0) {
    return res.status(400).json({ success: false, message: 'Stock quantity must be a non-negative number.' });
  }
  if (price !== undefined && (isNaN(price) || Number(price) < 0)) {
    return res.status(400).json({ success: false, message: 'Price must be a non-negative number.' });
  }

  try {
    const [result] = await pool.query(
      'INSERT INTO medicines (name, batch_number, stock_quantity, price, expiry_date, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), batch_number.trim(), Number(stock_quantity), Number(price) || 0, expiry_date, req.user.id]
    );

    const medicine = { id: result.insertId, name, stock_quantity: Number(stock_quantity), expiry_date };
    await syncAlerts(medicine);

    const [newMed] = await pool.query(
      'SELECT *, DATEDIFF(expiry_date, CURDATE()) AS days_until_expiry FROM medicines WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ success: true, message: 'Medicine added successfully.', data: newMed[0] });
  } catch (err) {
    console.error('Create medicine error:', err);
    res.status(500).json({ success: false, message: 'Failed to add medicine.' });
  }
};

// PUT /api/medicines/:id
const updateMedicine = async (req, res) => {
  const { name, batch_number, stock_quantity, price, expiry_date } = req.body;
  const { id } = req.params;

  if (!name || !batch_number || stock_quantity === undefined || !expiry_date) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }

  try {
    const [existing] = await pool.query('SELECT id FROM medicines WHERE id = ?', [id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Medicine not found.' });

    await pool.query(
      'UPDATE medicines SET name = ?, batch_number = ?, stock_quantity = ?, price = ?, expiry_date = ? WHERE id = ?',
      [name.trim(), batch_number.trim(), Number(stock_quantity), Number(price) || 0, expiry_date, id]
    );

    await syncAlerts({ id: Number(id), name, stock_quantity: Number(stock_quantity), expiry_date });

    const [updated] = await pool.query(
      'SELECT *, DATEDIFF(expiry_date, CURDATE()) AS days_until_expiry FROM medicines WHERE id = ?',
      [id]
    );

    res.json({ success: true, message: 'Medicine updated successfully.', data: updated[0] });
  } catch (err) {
    console.error('Update medicine error:', err);
    res.status(500).json({ success: false, message: 'Failed to update medicine.' });
  }
};

// DELETE /api/medicines/:id
const deleteMedicine = async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id, name FROM medicines WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Medicine not found.' });

    await pool.query('DELETE FROM medicines WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: `"${existing[0].name}" deleted successfully.` });
  } catch (err) {
    console.error('Delete medicine error:', err);
    res.status(500).json({ success: false, message: 'Failed to delete medicine.' });
  }
};

module.exports = { getAllMedicines, getMedicineById, createMedicine, updateMedicine, deleteMedicine, syncAlerts };
