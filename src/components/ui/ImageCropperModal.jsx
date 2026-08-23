import { useState, useRef, useEffect } from 'react'
import { ZoomIn, ZoomOut, RotateCw, Check, X, Move } from 'lucide-react'

export default function ImageCropperModal({ imageSrc, onClose, onCropComplete }) {
  const canvasRef = useRef(null)
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0) // 0, 90, 180, 270
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [imageObj, setImageObj] = useState(null)

  // Load image object
  useEffect(() => {
    if (!imageSrc) return
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      setImageObj(img)
      setPan({ x: 0, y: 0 })
      setZoom(1)
      setRotation(0)
    }
    img.src = imageSrc
  }, [imageSrc])

  // Draw preview on canvas
  useEffect(() => {
    if (!imageObj || !canvasRef.current) return
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const size = 320 // 320x320 crop box
    canvas.width = size
    canvas.height = size

    // Clear canvas
    ctx.clearRect(0, 0, size, size)

    ctx.save()
    // Move origin to center of crop box
    ctx.translate(size / 2 + pan.x, size / 2 + pan.y)
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(zoom, zoom)

    // Calculate aspect scale to cover 320x320
    const scale = Math.max(size / imageObj.width, size / imageObj.height)
    const drawW = imageObj.width * scale
    const drawH = imageObj.height * scale

    ctx.drawImage(imageObj, -drawW / 2, -drawH / 2, drawW, drawH)
    ctx.restore()
  }, [imageObj, zoom, rotation, pan])

  // Drag handlers
  const handleMouseDown = (e) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    })
  }

  const handleMouseUp = () => setIsDragging(false)

  // Crop & Export Blob
  const handleCrop = () => {
    if (!imageObj || !canvasRef.current) return
    const size = 300
    const cropCanvas = document.createElement('canvas')
    cropCanvas.width = size
    cropCanvas.height = size
    const ctx = cropCanvas.getContext('2d')

    // Draw high quality circular crop
    ctx.save()
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
    ctx.clip()

    ctx.translate(size / 2 + (pan.x * (size / 320)), size / 2 + (pan.y * (size / 320)))
    ctx.rotate((rotation * Math.PI) / 180)
    ctx.scale(zoom, zoom)

    const scale = Math.max(size / imageObj.width, size / imageObj.height)
    const drawW = imageObj.width * scale
    const drawH = imageObj.height * scale

    ctx.drawImage(imageObj, -drawW / 2, -drawH / 2, drawW, drawH)
    ctx.restore()

    cropCanvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob)
      }
    }, 'image/png', 0.95)
  }

  if (!imageSrc) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ocean-950/80 backdrop-blur-md animate-fade-in">
      <div className="bg-ocean-900 border border-ocean-700/60 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5 text-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <h3 className="font-display font-bold text-lg text-white flex items-center gap-2">
            <Move className="w-5 h-5 text-cyan-400" /> Crop Profile Photo
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Crop Viewport */}
        <div
          className="relative w-[320px] h-[320px] mx-auto rounded-2xl overflow-hidden bg-black/60 border border-cyan-500/30 cursor-grab active:cursor-grabbing shadow-inner flex items-center justify-center select-none"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <canvas ref={canvasRef} className="pointer-events-none" />

          {/* Circular Mask Overlay */}
          <div className="absolute inset-0 border-[35px] border-ocean-950/70 rounded-full pointer-events-none border-solid shadow-[inset_0_0_20px_rgba(0,0,0,0.8)]" />
          <div className="absolute inset-0 border border-cyan-400/50 rounded-full pointer-events-none" />
        </div>

        {/* Controls (Zoom & Rotate) */}
        <div className="space-y-4 pt-2">
          {/* Zoom Slider */}
          <div className="flex items-center gap-3">
            <ZoomOut className="w-4 h-4 text-white/60" />
            <input
              type="range"
              min="1"
              max="3"
              step="0.05"
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              className="flex-1 accent-cyan-400 cursor-pointer"
            />
            <ZoomIn className="w-4 h-4 text-white/60" />
            <span className="text-xs font-mono text-cyan-300 w-10 text-right">{Math.round(zoom * 100)}%</span>
          </div>

          {/* Rotate Button */}
          <div className="flex justify-center">
            <button
              type="button"
              onClick={() => setRotation((r) => (r + 90) % 360)}
              className="btn-outline-dark text-xs py-1.5 px-4 gap-2 rounded-xl flex items-center"
            >
              <RotateCw className="w-3.5 h-3.5 text-cyan-400" /> Rotate 90°
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-4 border-t border-white/10">
          <button
            type="button"
            onClick={onClose}
            className="btn-outline-dark flex-1 py-2.5 text-xs rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleCrop}
            className="btn-primary flex-1 py-2.5 text-xs rounded-xl gap-2 flex items-center justify-center font-bold"
          >
            <Check className="w-4 h-4" /> Crop & Upload
          </button>
        </div>
      </div>
    </div>
  )
}
