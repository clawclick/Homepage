import React from 'react'

const ValueProp = () => {
  const features = [
    {
      title: "Unified API Interface",
      description: "One endpoint to rule them all. Instead of managing 50+ integrations, interact with a single standardized interface.",
      highlight: "50+ Data Sources",
      highlightColor: "#10b981" // green
    },
    {
      title: "Enterprise Security",
      description: "Bank-level security with rate limiting, authentication, and risk management built-in.",
      highlight: "Production Ready",
      highlightColor: "#06b6d4" // cyan
    },
    {
      title: "Multi-Chain Support",
      description: "Trade across Ethereum, Solana, Base, and BSC with seamless cross-chain functionality.",
      highlight: "4 Blockchains",
      highlightColor: "#f59e0b" // amber
    },
    {
      title: "Real-Time Analytics",
      description: "Access live market data, sentiment analysis, and risk scoring with microsecond latency.",
      highlight: "Live Data",
      highlightColor: "#3b82f6" // blue
    },
    {
      title: "AI Agent Ready",
      description: "Purpose-built for AI trading agents with structured responses and predictable schemas.",
      highlight: "Agent Optimized",
      highlightColor: "#8b5cf6" // purple
    },
    {
      title: "Strategy Wrappers",
      description: "Package trading strategies as API endpoints. Monetize your alpha without revealing logic.",
      highlight: "Novel Architecture",
      highlightColor: "#ef4444" // red
    }
  ]

  return (
    <section className="value-prop-section">
      <div className="value-prop-container">
        <header className="value-prop-header">
          <h2 className="value-prop-title">
            Why Developers Choose Claw.Click
          </h2>
          <p className="value-prop-subtitle">
            Stop managing multiple APIs, rate limits, and inconsistent data formats. 
            Focus on building great products with our unified trading infrastructure.
          </p>
        </header>
        
        <div className="features-grid">
          {features.map((feature, index) => (
            <div key={index} className="feature-card glassy">
              <div className="feature-content">
                <div className="feature-header">
                  <h3 className="feature-title">{feature.title}</h3>
                  <span 
                    className="feature-highlight glassy-badge"
                    style={{ backgroundColor: feature.highlightColor }}
                  >
                    {feature.highlight}
                  </span>
                </div>
                <p className="feature-description">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="api-showcase">
          <h3 className="showcase-title">Universal Router For Agents</h3>
          <div className="code-showcase">
            <div className="code-block-showcase">
              <div className="code-header">
                <span className="code-language">Strategy: newPump.js</span>
                <span className="status-live">Live Implementation</span>
              </div>
              <div className="code-content">
                <pre>
{`// Multi-source token discovery
const [newPairs, trending, filtered] = await Promise.all([
  fetch("https://api.claw.click/newPairs?source=pumpfun"),
  fetch("https://api.claw.click/trendingTokens"),
  fetch("https://api.claw.click/filterTokens?network=sol&minLiquidity=10000")
]);

// Enrich with unified data
const enriched = await processTokens(addresses);
const signals = applyFilters(enriched);`}
                </pre>
              </div>
            </div>
            
            <div className="arrow-showcase">→</div>
            
            <div className="response-showcase">
              <div className="response-header">
                <span>Aggregated Intelligence</span>
              </div>
              <div className="response-content">
                <pre>
{`🎯 === TOP NEW SIGNALS ===
{
  ca: "z6eiti618XERFhoB9j5FpbJ7sGf5yTjpw4zp7twpump",
  name: "tinfoil hat cult", 
  volume: 45000,
  liquidity: 85000,
  momentum: 0.425,
  score: 87.3,
  providers: ["dexScreener", "birdeye", "pumpfun"]
}`}
                </pre>
              </div>
            </div>
          </div>
          
          <div className="showcase-cta">
            <a href="/api" className="showcase-button">
              Explore Full API Documentation →
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}

export default ValueProp