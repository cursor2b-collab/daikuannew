/**
 * 检查 system_settings 表中文案相关配置（用于排查管理后台编辑后用户端无变化）
 * 运行: node scripts/check-copy-settings.mjs
 * 需要项目根目录有 .env.local 或在环境变量中设置 NEXT_PUBLIC_SUPABASE_URL 和 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
 */
import { createClient } from '@supabase/supabase-js'
import { readFileSync, existsSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, '..')

function loadEnv() {
  const envPath = resolve(root, '.env.local')
  if (existsSync(envPath)) {
    const content = readFileSync(envPath, 'utf8')
    for (const line of content.split('\n')) {
      const m = line.match(/^\s*([^#=]+)=(.*)$/)
      if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '')
    }
  }
}

loadEnv()

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zjodvwgmwwgixwpyuvos.supabase.co'
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || 'sb_publishable_Fy16nfH8omr46sGvBzisEg_wq3UWtuc'

const supabase = createClient(url, key)

const COPY_KEYS = [
  'site_name',
  'copy_index_page_title',
  'copy_index_subtitle',
  'copy_hero_product_name',
  'copy_hero_quota_label',
  'copy_hero_amount',
  'copy_hero_rate',
  'copy_hero_tip',
  'copy_marquee_messages',
  'copy_product_title',
  'copy_rate_info',
  'copy_max_amount',
  'copy_payment_method',
  'copy_process_method',
  'copy_step1_text',
  'copy_step2_text',
  'copy_step3_text',
]

async function main() {
  console.log('=== 1. 查询 system_settings 表中文案相关键 ===\n')
  const { data: rows, error } = await supabase
    .from('system_settings')
    .select('setting_key, setting_value, updated_at')
    .in('setting_key', COPY_KEYS)
    .order('setting_key')

  if (error) {
    console.error('查询失败:', error.message)
    process.exit(1)
  }

  if (!rows || rows.length === 0) {
    console.log('未找到任何 copy_* 或 site_name 记录。')
    console.log('可能原因：管理后台「文案配置」从未保存过，或保存的是其他表/键。')
    console.log('请先在管理后台打开「文案配置」标签，修改任意一项并点击保存。\n')
  } else {
    console.log(`共 ${rows.length} 条记录:\n`)
    for (const r of rows) {
      const val = r.setting_value
      const preview = typeof val === 'string' && val.length > 60 ? val.slice(0, 60) + '...' : val
      console.log(`  ${r.setting_key}`)
      console.log(`    value: ${preview}`)
      console.log(`    updated_at: ${r.updated_at || '-'}`)
      console.log('')
    }
  }

  console.log('=== 2. 查询 system_settings 全表（前 30 条）确认键名是否一致 ===\n')
  const { data: allRows, error: err2 } = await supabase
    .from('system_settings')
    .select('setting_key, setting_value')
    .limit(30)
    .order('setting_key')
  if (err2) {
    console.error('全表查询失败:', err2.message)
  } else if (allRows?.length) {
    const keys = allRows.map((r) => r.setting_key)
    console.log('当前表中存在的 setting_key:', keys.join(', '))
    const copyInDb = keys.filter((k) => k.startsWith('copy_') || k === 'site_name')
    console.log('其中与首页文案相关的键:', copyInDb.length ? copyInDb.join(', ') : '无')
  }
}

main()
