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
                    style={{ 
                      '--badge-color': feature.highlightColor,
                      '--badge-rgb': feature.highlightColor === '#10b981' ? '16, 185, 129' :
                                     feature.highlightColor === '#06b6d4' ? '6, 182, 212' :
                                     feature.highlightColor === '#f59e0b' ? '245, 158, 11' :
                                     feature.highlightColor === '#3b82f6' ? '59, 130, 246' :
                                     feature.highlightColor === '#8b5cf6' ? '139, 92, 246' :
                                     '239, 68, 68'
                    }}
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
<span className="comment">// Multi-source token discovery</span>
<span className="keyword">const</span> [<span className="variable">newPairs</span>, <span className="variable">trending</span>, <span className="variable">filtered</span>] = <span className="keyword">await</span> <span className="function">Promise.all</span>([
  <span className="function">fetch</span>(<span className="string">"https://api.claw.click/newPairs?source=pumpfun"</span>),
  <span className="function">fetch</span>(<span className="string">"https://api.claw.click/trendingTokens"</span>),
  <span className="function">fetch</span>(<span className="string">"https://api.claw.click/filterTokens?network=sol&minLiquidity=10000"</span>)
]);

<span className="comment">// Enrich with unified data</span>
<span className="keyword">const</span> <span className="variable">enriched</span> = <span className="keyword">await</span> <span className="function">processTokens</span>(<span className="variable">addresses</span>);
<span className="keyword">const</span> <span className="variable">signals</span> = <span className="function">applyFilters</span>(<span className="variable">enriched</span>);
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
=== TOP NEW SIGNALS ===
{"{"}
  <span className="json-key">ca</span>: <span className="json-string">"z6eiti618XERFhoB9j5FpbJ7sGf5yTjpw4zp7twpump"</span>,
  <span className="json-key">name</span>: <span className="json-string">"tinfoil hat cult"</span>, 
  <span className="json-key">volume</span>: <span className="json-number">45000</span>,
  <span className="json-key">liquidity</span>: <span className="json-number">85000</span>,
  <span className="json-key">momentum</span>: <span className="json-number">0.425</span>,
  <span className="json-key">score</span>: <span className="json-number">87.3</span>,
  <span className="json-key">providers</span>: [<span className="json-string">"dexScreener"</span>, <span className="json-string">"birdeye"</span>, <span className="json-string">"pumpfun"</span>]
{"}"}
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