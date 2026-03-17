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

  // Find the next active module
  const { data: nextModuleData } = await supabase
    .from('path_modules')
    .select('id, status')
    .eq('path_id', pathId)
    .in('status', ['available', 'in_progress'])
    .order('module_order', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (!nextModuleData) {
    redirect('/dashboard')
  }

  const { data: assignments } = await supabase
      .from('path_content_assignments')
      .select('content_item_id, order_in_module')
      .eq('path_module_id', nextModuleData.id)
      .order('order_in_module', { ascending: true })

  if (!assignments || assignments.length === 0) {
      redirect('/dashboard')
  }

  const itemIds = assignments.map(a => a.content_item_id)
  const { data: progress } = await supabase
      .from('user_progress')
      .select('content_item_id, status')
      .eq('user_id', user.id)
      .in('content_item_id', itemIds)

  const completedSet = new Set(progress?.filter(p => p.status === 'completed').map(p => p.content_item_id) || [])
  
  let nextContentId = assignments[0].content_item_id
  for (const a of assignments) {
      if (!completedSet.has(a.content_item_id)) {
          nextContentId = a.content_item_id
          break
      }
  }

  redirect(`/paths/${pathId}/learn/${nextModuleData.id}/${nextContentId}`)
}