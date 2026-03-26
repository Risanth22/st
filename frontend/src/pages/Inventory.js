import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Package, Filter } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const UNITS = ['pcs', 'kg', 'g', 'litre', 'ml', 'pack', 'box', 'bag', 'bottle', 'bar', 'tube', 'dozen'];

function ProductModal({ product, categories, suppliers, onClose, onSave }) {
  const [form, setForm] = useState(product || {
    name: '', sku: '', barcode: '', category_id: '', supplier_id: '',
    purchase_price: '', selling_price: '', tax_percent: 18,
    stock_quantity: 0, reorder_level: 10, unit: 'pcs', expiry_date: '', description: ''
  });
  const [saving, setSaving] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (product?.id) {
        await api.put(`/products/${product.id}`, form);
        toast.success('Product updated');
      } else {
        await api.post('/products', form);
        toast.success('Product created');
      }
      onSave();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 680 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: 18 }}>{product?.id ? 'Edit Product' : 'Add New Product'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Product Name *</label>
                <input value={form.name} onChange={e => set('name', e.target.value)} required placeholder="e.g. Aashirvaad Atta 5kg" />
              </div>
              <div className="form-group">
                <label>SKU *</label>
                <input value={form.sku} onChange={e => set('sku', e.target.value)} required placeholder="e.g. GR001" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Barcode</label>
                <input value={form.barcode} onChange={e => set('barcode', e.target.value)} placeholder="Scan or enter barcode" />
              </div>
              <div className="form-group">
                <label>Unit</label>
                <select value={form.unit} onChange={e => set('unit', e.target.value)}>
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select value={form.category_id} onChange={e => set('category_id', e.target.value)}>
                  <option value="">-- Select Category --</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Supplier</label>
                <select value={form.supplier_id} onChange={e => set('supplier_id', e.target.value)}>
                  <option value="">-- Select Supplier --</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row-3">
              <div className="form-group">
                <label>Purchase Price (₹) *</label>
                <input type="number" step="0.01" value={form.purchase_price} onChange={e => set('purchase_price', e.target.value)} required placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Selling Price (₹) *</label>
                <input type="number" step="0.01" value={form.selling_price} onChange={e => set('selling_price', e.target.value)} required placeholder="0.00" />
              </div>
              <div className="form-group">
                <label>Tax %</label>
                <input type="number" value={form.tax_percent} onChange={e => set('tax_percent', e.target.value)} placeholder="18" />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Stock Quantity</label>
                <input type="number" value={form.stock_quantity} onChange={e => set('stock_quantity', e.target.value)} />
              </div>
              <div className="form-group">
                <label>Reorder Level</label>
                <input type="number" value={form.reorder_level} onChange={e => set('reorder_level', e.target.value)} />
              </div>
            </div>
            <div className="form-group">
              <label>Expiry Date (for perishables)</label>
              <input type="date" value={form.expiry_date || ''} onChange={e => set('expiry_date', e.target.value)} />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea value={form.description || ''} onChange={e => set('description', e.target.value)} rows={2} placeholder="Optional notes" style={{ resize: 'vertical' }} />
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Saving...' : product?.id ? 'Update Product' : 'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function StockBar({ qty, reorder }) {
  const pct = Math.min(100, (qty / Math.max(reorder * 3, 1)) * 100);
  const color = qty <= 0 ? 'var(--red)' : qty <= reorder ? 'var(--amber)' : 'var(--green)';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="stock-bar">
        <div className="stock-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span style={{ fontSize: 13, color, fontWeight: 500 }}>{qty}</span>
    </div>
  );
}

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [modal, setModal] = useState(null); // null | 'add' | product obj

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (catFilter) params.category = catFilter;
      const [prod, cats, sups] = await Promise.all([
        api.get('/products', { params }),
        api.get('/categories'),
        api.get('/suppliers'),
      ]);
      setProducts(prod.data);
      setCategories(cats.data);
      setSuppliers(sups.data);
    } catch (err) {
      toast.error('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, [search, catFilter]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      load();
    } catch { toast.error('Delete failed'); }
  };

  const getExpiryBadge = (status) => {
    if (!status || status === 'ok') return null;
    const map = { expired: 'badge-red', critical: 'badge-amber', warning: 'badge-amber' };
    return <span className={`badge ${map[status]}`} style={{ fontSize: 11 }}>{status}</span>;
  };

  const getMarginColor = (m) => {
    if (!m) return 'var(--text3)';
    if (m >= 30) return 'var(--green)';
    if (m >= 15) return 'var(--amber)';
    return 'var(--red)';
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">{products.length} products</p>
        </div>
        <button className="btn btn-primary" onClick={() => setModal('add')}>
          <Plus size={16} /> Add Product
        </button>
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-input" style={{ flex: 2 }}>
          <Search size={15} className="search-icon" />
          <input placeholder="Search by name, SKU or barcode..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={14} style={{ color: 'var(--text3)' }} />
          <select value={catFilter} onChange={e => setCatFilter(e.target.value)} style={{ width: 180 }}>
            <option value="">All Categories</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-center"><div className="spinner" /></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU / Barcode</th>
                <th>Category</th>
                <th>Buy / Sell</th>
                <th>Margin</th>
                <th>Stock</th>
                <th>Expiry</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr><td colSpan={8}>
                  <div className="empty-state">
                    <Package size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                    <h3>No products found</h3>
                    <p>Add your first product to get started</p>
                  </div>
                </td></tr>
              ) : products.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{p.supplier_name}</div>
                  </td>
                  <td>
                    <code style={{ fontSize: 12, color: 'var(--text2)' }}>{p.sku}</code>
                    {p.barcode && <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.barcode}</div>}
                  </td>
                  <td><span className="badge badge-blue" style={{ fontSize: 11 }}>{p.category_name || '—'}</span></td>
                  <td style={{ fontSize: 13 }}>
                    <span style={{ color: 'var(--red)' }}>₹{Number(p.purchase_price).toFixed(2)}</span>
                    <span style={{ color: 'var(--text3)', margin: '0 4px' }}>→</span>
                    <span style={{ color: 'var(--green)' }}>₹{Number(p.selling_price).toFixed(2)}</span>
                  </td>
                  <td style={{ fontWeight: 600, color: getMarginColor(p.margin_percent) }}>
                    {p.margin_percent ? `${p.margin_percent}%` : '—'}
                  </td>
                  <td><StockBar qty={p.stock_quantity} reorder={p.reorder_level} /></td>
                  <td>
                    {p.expiry_date ? (
                      <div>
                        {getExpiryBadge(p.expiry_status)}
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                          {new Date(p.expiry_date).toLocaleDateString('en-IN')}
                        </div>
                      </div>
                    ) : <span style={{ color: 'var(--text3)' }}>—</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setModal(p)} title="Edit">
                        <Edit2 size={13} />
                      </button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(p.id)} title="Delete">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal && (
        <ProductModal
          product={modal === 'add' ? null : modal}
          categories={categories}
          suppliers={suppliers}
          onClose={() => setModal(null)}
          onSave={() => { setModal(null); load(); }}
        />
      )}
    </div>
  );
}
