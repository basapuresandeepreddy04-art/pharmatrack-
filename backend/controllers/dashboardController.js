const { pool } = require('../config/db');

// GET /api/dashboard/stats
const getDashboardStats = async (req, res) => {
  try {
    const [[{ total_medicines }]] = await pool.query('SELECT COUNT(*) AS total_medicines FROM medicines');
    const [[{ low_stock_medicines }]] = await pool.query(
      'SELECT COUNT(*) AS low_stock_medicines FROM medicines WHERE stock_quantity < 10'
    );
    const [[{ expiring_soon_medicines }]] = await pool.query(
      'SELECT COUNT(*) AS expiring_soon_medicines FROM medicines WHERE DATEDIFF(expiry_date, CURDATE()) BETWEEN 0 AND 30'
    );
    const [[{ total_unread_alerts }]] = await pool.query(
      'SELECT COUNT(*) AS total_unread_alerts FROM alerts WHERE is_read = FALSE'
    );

    const [[{ revenue_today }]] = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS revenue_today FROM sales WHERE DATE(created_at) = CURDATE()`
    );
    const [[{ invoices_today }]] = await pool.query(
      `SELECT COUNT(*) AS invoices_today FROM sales WHERE DATE(created_at) = CURDATE()`
    );
    const [[{ revenue_month }]] = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS revenue_month FROM sales
       WHERE MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())`
    );
    const [[{ revenue_total }]] = await pool.query(
      `SELECT COALESCE(SUM(total_amount), 0) AS revenue_total FROM sales`
    );
    const [[{ invoices_total }]] = await pool.query(`SELECT COUNT(*) AS invoices_total FROM sales`);

    const [topSelling] = await pool.query(`
      SELECT medicine_name, SUM(quantity) AS units_sold, SUM(subtotal) AS revenue
      FROM sale_items
      GROUP BY medicine_name
      ORDER BY units_sold DESC
      LIMIT 5
    `);

    const [recentSales] = await pool.query(`
      SELECT id, invoice_number, customer_name, total_amount, created_at
      FROM sales ORDER BY created_at DESC LIMIT 5
    `);

    res.json({
      success: true,
      data: {
        total_medicines,
        low_stock_medicines,
        expiring_soon_medicines,
        total_unread_alerts,
        revenue_today: Number(revenue_today),
        invoices_today,
        revenue_month: Number(revenue_month),
        revenue_total: Number(revenue_total),
        invoices_total,
        top_selling: topSelling,
        recent_sales: recentSales,
      },
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats.' });
  }
};

module.exports = { getDashboardStats };
