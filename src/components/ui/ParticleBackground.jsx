import { useEffect, useRef, useState } from 'react'
import * as cloudflare from '@/services/cloudflare'
import { julianDate, lstHours, altAz, getSolarTimes, satelliteAltAz } from '@/utils/astro'
import starCatalog from '@/data/stars.json'

const ZEWAIL_LAT = 30.03
const ZEWAIL_LON = 30.95

// Deep Sky Objects catalog (Nebulae, Galaxies, Star Clusters)
const DEEP_SKY_OBJECTS = [
  { id: 'm31', name: 'Andromeda Galaxy (M31) 🌌', ra: 0.71, dec: 41.27, type: 'galaxy', desc: 'Spiral galaxy 2.5M ly away' },
  { id: 'm42', name: 'Orion Nebula (M42) 🌫️', ra: 5.59, dec: -5.39, type: 'nebula', desc: 'Diffuse stellar nursery' },
  { id: 'm45', name: 'Pleiades Cluster (M45) 💫', ra: 3.79, dec: 24.11, type: 'cluster', desc: 'Open cluster / Seven Sisters' },
  { id: 'm44', name: 'Beehive Cluster (M44) 🐝', ra: 8.67, dec: 19.67, type: 'cluster', desc: 'Open star cluster in Cancer' },
  { id: 'ngc869', name: 'Double Cluster 🌟', ra: 2.32, dec: 57.13, type: 'cluster', desc: 'Open clusters in Perseus' },
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

// Spectral color parser: converts spectral classification (O, B, A, F, G, K, M) into accurate RGB
function getSpectralRgb(spect = '', mag = 3, isDark = true) {
  const first = (spect[0] || '').toUpperCase()
  if (first === 'O' || first === 'B') return isDark ? '165, 205, 255' : '45, 80, 175'   // Ice Blue (Hot O/B)
  if (first === 'A') return isDark ? '215, 235, 255' : '40, 60, 140'                  // Blue-White (A)
  if (first === 'F') return isDark ? '255, 252, 240' : '35, 45, 80'                   // Crisp White (F)
  if (first === 'G') return isDark ? '255, 235, 170' : '100, 75, 20'                  // Golden-Yellow (G - Sunlike)
  if (first === 'K') return isDark ? '255, 185, 110' : '130, 65, 15'                  // Orange-Amber (K)
  if (first === 'M') return isDark ? '255, 120, 85'  : '150, 40, 20'                  // Crimson-Red (M)

  // Fallback based on magnitude
  if (mag < 1.0) return isDark ? '200, 225, 255' : '50, 70, 160'
  if (mag < 2.5) return isDark ? '255, 245, 210' : '60, 50, 30'
  return isDark ? '240, 240, 255' : '60, 60, 80'
}

// Special individual star colors for prominent landmarks
const SPECIAL_STARS = {
  betelgeuse: { dark: '255, 115, 75', light: '180, 45, 20' },
  antares:    { dark: '255, 100, 70', light: '170, 40, 15' },
  aldebaran:  { dark: '255, 175, 95', light: '160, 60, 10' },
  rigel:      { dark: '160, 205, 255', light: '40, 60, 160' },
  sirius:     { dark: '195, 225, 255', light: '45, 70, 170' },
  vega:       { dark: '205, 225, 255', light: '50, 65, 165' },
  capella:    { dark: '255, 240, 160', light: '130, 100, 20' },
  arcturus:   { dark: '255, 195, 115', light: '150, 70, 10' },
  spica:      { dark: '175, 210, 255', light: '45, 60, 160' },
  pollux:     { dark: '255, 215, 140', light: '140, 80, 15' },
}

// Stars that get diffraction spike rendering
const SPIKE_STARS = new Set(['sirius', 'arcturus', 'vega', 'capella', 'rigel', 'canopus', 'procyon', 'betelgeuse', 'altair', 'aldebaran'])

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

// ── Spatial Hash for O(1) hover & picking ────────────────────────────────────
class SpatialHash {
  constructor(cellSize = 32) {
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
  query(x, y, radius = 18) {
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
  const constelCardRef = useRef(null)
  const [skyData, setSkyData] = useState(null)
  const [sunTimes, setSunTimes] = useState(null)
  const [issData, setIssData] = useState(null)

  // Interactive camera / mouse refs
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
    hoveredItem: null,
    hoveredConstel: null,
  })

  // 1. Fetch live Ephemeris, Weather, and ISS periodically
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

      // ISS Live Location
      const updateIss = () => {
        cloudflare.fetchIss().then(res => {
          if (res?.iss_position) {
            setIssData({
              lat: parseFloat(res.iss_position.latitude),
              lon: parseFloat(res.iss_position.longitude),
              time: res.timestamp,
            })
          }
        }).catch(() => {})
      }
      updateIss()
      const issInterval = setInterval(updateIss, 20000)
      return () => clearInterval(issInterval)
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
    const spatialHash = new SpatialHash(32)

    let animId = null
    let width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth)
    let height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight)

    interact.targetMouseX = width / 2
    interact.targetMouseY = height / 2
    interact.mouseX = width / 2
    interact.mouseY = height / 2

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

      // World coordinate conversion for picking
      const worldX = (pos.x - width / 2) / interact.zoom - interact.panX + width / 2
      const worldY = (pos.y - height / 2) / interact.zoom - interact.panY + height / 2
      const nearest = spatialHash.query(worldX, worldY, 22 / interact.zoom)
      interact.hoveredItem = nearest.length > 0 ? nearest[0] : null

      // Check if hovering a constellation
      let foundConstel = null
      if (interact.hoveredItem?.constellationObj) {
        foundConstel = interact.hoveredItem.constellationObj
      }
      interact.hoveredConstel = foundConstel

      // Update Tooltip UI
      if (tooltipRef.current) {
        if (interact.hoveredItem) {
          const item = interact.hoveredItem
          let label = item.name
          if (item.type === 'iss') {
            label = `🛰️ ${item.name} · Alt: ${item.alt.toFixed(1)}° · ${item.rangeKm ? Math.round(item.rangeKm) + ' km' : 'Orbit'}`
          } else if (item.mag !== undefined && item.mag !== null) {
            const spectText = item.spect ? ` · [${item.spect}]` : ''
            const constelText = item.constellation ? ` · ${item.constellation}` : ''
            label = `${item.name} (mag ${item.mag.toFixed(1)})${spectText}${constelText}`
          }
          tooltipRef.current.textContent = label
          tooltipRef.current.style.opacity = '1'
          tooltipRef.current.style.left = `${pos.x + 16}px`
          tooltipRef.current.style.top = `${pos.y - 12}px`
          canvas.style.cursor = 'pointer'
        } else {
          tooltipRef.current.style.opacity = '0'
          canvas.style.cursor = interact.isDragging ? 'grabbing' : 'grab'
        }
      }

      // Update Constellation Badge UI
      if (constelCardRef.current) {
        if (interact.hoveredConstel) {
          const c = interact.hoveredConstel
          constelCardRef.current.innerHTML = `
            <div class="flex items-center gap-1.5 text-cyan-300 font-bold uppercase tracking-wider text-[11px]">
              <span class="text-cyan-400">✦</span> ${c.name} <span class="text-white/40 font-normal text-[10px]">(${c.latin || 'Constellation'})</span>
            </div>
          `
          constelCardRef.current.style.opacity = '1'
        } else {
          constelCardRef.current.style.opacity = '0'
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
      interact.targetZoom = Math.min(4.5, Math.max(0.35, interact.targetZoom * zoomFactor))
    }

    // Touch support (pinch to zoom and drag to pan)
    let lastTouchDist = 0

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
        lastTouchDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
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
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY
        )
        if (lastTouchDist > 0) {
          const scale = dist / lastTouchDist
          interact.targetZoom = Math.min(4.5, Math.max(0.35, interact.targetZoom * scale))
        }
        lastTouchDist = dist
      }
    }

    const handleTouchEnd = () => {
      interact.isDragging = false
      lastTouchDist = 0
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

    const isMobile = width < 640

    // Nebular cosmic dust clouds
    const nebulaCount = isMobile ? 4 : 7
    const nebulae = Array.from({ length: nebulaCount }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: Math.max(width, height) * (0.35 + Math.random() * 0.25),
      vx: (Math.random() - 0.5) * 0.1,
      vy: (Math.random() - 0.5) * 0.1,
      hueDark: palette.nebulaDark,
      hueLight: palette.nebulaLight,
    }))

    // Milky Way galactic backbone points
    const milkyWayNodes = [
      { ra: 18.2, dec: -32 }, { ra: 18.8, dec: -22 }, { ra: 19.4, dec: -11 },
      { ra: 20.0, dec: 2 },  { ra: 20.6, dec: 17 },  { ra: 21.2, dec: 33 },
      { ra: 21.8, dec: 45 }, { ra: 22.5, dec: 54 }, { ra: 0.2, dec: 62 },
      { ra: 2.2, dec: 60 },  { ra: 4.2, dec: 47 },  { ra: 6.0, dec: 23 },
      { ra: 6.8, dec: 3 },   { ra: 7.5, dec: -16 }, { ra: 8.2, dec: -35 }
    ]

    // Cardinal directions on horizon
    const CARDINALS = [
      { az: 0, label: 'N' },
      { az: 45, label: 'NE' },
      { az: 90, label: 'E' },
      { az: 135, label: 'SE' },
      { az: 180, label: 'S' },
      { az: 225, label: 'SW' },
      { az: 270, label: 'W' },
      { az: 315, label: 'NW' },
    ]

    const meteors = []
    let nextMeteorTime = 0
    let time = 0

    const renderAstro = () => {
      time += reduceMotion ? 0 : 0.012
      ctx.clearRect(0, 0, width, height)

      // Smooth camera interpolation
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

      ctx.save()
      // Apply interactive view transform
      ctx.translate(width / 2, height / 2)
      ctx.scale(interact.zoom, interact.zoom)
      ctx.translate(-width / 2 + interact.panX, -height / 2 + interact.panY)

      const mouseX = interact.mouseX
      const mouseY = interact.mouseY

      // Ambient cursor starlight glow
      const worldMX = (mouseX - width / 2) / interact.zoom - interact.panX + width / 2
      const worldMY = (mouseY - height / 2) / interact.zoom - interact.panY + height / 2
      const glowR = 260 / interact.zoom
      const mouseGrad = ctx.createRadialGradient(worldMX, worldMY, 0, worldMX, worldMY, glowR)
      mouseGrad.addColorStop(0, `rgba(0, 245, 212, ${isDark ? (isNight ? 0.16 : 0.08) : 0.06})`)
      mouseGrad.addColorStop(0.5, `rgba(0, 180, 216, ${isDark ? (isNight ? 0.06 : 0.03) : 0.02})`)
      mouseGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = mouseGrad
      ctx.beginPath()
      ctx.arc(worldMX, worldMY, glowR, 0, Math.PI * 2)
      ctx.fill()

      // Nebulae clouds
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

      // Real Astronomical Ephemeris & Projection
      const jd = julianDate(now)
      const baseLst = lstHours(jd, ZEWAIL_LON)
      const skyDriftHours = reduceMotion ? 0 : (time * 0.12) % 24
      const activeLst = (baseLst + skyDriftHours + 24) % 24

      const cx = width / 2
      const cy = height / 2

      // Stereographic Sky Map Projection
      const skyProject = (alt, az) => {
        const radAz = (az / 360) * Math.PI * 2
        // Altitude scaling: zenith (90°) at center, horizon (0°) at radius R
        const distR = (1 - (alt + 25) / 115) * Math.max(width, height) * 0.78
        const rx = Math.cos(radAz + time * 0.035) * distR
        const ry = Math.sin(radAz + time * 0.035) * distR
        return { px: cx + rx, py: cy + ry }
      }

      const skyOpacity = isDark ? (isNight ? 0.98 : 0.42) : (isNight ? 0.50 : 0.30)

      // ── Draw Milky Way Galaxy Band ───────────────────────────────────────
      const mwBandWidth = isDark ? (isNight ? 95 : 45) : 30
      const mwAlpha = isDark ? (isNight ? 0.07 : 0.03) : 0.018
      if (milkyWayNodes.length >= 2) {
        const mwPoints = milkyWayNodes.map(p => {
          const { alt, az } = altAz(p.ra, p.dec, ZEWAIL_LAT, activeLst)
          return skyProject(alt, az)
        })

        for (let i = 0; i < mwPoints.length - 1; i++) {
          const p1 = mwPoints[i]
          const p2 = mwPoints[i + 1]
          const dist = Math.hypot(p2.px - p1.px, p2.py - p1.py)
          if (dist > width * 0.8) continue

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
          grad.addColorStop(0.3, `rgba(180, 210, 255, ${mwAlpha * 0.5})`)
          grad.addColorStop(0.5, `rgba(215, 235, 255, ${mwAlpha})`)
          grad.addColorStop(0.7, `rgba(160, 200, 255, ${mwAlpha * 0.5})`)
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

      // ── Cardinal compass markers along horizon ───────────────────────────
      for (const card of CARDINALS) {
        const { px, py } = skyProject(0, card.az)
        ctx.font = 'bold 9px monospace'
        ctx.fillStyle = isDark
          ? `rgba(72, 202, 228, ${0.45 * skyOpacity})`
          : `rgba(0, 150, 199, ${0.35 * skyOpacity})`
        ctx.textAlign = 'center'
        ctx.fillText(`[${card.label}]`, px, py)
        ctx.textAlign = 'left'
      }

      // ── Build star position map ──────────────────────────────────────────
      spatialHash.clear()
      const starPosMap = new Map()
      const visibleStars = []

      for (const star of starCatalog.stars) {
        const { alt, az } = altAz(star.ra, star.dec, ZEWAIL_LAT, activeLst)
        const { px, py } = skyProject(alt, az)
        const radius = Math.max(1.2, (4.6 - star.mag * 0.6))
        const starObj = { ...star, px, py, alt, az, radius }
        visibleStars.push(starObj)
        starPosMap.set(star.id, starObj)
        spatialHash.insert(starObj)
      }

      // ── Constellation Art, Glow & Lines (Sky-App Style) ───────────────────
      for (const constel of starCatalog.constellations) {
        const isConstelHovered = interact.hoveredConstel?.name === constel.name
        let sumX = 0, sumY = 0, count = 0
        const constelStars = []

        // Constellation line paths
        for (const [idA, idB] of constel.lines) {
          const sA = starPosMap.get(idA)
          const sB = starPosMap.get(idB)
          if (sA && sB) {
            sumX += sA.px + sB.px
            sumY += sA.py + sB.py
            count += 2
            constelStars.push(sA, sB)

            const dist = Math.hypot(sA.px - sB.px, sA.py - sB.py)
            if (dist < width * 0.7) {
              ctx.beginPath()
              ctx.moveTo(sA.px, sA.py)
              ctx.lineTo(sB.px, sB.py)

              if (isConstelHovered) {
                // Sky App Glowing Constellation Highlight
                ctx.strokeStyle = isDark
                  ? `rgba(0, 245, 212, ${0.85 * skyOpacity})`
                  : `rgba(0, 180, 216, ${0.75 * skyOpacity})`
                ctx.lineWidth = 2.0
                ctx.shadowColor = '#00f5d4'
                ctx.shadowBlur = 8
              } else {
                ctx.strokeStyle = isDark
                  ? `rgba(72, 202, 228, ${0.30 * skyOpacity})`
                  : `rgba(0, 150, 199, ${0.22 * skyOpacity})`
                ctx.lineWidth = 1.0
                ctx.shadowBlur = 0
              }
              ctx.stroke()
              ctx.shadowBlur = 0
            }
          }
        }

        // Constellation Centroid & Aura Fill
        if (count > 0) {
          const constelX = sumX / count
          const constelY = sumY / count

          // Register constellation for spatial picking
          spatialHash.insert({
            px: constelX,
            py: constelY,
            name: `Constellation: ${constel.name} (${constel.latin || ''})`,
            constellationObj: constel,
          })

          // Sky-app style subtle polygon glow when hovered
          if (isConstelHovered && constelStars.length > 2) {
            const glowGrad = ctx.createRadialGradient(constelX, constelY, 0, constelX, constelY, 140)
            glowGrad.addColorStop(0, `rgba(0, 245, 212, ${0.14 * skyOpacity})`)
            glowGrad.addColorStop(0.7, `rgba(72, 202, 228, ${0.04 * skyOpacity})`)
            glowGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
            ctx.fillStyle = glowGrad
            ctx.beginPath()
            ctx.arc(constelX, constelY, 140, 0, Math.PI * 2)
            ctx.fill()
          }

          // Centroid Label
          if (constelX > 20 && constelX < width - 20 && constelY > 20 && constelY < height - 20) {
            ctx.font = isConstelHovered ? 'bold 11px sans-serif' : 'bold 9px sans-serif'
            ctx.textAlign = 'center'
            ctx.fillStyle = isConstelHovered
              ? (isDark ? '#00f5d4' : '#0077b6')
              : (isDark ? `rgba(0, 245, 212, ${0.58 * skyOpacity})` : `rgba(0, 150, 199, ${0.48 * skyOpacity})`)
            ctx.fillText(constel.name.toUpperCase(), constelX, constelY - 6)
            ctx.textAlign = 'left'
          }
        }
      }

      // ── Draw All 500+ Real Catalog Stars ─────────────────────────────────
      for (const s of visibleStars) {
        const twinkle = reduceMotion ? 1 : (0.85 + Math.sin(time * 2.2 + s.az * 0.1 + s.ra) * 0.15)
        const alpha = Math.min(1, Math.max(0.25, (1 - s.mag / 5.2) * skyOpacity * twinkle))

        // True spectral class color
        const special = SPECIAL_STARS[s.id]
        const color = special
          ? (isDark ? special.dark : special.light)
          : getSpectralRgb(s.spect, s.mag, isDark)

        // Main star point
        ctx.beginPath()
        ctx.arc(s.px, s.py, s.radius, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${color}, ${alpha})`
        ctx.fill()

        // Luminous halo for bright stars (mag < 1.6)
        if (s.mag < 1.6) {
          const glowSize = s.radius * (3.8 + (1.6 - s.mag) * 1.5)
          const grad = ctx.createRadialGradient(s.px, s.py, 0, s.px, s.py, glowSize)
          grad.addColorStop(0, `rgba(${color}, ${alpha * 0.50})`)
          grad.addColorStop(0.4, `rgba(${color}, ${alpha * 0.18})`)
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
          ctx.fillStyle = grad
          ctx.beginPath()
          ctx.arc(s.px, s.py, glowSize, 0, Math.PI * 2)
          ctx.fill()
        }

        // Diffraction Spikes for top bright landmark stars
        if (SPIKE_STARS.has(s.id)) {
          const spikeLen = s.radius * 6.5
          ctx.strokeStyle = `rgba(${color}, ${alpha * 0.45})`
          ctx.lineWidth = 0.75
          ctx.beginPath()
          ctx.moveTo(s.px, s.py - spikeLen)
          ctx.lineTo(s.px, s.py + spikeLen)
          ctx.moveTo(s.px - spikeLen, s.py)
          ctx.lineTo(s.px + spikeLen, s.py)
          ctx.stroke()
        }

        // Star Name Tag for major landmarks (mag < 1.3)
        if (s.mag < 1.3 && s.name && !s.name.startsWith('HIP')) {
          ctx.font = '10px sans-serif'
          ctx.fillStyle = isDark
            ? `rgba(255, 255, 255, ${0.75 * skyOpacity})`
            : `rgba(15, 23, 42, ${0.65 * skyOpacity})`
          ctx.fillText(s.name, s.px + s.radius + 5, s.py + 3)
        }
      }

      // ── Deep Sky Objects (M31, M42, M45, etc.) ───────────────────────────
      for (const dso of DEEP_SKY_OBJECTS) {
        const { alt, az } = altAz(dso.ra, dso.dec, ZEWAIL_LAT, activeLst)
        const { px, py } = skyProject(alt, az)

        const dsoR = dso.type === 'galaxy' ? 18 : (dso.type === 'nebula' ? 15 : 12)
        const grad = ctx.createRadialGradient(px, py, 0, px, py, dsoR)
        if (dso.type === 'galaxy') {
          grad.addColorStop(0, `rgba(200, 160, 255, ${0.55 * skyOpacity})`)
          grad.addColorStop(0.5, `rgba(140, 100, 220, ${0.22 * skyOpacity})`)
        } else if (dso.type === 'nebula') {
          grad.addColorStop(0, `rgba(255, 130, 180, ${0.55 * skyOpacity})`)
          grad.addColorStop(0.5, `rgba(200, 80, 140, ${0.22 * skyOpacity})`)
        } else {
          grad.addColorStop(0, `rgba(180, 220, 255, ${0.55 * skyOpacity})`)
          grad.addColorStop(0.5, `rgba(100, 160, 220, ${0.22 * skyOpacity})`)
        }
        grad.addColorStop(1, 'rgba(0, 0, 0, 0)')
        ctx.fillStyle = grad
        ctx.beginPath()
        ctx.arc(px, py, dsoR, 0, Math.PI * 2)
        ctx.fill()

        ctx.font = 'bold 9px sans-serif'
        ctx.fillStyle = isDark
          ? `rgba(216, 180, 254, ${0.75 * skyOpacity})`
          : `rgba(126, 34, 206, ${0.65 * skyOpacity})`
        ctx.fillText(dso.name, px + dsoR + 4, py + 3)

        spatialHash.insert({ px, py, name: `${dso.name} (${dso.desc})`, mag: 0, id: dso.id })
      }

      // ── Live Astronomy API Bodies (Sun, Moon, Planets) ───────────────────
      if (skyData?.bodies && Array.isArray(skyData.bodies)) {
        for (const body of skyData.bodies) {
          const bodyId = body.id?.toLowerCase()
          const name = body.name || bodyId
          const alt = body.altitude || 0
          const az = body.azimuth || 0
          const { px, py } = skyProject(alt, az)

          const bodyRadius = bodyId === 'sun' ? 8.5 : (bodyId === 'moon' ? 7.5 : 5.0)
          const symbol = BODY_SYMBOLS[bodyId] || '🪐'

          // Body Disc
          ctx.beginPath()
          ctx.arc(px, py, bodyRadius, 0, Math.PI * 2)
          ctx.fillStyle = bodyId === 'sun'
            ? `rgba(251, 191, 36, ${skyOpacity})`
            : (bodyId === 'moon' ? `rgba(254, 240, 138, ${skyOpacity})` : `rgba(192, 132, 252, ${skyOpacity})`)
          ctx.fill()

          // Orbital Halo Ring
          ctx.beginPath()
          ctx.arc(px, py, bodyRadius * 2.2, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(0, 245, 212, ${0.40 * skyOpacity})`
          ctx.lineWidth = 0.9
          ctx.stroke()

          // Body Tag
          const labelText = body.constellation
            ? `${name.toUpperCase()} ${symbol} (${body.constellation})`
            : `${name.toUpperCase()} ${symbol}`
          ctx.font = 'bold 10px sans-serif'
          ctx.fillStyle = isDark
            ? `rgba(255, 255, 255, ${0.85 * skyOpacity})`
            : `rgba(15, 23, 42, ${0.75 * skyOpacity})`
          ctx.fillText(labelText, px + bodyRadius + 6, py + 3)

          spatialHash.insert({
            px, py,
            name: `${name.toUpperCase()} ${symbol}`,
            mag: bodyId === 'sun' ? -26 : (bodyId === 'moon' ? -12 : 1.0),
            constellation: body.constellation,
            id: bodyId,
          })
        }
      }

      // ── Live ISS (International Space Station) Tracker ───────────────────
      if (issData && issData.lat !== undefined) {
        const issAltAz = satelliteAltAz(issData.lat, issData.lon, 420, ZEWAIL_LAT, ZEWAIL_LON)
        const { px, py } = skyProject(issAltAz.alt, issAltAz.az)

        // Pulsing satellite icon & locator ring
        const pulseR = 12 + Math.sin(time * 6) * 4
        ctx.beginPath()
        ctx.arc(px, py, pulseR, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.65 * skyOpacity})`
        ctx.lineWidth = 1.2
        ctx.stroke()

        ctx.beginPath()
        ctx.arc(px, py, 4.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(56, 189, 248, ${skyOpacity})`
        ctx.fill()

        ctx.font = 'bold 10px monospace'
        ctx.fillStyle = isDark ? '#38bdf8' : '#0284c7'
        ctx.fillText(`🛰️ ISS [${issAltAz.alt.toFixed(0)}°]`, px + 10, py + 3)

        spatialHash.insert({
          px, py,
          name: `International Space Station (ISS)`,
          type: 'iss',
          alt: issAltAz.alt,
          az: issAltAz.az,
          rangeKm: issAltAz.rangeKm,
          id: 'iss',
        })
      }

      // ── Hover Highlight Ring ─────────────────────────────────────────────
      if (interact.hoveredItem) {
        const hs = interact.hoveredItem
        const highlightR = (hs.radius || 5) + 8
        ctx.beginPath()
        ctx.arc(hs.px, hs.py, highlightR, 0, Math.PI * 2)
        ctx.strokeStyle = `rgba(0, 245, 212, ${0.85 * skyOpacity})`
        ctx.lineWidth = 1.5
        ctx.stroke()
      }

      // ── Shooting Stars / Meteors ─────────────────────────────────────────
      if (!reduceMotion) {
        if (time > nextMeteorTime && meteors.length < 3) {
          meteors.push({
            x: Math.random() * width,
            y: Math.random() * (height * 0.6),
            length: Math.random() * 110 + 60,
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
          m.alpha -= 0.016

          if (m.alpha <= 0 || m.x > width + 50 || m.y > height + 50) {
            meteors.splice(i, 1)
            continue
          }
          const tailX = m.x - Math.cos(m.angle) * m.length
          const tailY = m.y - Math.sin(m.angle) * m.length

          const grad = ctx.createLinearGradient(m.x, m.y, tailX, tailY)
          grad.addColorStop(0, `rgba(230, 245, 255, ${m.alpha * skyOpacity})`)
          grad.addColorStop(0.3, `rgba(0, 245, 212, ${m.alpha * 0.65 * skyOpacity})`)
          grad.addColorStop(1, 'rgba(0, 0, 0, 0)')

          ctx.beginPath()
          ctx.moveTo(m.x, m.y)
          ctx.lineTo(tailX, tailY)
          ctx.strokeStyle = grad
          ctx.lineWidth = 1.6
          ctx.stroke()
        }
      }

      ctx.restore()

      // ── Screen-space Zoom & Navigation HUD ────────────────────────────────
      const zoomPct = Math.round(interact.zoom * 100)
      if (Math.abs(interact.zoom - 1) > 0.04 || Math.abs(interact.panX) > 10 || Math.abs(interact.panY) > 10) {
        const hudX = width - 80
        const hudY = height - 25
        ctx.font = 'bold 11px monospace'
        ctx.fillStyle = isDark ? 'rgba(0, 245, 212, 0.7)' : 'rgba(0, 150, 199, 0.6)'
        ctx.textAlign = 'right'
        ctx.fillText(`${zoomPct}%`, hudX + 50, hudY)

        // Crosshair compass
        ctx.strokeStyle = isDark ? 'rgba(0, 245, 212, 0.35)' : 'rgba(0, 150, 199, 0.3)'
        ctx.lineWidth = 1
        ctx.beginPath()
        ctx.moveTo(hudX - 6, hudY - 5)
        ctx.lineTo(hudX + 6, hudY - 5)
        ctx.moveTo(hudX, hudY - 11)
        ctx.lineTo(hudX, hudY + 1)
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
  }, [skyData, sunTimes, issData, mode])

  return (
    <div className={`${isFixed ? 'fixed' : 'absolute'} inset-0 z-0 ${className}`}>
      <canvas ref={canvasRef} className="w-full h-full" />
      
      {/* Interactive Tooltip Overlay */}
      <div
        ref={tooltipRef}
        className="absolute pointer-events-none z-20 px-3 py-1.5 rounded-lg
                   bg-black/85 backdrop-blur-md border border-cyan-400/30
                   text-cyan-200 text-xs font-mono shadow-xl whitespace-nowrap
                   transition-opacity duration-150"
        style={{ opacity: 0, top: 0, left: 0 }}
      />

      {/* Constellation Discovery Card */}
      <div
        ref={constelCardRef}
        className="absolute top-4 right-4 pointer-events-none z-20 px-3.5 py-2 rounded-xl
                   bg-black/75 backdrop-blur-md border border-cyan-400/30 shadow-glow
                   transition-all duration-200"
        style={{ opacity: 0 }}
      />
    </div>
  )
}
