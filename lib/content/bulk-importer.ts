import { SupabaseClient } from '@supabase/supabase-js'
import { ContentType, DifficultyLevel } from '@/types/api'

export interface RawContentItem {
  title: string
  url: string
  skill_id?: string
  skill_slug?: string // alternative to skill_id — seed files use this
  content_type: string
  difficulty_level: string
  description?: string
  embed_url?: string
  provider?: string
  author_name?: string
  language?: string
  duration_minutes?: number
  is_free?: boolean
  tags?: string[]
  thumbnail_url?: string
}

export interface ImportReport {
  imported: number
  skipped: number
  failed: number
  errors: string[]
}

const VALID_CONTENT_TYPES: ContentType[] = ['video', 'article', 'documentation', 'course', 'exercise', 'project']
const VALID_DIFFICULTY_LEVELS: DifficultyLevel[] = ['beginner', 'intermediate', 'advanced']

function isValidUrl(url: string): boolean {
  try { new URL(url); return true } catch { return false }
}

export async function bulkImportContent(
  items: RawContentItem[],
  supabase: SupabaseClient,
  skillMap?: Record<string, string> // slug → id map, used by seed script
): Promise<ImportReport> {
  const report: ImportReport = { imported: 0, skipped: 0, failed: 0, errors: [] }

  // Fetch all existing URLs to detect duplicates
  const { data: existingItems } = await supabase
    .from('content_items')
    .select('url')
  const existingUrls = new Set((existingItems || []).map((item: { url: string }) => item.url))

  const validItems: Record<string, unknown>[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    const rowLabel = `Row ${i + 1} ("${item.title || 'untitled'}")`

    // Validation
    if (!item.title || !item.title.trim()) {
      report.failed++; report.errors.push(`${rowLabel}: title is required`); continue
    }
    if (!item.url || !isValidUrl(item.url)) {
      report.failed++; report.errors.push(`${rowLabel}: valid url is required`); continue
    }
    if (!VALID_CONTENT_TYPES.includes(item.content_type as ContentType)) {
      report.failed++; report.errors.push(`${rowLabel}: invalid content_type "${item.content_type}"`); continue
    }
    if (!VALID_DIFFICULTY_LEVELS.includes(item.difficulty_level as DifficultyLevel)) {
      report.failed++; report.errors.push(`${rowLabel}: invalid difficulty_level "${item.difficulty_level}"`); continue
    }

    // Resolve skill_id
    let skill_id = item.skill_id
    if (!skill_id && item.skill_slug && skillMap) {
      skill_id = skillMap[item.skill_slug]
    }
    if (!skill_id) {
      report.failed++; report.errors.push(`${rowLabel}: skill_id or valid skill_slug is required`); continue
    }

    // Duplicate check
    if (existingUrls.has(item.url)) {
      report.skipped++; continue
    }

    existingUrls.add(item.url) // prevent duplicates within same batch
    validItems.push({
      title: item.title.trim(),
      url: item.url,
      skill_id,
      content_type: item.content_type,
      difficulty_level: item.difficulty_level,
      description: item.description || null,
      embed_url: item.embed_url || null,
      provider: item.provider || null,
      author_name: item.author_name || null,
      language: item.language || 'en',
      duration_minutes: item.duration_minutes || null,
      is_free: item.is_free !== false,
      is_active: true,
      needs_review: false,
      tags: item.tags || [],
      thumbnail_url: item.thumbnail_url || null,
      last_verified_at: new Date().toISOString(),
    })
  }

  // Batch insert valid items
  if (validItems.length > 0) {
    const { error } = await supabase.from('content_items').insert(validItems)
    if (error) {
      report.failed += validItems.length
      report.errors.push(`Batch insert failed: ${error.message}`)
    } else {
      report.imported = validItems.length
    }
  }

  return report
}
