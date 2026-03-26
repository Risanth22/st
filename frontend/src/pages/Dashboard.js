import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { IndianRupee, ShoppingBag, AlertTriangle, PackageX, TrendingUp, ArrowUpRight } from 'lucide-react';
import api from '../utils/api';
import { format } from 'date-fns';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div style={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '10px 14px' }}>
        <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{label}</p>
        <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--accent)' }}>₹{Number(payload[0].value).toFixed(0)}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/billing/dashboard')
      .then(res => setData(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="page"><div className="loading-center"><div className="spinner" /></div></div>
  );

  const stats = [
    { label: "Today's Revenue", value: `₹${Number(data?.today?.revenue || 0).toFixed(0)}`, icon: IndianRupee, color: '#6c63ff', bg: 'rgba(108,99,255,0.12)' },
    { label: "Bills Today", value: data?.today?.bills || 0, icon: ShoppingBag, color: '#10b981', bg: 'rgba(16,185,129,0.12)' },
    { label: "Low Stock Items", value: data?.low_stock || 0, icon: PackageX, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)' },
    { label: "Expiry Alerts", value: data?.expiry_alerts || 0, icon: AlertTriangle, color: '#ef4444', bg: 'rgba(239,68,68,0.12)' },
  ];

  const weeklyData = data?.weekly_sales?.map(d => ({
    date: format(new Date(d.date), 'EEE'),
    revenue: parseFloat(d.revenue),
    bills: parseInt(d.bills),
  })) || [];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">{format(new Date(), 'EEEE, MMMM d yyyy')}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', animation: 'pulse 2s ease-in-out infinite' }} />
          <span style={{ fontSize: 13, color: 'var(--text3)' }}>Live</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {stats.map((s, i) => (
          <div key={i} className="stat-card">
            <div className="stat-icon" style={{ background: s.bg }}>
              <s.icon size={22} color={s.color} />
            </div>
            <div>
              <div className="stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom: 24 }}>
        {/* Weekly Chart */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16 }}>Weekly Revenue</h3>
              <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Last 7 days</p>
            </div>
            <TrendingUp size={18} color="var(--accent)" />
          </div>
          {weeklyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={weeklyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: 'var(--text3)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text3)', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={v => `₹${v}`} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(108,99,255,0.05)' }} />
                <Bar dataKey="revenue" fill="var(--accent)" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <p>No sales data yet</p>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div>
              <h3 style={{ fontSize: 16 }}>Top Products</h3>
              <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Last 30 days by revenue</p>
            </div>
            <ArrowUpRight size={18} color="var(--green)" />
          </div>
          {data?.top_products?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {data.top_products.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 8, background: 'var(--surface2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: 700, color: 'var(--text3)', flexShrink: 0
                  }}>{i+1}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.product_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)' }}>{p.total_qty} units sold</div>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--green)' }}>₹{Number(p.total_revenue).toFixed(0)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state" style={{ padding: '40px 0' }}>
              <p>No sales yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Bills */}
      <div className="table-wrap">
        <div style={{ padding: '20px 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: 16, padding: '0 0 16px' }}>Recent Bills</h3>
        </div>
        <table>
          <thead>
            <tr>
              <th>Bill No.</th><th>Customer</th><th>Amount</th><th>Mode</th><th>Cashier</th><th>Time</th>
            </tr>
          </thead>
          <tbody>
            {data?.recent_bills?.length > 0 ? data.recent_bills.map(bill => (
              <tr key={bill.id}>
                <td><code style={{ fontSize: 12, color: 'var(--accent)' }}>{bill.bill_number}</code></td>
                <td>{bill.customer_name || <span style={{ color: 'var(--text3)' }}>Walk-in</span>}</td>
                <td style={{ fontWeight: 600 }}>₹{Number(bill.total_amount).toFixed(2)}</td>
                <td>
                  <span className={`badge badge-${bill.payment_mode === 'cash' ? 'green' : bill.payment_mode === 'upi' ? 'blue' : 'purple'}`}>
                    {bill.payment_mode.toUpperCase()}
                  </span>
                </td>
                <td style={{ color: 'var(--text2)' }}>{bill.cashier_name}</td>
                <td style={{ color: 'var(--text3)', fontSize: 12 }}>{format(new Date(bill.created_at), 'hh:mm a')}</td>
              </tr>
            )) : (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text3)', padding: 40 }}>No bills today</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
