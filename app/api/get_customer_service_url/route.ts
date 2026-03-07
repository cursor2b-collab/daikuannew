import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const DEFAULT_CUSTOMER_SERVICE_URL = ''

export async function GET(request: NextRequest) {
  try {
    const { data } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'customer_service_url')
      .maybeSingle()
    const url = (data?.setting_value != null && String(data.setting_value).trim() !== '')
      ? String(data.setting_value).trim()
      : DEFAULT_CUSTOMER_SERVICE_URL
    return NextResponse.json(
      {
        code: 200,
        msg: '获取成功',
        data: { url }
      },
      { headers: { 'Cache-Control': 'no-store, no-cache, must-revalidate' } }
    )
  } catch (error: any) {
    console.error('Get customer service URL error:', error)
    return NextResponse.json(
      { code: 500, msg: error.message || '获取在线客服链接失败' },
      { status: 500 }
    )
  }
}
