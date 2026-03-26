const pool = require('../../config/db');

const generateBillNumber = () => {
  const date = new Date();
  const ymd = `${date.getFullYear()}${String(date.getMonth()+1).padStart(2,'0')}${String(date.getDate()).padStart(2,'0')}`;
  return `BILL-${ymd}-${Math.floor(Math.random()*9000)+1000}`;
};

exports.createBill = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { customer_name, customer_phone, items, discount_amount = 0, payment_mode = 'cash' } = req.body;

    let subtotal = 0, tax_amount = 0;
    for (const item of items) {
      const product = await client.query('SELECT * FROM products WHERE id = $1', [item.product_id]);
      if (!product.rows[0]) throw new Error(`Product ${item.product_id} not found`);
      if (product.rows[0].stock_quantity < item.quantity) throw new Error(`Insufficient stock for ${product.rows[0].name}`);
      const lineTotal = item.quantity * item.unit_price;
      const lineTax = lineTotal * (item.tax_percent / 100);
      subtotal += lineTotal;
      tax_amount += lineTax;
    }
    const total_amount = subtotal + tax_amount - discount_amount;

    const billResult = await client.query(
      `INSERT INTO bills (bill_number, customer_name, customer_phone, subtotal, tax_amount, discount_amount, total_amount, payment_mode, cashier_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [generateBillNumber(), customer_name, customer_phone, subtotal, tax_amount, discount_amount, total_amount, payment_mode, req.user.id]
    );
    const bill = billResult.rows[0];

    for (const item of items) {
      const product = await client.query('SELECT * FROM products WHERE id = $1', [item.product_id]);
      const lineTotal = item.quantity * item.unit_price;
      await client.query(
        `INSERT INTO bill_items (bill_id, product_id, product_name, quantity, unit_price, tax_percent, discount_percent, total_price)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [bill.id, item.product_id, product.rows[0].name, item.quantity, item.unit_price, item.tax_percent || 0, item.discount_percent || 0, lineTotal]
      );
      await client.query('UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2', [item.quantity, item.product_id]);
    }

    await client.query('COMMIT');
    const fullBill = await pool.query(`
      SELECT b.*, json_agg(bi.*) as items FROM bills b
      JOIN bill_items bi ON bi.bill_id = b.id
      WHERE b.id = $1 GROUP BY b.id`, [bill.id]);
    res.status(201).json(fullBill.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
};

exports.getBills = async (req, res) => {
  try {
    const { from, to, payment_mode, limit = 50, offset = 0 } = req.query;
    let query = `SELECT b.*, u.name as cashier_name, COUNT(bi.id) as item_count
      FROM bills b LEFT JOIN users u ON b.cashier_id = u.id
      LEFT JOIN bill_items bi ON bi.bill_id = b.id WHERE 1=1`;
    const params = [];
    let idx = 1;
    if (from) { query += ` AND b.created_at >= $${idx}`; params.push(from); idx++; }
    if (to) { query += ` AND b.created_at <= $${idx}`; params.push(to); idx++; }
    if (payment_mode) { query += ` AND b.payment_mode = $${idx}`; params.push(payment_mode); idx++; }
    query += ` GROUP BY b.id, u.name ORDER BY b.created_at DESC LIMIT $${idx} OFFSET $${idx+1}`;
    params.push(limit, offset);
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getBill = async (req, res) => {
  try {
    const bill = await pool.query('SELECT * FROM bills WHERE id = $1', [req.params.id]);
    if (!bill.rows[0]) return res.status(404).json({ error: 'Bill not found' });
    const items = await pool.query(
      'SELECT bi.*, p.sku, p.barcode FROM bill_items bi LEFT JOIN products p ON bi.product_id = p.id WHERE bi.bill_id = $1',
      [req.params.id]
    );
    res.json({ ...bill.rows[0], items: items.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const todaySales = await pool.query(
      `SELECT COALESCE(SUM(total_amount),0) as revenue, COUNT(*) as bills FROM bills WHERE DATE(created_at) = $1`, [today]
    );
    const lowStock = await pool.query(
      `SELECT COUNT(*) as count FROM products WHERE stock_quantity <= reorder_level AND is_active = true`
    );
    const expiryAlerts = await pool.query(
      `SELECT COUNT(*) as count FROM products WHERE expiry_date IS NOT NULL AND expiry_date < NOW() + INTERVAL '7 days' AND is_active = true`
    );
    const weeklySales = await pool.query(
      `SELECT DATE(created_at) as date, COALESCE(SUM(total_amount),0) as revenue, COUNT(*) as bills
       FROM bills WHERE created_at >= NOW() - INTERVAL '7 days'
       GROUP BY DATE(created_at) ORDER BY date`
    );
    const topProducts = await pool.query(
      `SELECT bi.product_name, SUM(bi.quantity) as total_qty, SUM(bi.total_price) as total_revenue
       FROM bill_items bi JOIN bills b ON b.id = bi.bill_id
       WHERE b.created_at >= NOW() - INTERVAL '30 days'
       GROUP BY bi.product_name ORDER BY total_revenue DESC LIMIT 5`
    );
    const recentBills = await pool.query(
      `SELECT b.*, u.name as cashier_name FROM bills b LEFT JOIN users u ON b.cashier_id = u.id
       ORDER BY b.created_at DESC LIMIT 5`
    );

    res.json({
      today: todaySales.rows[0],
      low_stock: parseInt(lowStock.rows[0].count),
      expiry_alerts: parseInt(expiryAlerts.rows[0].count),
      weekly_sales: weeklySales.rows,
      top_products: topProducts.rows,
      recent_bills: recentBills.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getSalesReport = async (req, res) => {
  try {
    const { from, to, type = 'daily' } = req.query;
    const fromDate = from || new Date(Date.now() - 30*24*60*60*1000).toISOString();
    const toDate = to || new Date().toISOString();

    const sales = await pool.query(
      `SELECT DATE(b.created_at) as date, SUM(b.total_amount) as revenue, COUNT(b.id) as bills,
       SUM(b.tax_amount) as tax, SUM(b.discount_amount) as discounts
       FROM bills b WHERE b.created_at BETWEEN $1 AND $2
       GROUP BY DATE(b.created_at) ORDER BY date`,
      [fromDate, toDate]
    );

    const topItems = await pool.query(
      `SELECT bi.product_name, bi.product_id, SUM(bi.quantity) as qty, SUM(bi.total_price) as revenue,
       p.purchase_price, AVG(bi.unit_price) as avg_price
       FROM bill_items bi JOIN bills b ON b.id = bi.bill_id
       LEFT JOIN products p ON bi.product_id = p.id
       WHERE b.created_at BETWEEN $1 AND $2
       GROUP BY bi.product_name, bi.product_id, p.purchase_price ORDER BY revenue DESC LIMIT 20`,
      [fromDate, toDate]
    );

    const deadStock = await pool.query(
      `SELECT p.id, p.name, p.sku, p.stock_quantity, p.purchase_price, p.selling_price, p.created_at,
       MAX(b.created_at) as last_sold
       FROM products p LEFT JOIN bill_items bi ON bi.product_id = p.id
       LEFT JOIN bills b ON b.id = bi.bill_id
       WHERE p.is_active = true AND p.stock_quantity > 0
       GROUP BY p.id HAVING MAX(b.created_at) < NOW() - INTERVAL '30 days' OR MAX(b.created_at) IS NULL
       ORDER BY p.stock_quantity DESC LIMIT 20`
    );

    res.json({ daily: sales.rows, top_items: topItems.rows, dead_stock: deadStock.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getPnL = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT p.id, p.name, p.sku, p.purchase_price, p.selling_price, p.stock_quantity,
        p.selling_price - p.purchase_price as profit_per_unit,
        ROUND(((p.selling_price - p.purchase_price) / NULLIF(p.purchase_price,0)) * 100, 2) as margin_percent,
        COALESCE(s.total_qty,0) as units_sold, COALESCE(s.total_revenue,0) as revenue,
        COALESCE(s.total_qty,0) * p.purchase_price as cogs,
        COALESCE(s.total_revenue,0) - COALESCE(s.total_qty,0) * p.purchase_price as gross_profit
      FROM products p
      LEFT JOIN (
        SELECT bi.product_id, SUM(bi.quantity) as total_qty, SUM(bi.total_price) as total_revenue
        FROM bill_items bi JOIN bills b ON b.id = bi.bill_id
        WHERE b.created_at >= NOW() - INTERVAL '30 days'
        GROUP BY bi.product_id
      ) s ON s.product_id = p.id
      WHERE p.is_active = true ORDER BY gross_profit DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
