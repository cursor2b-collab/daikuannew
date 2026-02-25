import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    // 从系统设置获取收款方式
    const { data: settings, error } = await supabase
      .from('system_settings')
      .select('setting_value')
      .eq('setting_key', 'payment_methods')
      .single()

    if (error && error.code !== 'PGRST116') {
      throw error
    }

    const paymentMethods = settings?.setting_value || []

    return NextResponse.json({
      code: 200,
      msg: '获取成功',
      data: paymentMethods
    })
  } catch (error: any) {
    console.error('Get payment methods error:', error)
    return NextResponse.json(
      { code: 500, msg: error.message || '获取收款方式失败' },
      { status: 500 }
    )
  }
}
