const pool = require('../../config/db');

exports.getProducts = async (req, res) => {
  try {
    const { category, search, low_stock, expiring } = req.query;
    let query = `
      SELECT p.*, c.name as category_name, s.name as supplier_name,
        CASE WHEN p.stock_quantity <= p.reorder_level THEN true ELSE false END as is_low_stock,
        CASE 
          WHEN p.expiry_date < NOW() THEN 'expired'
          WHEN p.expiry_date < NOW() + INTERVAL '7 days' THEN 'critical'
          WHEN p.expiry_date < NOW() + INTERVAL '30 days' THEN 'warning'
          ELSE 'ok'
        END as expiry_status,
        ROUND(((p.selling_price - p.purchase_price) / NULLIF(p.purchase_price, 0)) * 100, 2) as margin_percent
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN suppliers s ON p.supplier_id = s.id
      WHERE p.is_active = true
    `;
    const params = [];
    let idx = 1;

    if (search) { query += ` AND (p.name ILIKE $${idx} OR p.sku ILIKE $${idx} OR p.barcode ILIKE $${idx})`; params.push(`%${search}%`); idx++; }
    if (category) { query += ` AND p.category_id = $${idx}`; params.push(category); idx++; }
    if (low_stock === 'true') { query += ` AND p.stock_quantity <= p.reorder_level`; }
    if (expiring === 'true') { query += ` AND p.expiry_date IS NOT NULL AND p.expiry_date < NOW() + INTERVAL '30 days'`; }

    query += ' ORDER BY p.name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getProduct = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, c.name as category_name, s.name as supplier_name FROM products p
       LEFT JOIN categories c ON p.category_id = c.id
       LEFT JOIN suppliers s ON p.supplier_id = s.id
       WHERE p.id = $1`,
      [req.params.id]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createProduct = async (req, res) => {
  try {
    const { name, sku, barcode, category_id, supplier_id, purchase_price, selling_price, tax_percent, stock_quantity, reorder_level, unit, expiry_date, description } = req.body;
    const result = await pool.query(
      `INSERT INTO products (name, sku, barcode, category_id, supplier_id, purchase_price, selling_price, tax_percent, stock_quantity, reorder_level, unit, expiry_date, description)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [name, sku, barcode, category_id, supplier_id, purchase_price, selling_price, tax_percent || 18, stock_quantity || 0, reorder_level || 10, unit || 'pcs', expiry_date || null, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'SKU or barcode already exists' });
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { name, sku, barcode, category_id, supplier_id, purchase_price, selling_price, tax_percent, stock_quantity, reorder_level, unit, expiry_date, description } = req.body;
    const result = await pool.query(
      `UPDATE products SET name=$1,sku=$2,barcode=$3,category_id=$4,supplier_id=$5,purchase_price=$6,selling_price=$7,
       tax_percent=$8,stock_quantity=$9,reorder_level=$10,unit=$11,expiry_date=$12,description=$13
       WHERE id=$14 RETURNING *`,
      [name, sku, barcode, category_id, supplier_id, purchase_price, selling_price, tax_percent, stock_quantity, reorder_level, unit, expiry_date || null, description, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    await pool.query('UPDATE products SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateStock = async (req, res) => {
  try {
    const { quantity } = req.body;
    const result = await pool.query(
      'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2 RETURNING stock_quantity',
      [quantity, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getByBarcode = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM products WHERE (barcode = $1 OR sku = $1) AND is_active = true',
      [req.params.barcode]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Product not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const result = await pool.query('INSERT INTO categories (name, description) VALUES ($1, $2) RETURNING *', [name, description]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
