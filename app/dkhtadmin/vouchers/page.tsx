'use client'
import { useEffect, useState } from 'react'

interface UserWithVouchers {
  id: number
  name?: string
  phone?: string
  amount?: number
  is_settled?: boolean
  voucher_images?: string[]
  created_at?: string
}

export default function VouchersPage() {
  const [list, setList] = useState<UserWithVouchers[]>([])
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const LIMIT = 20

  const load = async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(LIMIT), has_voucher: '1' })
      const r = await fetch(`/api/admin/users?${p}`)
      const d = await r.json()
      if (d.code === 200) {
        const withVouchers = (d.data.list || []).filter((u: UserWithVouchers) =>
          Array.isArray(u.voucher_images) && u.voucher_images.length > 0
        )
        setList(withVouchers)
        setTotal(d.data.total || 0)
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page])
  const totalPages = Math.ceil(total / LIMIT)

  const S = {
    th: { padding: '11px 14px', textAlign: 'left' as const, color: '#999', fontSize: 13, borderBottom: '1px solid #333' },
    td: { padding: '11px 14px', color: '#ddd', fontSize: 13, borderBottom: '1px solid #2a2a2a', verticalAlign: 'top' as const },
  }

  return (
    <div style={{ fontFamily: 'PingFang SC, -apple-system, sans-serif' }}>
      <div style={{ background: '#2d2d2d', borderRadius: 8, padding: '16px 20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>付款凭证</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#999' }}>查看用户上传的还款凭证图片</p>
        </div>
        <button onClick={load} style={{ padding: '7px 16px', background: '#404040', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13 }}>刷新</button>
      </div>

      <div style={{ background: '#2d2d2d', borderRadius: 8, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>加载中...</div>
        ) : list.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#666' }}>暂无用户上传凭证</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#1e1e1e' }}>
              <tr>
                {['客户', '手机号', '借款金额', '状态', '凭证图片', '张数'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.map(u => (
                <tr key={u.id} onMouseEnter={e => (e.currentTarget.style.background = '#333')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={S.td}><span style={{ fontWeight: 600, color: '#fff' }}>{u.name || '-'}</span></td>
                  <td style={S.td}>{u.phone || '-'}</td>
                  <td style={S.td}>{u.amount ? `¥${Number(u.amount).toLocaleString()}` : '-'}</td>
                  <td style={S.td}>
                    <span style={{ padding: '3px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: u.is_settled ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: u.is_settled ? '#22c55e' : '#f59e0b' }}>
                      {u.is_settled ? '已结清' : '生效中'}
                    </span>
                  </td>
                  <td style={{ ...S.td }}>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {(u.voucher_images || []).map((img, i) => (
                        <img key={i} src={img} alt={`凭证${i + 1}`}
                          onClick={() => setPreview(img)}
                          style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, border: '1px solid #404040', cursor: 'pointer' }}
                          onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
                        />
                      ))}
                    </div>
                  </td>
                  <td style={S.td}>{(u.voucher_images || []).length} 张</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {total > LIMIT && (
          <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #333' }}>
            <span style={{ color: '#999', fontSize: 13 }}>共 {total} 条</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ padding: '7px 14px', background: '#404040', color: '#fff', border: 'none', borderRadius: 4, cursor: page === 1 ? 'not-allowed' : 'pointer', fontSize: 13 }}>上一页</button>
              <span style={{ color: '#999', fontSize: 13, lineHeight: '32px' }}>{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ padding: '7px 14px', background: '#404040', color: '#fff', border: 'none', borderRadius: 4, cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontSize: 13 }}>下一页</button>
            </div>
          </div>
        )}
      </div>

      {/* 图片预览弹窗 */}
      {preview && (
        <div onClick={() => setPreview(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'zoom-out' }}>
          <img src={preview} alt="凭证预览" style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, boxShadow: '0 8px 40px rgba(0,0,0,0.5)' }} />
          <button onClick={() => setPreview(null)} style={{ position: 'fixed', top: 20, right: 24, background: 'rgba(255,255,255,0.2)', color: '#fff', border: 'none', borderRadius: '50%', width: 36, height: 36, fontSize: 20, cursor: 'pointer' }}>×</button>
        </div>
      )}
    </div>
  )
}
