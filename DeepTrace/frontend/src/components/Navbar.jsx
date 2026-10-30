import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ScanEye, Menu, X, ArrowUpRight } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => location.pathname === path;

  return (
    <header className="navbar-wrapper">
      <div className="container">
        <nav className="navbar" aria-label="Main Navigation">
          {/* Brand Logo */}
          <Link to="/" className="brand-logo" onClick={() => setMobileMenuOpen(false)}>
            <div className="brand-icon-box">
              <ScanEye size={20} strokeWidth={2.3} className="brand-icon" />
              <span className="brand-accent-dot" />
            </div>
            <div className="brand-text-group">
              <span className="brand-title">DeepTrace</span>
              <span className="brand-version-tag">Midterm v1.0</span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="nav-links-desktop">
            <Link
              to="/"
              className={`nav-link ${isActive('/') ? 'active' : ''}`}
            >
              Home
            </Link>
            <Link
              to="/image-detection"
              className={`nav-link ${isActive('/image-detection') ? 'active' : ''}`}
            >
              Image Detection
              <span className="nav-link-badge">Active</span>
            </Link>
            <Link
              to="/about"
              className={`nav-link ${isActive('/about') ? 'active' : ''}`}
            >
              About
            </Link>
            <Link
              to="/history"
              className={`nav-link ${isActive('/history') ? 'active' : ''}`}
            >
              History
            </Link>
          </div>

          {/* Right Status Indicator */}
          <div className="nav-right-actions">
            <div className="status-indicator-pill" title="Current Engine Status">
              <span className="status-dot-pulse" />
              <span className="status-pill-text">Image Detection Active</span>
            </div>

            <Link
              to="/image-detection"
              className="btn btn-primary btn-sm nav-cta-btn"
            >
              <span>Inspect Media</span>
              <ArrowUpRight size={15} />
            </Link>

            {/* Mobile Menu Toggle Button */}
            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close Navigation Menu' : 'Open Navigation Menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="mobile-drawer" role="dialog" aria-modal="true">
          <div className="container mobile-drawer-inner">
            <Link
              to="/"
              className={`mobile-nav-link ${isActive('/') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              to="/image-detection"
              className={`mobile-nav-link ${isActive('/image-detection') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Image Detection (Active)
            </Link>
            <Link
              to="/about"
              className={`mobile-nav-link ${isActive('/about') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              About DeepTrace
            </Link>
            <Link
              to="/history"
              className={`mobile-nav-link ${isActive('/history') ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Analysis History
            </Link>

            <div className="mobile-drawer-footer">
              <div className="mobile-status-tag">
                <StatusBadge status="available" label="Image Detection Active" />
              </div>
              <Link
                to="/image-detection"
                className="btn btn-primary btn-lg"
                style={{ width: '100%' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                <span>Launch Image Detector</span>
                <ArrowUpRight size={18} />
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
