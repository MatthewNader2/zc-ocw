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

    // Smooth lerping mouse coordinates
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
    const particleCount = isMobile ? 18 : 34

    const particles = Array.from({ length: particleCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 2.0 + 1.0,
      baseAlpha: Math.random() * 0.4 + 0.2,
      colorOffset: Math.random() * 360,
    }))

    let frame = 0

    const render = () => {
      frame++
      ctx.clearRect(0, 0, width, height)

      // Lerp mouse position
      mouseX += (targetMouseX - mouseX) * 0.08
      mouseY += (targetMouseY - mouseY) * 0.08

      const isDark = document.documentElement.classList.contains('dark')

      // Render interactive cursor glow in dark mode
      if (isDark && isMouseActive) {
        const glowGradient = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 280)
        glowGradient.addColorStop(0, 'rgba(56, 189, 248, 0.09)')
        glowGradient.addColorStop(0.5, 'rgba(0, 180, 216, 0.04)')
        glowGradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = glowGradient
        ctx.beginPath()
        ctx.arc(mouseX, mouseY, 280, 0, Math.PI * 2)
        ctx.fill()
      }

      const particleColorRgb = isDark ? '56, 189, 248' : '0, 119, 182'

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]

        // Move particle
        p.x += p.vx
        p.y += p.vy

        // Interactive push effect when cursor is close
        if (isMouseActive) {
          const dx = p.x - mouseX
          const dy = p.y - mouseY
          const dist = Math.sqrt(dx * dx + dy * dy)
          const maxDist = 160

          if (dist < maxDist && dist > 0) {
            const force = (1 - dist / maxDist) * 0.8
            p.x += (dx / dist) * force
            p.y += (dy / dist) * force
          }
        }

        // Screen bounce / wrap
        if (p.x < 0) p.x = width
        if (p.x > width) p.x = 0
        if (p.y < 0) p.y = height
        if (p.y > height) p.y = 0

        // Draw particle dot
        const currentAlpha = p.baseAlpha * (isDark ? 0.7 : 0.4)
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${particleColorRgb}, ${currentAlpha})`
        ctx.fill()

        // Draw connecting lines
        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j]
          const dx = p.x - p2.x
          const dy = p.y - p2.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          const linkMaxDist = 120

          if (dist < linkMaxDist) {
            // Check proximity to cursor for line illumination
            const midX = (p.x + p2.x) / 2
            const midY = (p.y + p2.y) / 2
            const cursorDist = isMouseActive
              ? Math.sqrt((midX - mouseX) ** 2 + (midY - mouseY) ** 2)
              : 999

            let lineAlpha = (1 - dist / linkMaxDist) * (isDark ? 0.22 : 0.08)
            if (cursorDist < 180) {
              lineAlpha *= 1 + (1 - cursorDist / 180) * 1.5
            }

            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(${particleColorRgb}, ${Math.min(lineAlpha, 0.45)})`
            ctx.lineWidth = cursorDist < 180 ? 0.9 : 0.5
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
