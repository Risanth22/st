import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Store, Eye, EyeOff, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('owner@store.com');
  const [password, setPassword] = useState('password');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
      backgroundImage: `
        radial-gradient(ellipse at 20% 20%, rgba(108,99,255,0.08) 0%, transparent 50%),
        radial-gradient(ellipse at 80% 80%, rgba(168,85,247,0.06) 0%, transparent 50%)
      `
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 18,
            background: 'linear-gradient(135deg, var(--accent), #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 0 40px rgba(108,99,255,0.3)'
          }}>
            <Store size={28} color="#fff" />
          </div>
          <h1 style={{ fontSize: 28, marginBottom: 6 }}>SmartStore Manager</h1>
          <p style={{ color: 'var(--text3)', fontSize: 14 }}>Complete retail management platform</p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 20, marginBottom: 6 }}>Sign in</h2>
          <p style={{ color: 'var(--text3)', fontSize: 13, marginBottom: 28 }}>Enter your credentials to continue</p>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Email address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="owner@store.com" required />
            </div>
            <div className="form-group" style={{ position: 'relative' }}>
              <label>Password</label>
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required style={{ paddingRight: 44 }} />
              <button type="button" onClick={() => setShowPw(!showPw)} style={{
                position: 'absolute', right: 12, bottom: 10, background: 'none', border: 'none',
                cursor: 'pointer', color: 'var(--text3)'
              }}>
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 20px', marginTop: 8 }} disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 16, height: 16 }} /> Signing in...</> : <><Zap size={16} /> Sign In</>}
            </button>
          </form>

          <div style={{ marginTop: 24, padding: '16px', background: 'var(--bg3)', borderRadius: 10, border: '1px solid var(--border)' }}>
            <p style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Demo Credentials</p>
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>Email: <code style={{ color: 'var(--accent)' }}>owner@store.com</code></p>
            <p style={{ fontSize: 13, color: 'var(--text2)' }}>Password: <code style={{ color: 'var(--accent)' }}>password</code></p>
          </div>
        </div>
      </div>
    </div>
  );
}
