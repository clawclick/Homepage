import React, { useState, useEffect } from 'react'

const ApiDocs = () => {
  const [activeSection, setActiveSection] = useState('overview')
  const [quickStartResponse, setQuickStartResponse] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const navigationSections = [
    { id: 'overview', label: 'Overview' },
    { id: 'quickstart', label: 'Quick Start' },
    { id: 'chains', label: 'Supported Chains' },
    { id: 'response-format', label: 'Response Format' },
    { id: 'core-endpoints', label: 'Core Endpoints' },
    { id: 'market-data', label: 'Market Data' },
    { id: 'risk-assessment', label: 'Risk Assessment' },
    { id: 'trading-dex', label: 'Trading & DEX' },
    { id: 'websockets', label: 'WebSockets' },
    { id: 'error-handling', label: 'Error Handling' },
    { id: 'integrations', label: 'Data Providers' }
  ]

  useEffect(() => {
    const handleScroll = () => {
      const sectionEls = navigationSections.map(s => document.getElementById(s.id))
      let activeId = 'overview'
      for (let i = sectionEls.length - 1; i >= 0; i--) {
        const el = sectionEls[i]
        if (el && el.offsetTop <= window.scrollY + 120) { activeId = el.id; break }
      }
      setActiveSection(activeId)
    }
    window.addEventListener('scroll', handleScroll)
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const scrollToSection = (id) => {
    const el = document.getElementById(id)
    if (el) window.scrollTo({ top: el.offsetTop - 88, behavior: 'smooth' })
  }

  const runQuickStartExample = () => {
    setIsLoading(true)
    setTimeout(() => {
      setQuickStartResponse({
        endpoint: "tokenPoolInfo",
        status: "live",
        chain: "eth",
        tokenAddress: "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
        name: "USD Coin",
        symbol: "USDC",
        priceUsd: 1.0001,
        marketCapUsd: 32000000000,
        liquidityUsd: 150000000,
        volume24hUsd: 5000000000,
        dex: "uniswap_v3",
        providers: [
          { provider: "dexScreener", status: "ok", detail: "Live data" },
          { provider: "birdeye", status: "ok", detail: "Price confirmed" }
        ]
      })
      setIsLoading(false)
    }, 1500)
  }

  const supportedChains = [
    { name: "Ethereum", id: "eth / ethereum", chainId: "1", status: "Full support" },
    { name: "Base", id: "base", chainId: "8453", status: "Full support" },
    { name: "BSC", id: "bsc / bnb", chainId: "56", status: "Full support" },
    { name: "Solana", id: "sol / solana", chainId: "Non-EVM", status: "Full support" }
  ]

  const coreEndpoints = [
    { method: "GET", path: "/health", description: "Health check endpoint", parameters: [],
      example: "GET https://api.claw.click/health",
      response: `{ "status": "ok", "service": "super-api" }` },
    { method: "GET", path: "/providers", description: "List all registered providers and their configuration status", parameters: [],
      example: "GET https://api.claw.click/providers",
      response: `{
  "providers": [
    { "id": "moralis", "label": "Moralis", "category": "walletTracking", "configured": true },
    { "id": "birdeye", "label": "Birdeye", "category": "marketData", "configured": true }
  ]
}` }
  ]

  const marketDataEndpoints = [
    { method: "GET", path: "/tokenPoolInfo",
      description: "Get token price, market cap, liquidity, volume, and pool info.",
      parameters: [
        { name: "chain", type: "string", required: false, def: "eth", desc: "Chain to query" },
        { name: "tokenAddress", type: "string", required: true, def: "—", desc: "Token contract address" },
        { name: "poolAddress", type: "string", required: false, def: "—", desc: "Specific pool address" },
      ],
      example: "GET https://api.claw.click/tokenPoolInfo?chain=eth&tokenAddress=0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48",
      response: `{
  "endpoint": "tokenPoolInfo",
  "status": "live",
  "chain": "eth",
  "name": "USD Coin",
  "symbol": "USDC",
  "priceUsd": 1.0001,
  "marketCapUsd": 32000000000,
  "liquidityUsd": 150000000,
  "volume24hUsd": 5000000000,
  "dex": "uniswap_v3",
  "providers": [...]
}` },
    { method: "GET", path: "/tokenPriceHistory",
      description: "Historical OHLCV price data for charting.",
      parameters: [
        { name: "chain", type: "string", required: false, def: "eth", desc: "Chain" },
        { name: "tokenAddress", type: "string", required: true, def: "—", desc: "Token address or major symbol" },
        { name: "limit", type: "string", required: false, def: "3m", desc: "Time range: 1d, 7d, 1m, 3m, 1y" },
        { name: "interval", type: "string", required: false, def: "1d", desc: "Candle interval: 5m, 15m, 1h, 4h, 1d" },
      ],
      example: "GET https://api.claw.click/tokenPriceHistory?chain=sol&tokenAddress=So111...&limit=7d&interval=1h",
      response: `{
  "endpoint": "tokenPriceHistory",
  "status": "live",
  "chain": "sol",
  "points": [
    { "timestamp": 1710000000, "priceUsd": 150.5, "open": 150, "high": 152, "low": 149, "close": 150.5, "volume": 1000000 }
  ],
  "providers": [...]
}` },
    { method: "GET", path: "/detailedTokenStats",
      description: "Bucketed token stats — volume, price, liquidity, and trader-count deltas.",
      parameters: [
        { name: "chain", type: "string", required: false, def: "eth", desc: "Chain" },
        { name: "tokenAddress", type: "string", required: true, def: "—", desc: "Token address" },
        { name: "durations", type: "string", required: false, def: "hour1,day1", desc: "Comma-separated: min5, hour1, hour4, hour12, day1" },
      ],
      example: "GET https://api.claw.click/detailedTokenStats?chain=eth&tokenAddress=0xC02...&durations=hour1,day1",
      response: `{
  "endpoint": "detailedTokenStats",
  "status": "live",
  "durations": {
    "hour1": {
      "statsUsd": {
        "volume": { "currentValue": 13839617.47, "change": -0.3094 },
        "close": { "currentValue": 2344.03, "change": 0.0058 }
      }
    }
  },
  "providers": [...]
}` }
  ]

  const riskEndpoints = [
    { method: "GET", path: "/isScam", description: "Quick scam check — returns risk level and warnings.",
      parameters: [
        { name: "chain", type: "string", required: false, def: "eth", desc: "Chain" },
        { name: "tokenAddress", type: "string", required: true, def: "—", desc: "Token address" },
      ],
      example: "GET https://api.claw.click/isScam?chain=bsc&tokenAddress=0x...",
      response: `{
  "endpoint": "isScam",
  "isScam": false,
  "risk": "low",
  "riskLevel": 1,
  "warnings": [],
  "providers": [...]
}` },
    { method: "GET", path: "/fullAudit", description: "Deep contract audit — taxes, ownership, holder stats, gas simulation.",
      parameters: [
        { name: "chain", type: "string", required: false, def: "eth", desc: "Chain" },
        { name: "tokenAddress", type: "string", required: true, def: "—", desc: "Token address" },
      ],
      example: "GET https://api.claw.click/fullAudit?chain=eth&tokenAddress=0x...",
      response: `{
  "endpoint": "fullAudit",
  "summary": { "isScam": false, "risk": "medium", "riskLevel": 2, "warnings": ["High sell tax"] },
  "taxes": { "buyTax": 1, "sellTax": 5, "transferTax": 0 },
  "contract": { "openSource": true, "isProxy": false, "isMintable": false },
  "holders": { "holderCount": 5000, "ownerPercent": 5 },
  "providers": [...]
}` }
  ]

  const tradingEndpoints = [
    { method: "GET", path: "/swap",
      description: "Build an unsigned swap transaction. The caller signs and submits it.",
      parameters: [
        { name: "chain", type: "string", required: true, def: "—", desc: "Chain: eth, base, bsc, sol" },
        { name: "dex", type: "string", required: true, def: "—", desc: "DEX name" },
        { name: "walletAddress", type: "string", required: true, def: "—", desc: "Wallet that will sign" },
        { name: "tokenIn", type: "string", required: true, def: "—", desc: "Input token address" },
        { name: "tokenOut", type: "string", required: true, def: "—", desc: "Output token address" },
        { name: "amountIn", type: "string", required: true, def: "—", desc: "Amount in raw units" },
        { name: "slippageBps", type: "number", required: false, def: "50", desc: "Slippage tolerance in bps" },
      ],
      example: "GET https://api.claw.click/swap?chain=eth&dex=uniswapV3&walletAddress=0x...&tokenIn=0x...&tokenOut=0x...&amountIn=1000000000000000000",
      response: `{
  "endpoint": "swap",
  "status": "live",
  "tx": {
    "to": "0xRouterAddress",
    "data": "0xcalldata...",
    "value": "0x0",
    "chainId": 1,
    "gasLimit": "0x30000"
  },
  "providers": [...]
}` }
  ]

  const errorExamples = [
    { type: "Validation Error (400)", response: `{ "error": "Validation error", "message": "Invalid query parameters: tokenAddress — Required" }` },
    { type: "Invalid Chain (400)", response: `{ "error": "Invalid chain", "message": "Unsupported chain. Valid: eth, base, bsc, sol" }` },
    { type: "Not Found (404)", response: `{ "error": "Not found", "message": "Route does not exist." }` },
    { type: "Server Error (500)", response: `{ "error": "Internal server error", "message": "Something went wrong." }` },
  ]

  const integrations = [
    { name: "Moralis", category: "Infrastructure" }, { name: "Birdeye", category: "Market Data" },
    { name: "DexScreener", category: "Market Data" }, { name: "Codex.io", category: "Analytics" },
    { name: "Etherscan", category: "Infrastructure" }, { name: "GoPlus", category: "Risk" },
    { name: "CoinGecko", category: "Market Data" }, { name: "CoinMarketCap", category: "Market Data" },
    { name: "GeckoTerminal", category: "Market Data" }, { name: "Zerion", category: "Portfolio" },
    { name: "DeBank", category: "Portfolio" }, { name: "Arkham", category: "Analytics" },
    { name: "Dune Analytics", category: "Analytics" }, { name: "LunarCrush", category: "Sentiment" },
    { name: "Reddit API", category: "Sentiment" }, { name: "X (Twitter)", category: "Sentiment" },
    { name: "Bubblemaps", category: "Risk" }, { name: "QuickIntel", category: "Risk" },
    { name: "Honeypot.is", category: "Risk" }, { name: "Nansen", category: "Analytics" },
    { name: "Uniswap V2/V3/V4", category: "DEX" }, { name: "PancakeSwap V2/V3", category: "DEX" },
    { name: "Aerodrome V2/V3", category: "DEX" }, { name: "Raydium", category: "DEX" },
    { name: "Meteora", category: "DEX" }, { name: "Pump.fun", category: "Launchpad" },
    { name: "Clanker", category: "Launchpad" }, { name: "Virtuals Protocol", category: "Launchpad" },
    { name: "Santiment", category: "Analytics" }, { name: "DexTools", category: "Market Data" },
    { name: "Sim by Dune", category: "Analytics" }, { name: "Telegram", category: "Sentiment" },
  ]

  const CodeBlock = ({ children }) => (
    <div className="api-code-example">
      <pre className="api-code-pre">{children}</pre>
    </div>
  )

  const JsonBlock = ({ children }) => (
    <div className="api-code-example api-json-block">
      <pre className="api-code-pre">{children}</pre>
    </div>
  )

  const EndpointCard = ({ endpoint }) => (
    <div className="api-endpoint-card">
      <div className="api-endpoint-header">
        <span className={`api-method api-method-${endpoint.method.toLowerCase()}`}>{endpoint.method}</span>
        <code className="api-endpoint-path">{endpoint.path}</code>
      </div>
      <p className="api-endpoint-desc">{endpoint.description}</p>

      {endpoint.parameters.length > 0 && (
        <div className="api-params-section">
          <h4 className="api-params-title">Parameters</h4>
          <div className="api-params-table">
            <div className="api-params-row api-params-header-row">
              <span>Name</span><span>Type</span><span>Required</span><span>Default</span><span>Description</span>
            </div>
            {endpoint.parameters.map((p, i) => (
              <div key={i} className="api-params-row">
                <code>{p.name}</code>
                <span className="api-param-type">{p.type}</span>
                <span className={p.required ? 'api-param-req' : 'api-param-opt'}>{p.required ? 'Yes' : 'No'}</span>
                <code>{p.def}</code>
                <span>{p.desc}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="api-example-section">
        <h4>Example</h4>
        <CodeBlock>{endpoint.example}</CodeBlock>
      </div>
      <div className="api-response-section">
        <h4>Response</h4>
        <JsonBlock>{endpoint.response}</JsonBlock>
      </div>
    </div>
  )

  return (
    <div className="api-docs">
      <aside className="api-sidebar">
        <div className="api-sidebar-inner">
          <h3 className="api-sidebar-title">API Documentation</h3>
          <nav className="api-sidebar-nav">
            {navigationSections.map(s => (
              <button
                key={s.id}
                className={`api-nav-item ${activeSection === s.id ? 'active' : ''}`}
                onClick={() => scrollToSection(s.id)}
              >
                {s.label}
              </button>
            ))}
          </nav>
        </div>
      </aside>

      <div className="api-main">
        {/* Overview */}
        <section className="api-hero-section" id="overview">
          <h1 className="api-hero-title">Super API Documentation</h1>
          <p className="api-hero-subtitle">Unified Crypto Intelligence API — 50+ data providers behind clean REST endpoints</p>
          <div className="api-base-url-bar">
            <span className="api-base-label">Base URL</span>
            <code className="api-base-url-code">https://api.claw.click</code>
          </div>
        </section>

        {/* Quick Start */}
        <section className="api-section" id="quickstart">
          <h2 className="api-section-title">Quick Start</h2>
          <div className="api-quickstart-box">
            <CodeBlock>{`curl -X GET "https://api.claw.click/tokenPoolInfo?chain=eth&tokenAddress=0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48" \\
  -H "Content-Type: application/json"`}</CodeBlock>
            <button className="api-run-btn" onClick={runQuickStartExample} disabled={isLoading}>
              {isLoading ? 'Running...' : 'Run'}
            </button>
            {quickStartResponse && (
              <div className="api-quickstart-response">
                <h4>Response</h4>
                <JsonBlock>{JSON.stringify(quickStartResponse, null, 2)}</JsonBlock>
              </div>
            )}
          </div>
        </section>

        {/* Chains */}
        <section className="api-section" id="chains">
          <h2 className="api-section-title">Supported Chains</h2>
          <div className="api-chains-grid">
            {supportedChains.map((c, i) => (
              <div key={i} className="api-chain-card">
                <div className="api-chain-top">
                  <span className="api-chain-name">{c.name}</span>
                  <span className="api-chain-id">ID: {c.chainId}</span>
                </div>
                <span className="api-chain-alias">{c.id}</span>
                <span className="api-chain-status">{c.status}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Response Format */}
        <section className="api-section" id="response-format">
          <h2 className="api-section-title">Response Format</h2>
          <p className="api-section-desc">Every endpoint returns a consistent JSON structure with provider status tracking:</p>
          <JsonBlock>{`{
  "endpoint": "endpointName",
  "status": "live" | "partial",
  "providers": [
    { "provider": "name", "status": "ok" | "skipped" | "error", "detail": "..." }
  ]
}`}</JsonBlock>
        </section>

        {/* Core */}
        <section className="api-section" id="core-endpoints">
          <h2 className="api-section-title">Core Endpoints</h2>
          {coreEndpoints.map((e, i) => <EndpointCard key={i} endpoint={e} />)}
        </section>

        {/* Market Data */}
        <section className="api-section" id="market-data">
          <h2 className="api-section-title">Market Data</h2>
          {marketDataEndpoints.map((e, i) => <EndpointCard key={i} endpoint={e} />)}
        </section>

        {/* Risk */}
        <section className="api-section" id="risk-assessment">
          <h2 className="api-section-title">Risk Assessment</h2>
          {riskEndpoints.map((e, i) => <EndpointCard key={i} endpoint={e} />)}
        </section>

        {/* Trading */}
        <section className="api-section" id="trading-dex">
          <h2 className="api-section-title">Trading & DEX</h2>
          <div className="api-dex-table">
            <table>
              <thead><tr><th>Chain</th><th>Supported DEXes</th></tr></thead>
              <tbody>
                <tr><td>Ethereum</td><td>uniswapV2, uniswapV3, uniswapV4</td></tr>
                <tr><td>Base</td><td>uniswapV2, uniswapV3, uniswapV4, aerodromeV2, aerodromeV3</td></tr>
                <tr><td>BSC</td><td>pancakeswapV2, pancakeswapV3</td></tr>
                <tr><td>Solana</td><td>raydium, meteora, pumpfun</td></tr>
              </tbody>
            </table>
          </div>
          {tradingEndpoints.map((e, i) => <EndpointCard key={i} endpoint={e} />)}
        </section>

        {/* WebSockets */}
        <section className="api-section" id="websockets">
          <h2 className="api-section-title">WebSocket Streaming</h2>
          <CodeBlock>{`const ws = new WebSocket('wss://api.claw.click/ws/launchpadEvents');
ws.on('message', (data) => {
  const msg = JSON.parse(data);
  if (msg.type === 'info') {
    ws.send(JSON.stringify({ protocol: 'PumpDotFun' }));
  } else if (msg.type === 'events') {
    msg.data.forEach(e => console.log(\`New: \${e.tokenSymbol} — $\${e.marketCap}\`));
  }
});`}</CodeBlock>
        </section>

        {/* Errors */}
        <section className="api-section" id="error-handling">
          <h2 className="api-section-title">Error Handling</h2>
          {errorExamples.map((e, i) => (
            <div key={i} className="api-error-block">
              <h4 className="api-error-type">{e.type}</h4>
              <JsonBlock>{e.response}</JsonBlock>
            </div>
          ))}
        </section>

        {/* Integrations */}
        <section className="api-section" id="integrations">
          <h2 className="api-section-title">Data Sources & Integrations</h2>
          <p className="api-section-desc">{integrations.length}+ premium data sources powering comprehensive crypto intelligence.</p>
          <div className="api-integrations-grid">
            {integrations.map((item, i) => (
              <div key={i} className="api-integration-chip">
                <span className="api-integration-name">{item.name}</span>
                <span className="api-integration-cat">{item.category}</span>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="api-cta-section">
          <h2>Ready to Build?</h2>
          <p>Get your API key and start building with unified trading infrastructure.</p>
          <div className="api-cta-actions">
            <button className="btn-primary">Get API Key</button>
            <button className="btn-secondary">View Examples</button>
          </div>
        </section>
      </div>
    </div>
  )
}

export default ApiDocs
