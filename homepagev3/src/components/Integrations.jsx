import React from 'react'
import { useReveal } from '../hooks/useReveal'

const integrationLogos = [
  { name: 'Dexscreener', src: '/integrations/Dexscreener+logo.jpg', className: 'dexscreener', hover: '#0066FF' },
  { name: 'DeFiLlama', src: '/integrations/653ef3f92944e7d505ca0e91_DefiLlama Logo-p-500.png', className: 'defillama', hover: '#4F46E5' },
  { name: 'Etherscan', src: '/integrations/etherscanlogo-freelogovectors.net_.png', className: 'etherscan', hover: '#21325B' },
  { name: 'Moralis', src: '/integrations/Blog-Moralis-Logo.png', className: 'moralis', hover: '#41D195' },
  { name: 'BSC Scan', src: '/integrations/bscscan.png', className: 'bscscan', hover: '#F0B90B' },
  { name: 'Nansen', src: '/integrations/nansen.png', className: 'nansen', hover: '#6366F1' },
  { name: 'Dune Analytics', src: '/integrations/dune-1.png', className: 'dune', hover: '#FF6B35' },
  { name: 'Polymarket', src: '/integrations/Polymarket_Logo.jpg', className: 'polymarket', hover: '#7C3AED' },
  { name: 'CoinGecko', src: '/integrations/coingecko.png', className: 'coingecko', hover: '#8DC647' },
  { name: 'X (Twitter)', src: '/integrations/R.png', className: 'twitter', hover: '#111111' },
  { name: 'Binance', src: '/integrations/0_0PMnB3TBjf0r4eAt.png', className: 'binance', hover: '#F0B90B' },
  { name: 'PancakeSwap', src: '/integrations/OIP (2).webp', className: 'pancakeswap', hover: '#D1884F' },
  { name: 'Ethereum', src: '/integrations/0fe184c9a32f0de4ff2c42a1921c004e2bb6004637d7821067027febf6d4f6b5.png', className: 'ethereum', hover: '#627EEA' },
  { name: 'Alchemy', src: '/integrations/Alchemy_logo_black_highresolution.jpg', className: 'alchemy', hover: '#363FF9' },
  { name: 'TradingView', src: '/integrations/0_dtGHiihVsdIgCHcw.png', className: 'tradingview', hover: '#2962FF' },
  { name: 'CoinMarketCap', src: '/integrations/unnamed.png', className: 'coinmarketcap', hover: '#17A2B8' },
  { name: 'Solana', src: '/integrations/Solana-1.png', className: 'solana', hover: '#9945FF' },
  { name: 'Reddit', src: '/integrations/Reddit-Logo-2017.png', className: 'reddit', hover: '#FF4500' },
]

const bubblePalettes = [
  ['rgba(228, 75, 46, 0.28)', 'rgba(245, 106, 74, 0.18)'],
  ['rgba(207, 63, 39, 0.24)', 'rgba(169, 46, 31, 0.18)'],
  ['rgba(59, 130, 246, 0.22)', 'rgba(96, 165, 250, 0.14)'],
  ['rgba(34, 197, 94, 0.2)', 'rgba(74, 222, 128, 0.14)'],
  ['rgba(168, 85, 247, 0.2)', 'rgba(192, 132, 252, 0.14)'],
  ['rgba(236, 72, 153, 0.2)', 'rgba(244, 114, 182, 0.14)'],
]

const marqueeRows = [
  integrationLogos,
  [...integrationLogos.slice(6), ...integrationLogos.slice(0, 6)],
  [...integrationLogos.slice(12), ...integrationLogos.slice(0, 12)],
]

const hexToRgba = (hex, alpha) => {
  const normalized = hex.replace('#', '')
  const value = normalized.length === 3
    ? normalized.split('').map((char) => char + char).join('')
    : normalized

  const red = Number.parseInt(value.slice(0, 2), 16)
  const green = Number.parseInt(value.slice(2, 4), 16)
  const blue = Number.parseInt(value.slice(4, 6), 16)

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`
}

const particleLayout = [
  { x: '8%', y: '72%', size: '4px', dx: '-16px', dy: '-34px', delay: '0s' },
  { x: '22%', y: '18%', size: '6px', dx: '20px', dy: '-28px', delay: '0.08s' },
  { x: '48%', y: '78%', size: '5px', dx: '-10px', dy: '-42px', delay: '0.16s' },
  { x: '66%', y: '24%', size: '4px', dx: '14px', dy: '-36px', delay: '0.24s' },
  { x: '84%', y: '62%', size: '5px', dx: '18px', dy: '-26px', delay: '0.32s' },
  { x: '14%', y: '42%', size: '3px', dx: '-12px', dy: '-24px', delay: '0.4s' },
  { x: '38%', y: '10%', size: '4px', dx: '10px', dy: '-32px', delay: '0.48s' },
  { x: '72%', y: '80%', size: '6px', dx: '16px', dy: '-38px', delay: '0.56s' },
  { x: '92%', y: '34%', size: '3px', dx: '12px', dy: '-22px', delay: '0.64s' },
]

const handleIntegrationMove = (event) => {
  const rect = event.currentTarget.getBoundingClientRect()
  const mouseX = `${event.clientX - rect.left}px`
  const mouseY = `${event.clientY - rect.top}px`

  event.currentTarget.style.setProperty('--mouse-x', mouseX)
  event.currentTarget.style.setProperty('--mouse-y', mouseY)
}

const Integrations = () => {
  const [ref, visible] = useReveal(0.1)

  return (
    <section className={`integrations ${visible ? 'revealed' : ''}`} ref={ref}>
      <div className="section-header">
        <span className="section-label">Integrations</span>
        <h2 className="section-title">
          Connected to <span className="text-gradient">everything</span>
        </h2>
        <p className="section-desc">
          45+ data sources, DEXs, and analytics platforms — all through one unified API.
        </p>
      </div>

      <div className="integrations-count">
        <span className="integrations-count-num">45+</span>
        <span className="integrations-count-label">Active Integrations</span>
      </div>

      <div className="integrations-marquee">
        {marqueeRows.map((row, rowIndex) => {
          const doubledRow = [...row, ...row]

          return (
            <div
              key={rowIndex}
              className={`integrations-row integrations-row--${rowIndex + 1}`}
            >
              <div className={`marquee-track ${rowIndex % 2 === 1 ? 'marquee-track--reverse' : 'marquee-track--forward'}`}>
                {doubledRow.map((logo, itemIndex) => {
                  const palette = bubblePalettes[(rowIndex * 3 + itemIndex) % bubblePalettes.length]
                  const particleBase = hexToRgba(logo.hover, 0.9)
                  const particleSoft = hexToRgba(logo.hover, 0.55)
                  const particleGlow = hexToRgba(logo.hover, 0.35)

                  return (
                    <div
                      key={`${rowIndex}-${itemIndex}-${logo.name}`}
                      className={`integration-item ${logo.className}`}
                      title={logo.name}
                      onMouseMove={handleIntegrationMove}
                      style={{
                        '--integration-bubble': palette[0],
                        '--integration-bubble-alt': palette[1],
                        '--integration-hover': logo.hover,
                      }}
                    >
                      <span className="integration-spotlight" aria-hidden="true" />
                      <div className="integration-particles" aria-hidden="true">
                        {particleLayout.map((particle, particleIndex) => (
                          <span
                            key={`${logo.name}-${particleIndex}`}
                            className="integration-particle"
                            style={{
                              '--particle-x': particle.x,
                              '--particle-y': particle.y,
                              '--particle-size': particle.size,
                              '--particle-dx': particle.dx,
                              '--particle-dy': particle.dy,
                              '--particle-delay': particle.delay,
                              '--particle-color': particleIndex % 3 === 0 ? particleBase : particleSoft,
                              '--particle-glow': particleGlow,
                            }}
                          />
                        ))}
                      </div>
                      <img src={logo.src} alt={logo.name} loading="lazy" />
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

export default Integrations
