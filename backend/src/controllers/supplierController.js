const pool = require('../../config/db');

exports.getSuppliers = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, COUNT(DISTINCT sp.product_id) as product_count,
       COUNT(DISTINCT po.id) as order_count
       FROM suppliers s
       LEFT JOIN supplier_products sp ON sp.supplier_id = s.id
       LEFT JOIN purchase_orders po ON po.supplier_id = s.id
       GROUP BY s.id ORDER BY s.name`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.getSupplier = async (req, res) => {
  try {
    const supplier = await pool.query('SELECT * FROM suppliers WHERE id = $1', [req.params.id]);
    if (!supplier.rows[0]) return res.status(404).json({ error: 'Supplier not found' });
    const products = await pool.query(
      'SELECT p.*, sp.supplier_price FROM products p JOIN supplier_products sp ON sp.product_id = p.id WHERE sp.supplier_id = $1',
      [req.params.id]
    );
    const orders = await pool.query(
      'SELECT * FROM purchase_orders WHERE supplier_id = $1 ORDER BY created_at DESC LIMIT 10',
      [req.params.id]
    );
    res.json({ ...supplier.rows[0], products: products.rows, recent_orders: orders.rows });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createSupplier = async (req, res) => {
  try {
    const { name, contact_person, phone, email, address, gstin } = req.body;
    const result = await pool.query(
      'INSERT INTO suppliers (name, contact_person, phone, email, address, gstin) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [name, contact_person, phone, email, address, gstin]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.updateSupplier = async (req, res) => {
  try {
    const { name, contact_person, phone, email, address, gstin } = req.body;
    const result = await pool.query(
      'UPDATE suppliers SET name=$1,contact_person=$2,phone=$3,email=$4,address=$5,gstin=$6 WHERE id=$7 RETURNING *',
      [name, contact_person, phone, email, address, gstin, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.deleteSupplier = async (req, res) => {
  try {
    await pool.query('DELETE FROM suppliers WHERE id = $1', [req.params.id]);
    res.json({ message: 'Supplier deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Purchase Orders
exports.getPurchaseOrders = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT po.*, s.name as supplier_name, u.name as ordered_by_name,
       COUNT(pi.id) as item_count
      FROM purchase_orders po
      JOIN suppliers s ON s.id = po.supplier_id
      LEFT JOIN users u ON u.id = po.ordered_by
      LEFT JOIN po_items pi ON pi.po_id = po.id
      GROUP BY po.id, s.name, u.name
      ORDER BY po.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.createPurchaseOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { supplier_id, items, notes } = req.body;
    const poNumber = `PO-${Date.now()}`;
    let total = 0;
    for (const item of items) total += item.quantity * item.unit_price;

    const po = await client.query(
      'INSERT INTO purchase_orders (po_number, supplier_id, total_amount, notes, ordered_by) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [poNumber, supplier_id, total, notes, req.user.id]
    );
    for (const item of items) {
      await client.query(
        'INSERT INTO po_items (po_id, product_id, quantity, unit_price) VALUES ($1,$2,$3,$4)',
        [po.rows[0].id, item.product_id, item.quantity, item.unit_price]
      );
    }
    await client.query('COMMIT');
    res.status(201).json(po.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

exports.receivePurchaseOrder = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const po = await client.query('SELECT * FROM purchase_orders WHERE id = $1', [req.params.id]);
    if (!po.rows[0]) return res.status(404).json({ error: 'PO not found' });
    if (po.rows[0].status === 'received') return res.status(400).json({ error: 'Already received' });

    const items = await client.query('SELECT * FROM po_items WHERE po_id = $1', [req.params.id]);
    for (const item of items.rows) {
      await client.query('UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2', [item.quantity, item.product_id]);
    }

    await client.query(
      'UPDATE purchase_orders SET status = $1, received_at = NOW() WHERE id = $2',
      ['received', req.params.id]
    );
    await client.query(
      'UPDATE suppliers SET outstanding_dues = outstanding_dues + $1 WHERE id = $2',
      [po.rows[0].total_amount, po.rows[0].supplier_id]
    );
    await client.query('COMMIT');
    res.json({ message: 'Stock received and inventory updated' });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Server error' });
  } finally {
    client.release();
  }
};

exports.getPOItems = async (req, res) => {
  try {
    const items = await pool.query(
      'SELECT pi.*, p.name as product_name, p.sku FROM po_items pi JOIN products p ON p.id = pi.product_id WHERE pi.po_id = $1',
      [req.params.id]
    );
    res.json(items.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};

exports.markDuePaid = async (req, res) => {
  try {
    const { amount } = req.body;
    await pool.query(
      'UPDATE suppliers SET outstanding_dues = GREATEST(0, outstanding_dues - $1) WHERE id = $2',
      [amount, req.params.id]
    );
    res.json({ message: 'Payment recorded' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
};
