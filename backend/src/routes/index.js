const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const authCtrl = require('../controllers/authController');
const productCtrl = require('../controllers/productController');
const billingCtrl = require('../controllers/billingController');
const supplierCtrl = require('../controllers/supplierController');

// Auth
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', authenticate, authCtrl.me);

// Users (owner only)
router.get('/users', authenticate, authorize('owner'), authCtrl.getUsers);
router.post('/users', authenticate, authorize('owner'), authCtrl.createUser);
router.put('/users/:id', authenticate, authorize('owner'), authCtrl.updateUser);
router.delete('/users/:id', authenticate, authorize('owner'), authCtrl.deleteUser);

// Categories
router.get('/categories', authenticate, productCtrl.getCategories);
router.post('/categories', authenticate, authorize('owner', 'manager'), productCtrl.createCategory);

// Products
router.get('/products', authenticate, productCtrl.getProducts);
router.get('/products/barcode/:barcode', authenticate, productCtrl.getByBarcode);
router.get('/products/:id', authenticate, productCtrl.getProduct);
router.post('/products', authenticate, authorize('owner', 'manager'), productCtrl.createProduct);
router.put('/products/:id', authenticate, authorize('owner', 'manager'), productCtrl.updateProduct);
router.delete('/products/:id', authenticate, authorize('owner', 'manager'), productCtrl.deleteProduct);
router.patch('/products/:id/stock', authenticate, authorize('owner', 'manager'), productCtrl.updateStock);

// Billing
router.get('/billing/dashboard', authenticate, billingCtrl.getDashboardStats);
router.get('/billing/reports', authenticate, authorize('owner', 'manager'), billingCtrl.getSalesReport);
router.get('/billing/pnl', authenticate, authorize('owner'), billingCtrl.getPnL);
router.get('/bills', authenticate, billingCtrl.getBills);
router.get('/bills/:id', authenticate, billingCtrl.getBill);
router.post('/bills', authenticate, billingCtrl.createBill);

// Suppliers
router.get('/suppliers', authenticate, authorize('owner', 'manager'), supplierCtrl.getSuppliers);
router.get('/suppliers/:id', authenticate, authorize('owner', 'manager'), supplierCtrl.getSupplier);
router.post('/suppliers', authenticate, authorize('owner', 'manager'), supplierCtrl.createSupplier);
router.put('/suppliers/:id', authenticate, authorize('owner', 'manager'), supplierCtrl.updateSupplier);
router.delete('/suppliers/:id', authenticate, authorize('owner'), supplierCtrl.deleteSupplier);
router.patch('/suppliers/:id/pay', authenticate, authorize('owner'), supplierCtrl.markDuePaid);

// Purchase Orders
router.get('/purchase-orders', authenticate, authorize('owner', 'manager'), supplierCtrl.getPurchaseOrders);
router.post('/purchase-orders', authenticate, authorize('owner', 'manager'), supplierCtrl.createPurchaseOrder);
router.post('/purchase-orders/:id/receive', authenticate, authorize('owner', 'manager'), supplierCtrl.receivePurchaseOrder);
router.get('/purchase-orders/:id/items', authenticate, authorize('owner', 'manager'), supplierCtrl.getPOItems);

// Expiry alerts
router.get('/alerts/expiry', authenticate, async (req, res) => {
  try {
    const pool = require('../../config/db');
    const result = await pool.query(`
      SELECT p.id, p.name, p.sku, p.stock_quantity, p.expiry_date,
        CASE
          WHEN p.expiry_date < NOW() THEN 'expired'
          WHEN p.expiry_date < NOW() + INTERVAL '7 days' THEN 'critical'
          ELSE 'warning'
        END as status,
        p.expiry_date - CURRENT_DATE as days_left
      FROM products p
      WHERE p.expiry_date IS NOT NULL AND p.expiry_date < NOW() + INTERVAL '30 days' AND p.is_active = true
      ORDER BY p.expiry_date
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/alerts/low-stock', authenticate, async (req, res) => {
  try {
    const pool = require('../../config/db');
    const result = await pool.query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.stock_quantity <= p.reorder_level AND p.is_active = true ORDER BY p.stock_quantity'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
