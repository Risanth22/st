import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function PnL() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('table');

  useEffect(() => {
    api.get('/billing/pnl')
      .then(r => setData(r.data))
      .catch(() => toast.error('Failed to load P&L'))
      .finally(() => setLoading(false));
  }, []);

  const totalRevenue = data.reduce((s, p) => s + parseFloat(p.revenue || 0), 0);
  const totalCOGS = data.reduce((s, p) => s + parseFloat(p.cogs || 0), 0);
  const totalProfit = data.reduce((s, p) => s + parseFloat(p.gross_profit || 0), 0);
  const overallMargin = totalRevenue ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

  const getColor = (margin) => {
    if (!margin) return 'var(--text3)';
    if (margin >= 25) return 'var(--green)';
    if (margin >= 10) return 'var(--amber)';
    return 'var(--red)';
  };

  const chartData = data.filter(p => p.units_sold > 0).slice(0, 15).map(p => ({
    name: p.name.split(' ').slice(0, 2).join(' '),
    margin: parseFloat(p.margin_percent || 0),
    profit: parseFloat(p.gross_profit || 0),
  }));

  if (loading) return <div className="page"><div className="loading-center"><div className="spinner" /></div></div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Profit & Loss</h1>
          <p className="page-subtitle">Last 30 days performance</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn ${view === 'table' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('table')}>Table</button>
          <button className={`btn ${view === 'chart' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('chart')}>Chart</button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid-4" style={{ marginBottom: 24 }}>
        {[
          { label: 'Total Revenue', value: `₹${totalRevenue.toFixed(0)}`, color: 'var(--green)' },
          { label: 'Cost of Goods', value: `₹${totalCOGS.toFixed(0)}`, color: 'var(--red)' },
          { label: 'Gross Profit', value: `₹${totalProfit.toFixed(0)}`, color: 'var(--accent)' },
          { label: 'Overall Margin', value: `${overallMargin}%`, color: parseFloat(overallMargin) >= 20 ? 'var(--green)' : 'var(--amber)' },
        ].map((s, i) => (
          <div key={i} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'Syne', fontSize: 26, fontWeight: 800, color: s.color, marginBottom: 6 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {view === 'chart' ? (
        <div className="card">
          <h3 style={{ fontSize: 16, marginBottom: 20 }}>Margin % by Product (sold items)</h3>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={chartData} layout="vertical" barSize={16}>
                <XAxis type="number" tick={{ fill: 'var(--text3)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
                <YAxis dataKey="name" type="category" tick={{ fill: 'var(--text2)', fontSize: 12 }} axisLine={false} tickLine={false} width={120} />
                <Tooltip formatter={(v, n) => [`${v}%`, 'Margin']} contentStyle={{ background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8 }} />
                <Bar dataKey="margin" radius={[0,4,4,0]}>
                  {chartData.map((entry, i) => (
                    <Cell key={i} fill={entry.margin >= 25 ? '#10b981' : entry.margin >= 10 ? '#f59e0b' : '#ef4444'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="empty-state">No sales data for chart</div>}
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Product</th>
                <th>Buy Price</th>
                <th>Sell Price</th>
                <th>Margin %</th>
                <th>Units Sold</th>
                <th>Revenue</th>
                <th>COGS</th>
                <th>Gross Profit</th>
              </tr>
            </thead>
            <tbody>
              {data.map(p => (
                <tr key={p.id}>
                  <td>
                    <div style={{ fontWeight: 500 }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{p.sku}</div>
                  </td>
                  <td style={{ color: 'var(--red)' }}>₹{Number(p.purchase_price).toFixed(2)}</td>
                  <td style={{ color: 'var(--green)' }}>₹{Number(p.selling_price).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${parseFloat(p.margin_percent) >= 25 ? 'badge-green' : parseFloat(p.margin_percent) >= 10 ? 'badge-amber' : 'badge-red'}`}>
                      {p.margin_percent || 0}%
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>{p.units_sold}</td>
                  <td style={{ color: 'var(--green)', fontWeight: 600 }}>₹{Number(p.revenue).toFixed(2)}</td>
                  <td style={{ color: 'var(--red)' }}>₹{Number(p.cogs).toFixed(2)}</td>
                  <td style={{ fontWeight: 700, color: getColor(parseFloat(p.margin_percent)) }}>
                    ₹{Number(p.gross_profit).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
