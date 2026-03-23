import React from 'react'

const row1 = [
  { name: 'Dexscreener', logo: '/integrations/Dexscreener+logo.jpg' },
  { name: 'DeFiLlama', logo: '/integrations/653ef3f92944e7d505ca0e91_DefiLlama Logo-p-500.png' },
  { name: 'Etherscan', logo: '/integrations/etherscanlogo-freelogovectors.net_.png' },
  { name: 'Moralis', logo: '/integrations/Blog-Moralis-Logo.png' },
]

const row2 = [
  { name: 'Dune Analytics', logo: '/integrations/dune-1.png' },
  { name: 'CoinGecko', logo: '/integrations/coingecko.png' },
  { name: 'Binance', logo: '/integrations/0_0PMnB3TBjf0r4eAt.png' },
  { name: 'Nansen', logo: '/integrations/nansen.png' },
]

const row3 = [
  { name: 'Ethereum', logo: '/integrations/0fe184c9a32f0de4ff2c42a1921c004e2bb6004637d7821067027febf6d4f6b5.png' },
  { name: 'Alchemy', logo: '/integrations/Alchemy_logo_black_highresolution.jpg' },
  { name: 'Solana', logo: '/integrations/Solana-1.png' },
  { name: 'CoinMarketCap', logo: '/integrations/unnamed.png' },
]

const CarouselRow = ({ items, direction }) => (
  <div className={`carousel-row carousel-row--${direction}`}>
    {[...items, ...items, ...items, ...items].map((item, i) => (
      <div key={i} className="carousel-logo-item">
        <img
          src={item.logo}
          alt={item.name}
          className="carousel-logo-img"
          onError={e => { e.target.style.display = 'none' }}
        />
      </div>
    ))}
  </div>
)

const IntegrationCarousel = () => (
  <section className="integration-carousel-section">
    <div className="integration-carousel-header">
      <span className="code-showcase-tag">37 Live Integrations</span>
      <h2 className="integration-carousel-title">Connected to everything</h2>
      <p className="integration-carousel-subtitle">
        Every major chain, DEX, analytics platform and data provider — unified behind one API.
      </p>
      <div className="integration-stats-row">
        <div className="integration-stat-item">
          <span className="integration-stat-num">37</span>
          <span className="integration-stat-label">Live Now</span>
        </div>
        <div className="integration-stat-item">
          <span className="integration-stat-num">23</span>
          <span className="integration-stat-label">Coming Soon</span>
        </div>
        <div className="integration-stat-item">
          <span className="integration-stat-num">99.9%</span>
          <span className="integration-stat-label">Uptime</span>
        </div>
      </div>
    </div>
    <div className="carousel-track-wrap">
      <CarouselRow items={row1} direction="right" />
      <CarouselRow items={row2} direction="left" />
      <CarouselRow items={row3} direction="right" />
    </div>
  </section>
)

export default IntegrationCarousel
