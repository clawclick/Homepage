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

    // Brand colors from API partner section
    const COLORS = [
      '#0066FF',
      '#4F46E5',
      '#10B981',
      '#F59E0B',
      '#EF4444',
      '#8B5CF6',
      '#06B6D4',
      '#F97316'
    ]

    // Particle class
    class Particle {
      constructor() {
        this.reset()
        this.y = Math.random() * h
        this.x = Math.random() * w
      }

      reset() {
        this.x = Math.random() * w
        this.y = Math.random() * h
        this.vx = (Math.random() - 0.5) * 0.5
        this.vy = (Math.random() - 0.5) * 0.5
        this.size = Math.random() * 2 + 1
        this.color = COLORS[Math.floor(Math.random() * COLORS.length)]
        this.alpha = Math.random() * 0.5 + 0.2
      }

      update() {
        this.x += this.vx
        this.y += this.vy

        if (this.x < 0 || this.x > w) this.vx *= -1
        if (this.y < 0 || this.y > h) this.vy *= -1

        this.x = Math.max(0, Math.min(w, this.x))
        this.y = Math.max(0, Math.min(h, this.y))
      }

      draw() {
        ctx.save()
        ctx.globalAlpha = this.alpha
        ctx.fillStyle = this.color
        ctx.beginPath()
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.restore()
      }
    }

    // Initialize particles
    const initParticles = () => {
      const particleCount = reduced ? PARTICLE_COUNT_BASE / 2 : PARTICLE_COUNT_BASE
      particles = []
      for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle())
      }
    }

    // Draw connections between nearby particles
    const drawConnections = () => {
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < CONNECTION_DIST) {
            const opacity = (1 - distance / CONNECTION_DIST) * 0.2
            ctx.save()
            ctx.globalAlpha = opacity
            ctx.strokeStyle = '#3B82F6'
            ctx.lineWidth = 0.5
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.stroke()
            ctx.restore()
          }
        }
      }
    }

    // Animation loop
    const animate = () => {
      ctx.clearRect(0, 0, w, h)

      // Update and draw particles
      particles.forEach(particle => {
        particle.update()
        particle.draw()
      })

      // Draw connections
      if (!reduced) {
        drawConnections()
      }

      raf = requestAnimationFrame(animate)
    }

    // Resize handler
    const handleResize = () => {
      w = canvas.width = window.innerWidth
      h = canvas.height = window.innerHeight
      initParticles()
    }

    // Reduced motion handler
    const handleMotionChange = (e) => {
      reduced = e.matches
      initParticles()
    }

    // Initialize
    handleResize()
    animate()

    // Event listeners
    window.addEventListener('resize', handleResize)
    mq.addEventListener('change', handleMotionChange)

    // Cleanup
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', handleResize)
      mq.removeEventListener('change', handleMotionChange)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="network-canvas"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1
      }}
    />
  )
}

export default AnimatedNetworkBackground