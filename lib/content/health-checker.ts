export interface HealthCheckResult {
  url: string
  is_valid: boolean
  status_code: number | null
  checked_at: string
}

export async function checkUrl(url: string): Promise<HealthCheckResult> {
  const checked_at = new Date().toISOString()
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 10000) // 10s timeout
    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
      redirect: 'follow',
    })
    clearTimeout(timeout)
    return {
      url,
      is_valid: response.status >= 200 && response.status < 400,
      status_code: response.status,
      checked_at,
    }
  } catch {
    return { url, is_valid: false, status_code: null, checked_at }
  }
}

export async function checkUrls(urls: string[]): Promise<HealthCheckResult[]> {
  // Process in batches of 10 to avoid overwhelming the network
  const results: HealthCheckResult[] = []
  const batchSize = 10
  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize)
    const batchResults = await Promise.all(batch.map(checkUrl))
    results.push(...batchResults)
  }
  return results
}
