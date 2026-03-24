import React, { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import DotGrid from './DotGrid'

const useCountUp = (end, duration = 2000, prefix = '', suffix = '') => {
  const [display, setDisplay] = useState(prefix + '0' + suffix)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const start = performance.now()
          const animate = (now) => {
            const elapsed = now - start
            const progress = Math.min(elapsed / duration, 1)
            const eased = 1 - Math.pow(1 - progress, 3)
            const current = Math.round(eased * end)
            setDisplay(prefix + current.toLocaleString() + suffix)
            if (progress < 1) requestAnimationFrame(animate)
          }
          requestAnimationFrame(animate)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [end, duration, prefix, suffix])

  return [ref, display]
}

const Hero = () => {
  const [liveRequests, setLiveRequests] = useState(0)

  useEffect(() => {
    fetch('https://api.claw.click/admin/stats/requests', {
      headers: { 'x-admin-key': 'ADMIN_API_KEY' },
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        console.log('Fetched request stats:', data)
        if (data) {
          const allTimeTotal = data.allTime?.total ?? 0
          setLiveRequests(allTimeTotal)
        }
      })
      .catch(() => {})
  }, [])

  const [reqRef, reqVal] = useCountUp(liveRequests, 1800)
  const [chainRef, chainVal] = useCountUp(4, 1200)
  const [apiRef, apiVal] = useCountUp(35, 1600, '', '+')
  const [intRef, intVal] = useCountUp(37, 2000, '', '/50')

  return (
    <section className="hero">
      {/* Animated gradient orbs */}
      <div className="hero-orbs" aria-hidden="true">
        <div className="hero-orb hero-orb--purple" />
        <div className="hero-orb hero-orb--blue" />
        <div className="hero-orb hero-orb--pink" />
      </div>
      <div className="hero-noise" aria-hidden="true" />
      <div className="hero-dot-grid">
        <DotGrid />
      </div>

      <div className="hero-content">
        <div className="hero-main">
          <div className="hero-copy">
            <h1>
              The Universal Trading Router<br />
              for <span className="highlight">AI Agents</span>.
            </h1>

            <p className="hero-subtitle">
              One API to connect your trading agents to every chain, every DEX,
              and every data source. Built for speed, reliability, and scale.
            </p>

            <div className="hero-actions">
              <Link to="/app" className="btn-premium btn-glow">
                Start Building →
              </Link>
              <Link to="/api" className="btn-secondary">
                View API Docs
              </Link>
            </div>
          </div>

          <div className="hero-logo-wrap">
            <img src="/logo8.webp" alt="Claw.Click" className="hero-big-logo" />
          </div>
        </div>

        <div className="hero-stats">
          <div className="stat-item" ref={reqRef}>
            <div className="stat-value">{reqVal}</div>
            <div className="stat-label">Requests</div>
          </div>
          <div className="stat-item" ref={chainRef}>
            <div className="stat-value">{chainVal}</div>
            <div className="stat-label">Blockchains</div>
          </div>
          <div className="stat-item" ref={apiRef}>
            <div className="stat-value">{apiVal}</div>
            <div className="stat-label">API Endpoints</div>
          </div>
          <div className="stat-item" ref={intRef}>
            <div className="stat-value">{intVal}</div>
            <div className="stat-label">Live Integrations</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
