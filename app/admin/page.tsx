'use client'
import { useEffect, useState } from 'react'

const S = {
  card: { background: '#2d2d2d', borderRadius: 8, padding: '24px 28px', border: '1px solid #404040' } as React.CSSProperties,
  label: { fontSize: 13, color: '#999', marginBottom: 8 } as React.CSSProperties,
  value: { fontSize: 32, fontWeight: 700, color: '#fff' } as React.CSSProperties,
  section: { marginBottom: 24 } as React.CSSProperties,
  th: { padding: '10px 14px', textAlign: 'left' as const, color: '#999', fontSize: 13, borderBottom: '1px solid #333' },
  td: { padding: '10px 14px', color: '#ddd', fontSize: 13, borderBottom: '1px solid #2a2a2a' },
}

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/dashboard')
      .then(r => r.json())
      .then(d => { if (d.code === 200) setStats(d.data) })
      .finally(() => setLoading(false))
  }, [])

  const statCards = stats ? [
    { label: '客户总数', value: stats.totalUsers, color: '#667eea' },
    { label: '已结清', value: stats.settledUsers, color: '#22c55e' },
    { label: '逾期客户', value: stats.overdueUsers, color: '#ef4444' },
    { label: '待审核凭证', value: stats.pendingVouchers, color: '#f59e0b' },
    { label: '有效验证码', value: stats.activeCodes, color: '#06b6d4' },
  ] : []

  return (
    <div style={{ fontFamily: 'PingFang SC, -apple-system, sans-serif' }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ color: '#fff', fontSize: 18, fontWeight: 700, margin: 0 }}>仪表盘</h2>
        <p style={{ color: '#999', fontSize: 13, margin: '6px 0 0' }}>系统数据概览</p>
      </div>

      {loading ? (
        <div style={{ color: '#999', textAlign: 'center', padding: 60 }}>加载中...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 16, marginBottom: 28 }}>
            {statCards.map(c => (
              <div key={c.label} style={S.card}>
                <div style={S.label}>{c.label}</div>
                <div style={{ ...S.value, color: c.color }}>{c.value}</div>
              </div>
            ))}
          </div>

          <div style={S.card}>
            <div style={{ fontWeight: 700, color: '#fff', fontSize: 15, marginBottom: 16 }}>最近新增客户</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['姓名', '手机号', '借款金额', '逾期天数', '状态', '创建时间'].map(h => (
                    <th key={h} style={S.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(stats?.recentUsers || []).length === 0 ? (
                  <tr><td colSpan={6} style={{ ...S.td, textAlign: 'center', color: '#666', padding: 30 }}>暂无数据</td></tr>
                ) : (stats?.recentUsers || []).map((u: any) => (
                  <tr key={u.id}>
                    <td style={S.td}>{u.name || '-'}</td>
                    <td style={S.td}>{u.phone || '-'}</td>
                    <td style={S.td}>{u.amount ? `¥${Number(u.amount).toLocaleString()}` : '-'}</td>
                    <td style={S.td}>{u.overdue_days ?? 0} 天</td>
                    <td style={S.td}>
                      <span style={{ padding: '2px 10px', borderRadius: 12, fontSize: 12, background: u.is_settled ? '#16532020' : '#16532080', color: u.is_settled ? '#22c55e' : '#f59e0b' }}>
                        {u.is_settled ? '已结清' : '生效中'}
                      </span>
                    </td>
                    <td style={S.td}>{u.created_at ? new Date(u.created_at).toLocaleDateString('zh-CN') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
