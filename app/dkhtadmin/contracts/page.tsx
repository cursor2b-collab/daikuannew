'use client'
import { useEffect, useState } from 'react'

interface Contract {
  id: number
  name?: string
  phone?: string
  loan_number?: string
  amount?: number
  overdue_days?: number
  loan_date?: string
  is_settled?: boolean
  payment_method?: any
}

const btnStyle = (color = '#667eea', disabled = false): React.CSSProperties => ({
  padding: '7px 16px', background: disabled ? '#333' : color, color: '#fff',
  border: 'none', borderRadius: 4, cursor: disabled ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 600,
})

const S = {
  th: { padding: '11px 14px', textAlign: 'left' as const, color: '#999', fontSize: 13, borderBottom: '1px solid #333', whiteSpace: 'nowrap' as const },
  td: { padding: '11px 14px', color: '#ddd', fontSize: 13, borderBottom: '1px solid #2a2a2a', verticalAlign: 'top' as const },
}

export default function ContractsPage() {
  const [list, setList] = useState<Contract[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const LIMIT = 20

  const load = async () => {
    setLoading(true)
    try {
      const p = new URLSearchParams({ page: String(page), limit: String(LIMIT) })
      if (search) p.append('search', search)
      if (statusFilter !== '') p.append('is_settled', statusFilter)
      const r = await fetch(`/api/admin/users?${p}`)
      const d = await r.json()
      if (d.code === 200) { setList(d.data.list || []); setTotal(d.data.total || 0) }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [page, statusFilter])

  const handleSearch = (e: React.FormEvent) => { e.preventDefault(); setPage(1); load() }
  const totalPages = Math.ceil(total / LIMIT)

  return (
    <div style={{ fontFamily: 'PingFang SC, -apple-system, sans-serif' }}>
      <div style={{ background: '#2d2d2d', borderRadius: 8, padding: '16px 20px', marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>合同管理</h2>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: 8 }}>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="搜索合同号、姓名、手机号..."
              style={{ padding: '7px 12px', background: '#1a1a1a', border: '1px solid #404040', borderRadius: 4, color: '#fff', fontSize: 13, width: 220 }} />
            <button type="submit" style={btnStyle()}>搜索</button>
          </form>
          <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1) }}
            style={{ padding: '7px 12px', background: '#1a1a1a', border: '1px solid #404040', borderRadius: 4, color: '#fff', fontSize: 13 }}>
            <option value="">全部状态</option>
            <option value="false">生效中</option>
            <option value="true">已结清</option>
          </select>
        </div>
      </div>

      <div style={{ background: '#2d2d2d', borderRadius: 8, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>加载中...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead style={{ background: '#1e1e1e' }}>
              <tr>
                {['合同编号', '客户', '借款金额', '逾期天数', '签订日期', '状态', '操作'].map(h => (
                  <th key={h} style={S.th}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {list.length === 0 ? (
                <tr><td colSpan={7} style={{ ...S.td, textAlign: 'center', color: '#666', padding: 40 }}>暂无合同数据</td></tr>
              ) : list.map(u => (
                <tr key={u.id} style={{ transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#333')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={S.td}><span style={{ fontSize: 12, color: '#aaa' }}>{u.loan_number || `HT${String(u.id).padStart(15, '0')}`}</span></td>
                  <td style={S.td}>
                    <div style={{ fontWeight: 600, color: '#fff' }}>{u.name || '-'}</div>
                    <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>{u.phone || '-'}</div>
                  </td>
                  <td style={S.td}><span style={{ color: '#f59e0b', fontWeight: 600 }}>{u.amount ? `¥${Number(u.amount).toLocaleString()}` : '-'}</span></td>
                  <td style={S.td}>{u.overdue_days != null ? `${u.overdue_days} 天` : '-'}</td>
                  <td style={S.td}>{u.loan_date ? new Date(u.loan_date).toLocaleDateString('zh-CN') : '-'}</td>
                  <td style={S.td}>
                    <span style={{ padding: '3px 12px', borderRadius: 12, fontSize: 12, fontWeight: 600, background: u.is_settled ? 'rgba(34,197,94,0.15)' : 'rgba(245,158,11,0.15)', color: u.is_settled ? '#22c55e' : '#f59e0b' }}>
                      {u.is_settled ? '已结清' : '生效中'}
                    </span>
                  </td>
                  <td style={S.td}>
                    <button onClick={() => window.open(`/contract?user_id=${u.id}`, '_blank')}
                      style={{ padding: '4px 10px', background: 'transparent', border: '1px solid #555', borderRadius: 4, color: '#aaa', fontSize: 12, cursor: 'pointer' }}>
                      查看合同
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {total > LIMIT && (
          <div style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #333' }}>
            <span style={{ color: '#999', fontSize: 13 }}>共 {total} 条</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={btnStyle('#404040', page === 1)}>上一页</button>
              <span style={{ color: '#999', fontSize: 13, lineHeight: '32px' }}>{page} / {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={btnStyle('#404040', page >= totalPages)}>下一页</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
