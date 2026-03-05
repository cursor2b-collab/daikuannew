import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const CUSTOMER_SERVICE_URL = 'https://sog.dot01qo.cfd/chat/index?channelId=9171266856de4769834c17513ba6cc09'

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(
      {
        code: 200,
        msg: '获取成功',
        data: { url: CUSTOMER_SERVICE_URL }
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
