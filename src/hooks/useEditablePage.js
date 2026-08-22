import { useState, useEffect, useCallback } from 'react'
import * as cloudflare from '@/services/cloudflare'
import * as storage from '@/services/storage'

export function useEditablePage(slug, defaultContent) {
  const [content, setContent] = useState(() => {
    return storage.get(`page_content_${slug}`, defaultContent)
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    async function loadPage() {
      try {
        if (cloudflare.isConfigured) {
          const cloudData = await cloudflare.fetchPageContent(slug)
          if (active && cloudData) {
            setContent(cloudData)
            storage.set(`page_content_${slug}`, cloudData)
          }
        }
      } catch (e) {
        console.warn(`Failed to fetch page content for ${slug}:`, e)
      } finally {
        if (active) setLoading(false)
      }
    }
    loadPage()
    return () => { active = false }
  }, [slug])

  const updatePage = useCallback(async (newContent) => {
    setContent(newContent)
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
