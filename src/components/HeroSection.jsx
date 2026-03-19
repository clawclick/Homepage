import React from 'react'
import AnimatedNetworkBackground from './AnimatedNetworkBackground'

const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="hero-network-layer">
        <AnimatedNetworkBackground />
      </div>
      <div className="hero-container">
        <div className="hero-content">
          <div className="hero-logo-section">
            <img 
              src="/main-logo.png" 
              alt="Claw.Click Logo" 
              className="hero-big-logo"
            />
          </div>
          
          <h1 className="hero-title">
            Unified Trading Infrastructure
          </h1>
          
          <p className="hero-subtitle">
            Aggregate 50+ trading, analytics, and risk data sources into one programmable interface. 
            Build powerful trading algorithms with institutional-grade infrastructure.
          </p>
          
          <div className="hero-stats">
            <div className="hero-stat-item">
              <span className="hero-stat-number">50+</span>
              <span className="hero-stat-label">Data Sources</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-number">4</span>
              <span className="hero-stat-label">Blockchains</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-number">30+</span>
              <span className="hero-stat-label">API Endpoints</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-number">24/52</span>
              <span className="hero-stat-label">Live Integrations</span>
            </div>
          </div>
          
          <div className="hero-actions">
            <a href="/api" className="hero-cta-button primary">
              Explore API
            </a>
            <a href="/app" className="hero-cta-button secondary">
              Browse Strategies
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection