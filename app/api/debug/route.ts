import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if(!user) return NextResponse.json({error: 'no user'});

  const { data: modules } = await supabase.from('path_modules').select('*').eq('status', 'in_progress');
  const { data: available } = await supabase.from('path_modules').select('*').eq('status', 'available');
  const { data: completed } = await supabase.from('path_modules').select('*').eq('status', 'completed');
  
  return NextResponse.json({ inProgress: modules, available, completed });
}
