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
  X,
  Clock,
  Trash2,
  Menu,
  ShieldCheck,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import './Navbar.css';

export default function Navbar({ showToast }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const { searchTermInput, setSearchTerm, clearSearch, searchInputRef, recentSearches, clearRecentSearches } = useSearch();
  const [searchFocused, setSearchFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapRef = useRef(null);

  // Close suggestions on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchWrapRef.current && !searchWrapRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSuggestionClick = (term) => {
    setSearchTerm(term);
    setShowSuggestions(false);
    if (location.pathname !== '/home') {
      navigate('/home');
    }
  };
  const [showProfile, setShowProfile] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const mobileMenuRef = useRef(null);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleMobileClick = (e) => {
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(e.target)) {
        setMobileMenuOpen(false);
      }
    };
    if (mobileMenuOpen) {
      document.addEventListener('mousedown', handleMobileClick);
    }
    return () => document.removeEventListener('mousedown', handleMobileClick);
  }, [mobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

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
          {/* Mobile Hamburger */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

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
            <div className={`navbar-search ${searchFocused ? 'focused' : ''}`} id="nav-search" ref={searchWrapRef}>
              <Search size={15} className="navbar-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search ideas, tags, creators..."
                value={searchTermInput}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setShowSuggestions(false);
                  if (location.pathname !== '/home' && e.target.value.trim() !== '') {
                    navigate('/home');
                  }
                }}
                onFocus={() => {
                  setSearchFocused(true);
                  if (!searchTermInput) setShowSuggestions(true);
                }}
                onBlur={() => {
                  setSearchFocused(false);
                }}
                className="navbar-search-input"
              />
              {searchTermInput && (
                <button
                  className="navbar-search-clear"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    clearSearch();
                    searchInputRef.current?.focus();
                    setShowSuggestions(true);
                  }}
                  type="button"
                >
                  <X size={14} />
                </button>
              )}
              {!searchTermInput && (
                <div className="navbar-search-shortcut">
                  <kbd>⌘</kbd><kbd>K</kbd>
                </div>
              )}

              {/* Recent Search Suggestions */}
              {showSuggestions && recentSearches.length > 0 && !searchTermInput && (
                <div className="search-suggestions animate-fade-in-up">
                  <div className="search-suggestions-header">
                    <span className="search-suggestions-label">Recent Searches</span>
                    <button className="search-suggestions-clear" onMouseDown={(e) => e.preventDefault()} onClick={clearRecentSearches}>
                      <Trash2 size={12} /> Clear
                    </button>
                  </div>
                  {recentSearches.map((term, i) => (
                    <button
                      key={i}
                      className="search-suggestion-item"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => handleSuggestionClick(term)}
                    >
                      <Clock size={13} />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              )}
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
                        <Link to="/admin" className="navbar-dropdown-item" onClick={() => setShowProfile(false)}>
                          <ShieldCheck size={15} />
                          Admin
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

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div 
            className="mobile-menu-overlay" 
            ref={mobileMenuRef}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="mobile-menu-panel">
              <Link to="/" className={`mobile-menu-item ${isActive('/') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <Home size={18} />
                <span>Home</span>
              </Link>
              <Link to="/home" className={`mobile-menu-item ${isActive('/home') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <Compass size={18} />
                <span>Explore</span>
              </Link>
              <Link to="/dashboard" className={`mobile-menu-item ${isActive('/dashboard') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <LayoutDashboard size={18} />
                <span>Dashboard</span>
              </Link>
              <Link to="/admin" className={`mobile-menu-item ${isActive('/admin') ? 'active' : ''}`} onClick={() => setMobileMenuOpen(false)}>
                <ShieldCheck size={18} />
                <span>Admin</span>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
