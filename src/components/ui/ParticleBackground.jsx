import { useEffect, useRef, useState, useCallback } from 'react'
import * as cloudflare from '@/services/cloudflare'
import { julianDate, lstHours, altAz, getSolarTimes } from '@/utils/astro'
import starCatalog from '@/data/stars.json'

const ZEWAIL_LAT = 30.03
const ZEWAIL_LON = 30.95

// Deep Sky Objects catalog (Nebulae, Galaxies, Star Clusters)
const DEEP_SKY_OBJECTS = [
  { id: 'm31', name: 'Andromeda Galaxy (M31)', ra: 0.71, dec: 41.27, type: 'galaxy' },
  { id: 'm42', name: 'Orion Nebula (M42)', ra: 5.59, dec: -5.39, type: 'nebula' },
  { id: 'm45', name: 'Pleiades (M45)', ra: 3.79, dec: 24.11, type: 'cluster' },
  { id: 'm44', name: 'Beehive (M44)', ra: 8.67, dec: 19.67, type: 'cluster' },
  { id: 'ngc869', name: 'Double Cluster', ra: 2.32, dec: 57.13, type: 'cluster' },
]

// Astronomical symbol map for bodies returned by Astronomy API
const BODY_SYMBOLS = {
  sun: '☀',
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

// Spectral color by magnitude proxy (brighter = hotter = bluer, dimmer = cooler = redder)
function starColor(mag, isDark) {
  if (mag < 0.3) return isDark ? '180, 210, 255' : '60, 80, 160'     // Blue-white (O/B)
  if (mag < 1.0) return isDark ? '220, 230, 255' : '40, 50, 120'     // White (A)
  if (mag < 1.8) return isDark ? '255, 250, 240' : '30, 30, 50'      // Yellow-white (F)
  if (mag < 2.5) return isDark ? '255, 240, 200' : '60, 40, 20'      // Yellow (G)
  if (mag < 3.2) return isDark ? '255, 210, 160' : '80, 40, 10'      // Orange (K)
  return isDark ? '255, 180, 130' : '100, 40, 10'                    // Red-orange (M)
}

// Named star special colors (Betelgeuse=red, Rigel=blue, etc.)
const SPECIAL_STAR_COLORS = {
  betelgeuse: { dark: '255, 140, 100', light: '180, 50, 20' },
  antares:    { dark: '255, 130, 90',  light: '170, 40, 15' },
  aldebaran:  { dark: '255, 180, 120', light: '160, 60, 10' },
  rigel:      { dark: '170, 200, 255', light: '40, 60, 160' },
  sirius:     { dark: '200, 220, 255', light: '50, 70, 170' },
  vega:       { dark: '200, 215, 255', light: '50, 65, 165' },
  capella:    { dark: '255, 240, 180', light: '130, 100, 20' },
  arcturus:   { dark: '255, 200, 130', light: '150, 70, 10' },
  spica:      { dark: '180, 200, 255', light: '45, 55, 155' },
  pollux:     { dark: '255, 220, 160', light: '140, 80, 15' },
}

// Stars that get diffraction spikes (top-5 brightest)
const SPIKE_STARS = new Set(['sirius', 'arcturus', 'vega', 'capella', 'rigel'])

function getTimeOfDayPalette() {
  const hour = new Date().getHours()
  if (hour >= 5 && hour < 8) {
    return { nebulaDark: '251, 146, 60', nebulaLight: '254, 215, 170' }
  } else if (hour >= 8 && hour < 17) {
    return { nebulaDark: '0, 245, 212', nebulaLight: '144, 224, 239' }
  } else if (hour >= 17 && hour < 20) {
    return { nebulaDark: '168, 85, 247', nebulaLight: '233, 213, 255' }
  } else {
    return { nebulaDark: '56, 189, 248', nebulaLight: '186, 230, 253' }
  }
}

// ── Spatial hash for O(1) hover detection ────────────────────────────────────
class SpatialHash {
  constructor(cellSize = 30) {
    this.cellSize = cellSize
    this.cells = new Map()
  }
  clear() { this.cells.clear() }
  _key(x, y) {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`
  }
  insert(obj) {
    const key = this._key(obj.px, obj.py)
    if (!this.cells.has(key)) this.cells.set(key, [])
    this.cells.get(key).push(obj)
  }
  query(x, y, radius = 15) {
    const results = []
    const r = Math.ceil(radius / this.cellSize)
    const cx = Math.floor(x / this.cellSize)
    const cy = Math.floor(y / this.cellSize)
    for (let dx = -r; dx <= r; dx++) {
      for (let dy = -r; dy <= r; dy++) {
        const key = `${cx + dx},${cy + dy}`
        const cell = this.cells.get(key)
        if (cell) {
          for (const obj of cell) {
            const dist = Math.hypot(obj.px - x, obj.py - y)
            if (dist <= radius) results.push({ ...obj, dist })
          }
        }
      }
    }
    results.sort((a, b) => a.dist - b.dist)
    return results
  }
}

export default function ParticleBackground({ className = '', mode = 'astro', isFixed = false }) {
  const canvasRef = useRef(null)
  const tooltipRef = useRef(null)
  const [skyData, setSkyData] = useState(null)
  const [sunTimes, setSunTimes] = useState(null)

  // Interactive state refs (not React state to avoid re-renders on every frame)
  const interactRef = useRef({
    zoom: 1,
    targetZoom: 1,
    panX: 0, panY: 0,
    targetPanX: 0, targetPanY: 0,
    isDragging: false,
    dragStartX: 0, dragStartY: 0,
    panStartX: 0, panStartY: 0,
    mouseX: 0, mouseY: 0,
    targetMouseX: 0, targetMouseY: 0,
    hoveredStar: null,
    pinchDist: 0,
  })

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
    const interact = interactRef.current
    const spatialHash = new SpatialHash(30)

    let animId = null
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth)
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight)

    interact.targetMouseX = width / 2
    interact.targetMouseY = height / 2
    interact.mouseX = width / 2
    interact.mouseY = height / 2

    // ── Event handlers ──────────────────────────────────────────────────────
    const getCanvasPos = (e) => {
      const rect = canvas.getBoundingClientRect()
      return { x: e.clientX - rect.left, y: e.clientY - rect.top }
    }

    const handleMouseMove = (e) => {
      const pos = getCanvasPos(e)
      interact.targetMouseX = pos.x
      interact.targetMouseY = pos.y

      if (interact.isDragging) {
        interact.targetPanX = interact.panStartX + (pos.x - interact.dragStartX) / interact.zoom
        interact.targetPanY = interact.panStartY + (pos.y - interact.dragStartY) / interact.zoom
      }

      // Hover detection
      const worldX = (pos.x - width / 2) / interact.zoom - interact.panX + width / 2
      const worldY = (pos.y - height / 2) / interact.zoom - interact.panY + height / 2
      const nearest = spatialHash.query(worldX, worldY, 18 / interact.zoom)
      interact.hoveredStar = nearest.length > 0 ? nearest[0] : null

      // Update tooltip
      if (tooltipRef.current) {
        if (interact.hoveredStar) {
          const s = interact.hoveredStar
          const label = s.constellation
            ? `${s.name}  · mag ${s.mag?.toFixed(1)} · ${s.constellation}`
            : `${s.name}  · mag ${s.mag?.toFixed(1)}`
          tooltipRef.current.textContent = label
          tooltipRef.current.style.opacity = '1'
          tooltipRef.current.style.left = `${pos.x + 14}px`
          tooltipRef.current.style.top = `${pos.y - 10}px`
          canvas.style.cursor = 'pointer'
        } else {
          tooltipRef.current.style.opacity = '0'
          canvas.style.cursor = interact.isDragging ? 'grabbing' : 'grab'
        }
      }
    }

    const handleMouseDown = (e) => {
      if (e.button !== 0) return
      const pos = getCanvasPos(e)
      interact.isDragging = true
      interact.dragStartX = pos.x
      interact.dragStartY = pos.y
      interact.panStartX = interact.targetPanX
      interact.panStartY = interact.targetPanY
      canvas.style.cursor = 'grabbing'
    }

    const handleMouseUp = () => {
      interact.isDragging = false
      canvas.style.cursor = 'grab'
    }

    const handleWheel = (e) => {
      e.preventDefault()
      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89
      interact.targetZoom = Math.min(4, Math.max(0.4, interact.targetZoom * zoomFactor))
    }

    // Touch handlers for pinch-zoom and pan
    let lastTouchDist = 0
    let lastTouchCenter = null

    const getTouchDist = (touches) => {
      if (touches.length < 2) return 0
      return Math.hypot(
        touches[0].clientX - touches[1].clientX,
        touches[0].clientY - touches[1].clientY
      )
    }

    const getTouchCenter = (touches) => {
      if (touches.length < 2) return null
      const rect = canvas.getBoundingClientRect()
      return {
        x: (touches[0].clientX + touches[1].clientX) / 2 - rect.left,
        y: (touches[0].clientY + touches[1].clientY) / 2 - rect.top,
      }
    }

    const handleTouchStart = (e) => {
      if (e.touches.length === 1) {
        const rect = canvas.getBoundingClientRect()
        interact.isDragging = true
        interact.dragStartX = e.touches[0].clientX - rect.left
        interact.dragStartY = e.touches[0].clientY - rect.top
        interact.panStartX = interact.targetPanX
        interact.panStartY = interact.targetPanY
      } else if (e.touches.length === 2) {
        interact.isDragging = false
        lastTouchDist = getTouchDist(e.touches)
        lastTouchCenter = getTouchCenter(e.touches)
      }
    }

    const handleTouchMove = (e) => {
      e.preventDefault()
      if (e.touches.length === 1 && interact.isDragging) {
        const rect = canvas.getBoundingClientRect()
        const x = e.touches[0].clientX - rect.left
        const y = e.touches[0].clientY - rect.top
        interact.targetPanX = interact.panStartX + (x - interact.dragStartX) / interact.zoom
        interact.targetPanY = interact.panStartY + (y - interact.dragStartY) / interact.zoom
      } else if (e.touches.length === 2) {
        const dist = getTouchDist(e.touches)
        if (lastTouchDist > 0) {
          const scale = dist / lastTouchDist
          interact.targetZoom = Math.min(4, Math.max(0.4, interact.targetZoom * scale))
        }
        lastTouchDist = dist
      }
    }

    const handleTouchEnd = () => {
      interact.isDragging = false
      lastTouchDist = 0
      lastTouchCenter = null
    }

    const handleResize = () => {
      if (!canvas.parentElement) return
      width = canvas.width = canvas.parentElement.clientWidth
      height = canvas.height = canvas.parentElement.clientHeight
    }

    canvas.addEventListener('mousemove', handleMouseMove, { passive: true })
    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mouseup', handleMouseUp)
    canvas.addEventListener('mouseleave', handleMouseUp)
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true })
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false })
    canvas.addEventListener('touchend', handleTouchEnd)
    window.addEventListener('resize', handleResize)

    canvas.style.cursor = 'grab'

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
        const mX = interact.mouseX += (interact.targetMouseX - interact.mouseX) * 0.1
        const mY = interact.mouseY += (interact.targetMouseY - interact.mouseY) * 0.1
        const isDark = document.documentElement.classList.contains('dark')

        const mouseGrad = ctx.createRadialGradient(mX, mY, 0, mX, mY, 180)
        mouseGrad.addColorStop(0, `rgba(0, 245, 212, ${isDark ? 0.15 : 0.09})`)
        mouseGrad.addColorStop(0.5, `rgba(0, 180, 216, ${isDark ? 0.05 : 0.03})`)
        mouseGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = mouseGrad
        ctx.beginPath()
        ctx.arc(mX, mY, 180, 0, Math.PI * 2)
        ctx.fill()

        for (let i = 0; i < nodes.length; i++) {
          const n1 = nodes[i]
          if (!reduceMotion) {
            n1.x += n1.vx
            n1.y += n1.vy
            if (n1.x < 0 || n1.x > width) n1.vx *= -1
            if (n1.y < 0 || n1.y > height) n1.vy *= -1
            const distMouse = Math.hypot(n1.x - mX, n1.y - mY)
            if (distMouse < 120) {
              const angle = Math.atan2(n1.y - mY, n1.x - mX)
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
        canvas.removeEventListener('mousemove', handleMouseMove)
        canvas.removeEventListener('mousedown', handleMouseDown)
        canvas.removeEventListener('mouseup', handleMouseUp)
        canvas.removeEventListener('mouseleave', handleMouseUp)
        canvas.removeEventListener('wheel', handleWheel)
        canvas.removeEventListener('touchstart', handleTouchStart)
        canvas.removeEventListener('touchmove', handleTouchMove)
        canvas.removeEventListener('touchend', handleTouchEnd)
        window.removeEventListener('resize', handleResize)
      }
    }

    // ── ASTRO MODE ──────────────────────────────────────────────────────────
    const nebulaCount = isMobile ? 4 : 7
    const nebulae = Array.from({ length: nebulaCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.max(width, height) * (0.3 + Math.random() * 0.25),
      vx: (Math.random() - 0.5) * 0.12,
      vy: (Math.random() - 0.5) * 0.12,
      hueDark: palette.nebulaDark,
      hueLight: palette.nebulaLight,
    }))

    // Background field stars — high density for rich sky feel
    const fieldStarCount = isMobile ? 500 : 2500
    const fieldStars = Array.from({ length: fieldStarCount }, () => {
      const mag = Math.random() * 4.0 + 1.5
      return {
        ra: Math.random() * 24,
        dec: (Math.random() - 0.5) * 180,
        mag,
        phase: Math.random() * Math.PI * 2,
        speed: Math.random() * 2.0 + 0.3,
        colorIdx: Math.floor(Math.random() * 6), // for batch grouping
      }
    })

    // Pre-group field stars by color bucket for batch rendering
    const fieldStarGroups = [[], [], [], [], [], []]
    for (const fs of fieldStars) {
      fieldStarGroups[fs.colorIdx].push(fs)
    }

    const meteors = []
    let nextMeteorTime = 0
    let time = 0

    // Milky Way galactic plane points (approximate RA positions for the band)
    const milkyWayPoints = [
      { ra: 18.5, dec: -30 }, { ra: 19.0, dec: -20 }, { ra: 19.5, dec: -10 },
      { ra: 20.0, dec: 0 }, { ra: 20.5, dec: 15 }, { ra: 21.0, dec: 30 },
      { ra: 21.5, dec: 42 }, { ra: 22.0, dec: 50 }, { ra: 0.0, dec: 60 },
      { ra: 2.0, dec: 58 }, { ra: 4.0, dec: 45 }, { ra: 6.0, dec: 20 },
      { ra: 7.0, dec: 0 }, { ra: 8.0, dec: -20 },
    ]

    const renderAstro = () => {
      time += reduceMotion ? 0 : 0.014
      ctx.clearRect(0, 0, width, height)

      // Smooth zoom/pan interpolation
      interact.zoom += (interact.targetZoom - interact.zoom) * 0.08
      interact.panX += (interact.targetPanX - interact.panX) * 0.08
      interact.panY += (interact.targetPanY - interact.panY) * 0.08
      interact.mouseX += (interact.targetMouseX - interact.mouseX) * 0.08
      interact.mouseY += (interact.targetMouseY - interact.mouseY) * 0.08

      const isDark = document.documentElement.classList.contains('dark')
      const now = new Date()

      let isNight = true
      if (sunTimes) {
        isNight = now < sunTimes.sunrise || now > sunTimes.sunset
      } else {
        const h = now.getHours()
        isNight = h < 6 || h >= 18
      }

      // Apply zoom/pan transform
      ctx.save()
      ctx.translate(width / 2, height / 2)
      ctx.scale(interact.zoom, interact.zoom)
      ctx.translate(-width / 2 + interact.panX, -height / 2 + interact.panY)

      const mouseX = interact.mouseX
      const mouseY = interact.mouseY

      // Cursor ambient glow (in world space)
      const worldMX = (mouseX - width / 2) / interact.zoom - interact.panX + width / 2
      const worldMY = (mouseY - height / 2) / interact.zoom - interact.panY + height / 2
      const glowR = 240 / interact.zoom
      const mouseGrad = ctx.createRadialGradient(worldMX, worldMY, 0, worldMX, worldMY, glowR)
      mouseGrad.addColorStop(0, `rgba(0, 245, 212, ${isDark ? (isNight ? 0.15 : 0.07) : 0.06})`)
      mouseGrad.addColorStop(0.5, `rgba(0, 180, 216, ${isDark ? (isNight ? 0.06 : 0.03) : 0.02})`)
      mouseGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = mouseGrad
      ctx.beginPath()
      ctx.arc(worldMX, worldMY, glowR, 0, Math.PI * 2)
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
        grad.addColorStop(0, `rgba(${hue}, ${isDark ? (isNight ? 0.08 : 0.04) : 0.03})`)
        grad.addColorStop(1, 'rgba(0,0,0,0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(n.x, n.y, n.r, 0, Math.PI * 2)
        ctx.fill()
      }

      // Milky Way band — a subtle luminous strip
      const jd = julianDate(now)
      const baseLst = lstHours(jd, ZEWAIL_LON)
      const skyDriftHours = reduceMotion ? 0 : (time * 0.15) % 24
      const activeLst = (baseLst + skyDriftHours + 24) % 24

      const cx = width / 2
      const cy = height / 2

      const skyProject = (alt, az) => {
        const radAz = (az / 360) * Math.PI * 2
        const distR = (1 - (alt + 30) / 120) * Math.max(width, height) * 0.78
        const rx = Math.cos(radAz + time * 0.04) * distR
        const ry = Math.sin(radAz + time * 0.04) * distR
        return { px: cx + rx, py: cy + ry }
      }

      // Draw Milky Way band
      const mwBandWidth = isDark ? (isNight ? 80 : 40) : 25
      const mwAlpha = isDark ? (isNight ? 0.06 : 0.025) : 0.015
      if (milkyWayPoints.length >= 2) {
        const mwScreenPoints = milkyWayPoints.map(p => {
          const { alt, az } = altAz(p.ra, p.dec, ZEWAIL_LAT, activeLst)
          return skyProject(alt, az)
        })

        for (let i = 0; i < mwScreenPoints.length - 1; i++) {
          const p1 = mwScreenPoints[i]
          const p2 = mwScreenPoints[i + 1]
          const dist = Math.hypot(p2.px - p1.px, p2.py - p1.py)
          if (dist > width * 0.8) continue // skip wrap-around segments

          const midX = (p1.px + p2.px) / 2
          const midY = (p1.py + p2.py) / 2
          const angle = Math.atan2(p2.py - p1.py, p2.px - p1.px)
          const perpX = -Math.sin(angle)
          const perpY = Math.cos(angle)

          const grad = ctx.createLinearGradient(
            midX + perpX * mwBandWidth, midY + perpY * mwBandWidth,
            midX - perpX * mwBandWidth, midY - perpY * mwBandWidth
          )
          grad.addColorStop(0, 'rgba(0, 0, 0, 0)')
          grad.addColorStop(0.3, `rgba(180, 200, 255, ${mwAlpha * 0.5})`)
          grad.addColorStop(0.5, `rgba(200, 220, 255, ${mwAlpha})`)
          grad.addColorStop(0.7, `rgba(180, 200, 255, ${mwAlpha * 0.5})`)
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)')

          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.moveTo(p1.px + perpX * mwBandWidth, p1.py + perpY * mwBandWidth)
          ctx.lineTo(p2.px + perpX * mwBandWidth, p2.py + perpY * mwBandWidth)
          ctx.lineTo(p2.px - perpX * mwBandWidth, p2.py - perpY * mwBandWidth)
          ctx.lineTo(p1.px - perpX * mwBandWidth, p1.py - perpY * mwBandWidth)
          ctx.closePath()
          ctx.fill()
        }
      }

      const skyOpacity = isDark
        ? (isNight ? 0.96 : 0.40)
        : (isNight ? 0.48 : 0.28)

      // ── Build star position maps ─────────────────────────────────────────
      spatialHash.clear()
      const starPosMap = new Map()
      const visibleCatalogStars = []

      for (const star of starCatalog.stars) {
        const { alt, az } = altAz(star.ra, star.dec, ZEWAIL_LAT, activeLst)
        const { px, py } = skyProject(alt, az)
        const radius = Math.max(1.4, (4.5 - star.mag * 0.55))
        const starObj = { ...star, px, py, alt, az, radius }
        visibleCatalogStars.push(starObj)
        starPosMap.set(star.id, starObj)
        spatialHash.insert(starObj)
      }

      // ── Draw constellation lines & labels ────────────────────────────────
      ctx.lineWidth = 1.0
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
                ? `rgba(72, 202, 228, ${0.28 * skyOpacity})`
                : `rgba(0, 150, 199, ${0.20 * skyOpacity})`
              ctx.stroke()
            }
          }
        }
        if (count > 0) {
          const labelX = sumX / count
          const labelY = sumY / count
          if (labelX > 20 && labelX < width - 20 && labelY > 20 && labelY < height - 20) {
            ctx.font = 'bold 9px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillStyle = isDark
              ? `rgba(0, 245, 212, ${0.55 * skyOpacity})`
              : `rgba(0, 150, 199, ${0.45 * skyOpacity})`
            ctx.fillText(constel.name.toUpperCase(), labelX, labelY - 6)
            ctx.textAlign = 'left'
          }
        }
      }

      // ── Draw field stars (batch rendered by color group) ──────────────────
      const fieldColorsDark = [
        '180, 210, 255', '220, 230, 255', '255, 250, 240',
        '255, 240, 200', '255, 210, 160', '255, 180, 130',
      ]
      const fieldColorsLight = [
        '60, 80, 160', '40, 50, 120', '30, 30, 50',
        '60, 40, 20', '80, 40, 10', '100, 40, 10',
      ]
      const colorArr = isDark ? fieldColorsDark : fieldColorsLight

      for (let g = 0; g < 6; g++) {
        const group = fieldStarGroups[g]
        if (group.length === 0) continue
        const baseAlpha = isDark ? 0.7 : 0.5

        ctx.fillStyle = `rgba(${colorArr[g]}, ${baseAlpha * skyOpacity})`
        ctx.beginPath()
        for (const fs of group) {
          const { alt, az } = altAz(fs.ra, fs.dec, ZEWAIL_LAT, activeLst)
          const { px, py } = skyProject(alt, az)
          const twinkle = reduceMotion ? 1 : (0.7 + Math.sin(time * fs.speed + fs.phase) * 0.3)
          const r = Math.max(0.5, (2.0 - fs.mag * 0.35)) * twinkle
          ctx.moveTo(px + r, py)
          ctx.arc(px, py, r, 0, Math.PI * 2)
        }
        ctx.fill()
      }

      // ── Draw catalog stars with color & diffraction spikes ───────────────
      for (const s of visibleCatalogStars) {
        const twinkle = reduceMotion ? 1 : (0.85 + Math.sin(time * 2.2 + s.az * 0.1 + s.ra) * 0.15)
        const alpha = Math.min(1, Math.max(0.3, (1 - s.mag / 4.5) * skyOpacity * twinkle))

        // Get star color
        const specialColor = SPECIAL_STAR_COLORS[s.id]
        const color = specialColor
          ? (isDark ? specialColor.dark : specialColor.light)
          : starColor(s.mag, isDark)

        // Main star dot
        ctx.beginPath()
        ctx.arc(s.px, s.py, s.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color}, ${alpha})`
        ctx.fill()

        // Glow for bright stars (mag < 1.5)
        if (s.mag < 1.5) {
          const glowSize = s.radius * (3.5 + (1.5 - s.mag))
          const grad = ctx.createRadialGradient(s.px, s.py, 0, s.px, s.py, glowSize)
          grad.addColorStop(0, `rgba(${color}, ${alpha * 0.45})`)
          grad.addColorStop(0.4, `rgba(${color}, ${alpha * 0.15})`)
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(s.px, s.py, glowSize, 0, Math.PI * 2)
          ctx.fill()
        }

        // Diffraction spikes for top-5 brightest
        if (SPIKE_STARS.has(s.id)) {
          const spikeLen = s.radius * 6
          const spikeAlpha = alpha * 0.45
          ctx.strokeStyle = `rgba(${color}, ${spikeAlpha})`
          ctx.lineWidth = 0.7
          // Vertical spike
          ctx.beginPath()
          ctx.moveTo(s.px, s.py - spikeLen)
          ctx.lineTo(s.px, s.py + spikeLen)
          ctx.stroke()
          // Horizontal spike
          ctx.beginPath()
          ctx.moveTo(s.px - spikeLen, s.py)
          ctx.lineTo(s.px + spikeLen, s.py)
          ctx.stroke()
        }

        // Label for bright stars (mag < 1.2)
        if (s.mag < 1.2) {
          ctx.font = '10px sans-serif'
          ctx.fillStyle = isDark
            ? `rgba(255, 255, 255, ${0.7 * skyOpacity})`
            : `rgba(15, 23, 42, ${0.6 * skyOpacity})`
          ctx.fillText(s.name, s.px + s.radius + 5, s.py + 3)
        }
      }

      // ── Deep Sky Objects ─────────────────────────────────────────────────
      for (const dso of DEEP_SKY_OBJECTS) {
        const { alt, az } = altAz(dso.ra, dso.dec, ZEWAIL_LAT, activeLst)
        const { px, py } = skyProject(alt, az)

        const dsoR = dso.type === 'galaxy' ? 16 : 12
        const grad = ctx.createRadialGradient(px, py, 0, px, py, dsoR)
        if (dso.type === 'galaxy') {
          grad.addColorStop(0, `rgba(200, 160, 255, ${0.5 * skyOpacity})`)
          grad.addColorStop(0.5, `rgba(140, 100, 220, ${0.2 * skyOpacity})`)
        } else if (dso.type === 'nebula') {
          grad.addColorStop(0, `rgba(255, 130, 180, ${0.5 * skyOpacity})`)
          grad.addColorStop(0.5, `rgba(200, 80, 140, ${0.2 * skyOpacity})`)
        } else {
          grad.addColorStop(0, `rgba(180, 220, 255, ${0.5 * skyOpacity})`)
          grad.addColorStop(0.5, `rgba(100, 160, 220, ${0.2 * skyOpacity})`)
        }
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(px, py, dsoR, 0, Math.PI * 2)
        ctx.fill()

        ctx.font = 'bold 8px sans-serif'
        ctx.fillStyle = isDark
          ? `rgba(216, 180, 254, ${0.7 * skyOpacity})`
          : `rgba(126, 34, 206, ${0.6 * skyOpacity})`
        ctx.fillText(dso.name, px + dsoR + 3, py + 3)

        spatialHash.insert({ px, py, name: dso.name, mag: 0, id: dso.id })
      }

      // ── Real-Time Astronomy API Bodies ───────────────────────────────────
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
            const constellationName = extra?.constellation?.name

            const { px, py } = skyProject(alt, az)
            const bodyRadius = bodyId === 'sun' ? 8 : (bodyId === 'moon' ? 7 : Math.max(3.5, 7.0 - (extra?.magnitude ? parseFloat(extra.magnitude) : 1.0) * 0.5))
            const symbol = BODY_SYMBOLS[bodyId] || '●'

            // Body fill
            ctx.beginPath()
            ctx.arc(px, py, bodyRadius, 0, Math.PI * 2)
            ctx.fillStyle = bodyId === 'sun'
              ? `rgba(251, 191, 36, ${skyOpacity})`
              : (bodyId === 'moon' ? `rgba(254, 240, 138, ${skyOpacity})` : `rgba(192, 132, 252, ${skyOpacity})`)
            ctx.fill()

            // Halo ring
            ctx.beginPath()
            ctx.arc(px, py, bodyRadius * 2.2, 0, Math.PI * 2)
            ctx.strokeStyle = `rgba(0, 245, 212, ${0.35 * skyOpacity})`
            ctx.lineWidth = 0.8
            ctx.stroke()

            // Label
            const labelText = constellationName
              ? `${name} ${symbol} (${constellationName})`
              : `${name} ${symbol}`
            ctx.font = 'bold 10px sans-serif'
            ctx.fillStyle = isDark
              ? `rgba(255, 255, 255, ${0.8 * skyOpacity})`
              : `rgba(15, 23, 42, ${0.7 * skyOpacity})`
            ctx.fillText(labelText, px + bodyRadius + 5, py + 3)

            spatialHash.insert({
              px, py,
              name: `${name} ${symbol}`,
              mag: extra?.magnitude ? parseFloat(extra.magnitude) : 0,
              constellation: constellationName,
              id: bodyId,
            })
          }
        }
      }

      // ── Highlight hovered star ──────────────────────────────────────────
      if (interact.hoveredStar) {
        const hs = interact.hoveredStar
        const highlightR = (hs.radius || 4) + 8
        ctx.beginPath()
        ctx.arc(hs.px, hs.py, highlightR, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(0, 245, 212, ${0.6 * skyOpacity})`
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // ── Meteors ─────────────────────────────────────────────────────────
      if (!reduceMotion) {
        if (time > nextMeteorTime && meteors.length < 3) {
          meteors.push({
            x: Math.random() * width,
            y: Math.random() * (height * 0.6),
            length: Math.random() * 100 + 50,
            speed: Math.random() * 9 + 6,
            angle: Math.PI / 4 + (Math.random() - 0.5) * 0.3,
            alpha: 1.0,
          })
          nextMeteorTime = time + Math.random() * 5 + 2.5
        }
        for (let i = meteors.length - 1; i >= 0; i--) {
          const m = meteors[i]
          m.x += Math.cos(m.angle) * m.speed
          m.y += Math.sin(m.angle) * m.speed
          m.alpha -= 0.018

          if (m.alpha <= 0 || m.x > width + 50 || m.y > height + 50) {
            meteors.splice(i, 1)
            continue
          }
          const tailX = m.x - Math.cos(m.angle) * m.length
          const tailY = m.y - Math.sin(m.angle) * m.length

          const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY)
          grad.addColorStop(0, `rgba(220, 240, 255, ${m.alpha * skyOpacity})`)
          grad.addColorStop(0.3, `rgba(0, 245, 212, ${m.alpha * 0.6 * skyOpacity})`)
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)')

          ctx.beginPath()
          ctx.moveTo(m.x, m.y)
          ctx.lineTo(tailX, tailY)
          ctx.strokeStyle = grad
          ctx.lineWidth = 1.5
          ctx.stroke()
        }
      }

      ctx.restore()

      // ── Zoom indicator (drawn in screen space, outside transform) ───────
      const zoomPct = Math.round(interact.zoom * 100)
      if (Math.abs(interact.zoom - 1) > 0.05) {
        const indX = width - 70
        const indY = height - 30
        ctx.font = 'bold 11px monospace'
        ctx.fillStyle = isDark ? 'rgba(0, 245, 212, 0.6)' : 'rgba(0, 150, 199, 0.5)'
        ctx.textAlign = 'right'
        ctx.fillText(`${zoomPct}%`, indX + 40, indY)

        // Mini crosshair
        ctx.strokeStyle = isDark ? 'rgba(0, 245, 212, 0.3)' : 'rgba(0, 150, 199, 0.25)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(indX - 5, indY - 6)
        ctx.lineTo(indX + 5, indY - 6)
        ctx.moveTo(indX, indY - 11)
        ctx.lineTo(indX, indY - 1)
        ctx.stroke()
        ctx.textAlign = 'left'
      }

      animId = requestAnimationFrame(renderAstro)
    }

    renderAstro()

    return () => {
      if (animId) cancelAnimationFrame(animId)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mouseup', handleMouseUp)
      canvas.removeEventListener('mouseleave', handleMouseUp)
      canvas.removeEventListener('wheel', handleWheel)
      canvas.removeEventListener('touchstart', handleTouchStart)
      canvas.removeEventListener('touchmove', handleTouchMove)
      canvas.removeEventListener('touchend', handleTouchEnd)
      window.removeEventListener('resize', handleResize)
    }
  }, [skyData, sunTimes, mode])

  return (
    <div className={`${isFixed ? 'fixed' : 'absolute'} inset-0 z-0 ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* Tooltip overlay */}
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none z-20 px-3 py-1.5 rounded-lg
                   bg-black/80 backdrop-blur-md border border-cyan-400/30
                   text-cyan-200 text-xs font-mono whitespace-nowrap
                   transition-opacity duration-150"
        style={{ opacity: 0, top: 0, left: 0 }}
      />
    </div>
  )
}
