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
  const [reqRef, reqVal] = useCountUp(0, 1800)
  const [usrRef, usrVal] = useCountUp(0, 1800)
  const [volRef, volVal] = useCountUp(0, 1800, '$')
  const [apiRef, apiVal] = useCountUp(45, 2200)

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
        {/* Big logo */}
        <div className="hero-logo-wrap">
          <img src="/logo.png" alt="Claw.Click" className="hero-big-logo" />
        </div>

        <h1>
          The Universal Router<br />
          for <span className="highlight">Agents</span>.
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

        <div className="hero-stats">
          <div className="stat-item" ref={reqRef}>
            <div className="stat-value">{reqVal}</div>
            <div className="stat-label">Requests</div>
          </div>
          <div className="stat-item" ref={usrRef}>
            <div className="stat-value">{usrVal}</div>
            <div className="stat-label">Users</div>
          </div>
          <div className="stat-item" ref={volRef}>
            <div className="stat-value">{volVal}</div>
            <div className="stat-label">Volume</div>
          </div>
          <div className="stat-item" ref={apiRef}>
            <div className="stat-value">{apiVal}</div>
            <div className="stat-label">Integrated APIs</div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Hero
