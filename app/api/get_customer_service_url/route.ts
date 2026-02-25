import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'customer_service_url')
      .maybeSingle()

    if (error) throw error

    const raw = settings?.setting_value
    let customerServiceUrl = typeof raw === 'string' && raw.trim() ? raw.trim() : 'https://kefu-seven.vercel.app/'
    if (!/^https?:\/\//i.test(customerServiceUrl)) {
      customerServiceUrl = 'https://' + customerServiceUrl.replace(/^\/*/, '')
    }

    return NextResponse.json(
      {
        code: 200,
        msg: '获取成功',
        data: { url: customerServiceUrl }
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
