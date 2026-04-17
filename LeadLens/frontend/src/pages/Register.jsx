// src/pages/Register.jsx
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { Zap, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import toast from 'react-hot-toast';
import './Auth.css';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
    setLoading(true);
    try {
      await register(form.name, form.email, form.password);
      toast.success('Account created! Welcome to Prospera.');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-glow auth-bg-glow--1" />
      <div className="auth-bg-glow auth-bg-glow--2" />

      <div className="auth-card glass-card z-content animate-fade-up">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Zap size={20} fill="currentColor" /></div>
          <span className="auth-logo-text">PROSPERA</span>
        </div>

        <div className="auth-header">
          <h1 className="auth-title">Start prospecting</h1>
          <p className="auth-sub">Free account — 50 leads included, no card required</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <div>
            <label className="input-label">Full Name</label>
            <div className="input-wrap">
              <User size={15} className="input-icon" />
              <input type="text" required className="input input--icon" placeholder="Jane Smith"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="input-label">Email Address</label>
            <div className="input-wrap">
              <Mail size={15} className="input-icon" />
              <input type="email" required className="input input--icon" placeholder="you@company.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>

          <div>
            <label className="input-label">Password</label>
            <div className="input-wrap">
              <Lock size={15} className="input-icon" />
              <input type={showPw ? 'text' : 'password'} required className="input input--icon input--pw"
                placeholder="At least 8 characters"
                value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} />
              <button type="button" className="pw-toggle" onClick={() => setShowPw(s => !s)}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-jade w-full" disabled={loading} style={{ marginTop: 4 }}>
            {loading ? <><div className="spinner" />Creating account...</> : 'Create Free Account'}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account? <Link to="/login" className="auth-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
