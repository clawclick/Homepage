import React from 'react'
import AnimatedNetworkBackground from './AnimatedNetworkBackground'

const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="hero-network-layer">
        <AnimatedNetworkBackground />
      </div>
      <div className="hero-container">
        <div className="stats-grid">
          <div className="stat-box">
            <span className="stat-label-large">Requests</span>
            <span className="stat-value-large stat-purple">0</span>
          </div>
          <div className="stat-box">
            <span className="stat-label-large">Users</span>
            <span className="stat-value-large stat-purple">0</span>
          </div>
          <div className="stat-box">
            <span className="stat-label-large">Volume</span>
            <span className="stat-value-large stat-purple">$0</span>
          </div>
          <div className="stat-box">
            <span className="stat-label-large">Integrated API's</span>
            <span className="stat-value-large stat-purple">45</span>
          </div>
        </div>
        
        <div className="hero-logo-section">
          <img 
            src="/main-logo.png" 
            alt="Claw.Click Logo" 
            className="hero-big-logo"
          />
        </div>
      </div>
    </section>
  )
}

export default HeroSection