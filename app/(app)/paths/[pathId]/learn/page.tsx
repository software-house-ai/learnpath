import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export default async function LearnRedirectPage({ params }: { params: { pathId: string } | Promise<{ pathId: string }> }) {
  const resolvedParams = await Promise.resolve(params);
  const pathId = resolvedParams.pathId;
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Find the next active modules
  const { data: activeModules } = await supabase
    .from('path_modules')
    .select('id, status')
    .eq('path_id', pathId)
    .in('status', ['available', 'in_progress'])
    .order('module_order', { ascending: true })

  if (!activeModules || activeModules.length === 0) {
    redirect('/dashboard')
  }

  let targetModuleId = null
  let nextContentId = null

  for (const mod of activeModules) {
    const { data: assignments } = await supabase
        .from('path_content_assignments')
        .select('content_item_id, order_in_module')
        .eq('path_module_id', mod.id)
        .order('order_in_module', { ascending: true })

    if (!assignments || assignments.length === 0) {
        continue
    }

    const itemIds = assignments.map(a => a.content_item_id)
    const { data: progress } = await supabase
        .from('user_progress')
        .select('content_item_id, status')
        .eq('user_id', user.id)
        .in('content_item_id', itemIds)

    const completedSet = new Set(progress?.filter(p => p.status === 'completed').map(p => p.content_item_id) || [])
    
    let candidate = null
    for (const a of assignments) {
        if (!completedSet.has(a.content_item_id)) {
            candidate = a.content_item_id
            break
        }
    }

    // If all completed but module still active, point to last item for checkpoint
    if (!candidate && assignments.length > 0) {
      candidate = assignments[assignments.length - 1].content_item_id
    }

    if (candidate) {
      targetModuleId = mod.id
      nextContentId = candidate
      break
    }
  }

  if (!targetModuleId || !nextContentId) {
    redirect('/dashboard')
  }

  redirect(`/paths/${pathId}/learn/${targetModuleId}/${nextContentId}`)
}