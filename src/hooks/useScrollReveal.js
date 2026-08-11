import { useEffect, useRef, useState } from 'react'

/**
 * Shared singleton IntersectionObserver manager per (threshold, rootMargin) config.
 */
const observerCache = new Map()

function getSharedObserver(threshold = 0.12, rootMargin = '0px 0px -60px 0px') {
  const key = `${threshold}_${rootMargin}`
  if (!observerCache.has(key)) {
    const callbacks = new Map()
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const cb = callbacks.get(entry.target)
          if (cb) {
            cb(entry)
            observer.unobserve(entry.target)
            callbacks.delete(entry.target)
          }
        }
      })
    }, { threshold, rootMargin })

    observerCache.set(key, { observer, callbacks })
  }
  return observerCache.get(key)
}

function observeElement(el, callback, threshold = 0.12, rootMargin = '0px 0px -60px 0px') {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) {
    callback()
    return () => {}
  }

  const { observer, callbacks } = getSharedObserver(threshold, rootMargin)
  callbacks.set(el, callback)
  observer.observe(el)
  return () => {
    callbacks.delete(el)
    observer.unobserve(el)
  }
}

/**
 * Returns [ref, isInView].
 * When the element enters the viewport, isInView flips to true (stays true).
 */
export function useScrollReveal(threshold = 0.12, rootMargin = '0px 0px -60px 0px') {
  const ref = useRef(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el || inView) return

    const unobserve = observeElement(
      el,
      () => setInView(true),
      threshold,
      rootMargin
    )

    return unobserve
  }, [threshold, rootMargin, inView])

  return [ref, inView]
}

/**
 * Staggered reveals for a list.
 * Returns a callback-ref factory: getRef(i) gives each item its own ref.
 * Pass the returned `triggers` array to the component.
 */
export function useStaggerReveal(count, threshold = 0.1) {
  const refs = useRef([])
  const [visible, setVisible] = useState(new Array(count).fill(false))

  useEffect(() => {
    const unobserves = refs.current.map((el, i) => {
      if (!el || visible[i]) return null
      return observeElement(
        el,
        () => {
          setVisible((prev) => {
            const n = [...prev]
            n[i] = true
            return n
          })
        },
        threshold
      )
    })

    return () => {
      unobserves.forEach((unobs) => unobs?.())
    }
  }, [count, threshold, visible])

  const getRef = (i) => (el) => {
    refs.current[i] = el
  }
  return [getRef, visible]
}
