const { pool } = require('../config/db');

const syncAlerts = async (medicine) => {
  const { id, stock_quantity, expiry_date, name } = medicine;
  await pool.query('DELETE FROM alerts WHERE medicine_id = ?', [id]);
  const today = new Date();
  const expiry = new Date(expiry_date);
  const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
  if (stock_quantity < 10) {
    await pool.query('INSERT INTO alerts (medicine_id, alert_type, message) VALUES (?, ?, ?)',
      [id, 'low_stock', `Low stock alert: "${name}" has only ${stock_quantity} unit(s) remaining.`]);
  }
  if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
    await pool.query('INSERT INTO alerts (medicine_id, alert_type, message) VALUES (?, ?, ?)',
      [id, 'expiry', `Expiry alert: "${name}" expires in ${daysUntilExpiry} day(s).`]);
  } else if (daysUntilExpiry <= 0) {
    await pool.query('INSERT INTO alerts (medicine_id, alert_type, message) VALUES (?, ?, ?)',
      [id, 'expiry', `Expired: "${name}" expired on ${expiry_date}.`]);
  }
};

const getAllMedicines = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.*, DATEDIFF(m.expiry_date, CURDATE()) AS days_until_expiry
      FROM medicines m
      WHERE m.created_by = ?
      ORDER BY m.created_at DESC
    `, [req.user.id]);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch medicines.' });
  }
};

const getMedicineById = async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT *, DATEDIFF(expiry_date, CURDATE()) AS days_until_expiry FROM medicines WHERE id = ? AND created_by = ?',
      [req.params.id, req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Medicine not found.' });
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch medicine.' });
  }
};

const createMedicine = async (req, res) => {
  const { name, batch_number, stock_quantity, price, expiry_date } = req.body;
  if (!name || !batch_number || stock_quantity === undefined || !expiry_date) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  try {
    const [result] = await pool.query(
      'INSERT INTO medicines (name, batch_number, stock_quantity, price, expiry_date, created_by) VALUES (?, ?, ?, ?, ?, ?)',
      [name.trim(), batch_number.trim(), Number(stock_quantity), Number(price) || 0, expiry_date, req.user.id]
    );
    await syncAlerts({ id: result.insertId, name, stock_quantity: Number(stock_quantity), expiry_date });
    const [newMed] = await pool.query('SELECT *, DATEDIFF(expiry_date, CURDATE()) AS days_until_expiry FROM medicines WHERE id = ?', [result.insertId]);
    res.status(201).json({ success: true, message: 'Medicine added successfully.', data: newMed[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to add medicine.' });
  }
};

const updateMedicine = async (req, res) => {
  const { name, batch_number, stock_quantity, price, expiry_date } = req.body;
  const { id } = req.params;
  if (!name || !batch_number || stock_quantity === undefined || !expiry_date) {
    return res.status(400).json({ success: false, message: 'All fields are required.' });
  }
  try {
    const [existing] = await pool.query('SELECT id FROM medicines WHERE id = ? AND created_by = ?', [id, req.user.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Medicine not found.' });
    await pool.query(
      'UPDATE medicines SET name = ?, batch_number = ?, stock_quantity = ?, price = ?, expiry_date = ? WHERE id = ? AND created_by = ?',
      [name.trim(), batch_number.trim(), Number(stock_quantity), Number(price) || 0, expiry_date, id, req.user.id]
    );
    await syncAlerts({ id: Number(id), name, stock_quantity: Number(stock_quantity), expiry_date });
    const [updated] = await pool.query('SELECT *, DATEDIFF(expiry_date, CURDATE()) AS days_until_expiry FROM medicines WHERE id = ?', [id]);
    res.json({ success: true, message: 'Medicine updated successfully.', data: updated[0] });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update medicine.' });
  }
};

const deleteMedicine = async (req, res) => {
  try {
    const [existing] = await pool.query('SELECT id, name FROM medicines WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    if (existing.length === 0) return res.status(404).json({ success: false, message: 'Medicine not found.' });
    await pool.query('DELETE FROM medicines WHERE id = ? AND created_by = ?', [req.params.id, req.user.id]);
    res.json({ success: true, message: `"${existing[0].name}" deleted successfully.` });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete medicine.' });
  }
};

module.exports = { getAllMedicines, getMedicineById, createMedicine, updateMedicine, deleteMedicine, syncAlerts };