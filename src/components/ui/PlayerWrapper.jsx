import { useState, useRef, useCallback, useEffect } from 'react'
import ReactPlayer from 'react-player/youtube'
import {
  Play, Pause, Volume2, VolumeX, Maximize, Minimize2,
  Settings as SettingsIcon, ChevronLeft, MonitorPlay,
  SkipForward
} from 'lucide-react'
import { useSettings } from '@/context/SettingsContext'
import clsx from 'clsx'

const QUALITIES = [
  { value:'highres', label:'4K'     },
  { value:'hd1080',  label:'1080p'  },
  { value:'hd720',   label:'720p'   },
  { value:'large',   label:'480p'   },
  { value:'medium',  label:'360p'   },
  { value:'small',   label:'240p'   },
  { value:'default', label:'Auto'   },
]

const SPEEDS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

function pad(n) { return String(Math.floor(n)).padStart(2, '0') }
function fmtTime(s) {
  if (!s || isNaN(s)) return '0:00'
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = Math.floor(s % 60)
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`
}

/* ── Settings panel (quality + speed) ───────────────────────────────────────── */
function SettingsPanel({ quality, setQuality, speed, setSpeed, onClose }) {
  const [page, setPage] = useState('main')  // 'main' | 'quality' | 'speed'
  return (
    <div className="absolute bottom-full right-0 mb-2 w-52 bg-black/92 backdrop-blur-sm
                    border border-white/10 rounded-2xl overflow-hidden shadow-deep z-30 animate-scale-in">

      {/* Main menu */}
      {page === 'main' && (
        <div className="py-1">
          <div className="px-4 py-2 text-[11px] font-mono font-semibold text-white/30 uppercase tracking-wider">
            Playback Settings
          </div>
          <button onClick={() => setPage('quality')}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm
                             text-white/80 hover:bg-white/8 transition-colors">
            <span className="flex items-center gap-2">
              <MonitorPlay className="w-4 h-4 text-ocean-400" />
              Quality
            </span>
            <span className="text-white/40 text-xs">{QUALITIES.find(q=>q.value===quality)?.label ?? 'Auto'} ›</span>
          </button>
          <button onClick={() => setPage('speed')}
                  className="w-full flex items-center justify-between px-4 py-3 text-sm
                             text-white/80 hover:bg-white/8 transition-colors">
            <span className="flex items-center gap-2">
              <SkipForward className="w-4 h-4 text-ocean-400" />
              Speed
            </span>
            <span className="text-white/40 text-xs">{speed}× ›</span>
          </button>
        </div>
      )}

      {/* Quality sub-menu */}
      {page === 'quality' && (
        <div className="py-1">
          <button onClick={() => setPage('main')}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white/60
                             hover:text-white transition-colors border-b border-white/8">
            <ChevronLeft className="w-4 h-4" /> Quality
          </button>
          {QUALITIES.map(q => (
            <button key={q.value} onClick={() => { setQuality(q.value); setPage('main') }}
                    className={clsx(
                      'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors',
                      quality === q.value
                        ? 'bg-ocean-500/20 text-ocean-300 font-semibold'
                        : 'text-white/75 hover:bg-white/8 hover:text-white'
                    )}>
              {q.label}
              {quality === q.value && <span className="text-ocean-400 text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}

      {/* Speed sub-menu */}
      {page === 'speed' && (
        <div className="py-1">
          <button onClick={() => setPage('main')}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-white/60
                             hover:text-white transition-colors border-b border-white/8">
            <ChevronLeft className="w-4 h-4" /> Playback Speed
          </button>
          {SPEEDS.map(s => (
            <button key={s} onClick={() => { setSpeed(s); setPage('main') }}
                    className={clsx(
                      'w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors',
                      speed === s
                        ? 'bg-ocean-500/20 text-ocean-300 font-semibold'
                        : 'text-white/75 hover:bg-white/8 hover:text-white'
                    )}>
              {s === 1 ? 'Normal' : `${s}×`}
              {speed === s && <span className="text-ocean-400 text-xs">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ── Main player ─────────────────────────────────────────────────────────────── */
export default function PlayerWrapper({ videoId, title = '', onProgress, onEnded, autoplay = false }) {
  const { settings, update } = useSettings()

  const playerRef     = useRef(null)
  const containerRef  = useRef(null)
  const hideTimer     = useRef(null)

  const [playing,     setPlaying]     = useState(autoplay)
  const [muted,       setMuted]       = useState(false)
  const [volume,      setVolume]      = useState(0.85)
  const [played,      setPlayed]      = useState(0)
  const [loaded,      setLoaded]      = useState(0)
  const [duration,    setDuration]    = useState(0)
  const [seeking,     setSeeking]     = useState(false)
  const [showCtrl,    setShowCtrl]    = useState(true)
  const [isFullscreen,setIsFullscreen]= useState(false)
  const [ready,       setReady]       = useState(false)
  const [error,       setError]       = useState(false)
  const [showSettings,setShowSettings]= useState(false)

  // Use quality/speed from user settings
  const [quality, setQuality] = useState(settings.defaultQuality)
  const [speed,   setSpeed]   = useState(settings.playbackSpeed)

  // Sync quality to internal YT player when it changes
  useEffect(() => {
    const yt = playerRef.current?.getInternalPlayer?.()
    if (yt?.setPlaybackQuality) yt.setPlaybackQuality(quality)
  }, [quality])

  // Persist speed preference
  function handleSetSpeed(s) { setSpeed(s); update('playbackSpeed', s) }
  function handleSetQuality(q) { setQuality(q); update('defaultQuality', q) }

  // Set quality after player is ready
  function handleReady() {
    setReady(true)
    const yt = playerRef.current?.getInternalPlayer?.()
    if (yt?.setPlaybackQuality) yt.setPlaybackQuality(quality)
  }

  // Fullscreen change listener
  useEffect(() => {
    const h = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener('fullscreenchange', h)
    return () => document.removeEventListener('fullscreenchange', h)
  }, [])

  const bumpCtrl = useCallback(() => {
    setShowCtrl(true)
    clearTimeout(hideTimer.current)
    hideTimer.current = setTimeout(() => { if (playing) setShowCtrl(false) }, 3200)
  }, [playing])

  function handleProgress(state) {
    if (!seeking) { setPlayed(state.played); setLoaded(state.loaded) }
    onProgress?.(state)
  }

  function handleSeekDown() { setSeeking(true) }
  function handleSeekChange(e) { setPlayed(parseFloat(e.target.value)) }
  function handleSeekUp(e) {
    setSeeking(false)
    playerRef.current?.seekTo(parseFloat(e.target.value))
  }

  function toggleFS() {
    if (!document.fullscreenElement) containerRef.current?.requestFullscreen()
    else document.exitFullscreen()
  }

  function togglePlay() { setPlaying(p => !p); bumpCtrl() }

  // Keyboard shortcuts
  useEffect(() => {
    function onKey(e) {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return
      if (e.code === 'Space')      { e.preventDefault(); togglePlay() }
      if (e.code === 'ArrowRight') { playerRef.current?.seekTo(played * duration + 10, 'seconds') }
      if (e.code === 'ArrowLeft')  { playerRef.current?.seekTo(played * duration - 10, 'seconds') }
      if (e.code === 'ArrowUp')    { setVolume(v => Math.min(1, v + 0.1)) }
      if (e.code === 'ArrowDown')  { setVolume(v => Math.max(0, v - 0.1)) }
      if (e.code === 'KeyM')       { setMuted(m => !m) }
      if (e.code === 'KeyF')       { toggleFS() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [played, duration])

  if (error) {
    return (
      <div className="aspect-video bg-ocean-950 rounded-2xl flex items-center justify-center shadow-deep">
        <div className="text-center p-8">
          <p className="font-display text-white/70 text-lg mb-4">Could not load video</p>
          <a href={`https://www.youtube.com/watch?v=${videoId}`} target="_blank" rel="noopener noreferrer"
             className="btn-outline border-white/20 text-white hover:bg-white/10">
            Watch on YouTube
          </a>
        </div>
      </div>
    )
  }

  const progressPct = played * 100

  return (
    <div
      ref={containerRef}
      className="relative bg-black rounded-2xl overflow-hidden shadow-deep group select-none"
      onMouseMove={bumpCtrl}
      onMouseLeave={() => { if (playing) { clearTimeout(hideTimer.current); setShowCtrl(false) } }}
      onClick={() => { if (showSettings) { setShowSettings(false); return } }}
    >
      {/* Reactive Player */}
      <div className="player-wrapper">
        <ReactPlayer
          ref={playerRef}
          url={`https://www.youtube.com/watch?v=${videoId}`}
          playing={playing}
          muted={muted}
          volume={volume}
          playbackRate={speed}
          width="100%"
          height="100%"
          onReady={handleReady}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => { setPlaying(false); onEnded?.() }}
          onProgress={handleProgress}
          onDuration={setDuration}
          onError={() => setError(true)}
          config={{
            youtube: {
              playerVars: {
                controls: 0, rel: 0, modestbranding: 1,
                disablekb: 1, iv_load_policy: 3,
              },
            },
          }}
        />
      </div>

      {/* Loading overlay */}
      {!ready && (
        <div className="absolute inset-0 flex items-center justify-center bg-ocean-950">
          <div className="w-10 h-10 rounded-full border-2 border-ocean-400/30 border-t-ocean-400 animate-spin" />
        </div>
      )}

      {/* Center play button when paused */}
      {!playing && ready && (
        <button onClick={togglePlay}
                className="absolute inset-0 flex items-center justify-center bg-black/25">
          <div className="w-20 h-20 rounded-full bg-ocean-500 flex items-center justify-center
                          shadow-glow-lg scale-90 hover:scale-100 transition-transform duration-200 animate-scale-in">
            <Play className="w-8 h-8 text-white ml-1" fill="white" strokeWidth={0} />
          </div>
        </button>
      )}

      {/* Controls bar */}
      <div className={clsx(
        'absolute inset-x-0 bottom-0 transition-all duration-300',
        showCtrl || !playing ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3 pointer-events-none'
      )}>
        {/* Gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent
                        rounded-b-2xl pointer-events-none" />

        <div className="relative z-10 px-4 pb-4 pt-10 space-y-2.5">
          {/* Title */}
          {title && <p className="text-white font-display text-sm font-semibold drop-shadow line-clamp-1">{title}</p>}

          {/* Progress / seek bar */}
          <div className="flex items-center gap-2.5">
            <span className="text-white/60 text-[11px] font-mono w-11 text-right flex-shrink-0">
              {fmtTime(played * duration)}
            </span>
            <div className="relative flex-1 h-1 group/seek cursor-pointer">
              {/* Loaded buffer */}
              <div className="absolute inset-y-0 left-0 rounded-full bg-white/20"
                   style={{ width: `${loaded * 100}%` }} />
              <input
                type="range" min={0} max={0.9999} step="any" value={played}
                onMouseDown={handleSeekDown}
                onChange={handleSeekChange}
                onMouseUp={handleSeekUp}
                className="absolute inset-0 w-full opacity-0 cursor-pointer z-10 h-full"
              />
              {/* Visual track */}
              <div className="absolute inset-0 rounded-full overflow-hidden bg-white/15">
                <div className="h-full rounded-full bg-ocean-400 transition-none"
                     style={{ width: `${progressPct}%` }} />
              </div>
              {/* Thumb */}
              <div className="absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full bg-white
                              shadow-glow opacity-0 group-hover/seek:opacity-100 transition-opacity pointer-events-none"
                   style={{ left: `calc(${progressPct}% - 7px)` }} />
            </div>
            <span className="text-white/60 text-[11px] font-mono w-11 flex-shrink-0">
              {fmtTime(duration)}
            </span>
          </div>

          {/* Controls row */}
          <div className="flex items-center gap-2">
            {/* Play/Pause */}
            <button onClick={togglePlay}
                    className="text-white hover:text-ocean-300 transition-colors p-1.5 rounded-lg hover:bg-white/8">
              {playing
                ? <Pause  className="w-5 h-5" fill="currentColor" strokeWidth={0} />
                : <Play   className="w-5 h-5" fill="currentColor" strokeWidth={0} />
              }
            </button>

            {/* Volume */}
            <div className="flex items-center gap-1.5">
              <button onClick={() => setMuted(m => !m)}
                      className="text-white/75 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/8">
                {muted || volume === 0
                  ? <VolumeX className="w-4.5 h-4.5" />
                  : <Volume2 className="w-4.5 h-4.5" />
                }
              </button>
              <input
                type="range" min={0} max={1} step={0.02}
                value={muted ? 0 : volume}
                onChange={e => { setVolume(parseFloat(e.target.value)); if (parseFloat(e.target.value) > 0) setMuted(false) }}
                className="w-18 h-1 rounded-full cursor-pointer accent-ocean-400"
                style={{
                  background: `linear-gradient(to right, #00b4d8 0%, #00b4d8 ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) ${(muted ? 0 : volume) * 100}%, rgba(255,255,255,0.2) 100%)`
                }}
              />
            </div>

            {/* Current quality badge */}
            <span className="text-[10px] font-mono text-white/35 px-1.5">
              {QUALITIES.find(q => q.value === quality)?.label}
            </span>

            {/* Spacer */}
            <div className="flex-1" />

            {/* Settings */}
            <div className="relative">
              <button
                onClick={e => { e.stopPropagation(); setShowSettings(s => !s) }}
                className={clsx(
                  'p-1.5 rounded-lg transition-all',
                  showSettings ? 'bg-white/15 text-white' : 'text-white/65 hover:text-white hover:bg-white/8'
                )}>
                <SettingsIcon className={clsx('w-4.5 h-4.5 transition-transform duration-300', showSettings && 'rotate-45')} />
              </button>
              {showSettings && (
                <SettingsPanel
                  quality={quality}      setQuality={handleSetQuality}
                  speed={speed}          setSpeed={handleSetSpeed}
                  onClose={() => setShowSettings(false)}
                />
              )}
            </div>

            {/* Fullscreen */}
            <button onClick={toggleFS}
                    className="text-white/65 hover:text-white transition-colors p-1.5 rounded-lg hover:bg-white/8">
              {isFullscreen
                ? <Minimize2 className="w-4.5 h-4.5" />
                : <Maximize  className="w-4.5 h-4.5" />
              }
            </button>
          </div>
        </div>
      </div>

      {/* Keyboard hint (shows briefly on load) */}
      {ready && !playing && (
        <div className="absolute top-3 right-3 text-[10px] text-white/20 font-mono">
          Space · ← → seek · M mute · F fullscreen
        </div>
      )}
    </div>
  )
}
