import { X } from 'lucide-react'
import clsx from 'clsx'
export default function TagBadge({ tag, onClick, removable, className }) {
  return (
    <span onClick={onClick} className={clsx(
      'inline-flex items-center gap-1 text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full cursor-default',
      'bg-ocean-50 text-ocean-600 border border-ocean-100 transition-all',
      onClick && 'cursor-pointer hover:bg-ocean-100',
      className
    )}>
      #{tag}
      {removable && <X className="w-2.5 h-2.5 opacity-60 hover:opacity-100" />}
    </span>
  )
}
