import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { TrendingUp, TrendingDown, Package } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px' }}>
      <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ fontSize: 14, fontWeight: 600, color: p.color }}>
          {p.name}: {p.name === 'revenue' ? `₹${Number(p.value).toFixed(0)}` : p.value}
        </p>
      ))}
    </div>
  );
  return null;
};

export default function Reports() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('daily');
  const [from, setFrom] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split('T')[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split('T')[0]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/billing/reports', { params: { from, to } });
      setData(res.data);
    } catch { toast.error('Failed to load reports'); } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [from, to]);

  const totalRevenue = data?.daily?.reduce((s, d) => s + parseFloat(d.revenue), 0) || 0;
  const totalBills = data?.daily?.reduce((s, d) => s + parseInt(d.bills), 0) || 0;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Sales Reports</h1>
          <p className="page-subtitle">Analyze your store performance</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} style={{ width: 150 }} />
          <span style={{ color: 'var(--text3)' }}>to</span>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} style={{ width: 150 }} />
        </div>
      </div>

      {/* Summary */}
      <div className="grid-3" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Revenue', value: `₹${totalRevenue.toFixed(0)}`, color: 'var(--green)', icon: TrendingUp },
          { label: 'Total Bills', value: totalBills, color: 'var(--accent)', icon: Package },
          { label: 'Avg Bill Value', value: totalBills ? `₹${(totalRevenue / totalBills).toFixed(0)}` : '₹0', color: 'var(--amber)', icon: TrendingDown },
        ].map((s, i) => (
          <div key={i} className="card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: `${s.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <s.icon size={22} color={s.color} />
            </div>
            <div>
              <div style={{ fontFamily: 'Syne', fontSize: 24, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="tabs">
        {['daily', 'products', 'deadstock'].map(t => (
          <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
            {t === 'daily' ? 'Daily Sales' : t === 'products' ? 'Top Products' : 'Dead Stock'}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-center"><div className="spinner" /></div> : (
        <>
          {tab === 'daily' && (
            <div className="card">
              <h3 style={{ fontSize: 16, marginBottom: 20 }}>Daily Revenue Trend</h3>
              {data?.daily?.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.daily.map(d => ({ date: new Date(d.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }), revenue: parseFloat(d.revenue), bills: parseInt(d.bills) }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(108,99,255,0.05)' }} />
                    <Bar dataKey="revenue" name="revenue" fill="var(--accent)" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-state">No sales data in this period</div>
              )}

              <div className="table-wrap" style={{ marginTop: 24 }}>
                <table>
                  <thead><tr><th>Date</th><th>Revenue</th><th>Bills</th><th>Tax</th><th>Discounts</th></tr></thead>
                  <tbody>
                    {data?.daily?.map((d, i) => (
                      <tr key={i}>
                        <td>{new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'short' })}</td>
                        <td style={{ fontWeight: 600, color: 'var(--green)' }}>₹{Number(d.revenue).toFixed(2)}</td>
                        <td>{d.bills}</td>
                        <td style={{ color: 'var(--text2)' }}>₹{Number(d.tax).toFixed(2)}</td>
                        <td style={{ color: 'var(--red)' }}>₹{Number(d.discounts).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {tab === 'products' && (
            <div className="table-wrap">
              <table>
                <thead><tr><th>#</th><th>Product</th><th>Units Sold</th><th>Revenue</th><th>Buy Price</th><th>Avg Sell</th><th>Margin</th></tr></thead>
                <tbody>
                  {data?.top_items?.length === 0 ? (
                    <tr><td colSpan={7}><div className="empty-state">No sales data</div></td></tr>
                  ) : data?.top_items?.map((p, i) => {
                    const margin = p.purchase_price ? ((p.avg_price - p.purchase_price) / p.purchase_price * 100).toFixed(1) : null;
                    return (
                      <tr key={i}>
                        <td style={{ color: 'var(--text3)', fontWeight: 600 }}>#{i+1}</td>
                        <td style={{ fontWeight: 500 }}>{p.product_name}</td>
                        <td>{p.qty}</td>
                        <td style={{ fontWeight: 600, color: 'var(--green)' }}>₹{Number(p.revenue).toFixed(2)}</td>
                        <td style={{ color: 'var(--red)' }}>₹{Number(p.purchase_price || 0).toFixed(2)}</td>
                        <td>₹{Number(p.avg_price).toFixed(2)}</td>
                        <td>
                          {margin && (
                            <span className={`badge ${margin >= 20 ? 'badge-green' : margin >= 10 ? 'badge-amber' : 'badge-red'}`}>
                              {margin}%
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

          {tab === 'deadstock' && (
            <div>
              <div style={{ padding: '16px 20px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 12, marginBottom: 20, display: 'flex', gap: 10, alignItems: 'center' }}>
                <TrendingDown size={18} color="var(--amber)" />
                <p style={{ fontSize: 14, color: 'var(--amber)' }}>Dead stock: products not sold in the last 30 days. Consider discounting or returning to supplier.</p>
              </div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Product</th><th>SKU</th><th>Stock</th><th>Purchase Price</th><th>Stock Value</th><th>Last Sold</th></tr></thead>
                  <tbody>
                    {data?.dead_stock?.length === 0 ? (
                      <tr><td colSpan={6}><div className="empty-state">No dead stock 🎉</div></td></tr>
                    ) : data?.dead_stock?.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 500 }}>{p.name}</td>
                        <td><code style={{ fontSize: 12, color: 'var(--text2)' }}>{p.sku}</code></td>
                        <td><span className="badge badge-amber">{p.stock_quantity} units</span></td>
                        <td>₹{Number(p.purchase_price).toFixed(2)}</td>
                        <td style={{ color: 'var(--red)', fontWeight: 600 }}>₹{(p.stock_quantity * p.purchase_price).toFixed(2)}</td>
                        <td style={{ fontSize: 12, color: 'var(--text3)' }}>
                          {p.last_sold ? new Date(p.last_sold).toLocaleDateString('en-IN') : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
