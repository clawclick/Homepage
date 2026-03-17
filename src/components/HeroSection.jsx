import React from 'react'

const HeroSection = () => {
  return (
    <section className="hero-section">
      <div className="hero-container">
        <div className="stats-capsule">
          <div className="stats-line-large">
            <div className="stat-item-large">
              <span className="stat-label-large">Requests: </span>
              <span className="stat-value-large stat-red">0</span>
            </div>
            <div className="stat-item-large">
              <span className="stat-label-large">Users: </span>
              <span className="stat-value-large stat-green">0</span>
            </div>
            <div className="stat-item-large">
              <span className="stat-label-large">Volume: </span>
              <span className="stat-value-large stat-yellow">$0</span>
            </div>
            <div className="stat-item-large">
              <span className="stat-label-large">Integrated API's: </span>
              <span className="stat-value-large stat-blue">45</span>
            </div>
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