import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ApiDocs = () => {
  const navigate = useNavigate()
  const [activeSection, setActiveSection] = useState('overview')
  const [expandedEndpoint, setExpandedEndpoint] = useState(null)
  const [responses, setResponses] = useState({})
  const [loading, setLoading] = useState({})
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [copiedCommand, setCopiedCommand] = useState('')
  const [quickStartLanguage, setQuickStartLanguage] = useState('curl')
  const [websocketLanguage, setWebsocketLanguage] = useState('node.js')
  const touchStartRef = useRef({ x: 0, y: 0 })

  const navigationSections = useMemo(() => [
    { id: 'overview', label: 'Overview' },
    { id: 'quickstart', label: 'Quick Start' },
    { id: 'endpoints', label: 'API Endpoints' },
    { id: 'auth', label: 'Authentication' },
    { id: 'chains', label: 'Supported Chains' },
    { id: 'websockets', label: 'WebSockets' },
    { id: 'error-handling', label: 'Error Handling' },
    { id: 'integrations', label: 'Capabilities' },
    { id: 'x402', label: 'x402', tone: 'muted' },
    { id: 'my-api', label: 'My Api', path: '/api/my-api', tone: 'muted' }
  ], [])
  const scrollSections = useMemo(() => navigationSections.filter((section) => !section.path), [navigationSections])

  const x402Pricing = useMemo(() => [
    { method: 'GET', path: '/holderAnalysis', price: '$0.0037', note: 'Holder concentration and whale distribution analysis' },
    { method: 'GET', path: '/tokenPriceHistory', price: '$0.0013', note: 'Historical OHLCV price history' },
    { method: 'GET', path: '/tokenPoolInfo', price: '$0.0001', note: 'Token price, liquidity, volume, and pool details' },
    { method: 'GET', path: '/marketOverview', price: '$0.0070', note: 'Market, risk, and sentiment overview' },
    { method: 'GET', path: '/isScam', price: '$0.0001', note: 'Fast token risk screen' },
    { method: 'GET', path: '/tokenSearch', price: '$0.0001', note: 'Search tokens by name, symbol, or address' },
    { method: 'GET', path: '/detailedTokenStats', price: '$0.0005', note: 'Detailed token statistics across time windows' },
    { method: 'GET', path: '/priceHistoryIndicators', price: '$0.0013', note: 'Price history with indicators and signal summary' },
    { method: 'GET', path: '/rateMyEntry', price: '$0.0018', note: 'Swing-trade entry score with levels and checks' },
    { method: 'GET', path: '/filterTokens', price: '$0.0005', note: 'Filter tokens by liquidity, volume, market cap, and more' },
    { method: 'GET', path: '/volatilityScanner', price: '$0.0096', note: 'Volatility scan for swing setups' },
    { method: 'GET', path: '/fullAudit', price: '$0.0001', note: 'Deep token audit with taxes and trading flags' },
    { method: 'GET', path: '/holders', price: '$0.0032', note: 'Top holder rows for a token' },
    { method: 'GET', path: '/fudSearch', price: '$0.0065', note: 'Search social mentions for FUD signals' },
    { method: 'GET', path: '/walletReview', price: '$0.0132', note: 'Comprehensive wallet review' },
    { method: 'GET', path: '/pnl', price: '$0.0007', note: 'Wallet PnL summary' },
    { method: 'GET', path: '/xSearch', price: '$0.0033', note: 'Search recent X posts' },
    { method: 'GET', path: '/xCountRecent', price: '$0.0019', note: 'Count recent X posts for a query' },
    { method: 'GET', path: '/xUserByUsername', price: '$0.0013', note: 'Look up an X user profile' },
    { method: 'GET', path: '/xUserLikes', price: '$0.0039', note: 'Get liked X posts for a user' },
    { method: 'GET', path: '/xUserFollowers', price: '$0.0039', note: 'Get followers for an X user' },
    { method: 'POST', path: '/tokenScreener', price: '$0.0013', note: 'Token screening by smart-money flow and filters' },
    { method: 'POST', path: '/addressRelatedWallets', price: '$0.0013', note: 'Related wallet lookups and linked activity' },
    { method: 'POST', path: '/jupiterDcas', price: '$0.0013', note: 'Active DCA order insights for a token' },
    { method: 'POST', path: '/smartMoneyNetflow', price: '$0.0065', note: 'Smart-money inflow and outflow analytics' },
    { method: 'GET', path: '/trendingTokens', price: '$0.0001', note: 'Trending token discovery' },
    { method: 'GET', path: '/getTopEthTokens', price: '$0.0001', note: 'Top Ethereum token listings' },
    { method: 'GET', path: '/getNewEthTradableTokens', price: '$0.0001', note: 'New tradable Ethereum token listings' },
    { method: 'GET', path: '/newPairs', price: '$0.0001', note: 'New token pairs and pools' },
    { method: 'GET', path: '/topTraders', price: '$0.0004', note: 'Top trader wallets and activity' },
    { method: 'GET', path: '/gasFeed', price: '$0.0001', note: 'EVM gas prices and fee estimates' },
    { method: 'GET', path: '/tokenHolders', price: '$0.0006', note: 'Paginated token holder ledger' },
    { method: 'GET', path: '/strats/:id', price: '$0.0001', note: 'Strategy guide markdown' }
  ], [])

  const quickStartExamples = useMemo(() => [
    {
      key: 'token-info',
      index: '01',
      kicker: 'Market Data',
      title: 'Get Token Info',
      description: 'Fetch price, liquidity, market cap, and pair metadata for a live token.',
      snippets: {
        curl: `curl --get "https://api.claw.click/tokenPoolInfo" \\
  -H "x-api-key: YOUR_API_KEY" \\
  --data-urlencode "chain=base" \\
  --data-urlencode "tokenAddress=0xB964cA8757B0d64c50B0da17f0150563139361aC"`,
        python: `import requests

response = requests.get(
    "https://api.claw.click/tokenPoolInfo",
    headers={"x-api-key": "YOUR_API_KEY"},
    params={
        "chain": "base",
        "tokenAddress": "0xB964cA8757B0d64c50B0da17f0150563139361aC",
    },
)

print(response.json())`,
        'node.js': `const response = await fetch("https://api.claw.click/tokenPoolInfo?chain=base&tokenAddress=0xB964cA8757B0d64c50B0da17f0150563139361aC", {
  headers: {
    "x-api-key": "YOUR_API_KEY",
  },
});

const data = await response.json();
console.log(data);`,
      },
    },
    {
      key: 'risk',
      index: '02',
      kicker: 'Risk',
      title: 'Check Risk',
      description: 'Run a lightweight fraud and contract safety screen before taking a position.',
      snippets: {
        curl: `curl --get "https://api.claw.click/isScam" \\
  -H "x-api-key: YOUR_API_KEY" \\
  --data-urlencode "chain=base" \\
  --data-urlencode "tokenAddress=0xB964cA8757B0d64c50B0da17f0150563139361aC"`,
        python: `import requests

response = requests.get(
    "https://api.claw.click/isScam",
    headers={"x-api-key": "YOUR_API_KEY"},
    params={
        "chain": "base",
        "tokenAddress": "0xB964cA8757B0d64c50B0da17f0150563139361aC",
    },
)

print(response.json())`,
        'node.js': `const response = await fetch("https://api.claw.click/isScam?chain=base&tokenAddress=0xB964cA8757B0d64c50B0da17f0150563139361aC", {
  headers: {
    "x-api-key": "YOUR_API_KEY",
  },
});

const data = await response.json();
console.log(data);`,
      },
    },
    {
      key: 'swap',
      index: '03',
      kicker: 'Execution',
      title: 'Build Swap',
      description: 'Create unsigned swap transaction payloads your app or agent can sign and submit.',
      snippets: {
        curl: `curl --get "https://api.claw.click/swap" \\
  -H "x-api-key: YOUR_API_KEY" \\
  --data-urlencode "chain=base" \\
  --data-urlencode "dex=uniswapV4" \\
  --data-urlencode "walletAddress=0x..." \\
  --data-urlencode "tokenIn=native" \\
  --data-urlencode "tokenOut=0xB964cA8757B0d64c50B0da17f0150563139361aC" \\
  --data-urlencode "amountIn=1000000000000000000"`,
        python: `import requests

response = requests.get(
    "https://api.claw.click/swap",
    headers={"x-api-key": "YOUR_API_KEY"},
    params={
        "chain": "base",
        "dex": "uniswapV4",
        "walletAddress": "0x...",
        "tokenIn": "native",
        "tokenOut": "0xB964cA8757B0d64c50B0da17f0150563139361aC",
        "amountIn": "1000000000000000000",
    },
)

print(response.json())`,
        'node.js': `const params = new URLSearchParams({
  chain: "base",
  dex: "uniswapV4",
  walletAddress: "0x...",
  tokenIn: "native",
  tokenOut: "0xB964cA8757B0d64c50B0da17f0150563139361aC",
  amountIn: "1000000000000000000",
});

const response = await fetch(\`https://api.claw.click/swap?\${params.toString()}\`, {
  headers: {
    "x-api-key": "YOUR_API_KEY",
  },
});

const data = await response.json();
console.log(data);`,
      },
    },
  ], [])

  const websocketExamples = useMemo(() => ({
    'node.js': `const WebSocket = require('ws');

const ws = new WebSocket('wss://api.claw.click/ws/launchpadEvents');

ws.on('message', (data) => {
  const msg = JSON.parse(data);

  if (msg.type === 'info') {
    ws.send(JSON.stringify({ protocol: 'PumpDotFun' }));
    return;
  }

  if (msg.type === 'events') {
    msg.data.forEach((event) => {
      console.log(\`New token: \${event.tokenSymbol} - $\${event.marketCap} mcap\`);
    });
  }
});`,
    python: `import json
from websocket import WebSocketApp


def on_message(ws, message):
    msg = json.loads(message)

    if msg.get("type") == "info":
        ws.send(json.dumps({"protocol": "PumpDotFun"}))
        return

    if msg.get("type") == "events":
        for event in msg.get("data", []):
            print(f"New token: {event['tokenSymbol']} - ${event['marketCap']} mcap")


ws = WebSocketApp(
    "wss://api.claw.click/ws/launchpadEvents",
    on_message=on_message,
)

ws.run_forever()`,
  }), [])

  useEffect(() => {
    const handleTouchStart = (event) => {
      const touch = event.changedTouches?.[0]
      if (!touch) {
        return
      }

      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
      }
    }

    const handleTouchEnd = (event) => {
      if (window.innerWidth > 768) {
        return
      }

      const touch = event.changedTouches?.[0]
      if (!touch) {
        return
      }

      const deltaX = touch.clientX - touchStartRef.current.x
      const deltaY = touch.clientY - touchStartRef.current.y

      if (Math.abs(deltaY) > Math.abs(deltaX)) {
        return
      }

      const startedNearEdge = touchStartRef.current.x <= 36

      if (!sidebarOpen && startedNearEdge && deltaX > 56) {
        setSidebarOpen(true)
      }

      if (sidebarOpen && deltaX < -56) {
        setSidebarOpen(false)
      }
    }

    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [sidebarOpen])

  // Comprehensive endpoints data from GitHub README
  const endpoints = [
    {
      category: 'Core',
      items: [
        {
          method: 'GET', path: '/health', description: 'Health check',
          requiresAuth: false, example: 'GET https://api.claw.click/health',
          response: '{"status": "ok", "service": "super-api"}'
        },
        {
          method: 'GET', path: '/providers', description: 'List all configured data connectors and service status',
          requiresAuth: false, example: 'GET https://api.claw.click/providers',
          response: '{"providers": [{"id": "wallet-tracking", "label": "Wallet Tracking", "category": "walletTracking", "configured": true}, {"id": "market-data", "label": "Market Data", "category": "marketData", "configured": true}, {"id": "analytics", "label": "Analytics", "category": "analytics", "configured": true}, {"id": "risk", "label": "Risk", "category": "risk", "configured": true}]}'
        }
      ]
    },
    {
      category: 'Market Data',
      items: [
        {
          method: 'GET', path: '/tokenPoolInfo', description: 'Token price, market cap, liquidity, pair info',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'eth', description: 'Chain to query' },
            { name: 'tokenAddress', required: true, default: '—', description: 'Token contract address' },
            { name: 'poolAddress', required: false, default: '—', description: 'Specific pool address' },
            { name: 'symbol', required: false, default: '—', description: 'Token symbol hint' },
            { name: 'tokenName', required: false, default: '—', description: 'Token name hint' }
          ],
          example: 'GET https://api.claw.click/tokenPoolInfo?chain=eth&tokenAddress=0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          response: '{"endpoint": "tokenPoolInfo", "status": "live", "chain": "eth", "tokenAddress": "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "name": "USD Coin", "symbol": "USDC", "priceUsd": 1.0001, "marketCapUsd": 32000000000, "fdvUsd": 32000000000, "liquidityUsd": 150000000, "volume24hUsd": 5000000000, "priceChange24hPct": -0.01, "pairAddress": "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640", "dex": "uniswap_v3", "providers": [{"provider": "dexScreener", "status": "ok", "detail": "Live data"}, {"provider": "birdeye", "status": "ok", "detail": "Price confirmed"}]}'
        },
        {
          method: 'GET', path: '/tokenPriceHistory', description: 'Historical OHLCV price data for charting',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'eth', description: 'Chain' },
            { name: 'tokenAddress', required: true, default: '—', description: 'Token address or major symbol (btc, eth, sol)' },
            { name: 'limit', required: false, default: '3m', description: 'Time range: 1d, 7d, 1m, 3m, 1y' },
            { name: 'interval', required: false, default: '1d', description: 'Candle interval: 5m, 15m, 1h, 4h, 1d' }
          ],
          example: 'GET https://api.claw.click/tokenPriceHistory?chain=sol&tokenAddress=So111...&limit=7d&interval=1h',
          response: '{"endpoint": "tokenPriceHistory", "status": "live", "chain": "sol", "points": [{"timestamp": 1710000000, "priceUsd": 150.5, "open": 150, "high": 152, "low": 149, "close": 150.5, "volume": 1000000}]}'
        },
        {
          method: 'GET', path: '/detailedTokenStats', description: 'Bucketed token stats (cached 30 min)',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'eth', description: 'Chain' },
            { name: 'tokenAddress', required: true, default: '—', description: 'Token address' },
            { name: 'durations', required: false, default: 'hour1,day1', description: 'Comma-separated: min5, hour1, hour4, hour12, day1' },
            { name: 'bucketCount', required: false, default: '6', description: 'Number of buckets returned' }
          ],
          example: 'GET https://api.claw.click/detailedTokenStats?chain=eth&tokenAddress=0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
          response: '{"endpoint": "detailedTokenStats", "status": "live", "durations": {"hour1": {"statsUsd": {"volume": {"currentValue": 13839617.47, "change": -0.3094}}}}}'
        },
        {
          method: 'GET', path: '/priceHistoryIndicators', description: 'Price history with technical indicators (RSI, MACD, Bollinger Bands)',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'eth', description: 'Chain' },
            { name: 'tokenAddress', required: true, default: '—', description: 'Token address' },
            { name: 'indicatorTimeFrame', required: false, default: '1h', description: 'Time frame: 1m, 5m, 10m, 15m, 30m, 1h, 4h, 1d' }
          ],
          example: 'GET https://api.claw.click/priceHistoryIndicators?chain=eth&tokenAddress=0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48&indicatorTimeFrame=1h',
          response: '{"endpoint": "priceHistoryIndicators", "status": "live", "chain": "eth", "tokenAddress": "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "indicators": [{"timestamp": 1710000000, "price": 1.0001, "rsi": 65.2, "macd": 0.00002, "bollingerUpper": 1.0035, "bollingerLower": 0.9967}]}'
        },
        {
          method: 'GET', path: '/marketOverview', description: 'Market overview for majors or token with trend data',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'eth', description: 'Chain' },
            { name: 'asset', required: false, default: '—', description: 'Asset for majors (BTC, ETH, etc)' },
            { name: 'tokenAddress', required: false, default: '—', description: 'Token address for specific token overview' }
          ],
          example: 'GET https://api.claw.click/marketOverview?asset=BTC',
          response: '{"endpoint": "marketOverview", "status": "live", "asset": "BTC", "price": 45000, "priceChange24h": 2.5, "marketCapUsd": 900000000000, "volume24hUsd": 35000000000, "fearGreedIndex": 65}'
        },
        {
          method: 'GET', path: '/fudSearch', description: 'Search for FUD (Fear, Uncertainty, Doubt) and security concerns',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'eth', description: 'Chain' },
            { name: 'tokenAddress', required: false, default: '—', description: 'Token address' },
            { name: 'symbol', required: false, default: '—', description: 'Token symbol, required with tokenName if tokenAddress is omitted' },
            { name: 'tokenName', required: false, default: '—', description: 'Token name, required with symbol if tokenAddress is omitted' }
          ],
          example: 'GET https://api.claw.click/fudSearch?chain=eth&tokenName=USD%20Coin&symbol=USDC',
          response: '{"endpoint": "fudSearch", "status": "live", "chain": "eth", "symbol": "USDC", "concerns": [{"type": "regulatory", "severity": "low", "description": "SEC inquiry"}, {"type": "technical", "severity": "low", "description": "Minor smart contract audit findings"}], "overallRisk": "low"}'
        },
        {
          method: 'GET', path: '/xSearch', description: 'Search recent X posts by query',
          requiresAuth: true,
          params: [
            { name: 'query', required: true, default: '—', description: 'X search query such as bitcoin lang:en -is:retweet' },
            { name: 'maxResults', required: false, default: '25', description: 'Result count (10–100)' }
          ],
          example: 'GET https://api.claw.click/xSearch?query=bitcoin%20lang:en%20-is:retweet&maxResults=10',
          response: '{"endpoint":"xSearch","status":"live","query":"bitcoin lang:en -is:retweet","maxResults":10,"count":10,"nextToken":"abc123","posts":[{"id":"1900000000000000000","text":"Bitcoin is moving again","createdAt":"2026-03-24T10:15:00.000Z","authorId":"2244994945","authorName":"X Dev","authorUsername":"XDevelopers","authorVerified":true,"authorFollowers":500000,"url":"https://x.com/XDevelopers/status/1900000000000000000","metrics":{"likes":152,"replies":12,"reposts":18,"quotes":3,"bookmarks":7,"impressions":42000}}],"providers":[{"provider":"x:searchRecentPosts","status":"ok"}]}'
        },
        {
          method: 'GET', path: '/xCountRecent', description: 'Count recent X posts for a query',
          requiresAuth: true,
          params: [
            { name: 'query', required: true, default: '—', description: 'X search query' },
            { name: 'granularity', required: false, default: 'hour', description: 'minute, hour, or day' }
          ],
          example: 'GET https://api.claw.click/xCountRecent?query=bitcoin%20lang:en&granularity=hour',
          response: '{"endpoint":"xCountRecent","status":"live","query":"bitcoin lang:en","granularity":"hour","totalPostCount":4832,"nextToken":null,"buckets":[{"start":"2026-03-24T09:00:00.000Z","end":"2026-03-24T10:00:00.000Z","postCount":214},{"start":"2026-03-24T10:00:00.000Z","end":"2026-03-24T11:00:00.000Z","postCount":287}],"providers":[{"provider":"x:countRecentPosts","status":"ok"}]}'
        },
        {
          method: 'GET', path: '/xUserByUsername', description: 'Look up an X user profile by username',
          requiresAuth: true,
          params: [
            { name: 'username', required: true, default: '—', description: 'Username without @' }
          ],
          example: 'GET https://api.claw.click/xUserByUsername?username=XDevelopers',
          response: '{"endpoint":"xUserByUsername","status":"live","username":"XDevelopers","user":{"id":"2244994945","name":"X Dev","username":"XDevelopers","verified":true,"protected":false,"createdAt":"2013-12-14T04:35:55Z","description":"The voice of the X API platform.","profileImageUrl":"https://...","metrics":{"followers":500000,"following":12,"tweets":18000,"listed":4200,"likes":3200}},"providers":[{"provider":"x:userByUsername","status":"ok"}]}'
        },
        {
          method: 'GET', path: '/xUserLikes', description: 'Get liked X posts for a user by username or userId',
          requiresAuth: true,
          params: [
            { name: 'username', required: false, default: '—', description: 'Username without @' },
            { name: 'userId', required: false, default: '—', description: 'X user id' },
            { name: 'maxResults', required: false, default: '25', description: 'Result count (5–100)' },
            { name: 'paginationToken', required: false, default: '—', description: 'Optional next-page token' }
          ],
          example: 'GET https://api.claw.click/xUserLikes?username=XDevelopers&maxResults=10',
          response: '{"endpoint":"xUserLikes","status":"live","username":"XDevelopers","userId":"2244994945","count":10,"nextToken":"next_abc","posts":[{"id":"1900000000000000001","text":"We shipped another API update","createdAt":"2026-03-24T08:00:00.000Z","authorId":"123","authorName":"Builder","authorUsername":"builder","authorVerified":false,"authorFollowers":8400,"url":"https://x.com/builder/status/1900000000000000001","metrics":{"likes":88,"replies":4,"reposts":9,"quotes":1,"bookmarks":2,"impressions":12000}}],"providers":[{"provider":"x:userByUsername","status":"ok"},{"provider":"x:userLikes","status":"ok"}]}'
        },
        {
          method: 'GET', path: '/xUserFollowers', description: 'Get followers for an X user by username or userId',
          requiresAuth: true,
          params: [
            { name: 'username', required: false, default: '—', description: 'Username without @' },
            { name: 'userId', required: false, default: '—', description: 'X user id' },
            { name: 'maxResults', required: false, default: '25', description: 'Result count (1–1000)' },
            { name: 'paginationToken', required: false, default: '—', description: 'Optional next-page token' }
          ],
          example: 'GET https://api.claw.click/xUserFollowers?username=XDevelopers&maxResults=10',
          response: '{"endpoint":"xUserFollowers","status":"live","username":"XDevelopers","userId":"2244994945","count":10,"nextToken":"next_def","followers":[{"id":"6253282","name":"X API","username":"api","verified":true,"protected":false,"createdAt":"2007-05-23T06:01:13Z","description":"Platform account","profileImageUrl":"https://...","metrics":{"followers":2400000,"following":150,"tweets":52000,"listed":18000,"likes":5400}}],"providers":[{"provider":"x:userByUsername","status":"ok"},{"provider":"x:userFollowers","status":"ok"}]}'
        },
        {
          method: 'GET', path: '/trendingTokens', description: 'Currently trending tokens across all chains',
          requiresAuth: true,
          example: 'GET https://api.claw.click/trendingTokens',
          response: '{"endpoint": "trendingTokens", "status": "live", "tokens": [{"chainId": "solana", "name": "PepeCoin", "symbol": "PEPE", "priceUsd": 0.0001, "volume24hUsd": 50000000, "marketCapUsd": 5000000, "liquidityUsd": 2000000, "priceChange24hPct": 150, "boostAmount": 500, "source": "dexScreener"}]}'
        },
        {
          method: 'GET', path: '/newPairs', description: 'Recently created trading pairs/pools',
          requiresAuth: true,
          params: [
            { name: 'source', required: false, default: 'all', description: 'Filter: all, dexscreener, pumpfun, raydium, uniswap' },
            { name: 'limit', required: false, default: '10', description: 'Results per source (1–50)' }
          ],
          example: 'GET https://api.claw.click/newPairs?source=pumpfun&limit=5',
          response: '{"endpoint": "newPairs", "status": "live", "source": "pumpfun", "pairs": [{"source": "pumpfun", "chainId": "solana", "pairAddress": null, "tokenAddress": "GmD5J8...", "name": "NewToken", "symbol": "NEW", "description": "A new meme token", "createdAt": 1710000000, "marketCap": 50000, "url": "https://pump.fun/..."}]}'
        }
      ]
    },
    {
      category: 'Risk Assessment',
      items: [
        {
          method: 'GET', path: '/isScam', description: 'Quick scam check with risk score',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'eth', description: 'Chain' },
            { name: 'tokenAddress', required: true, default: '—', description: 'Token address' }
          ],
          example: 'GET https://api.claw.click/isScam?chain=bsc&tokenAddress=0x...',
          response: '{"endpoint": "isScam", "status": "live", "chain": "bsc", "tokenAddress": "0x...", "isScam": false, "risk": "low", "riskLevel": 1, "warnings": [], "cached": true, "providers": [{"provider": "goplus", "status": "ok"}, {"provider": "honeypot", "status": "ok"}]}'
        },
        {
          method: 'GET', path: '/fullAudit', description: 'Deep contract audit (taxes, ownership, trading flags)',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'eth', description: 'Chain' },
            { name: 'tokenAddress', required: true, default: '—', description: 'Token address' }
          ],
          example: 'GET https://api.claw.click/fullAudit?chain=eth&tokenAddress=0x...',
          response: '{"endpoint": "fullAudit", "status": "live", "chain": "eth", "tokenAddress": "0x...", "summary": {"isScam": false, "risk": "medium", "riskLevel": 2, "warnings": ["High sell tax"]}, "taxes": {"buyTax": 1, "sellTax": 5, "transferTax": 0}, "contract": {"openSource": true, "isProxy": false, "isMintable": false}, "trading": {"cannotBuy": false, "cannotSellAll": false}, "holders": {"holderCount": 5000, "ownerPercent": 5}, "simulation": {"buyGas": "150000", "sellGas": "175000"}}'
        }
      ]
    },
    {
      category: 'Trading & DEX',
      items: [
        {
          method: 'GET', path: '/swap', description: 'Build unsigned swap transaction',
          requiresAuth: true,
          params: [
            { name: 'chain', required: true, default: '—', description: 'Chain: eth, base, bsc, sol' },
            { name: 'dex', required: true, default: '—', description: 'DEX name (use /swapDexes to list)' },
            { name: 'walletAddress', required: true, default: '—', description: 'Wallet that will sign' },
            { name: 'tokenIn', required: true, default: '—', description: 'Input token address' },
            { name: 'tokenOut', required: true, default: '—', description: 'Output token address' },
            { name: 'amountIn', required: true, default: '—', description: 'Amount in raw units (wei/lamports)' },
            { name: 'slippageBps', required: false, default: '50', description: 'Slippage tolerance in basis points' }
          ],
          example: 'GET https://api.claw.click/swap?chain=eth&dex=uniswapV3&walletAddress=0x...&tokenIn=0x...&tokenOut=0x...&amountIn=1000000000000000000',
          response: '{"endpoint": "swap", "status": "live", "chain": "eth", "dex": "uniswapV3", "tokenIn": "0x...", "tokenOut": "0x...", "amountIn": "1000000000000000000", "slippageBps": 100, "tx": {"to": "0xE592427A0AEce92De3Edee1F18E0157C05861564", "data": "0x414bf389000...", "value": "0x0", "chainId": 1, "from": "0xYourWallet", "gasLimit": "0x30000"}}'
        },
        {
          method: 'GET', path: '/swapQuote', description: 'Get swap quote without building transaction',
          requiresAuth: true,
          params: [
            { name: 'chain', required: true, default: '—', description: 'Chain' },
            { name: 'dex', required: true, default: '—', description: 'DEX name' },
            { name: 'tokenIn', required: true, default: '—', description: 'Input token' },
            { name: 'tokenOut', required: true, default: '—', description: 'Output token' },
            { name: 'amountIn', required: true, default: '—', description: 'Raw amount in' }
          ],
          example: 'GET https://api.claw.click/swapQuote?chain=eth&dex=uniswapV3&tokenIn=0x...&tokenOut=0x...&amountIn=1000000',
          response: '{"endpoint": "swapQuote", "status": "live", "chain": "eth", "dex": "uniswapV3", "amountOut": "997000", "amountOutMin": "992000", "priceImpact": 0.15, "providers": [{"provider": "uniswapV3", "status": "ok"}]}'
        },
        {
          method: 'GET', path: '/swapDexes', description: 'List available DEXes for a chain',
          requiresAuth: true,
          params: [
            { name: 'chain', required: true, default: '—', description: 'Chain' }
          ],
          example: 'GET https://api.claw.click/swapDexes?chain=eth',
          response: '{"endpoint": "swapDexes", "chain": "eth", "dexes": [{"id": "uniswapV2", "label": "Uniswap V2"}, {"id": "uniswapV3", "label": "Uniswap V3"}, {"id": "uniswapV4", "label": "Uniswap V4"}]}'
        },
        {
          method: 'GET', path: '/approve', description: 'Build unsigned approval transaction steps',
          requiresAuth: true,
          params: [
            { name: 'chain', required: true, default: '—', description: 'Chain (eth, base, bsc)' },
            { name: 'dex', required: true, default: '—', description: 'DEX id from /swapDexes' },
            { name: 'walletAddress', required: true, default: '—', description: 'Wallet that will sign' },
            { name: 'tokenIn', required: true, default: '—', description: 'Token to approve' }
          ],
          example: 'GET https://api.claw.click/approve?chain=eth&dex=uniswapV3&walletAddress=0x...&tokenIn=0x...',
          response: '{"endpoint": "approve", "status": "live", "chain": "eth", "dex": "uniswapV3", "tokenIn": "0x...", "approvalMode": "auto", "resolvedMode": "erc20", "spender": "0xE592427A0AEce92De3Edee1F18E0157C05861564", "steps": [{"kind": "erc20", "label": "Approve Uniswap V3 Router", "spender": "0xE592427A0AEce92De3Edee1F18E0157C05861564", "tx": {"to": "0xTokenAddress", "data": "0x095ea7b3...", "value": "0x0", "chainId": 1, "from": "0xYourWallet"}}]}'
        },
        {
          method: 'GET', path: '/unwrap', description: 'Build unsigned WETH/WBNB unwrap transaction',
          requiresAuth: true,
          params: [
            { name: 'chain', required: true, default: '—', description: 'Chain (eth, base, bsc)' },
            { name: 'walletAddress', required: true, default: '—', description: 'Wallet address' },
            { name: 'amount', required: true, default: '—', description: 'Amount in Wei to unwrap' }
          ],
          example: 'GET https://api.claw.click/unwrap?chain=eth&walletAddress=0x...&amount=1000000000000000000',
          response: '{"endpoint": "unwrap", "chain": "eth", "tx": {"to": "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", "data": "0x2e1a7d4d...", "value": "0x0", "chainId": 1, "from": "0xYourWallet"}}'
        }
      ]
    },
    {
      category: 'Wallet Analysis',
      items: [
        {
          method: 'GET', path: '/walletReview', description: 'Comprehensive wallet analysis — PnL, holdings, protocols, activity',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'eth', description: 'Chain' },
            { name: 'walletAddress', required: true, default: '—', description: 'Wallet address' },
            { name: 'days', required: false, default: '30', description: 'Lookback period' }
          ],
          example: 'GET https://api.claw.click/walletReview?chain=sol&walletAddress=8X35r...&days=30',
          response: '{"endpoint": "walletReview", "status": "live", "chain": "sol", "walletAddress": "8X35r...", "days": "30", "summary": {"totalNetWorthUsd": 125000, "chainNetWorthUsd": 80000, "realizedProfitUsd": 15000, "realizedProfitPct": 23.5, "totalTradeVolumeUsd": 500000, "totalTrades": 150, "profitable": true, "tokenCount": 15, "protocolCount": 5, "activeChains": ["sol", "eth"]}, "topHoldings": [{"tokenAddress": "So111...", "chain": "sol", "symbol": "SOL", "amount": 500, "priceUsd": 160, "valueUsd": 80000}]}'
        },
        {
          method: 'GET', path: '/pnl', description: 'Focused wallet PnL summary by chain',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'eth', description: 'Chain' },
            { name: 'walletAddress', required: true, default: '—', description: 'Wallet address' },
            { name: 'days', required: false, default: '30', description: 'Lookback period' }
          ],
          example: 'GET https://api.claw.click/pnl?chain=eth&walletAddress=0x4687371FFE7d5514FB7290145619d5d7343A77a4&days=30',
          response: '{"endpoint":"pnl","status":"live","chain":"eth","walletAddress":"0x4687371FFE7d5514FB7290145619d5d7343A77a4","source":"zerion","summary":{"realizedPnlUsd":20804.39,"realizedPnlPct":54.65,"unrealizedPnlUsd":-389.13,"totalPnlUsd":20415.26,"avgProfitPerTradeUsd":null,"totalTrades":null,"totalBuys":null,"totalSells":null,"winRate":null,"uniqueTokens":null},"providers":[{"provider":"zerionPnl","status":"ok"}]}'
        },
        {
          method: 'GET', path: '/holders', description: 'Top holder rows for a token',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'eth', description: 'Chain: eth, base, bsc, sol' },
            { name: 'tokenAddress', required: true, default: '—', description: 'Token contract or mint address' },
            { name: 'limit', required: false, default: '150', description: 'Maximum rows returned (1–150)' }
          ],
          example: 'GET https://api.claw.click/holders?chain=sol&tokenAddress=Dz9mQ...&limit=5',
          response: '{"endpoint": "holders", "status": "live", "cached": false, "chain": "sol", "tokenAddress": "Dz9mQ9NzkBcCsuGPFJ3r1bS4wgqKMHBPiVuniW8Mbonk", "limit": 5, "holderCount": 36547, "totalSupplyRaw": "999111158353621", "totalSupplyFormatted": "999111158.353621", "holders": [{"address": "u6PJ8DtQuPFnfmwHbGFULQ4u4EgjDiyYKjVEsynXq2w", "label": null, "entity": null, "balance": "66226101364616", "balanceFormatted": "66226101.364616", "percentOfSupply": 6.6286}]}'
        },
        {
          method: 'GET', path: '/holderAnalysis', description: 'Detailed holder distribution and concentration analysis',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'eth', description: 'Chain' },
            { name: 'tokenAddress', required: true, default: '—', description: 'Token address' }
          ],
          example: 'GET https://api.claw.click/holderAnalysis?chain=eth&tokenAddress=0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          response: '{"endpoint": "holderAnalysis", "status": "live", "chain": "eth", "tokenAddress": "0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48", "holderCount": 5000000, "top10Percent": 45.2, "top100Percent": 72.5, "giniCoefficient": 0.82, "distributionRisk": "medium", "concentration": {"veryHigh": 5, "high": 12, "medium": 45, "low": 200, "veryLow": 4738}}'
        },
        {
          method: 'GET', path: '/tokenHolders', description: 'Paginated token holder list with cursor support',
          requiresAuth: true,
          params: [
            { name: 'tokenAddress', required: true, default: '—', description: 'Token address' },
            { name: 'network', required: false, default: 'eth', description: 'Chain' },
            { name: 'cursor', required: false, default: '—', description: 'Pagination cursor' },
            { name: 'limit', required: false, default: '50', description: 'Results per page (1–200)' }
          ],
          example: 'GET https://api.claw.click/tokenHolders?tokenAddress=0x...&network=eth&limit=50',
          response: '{"endpoint": "tokenHolders", "status": "live", "tokenAddress": "0x...", "network": "eth", "holders": [{"address": "0x...", "balance": "1000000000000000000", "percentOfSupply": 12.5, "label": "Binance"}], "nextCursor": "abc123", "hasMore": true}'
        }
      ]
    },
    {
      category: 'Discovery & Analytics',
      items: [
        {
          method: 'GET', path: '/getTopEthTokens', description: 'Top Ethereum tokens (Ethereum mainnet, cached 10 min)',
          requiresAuth: true,
          params: [
            { name: 'criteria', required: false, default: 'trade', description: 'Sort by trade, cap, or count' },
            { name: 'limit', required: false, default: '50', description: 'Max results (1-50)' }
          ],
          example: 'GET https://api.claw.click/getTopEthTokens?criteria=cap&limit=25',
          response: '{"endpoint":"getTopEthTokens","status":"live","criteria":"cap","limit":25,"cached":false,"tokens":[{"address":"0xdAC17F958D2ee523a2206206994597C13D831ec7","totalSupply":"1000000000000000","name":"Tether USD","symbol":"USDT","decimals":"6","price":{"rate":1,"currency":"USD","diff":0.01,"diff7d":0.03,"diff30d":0.02,"marketCapUsd":100000000000,"availableSupply":100000000000,"volume24h":50000000000,"ts":1763000000},"countOps":12345678,"holdersCount":1000000,"lastUpdated":1763000000,"extraFieldsPreserved":true}],"sources":[{"name":"ethereum-market-index","status":"ok"}]}'
        },
        {
          method: 'GET', path: '/getNewEthTradableTokens', description: 'Newest tradable Ethereum tokens (Ethereum mainnet, cached 10 min)',
          requiresAuth: true,
          example: 'GET https://api.claw.click/getNewEthTradableTokens',
          response: '{"endpoint":"getNewEthTradableTokens","status":"live","cached":false,"tokens":[{"address":"0x1234...","totalSupply":"1000000000000000000","name":"New Token","symbol":"NEW","decimals":"18","price":{"rate":0.00012,"currency":"USD","diff":4.2,"diff7d":4.2,"diff30d":4.2,"marketCapUsd":120000,"availableSupply":1000000000,"volume24h":25000,"ts":1763000000},"holdersCount":145,"lastUpdated":1763000000,"added":1762999500,"extraFieldsPreserved":true}],"sources":[{"name":"ethereum-discovery","status":"ok"}]}'
        },
        {
          method: 'GET', path: '/tokenSearch', description: 'Search tokens by name, symbol, or address',
          requiresAuth: true,
          params: [
            { name: 'query', required: true, default: '—', description: 'Search term' }
          ],
          example: 'GET https://api.claw.click/tokenSearch?query=pepe',
          response: '{"endpoint": "tokenSearch", "status": "live", "query": "pepe", "results": [{"chainId": "ethereum", "pairAddress": "0x...", "tokenAddress": "0x6982508145454ce325ddbe47a25d4ec3d2311933", "name": "Pepe", "symbol": "PEPE", "priceUsd": 0.00001, "volume24hUsd": 200000000, "liquidityUsd": 50000000, "priceChange24hPct": 5.2, "fdvUsd": 4000000000, "dex": "uniswap"}]}'
        },
        {
          method: 'GET', path: '/filterTokens', description: 'Filter tokens by metrics (cached 5 min)',
          requiresAuth: true,
          params: [
            { name: 'network', required: false, default: '—', description: 'Chain filter: eth, base, bsc, sol (comma-separated)' },
            { name: 'minLiquidity', required: false, default: '—', description: 'Minimum USD liquidity' },
            { name: 'minVolume24', required: false, default: '—', description: 'Minimum 24h volume' },
            { name: 'sortBy', required: false, default: 'trendingScore24', description: 'Sort field' }
          ],
          example: 'GET https://api.claw.click/filterTokens?network=sol&minLiquidity=50000&sortBy=trendingScore24',
          response: '{"endpoint": "filterTokens", "status": "live", "cached": true, "count": 10, "page": 0, "tokens": [{"address": "TokenMint...", "name": "MemeToken", "symbol": "MEME", "priceUsd": "0.0001", "liquidity": "65000", "marketCap": "500000", "volume24h": "12000000", "change24h": "0.15", "holders": 4500, "sniperCount": 5, "devHeldPct": 1.5, "top10HoldersPct": 28, "launchpad": {"name": "Pump", "completed": true}}]}'
        },
        {
          method: 'GET', path: '/volatilityScanner', description: 'Swing-trade volatility scanner (cached 5 min)',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'sol', description: 'Chain to scan' },
            { name: 'minVolume', required: false, default: '100000', description: 'Minimum 24h volume (USD)' },
            { name: 'minSwingPct', required: false, default: '10', description: 'Minimum median swing size (%)' }
          ],
          example: 'GET https://api.claw.click/volatilityScanner?chain=sol&minVolume=500000',
          response: '{"endpoint": "volatilityScanner", "chain": "sol", "duration": "hour4", "count": 5, "cached": false, "scanned": 50, "candidates": [{"address": "TokenMint...", "name": "ExampleToken", "symbol": "EX", "priceUsd": "0.00523", "liquidity": "250000", "volume24h": "1200000", "support": 0.0042, "resistance": 0.0068, "swingPct": 18.5, "swingCount": 4, "currentPosition": 0.32, "buyVsSellRatio": 1.15, "swingScore": 85}]}'
        },
        {
          method: 'GET', path: '/topTraders', description: 'Top traders for a token across supported chains',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'sol', description: 'Chain (sol, eth, base, bsc)' },
            { name: 'tokenAddress', required: true, default: '—', description: 'Token address' },
            { name: 'timeFrame', required: false, default: '24h', description: 'Time frame (30m, 1h, 2h, 4h, 8h, 24h)' }
          ],
          example: 'GET https://api.claw.click/topTraders?chain=eth&tokenAddress=0xA1290d69c65A6Fe4DF752f95823fae25cB99e5A7&timeFrame=24h',
          response: '{"endpoint": "topTraders", "status": "live", "chain": "eth", "tokenAddress": "0xA1290d69c65A6Fe4DF752f95823fae25cB99e5A7", "timeFrame": "24h", "traders": [{"address": "0x...", "tradeCount": 4, "volume": 394.10, "buyVolume": 394.10, "sellVolume": 0, "profit": 12.5, "winRate": 0.75}], "sources": [{"name": "trade-ranking", "status": "ok"}]}'
        },
        {
          method: 'GET', path: '/gasFeed', description: 'Current gas prices for EVM chains',
          requiresAuth: true,
          params: [
            { name: 'chain', required: false, default: 'eth', description: 'Chain (eth, base, bsc)' }
          ],
          example: 'GET https://api.claw.click/gasFeed?chain=eth',
          response: '{"endpoint": "gasFeed", "status": "live", "chain": "eth", "lastBlock": "23467872", "safeGwei": "0.38", "proposeGwei": "0.38", "fastGwei": "0.42", "baseFeeGwei": "0.38", "providers": [{"provider": "etherscanV2", "status": "ok"}]}'
        }
      ]
    },
    {
      category: 'Strategies & Resources',
      items: [
        {
          method: 'GET', path: '/strats', description: 'List all available trading strategy guides',
          requiresAuth: false,
          example: 'GET https://api.claw.click/strats',
          response: '{"endpoint": "strats", "status": "live", "strategies": [{"id": "1", "path": "scalping", "title": "Scalping Strategy", "description": "Short-term trading strategy targeting quick profits"}, {"id": "2", "path": "dca", "title": "Dollar Cost Averaging", "description": "Consistent entry strategy over time"}]}'
        },
        {
          method: 'GET', path: '/strats/:id', description: 'Get detailed strategy guide as markdown',
          requiresAuth: false,
          params: [
            { name: 'id', required: true, default: '—', description: 'Strategy ID (e.g., scalping, dca)' }
          ],
          example: 'GET https://api.claw.click/strats/scalping',
          response: '# Scalping Strategy\n\n## Overview\nScalping is a high-frequency trading strategy...\n\n## Entry Points\n- Support levels\n- RSI divergence\n\n## Exit Points\n- 2-3% profit target\n- Stop loss at -1%'
        }
      ]
    },
    {
      category: 'WebSocket Streams',
      items: [
        {
          method: 'WS', path: '/ws/launchpadEvents', description: 'Real-time launchpad event stream',
          requiresAuth: true,
          params: [
            { name: 'Protocol', required: true, default: '—', description: 'Use: ws:// or wss://' }
          ],
          example: 'WS https://api.claw.click/ws/launchpadEvents',
          response: '{"type": "launchpadEvent", "launchpad": "pump.fun", "event": "new_mint", "data": {"tokenAddress": "...", "name": "NewToken", "symbol": "NEW", "description": "A new token", "createdAt": 1710000000, "marketCap": 50000}}'
        },
        {
          method: 'WS', path: '/ws/xFilteredStream', description: 'Real-time X filtered stream proxy',
          requiresAuth: true,
          params: [
            { name: 'Protocol', required: true, default: '—', description: 'Use: ws:// or wss://' },
            { name: 'username', required: false, default: '—', description: 'Single X username to stream posts from' },
            { name: 'usernames', required: false, default: '—', description: 'Multiple X usernames to stream posts from' },
            { name: 'rules', required: false, default: '—', description: 'Optional raw X filtered-stream rules array' }
          ],
          example: 'WS wss://api.claw.click/ws/xFilteredStream',
          response: '{"type":"post","data":{"id":"1900000000000000000","text":"Bitcoin is moving again","createdAt":"2026-03-24T10:15:00.000Z","authorId":"2244994945","authorName":"X Dev","authorUsername":"XDevelopers","authorVerified":true,"authorFollowers":500000,"url":"https://x.com/XDevelopers/status/1900000000000000000","metrics":{"likes":152,"replies":12,"reposts":18,"quotes":3,"bookmarks":7,"impressions":42000}}}'
        }
      ]
    }
  ]

  const supportedChains = [
    { name: "Ethereum", id: "eth / ethereum", chainId: "1", status: "live" },
    { name: "Base", id: "base", chainId: "8453", status: "live" },
    { name: "BSC", id: "bsc / bnb", chainId: "56", status: "live" },
    { name: "Solana", id: "sol / solana", chainId: "Non-EVM", status: "live" }
  ]

  const integrations = [
    { name: "Market Data", category: "Coverage", status: "live" },
    { name: "Wallet Intelligence", category: "Coverage", status: "live" },
    { name: "Risk Signals", category: "Coverage", status: "live" },
    { name: "DEX Routing", category: "Execution", status: "live" },
    { name: "Launchpad Events", category: "Realtime", status: "live" },
    { name: "Holder Analysis", category: "Analytics", status: "live" },
    { name: "Token Discovery", category: "Analytics", status: "live" },
    { name: "Sentiment Signals", category: "Analytics", status: "live" },
    { name: "Gas Intelligence", category: "Infrastructure", status: "live" }
  ]

  const totalEndpointCount = useMemo(
    () => endpoints.reduce((total, category) => total + category.items.length, 0),
    []
  )
  const protectedEndpointCount = useMemo(
    () => endpoints.reduce((total, category) => total + category.items.filter((item) => item.requiresAuth).length, 0),
    []
  )

  // Scroll tracking
  useEffect(() => {
    const handleScroll = () => {
      const sections = scrollSections.map((section) => document.getElementById(section.id))
      let activeId = 'overview'
      
      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i]
        if (section && section.offsetTop <= window.scrollY + 100) {
          activeId = section.id
          break
        }
      }
      setActiveSection(activeId)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [scrollSections])

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId)
    if (element) {
      const offset = 80
      const elementPosition = element.offsetTop - offset
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth'
      })
    }
  }

  const runEndpoint = async (endpoint) => {
    const endpointKey = `${endpoint.method}_${endpoint.path}`
    setLoading(prev => ({ ...prev, [endpointKey]: true }))
    
    try {
      // Show cached response with realistic delay
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setResponses(prev => ({
        ...prev,
        [endpointKey]: {
          status: 200,
          data: JSON.parse(endpoint.response),
          cached: true
        }
      }))
    } catch (error) {
      setResponses(prev => ({
        ...prev,
        [endpointKey]: {
          status: 500,
          error: 'Failed to parse example response'
        }
      }))
    } finally {
      setLoading(prev => ({ ...prev, [endpointKey]: false }))
    }
  }

  const copyToClipboard = async (commandKey, text) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const textarea = document.createElement('textarea')
        textarea.value = text
        textarea.setAttribute('readonly', '')
        textarea.style.position = 'absolute'
        textarea.style.left = '-9999px'
        document.body.appendChild(textarea)
        textarea.select()
        document.execCommand('copy')
        document.body.removeChild(textarea)
      }

      setCopiedCommand(commandKey)
      window.setTimeout(() => {
        setCopiedCommand((current) => (current === commandKey ? '' : current))
      }, 1600)
    } catch (error) {
      console.error('Failed to copy command', error)
    }
  }

  const CodeBlock = ({ children, language = 'bash', showHeader = true }) => {
    const highlightSyntax = (text) => {
      if (language === 'bash') {
        return text
          .replace(/(GET|POST|PUT|DELETE|PATCH)\s+/g, '<span class="method-highlight">$1</span> ')
          .replace(/(https?:\/\/[^\s\\]+)/g, '<span class="url-highlight">$1</span>')
      }
      return text
    }

    return (
      <div className={`code-example ${showHeader ? '' : 'code-example-no-header'}`.trim()}>
        {showHeader && (
          <div className="code-header">
            <span className="code-language">{language}</span>
          </div>
        )}
        <div className="code-block">
          <pre 
            className={`language-${language}`}
            dangerouslySetInnerHTML={{ __html: highlightSyntax(children) }}
          />
        </div>
      </div>
    )
  }

  const JsonBlock = ({ children }) => {
    const highlightJson = (text) => {
      return text
        .replace(/"([^"]+)":/g, '<span class="json-property">"$1":</span>')
        .replace(/:\s*"([^"]+)"/g, ': <span class="json-string">"$1"</span>')
        .replace(/:\s*(\d+\.?\d*)/g, ': <span class="json-number">$1</span>')
        .replace(/:\s*(true|false)/g, ': <span class="json-boolean">$1</span>')
        .replace(/:\s*(null)/g, ': <span class="json-null">$1</span>')
        .replace(/([{}[\],])/g, '<span class="json-punctuation">$1</span>')
    }

    return (
      <div className="code-example">
        <div className="code-header">
          <span className="code-language">json</span>
        </div>
        <div className="code-block json-block">
          <pre 
            className="language-json"
            dangerouslySetInnerHTML={{ __html: highlightJson(children) }}
          />
        </div>
      </div>
    )
  }

  const QuickStartExamplePanel = ({ commandKey, snippets }) => {
    const snippet = snippets[quickStartLanguage]

    return (
      <div className="auth-example-panel quick-start-example-panel">
        <div className="auth-example-tabs">
          {['curl', 'python', 'node.js'].map((language) => (
            <button
              key={language}
              type="button"
              className={`auth-example-tab ${quickStartLanguage === language ? 'active' : ''}`.trim()}
              onClick={() => setQuickStartLanguage(language)}
            >
              {language}
            </button>
          ))}
        </div>
        <div className="auth-example-shell">
          <div className="auth-example-top">
            <span className="auth-example-label">Example request</span>
            <button
              type="button"
              className={`quick-start-copy-button ${copiedCommand === commandKey ? 'copied' : ''}`.trim()}
              onClick={() => copyToClipboard(commandKey, snippet)}
            >
              {copiedCommand === commandKey ? 'Copied' : 'Copy'}
            </button>
          </div>
          <pre className="auth-example-code">{snippet}</pre>
        </div>
      </div>
    )
  }

  return (
    <div className="api-docs-page">
      {/* Mobile Menu Toggle */}
      <button
        className={`mobile-menu-toggle ${sidebarOpen ? 'is-open' : ''}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-expanded={sidebarOpen}
        aria-label={sidebarOpen ? 'Close API menu' : 'Open API menu'}
      >
        <span className="mobile-menu-toggle-arrow">{sidebarOpen ? '‹' : '›'}</span>
      </button>

      {/* Mobile Overlay */}
      <div 
        className={`mobile-menu-overlay ${sidebarOpen ? 'active' : ''}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* Navigation Sidebar */}
      <aside className={`api-docs-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-content">
          <h3 className="sidebar-title">API Documentation</h3>
          <nav className="sidebar-nav">
            {navigationSections.map((section) => (
              <button
                key={section.id}
                className={`nav-item ${activeSection === section.id ? 'active' : ''} ${section.tone === 'muted' ? 'nav-item-muted' : ''} ${section.nested ? 'nav-item-nested' : ''}`.trim()}
                onClick={() => {
                  if (section.path) {
                    navigate(section.path)
                  } else {
                    scrollToSection(section.id)
                  }
                  setSidebarOpen(false)
                }}
              >
                {section.label}
              </button>
            ))}
          </nav>
          <div className="sidebar-socials">
            <a href="https://t.me/clawclick" target="_blank" rel="noopener noreferrer" className="sidebar-social-link" title="Telegram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
              </svg>
              <span>Telegram</span>
            </a>
            <a href="https://x.com/clawclick" target="_blank" rel="noopener noreferrer" className="sidebar-social-link" title="X (Twitter)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
              <span>X (Twitter)</span>
            </a>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="api-docs-main">
        {/* Overview */}
        <header className="api-docs-header" id="overview">
          <div className="api-docs-container">
            <div className="api-docs-hero api-docs-hero--left">
              <span className="api-docs-kicker">Developer Docs</span>
              <h1 className="api-docs-title">Super API Documentation</h1>
              <p className="api-docs-subtitle">
                Unified Crypto Intelligence API — Access 50+ data providers through streamlined REST endpoints. The essential toolkit for crypto builders, analysts, and agents, featuring specialized aggregated data for critical insights. Built by traders, for traders.

              </p>
              <div className="api-docs-hero-actions">
                <button className="cta-button primary" type="button" onClick={() => navigate('/api/my-api')}>
                  Get API Key
                </button>
                <button className="cta-button secondary" type="button" onClick={() => scrollToSection('x402')}>
                  Explore x402
                </button>
              </div>
              <button
                type="button"
                className={`api-base-url--inline ${copiedCommand === 'base-url' ? 'copied' : ''}`.trim()}
                onClick={() => copyToClipboard('base-url', 'https://api.claw.click')}
              >
                <span className="base-url-label">Base URL</span>
                <code className="base-url">https://api.claw.click</code>
                <span className="base-url-copy-state">{copiedCommand === 'base-url' ? 'Copied' : 'Click to copy'}</span>
              </button>
              <div className="api-docs-overview-grid">
                <div className="api-docs-overview-card">
                  <span className="api-docs-overview-value">{totalEndpointCount}+</span>
                  <span className="api-docs-overview-label">Documented endpoints</span>
                </div>
                <div className="api-docs-overview-card">
                  <span className="api-docs-overview-value">99.87%</span>
                  <span className="api-docs-overview-label">Success rate</span>
                </div>
                <div className="api-docs-overview-card">
                  <span className="api-docs-overview-value">13</span>
                  <span className="api-docs-overview-label">DEXs</span>
                </div>
                <div className="api-docs-overview-card">
                  <span className="api-docs-overview-value">{x402Pricing.length}</span>
                  <span className="api-docs-overview-label">x402 priced routes</span>
                </div>
              </div>
              <div className="api-docs-highlight-row">
                <div className="api-docs-highlight-card">
                  <h3>One surface for crypto intelligence</h3>
                  <p>Market data, holder analytics, wallet review, sentiment, risk checks, execution helpers, live streams, and swaps routed through 13 DEXs with 1 endpoint.</p>
                </div>
                <div className="api-docs-highlight-card">
                  <h3>Flexible access</h3>
                  <p>Use API keys for normal access, then continue with x402 pay-per-request when you need it.</p>
                </div>
                <div className="api-docs-highlight-card">
                  <h3>Built for agents</h3>
                  <p>Clean REST responses, machine-readable pricing, and endpoint coverage designed for automated workflows.</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Quick Start */}
        <section className="quick-start-section" id="quickstart">
          <div className="api-docs-container">
            <h2 className="section-title">Quick Start</h2>
            <p className="section-description quick-start-description">
              Start with three common flows: inspect a token, run a fast risk check, then generate unsigned execution data.
            </p>
            <div className="quick-start-flow">
              {quickStartExamples.map((example) => (
                <div key={example.key} className="quick-start-item">
                  <div className="quick-start-item-meta">
                    <div className="quick-start-step-head">
                      <span className="quick-start-step-index">{example.index}</span>
                      <span className="quick-start-step-kicker">{example.kicker}</span>
                    </div>
                  </div>
                  <div className="quick-start-item-body">
                    <h3>{example.title}</h3>
                    <p>{example.description}</p>
                    <QuickStartExamplePanel
                      commandKey={`quickstart-${example.key}-${quickStartLanguage}`}
                      snippets={example.snippets}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* API Endpoints */}
        <section className="endpoints-section" id="endpoints">
          <div className="api-docs-container">
            <h2 className="section-title">API Endpoints</h2>
            <p className="section-description">
              Comprehensive endpoint reference with interactive examples
            </p>

            {endpoints.map((category) => (
              <div key={category.category} className="endpoint-category">
                <h3 className="category-title">{category.category}</h3>
                <div className="endpoints-table">
                  <div className="table-header">
                    <span>Endpoint</span>
                    <span>Description</span>
                    <span>Actions</span>
                  </div>
                  
                  {category.items.map((endpoint, index) => {
                    const endpointKey = `${endpoint.method}_${endpoint.path}`
                    const isExpanded = expandedEndpoint === endpointKey
                    const isLoading = loading[endpointKey]
                    const response = responses[endpointKey]

                    return (
                      <div key={index} className="endpoint-row">
                        <div className="endpoint-summary" onClick={() => setExpandedEndpoint(isExpanded ? null : endpointKey)}>
                          <code className="endpoint-path">{endpoint.path}</code>
                          <span className="endpoint-description">{endpoint.description}</span>
                          <div className="endpoint-badges">
                            <span className={`method method-${endpoint.method.toLowerCase()}`}>
                              {endpoint.method}
                            </span>
                            <span className={`auth-status ${endpoint.requiresAuth ? 'required' : 'public'}`}>
                              {endpoint.requiresAuth ? 'API Key Required' : 'Public'}
                            </span>
                            <button 
                              className="run-button"
                              onClick={(e) => {
                                e.stopPropagation()
                                runEndpoint(endpoint)
                              }}
                              disabled={isLoading}
                            >
                              {isLoading ? 'Running...' : 'Run'}
                            </button>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="endpoint-details">
                            {endpoint.params && (
                              <div className="params-section">
                                <h4>Parameters</h4>
                                <div className="params-table">
                                  <div className="params-header">
                                    <span>Parameter</span>
                                    <span>Required</span>
                                    <span>Default</span>
                                    <span>Description</span>
                                  </div>
                                  {endpoint.params.map((param, pidx) => (
                                    <div key={pidx} className="param-row">
                                      <code className="param-name">{param.name}</code>
                                      <span className={`param-required ${param.required ? 'required' : 'optional'}`}>
                                        {param.required ? 'Yes' : 'No'}
                                      </span>
                                      <code className="param-default">{param.default}</code>
                                      <span className="param-description">{param.description}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            <div className="example-section">
                              <h4>Example Request</h4>
                              <CodeBlock language="bash">{endpoint.example}</CodeBlock>
                            </div>

                            <div className="response-section">
                              <h4>
                                {response ? (
                                  <>
                                    Live Response{' '}
                                    <span className={`status-code ${response.status === 200 ? 'success' : 'error'}`}>
                                      {response.status}
                                    </span>
                                    {response.cached && <span className="cached-badge">Cached Example</span>}
                                  </>
                                ) : (
                                  'Example Response'
                                )}
                              </h4>
                              {response ? (
                                response.data ? (
                                  <JsonBlock>{JSON.stringify(response.data, null, 2)}</JsonBlock>
                                ) : (
                                  <div className="error-response">{response.error}</div>
                                )
                              ) : (
                                <JsonBlock>{JSON.stringify(JSON.parse(endpoint.response), null, 2)}</JsonBlock>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Always show response directly below if Run was clicked */}
                        {response && !isExpanded && (
                          <div className="endpoint-response-direct">
                            <div className="response-header">
                              <h4>
                                Response{' '}
                                <span className={`status-code ${response.status === 200 ? 'success' : 'error'}`}>
                                  {response.status}
                                </span>
                                {response.cached && <span className="cached-badge">Cached Example</span>}
                              </h4>
                            </div>
                            {response.data ? (
                              <JsonBlock>{JSON.stringify(response.data, null, 2)}</JsonBlock>
                            ) : (
                              <div className="error-response">{response.error}</div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Authentication */}
        <section className="auth-section" id="auth">
          <div className="api-docs-container">
            <h2 className="section-title">Authentication</h2>
            <p className="section-description auth-description">
              Most endpoints require an API key. Send it in the `x-api-key` header on every protected request.
            </p>
            <div className="auth-layout">
              <div className="auth-reference">
                <div className="auth-reference-block">
                  <h3>Public routes</h3>
                  <p>No authentication required.</p>
                  <ul className="auth-route-list">
                    <li><code>/health</code></li>
                    <li><code>/providers</code></li>
                  </ul>
                </div>
                <div className="auth-reference-block">
                  <h3>Protected routes</h3>
                  <p>Include your API key in request headers.</p>
                  <ul className="auth-rule-list">
                    <li>Send <code>x-api-key: YOUR_API_KEY</code> on REST calls.</li>
                    <li>You can also use <code>Authorization: Bearer YOUR_API_KEY</code>.</li>
                    <li>x402 can be used on supported routes when key access is unavailable or rate-limited.</li>
                  </ul>
                </div>
              </div>
              <div className="auth-example-panel">
                <div className="auth-example-tabs">
                  <span className="auth-example-tab active">curl</span>
                  <span className="auth-example-tab">headers</span>
                </div>
                <div className="auth-example-shell">
                  <div className="auth-example-top">
                    <span className="auth-example-label">Header example</span>
                    <button
                      type="button"
                      className={`quick-start-copy-button ${copiedCommand === 'auth-example' ? 'copied' : ''}`.trim()}
                      onClick={() => copyToClipboard('auth-example', `curl -H "x-api-key: YOUR_API_KEY" \\
  "https://api.claw.click/tokenPoolInfo?chain=eth&tokenAddress=0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"`)}
                    >
                      {copiedCommand === 'auth-example' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <pre className="auth-example-code">{`curl -H "x-api-key: YOUR_API_KEY" \\
  "https://api.claw.click/tokenPoolInfo?chain=eth&tokenAddress=0xA0b86991c6218b36c1d19d4a2e9eb0ce3606eb48"`}</pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Supported Chains */}
        <section className="chains-section" id="chains">
          <div className="api-docs-container">
            <h2 className="section-title">Supported Chains</h2>
            <div className="chains-grid">
              {supportedChains.map((chain, index) => (
                <div key={index} className="chain-item">
                  <div className="chain-header">
                    <span className="chain-name">{chain.name}</span>
                    <span className={`chain-status status-${chain.status}`}>
                      {chain.status}
                    </span>
                  </div>
                  <div className="chain-details">
                    <span className="chain-id">Chain ID: {chain.chainId}</span>
                    <span className="chain-alias">({chain.id})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WebSockets */}
        <section className="websocket-section" id="websockets">
          <div className="api-docs-container">
            <h2 className="section-title">WebSocket Streaming</h2>
            <p className="section-description websocket-description">
              Subscribe to live event streams when polling is too slow for launches, social firehoses, and market triggers.
            </p>
            <div className="websocket-grid">
              <div className="websocket-reference">
                <div className="websocket-reference-block">
                  <h3>Live feed</h3>
                  <p>Connect to <code>wss://api.claw.click/ws/launchpadEvents</code> for realtime launchpad events.</p>
                </div>
                <div className="websocket-reference-block">
                  <h3>What it delivers</h3>
                  <p>Stream token launches and protocol events as they happen, then filter down to the launchpads you care about.</p>
                  <ul className="websocket-reference-list">
                    <li>Low-latency event delivery</li>
                    <li>Protocol-level filtering</li>
                    <li>JSON payloads for bots and frontends</li>
                  </ul>
                </div>
              </div>
              <div className="websocket-card websocket-card-code">
                <div className="auth-example-panel websocket-example-panel">
                  <div className="auth-example-tabs">
                    {['node.js', 'python'].map((language) => (
                      <button
                        key={language}
                        type="button"
                        className={`auth-example-tab ${websocketLanguage === language ? 'active' : ''}`.trim()}
                        onClick={() => setWebsocketLanguage(language)}
                      >
                        {language}
                      </button>
                    ))}
                  </div>
                  <div className="auth-example-shell">
                    <div className="auth-example-top">
                      <span className="auth-example-label">Subscribe after the info handshake</span>
                      <button
                        type="button"
                        className={`quick-start-copy-button ${copiedCommand === `websocket-${websocketLanguage}` ? 'copied' : ''}`.trim()}
                        onClick={() => copyToClipboard(`websocket-${websocketLanguage}`, websocketExamples[websocketLanguage])}
                      >
                        {copiedCommand === `websocket-${websocketLanguage}` ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <pre className="auth-example-code">{websocketExamples[websocketLanguage]}</pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Error Handling */}
        <section className="error-section" id="error-handling">
          <div className="api-docs-container">
            <h2 className="section-title">Error Handling</h2>
            <p className="section-description error-description">
              Error responses are returned as JSON with an `error` field and a human-readable `message`.
            </p>
            <div className="error-reference-list">
              {[
                {
                  title: 'Validation Error',
                  status: '400',
                  summary: 'Returned when required params are missing or request input is malformed.',
                  response: `{
  "error": "Validation error",
  "message": "Invalid query parameters: tokenAddress - Required"
}`,
                },
                {
                  title: 'Invalid Chain',
                  status: '400',
                  summary: 'Returned when the requested chain is unsupported for that route.',
                  response: `{
  "error": "Invalid chain",
  "message": "Unsupported chain. Valid: eth, base, bsc, sol"
}`,
                },
                {
                  title: 'Payment Required',
                  status: '402',
                  summary: 'Returned on x402-enabled routes when the request needs payment. This usually happens when no API key is provided, the key cannot access the route, or rate-limited clients continue through x402. The response includes a PAYMENT-REQUIRED header describing accepted payment options.',
                  response: `{
  "error": "Payment required",
  "message": "This route requires x402 payment or eligible API key access. Check the PAYMENT-REQUIRED header for accepted payment options."
}`,
                },
                {
                  title: 'Not Found',
                  status: '404',
                  summary: 'Returned when the route does not exist or the requested resource cannot be found.',
                  response: `{
  "error": "Not found",
  "message": "Route does not exist."
}`,
                },
                {
                  title: 'Server Error',
                  status: '500',
                  summary: 'Returned when an unexpected server-side failure occurs.',
                  response: `{
  "error": "Internal server error",
  "message": "Something went wrong."
}`,
                },
              ].map((e) => (
                <div key={`${e.status}-${e.title}`} className="error-reference-item">
                  <div className="error-reference-meta">
                    <div className="error-reference-head">
                      <span className="error-reference-status">{e.status}</span>
                      <h3>{e.title}</h3>
                    </div>
                    <p>{e.summary}</p>
                  </div>
                  <pre className="error-reference-code">{e.response}</pre>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Integrations */}
        <section className="integrations-section" id="integrations">
          <div className="api-docs-container">
            <h2 className="section-title">Platform Capabilities</h2>
            <p className="section-description">Unified coverage across market data, execution, risk, analytics, and realtime event flows.</p>
            <div className="api-integrations-grid">
              {[
                { name: "Realtime Market Coverage", category: "Market Data", live: true },
                { name: "Token Discovery", category: "Analytics", live: true },
                { name: "Wallet Review", category: "Portfolio", live: true },
                { name: "Risk Scanning", category: "Risk", live: true },
                { name: "DEX Quotes", category: "Execution", live: true },
                { name: "DEX Transaction Building", category: "Execution", live: true },
                { name: "Launchpad Monitoring", category: "Realtime", live: true },
                { name: "Holder Analysis", category: "Analytics", live: true },
                { name: "Smart Money Tracking", category: "Analytics", live: true },
                { name: "Gas Tracking", category: "Infrastructure", live: true },
                { name: "Sentiment Monitoring", category: "Analytics", live: true },
                { name: "Social Signal Search", category: "Social", live: true },
                { name: "Token Screening", category: "Discovery", live: true },
                { name: "Strategy Guides", category: "Resources", live: true },
                { name: "Rolling Agent Stats", category: "Realtime", live: true },
              ].map((item, i) => (
                <div key={i} className={`api-integration-chip${item.live ? ' chip-live' : ''}`}>
                  <div className="api-integration-top">
                    <span className="api-integration-name">{item.name}</span>
                    {item.live && (
                      <span className="api-live-badge">
                        <span className="api-live-dot" />
                        LIVE
                      </span>
                    )}
                  </div>
                  <span className="api-integration-cat">{item.category}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="x402-section" id="x402">
          <div className="api-docs-container">
            <div className="x402-header">
              <div>
                <h2 className="section-title">x402 Payments</h2>
                <p className="section-description">
                  Continue using paid Claw.Click endpoints with x402 when you do not have an API key or when you want pay-per-request access.
                </p>
              </div>
              <a href="https://docs.x402.org/getting-started/quickstart-for-buyers" target="_blank" rel="noopener noreferrer" className="x402-doc-link">
                x402.org
              </a>
            </div>

            <div className="x402-grid">
              <div className="x402-card">
                <h3>How It Works</h3>
                <p>
                  Protected endpoints return <code>402 Payment Required</code> with machine-readable payment requirements.
                  Your client signs the payment payload, retries the same request, and the response is delivered after settlement.
                </p>
                <ul className="x402-list">
                  <li>Base and Solana USDC payment rails supported</li>
                  <li>Works for agentic clients and normal server-side integrations</li>
                  <li>No account creation required for pay-per-request access</li>
                </ul>
              </div>

              <div className="x402-card">
                <h3>Setup</h3>
                <ol className="x402-list x402-list-numbered">
                  <li>Read the x402 seller and buyer guides at <a href="https://docs.x402.org/" target="_blank" rel="noopener noreferrer">x402.org</a>.</li>
                  <li>Call a paid Claw.Click endpoint and inspect the <code>PAYMENT-REQUIRED</code> header.</li>
                  <li>Create a payment payload with an x402 client for Base or Solana.</li>
                  <li>Retry the same request with <code>PAYMENT-SIGNATURE</code>.</li>
                </ol>
                <p className="x402-note">
                  Learn more about our API surface at <a href="https://claw.click/api" target="_blank" rel="noopener noreferrer">claw.click/api</a>.
                </p>
              </div>
            </div>

            <div className="x402-pricing">
              <div className="x402-pricing-header">
                <h3>x402 Endpoint Pricing</h3>
                <p>Current pay-per-request prices for x402-enabled endpoints.</p>
              </div>
              <div className="x402-pricing-table">
                <div className="x402-pricing-table-header">
                  <span>Endpoint</span>
                  <span>Returns</span>
                  <span>Price</span>
                </div>
                {x402Pricing.map((endpoint) => (
                  <div key={`${endpoint.method}_${endpoint.path}`} className="x402-pricing-row">
                    <div className="x402-endpoint-cell">
                      <span className={`method method-${endpoint.method.toLowerCase()}`}>{endpoint.method}</span>
                      <code>{endpoint.path}</code>
                    </div>
                    <span className="x402-endpoint-note">{endpoint.note}</span>
                    <span className="x402-price">{endpoint.price}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="api-cta-section">
          <div className="api-docs-container">
            <div className="api-cta">
              <h2 className="cta-title">Ready to Build?</h2>
              <p className="cta-description">
                Get your API key and start building with unified trading infrastructure.
              </p>
              <div className="cta-buttons">
                <button className="cta-button primary" type="button" onClick={() => navigate('/api/my-api')}>Get API Key</button>
                <button className="cta-button secondary" type="button" onClick={() => scrollToSection('x402')}>Explore x402</button>
                <a href="https://github.com/clawclick" target="_blank" rel="noopener noreferrer" className="cta-button secondary">
                  View GitHub
                </a>
              </div>
            </div>
            <div className="api-footer">
              <p className="footer-text">
                Open source API infrastructure by{' '}
                <a href="https://github.com/clawclick" target="_blank" rel="noopener noreferrer" className="footer-link">
                  Claw.Click
                </a>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default ApiDocs
