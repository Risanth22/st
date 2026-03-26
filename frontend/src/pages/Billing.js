import React, { useState, useEffect, useRef } from 'react';
import { Search, Plus, Minus, Trash2, ShoppingCart, CreditCard, Smartphone, Banknote, X, CheckCircle, ScanLine } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

function CartItem({ item, onQtyChange, onRemove }) {
  const total = item.quantity * item.unit_price;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '12px 0', borderBottom: '1px solid var(--border)'
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {item.name}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>₹{Number(item.unit_price).toFixed(2)} × {item.quantity}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onQtyChange(item.id, item.quantity - 1)}>
          <Minus size={12} />
        </button>
        <span style={{ fontSize: 14, fontWeight: 600, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
        <button className="btn btn-ghost btn-sm btn-icon" onClick={() => onQtyChange(item.id, item.quantity + 1)}>
          <Plus size={12} />
        </button>
      </div>
      <div style={{ width: 70, textAlign: 'right', fontWeight: 600, fontSize: 14, color: 'var(--green)' }}>
        ₹{total.toFixed(2)}
      </div>
      <button className="btn btn-danger btn-sm btn-icon" onClick={() => onRemove(item.id)}>
        <Trash2 size={12} />
      </button>
    </div>
  );
}

function BillSuccess({ bill, onClose }) {
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ maxWidth: 420, textAlign: 'center' }}>
        <div className="modal-body" style={{ padding: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: 'rgba(16,185,129,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 20px'
          }}>
            <CheckCircle size={32} color="var(--green)" />
          </div>
          <h2 style={{ marginBottom: 8 }}>Bill Generated!</h2>
          <p style={{ color: 'var(--text3)', marginBottom: 20 }}>{bill.bill_number}</p>
          <div className="card" style={{ textAlign: 'left', marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--text2)' }}>Subtotal</span>
              <span>₹{Number(bill.subtotal).toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ color: 'var(--text2)' }}>Tax</span>
              <span>₹{Number(bill.tax_amount).toFixed(2)}</span>
            </div>
            {bill.discount_amount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ color: 'var(--red)' }}>Discount</span>
                <span style={{ color: 'var(--red)' }}>-₹{Number(bill.discount_amount).toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)', fontWeight: 700, fontSize: 18 }}>
              <span>Total</span>
              <span style={{ color: 'var(--green)' }}>₹{Number(bill.total_amount).toFixed(2)}</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn btn-ghost" style={{ flex: 1 }} onClick={onClose}>New Bill</button>
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => { window.print(); }}>
              🖨️ Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Billing() {
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMode, setPaymentMode] = useState('cash');
  const [placing, setPlacing] = useState(false);
  const [billSuccess, setBillSuccess] = useState(null);
  const [barcodeInput, setBarcodeInput] = useState('');
  const barcodeRef = useRef();

  useEffect(() => {
    api.get('/products').then(r => setProducts(r.data)).catch(console.error);
  }, []);

  const filtered = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 20);

  const addToCart = (product) => {
    if (product.stock_quantity <= 0) { toast.error('Out of stock'); return; }
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock_quantity) { toast.error('Insufficient stock'); return prev; }
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { ...product, quantity: 1, unit_price: product.selling_price }];
    });
  };

  const changeQty = (id, qty) => {
    if (qty <= 0) { removeFromCart(id); return; }
    const product = products.find(p => p.id === id);
    if (product && qty > product.stock_quantity) { toast.error('Insufficient stock'); return; }
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(i => i.id !== id));

  const handleBarcode = async (e) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      try {
        const res = await api.get(`/products/barcode/${barcodeInput.trim()}`);
        addToCart(res.data);
        setBarcodeInput('');
      } catch { toast.error('Product not found for barcode: ' + barcodeInput); }
    }
  };

  const subtotal = cart.reduce((s, i) => s + i.quantity * i.unit_price, 0);
  const taxAmount = cart.reduce((s, i) => s + (i.quantity * i.unit_price * (i.tax_percent || 0) / 100), 0);
  const total = subtotal + taxAmount - discount;

  const placeBill = async () => {
    if (cart.length === 0) { toast.error('Cart is empty'); return; }
    setPlacing(true);
    try {
      const items = cart.map(i => ({
        product_id: i.id, quantity: i.quantity,
        unit_price: i.unit_price, tax_percent: i.tax_percent || 0
      }));
      const res = await api.post('/bills', {
        customer_name: customerName || null, customer_phone: customerPhone || null,
        items, discount_amount: discount, payment_mode: paymentMode
      });
      setBillSuccess(res.data);
      setCart([]); setCustomerName(''); setCustomerPhone(''); setDiscount(0);
      api.get('/products').then(r => setProducts(r.data));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to create bill');
    } finally {
      setPlacing(false);
    }
  };

  const payModes = [
    { id: 'cash', label: 'Cash', icon: Banknote },
    { id: 'upi', label: 'UPI', icon: Smartphone },
    { id: 'card', label: 'Card', icon: CreditCard },
  ];

  return (
    <div className="page" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 20, padding: 20, height: '100vh', overflow: 'hidden' }}>
      {/* Left: Product Grid */}
      <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ marginBottom: 16 }}>
          <h1 className="page-title" style={{ marginBottom: 16 }}>Billing / POS</h1>
          <div style={{ display: 'flex', gap: 12 }}>
            {/* Barcode scanner input */}
            <div style={{ position: 'relative', flex: 1 }}>
              <ScanLine size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
              <input
                ref={barcodeRef}
                value={barcodeInput}
                onChange={e => setBarcodeInput(e.target.value)}
                onKeyDown={handleBarcode}
                placeholder="Scan barcode & press Enter..."
                style={{ paddingLeft: 40, background: 'rgba(108,99,255,0.08)', borderColor: 'rgba(108,99,255,0.3)' }}
              />
            </div>
            <div style={{ position: 'relative', flex: 2 }}>
              <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text3)' }} />
              <input
                value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Search products..." style={{ paddingLeft: 40 }}
              />
            </div>
          </div>
        </div>

        {/* Product grid */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12, alignContent: 'start' }}>
          {filtered.map(p => (
            <div
              key={p.id}
              onClick={() => addToCart(p)}
              style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 12, padding: 16, cursor: p.stock_quantity <= 0 ? 'not-allowed' : 'pointer',
                opacity: p.stock_quantity <= 0 ? 0.5 : 1,
                transition: 'all 0.15s', userSelect: 'none',
              }}
              onMouseEnter={e => { if (p.stock_quantity > 0) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.transform = 'none'; }}
            >
              <div style={{
                width: 36, height: 36, borderRadius: 10,
                background: 'var(--surface2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, marginBottom: 10
              }}>🛒</div>
              <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4, lineHeight: 1.3 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>{p.sku}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700, color: 'var(--green)', fontSize: 15 }}>₹{Number(p.selling_price).toFixed(0)}</span>
                <span style={{ fontSize: 11, color: p.stock_quantity <= p.reorder_level ? 'var(--amber)' : 'var(--text3)' }}>
                  {p.stock_quantity} left
                </span>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 60, color: 'var(--text3)' }}>
              No products found
            </div>
          )}
        </div>
      </div>

      {/* Right: Cart */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Cart Header */}
        <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <ShoppingCart size={18} color="var(--accent)" />
            <h3 style={{ fontSize: 16 }}>Cart</h3>
            {cart.length > 0 && (
              <span className="badge badge-purple" style={{ marginLeft: 'auto' }}>{cart.length} items</span>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Customer name (optional)" style={{ flex: 1 }} />
          </div>
        </div>

        {/* Cart Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 20px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text3)' }}>
              <ShoppingCart size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.2 }} />
              <p>Click products to add them</p>
            </div>
          ) : cart.map(item => (
            <CartItem key={item.id} item={item} onQtyChange={changeQty} onRemove={removeFromCart} />
          ))}
        </div>

        {/* Totals */}
        <div style={{ padding: 20, borderTop: '1px solid var(--border)' }}>
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
              <span style={{ color: 'var(--text2)' }}>Subtotal</span>
              <span>₹{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
              <span style={{ color: 'var(--text2)' }}>Tax</span>
              <span>₹{taxAmount.toFixed(2)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6, fontSize: 13 }}>
              <span style={{ color: 'var(--red)' }}>Discount (₹)</span>
              <input
                type="number" value={discount} min={0} onChange={e => setDiscount(Number(e.target.value))}
                style={{ width: 90, textAlign: 'right', background: 'var(--bg3)', padding: '4px 8px' }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid var(--border)', fontWeight: 700, fontSize: 20 }}>
              <span>Total</span>
              <span style={{ color: 'var(--green)' }}>₹{Math.max(0, total).toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Mode */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
            {payModes.map(m => (
              <button
                key={m.id}
                onClick={() => setPaymentMode(m.id)}
                style={{
                  flex: 1, padding: '8px 4px', border: `1px solid ${paymentMode === m.id ? 'var(--accent)' : 'var(--border)'}`,
                  borderRadius: 8, background: paymentMode === m.id ? 'rgba(108,99,255,0.15)' : 'var(--bg3)',
                  color: paymentMode === m.id ? 'var(--accent)' : 'var(--text3)',
                  cursor: 'pointer', fontSize: 12, fontWeight: 500,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  transition: 'all 0.15s'
                }}
              >
                <m.icon size={16} />
                {m.label}
              </button>
            ))}
          </div>

          <button
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15 }}
            onClick={placeBill} disabled={placing || cart.length === 0}
          >
            {placing ? 'Processing...' : `Generate Bill — ₹${Math.max(0, total).toFixed(2)}`}
          </button>
        </div>
      </div>

      {billSuccess && <BillSuccess bill={billSuccess} onClose={() => setBillSuccess(null)} />}
    </div>
  );
}
