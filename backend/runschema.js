const fs = require('fs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function run() {
  const c = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });
  const sql = fs.readFileSync('./config/schema.sql', 'utf8');
  await c.query(sql);
  console.log('✅ All tables created!');
  await c.end();
}

run().catch(console.error);