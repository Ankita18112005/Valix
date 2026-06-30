import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Lightbulb, MessageSquare, BarChart3,
  ArrowRight, Star, ChevronRight, ExternalLink, Mail,
  User, LayoutDashboard, ShieldCheck, LogOut
} from 'lucide-react';
import Stepper, { Step } from '../components/Stepper';
import LightRays from '../components/LightRays';
import SplitText from '../components/ui/SplitText';
import { SparklesCore } from '../components/ui/SparklesCore';
import { useAuth } from '../context/AuthContext';
import './Landing.css';
import '../components/Navbar.css';

export default function Landing({ showToast }) {
  const { currentUser, logout } = useAuth();
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
  
  return (
    <div className="landing" id="landing-page">
      {/* Navbar */}
      <nav className="landing-nav">
        <div className="landing-nav-inner">
          <Link to="/" className="landing-logo">
            <div className="landing-logo-icon">
              <img src="/logo.png" alt="ValiX Logo" className="logo-img" />
            </div>
            <span>ValiX</span>
          </Link>
          <div className="landing-nav-links">
            {currentUser ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <Link to="/home" className="landing-nav-link" style={{ marginRight: '0.5rem' }}>Explore</Link>
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
              </div>
            ) : (
              <>
                <Link to="/login" className="landing-nav-link">Log In</Link>
                <Link to="/signup" className="landing-nav-btn">
                  Get Started
                  <ArrowRight size={16} />
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="hero" id="hero-section">
        <div className="hero-bg-grid" />
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />

        <div style={{ position: 'absolute', inset: 0, zIndex: 0, opacity: 0.5, pointerEvents: 'none' }}>
          <LightRays
            raysOrigin="top-center"
            raysColor="#1A9A8A"
            raysSpeed={1}
            lightSpread={0.5}
            rayLength={3}
            followMouse={true}
            mouseInfluence={0.1}
            noiseAmount={0}
            distortion={0}
            className="custom-rays"
            pulsating={false}
            fadeDistance={1}
            saturation={1}
          />
        </div>

        <div className="hero-content">
          <div className="hero-text-content" style={{ position: 'relative', zIndex: 10 }}>
            
            {/* Heading */}
            <div style={{ marginBottom: "1rem" }}>
              <SplitText
                text="Validate Ideas Before You Build"
                className="hero-heading animate-fade-in-up delay-1 inline-block"
                delay={30}
                duration={0.8}
                tag="h1"
              />
            </div>
            
            {/* Subheading & CTAs */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", position: "relative", zIndex: 20 }}>
              <p className="hero-sub animate-fade-in-up delay-2" style={{ maxWidth: "600px", color: "var(--text-secondary)", margin: "0 auto 2rem auto" }}>
                Build with confidence. Connect with early adopters and validate your
                startup ideas using our interactive platform.
              </p>
              
              <div className="hero-ctas animate-fade-in-up delay-3" style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <Link to="/signup" className="btn-primary-lg">
                  Get Started Free
                  <ArrowRight size={18} />
                </Link>
                <Link to={currentUser ? "/home" : "#"} onClick={(e) => {
                  if (!currentUser) {
                    e.preventDefault();
                    showToast?.("At first you have to login", "info");
                  }
                }} className="btn-secondary-lg">
                  Explore Ideas
                  <ChevronRight size={18} />
                </Link>
              </div>
            </div>

            {/* Sparkles Container underneath the CTAs */}
            <div style={{ width: "40rem", height: "8rem", position: "relative", maxWidth: '100%', marginTop: "2.5rem" }}>
              {/* Glowing Top Border Lines */}
              <div style={{ position: "absolute", left: "10%", right: "10%", top: 0, background: "linear-gradient(to right, transparent, var(--primary), transparent)", height: "2px", width: "80%", filter: "blur(3px)" }} />
              <div style={{ position: "absolute", left: "10%", right: "10%", top: 0, background: "linear-gradient(to right, transparent, var(--primary), transparent)", height: "1px", width: "80%" }} />
              <div style={{ position: "absolute", left: "25%", right: "25%", top: 0, background: "linear-gradient(to right, transparent, var(--gradient-hero), transparent)", height: "5px", width: "50%", filter: "blur(3px)" }} />
              <div style={{ position: "absolute", left: "25%", right: "25%", top: 0, background: "linear-gradient(to right, transparent, var(--gradient-hero), transparent)", height: "1px", width: "50%" }} />

              {/* Core Particles with correct transparency mask */}
              <div style={{ width: "100%", height: "100%", position: "absolute", inset: 0, maskImage: "radial-gradient(350px 150px at top, black, transparent)", WebkitMaskImage: "radial-gradient(350px 150px at top, black, transparent)" }}>
                <SparklesCore
                  id="tsparticlesfullpage"
                  background="transparent"
                  minSize={0.4}
                  maxSize={1.2}
                  particleDensity={800}
                  className="w-full h-full"
                  particleColor="#1A9A8A"
                />
              </div>
            </div>
            
          </div>
        </div>
      </section>

      {/* Features — Interactive Stepper */}
      <section className="features-section" id="features-section">
        <div className="features-inner">
          <div className="section-header animate-fade-in-up">
            <h2 className="section-title">From idea to validation in minutes</h2>
            <p className="section-sub">A structured approach to testing your startup hypothesis before investing time and money.</p>
          </div>
          <Stepper
            initialStep={1}
            backButtonText="Previous"
            nextButtonText="Next"
            onFinalStepCompleted={() => { showToast?.("You've completed the tour! Sign up to start validating.", "success"); }}
          >
            <Step>
              <div className="step-content-wrapper">
                <div className="step-icon"><Lightbulb size={24} /></div>
                <h3>Post Your Ideas</h3>
                <p>Share startup concepts with a structured framework — problem, solution, target users, and monetization strategy. Our guided template ensures you cover every angle investors and users care about.</p>
                <span className="step-number">01</span>
              </div>
            </Step>
            <Step>
              <div className="step-content-wrapper">
                <div className="step-icon"><MessageSquare size={24} /></div>
                <h3>Get Real Feedback</h3>
                <p>Receive actionable feedback from entrepreneurs and builders who rate your idea on clarity, demand, and feasibility. No vanity metrics — just honest, structured validation from people who build.</p>
                <span className="step-number">02</span>
              </div>
            </Step>
            <Step>
              <div className="step-content-wrapper">
                <div className="step-icon"><BarChart3 size={24} /></div>
                <h3>Analyze & Iterate</h3>
                <p>Track validation scores, vote trends, and community sentiment to refine your idea before building. Use data-driven insights to pivot, persist, or move on with confidence.</p>
                <span className="step-number">03</span>
              </div>
            </Step>
          </Stepper>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section" id="cta-section">
        <div className="cta-inner animate-fade-in-up">
          <h2 className="cta-title">Ready to validate your next big idea?</h2>
          <p className="cta-sub">Join thousands of founders using ValiX to build with confidence.</p>
          <Link to="/signup" className="btn-primary-lg">
            Start Validating — It's Free
            <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer" id="landing-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <div className="landing-logo">
              <div className="landing-logo-icon">
                <img src="/logo.png" alt="ValiX Logo" className="logo-img" />
              </div>
              <span>ValiX</span>
            </div>
            <p className="footer-tagline">Validate before you build.</p>
          </div>
          <div className="footer-links">
            <div className="footer-col">
              <h4 className="footer-col-title">Product</h4>
              <a href="#" className="footer-link">Features</a>
              <a href="#" className="footer-link">Pricing</a>
              <a href="#" className="footer-link">Changelog</a>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Company</h4>
              <a href="#" className="footer-link">About</a>
              <a href="#" className="footer-link">Blog</a>
              <a href="#" className="footer-link">Careers</a>
            </div>
            <div className="footer-col">
              <h4 className="footer-col-title">Connect</h4>
              <a href="https://github.com/Ankita18112005/Valix" target="_blank" rel="noopener noreferrer" className="footer-link"><ExternalLink size={14} /> GitHub</a>
              <a href="#" className="footer-link"><Mail size={14} /> Contact</a>
            </div>
          </div>
          <div className="footer-bottom">
            <span>© 2026 ValiX. All rights reserved.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
