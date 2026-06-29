const { pool } = require('../config/db');

const getDashboardStats = async (req, res) => {
  const uid = req.user.id;
  try {
    const [[{ total_medicines }]] = await pool.query('SELECT COUNT(*) AS total_medicines FROM medicines WHERE created_by = ?', [uid]);
    const [[{ low_stock_medicines }]] = await pool.query('SELECT COUNT(*) AS low_stock_medicines FROM medicines WHERE created_by = ? AND stock_quantity < 10', [uid]);
    const [[{ expiring_soon_medicines }]] = await pool.query('SELECT COUNT(*) AS expiring_soon_medicines FROM medicines WHERE created_by = ? AND DATEDIFF(expiry_date, CURDATE()) BETWEEN 0 AND 30', [uid]);
    const [[{ total_unread_alerts }]] = await pool.query(`SELECT COUNT(*) AS total_unread_alerts FROM alerts a JOIN medicines m ON a.medicine_id = m.id WHERE m.created_by = ? AND a.is_read = FALSE`, [uid]);
    const [[{ revenue_today }]] = await pool.query('SELECT COALESCE(SUM(total_amount),0) AS revenue_today FROM sales WHERE created_by = ? AND DATE(created_at) = CURDATE()', [uid]);
    const [[{ invoices_today }]] = await pool.query('SELECT COUNT(*) AS invoices_today FROM sales WHERE created_by = ? AND DATE(created_at) = CURDATE()', [uid]);
    const [[{ revenue_month }]] = await pool.query('SELECT COALESCE(SUM(total_amount),0) AS revenue_month FROM sales WHERE created_by = ? AND MONTH(created_at)=MONTH(CURDATE()) AND YEAR(created_at)=YEAR(CURDATE())', [uid]);
    const [[{ revenue_total }]] = await pool.query('SELECT COALESCE(SUM(total_amount),0) AS revenue_total FROM sales WHERE created_by = ?', [uid]);
    const [[{ invoices_total }]] = await pool.query('SELECT COUNT(*) AS invoices_total FROM sales WHERE created_by = ?', [uid]);
    const [topSelling] = await pool.query(`SELECT si.medicine_name, SUM(si.quantity) AS units_sold, SUM(si.subtotal) AS revenue FROM sale_items si JOIN sales s ON si.sale_id = s.id WHERE s.created_by = ? GROUP BY si.medicine_name ORDER BY units_sold DESC LIMIT 5`, [uid]);
    const [recentSales] = await pool.query('SELECT id, invoice_number, customer_name, total_amount, created_at FROM sales WHERE created_by = ? ORDER BY created_at DESC LIMIT 5', [uid]);
    res.json({
      success: true,
      data: {
        total_medicines, low_stock_medicines, expiring_soon_medicines, total_unread_alerts,
        revenue_today: Number(revenue_today), invoices_today,
        revenue_month: Number(revenue_month), revenue_total: Number(revenue_total),
        invoices_total, top_selling: topSelling, recent_sales: recentSales,
      },
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats.' });
  }
};

module.exports = { getDashboardStats };