import { useEffect, useRef } from 'react'

export default function ParticleBackground({ className = '', isFixed = false }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    let animId = null
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth)
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight)

    let targetMouseX = width / 2
    let targetMouseY = height / 2
    let mouseX = targetMouseX
    let mouseY = targetMouseY
    let isMouseActive = false

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      targetMouseX = e.clientX - rect.left
      targetMouseY = e.clientY - rect.top
      isMouseActive = true
    }

    const handleMouseLeave = () => {
      isMouseActive = false
    }

    const handleResize = () => {
      if (!canvas.parentElement) return
      width = canvas.width = canvas.parentElement.clientWidth
      height = canvas.height = canvas.parentElement.clientHeight
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseleave', handleMouseLeave)

    const isMobile = width < 640
    const particleCount = isMobile ? 22 : 45

    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.6,
      vy: (Math.random() - 0.5) * 0.6,
      radius: Math.random() * 2.2 + 1.0,
      baseAlpha: Math.random() * 0.45 + 0.25,
      pulseSpeed: Math.random() * 0.03 + 0.01,
      angle: Math.random() * Math.PI * 2,
    }))

    let time = 0

    const render = () => {
      time += 0.015
      ctx.clearRect(0, 0, width, height)

      // Lerp cursor position
      mouseX += (targetMouseX - mouseX) * 0.1
      mouseY += (targetMouseY - mouseY) * 0.1

      const isDark = document.documentElement.classList.contains('dark')

      // Render glowing aura spotlight behind mouse in dark mode
      if (isDark && isMouseActive) {
        const aura = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 320)
        aura.addColorStop(0, 'rgba(0, 245, 212, 0.12)')
        aura.addColorStop(0.4, 'rgba(0, 180, 216, 0.06)')
        aura.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = aura
        ctx.beginPath()
        ctx.arc(mouseX, mouseY, 320, 0, Math.PI * 2)
        ctx.fill()
      }

      const primaryRgb = isDark ? '0, 245, 212' : '0, 150, 199'
      const secondaryRgb = isDark ? '0, 180, 216' : '3, 4, 94'

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Oscillate pulse alpha
        p.angle += p.pulseSpeed
        const pulsingAlpha = p.baseAlpha + Math.sin(p.angle) * 0.15

        // Particle physics movement
        p.x += p.vx
        p.y += p.vy

        // Mouse orbital attraction
        if (isMouseActive) {
          const dx = mouseX - p.x
          const dy = mouseY - p.y
          const dist = Math.sqrt(dx * dx + dy * dy)

          if (dist < 220 && dist > 10) {
            const force = (1 - dist / 220) * 0.4
            p.x += (dx / dist) * force + Math.cos(time + i) * 0.2
            p.y += (dy / dist) * force + Math.sin(time + i) * 0.2
          }
        }

        // Screen boundary bounce/wrap
        if (p.x < -20) p.x = width + 20
        if (p.x > width + 20) p.x = -20
        if (p.y < -20) p.y = height + 20
        if (p.y > height + 20) p.y = -20

        // Draw particle core
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${primaryRgb}, ${Math.max(0.1, pulsingAlpha)})`
        ctx.shadowColor = isDark ? 'rgba(0, 245, 212, 0.6)' : 'transparent'
        ctx.shadowBlur = isDark ? 8 : 0
        ctx.fill()
        ctx.shadowBlur = 0

        // Draw interactive energy web between particles
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const linkMaxDist = 135

          if (dist < linkMaxDist) {
            const midX = (p.x + p2.x) / 2
            const midY = (p.y + p2.y) / 2
            const cursorDist = isMouseActive
              ? Math.sqrt((midX - mouseX) ** 2 + (midY - mouseY) ** 2)
              : 999

            let lineAlpha = (1 - dist / linkMaxDist) * (isDark ? 0.25 : 0.1)

            // Brighten lines near cursor
            if (cursorDist < 200) {
              lineAlpha *= 1 + (1 - cursorDist / 200) * 2.0
            }

            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = cursorDist < 200
              ? `rgba(${primaryRgb}, ${Math.min(lineAlpha, 0.6)})`
              : `rgba(${secondaryRgb}, ${Math.min(lineAlpha, 0.3)})`
            ctx.lineWidth = cursorDist < 200 ? 1.0 : 0.6
            ctx.stroke()
          }
        }
      }

      animId = requestAnimationFrame(render)
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (animId) cancelAnimationFrame(animId)
      } else {
        animId = requestAnimationFrame(render)
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    animId = requestAnimationFrame(render)

    return () => {
      if (animId) cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseleave', handleMouseLeave)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className={`${
        isFixed ? 'fixed inset-0 z-0 pointer-events-none' : 'absolute inset-0 z-0 pointer-events-none'
      } transition-opacity duration-700 opacity-90 ${className}`}
    />
  )
}
