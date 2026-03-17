import React, { useState } from 'react'

const ApiDocs = () => {
  const [activeSection, setActiveSection] = useState('overview')

  const navigationSections = [
    { id: 'overview', label: 'Overview' },
    { id: 'quickstart', label: 'Quick Start' },
    { id: 'supported-chains', label: 'Supported Chains' },
    { id: 'common-response', label: 'Response Format' },
    { id: 'market-data', label: 'Market Data' },
    { id: 'risk-assessment', label: 'Risk Assessment' },
    { id: 'wallet-analysis', label: 'Wallet Analysis' },
    { id: 'trading-dex', label: 'Trading & DEX' },
    { id: 'social-sentiment', label: 'Social & Sentiment' },
    { id: 'discovery-monitoring', label: 'Discovery & Monitoring' },
    { id: 'websockets', label: 'WebSockets' },
    { id: 'error-handling', label: 'Error Handling' },
    { id: 'environment', label: 'Environment Variables' },
    { id: 'integrations', label: 'Data Providers' }
  ]

  const endpointCategories = [
    {
      category: "Core Endpoints",
      description: "Essential API endpoints for health checks and provider status",
      endpoints: [
        {
          method: "GET",
          path: "/health",
          description: "Health check endpoint",
          params: ["None"]
        },
        {
          method: "GET",
          path: "/providers",
          description: "List all registered providers and their configuration status",
          params: ["None"]
        }
      ]
    },
    {
      category: "Market Data",
      description: "Real-time and historical market data for tokens and trading pairs",
      endpoints: [
        {
          method: "GET",
          path: "/tokenPoolInfo",
          description: "Get token price, market cap, liquidity, volume, and pool info",
          params: ["chain", "tokenAddress*", "poolAddress", "symbol", "tokenName"]
        },
        {
          method: "GET",
          path: "/tokenPriceHistory",
          description: "Historical OHLCV price data for charting",
          params: ["chain", "tokenAddress*", "asset", "limit", "interval"]
        },
        {
          method: "GET",
          path: "/detailedTokenStats",
          description: "Bucketed token stats from Codex, cached for 30 minutes",
          params: ["chain", "tokenAddress*", "durations", "bucketCount", "timestamp"]
        },
        {
          method: "GET",
          path: "/gasFeed",
          description: "Current gas prices for EVM chains",
          params: ["chain"]
        }
      ]
    },
    {
      category: "Risk Assessment",
      description: "Comprehensive risk analysis and security audits for tokens",
      endpoints: [
        {
          method: "GET",
          path: "/isScam",
          description: "Quick scam check with risk score and warnings",
          params: ["chain", "tokenAddress*"]
        },
        {
          method: "GET",
          path: "/fullAudit",
          description: "Deep contract audit - taxes, ownership, trading restrictions",
          params: ["chain", "tokenAddress*"]
        }
      ]
    },
    {
      category: "Wallet Analysis",
      description: "Comprehensive wallet tracking and portfolio analysis",
      endpoints: [
        {
          method: "GET",
          path: "/walletReview",
          description: "Comprehensive wallet analysis - PnL, holdings, protocols, activity",
          params: ["chain", "walletAddress*", "days", "pageCount"]
        },
        {
          method: "GET",
          path: "/holderAnalysis",
          description: "Holder distribution, concentration, top holders, whale tracking",
          params: ["chain", "tokenAddress*"]
        },
        {
          method: "GET",
          path: "/tokenHolders",
          description: "Raw token-holder ledger for EVM tokens via Sim by Dune",
          params: ["tokenAddress*", "network", "cursor", "limit"]
        }
      ]
    },
    {
      category: "Trading & DEX",
      description: "DEX trading, swaps, approvals, and liquidity management",
      endpoints: [
        {
          method: "GET",
          path: "/swap",
          description: "Build an unsigned swap transaction",
          params: ["chain*", "dex*", "walletAddress*", "tokenIn*", "tokenOut*", "amountIn*", "slippageBps", "deadline"]
        },
        {
          method: "GET",
          path: "/swapQuote",
          description: "Get a price quote without building the transaction",
          params: ["chain*", "dex*", "tokenIn*", "tokenOut*", "amountIn*", "slippageBps"]
        },
        {
          method: "GET",
          path: "/swapDexes",
          description: "List available DEXes for a chain",
          params: ["chain*"]
        },
        {
          method: "GET",
          path: "/approve",
          description: "Build unsigned approval transaction steps",
          params: ["chain*", "dex*", "walletAddress*", "tokenIn*", "tokenOut*", "amount", "approvalMode", "spender"]
        },
        {
          method: "GET",
          path: "/unwrap",
          description: "Build an unsigned wrapped-native withdraw transaction",
          params: ["chain*", "walletAddress*", "amount*"]
        }
      ]
    },
    {
      category: "Social & Sentiment",
      description: "Social media monitoring and sentiment analysis",
      endpoints: [
        {
          method: "GET",
          path: "/fudSearch",
          description: "Search for FUD mentions across social platforms",
          params: ["chain", "tokenAddress", "symbol", "tokenName"]
        },
        {
          method: "GET",
          path: "/marketOverview",
          description: "Combined sentiment scoring, social signals, prediction markets",
          params: ["chain", "tokenAddress", "asset", "poolAddress", "symbol", "tokenName"]
        }
      ]
    },
    {
      category: "Discovery & Monitoring",
      description: "Token discovery, trending analysis, and market monitoring",
      endpoints: [
        {
          method: "GET",
          path: "/trendingTokens",
          description: "Currently trending tokens across all chains",
          params: ["None"]
        },
        {
          method: "GET",
          path: "/newPairs",
          description: "Recently created trading pairs/pools",
          params: ["source", "limit"]
        },
        {
          method: "GET",
          path: "/topTraders",
          description: "Top traders for a specific token (multi-chain via Birdeye)",
          params: ["chain", "tokenAddress*", "timeFrame"]
        },
        {
          method: "GET",
          path: "/tokenSearch",
          description: "Search for tokens/pairs by name, symbol, or address",
          params: ["query*"]
        },
        {
          method: "GET",
          path: "/filterTokens",
          description: "Filter and rank tokens by on-chain metrics (Codex.io)",
          params: ["network", "phrase", "minLiquidity", "minVolume24", "minMarketCap", "maxMarketCap", "sortBy", "limit"]
        }
      ]
    },
    {
      category: "WebSockets",
      description: "Real-time event streaming and live data feeds",
      endpoints: [
        {
          method: "WS",
          path: "/ws/launchpadEvents",
          description: "Real-time launchpad token event stream",
          params: ["protocol", "protocols", "networkId", "launchpadName", "eventType"]
        }
      ]
    }
  ]

  const integrations = [
    { name: "Moralis", category: "Infrastructure", status: "Live" },
    { name: "Birdeye", category: "Market Data", status: "Live" },
    { name: "DexScreener", category: "Market Data", status: "Live" },
    { name: "Codex.io", category: "Analytics", status: "Live" },
    { name: "Etherscan", category: "Infrastructure", status: "Live" },
    { name: "GoPlus", category: "Risk", status: "Live" },
    { name: "CoinGecko", category: "Market Data", status: "Live" },
    { name: "CoinMarketCap", category: "Market Data", status: "Live" },
    { name: "GeckoTerminal", category: "Market Data", status: "Live" },
    { name: "Zerion", category: "Portfolio", status: "Live" },
    { name: "DeBank", category: "Portfolio", status: "Live" },
    { name: "Arkham", category: "Analytics", status: "Live" },
    { name: "Dune Analytics", category: "Analytics", status: "Live" },
    { name: "Sim by Dune", category: "Analytics", status: "Live" },
    { name: "LunarCrush", category: "Sentiment", status: "Live" },
    { name: "Reddit API", category: "Sentiment", status: "Live" },
    { name: "X (Twitter)", category: "Sentiment", status: "Live" },
    { name: "Telegram", category: "Sentiment", status: "Live" },
    { name: "Bubblemaps", category: "Risk", status: "Live" },
    { name: "QuickIntel", category: "Risk", status: "Live" },
    { name: "Honeypot.is", category: "Risk", status: "Live" },
    { name: "Santiment", category: "Analytics", status: "Live" },
    { name: "DexTools", category: "Market Data", status: "Live" },
    { name: "Nansen", category: "Analytics", status: "Live" },
    { name: "Uniswap V2/V3/V4", category: "DEX", status: "Live" },
    { name: "PancakeSwap V2/V3", category: "DEX", status: "Live" },
    { name: "Aerodrome V2/V3", category: "DEX", status: "Live" },
    { name: "Raydium", category: "DEX", status: "Live" },
    { name: "Meteora", category: "DEX", status: "Live" },
    { name: "Pump.fun", category: "Launchpad", status: "Live" },
    { name: "Clanker", category: "Launchpad", status: "Live" },
    { name: "Virtuals Protocol", category: "Launchpad", status: "Live" }
  ]

  return (
    <div className="api-docs-page">
      {/* Header */}
      <header className="api-docs-header">
        <div className="api-docs-container">
          <div className="api-docs-hero">
            <h1 className="api-docs-title">API Documentation</h1>
            <p className="api-docs-subtitle">
              Unified crypto intelligence API - 50+ data providers behind clean REST endpoints
            </p>
            <div className="api-base-url">
              <span className="base-url-label">Base URL:</span>
              <code className="base-url">http://localhost:3001/api</code>
            </div>
          </div>
        </div>
      </header>

      {/* Quick Start */}
      <section className="quick-start-section">
        <div className="api-docs-container">
          <h2 className="section-title">Quick Start</h2>
          <div className="code-example">
            <div className="code-header">
              <span className="code-language">curl</span>
            </div>
            <pre className="code-block">
{`curl -X GET "http://localhost:3001/api/tokenPoolInfo?chain=eth&tokenAddress=0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" \\
  -H "Content-Type: application/json"

# Response:
{
  "endpoint": "tokenPoolInfo",
  "status": "live",
  "chain": "eth",
  "tokenAddress": "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
  "name": "USD Coin",
  "symbol": "USDC",
  "priceUsd": 1.0001,
  "marketCapUsd": 32000000000,
  "fdvUsd": 32000000000,
  "liquidityUsd": 150000000,
  "volume24hUsd": 5000000000,
  "priceChange24hPct": -0.01,
  "pairAddress": "0x...",
  "dex": "uniswap_v3",
  "providers": [
    { "provider": "dexScreener", "status": "ok", "detail": "Live data" },
    { "provider": "birdeye", "status": "ok", "detail": "Price confirmed" }
  ]
}`}
            </pre>
          </div>
        </div>
      </section>

      {/* Endpoints */}
      <section className="endpoints-section">
        <div className="api-docs-container">
          <h2 className="section-title">API Endpoints</h2>
          
          {endpointCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="endpoint-category">
              <div className="category-header">
                <h3 className="category-title">{category.category}</h3>
                <p className="category-description">{category.description}</p>
              </div>
              
              <div className="endpoints-list">
                {category.endpoints.map((endpoint, endpointIndex) => (
                  <div key={endpointIndex} className="endpoint-item">
                    <div className="endpoint-summary">
                      <span className={`method method-${endpoint.method.toLowerCase()}`}>
                        {endpoint.method}
                      </span>
                      <code className="endpoint-path">{endpoint.path}</code>
                    </div>
                    <p className="endpoint-description">{endpoint.description}</p>
                    <div className="endpoint-params">
                      <span className="params-label">Parameters:</span>
                      {endpoint.params.map((param, paramIndex) => (
                        <code key={paramIndex} className="param-item">
                          {param}
                        </code>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Supported Chains */}
      <section className="chains-section">
        <div className="api-docs-container">
          <h2 className="section-title">Supported Chains</h2>
          <div className="chains-grid">
            <div className="chain-item">
              <div className="chain-header">
                <span className="chain-name">Ethereum</span>
                <span className="chain-id">ID: 1</span>
              </div>
              <span className="chain-status">Full support</span>
            </div>
            <div className="chain-item">
              <div className="chain-header">
                <span className="chain-name">Base</span>
                <span className="chain-id">ID: 8453</span>
              </div>
              <span className="chain-status">Full support</span>
            </div>
            <div className="chain-item">
              <div className="chain-header">
                <span className="chain-name">BSC</span>
                <span className="chain-id">ID: 56</span>
              </div>
              <span className="chain-status">Full support</span>
            </div>
            <div className="chain-item">
              <div className="chain-header">
                <span className="chain-name">Solana</span>
                <span className="chain-id">Non-EVM</span>
              </div>
              <span className="chain-status">Full support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Response Format */}
      <section className="response-format-section">
        <div className="api-docs-container">
          <h2 className="section-title">Common Response Format</h2>
          <p className="response-description">
            Every endpoint returns a consistent JSON structure with provider status tracking:
          </p>
          <div className="code-example">
            <div className="code-header">
              <span className="code-language">json</span>
            </div>
            <pre className="code-block">
{`{
  "endpoint": "endpointName",
  "status": "live" | "partial",
  "providers": [
    {
      "provider": "providerName",
      "status": "ok" | "skipped" | "error",
      "detail": "Additional context..."
    }
  ],
  // ... endpoint-specific data
}`}
            </pre>
          </div>
          <ul className="status-meanings">
            <li><strong>live:</strong> All providers returned data successfully</li>
            <li><strong>partial:</strong> Some providers were skipped or errored, but usable data was returned</li>
            <li><strong>ok:</strong> Provider contributed data successfully</li>
            <li><strong>skipped:</strong> Provider was not configured or not applicable</li>
            <li><strong>error:</strong> Provider encountered an error</li>
          </ul>
        </div>
      </section>

      {/* WebSocket Example */}
      <section className="websocket-section">
        <div className="api-docs-container">
          <h2 className="section-title">WebSocket Streaming</h2>
          <p className="websocket-description">
            Real-time launchpad events via WebSocket connection:
          </p>
          <div className="code-example">
            <div className="code-header">
              <span className="code-language">javascript</span>
            </div>
            <pre className="code-block">
{`const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3001/api/ws/launchpadEvents');

ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.type === 'info') {
    // Send filter for Pump.fun events
    ws.send(JSON.stringify({ protocol: 'PumpDotFun' }));
  } else if (msg.type === 'events') {
    msg.data.forEach(event => {
      console.log(\`New token: \${event.tokenSymbol} — $\${event.marketCap} mcap\`);
    });
  }
});`}
            </pre>
          </div>
        </div>
      </section>

      {/* Integrations */}
      <section className="integrations-section">
        <div className="api-docs-container">
          <h2 className="section-title">Data Sources & Integrations</h2>
            <p className="integrations-description">
              Our API aggregates data from {integrations.length}+ premium sources to provide comprehensive crypto intelligence and trading infrastructure.
            </p>
          
          <div className="integrations-grid">
            {integrations.map((integration, index) => (
              <div key={index} className="integration-item">
                <div className="integration-header">
                  <span className="integration-name">{integration.name}</span>
                  <span className={`integration-status status-${integration.status.toLowerCase()}`}>
                    {integration.status}
                  </span>
                </div>
                <span className="integration-category">{integration.category}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="api-cta-section">
        <div className="api-docs-container">
          <div className="api-cta">
            <h2 className="cta-title">Ready to Build?</h2>
            <p className="cta-description">
              Get your API key and start building with unified trading infrastructure.
            </p>
            <div className="cta-buttons">
              <button className="cta-button primary">Get API Key</button>
              <button className="cta-button secondary">View Examples</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default ApiDocs