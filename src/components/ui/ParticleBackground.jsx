import { useEffect, useRef, useState } from 'react'
import * as cloudflare from '@/services/cloudflare'
import { julianDate, lstHours, altAz, getSolarTimes } from '@/utils/astro'
import starCatalog from '@/data/stars.json'

const ZEWAIL_LAT = 30.03
const ZEWAIL_LON = 30.95

// Deep Sky Objects catalog (Nebulae, Galaxies, Star Clusters)
const DEEP_SKY_OBJECTS = [
  { id: 'm31', name: 'Andromeda Galaxy (M31) 🌌', ra: 0.71, dec: 41.27, type: 'galaxy' },
  { id: 'm42', name: 'Orion Nebula (M42) 🌫️', ra: 5.59, dec: -5.39, type: 'nebula' },
  { id: 'm45', name: 'Pleiades Cluster (M45) 💫', ra: 3.79, dec: 24.11, type: 'cluster' },
]

// Astronomical symbol map for bodies returned by Astronomy API
const BODY_SYMBOLS = {
  sun: '☀️',
  moon: '🌙',
  mercury: '☿',
  venus: '♀',
  mars: '♂',
  jupiter: '♃',
  saturn: '♄',
  uranus: '♅',
  neptune: '♆',
  pluto: '♇',
}

function getTimeOfDayPalette() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 8) {
    return {
      name: 'dawn',
      primaryDark: '251, 146, 60',
      primaryLight: '234, 88, 12',
      secondaryDark: '244, 114, 182',
      secondaryLight: '217, 70, 239',
      nebulaDark: '251, 146, 60',
      nebulaLight: '254, 215, 170',
    }
  } else if (hour >= 8 && hour < 17) {
    return {
      name: 'day',
      primaryDark: '0, 245, 212',
      primaryLight: '0, 150, 199',
      secondaryDark: '0, 180, 216',
      secondaryLight: '3, 4, 94',
      nebulaDark: '0, 245, 212',
      nebulaLight: '144, 224, 239',
    }
  } else if (hour >= 17 && hour < 20) {
    return {
      name: 'dusk',
      primaryDark: '168, 85, 247',
      primaryLight: '126, 34, 206',
      secondaryDark: '245, 158, 11',
      secondaryLight: '217, 119, 6',
      nebulaDark: '168, 85, 247',
      nebulaLight: '233, 213, 255',
    }
  } else {
    return {
      name: 'night',
      primaryDark: '56, 189, 248',
      primaryLight: '2, 132, 199',
      secondaryDark: '129, 140, 248',
      secondaryLight: '67, 56, 202',
      nebulaDark: '56, 189, 248',
      nebulaLight: '186, 230, 253',
    }
  }
}

export default function ParticleBackground({ className = '', mode = 'astro', isFixed = false }) {
  const canvasRef = useRef(null)
  const [skyData, setSkyData] = useState(null)
  const [sunTimes, setSunTimes] = useState(null)

  useEffect(() => {
    if (mode === 'astro') {
      cloudflare.pingStats()
      cloudflare.fetchSky().then(data => { if (data) setSkyData(data) }).catch(() => {})
      cloudflare.fetchWeather().then(w => {
        if (w && w.sunrise && w.sunset) {
          setSunTimes({ sunrise: new Date(w.sunrise), sunset: new Date(w.sunset) })
        } else {
          setSunTimes(getSolarTimes(new Date(), ZEWAIL_LAT, ZEWAIL_LON))
        }
      }).catch(() => {
        setSunTimes(getSolarTimes(new Date(), ZEWAIL_LAT, ZEWAIL_LON))
      })
    }
  }, [mode])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const palette = getTimeOfDayPalette()

    let animId = null
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth)
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight)

    let targetMouseX = width / 2
    let targetMouseY = height / 2
    let mouseX = targetMouseX
    let mouseY = targetMouseY

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect()
      targetMouseX = e.clientX - rect.left
      targetMouseY = e.clientY - rect.top
    }
    const handleResize = () => {
      if (!canvas.parentElement) return
      width = canvas.width = canvas.parentElement.clientWidth
      height = canvas.height = canvas.parentElement.clientHeight
    }

    window.addEventListener('resize', handleResize)
    window.addEventListener('mousemove', handleMouseMove, { passive: true })

    const isMobile = width < 640

    // ── CLASSIC MODE ────────────────────────────────────────────────────────
    if (mode === 'classic') {
      const nodeCount = isMobile ? 40 : 90
      const nodes = Array.from({ length: nodeCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.65,
        vy: (Math.random() - 0.5) * 0.65,
        r: Math.random() * 2 + 1.2,
        alpha: Math.random() * 0.6 + 0.3,
      }))

      const renderClassic = () => {
        ctx.clearRect(0, 0, width, height)
        mouseX += (targetMouseX - mouseX) * 0.1
        mouseY += (targetMouseY - mouseY) * 0.1
        const isDark = document.documentElement.classList.contains('dark')

        // Cursor Ambient Glow
        const mouseGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 180)
        mouseGrad.addColorStop(0, `rgba(0, 245, 212, ${isDark ? 0.15 : 0.09})`)
        mouseGrad.addColorStop(0.5, `rgba(0, 180, 216, ${isDark ? 0.05 : 0.03})`)
        mouseGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = mouseGrad
        ctx.beginPath()
        ctx.arc(mouseX, mouseY, 180, 0, Math.PI * 2)
        ctx.fill()

        for (let i = 0; i < nodes.length; i++) {
          const n1 = nodes[i]
          if (!reduceMotion) {
            n1.x += n1.vx
            n1.y += n1.vy
            if (n1.x < 0 || n1.x > width) n1.vx *= -1
            if (n1.y < 0 || n1.y > height) n1.vy *= -1

            const distMouse = Math.hypot(n1.x - mouseX, n1.y - mouseY)
            if (distMouse < 120) {
              const angle = Math.atan2(n1.y - mouseY, n1.x - mouseX)
              n1.x += Math.cos(angle) * 0.8
              n1.y += Math.sin(angle) * 0.8
            }
          }

          ctx.beginPath()
          ctx.arc(n1.x, n1.y, n1.r, 0, Math.PI * 2)
          ctx.fillStyle = isDark
            ? `rgba(0, 245, 212, ${n1.alpha * 0.8})`
            : `rgba(0, 180, 216, ${n1.alpha * 0.7})`
          ctx.fill()

          for (let j = i + 1; j < nodes.length; j++) {
            const n2 = nodes[j]
            const dist = Math.hypot(n1.x - n2.x, n1.y - n2.y)
            if (dist < 130) {
              const lineAlpha = (1 - dist / 130) * 0.35
              ctx.beginPath()
              ctx.moveTo(n1.x, n1.y)
              ctx.lineTo(n2.x, n2.y)
              ctx.strokeStyle = isDark
                ? `rgba(72, 202, 228, ${lineAlpha})`
                : `rgba(0, 150, 199, ${lineAlpha})`
              ctx.lineWidth = 0.8
              ctx.stroke()
            }
          }
        }

        animId = requestAnimationFrame(renderClassic)
      }

      renderClassic()

      return () => {
        if (animId) cancelAnimationFrame(animId)
        window.removeEventListener('resize', handleResize)
        window.removeEventListener('mousemove', handleMouseMove)
      }
    }

    // ── ASTRO MODE (HIGH DENSITY 1,000+ STARS & PLANETARIUM VIEW) ───────────
    const nebulaCount = isMobile ? 5 : 8
    const nebulae = Array.from({ length: nebulaCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.max(width, height) * (0.35 + Math.random() * 0.25),
      vx: (Math.random() - 0.5) * 0.15,
      vy: (Math.random() - 0.5) * 0.15,
      hueDark: palette.nebulaDark,
      hueLight: palette.nebulaLight,
    }))

    // Deep space background field micro-stars (1,000+ stars for rich density)
    const fieldStarCount = isMobile ? 400 : 1000
    const fieldStars = Array.from({ length: fieldStarCount }, () => ({
      ra: Math.random() * 24,
      dec: (Math.random() - 0.5) * 180,
      mag: Math.random() * 3.5 + 1.5,
      phase: Math.random() * Math.PI * 2,
      speed: Math.random() * 1.8 + 0.3,
    }))

    const meteors = []
    let nextMeteorTime = 0
    let time = 0

    const renderAstro = () => {
      time += reduceMotion ? 0 : 0.014
      ctx.clearRect(0, 0, width, height)

      mouseX += (targetMouseX - mouseX) * 0.08
      mouseY += (targetMouseY - mouseY) * 0.08

      const isDark = document.documentElement.classList.contains('dark')
      const now = new Date()

      let isNight = true
      if (sunTimes) {
        isNight = now < sunTimes.sunrise || now > sunTimes.sunset
      } else {
        const h = now.getHours()
        isNight = h < 6 || h >= 18
      }

      // Cursor Ambient Glow
      const mouseGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 240)
      mouseGrad.addColorStop(0, `rgba(0, 245, 212, ${isDark ? (isNight ? 0.18 : 0.09) : 0.08})`)
      mouseGrad.addColorStop(0.5, `rgba(0, 180, 216, ${isDark ? (isNight ? 0.07 : 0.04) : 0.03})`)
      mouseGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = mouseGrad
      ctx.beginPath()
      ctx.arc(mouseX, mouseY, 240, 0, Math.PI * 2)
      ctx.fill()

      // Nebulae
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
        grad.addColorStop(0, `rgba(${hue}, ${isDark ? (isNight ? 0.10 : 0.05) : 0.035})`)
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Milky Way Gradient
      const mwGrad = ctx.createLinearGradient(0, 0, width, height)
      mwGrad.addColorStop(0, `rgba(72, 202, 228, ${isDark ? 0.05 : 0.025})`)
      mwGrad.addColorStop(0.5, `rgba(168, 85, 247, ${isDark ? 0.09 : 0.04})`)
      mwGrad.addColorStop(1, `rgba(0, 245, 212, ${isDark ? 0.05 : 0.025})`)
      ctx.fillStyle = mwGrad
      ctx.fillRect(0, 0, width, height)

      // Real-time Celestial Sky Projection
      const jd = julianDate(now)
      const baseLst = lstHours(jd, ZEWAIL_LON)
      const skyDriftHours = reduceMotion ? 0 : (time * 0.15) % 24
      const activeLst = (baseLst + skyDriftHours + 24) % 24

      const cx = width / 2 + (mouseX - width / 2) * 0.04
      const cy = height / 2 + (mouseY - height / 2) * 0.04

      // Full canvas projection mapping
      const skyProject = (alt, az) => {
        const radAz = (az / 360) * Math.PI * 2
        const distR = (1 - (alt + 30) / 120) * Math.max(width, height) * 0.78
        const rx = Math.cos(radAz + time * 0.04) * distR
        const ry = Math.sin(radAz + time * 0.04) * distR

        return {
          px: cx + rx,
          py: cy + ry,
        }
      }

      const starPosMap = new Map()
      const visibleCatalogStars = []

      for (const star of starCatalog.stars) {
        const { alt, az } = altAz(star.ra, star.dec, ZEWAIL_LAT, activeLst)
        const { px, py } = skyProject(alt, az)
        const radius = Math.max(1.3, (4.3 - star.mag * 0.6))
        const starObj = { ...star, px, py, alt, az, radius }
        visibleCatalogStars.push(starObj)
        starPosMap.set(star.id, starObj)
      }

      // Micro Field Stars (1,000+ stars)
      const visibleFieldStars = []
      for (const fs of fieldStars) {
        const { alt, az } = altAz(fs.ra, fs.dec, ZEWAIL_LAT, activeLst)
        const { px, py } = skyProject(alt, az)
        visibleFieldStars.push({ ...fs, px, py, alt, az })
      }

      const skyOpacity = isDark
        ? (isNight ? 0.96 : 0.40)
        : (isNight ? 0.48 : 0.28)

      // Draw Constellation Lines & Centroid Labels
      ctx.lineWidth = 1.2
      for (const constel of starCatalog.constellations) {
        let sumX = 0, sumY = 0, count = 0
        for (const [idA, idB] of constel.lines) {
          const sA = starPosMap.get(idA)
          const sB = starPosMap.get(idB)
          if (sA && sB) {
            sumX += sA.px + sB.px
            sumY += sA.py + sB.py
            count += 2

            const dist = Math.hypot(sA.px - sB.px, sA.py - sB.py)
            if (dist < width * 0.6) {
              ctx.beginPath()
              ctx.moveTo(sA.px, sA.py)
              ctx.lineTo(sB.px, sB.py)
              ctx.strokeStyle = isDark
                ? `rgba(72, 202, 228, ${0.34 * skyOpacity})`
                : `rgba(0, 150, 199, ${0.24 * skyOpacity})`
              ctx.stroke()
            }
          }
        }

        // Render Constellation Centroid Tag
        if (count > 0) {
          const constelX = sumX / count
          const constelY = sumY / count
          if (constelX > 20 && constelX < width - 20 && constelY > 20 && constelY < height - 20) {
            ctx.font = 'bold 9px sans-serif'
            ctx.fillStyle = isDark
              ? `rgba(0, 245, 212, ${0.72 * skyOpacity})`
              : `rgba(0, 150, 199, ${0.62 * skyOpacity})`
            ctx.fillText(`✦ ${constel.name.toUpperCase()} ✦`, constelX, constelY)
          }
        }
      }

      // Draw Micro Field Stars
      for (const fs of visibleFieldStars) {
        const twinkle = reduceMotion ? 1 : (0.8 + Math.sin(time * fs.speed + fs.phase) * 0.2)
        const alpha = (0.35 + Math.sin(time * 2 + fs.az) * 0.25) * skyOpacity * twinkle
        ctx.beginPath()
        ctx.arc(fs.px, fs.py, Math.max(0.8, 2.2 - fs.mag * 0.4), 0, Math.PI * 2)
        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${alpha * 0.88})`
          : `rgba(15, 23, 42, ${alpha * 0.68})`
        ctx.fill()
      }

      // Draw Catalog Stars
      for (const s of visibleCatalogStars) {
        const twinkle = reduceMotion ? 1 : (0.85 + Math.sin(time * 2.2 + s.az) * 0.15)
        const alpha = Math.min(1, Math.max(0.3, (1 - s.mag / 4.5) * skyOpacity * twinkle))

        ctx.beginPath()
        ctx.arc(s.px, s.py, s.radius, 0, Math.PI * 2)
        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${alpha})`
          : `rgba(15, 23, 42, ${alpha})`
        ctx.fill()

        if (s.mag < 1.2) {
          const grad = ctx.createRadialGradient(s.px, s.py, 0, s.px, s.py, s.radius * 3.8)
          grad.addColorStop(0, `rgba(0, 245, 212, ${alpha * 0.55})`)
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(s.px, s.py, s.radius * 3.8, 0, Math.PI * 2)
          ctx.fill()

          ctx.font = '10px sans-serif'
          ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${0.78 * skyOpacity})` : `rgba(15, 23, 42, ${0.68 * skyOpacity})`
          ctx.fillText(`${s.name} 🌟`, s.px + 7, s.py + 3)
        }
      }

      // Deep Sky Objects
      for (const dso of DEEP_SKY_OBJECTS) {
        const { alt, az } = altAz(dso.ra, dso.dec, ZEWAIL_LAT, activeLst)
        const { px, py } = skyProject(alt, az)

        const grad = ctx.createRadialGradient(px, py, 0, px, py, 14)
        grad.addColorStop(0, `rgba(192, 132, 252, ${0.6 * skyOpacity})`)
        grad.addColorStop(0.6, `rgba(72, 202, 228, ${0.25 * skyOpacity})`)
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(px, py, 14, 0, Math.PI * 2)
        ctx.fill()

        ctx.font = 'bold 9px sans-serif'
        ctx.fillStyle = isDark ? `rgba(216, 180, 254, ${0.85 * skyOpacity})` : `rgba(126, 34, 206, ${0.75 * skyOpacity})`
        ctx.fillText(dso.name, px + 10, py + 3)
      }

      // Real-Time Astronomy API Bodies (Guaranteed Visibility across Sky Viewport)
      if (skyData?.table?.rows) {
        for (const row of skyData.table.rows) {
          const bodyId = row.entry?.id?.toLowerCase()
          const name = row.entry?.name || bodyId
          const cell = row.cells?.[0]
          const pos = cell?.position?.horizontal
          const extra = cell?.extraInfo

          if (pos && pos.altitude?.degrees && pos.azimuth?.degrees) {
            const alt = parseFloat(pos.altitude.degrees)
            const az = parseFloat(pos.azimuth.degrees)
            const mag = extra?.magnitude ? parseFloat(extra.magnitude) : (bodyId === 'moon' ? -12 : (bodyId === 'sun' ? -26 : 1.0))
            const constellationName = extra?.constellation?.name

            const { px, py } = skyProject(alt, az)
            const bodyRadius = bodyId === 'sun' ? 7.5 : (bodyId === 'moon' ? 6.5 : Math.max(3.5, 7.0 - mag * 0.5))
            const symbol = BODY_SYMBOLS[bodyId] || '🪐'

            ctx.beginPath()
            ctx.arc(px, py, bodyRadius, 0, Math.PI * 2)
            ctx.fillStyle = bodyId === 'sun'
              ? `rgba(251, 146, 60, ${skyOpacity})`
              : (bodyId === 'moon' ? `rgba(254, 240, 138, ${skyOpacity})` : `rgba(192, 132, 252, ${skyOpacity})`)
            ctx.fill()

            ctx.beginPath()
            ctx.arc(px, py, bodyRadius * 2.4, 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(0, 245, 212, ${0.48 * skyOpacity})`
            ctx.lineWidth = 0.8
            ctx.stroke()

            const labelText = constellationName ? `${name.toUpperCase()} ${symbol} (${constellationName})` : `${name.toUpperCase()} ${symbol}`
            ctx.font = 'bold 10px sans-serif'
            ctx.fillStyle = isDark ? `rgba(255, 255, 255, ${0.88 * skyOpacity})` : `rgba(15, 23, 42, ${0.78 * skyOpacity})`
            ctx.fillText(labelText, px + 9, py + 3)
          }
        }
      }

      // Meteors
      if (!reduceMotion) {
        if (time > nextMeteorTime && meteors.length < 3) {
          meteors.push({
            x: Math.random() * width,
            y: Math.random() * (height * 0.6),
            length: Math.random() * 90 + 50,
            speed: Math.random() * 9 + 6,
            angle: Math.PI / 4 + (Math.random() - 0.5) * 0.2,
            alpha: 1.0,
          })
          nextMeteorTime = time + Math.random() * 4 + 2
        }

        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i]
          m.x += Math.cos(m.angle) * m.speed
          m.y += Math.sin(m.angle) * m.speed
          m.alpha -= 0.02

          if (m.alpha <= 0 || m.x > width || m.y > height) {
            meteors.splice(i, 1)
            continue
          }

          const tailX = m.x - Math.cos(m.angle) * m.length
          const tailY = m.y - Math.sin(m.angle) * m.length

          const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY)
          grad.addColorStop(0, `rgba(0, 245, 212, ${m.alpha * skyOpacity})`)
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)')

          ctx.beginPath()
          ctx.moveTo(m.x, m.y)
          ctx.lineTo(tailX, tailY)
          ctx.strokeStyle = grad
          ctx.lineWidth = 1.8
          ctx.stroke()
        }
      }

      animId = requestAnimationFrame(renderAstro)
    }

    renderAstro()

    return () => {
      if (animId) cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [skyData, sunTimes, mode])

  return (
    <div className={`${isFixed ? 'fixed' : 'absolute'} inset-0 pointer-events-none z-0 ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  )
}
