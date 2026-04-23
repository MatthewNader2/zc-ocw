import { useEffect, useRef, useState } from 'react'

/**
 * Returns [ref, isInView].
 * When the element enters the viewport, isInView flips to true (stays true).
 */
export function useScrollReveal(threshold = 0.12, rootMargin = '0px 0px -60px 0px') {
  const ref      = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el  = ref.current
    if (!el)  return
    if (inView) return   // already triggered — no need to observe anymore

    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setInView(true) },
      { threshold, rootMargin }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold, rootMargin, inView])

  return [ref, inView]
}

/**
 * Staggered reveals for a list.
 * Returns a callback-ref factory: getRef(i) gives each item its own ref.
 * Pass the returned `triggers` array to the component.
 */
export function useStaggerReveal(count, threshold = 0.1) {
  const refs   = useRef([])
  const [visible, setVisible] = useState(new Array(count).fill(false))

  useEffect(() => {
    const observers = refs.current.map((el, i) => {
      if (!el) return null
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setVisible(prev => { const n = [...prev]; n[i] = true; return n })
            obs.disconnect()
          }
        },
        { threshold }
      )
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [count, threshold])

  const getRef = (i) => (el) => { refs.current[i] = el }
  return [getRef, visible]
}
