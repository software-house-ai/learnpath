import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(
  request: NextRequest,
  props: { params: Promise<{ id: string; mid: string }> }
) {
  try {
    const params = await props.params;
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('path_content_assignments')
      .select(`
        content_item_id,
        order_in_module,
        content_items (
          id,
          title
        )
      `)
      .eq('path_module_id', params.mid)
      .order('order_in_module', { ascending: true })

    if (error) throw error

    const formattedData = data.map((item: { content_item_id: string; order_in_module: number; content_items: { title: string }[] | { title: string } | null }) => {
      const ci = item.content_items;
      const title = Array.isArray(ci) ? ci[0]?.title : ci?.title;
      return {
        id: item.content_item_id,
        title: title || "Unknown Title",
        order: item.order_in_module
      };
    });

    return NextResponse.json({ data: formattedData })
  } catch (error: Error | unknown) {
    console.error(error);
    return NextResponse.json(
      { error: { message: error instanceof Error ? error.message : "Internal error" } },
      { status: 500 }
    )
  }
}
