import React from 'react'

const ValueProp = () => {
  const features = [
    {
      icon: "⚡",
      title: "Unified API Interface",
      description: "One endpoint to rule them all. Instead of managing 50+ integrations, interact with a single standardized interface.",
      highlight: "50+ Data Sources"
    },
    {
      icon: "🔒",
      title: "Enterprise Security",
      description: "Bank-level security with rate limiting, authentication, and risk management built-in.",
      highlight: "Production Ready"
    },
    {
      icon: "🌐",
      title: "Multi-Chain Support",
      description: "Trade across Ethereum, Solana, Base, and BSC with seamless cross-chain functionality.",
      highlight: "4 Blockchains"
    },
    {
      icon: "📊",
      title: "Real-Time Analytics",
      description: "Access live market data, sentiment analysis, and risk scoring with microsecond latency.",
      highlight: "Live Data"
    },
    {
      icon: "🤖",
      title: "AI Agent Ready",
      description: "Purpose-built for AI trading agents with structured responses and predictable schemas.",
      highlight: "Agent Optimized"
    },
    {
      icon: "⚙️",
      title: "Strategy Wrappers",
      description: "Package trading strategies as API endpoints. Monetize your alpha without revealing logic.",
      highlight: "Novel Architecture"
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
            <div key={index} className="feature-card">
              <div className="feature-icon">{feature.icon}</div>
              <div className="feature-content">
                <div className="feature-header">
                  <h3 className="feature-title">{feature.title}</h3>
                  <span className="feature-highlight">{feature.highlight}</span>
                </div>
                <p className="feature-description">{feature.description}</p>
              </div>
            </div>
          ))}
        </div>
        
        <div className="api-showcase">
          <h3 className="showcase-title">Unified Trading Infrastructure</h3>
          <div className="code-showcase">
            <div className="code-block-showcase">
              <div className="code-header">
                <span className="code-language">curl</span>
                <span className="status-live">Live API</span>
              </div>
              <div className="code-content">
                <pre>
{`curl "https://api.claw.click/tokenPoolInfo" \\
  -H "x-api-key: YOUR_KEY" \\
  -G -d "chain=eth" \\
  -d "tokenAddress=0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"`}
                </pre>
              </div>
            </div>
            
            <div className="arrow-showcase">→</div>
            
            <div className="response-showcase">
              <div className="response-header">
                <span>Unified Response</span>
              </div>
              <div className="response-content">
                <pre>
{`{
  "status": "live",
  "name": "USD Coin",
  "symbol": "USDC", 
  "priceUsd": 1.0001,
  "marketCapUsd": 32000000000,
  "liquidityUsd": 150000000,
  "providers": [
    {"provider": "dexScreener", "status": "ok"},
    {"provider": "birdeye", "status": "ok"}
  ]
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