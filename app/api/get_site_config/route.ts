import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'site_name')
      .maybeSingle()
    const siteName = data?.setting_value != null ? String(data.setting_value) : '分期付'
    return NextResponse.json({
      code: 200,
      data: { site_name: siteName }
    })
  } catch {
    return NextResponse.json({
      code: 200,
      data: { site_name: '分期付' }
    })
  }
}
