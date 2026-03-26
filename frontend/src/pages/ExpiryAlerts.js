import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, CheckCircle, Package } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function ExpiryAlerts() {
  const [alerts, setAlerts] = useState([]);
  const [lowStock, setLowStock] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('expiry');

  const load = async () => {
    setLoading(true);
    try {
      const [exp, low] = await Promise.all([
        api.get('/alerts/expiry'),
        api.get('/alerts/low-stock'),
      ]);
      setAlerts(exp.data);
      setLowStock(low.data);
    } catch { toast.error('Failed to load alerts'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const getStatusConfig = (status) => ({
    expired: { badge: 'badge-red', icon: AlertTriangle, color: 'var(--red)', label: 'Expired' },
    critical: { badge: 'badge-amber', icon: Clock, color: 'var(--amber)', label: 'Critical (≤7 days)' },
    warning: { badge: 'badge-blue', icon: Clock, color: 'var(--blue)', label: 'Warning (≤30 days)' },
  }[status] || { badge: 'badge-gray', label: status });

  const expiredCount = alerts.filter(a => a.status === 'expired').length;
  const criticalCount = alerts.filter(a => a.status === 'critical').length;
  const warningCount = alerts.filter(a => a.status === 'warning').length;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Alerts</h1>
          <p className="page-subtitle">Expiry & stock alerts</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Expired', value: expiredCount, color: 'var(--red)', bg: 'rgba(239,68,68,0.1)' },
          { label: 'Critical (≤7d)', value: criticalCount, color: 'var(--amber)', bg: 'rgba(245,158,11,0.1)' },
          { label: 'Warning (≤30d)', value: warningCount, color: 'var(--blue)', bg: 'rgba(59,130,246,0.1)' },
          { label: 'Low Stock', value: lowStock.length, color: 'var(--accent)', bg: 'rgba(108,99,255,0.1)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={20} color={s.color} />
            </div>
            <div>
              <div style={{ fontFamily: 'Syne', fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="tabs">
        <button className={`tab-btn ${tab === 'expiry' ? 'active' : ''}`} onClick={() => setTab('expiry')}>
          Expiry Alerts ({alerts.length})
        </button>
        <button className={`tab-btn ${tab === 'stock' ? 'active' : ''}`} onClick={() => setTab('stock')}>
          Low Stock ({lowStock.length})
        </button>
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <>
          {tab === 'expiry' && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Product</th><th>SKU</th><th>Stock</th><th>Status</th><th>Expiry Date</th><th>Days Left</th></tr>
                </thead>
                <tbody>
                  {alerts.length === 0 ? (
                    <tr><td colSpan={6}>
                      <div className="empty-state">
                        <CheckCircle size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3, color: 'var(--green)' }} />
                        <h3>No expiry alerts</h3>
                        <p>All products are within safe expiry range</p>
                      </div>
                    </td></tr>
                  ) : alerts.map(a => {
                    const cfg = getStatusConfig(a.status);
                    return (
                      <tr key={a.id} style={{ background: a.status === 'expired' ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
                        <td style={{ fontWeight: 500 }}>{a.name}</td>
                        <td><code style={{ fontSize: 12, color: 'var(--text2)' }}>{a.sku}</code></td>
                        <td>{a.stock_quantity} units</td>
                        <td><span className={`badge ${cfg.badge}`}>{cfg.label}</span></td>
                        <td style={{ fontSize: 13 }}>{new Date(a.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                        <td>
                          {a.days_left < 0 ? (
                            <span style={{ color: 'var(--red)', fontWeight: 600 }}>{Math.abs(a.days_left)} days ago</span>
                          ) : (
                            <span style={{ color: a.days_left <= 7 ? 'var(--amber)' : 'var(--text2)', fontWeight: 600 }}>
                              {a.days_left} days
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'stock' && (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Product</th><th>Category</th><th>Current Stock</th><th>Reorder Level</th><th>Shortage</th></tr>
                </thead>
                <tbody>
                  {lowStock.length === 0 ? (
                    <tr><td colSpan={5}>
                      <div className="empty-state">
                        <Package size={40} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
                        <h3>All stock levels are healthy!</h3>
                      </div>
                    </td></tr>
                  ) : lowStock.map(p => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{p.name}</div>
                        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.sku}</div>
                      </td>
                      <td><span className="badge badge-blue" style={{ fontSize: 11 }}>{p.category_name}</span></td>
                      <td>
                        <span style={{ color: p.stock_quantity <= 0 ? 'var(--red)' : 'var(--amber)', fontWeight: 700, fontSize: 16 }}>
                          {p.stock_quantity}
                        </span>
                        <span style={{ color: 'var(--text3)', fontSize: 12, marginLeft: 4 }}>{p.unit}</span>
                      </td>
                      <td style={{ color: 'var(--text2)' }}>{p.reorder_level}</td>
                      <td>
                        <span style={{ color: 'var(--red)', fontWeight: 600 }}>
                          -{Math.max(0, p.reorder_level - p.stock_quantity)} needed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
