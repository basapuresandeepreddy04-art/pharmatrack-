require('dotenv').config();
const bcrypt = require('bcryptjs');
const { pool, testConnection } = require('./config/db');

const seed = async () => {
  await testConnection();

  console.log('🌱 Seeding database...');

  // Create owner account
  const hashedPassword = await bcrypt.hash('owner123', 12);
  await pool.query(
    `INSERT INTO users (name, email, password, role)
     VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE name = VALUES(name)`,
    ['Dr. Ramesh Kumar', 'owner@pharma.com', hashedPassword, 'owner']
  );
  console.log('✅ Owner created: owner@pharma.com / owner123');

  const [[owner]] = await pool.query('SELECT id FROM users WHERE email = ?', ['owner@pharma.com']);

  // Sample medicines (mix of normal, low-stock, and near-expiry)
  const today = new Date();
  const addDays = (d) => {
    const dt = new Date(today);
    dt.setDate(dt.getDate() + d);
    return dt.toISOString().split('T')[0];
  };

  const medicines = [
    { name: 'Paracetamol 500mg', batch: 'PCM-2024-001', qty: 150, price: 12.50,  expiry: addDays(180) },
    { name: 'Amoxicillin 250mg', batch: 'AMX-2024-012', qty: 8,   price: 45.00,  expiry: addDays(90)  },  // low stock
    { name: 'Metformin 500mg',   batch: 'MET-2024-023', qty: 200, price: 18.75,  expiry: addDays(20)  },  // expiring soon
    { name: 'Atorvastatin 10mg', batch: 'ATV-2024-034', qty: 5,   price: 65.00,  expiry: addDays(15)  },  // low stock + expiring soon
    { name: 'Omeprazole 20mg',   batch: 'OMP-2024-045', qty: 75,  price: 32.00,  expiry: addDays(365) },
    { name: 'Cetirizine 10mg',   batch: 'CTZ-2024-056', qty: 3,   price: 22.00,  expiry: addDays(7)   },  // critical low + near expiry
    { name: 'Azithromycin 500mg',batch: 'AZT-2024-067', qty: 60,  price: 88.00,  expiry: addDays(60)  },
    { name: 'Pantoprazole 40mg', batch: 'PNT-2024-078', qty: 40,  price: 28.50,  expiry: addDays(45)  },
    { name: 'Aspirin 75mg',      batch: 'ASP-2024-089', qty: 9,   price: 9.00,   expiry: addDays(120) },  // low stock
    { name: 'Ibuprofen 400mg',   batch: 'IBU-2024-090', qty: 120, price: 15.25,  expiry: addDays(25)  },  // expiring soon
  ];

  for (const m of medicines) {
    const [result] = await pool.query(
      `INSERT INTO medicines (name, batch_number, stock_quantity, price, expiry_date, created_by)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [m.name, m.batch, m.qty, m.price, m.expiry, owner.id]
    );

    // Sync alerts
    const daysLeft = m.qty < 10 ? 0 : null;
    const expiry = new Date(m.expiry);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));

    if (m.qty < 10) {
      await pool.query(
        'INSERT INTO alerts (medicine_id, alert_type, message) VALUES (?, ?, ?)',
        [result.insertId, 'low_stock', `Low stock alert: "${m.name}" has only ${m.qty} unit(s) remaining.`]
      );
    }
    if (daysUntilExpiry <= 30) {
      const msg = daysUntilExpiry > 0
        ? `Expiry alert: "${m.name}" expires in ${daysUntilExpiry} day(s) (${m.expiry}).`
        : `Expired: "${m.name}" expired on ${m.expiry}.`;
      await pool.query(
        'INSERT INTO alerts (medicine_id, alert_type, message) VALUES (?, ?, ?)',
        [result.insertId, 'expiry', msg]
      );
    }
  }

  console.log(`✅ ${medicines.length} medicines seeded.`);

  // Sample sales so the Dashboard/Sales history isn't empty on first run
  const [stock] = await pool.query('SELECT id, name, price, stock_quantity FROM medicines ORDER BY id LIMIT 3');
  const sampleSales = [
    { customer: 'Walk-in Customer', phone: null,            items: [{ med: stock[0], qty: 2 }] },
    { customer: 'Priya Sharma',     phone: '9876543210',    items: [{ med: stock[1], qty: 1 }, { med: stock[2], qty: 3 }] },
  ];

  for (const s of sampleSales) {
    const total = s.items.reduce((sum, it) => sum + Number(it.med.price) * it.qty, 0);
    const invoiceNumber = `INV-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const [saleResult] = await pool.query(
      'INSERT INTO sales (invoice_number, customer_name, customer_phone, total_amount, created_by) VALUES (?, ?, ?, ?, ?)',
      [invoiceNumber, s.customer, s.phone, total, owner.id]
    );
    for (const it of s.items) {
      const subtotal = Number(it.med.price) * it.qty;
      await pool.query(
        'INSERT INTO sale_items (sale_id, medicine_id, medicine_name, quantity, unit_price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
        [saleResult.insertId, it.med.id, it.med.name, it.qty, it.med.price, subtotal]
      );
      await pool.query('UPDATE medicines SET stock_quantity = stock_quantity - ? WHERE id = ?', [it.qty, it.med.id]);
    }
  }
  console.log(`✅ ${sampleSales.length} sample sales seeded.`);
  console.log('🎉 Database seeded successfully!\n');
  console.log('Login credentials:');
  console.log('  Email:    owner@pharma.com');
  console.log('  Password: owner123');
  process.exit(0);
};

seed().catch((err) => {
  console.error('Seed error:', err);
  process.exit(1);
});
