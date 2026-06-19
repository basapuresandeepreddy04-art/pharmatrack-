const { pool } = require('../config/db');

// GET /api/alerts
const getAllAlerts = async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, m.name AS medicine_name, m.batch_number, m.stock_quantity, m.expiry_date
      FROM alerts a
      JOIN medicines m ON a.medicine_id = m.id
      ORDER BY a.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch alerts.' });
  }
};

// PATCH /api/alerts/:id/read
const markAlertRead = async (req, res) => {
  try {
    await pool.query('UPDATE alerts SET is_read = TRUE WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Alert marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update alert.' });
  }
};

// PATCH /api/alerts/mark-all-read
const markAllRead = async (req, res) => {
  try {
    await pool.query('UPDATE alerts SET is_read = TRUE');
    res.json({ success: true, message: 'All alerts marked as read.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update alerts.' });
  }
};

// GET /api/alerts/stats  (dashboard summary)
const getAlertStats = async (req, res) => {
  try {
    const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM medicines');
    const [[{ low_stock }]] = await pool.query(
      'SELECT COUNT(*) AS low_stock FROM medicines WHERE stock_quantity < 10'
    );
    const [[{ expiring_soon }]] = await pool.query(
      'SELECT COUNT(*) AS expiring_soon FROM medicines WHERE DATEDIFF(expiry_date, CURDATE()) BETWEEN 0 AND 30'
    );
    const [[{ total_alerts }]] = await pool.query(
      'SELECT COUNT(*) AS total_alerts FROM alerts WHERE is_read = FALSE'
    );

    res.json({
      success: true,
      data: {
        total_medicines: total,
        low_stock_medicines: low_stock,
        expiring_soon_medicines: expiring_soon,
        total_unread_alerts: total_alerts,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch stats.' });
  }
};

module.exports = { getAllAlerts, markAlertRead, markAllRead, getAlertStats };
