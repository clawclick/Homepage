import React from 'react'
import { Link } from 'react-router-dom'

const CTA = () => {
  return (
    <section className="cta">
      <div className="cta-card cta-card--glow holographic-card">
        <div className="cta-card-inner">
          <h2>Ready to ship <span className="text-gradient">autonomous</span>?</h2>
          <p>
            Get your API key and start routing trades in minutes.
            No setup fees, no contracts.
          </p>
          <div className="cta-actions">
            <Link to="/app" className="btn-premium btn-glow">
              Get API Key →
            </Link>
            <Link to="/api" className="btn-secondary">
              Read the Docs
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CTA
