require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const pool = require('../config/db');
const fs = require('fs');
const path = require('path');

const app = express();

// Middleware
app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api', require('./routes'));

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// Initialize database
const initDB = async () => {
  try {
    const schema = fs.readFileSync(path.join(__dirname, '../config/schema.sql'), 'utf8');
    await pool.query(schema);
    console.log('✅ Database initialized');
  } catch (err) {
    console.error('❌ DB Init error:', err.message);
  }
};

// Cron Jobs
// Midnight: scan expiry
cron.schedule('0 0 * * *', async () => {
  try {
    await pool.query(`
      INSERT INTO expiry_alerts (product_id, alert_type)
      SELECT id, CASE
        WHEN expiry_date < NOW() THEN 'expired'
        WHEN expiry_date < NOW() + INTERVAL '7 days' THEN 'critical'
        ELSE 'warning'
      END
      FROM products WHERE expiry_date IS NOT NULL AND expiry_date < NOW() + INTERVAL '30 days' AND is_active = true
      ON CONFLICT DO NOTHING
    `);
    console.log('✅ Expiry check done');
  } catch (err) { console.error('Expiry cron error:', err); }
});

// 9PM: low stock check
cron.schedule('0 21 * * *', async () => {
  try {
    const lowStock = await pool.query('SELECT * FROM products WHERE stock_quantity <= reorder_level AND is_active = true');
    if (lowStock.rows.length > 0) {
      console.log(`⚠️ Low stock alert: ${lowStock.rows.length} products`);
      // WhatsApp/SMS integration would go here
    }
  } catch (err) { console.error('Low stock cron error:', err); }
});

const PORT = process.env.PORT || 5000;

const start = async () => {
  await initDB();
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
};

start();
