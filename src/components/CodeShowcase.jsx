import React, { useEffect, useRef, useState } from 'react'
import InteractiveChart from './InteractiveChart'

const RESPONSE_TEXT = `=== TOP NEW SIGNALS ===
{
  ca: "z6eiti618XERFhoB9j5FpbJ7s
       Gf5yTjpw4zp7twpump",
  name: "tinfoil hat cult",
  volume: 45000,
  liquidity: 85000,
  momentum: 0.425,
  score: 87.3,
  providers: [
    "dexScreener",
    "birdeye",
    "pumpfun"
  ]
}`

const useTypewriter = (text, speed = 18) => {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)
  const ref = useRef(null)
  const indexRef = useRef(0)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true) },
      { threshold: 0.4 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    indexRef.current = 0
    setDisplayed('')
    const interval = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1))
        indexRef.current++
      } else {
        clearInterval(interval)
      }
    }, speed)
    return () => clearInterval(interval)
  }, [started, text, speed])

  return [ref, displayed]
}

const CodeShowcase = () => {
  const [responseRef, typedText] = useTypewriter(RESPONSE_TEXT, 16)

  return (
    <section className="code-showcase-section">
      <div className="code-showcase-container">
        <div className="code-showcase-header">
          <span className="code-showcase-tag">Live Examples</span>
          <h2 className="code-showcase-title">Build any Strategy, Signal or Execution</h2>
          <p className="code-showcase-subtitle">
            One unified interface. Every chain, every data source, every execution venue.
          </p>
        </div>

        <div className="code-showcase-grid">
          {/* Left: Code input */}
          <div className="code-panel">
            <div className="code-panel-header">
              <span className="code-panel-dot red" />
              <span className="code-panel-dot yellow" />
              <span className="code-panel-dot green" />
              <span className="code-panel-filename">strategy/newPump.js</span>
              <span className="code-panel-badge">Live Implementation</span>
            </div>
            <div className="code-panel-body">
              <pre>{`// Multi-source token discovery
const newPairs = await fetch(
  "https://api.claw.click/newPairs?source=pumpfun"
)
const trending = await fetch(
  "https://api.claw.click/trendingTokens"
)
const filtered = await fetch(
  "https://api.claw.click/filterTokens?network=sol&minLiquidity=10000"
)

// Enrich with unified data
const enriched = await processTokens(addresses)
const signals = applyFilters(enriched)`}</pre>
            </div>
          </div>

          <div className="code-showcase-arrow">→</div>

          {/* Right: Typewriter response */}
          <div className="code-panel response-panel" ref={responseRef}>
            <div className="code-panel-header">
              <span className="code-panel-dot red" />
              <span className="code-panel-dot yellow" />
              <span className="code-panel-dot green" />
              <span className="code-panel-filename">Aggregated Intelligence</span>
              <span className="code-panel-badge">Live</span>
            </div>
            <div className="code-panel-body">
              <pre className="typewriter-pre">{typedText}<span className="typewriter-cursor" /></pre>
            </div>
          </div>
        </div>

        <div className="code-showcase-grid code-showcase-grid-secondary">
          <div className="code-panel">
            <div className="code-panel-header">
              <span className="code-panel-dot red" />
              <span className="code-panel-dot yellow" />
              <span className="code-panel-dot green" />
              <span className="code-panel-filename">SIGNAL/chartHealth.js</span>
              <span className="code-panel-badge">Signal Analysis</span>
            </div>
            <div className="code-panel-body">
              <pre>{`// Token momentum analysis
const liquidityData = await fetch(
  "https://api.claw.click/liquidityHealth?token=SOL123&window=24h"
)
const volumeMetrics = await fetch(
  "https://api.claw.click/volumeAnalysis?includeRatio=true"
)
const holderMetrics = await fetch(
  "https://api.claw.click/holderDistribution?growth=true"
)

// Calculate composite signal strength
const signalStrength = calculateMomentum({
  liquidity: liquidityData.stability,
  volume: volumeMetrics.mcRatio,
  buyRatio: volumeMetrics.buySellRatio,
  holderGrowth: holderMetrics.growth24h
})`}</pre>
            </div>
          </div>

          <div className="code-showcase-arrow">→</div>

          <div className="code-panel response-panel">
            <div className="code-panel-header">
              <span className="code-panel-dot red" />
              <span className="code-panel-dot yellow" />
              <span className="code-panel-dot green" />
              <span className="code-panel-filename">Signal Visualization</span>
              <span className="code-panel-badge">Interactive</span>
            </div>
            <div className="code-panel-body chart-panel-body">
              <InteractiveChart />
            </div>
          </div>
        </div>

        <div className="code-showcase-cta">
          <a href="/api" className="btn-primary btn-glow">Explore Full API Docs →</a>
        </div>
      </div>
    </section>
  )
}

export default CodeShowcase
