import React from 'react'

const AnimatedCube = () => {
  return (
    <div className="animated-cube-container">
      <svg
        width="120"
        height="120"
        viewBox="0 0 200 200"
        className="animated-cube"
      >
        <defs>
          <linearGradient id="cubeGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(13, 158, 138, 0.8)" />
            <stop offset="50%" stopColor="rgba(92, 212, 190, 0.6)" />
            <stop offset="100%" stopColor="rgba(13, 158, 138, 0.4)" />
          </linearGradient>
          <linearGradient id="cubeGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(13, 158, 138, 0.6)" />
            <stop offset="100%" stopColor="rgba(10, 120, 104, 0.8)" />
          </linearGradient>
          <linearGradient id="cubeGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(92, 212, 190, 0.5)" />
            <stop offset="100%" stopColor="rgba(13, 158, 138, 0.7)" />
          </linearGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <g className="cube-group">
          <polygon
            points="50,60 150,60 150,140 50,140"
            fill="url(#cubeGradient1)"
            stroke="#000000"
            strokeWidth="2"
            opacity="0.7"
          />
          <polygon
            points="150,60 170,40 170,120 150,140"
            fill="url(#cubeGradient2)"
            stroke="#000000"
            strokeWidth="2"
          />
          <polygon
            points="50,60 70,40 170,40 150,60"
            fill="url(#cubeGradient3)"
            stroke="#000000"
            strokeWidth="2"
          />
          <polygon
            points="50,60 150,60 170,40 70,40"
            fill="none"
            stroke="#000000"
            strokeWidth="2"
          />
          <polygon
            points="150,60 170,40 170,120 150,140"
            fill="none"
            stroke="#000000"
            strokeWidth="2"
          />
          <polygon
            points="50,140 150,140 170,120 70,120"
            fill="none"
            stroke="#000000"
            strokeWidth="2"
          />
          <polygon
            points="50,60 50,140 70,120 70,40"
            fill="none"
            stroke="#000000"
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  )
}

export default AnimatedCube