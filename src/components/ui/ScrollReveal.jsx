import { useScrollReveal } from '@/hooks/useScrollReveal'
import clsx from 'clsx'

/**
 * Wraps children in a scroll-triggered reveal animation.
 *
 * variant: 'up' | 'left' | 'scale'
 * delay:   CSS transition-delay string, e.g. '0.2s'
 * as:      HTML tag to render, default 'div'
 */
export default function ScrollReveal({
  children,
  variant  = 'up',
  delay    = '0s',
  as: Tag  = 'div',
  className = '',
  threshold = 0.12,
  ...props
}) {
  const [ref, inView] = useScrollReveal(threshold)

  const variantClass = {
    up:    'reveal',
    left:  'reveal-left',
    scale: 'reveal-scale',
  }[variant] ?? 'reveal'

  return (
    <Tag
      ref={ref}
      style={{ transitionDelay: delay }}
      className={clsx(variantClass, inView && 'in-view', className)}
      {...props}
    >
      {children}
    </Tag>
  )
}
