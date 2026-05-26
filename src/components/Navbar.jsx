import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import {
  Search,
  Plus,
  User,
  LayoutDashboard,
  LogOut,
  Home,
  Compass,
  Settings,
  X,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import './Navbar.css';

export default function Navbar({ showToast }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { searchTermInput, setSearchTerm } = useSearch();
  const [searchFocused, setSearchFocused] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const profileRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfile(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav className="navbar" id="main-navbar">
        <div className="navbar-inner">
          {/* Logo */}
          <Link to="/home" className="navbar-logo" id="nav-logo">
            <div className="navbar-logo-icon">
              <img src="/logo.png" alt="ValiX Logo" className="logo-img" />
            </div>
            <span className="navbar-logo-text">ValiX</span>
          </Link>

          {/* Separator */}
          <div className="navbar-sep" />

          {/* Nav Links — now with icons */}
          <div className="navbar-links">
            <Link
              to="/"
              className={`navbar-link ${isActive('/') ? 'active' : ''}`}
              id="nav-landing"
            >
              <Home size={16} />
              <span>Home</span>
            </Link>
            <Link
              to="/home"
              className={`navbar-link ${isActive('/home') ? 'active' : ''}`}
              id="nav-home"
            >
              <Compass size={16} />
              <span>Explore</span>
            </Link>
            <Link
              to="/dashboard"
              className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}
              id="nav-dashboard"
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </Link>
          </div>

          {/* Right Side: Search + Actions */}
          <div className="navbar-right">
            {/* Search */}
            <div className={`navbar-search ${searchFocused ? 'focused' : ''}`} id="nav-search">
              <Search size={15} className="navbar-search-icon" />
              <input
                type="text"
                placeholder="Search ideas..."
                value={searchTermInput}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (location.pathname !== '/home' && e.target.value.trim() !== '') {
                    navigate('/home');
                  }
                }}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="navbar-search-input"
              />
              {searchTermInput && (
                <button
                  className="navbar-search-clear"
                  onClick={() => setSearchTerm('')}
                  type="button"
                >
                  <X size={14} />
                </button>
              )}
              <div className="navbar-search-shortcut">
                <kbd>⌘</kbd><kbd>K</kbd>
              </div>
            </div>

            {/* Actions cluster */}
            <div className="navbar-actions">

              {currentUser ? (
                <>

                  {/* New Idea CTA */}
                  <Link to="/create" className="navbar-create-btn" id="nav-create">
                    <Plus size={17} strokeWidth={2.5} />
                    <span>New Idea</span>
                  </Link>

                  {/* Profile Avatar */}
                  <div className="navbar-profile-wrap" ref={profileRef}>
                    <button
                      className={`navbar-avatar ${showProfile ? 'active' : ''}`}
                      onClick={() => setShowProfile(!showProfile)}
                      id="nav-avatar"
                    >
                      <span className="navbar-avatar-letter">{currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}</span>
                    </button>
                    {showProfile && (
                      <div className="navbar-dropdown navbar-profile-dropdown animate-fade-in-up">
                        <div className="navbar-profile-header">
                          <div className="navbar-profile-avatar-lg">
                            <span>{currentUser.displayName ? currentUser.displayName[0].toUpperCase() : 'U'}</span>
                          </div>
                          <div className="navbar-profile-info">
                            <div className="navbar-profile-name">{currentUser.displayName || 'User'}</div>
                            <div className="navbar-profile-email">{currentUser.email}</div>
                          </div>
                        </div>
                        <div className="navbar-dropdown-divider" />
                        <Link to="/profile" className="navbar-dropdown-item" onClick={() => setShowProfile(false)}>
                          <User size={15} />
                          Profile
                        </Link>
                        <Link to="/dashboard" className="navbar-dropdown-item" onClick={() => setShowProfile(false)}>
                          <LayoutDashboard size={15} />
                          Dashboard
                        </Link>
                        <Link to="#" className="navbar-dropdown-item" onClick={() => setShowProfile(false)}>
                          <Settings size={15} />
                          Settings
                        </Link>
                        <div className="navbar-dropdown-divider" />
                        <button 
                          className="navbar-dropdown-item navbar-dropdown-danger" 
                          onClick={async () => {
                            setShowProfile(false);
                            try {
                              await logout();
                              showToast?.('Logged out successfully', 'success');
                            } catch(e) {
                              console.error(e);
                            }
                          }}
                          style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          <LogOut size={15} />
                          Sign Out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <Link to="/login" className="navbar-link" style={{ textDecoration: 'none', color: '#ccc' }}>Log in</Link>
                  <Link to="/signup" className="navbar-create-btn" style={{ textDecoration: 'none' }}>Sign up</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </>
  );
}
