import { useEffect, useRef } from 'react'

/**
 * Layered particle field:
 *  - Layer 0: slow-drifting "nebula" blobs (very subtle, adds depth)
 *  - Layer 1: distant twinkling stars (small, dim, no interaction — parallax)
 *  - Layer 2: the original orbiting "constellation" particles + connecting web,
 *             now with mouse-repel/attract, click ripple, and shooting stars
 * Everything is skipped/reduced under prefers-reduced-motion, and the whole
 * canvas pauses via requestAnimationFrame when the tab is hidden.
 */
export default function ParticleBackground({ className = '', isFixed = false }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    let animId = null
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth)
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight)

    let targetMouseX = width / 2
    let targetMouseY = height / 2
    let mouseX = targetMouseX
    let mouseY = targetMouseY
    let isMouseActive = false
    const ripples = []

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      targetMouseX = e.clientX - rect.left
      targetMouseY = e.clientY - rect.top
      isMouseActive = true
    }
    const handleMouseLeave = () => { isMouseActive = false }
    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect()
      ripples.push({ x: e.clientX - rect.left, y: e.clientY - rect.top, r: 0, alpha: 0.5 })
    }
    const handleResize = () => {
      if (!canvas.parentElement) return
      width = canvas.width = canvas.parentElement.clientWidth
      height = canvas.height = canvas.parentElement.clientHeight
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove, { passive: true })
    window.addEventListener('mouseleave', handleMouseLeave)
    canvas.addEventListener('click', handleClick)

    const isMobile = width < 640
    const particleCount = isMobile ? 24 : 48
    const starCount = reduceMotion ? 0 : (isMobile ? 30 : 70)
    const nebulaCount = isMobile ? 2 : 3

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

    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      radius: Math.random() * 1.1 + 0.3,
      baseAlpha: Math.random() * 0.5 + 0.15,
      twinkleSpeed: Math.random() * 0.02 + 0.005,
      angle: Math.random() * Math.PI * 2,
      depth: Math.random() * 0.5 + 0.15,
    }))

    const nebulae = Array.from({ length: nebulaCount }, (_, i) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.max(width, height) * (0.28 + Math.random() * 0.15),
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      hueDark: i % 2 === 0 ? '0, 245, 212' : '0, 180, 216',
      hueLight: i % 2 === 0 ? '0, 150, 199' : '72, 202, 228',
    }))

    let shootingStar = null
    let shootingStarCooldown = 200 + Math.random() * 300
    let time = 0

    const render = () => {
      time += reduceMotion ? 0 : 0.015
      ctx.clearRect(0, 0, width, height)

      mouseX += (targetMouseX - mouseX) * 0.1
      mouseY += (targetMouseY - mouseY) * 0.1

      const isDark = document.documentElement.classList.contains('dark')

      // Layer 0: nebula blobs
      for (const n of nebulae) {
        if (!reduceMotion) {
          n.x += n.vx
          n.y += n.vy
          if (n.x < -n.r) n.x = width + n.r
          if (n.x > width + n.r) n.x = -n.r
          if (n.y < -n.r) n.y = height + n.r
          if (n.y > height + n.r) n.y = -n.r
        }
        const hue = isDark ? n.hueDark : n.hueLight
        const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r)
        grad.addColorStop(0, `rgba(${hue}, ${isDark ? 0.05 : 0.035})`)
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Layer 1: twinkling parallax stars
      const parallaxX = isMouseActive ? (mouseX - width / 2) / width : 0
      const parallaxY = isMouseActive ? (mouseY - height / 2) / height : 0
      for (const s of stars) {
        s.angle += s.twinkleSpeed
        const a = Math.max(0, s.baseAlpha + Math.sin(s.angle) * 0.25)
        const sx = s.x - parallaxX * 30 * s.depth
        const sy = s.y - parallaxY * 30 * s.depth
        ctx.beginPath()
        ctx.arc(sx, sy, s.radius, 0, Math.PI * 2)
        ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${a})` : `rgba(3, 4, 94, ${a * 0.5})`
        ctx.fill()
      }

      // Occasional shooting star (dark mode only)
      if (isDark && !reduceMotion) {
        if (!shootingStar) {
          shootingStarCooldown -= 1
          if (shootingStarCooldown <= 0) {
            shootingStar = {
              x: Math.random() * width * 0.6,
              y: Math.random() * height * 0.3,
              vx: 6 + Math.random() * 4,
              vy: 3 + Math.random() * 2,
              life: 0,
            }
          }
        } else {
          shootingStar.x += shootingStar.vx
          shootingStar.y += shootingStar.vy
          shootingStar.life += 1
          const grad = ctx.createLinearGradient(
            shootingStar.x, shootingStar.y,
            shootingStar.x - shootingStar.vx * 8, shootingStar.y - shootingStar.vy * 8
          )
          grad.addColorStop(0, 'rgba(255,255,255,0.9)')
          grad.addColorStop(1, 'rgba(255,255,255,0)')
          ctx.strokeStyle = grad
          ctx.lineWidth = 1.5
          ctx.beginPath()
          ctx.moveTo(shootingStar.x, shootingStar.y)
          ctx.lineTo(shootingStar.x - shootingStar.vx * 8, shootingStar.y - shootingStar.vy * 8)
          ctx.stroke()
          if (shootingStar.life > 60 || shootingStar.x > width || shootingStar.y > height) {
            shootingStar = null
            shootingStarCooldown = 300 + Math.random() * 400
          }
        }
      }

      // Cursor aura (dark mode)
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

      // Click ripples
      for (let i = ripples.length - 1; i >= 0; i--) {
        const r = ripples[i]
        r.r += 6
        r.alpha *= 0.94
        if (r.alpha < 0.02) { ripples.splice(i, 1); continue }
        ctx.beginPath()
        ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2)
        ctx.strokeStyle = isDark
          ? `rgba(0, 245, 212, ${r.alpha})`
          : `rgba(0, 150, 199, ${r.alpha * 0.6})`
        ctx.lineWidth = 1.2
        ctx.stroke()
      }

      // Layer 2: main constellation particles
      const primaryRgb = isDark ? '0, 245, 212' : '0, 150, 199'
      const secondaryRgb = isDark ? '0, 180, 216' : '3, 4, 94'

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i]
        p.angle += p.pulseSpeed
        const pulsingAlpha = p.baseAlpha + Math.sin(p.angle) * 0.15

        if (!reduceMotion) {
          p.x += p.vx
          p.y += p.vy

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

          if (p.x < -20) p.x = width + 20
          if (p.x > width + 20) p.x = -20
          if (p.y < -20) p.y = height + 20
          if (p.y > height + 20) p.y = -20
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${primaryRgb}, ${Math.max(0.1, pulsingAlpha)})`
        ctx.shadowColor = isDark ? 'rgba(0, 245, 212, 0.6)' : 'transparent'
        ctx.shadowBlur = isDark ? 8 : 0
        ctx.fill()
        ctx.shadowBlur = 0

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
            if (cursorDist < 200) lineAlpha *= 1 + (1 - cursorDist / 200) * 2.0

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
      canvas.removeEventListener('click', handleClick)
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
