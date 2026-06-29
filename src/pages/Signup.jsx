import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import './Auth.css';

export default function Signup({ showToast }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithGoogle, signUpWithEmail, currentUser } = useAuth();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  
  const from = location.state?.from?.pathname || '/home';

  useEffect(() => {
    if (currentUser) {
      navigate(from, { replace: true });
    }
  }, [currentUser, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 6) {
      showToast?.('Password must be at least 6 characters', 'error');
      return;
    }
    
    setLoading(true);
    try {
      await signUpWithEmail(email.trim(), password, name.trim());
      showToast?.('Account created successfully 🎉', 'success');
      navigate(from, { replace: true });
    } catch (error) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        showToast?.('This account already exists. Redirecting to login...', 'info');
        navigate('/login', { replace: true, state: { prefillEmail: email } });
      } else if (error.code === 'auth/weak-password') {
        showToast?.('Password should be at least 6 characters', 'error');
      } else {
        showToast?.('Failed to create account. Try again.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    try {
      await signInWithGoogle();
      showToast?.('Successfully signed in with Google!', 'success');
      navigate(from, { replace: true });
    } catch (error) {
      showToast?.(error.message || 'Failed to sign up with Google.', 'error');
      console.error(error);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-page" id="signup-page">
      <div className="auth-bg-grid" />
      <div className="auth-glow auth-glow-1" />
      <div className="auth-glow auth-glow-2" />

      <div className="auth-card animate-scale-in">
        <Link to="/" className="auth-logo">
          <div className="auth-logo-icon">
            <img src="/logo.png" alt="ValiX Logo" className="logo-img" />
          </div>
          <span>ValiX</span>
        </Link>

        <h1 className="auth-title">Create your account</h1>
        <p className="auth-sub">Start validating your startup ideas today</p>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          className={`auth-submit ${googleLoading ? 'loading' : ''}`}
          disabled={googleLoading}
          style={{ marginBottom: '1.5rem', backgroundColor: 'var(--surface)', color: 'var(--text-primary)', border: '1px solid var(--border)', width: '100%' }}
        >
          {googleLoading ? <span className="auth-spinner" style={{ borderColor: 'rgba(0,0,0,0.2)', borderTopColor: '#000' }} /> : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25C22.56 11.47 22.49 10.72 22.36 10H12V14.26H17.92C17.67 15.63 16.89 16.81 15.73 17.58V20.34H19.3C21.39 18.42 22.56 15.6 22.56 12.25Z" fill="#4285F4"/>
                <path d="M12 23C14.97 23 17.46 22.02 19.3 20.34L15.73 17.58C14.74 18.24 13.48 18.66 12 18.66C9.13 18.66 6.71 16.73 5.84 14.15H2.16V16.99C3.98 20.59 7.7 23 12 23Z" fill="#34A853"/>
                <path d="M5.84 14.15C5.62 13.49 5.49 12.76 5.49 12C5.49 11.24 5.62 10.51 5.84 9.85V7.01H2.16C1.42 8.5 1 10.19 1 12C1 13.81 1.42 15.5 2.16 16.99L5.84 14.15Z" fill="#FBBC05"/>
                <path d="M12 5.34C13.62 5.34 15.07 5.9 16.21 6.99L19.38 3.81C17.45 2.02 14.96 1 12 1C7.7 1 3.98 3.41 2.16 7.01L5.84 9.85C6.71 7.27 9.13 5.34 12 5.34Z" fill="#EA4335"/>
              </svg>
              <span>Sign in with Google</span>
            </div>
          )}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', margin: '0 0 1.5rem', color: '#666', fontSize: '0.9rem' }}>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
          <span style={{ padding: '0 10px' }}>or</span>
          <div style={{ flex: 1, height: '1px', backgroundColor: 'rgba(255,255,255,0.1)' }} />
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="signup-name">Full name</label>
            <div className="auth-input-wrap">
              <User size={16} className="auth-input-icon" />
              <input
                id="signup-name"
                type="text"
                autoComplete="name"
                placeholder="Alex Morgan"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="auth-input"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="signup-email">Email</label>
            <div className="auth-input-wrap">
              <Mail size={16} className="auth-input-icon" />
              <input
                id="signup-email"
                type="email"
                autoComplete="off"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="auth-input"
                required
              />
            </div>
          </div>

          <div className="auth-field">
            <label className="auth-label" htmlFor="signup-password">Password</label>
            <div className="auth-input-wrap">
              <Lock size={16} className="auth-input-icon" />
              <input
                id="signup-password"
                type={showPass ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Min. 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="auth-input"
                required
              />
              <button
                type="button"
                className="auth-pass-toggle"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className={`auth-submit ${loading ? 'loading' : ''}`}
            disabled={loading}
            id="signup-submit"
          >
            {loading ? <span className="auth-spinner" /> : (
              <>Create Account <ArrowRight size={16} /></>
            )}
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login" className="auth-switch-link">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
