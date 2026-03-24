import React, { useEffect, useState } from 'react'
import AnimatedNetworkBackground from './AnimatedNetworkBackground'

const HeroSection = () => {
  const [stats, setStats] = useState({ requests: 0, users: 0, volume: 0 })

  useEffect(() => {
    fetch('https://api.claw.click/admin/stats', {
      headers: { 'x-admin-key': 'ADMIN_API_KEY' },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          console.log('Fetched stats:', data)
          const totalRequests = data.requests?.total ?? 0
          const totalUsers = data.users?.totalGenerated ?? 0
          const buyEth = parseFloat(data.volume?.buyEth || '0')
          const sellEth = parseFloat(data.volume?.sellEth || '0')
          const totalVolumeEth = buyEth + sellEth
          setStats({
            requests: totalRequests,
            users: totalUsers,
            volume: totalVolumeEth,
          })
        }
      })
      .catch(() => {})
  }, [])

  return (
    <section className="hero-section">
      <div className="hero-network-layer">
        <AnimatedNetworkBackground />
      </div>
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title">
            Build any Strategy, Signal or Execution
          </h1>

          <p className="hero-subtitle">
            Aggregate 50+ trading, analytics, and risk data sources into one programmable interface.
            Build powerful trading algorithms with institutional-grade infrastructure.
          </p>

          <div className="hero-stats">
            <div className="hero-stat-item">
              <span className="hero-stat-number">{stats.requests.toLocaleString()}</span>
              <span className="hero-stat-label">Requests</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-number">4</span>
              <span className="hero-stat-label">Blockchains</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-number">35+</span>
              <span className="hero-stat-label">API Endpoints</span>
            </div>
            <div className="hero-stat-item">
              <span className="hero-stat-number">45</span>
              <span className="hero-stat-label">Live Integrations</span>
            </div>
          </div>

          <div className="hero-actions">
            <a href="/api" className="hero-cta-button primary">
              Explore API
            </a>
            <a href="/app" className="hero-cta-button browse-strategies">
              Browse Strategies
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default HeroSection
