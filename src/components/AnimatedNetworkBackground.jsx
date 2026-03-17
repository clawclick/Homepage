import React, { useEffect, useRef } from 'react'

const AnimatedNetworkBackground = () => {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined

    const ctx = canvas.getContext('2d')
    if (!ctx) return undefined

    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    let raf = 0
    let w = 0
    let h = 0
    let reduced = mq.matches
    let particles = []

    const CONNECTION_DIST = 300
    const PARTICLE_COUNT_BASE = 80

    // brand colors from API partner section
    const COLORS = [
      '#0066FF',
      '#4F46E5',
      '#41D195',
      '#F0B90B',
      '#6366F1',
      '#FF6B35',
      '#7C3AED',
      '#8DC647',
      '#D1884F',
      '#627EEA',
      '#363FF9',
      '#2962FF',
      '#17A2B8',
      '#9945FF',
      '#FF4500',
      '#6123c3',
    ]

    const createParticles = () => {
      const count = Math.round(PARTICLE_COUNT_BASE * (w * h) / (1400 * 800))
      particles = Array.from({ length: Math.min(count, 200) }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.4,
        vy: (Math.random() - 0.5) * 0.4,
        r: 1.5 + Math.random() * 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      }))
    }

    const draw = () => {
      ctx.clearRect(0, 0, w, h)

      // update positions
      for (const p of particles) {
        if (!reduced) {
          p.x += p.vx
          p.y += p.vy

          // wrap around edges with padding
          if (p.x < -50) p.x = w + 50
          if (p.x > w + 50) p.x = -50
          if (p.y < -50) p.y = h + 50
          if (p.y > h + 50) p.y = -50
        }
      }

      // draw connections with gradient from dot color to dot color
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i]
          const b = particles[j]
          const dx = a.x - b.x
          const dy = a.y - b.y
          const d = Math.sqrt(dx * dx + dy * dy)

          if (d < CONNECTION_DIST) {
            const alpha = (1 - d / CONNECTION_DIST) * 0.45
            const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y)
            grad.addColorStop(0, a.color)
            grad.addColorStop(1, b.color)

            ctx.beginPath()
            ctx.moveTo(a.x, a.y)
            ctx.lineTo(b.x, b.y)
            ctx.strokeStyle = grad
            ctx.globalAlpha = alpha
            ctx.lineWidth = 1
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        }
      }

      // draw particles
      for (const p of particles) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = p.color
        ctx.globalAlpha = 0.85
        ctx.fill()
        ctx.globalAlpha = 1
      }

      raf = requestAnimationFrame(draw)
    }

    const setup = () => {
      w = canvas.clientWidth || window.innerWidth
      h = canvas.clientHeight || window.innerHeight
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.max(1, Math.floor(w * dpr))
      canvas.height = Math.max(1, Math.floor(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      createParticles()
    }

    const onResize = () => {
      cancelAnimationFrame(raf)
      setup()
      raf = requestAnimationFrame(draw)
    }

    const onMotion = (e) => {
      reduced = e.matches
      onResize()
    }

    setup()
    raf = requestAnimationFrame(draw)

    window.addEventListener('resize', onResize)
    mq.addEventListener('change', onMotion)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', onResize)
      mq.removeEventListener('change', onMotion)
    }
  }, [])

  return <canvas ref={canvasRef} className="hero-network-canvas" aria-hidden="true" />
}

export default AnimatedNetworkBackground