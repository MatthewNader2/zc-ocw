import { useEffect, useRef, useState } from 'react'
import * as cloudflare from '@/services/cloudflare'
import { julianDate, lstHours, altAz, getSolarTimes } from '@/utils/astro'
import starCatalog from '@/data/stars.json'

const ZEWAIL_LAT = 30.03
const ZEWAIL_LON = 30.95

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

export default function ParticleBackground({ className = '', isFixed = false }) {
  const canvasRef = useRef(null)
  const [skyData, setSkyData] = useState(null)
  const [sunTimes, setSunTimes] = useState(null)

  useEffect(() => {
    cloudflare.pingStats()

    // Fetch optional planetary positions from worker API
    cloudflare.fetchSky().then(data => { if (data) setSkyData(data) }).catch(() => {})

    // Fetch sunrise/sunset for Zewail City
    cloudflare.fetchWeather().then(w => {
      if (w && w.sunrise && w.sunset) {
        setSunTimes({ sunrise: new Date(w.sunrise), sunset: new Date(w.sunset) })
      } else {
        setSunTimes(getSolarTimes(new Date(), ZEWAIL_LAT, ZEWAIL_LON))
      }
    }).catch(() => {
      setSunTimes(getSolarTimes(new Date(), ZEWAIL_LAT, ZEWAIL_LON))
    })
  }, [])

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
    const nebulaCount = isMobile ? 2 : 3

    const nebulae = Array.from({ length: nebulaCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.max(width, height) * (0.28 + Math.random() * 0.15),
      vx: (Math.random() - 0.5) * 0.08,
      vy: (Math.random() - 0.5) * 0.08,
      hueDark: palette.nebulaDark,
      hueLight: palette.nebulaLight,
    }))

    let time = 0

    const render = () => {
      time += reduceMotion ? 0 : 0.015
      ctx.clearRect(0, 0, width, height)

      mouseX += (targetMouseX - mouseX) * 0.1
      mouseY += (targetMouseY - mouseY) * 0.1

      const isDark = document.documentElement.classList.contains('dark')
      const now = new Date()

      // Calculate Day/Night state
      let isNight = true
      if (sunTimes) {
        isNight = now < sunTimes.sunrise || now > sunTimes.sunset
      } else {
        const h = now.getHours()
        isNight = h < 6 || h >= 18
      }

      // Layer 0: Ambient Nebula
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
        grad.addColorStop(0, `rgba(${hue}, ${isDark ? (isNight ? 0.06 : 0.03) : 0.025})`)
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Layer 1: Real-time Live Constellation Sky Calculation
      const jd = julianDate(now)
      const lst = lstHours(jd, ZEWAIL_LON)

      const starPosMap = new Map()

      // Calculate visible stars (> 0° altitude)
      const visibleStars = []
      for (const star of starCatalog.stars) {
        const { alt, az } = altAz(star.ra, star.dec, ZEWAIL_LAT, lst)
        if (alt > 0) {
          // Map Azimuth & Altitude to screen (X, Y)
          const px = (az / 360) * width
          const py = height * (1 - alt / 90) * 0.85 + height * 0.1
          const radius = Math.max(1, (3.5 - star.mag * 0.6))
          const starObj = { ...star, px, py, alt, az, radius }
          visibleStars.push(starObj)
          starPosMap.set(star.id, starObj)
        }
      }

      // Base opacity depending on day/night and light/dark theme
      const skyOpacity = isDark
        ? (isNight ? 0.85 : 0.25)
        : (isNight ? 0.35 : 0.15)

      // Draw constellation connecting lines
      ctx.lineWidth = 0.8
      for (const constel of starCatalog.constellations) {
        for (const [idA, idB] of constel.lines) {
          const sA = starPosMap.get(idA)
          const sB = starPosMap.get(idB)
          if (sA && sB) {
            const dist = Math.hypot(sA.px - sB.px, sA.py - sB.py)
            if (dist < width * 0.45) { // Only connect if reasonable screen distance
              ctx.beginPath()
              ctx.moveTo(sA.px, sA.py)
              ctx.lineTo(sB.px, sB.py)
              ctx.strokeStyle = isDark
                ? `rgba(72, 202, 228, ${0.22 * skyOpacity})`
                : `rgba(0, 150, 199, ${0.15 * skyOpacity})`
              ctx.stroke()
            }
          }
        }
      }

      // Draw stars
      for (const s of visibleStars) {
        const twinkle = reduceMotion ? 1 : (0.75 + Math.sin(time * 2 + s.az) * 0.25)
        const alpha = Math.min(1, Math.max(0.2, (1 - s.mag / 4.5) * skyOpacity * twinkle))

        ctx.beginPath()
        ctx.arc(s.px, s.py, s.radius, 0, Math.PI * 2)
        ctx.fillStyle = isDark
          ? `rgba(255, 255, 255, ${alpha})`
          : `rgba(15, 23, 42, ${alpha})`
        ctx.fill()

        // Subtle glow for brightest stars
        if (s.mag < 1.0) {
          const grad = ctx.createRadialGradient(s.px, s.py, 0, s.px, s.py, s.radius * 3)
          grad.addColorStop(0, `rgba(0, 245, 212, ${alpha * 0.4})`)
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(s.px, s.py, s.radius * 3, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      // Layer 2: Render wandering planets & Moon if available from Astronomy API
      if (skyData?.table?.rows) {
        for (const row of skyData.table.rows) {
          const bodyId = row.entry?.id
          const pos = row.cells?.[0]?.position?.horizontal
          if (pos && pos.altitude?.degrees) {
            const alt = parseFloat(pos.altitude.degrees)
            const az = parseFloat(pos.azimuth.degrees)
            if (alt > 0) {
              const px = (az / 360) * width
              const py = height * (1 - alt / 90) * 0.85 + height * 0.1

              ctx.beginPath()
              ctx.arc(px, py, bodyId === 'moon' ? 5 : 3.5, 0, Math.PI * 2)
              ctx.fillStyle = bodyId === 'sun'
                ? `rgba(251, 146, 60, ${skyOpacity})`
                : (bodyId === 'moon' ? `rgba(254, 240, 138, ${skyOpacity})` : `rgba(192, 132, 252, ${skyOpacity})`)
              ctx.fill()
            }
          }
        }
      }

      animId = requestAnimationFrame(render)
    }

    render()

    return () => {
      if (animId) cancelAnimationFrame(animId)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [skyData, sunTimes])

  return (
    <canvas
      ref={canvasRef}
      className={`${isFixed ? 'fixed' : 'absolute'} inset-0 pointer-events-none z-0 ${className}`}
    />
  )
}
