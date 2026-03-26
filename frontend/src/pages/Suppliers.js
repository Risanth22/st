import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Truck, Package, FileText, Edit2, Trash2, CheckCircle } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

function SupplierModal({ supplier, onClose, onSave }) {
  const [form, setForm] = useState(supplier || { name: '', contact_person: '', phone: '', email: '', address: '', gstin: '' });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      if (supplier?.id) { await api.put(`/suppliers/${supplier.id}`, form); toast.success('Supplier updated'); }
      else { await api.post('/suppliers', form); toast.success('Supplier added'); }
      onSave();
    } catch { toast.error('Failed to save'); } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 style={{ fontSize: 18 }}>{supplier?.id ? 'Edit Supplier' : 'Add Supplier'}</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group"><label>Company Name *</label><input value={form.name} onChange={e => set('name', e.target.value)} required /></div>
              <div className="form-group"><label>Contact Person</label><input value={form.contact_person} onChange={e => set('contact_person', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Phone</label><input value={form.phone} onChange={e => set('phone', e.target.value)} /></div>
              <div className="form-group"><label>Email</label><input type="email" value={form.email} onChange={e => set('email', e.target.value)} /></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>GSTIN</label><input value={form.gstin} onChange={e => set('gstin', e.target.value)} placeholder="07AABCM1234A1Z5" /></div>
              <div className="form-group"><label>Address</label><input value={form.address} onChange={e => set('address', e.target.value)} /></div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save Supplier'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function POModal({ suppliers, products, onClose, onSave }) {
  const [supplierId, setSupplierId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([{ product_id: '', quantity: 1, unit_price: '' }]);
  const [saving, setSaving] = useState(false);

  const addItem = () => setItems(prev => [...prev, { product_id: '', quantity: 1, unit_price: '' }]);
  const removeItem = (i) => setItems(prev => prev.filter((_, idx) => idx !== i));
  const setItem = (i, k, v) => setItems(prev => prev.map((item, idx) => idx === i ? { ...item, [k]: v } : item));

  const handleProductChange = (i, productId) => {
    const product = products.find(p => String(p.id) === String(productId));
    setItem(i, 'product_id', productId);
    if (product) setItem(i, 'unit_price', product.purchase_price);
  };

  const total = items.reduce((s, i) => s + (Number(i.quantity) * Number(i.unit_price) || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault(); setSaving(true);
    try {
      await api.post('/purchase-orders', { supplier_id: supplierId, items: items.filter(i => i.product_id), notes });
      toast.success('Purchase order created');
      onSave();
    } catch (err) { toast.error(err.response?.data?.error || 'Failed'); } finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal" style={{ maxWidth: 700 }}>
        <div className="modal-header">
          <h2 style={{ fontSize: 18 }}>New Purchase Order</h2>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label>Supplier *</label>
                <select value={supplierId} onChange={e => setSupplierId(e.target.value)} required>
                  <option value="">Select Supplier</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div className="form-group"><label>Notes</label><input value={notes} onChange={e => setNotes(e.target.value)} /></div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <label style={{ marginBottom: 0 }}>Order Items</label>
                <button type="button" className="btn btn-ghost btn-sm" onClick={addItem}><Plus size={13} /> Add Item</button>
              </div>
              {items.map((item, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 80px 100px 32px', gap: 8, marginBottom: 8 }}>
                  <select value={item.product_id} onChange={e => handleProductChange(i, e.target.value)} required>
                    <option value="">Select Product</option>
                    {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <input type="number" min={1} value={item.quantity} onChange={e => setItem(i, 'quantity', e.target.value)} placeholder="Qty" />
                  <input type="number" step="0.01" value={item.unit_price} onChange={e => setItem(i, 'unit_price', e.target.value)} placeholder="Price (₹)" required />
                  <button type="button" className="btn btn-danger btn-sm btn-icon" onClick={() => removeItem(i)}><Trash2 size={12} /></button>
                </div>
              ))}
            </div>
            <div style={{ textAlign: 'right', fontWeight: 700, fontSize: 16 }}>
              Total: <span style={{ color: 'var(--green)' }}>₹{total.toFixed(2)}</span>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Creating...' : 'Create Purchase Order'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Suppliers() {
  const [tab, setTab] = useState('suppliers');
  const [suppliers, setSuppliers] = useState([]);
  const [pos, setPOs] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(null);
  const [poModal, setPOModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, p, prod] = await Promise.all([
        api.get('/suppliers'), api.get('/purchase-orders'), api.get('/products')
      ]);
      setSuppliers(s.data); setPOs(p.data); setProducts(prod.data);
    } catch { toast.error('Load failed'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete supplier?')) return;
    try { await api.delete(`/suppliers/${id}`); toast.success('Deleted'); load(); } catch { toast.error('Failed'); }
  };

  const handleReceive = async (poId) => {
    try { await api.post(`/purchase-orders/${poId}/receive`); toast.success('Stock received & inventory updated!'); load(); }
    catch (err) { toast.error(err.response?.data?.error || 'Failed'); }
  };

  const handlePayDue = async (supplierId, amount) => {
    const amt = parseFloat(prompt(`Enter payment amount (outstanding: ₹${amount}):`));
    if (!amt || isNaN(amt)) return;
    try { await api.patch(`/suppliers/${supplierId}/pay`, { amount: amt }); toast.success('Payment recorded'); load(); }
    catch { toast.error('Failed'); }
  };

  const statusBadge = (status) => {
    const map = { pending: 'badge-amber', received: 'badge-green', cancelled: 'badge-red' };
    return <span className={`badge ${map[status] || 'badge-gray'}`}>{status}</span>;
  };

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-subtitle">{suppliers.length} vendors</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={() => setPOModal(true)}><FileText size={15} /> New PO</button>
          <button className="btn btn-primary" onClick={() => setModal('add')}><Plus size={15} /> Add Supplier</button>
        </div>
      </div>

      <div className="tabs">
        {['suppliers', 'orders', 'dues'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'suppliers' ? 'Vendors' : t === 'orders' ? 'Purchase Orders' : 'Payment Dues'}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <>
          {tab === 'suppliers' && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Supplier</th><th>Contact</th><th>GSTIN</th><th>Products</th><th>Orders</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {suppliers.length === 0 ? (
                    <tr><td colSpan={6}><div className="empty-state"><Truck size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} /><h3>No suppliers yet</h3></div></td></tr>
                  ) : suppliers.map(s => (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{s.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{s.email}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: 13 }}>{s.contact_person}</div>
                        <div style={{ fontSize: 12, color: 'var(--text3)' }}>{s.phone}</div>
                      </td>
                      <td><code style={{ fontSize: 12, color: 'var(--text2)' }}>{s.gstin || '—'}</code></td>
                      <td><span className="badge badge-blue">{s.product_count || 0} products</span></td>
                      <td><span className="badge badge-gray">{s.order_count || 0} orders</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button className="btn btn-ghost btn-sm btn-icon" onClick={() => setModal(s)}><Edit2 size={13} /></button>
                          <button className="btn btn-danger btn-sm btn-icon" onClick={() => handleDelete(s.id)}><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'orders' && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>PO Number</th><th>Supplier</th><th>Amount</th><th>Status</th><th>Ordered</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {pos.length === 0 ? (
                    <tr><td colSpan={6}><div className="empty-state"><FileText size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} /><h3>No purchase orders yet</h3></div></td></tr>
                  ) : pos.map(po => (
                    <tr key={po.id}>
                      <td><code style={{ color: 'var(--accent)', fontSize: 12 }}>{po.po_number}</code></td>
                      <td>{po.supplier_name}</td>
                      <td style={{ fontWeight: 600 }}>₹{Number(po.total_amount).toFixed(2)}</td>
                      <td>{statusBadge(po.status)}</td>
                      <td style={{ fontSize: 12, color: 'var(--text3)' }}>{new Date(po.created_at).toLocaleDateString('en-IN')}</td>
                      <td>
                        {po.status === 'pending' && (
                          <button className="btn btn-success btn-sm" onClick={() => handleReceive(po.id)}>
                            <CheckCircle size={13} /> Receive Stock
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'dues' && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Supplier</th><th>Contact</th><th>Outstanding Dues</th><th>Action</th></tr>
                </thead>
                <tbody>
                  {suppliers.filter(s => s.outstanding_dues > 0).length === 0 ? (
                    <tr><td colSpan={4}><div className="empty-state"><CheckCircle size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} /><h3>No outstanding dues!</h3></div></td></tr>
                  ) : suppliers.filter(s => s.outstanding_dues > 0).map(s => (
                    <tr key={s.id}>
                      <td style={{ fontWeight: 500 }}>{s.name}</td>
                      <td style={{ color: 'var(--text2)' }}>{s.phone}</td>
                      <td><span style={{ color: 'var(--red)', fontWeight: 700, fontSize: 16 }}>₹{Number(s.outstanding_dues).toFixed(2)}</span></td>
                      <td>
                        <button className="btn btn-success btn-sm" onClick={() => handlePayDue(s.id, s.outstanding_dues)}>
                          Mark Paid
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {modal && (
        <SupplierModal supplier={modal === 'add' ? null : modal} onClose={() => setModal(null)} onSave={() => { setModal(null); load(); }} />
      )}
      {poModal && (
        <POModal suppliers={suppliers} products={products} onClose={() => setPOModal(false)} onSave={() => { setPOModal(false); load(); }} />
      )}
    </div>
  );
}
