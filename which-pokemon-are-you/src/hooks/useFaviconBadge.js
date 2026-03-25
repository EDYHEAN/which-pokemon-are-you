import { useEffect, useRef, useCallback } from 'react'

const ORIGINAL_FAVICON = '/favicon.svg'

export function drawFaviconWithBadge(showBadge) {
  const canvas = document.createElement('canvas')
  canvas.width = 64
  canvas.height = 64
  const ctx = canvas.getContext('2d')
  const img = new Image()
  img.src = ORIGINAL_FAVICON
  img.onload = () => {
    ctx.drawImage(img, 0, 0, 64, 64)
    if (showBadge) {
      ctx.beginPath()
      ctx.arc(52, 12, 10, 0, 2 * Math.PI)
      ctx.fillStyle = '#FF3B30'
      ctx.fill()
      ctx.strokeStyle = 'white'
      ctx.lineWidth = 2
      ctx.stroke()
    }
    const link = document.querySelector("link[rel='icon']")
    if (link) link.href = canvas.toDataURL()
  }
}

export function useFaviconBadge(stats) {
  const statsRef = useRef(stats)
  statsRef.current = stats

  const checkStats = useCallback(() => {
    const s = statsRef.current
    if (!s) return
    const needsAttention = s.hunger <= 30 || s.thirst <= 30 || s.entertainment <= 30 || s.toilet <= 30
    drawFaviconWithBadge(needsAttention)
  }, [])

  useEffect(() => {
    checkStats()
    const interval = setInterval(checkStats, 60 * 1000)

    // Reset to stats-based badge when user returns to tab (clears wild spawn badge)
    const onVisible = () => { if (!document.hidden) checkStats() }
    document.addEventListener('visibilitychange', onVisible)

    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
      const link = document.querySelector("link[rel='icon']")
      if (link) link.href = ORIGINAL_FAVICON
    }
  }, [checkStats])

  return checkStats
}
