import { useState, useEffect, useCallback } from 'react'
import * as cloudflare from '@/services/cloudflare'
import * as storage from '@/services/storage'

const pendingPromises = new Map()
const memoryCache = new Map()
const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

async function getPageData(slug) {
  const cached = memoryCache.get(slug)
  const now = Date.now()
  if (cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data
  }

  if (pendingPromises.has(slug)) {
    return pendingPromises.get(slug)
  }

  const promise = (async () => {
    try {
      if (!cloudflare.isConfigured) return null
      const data = await cloudflare.fetchPageContent(slug)
      if (data) {
        memoryCache.set(slug, { data, timestamp: Date.now() })
        storage.set(`page_content_${slug}`, data)
      }
      return data
    } finally {
      pendingPromises.delete(slug)
    }
  })()

  pendingPromises.set(slug, promise)
  return promise
}

export function useEditablePage(slug, defaultContent) {
  const [content, setContent] = useState(() => {
    const memory = memoryCache.get(slug)
    if (memory?.data) return memory.data
    return storage.get(`page_content_${slug}`, defaultContent)
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function loadPage() {
      try {
        const cloudData = await getPageData(slug)
        if (active && cloudData) {
          setContent(cloudData)
        }
      } catch (e) {
        console.warn(`Failed to fetch page content for ${slug}:`, e)
      } finally {
        if (active) setLoading(false)
      }
    }
    loadPage()

    const handleUpdate = (e) => {
      if (e.detail?.page === slug && e.detail?.full) {
        setContent(e.detail.full)
        memoryCache.set(slug, { data: e.detail.full, timestamp: Date.now() })
      }
    }
    window.addEventListener('page-content-updated', handleUpdate)

    return () => {
      active = false
      window.removeEventListener('page-content-updated', handleUpdate)
    }
  }, [slug])

  const updatePage = useCallback(async (newContent) => {
    setContent(newContent)
    memoryCache.set(slug, { data: newContent, timestamp: Date.now() })
    storage.set(`page_content_${slug}`, newContent)
    if (cloudflare.isConfigured) {
      try {
        await cloudflare.upsertPageContent(slug, newContent)
      } catch (e) {
        console.warn(`Failed to upsert page content for ${slug}:`, e)
      }
    }
  }, [slug])

  return { content, updatePage, loading }
}
