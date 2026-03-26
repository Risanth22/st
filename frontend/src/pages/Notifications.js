import React, { useState } from 'react';
import { Bell, MessageCircle, Mail, Smartphone, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Notifications() {
  const [config, setConfig] = useState({
    whatsapp_enabled: false,
    sms_enabled: false,
    email_enabled: true,
    whatsapp_number: '',
    daily_summary_time: '21:00',
    low_stock_alert: true,
    expiry_alert: true,
    sales_summary: true,
  });

  const toggle = (key) => setConfig(c => ({ ...c, [key]: !c[key] }));

  const handleSave = () => {
    toast.success('Notification settings saved!');
  };

  const handleTest = () => {
    toast.success('Test notification sent (simulation)');
  };

  const Toggle = ({ checked, onChange, label, description, icon: Icon, color = 'var(--accent)' }) => (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px',
      background: 'var(--surface)', border: `1px solid ${checked ? color + '40' : 'var(--border)'}`,
      borderRadius: 12, transition: 'all 0.2s', marginBottom: 12
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 10, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={18} color={color} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 500, fontSize: 14 }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{description}</div>}
      </div>
      <button
        onClick={onChange}
        style={{
          width: 44, height: 24, borderRadius: 99, border: 'none', cursor: 'pointer',
          background: checked ? color : 'var(--border2)',
          transition: 'background 0.2s', position: 'relative', flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: checked ? 22 : 3,
          width: 18, height: 18, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s', boxShadow: '0 1px 4px rgba(0,0,0,0.3)'
        }} />
      </button>
    </div>
  );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Configure alerts and daily summaries</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-ghost" onClick={handleTest}><Bell size={15} /> Test Alert</button>
          <button className="btn btn-primary" onClick={handleSave}><CheckCircle size={15} /> Save Settings</button>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 24 }}>
        <div>
          <h3 style={{ fontSize: 16, marginBottom: 16, color: 'var(--text2)' }}>Alert Channels</h3>

          <Toggle
            checked={config.email_enabled} onChange={() => toggle('email_enabled')}
            label="Email Alerts" description="Send alerts to registered email"
            icon={Mail} color="var(--blue)"
          />
          <Toggle
            checked={config.whatsapp_enabled} onChange={() => toggle('whatsapp_enabled')}
            label="WhatsApp Alerts" description="Via Twilio WhatsApp Business API"
            icon={MessageCircle} color="var(--green)"
          />
          <Toggle
            checked={config.sms_enabled} onChange={() => toggle('sms_enabled')}
            label="SMS Alerts" description="Via Twilio SMS"
            icon={Smartphone} color="var(--amber)"
          />

          {config.whatsapp_enabled && (
            <div className="form-group" style={{ marginTop: 16 }}>
              <label>WhatsApp Number (with country code)</label>
              <input
                value={config.whatsapp_number}
                onChange={e => setConfig(c => ({ ...c, whatsapp_number: e.target.value }))}
                placeholder="+919876543210"
              />
            </div>
          )}

          <div className="form-group" style={{ marginTop: 16 }}>
            <label>Daily Summary Time</label>
            <input
              type="time"
              value={config.daily_summary_time}
              onChange={e => setConfig(c => ({ ...c, daily_summary_time: e.target.value }))}
            />
            <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 6 }}>Summary is sent daily at this time via enabled channels</p>
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: 16, marginBottom: 16, color: 'var(--text2)' }}>Alert Types</h3>

          <Toggle
            checked={config.low_stock_alert} onChange={() => toggle('low_stock_alert')}
            label="Low Stock Alerts" description="Alert when stock falls below reorder level"
            icon={Bell} color="var(--amber)"
          />
          <Toggle
            checked={config.expiry_alert} onChange={() => toggle('expiry_alert')}
            label="Expiry Alerts" description="Alert when products expire within 7 days"
            icon={Bell} color="var(--red)"
          />
          <Toggle
            checked={config.sales_summary} onChange={() => toggle('sales_summary')}
            label="Daily Sales Summary" description="End-of-day revenue & bill count report"
            icon={Bell} color="var(--accent)"
          />

          {/* Sample notification preview */}
          <div style={{ marginTop: 24 }}>
            <h4 style={{ fontSize: 14, color: 'var(--text2)', marginBottom: 12 }}>Sample Alert Preview</h4>
            <div style={{
              background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 12,
              padding: 16, fontFamily: 'monospace', fontSize: 13, lineHeight: 1.7, color: 'var(--text2)'
            }}>
              <div style={{ color: 'var(--accent)', fontWeight: 600, marginBottom: 8 }}>📊 Daily Summary - SmartStore</div>
              <div>💰 Revenue: <span style={{ color: 'var(--green)' }}>₹12,450</span></div>
              <div>🧾 Bills: <span style={{ color: 'var(--text)' }}>28</span></div>
              <div>⚠️ Low stock: <span style={{ color: 'var(--amber)' }}>3 items</span></div>
              <div>🔴 Expiring soon: <span style={{ color: 'var(--red)' }}>1 item</span></div>
              <div style={{ color: 'var(--text3)', marginTop: 8, fontSize: 11 }}>
                Sent at 9:00 PM · SmartStore Manager
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
