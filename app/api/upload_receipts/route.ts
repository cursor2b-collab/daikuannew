import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const phone = formData.get('phone') as string
    const files = formData.getAll('files[]') as File[]

    if (!phone) {
      return NextResponse.json(
        { code: 400, msg: '请先登录' },
        { status: 400 }
      )
    }

    if (!files || files.length === 0) {
      return NextResponse.json(
        { code: 400, msg: '请先选择图片' },
        { status: 400 }
      )
    }

    // TODO: 实际应该保存文件到服务器或云存储
    // 这里模拟上传成功，返回图片URL
    const urls = files.map((file, index) => {
      // 实际应该上传到服务器并返回真实URL
      return `/uploads/${phone}/${Date.now()}_${index}.jpg`
    })

    return NextResponse.json({
      code: 200,
      msg: '上传成功',
      urls
    })
  } catch (error) {
    return NextResponse.json(
      { code: 500, msg: '上传失败，请重试' },
      { status: 500 }
    )
  }
}

