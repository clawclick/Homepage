import React, { useEffect, useRef, useState } from 'react'

const InteractiveChart = () => {
  const [tooltip, setTooltip] = useState(null)
  const [animationProgress, setAnimationProgress] = useState(0)
  const [started, setStarted] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    if (containerRef.current) observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [started])

  useEffect(() => {
    if (!started) return
    const duration = 4000
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      setAnimationProgress(progress)

      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }

    const timer = setTimeout(() => {
      animate()
    }, 300)

    return () => clearTimeout(timer)
  }, [started])

  const chartData = [
    { x: 20, liquidity: 25, volume: 30, buyRatio: 28, holderGrowth: 20 },
    { x: 35, liquidity: 45, volume: 52, buyRatio: 48, holderGrowth: 40 },
    { x: 50, liquidity: 68, volume: 75, buyRatio: 72, holderGrowth: 65 },
    { x: 65, liquidity: 85, volume: 92, buyRatio: 89, holderGrowth: 82 },
    { x: 80, liquidity: 95, volume: 98, buyRatio: 96, holderGrowth: 93 },
    { x: 95, liquidity: 88, volume: 85, buyRatio: 82, holderGrowth: 79 },
    { x: 110, liquidity: 72, volume: 68, buyRatio: 65, holderGrowth: 62 },
    { x: 125, liquidity: 55, volume: 48, buyRatio: 45, holderGrowth: 42 },
    { x: 140, liquidity: 35, volume: 32, buyRatio: 28, holderGrowth: 25 },
  ]

  const handleMouseMove = (event, dataPoint) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top
    const signalStrength = Math.round(
      dataPoint.liquidity * 0.3 +
      dataPoint.volume * 0.25 +
      dataPoint.buyRatio * 0.25 +
      dataPoint.holderGrowth * 0.2
    )

    setTooltip({
      x: x + 10,
      y: y - 10,
      data: dataPoint,
      signalStrength,
    })
  }

  return (
    <div className="chart-container" ref={containerRef}>
      <div className="chart-header">
        <span className="chart-time">24h Momentum Analysis</span>
        <span className="chart-status">● LIVE</span>
      </div>

      <svg
        width="100%"
        height="180"
        viewBox="0 0 200 180"
        onMouseLeave={() => setTooltip(null)}
        className="signal-chart"
      >
        <defs>
          <pattern id="grid" width="20" height="18" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 18" fill="none" stroke="rgba(13, 158, 138, 0.14)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        <polyline
          fill="none"
          stroke="#1de9b6"
          strokeWidth="2.5"
          points={chartData.slice(0, Math.ceil(chartData.length * animationProgress)).map((point) => `${point.x},${160 - point.liquidity}`).join(' ')}
          className="chart-line"
        />

        <polyline
          fill="none"
          stroke="#29b6f6"
          strokeWidth="2.5"
          points={chartData.slice(0, Math.ceil(chartData.length * animationProgress)).map((point) => `${point.x},${160 - point.volume}`).join(' ')}
          className="chart-line"
        />

        <polyline
          fill="none"
          stroke="#7dd3fc"
          strokeWidth="2.5"
          points={chartData.slice(0, Math.ceil(chartData.length * animationProgress)).map((point) => `${point.x},${160 - point.buyRatio}`).join(' ')}
          className="chart-line"
        />

        <polyline
          fill="none"
          stroke="#facc15"
          strokeWidth="2.5"
          points={chartData.slice(0, Math.ceil(chartData.length * animationProgress)).map((point) => `${point.x},${160 - point.holderGrowth}`).join(' ')}
          className="chart-line"
        />

        {animationProgress > 0.1 && (
          <g>
            <rect x="15" y="140" width="28" height="16" fill="#1de9b6" rx="3" />
            <text x="29" y="151" fill="#03110d" fontSize="8" fontWeight="700" textAnchor="middle">BUY</text>
          </g>
        )}

        {animationProgress > 0.6 && (
          <g>
            <rect x="67" y="45" width="30" height="16" fill="#f43f5e" rx="3" />
            <text x="82" y="56" fill="#ffffff" fontSize="8" fontWeight="700" textAnchor="middle">SELL</text>
          </g>
        )}

        {chartData.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={160 - point.volume}
            r="6"
            fill="transparent"
            onMouseMove={(event) => handleMouseMove(event, point)}
          />
        ))}
      </svg>

      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#1de9b6' }} />
          <span>Liquidity</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#29b6f6' }} />
          <span>Volume</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#7dd3fc' }} />
          <span>Buy/Sell</span>
        </div>
        <div className="legend-item">
          <span className="legend-color" style={{ backgroundColor: '#facc15' }} />
          <span>Holders</span>
        </div>
      </div>

      {tooltip && (
        <div
          className="chart-tooltip"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: tooltip.x > 150 ? 'translateX(-100%)' : 'none',
          }}
        >
          <div className="tooltip-header">Signal Strength: {tooltip.signalStrength}/100</div>
          <div className="tooltip-metrics">
            <div>Liquidity: {tooltip.data.liquidity}%</div>
            <div>Volume: {tooltip.data.volume}%</div>
            <div>Buy/Sell: {tooltip.data.buyRatio}%</div>
            <div>Holders: {tooltip.data.holderGrowth}%</div>
          </div>
        </div>
      )}
    </div>
  )
}

export default InteractiveChart