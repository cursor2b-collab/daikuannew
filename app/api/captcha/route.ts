import { NextResponse } from 'next/server'
import { createHmac, randomInt } from 'crypto'

export const dynamic = 'force-dynamic'

const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET || 'daikuan-captcha-secret-change-in-production'
const CAPTCHA_TTL_MS = 5 * 60 * 1000 // 5 分钟

function base64UrlEncode(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

function base64UrlDecode(str: string): Buffer {
  let b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = b64.length % 4
  if (pad) b64 += '='.repeat(4 - pad)
  return Buffer.from(b64, 'base64')
}

function sign(payload: string): string {
  return createHmac('sha256', CAPTCHA_SECRET).update(payload).digest('hex')
}

/** 生成 4 位数字图形验证码 SVG，带简单干扰 */
function createCaptchaSvg(code: string): string {
  const width = 120
  const height = 44
  const chars = code.split('')
  const fontSize = 28
  const colors = ['#333', '#555', '#1a1a1a', '#2d2d2d']
  const y = height / 2 + fontSize / 3

  let textPaths = ''
  chars.forEach((c, i) => {
    const x = 18 + i * 26 + randomInt(0, 6)
    const rotate = (randomInt(-15, 15) * Math.PI) / 180
    const color = colors[randomInt(0, colors.length)]
    textPaths += `<text x="${x}" y="${y}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="${color}" transform="rotate(${rotate} ${x} ${y})">${c}</text>`
  })

  // 干扰线
  const lines = Array.from({ length: 4 }, () => {
    const x1 = randomInt(0, width)
    const y1 = randomInt(0, height)
    const x2 = randomInt(0, width)
    const y2 = randomInt(0, height)
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ccc" stroke-width="1"/>`
  }).join('')

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="#f5f5f5"/>
  ${lines}
  ${textPaths}
</svg>`
}

export async function GET() {
  const code = Array.from({ length: 4 }, () => randomInt(0, 10)).join('')
  const exp = Date.now() + CAPTCHA_TTL_MS
  const payload = JSON.stringify({ code, exp })
  const payloadB64 = base64UrlEncode(Buffer.from(payload, 'utf8'))
  const sig = sign(payloadB64)
  const token = `${payloadB64}.${sig}`
  const svg = createCaptchaSvg(code)

  return NextResponse.json({
    token,
    svg
  }, {
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate'
    }
  })
}
