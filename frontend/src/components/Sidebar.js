import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Package, ShoppingCart, Truck, BarChart2,
  TrendingUp, AlertTriangle, Bell, Users, LogOut, Store, ChevronRight
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['owner','manager','cashier'] },
  { path: '/inventory', label: 'Inventory', icon: Package, roles: ['owner','manager'] },
  { path: '/billing', label: 'Billing / POS', icon: ShoppingCart, roles: ['owner','manager','cashier'] },
  { path: '/suppliers', label: 'Suppliers', icon: Truck, roles: ['owner','manager'] },
  { path: '/reports', label: 'Sales Reports', icon: BarChart2, roles: ['owner','manager'] },
  { path: '/pnl', label: 'Profit & Loss', icon: TrendingUp, roles: ['owner'] },
  { path: '/expiry', label: 'Expiry Alerts', icon: AlertTriangle, roles: ['owner','manager'] },
  { path: '/notifications', label: 'Notifications', icon: Bell, roles: ['owner'] },
  { path: '/users', label: 'Users & Roles', icon: Users, roles: ['owner'] },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const allowedItems = navItems.filter(item => item.roles.includes(user?.role));

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div style={{ padding: '24px 20px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, var(--accent), #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Store size={18} color="#fff" />
          </div>
          <div>
            <div style={{ fontFamily: 'Syne', fontWeight: 800, fontSize: 15, letterSpacing: '-0.02em' }}>
              SmartStore
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Manager Pro</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
        {allowedItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/'}
            style={{ textDecoration: 'none' }}
          >
            {({ isActive }) => (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, marginBottom: 2,
                background: isActive ? 'rgba(108,99,255,0.15)' : 'transparent',
                color: isActive ? 'var(--accent)' : 'var(--text3)',
                transition: 'all 0.15s',
                cursor: 'pointer',
                fontSize: 14, fontWeight: isActive ? 500 : 400,
              }}
              onMouseEnter={e => { if(!isActive) e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)'; }}
              onMouseLeave={e => { if(!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text3)'; }}}
              >
                <item.icon size={16} />
                <span style={{ flex: 1 }}>{item.label}</span>
                {isActive && <ChevronRight size={14} />}
              </div>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User */}
      <div style={{ padding: '16px 12px', borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'var(--bg3)' }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--accent), var(--pink))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0
          }}>
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user?.name}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'capitalize' }}>{user?.role}</div>
          </div>
          <button onClick={handleLogout} className="btn-icon" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', padding: 4, borderRadius: 6 }}
            title="Logout">
            <LogOut size={15} />
          </button>
        </div>
      </div>
    </aside>
  );
}
