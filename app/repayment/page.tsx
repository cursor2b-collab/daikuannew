'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import FooterNav from '@/components/FooterNav'
import { getCurrentUser } from '@/lib/api'

interface ScheduleItem {
  period: number
  principal: number
  interest: number
  total: number
  dueDate: string
  status: 'overdue' | 'current' | 'pending' | 'paid'
}

interface LoanData {
  user_id: number
  name: string
  phone: string
  id_number: string
  loan_number: string
  bank_card: string
  is_settled: boolean
  is_interest_free: boolean
  payment_method: any[]
  hasInstallment: boolean

  // 分期模式
  amount?: number
  loanAmount?: string
  annualRate?: number
  loanDate?: string
  repaymentMonths?: number
  monthlyPrincipal?: string
  monthlyInterest?: string
  monthlyTotal?: string
  totalInterest?: string
  overdueDays?: number
  dailyPenalty?: number
  totalPenalty?: string
  totalRepayment?: string
  schedule?: ScheduleItem[]

  // 非分期模式
  paidAmount?: string
  interestRate?: string
  cycle?: string
  dueDate?: string
  status?: string
  overdueAmount?: string
}

const statusLabels: Record<string, { text: string; color: string; bg: string }> = {
  overdue: { text: '逾期', color: '#ef4444', bg: '#fef2f2' },
  current: { text: '待还款', color: '#f59e0b', bg: '#fffbeb' },
  pending: { text: '未到期', color: '#6b7280', bg: '#f9fafb' },
  paid: { text: '已还清', color: '#10b981', bg: '#f0fdf4' },
}

function Row({ label, value, red, bold }: { label: string; value: string; red?: boolean; bold?: boolean }) {
  const color = red ? '#ef4444' : '#111'
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '9px 0', borderBottom: '1px solid #f0f0f0' }}>
      <span style={{ fontSize: 14, color: red ? '#ef4444' : '#555' }}>{label}</span>
      <span style={{ fontSize: 14, color, fontWeight: bold ? 700 : 500 }}>{value}</span>
    </div>
  )
}

export default function RepaymentPage() {
  const router = useRouter()
  const [loanData, setLoanData] = useState<LoanData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadUserData()
  }, [])

  const loadUserData = async () => {
    try {
      const userInfo = getCurrentUser()
      const userId = (userInfo as any)?.id ?? (userInfo as any)?.user_id
      if (!userInfo?.phone && !userId) {
        router.push('/login')
        return
      }
      const query = userId ? `userId=${userId}` : `phone=${encodeURIComponent(userInfo!.phone)}`
      const res = await fetch(`/api/get_user_data?${query}`, { cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
      const result = await res.json()
      if (result.code === 200 && result.data) {
        setLoanData(result.data)
      }
    } catch (e) {
      console.error('加载用户数据失败:', e)
    } finally {
      setLoading(false)
    }
  }

  const toContract = () => {
    if (!loanData) return
    const params = new URLSearchParams({
      userId: loanData.user_id?.toString() || '',
      name: loanData.name || '',
      phone: loanData.phone || '',
      idNumber: loanData.id_number || '',
      loanNumber: loanData.loan_number || '',
      bankCard: loanData.bank_card || '',
      amount: loanData.loanAmount || '0',
    })
    router.push(`/contract?${params}`)
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
        <div style={{ color: '#999', fontSize: 14 }}>加载中...</div>
      </div>
    )
  }

  if (!loanData) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
        <div style={{ color: '#999', fontSize: 14 }}>暂无贷款数据</div>
      </div>
    )
  }

  const isInstallment = loanData.hasInstallment

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5', maxWidth: 560, margin: '0 auto', paddingBottom: 80 }}>

      {/* 贷款信息卡片 */}
      <div style={{ background: '#fff', margin: '12px 12px 0', borderRadius: 10, padding: '16px 16px 0', boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
        {isInstallment ? (
          <>
            <Row label="借款金额" value={`¥ ${Number(loanData.loanAmount).toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`} />
            <Row label="年化利率" value={`${loanData.annualRate}%`} />
            <Row label="放款日期" value={loanData.loanDate || '-'} />
            <Row label="周期" value={`${loanData.repaymentMonths} 个月`} />
            <Row label="每月还款本金" value={`¥ ${loanData.monthlyPrincipal}`} bold />
            <Row label="每月还款利息" value={`¥ ${loanData.monthlyInterest}`} bold />
            <Row label="总利息" value={`¥ ${loanData.totalInterest}`} bold />
            {(loanData.overdueDays ?? 0) > 0 && (
              <>
                <Row label="逾期天数" value={`${loanData.overdueDays}天`} red />
                <Row
                  label="违约金"
                  value={`¥ ${loanData.dailyPenalty?.toFixed(2)}/天 总计 ¥ ${loanData.totalPenalty}`}
                  red
                />
              </>
            )}
            <Row label="总还款金额" value={`¥ ${loanData.totalRepayment}`} red bold />
          </>
        ) : (
          <>
            <Row label="借款金额" value={`¥ ${loanData.loanAmount}`} />
            <Row label="已还金额" value={`¥ ${loanData.paidAmount}`} />
            <Row label="年化利率" value={loanData.interestRate || '-'} />
            <Row label="放款时间" value={loanData.loanDate || '-'} />
            <Row label="周期" value={loanData.cycle || '-'} />
            <Row label="到期日期" value={loanData.dueDate || '-'} />
            <Row label="总利息" value={`¥ ${loanData.totalInterest}`} />
            <Row label="借款状态" value={loanData.status || '-'} red />
            <Row label="逾期金额" value={`¥ ${loanData.overdueAmount}`} red />
            <Row label="总还款金额" value={`¥ ${loanData.totalRepayment}`} red bold />
          </>
        )}

        {/* 操作按钮 */}
        <div style={{ display: 'flex', gap: 12, padding: '16px 0 16px' }}>
          <button
            onClick={() => router.push('/repay_confirm')}
            style={{ flex: 1, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 80, padding: '13px 0', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}
          >
            一键还款
          </button>
          <button
            type="button"
            onClick={toContract}
            style={{
              flex: 1,
              background: 'transparent',
              color: '#2563eb',
              border: '2px solid #2563eb',
              borderRadius: 80,
              padding: '13px 0',
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
              WebkitTextFillColor: '#2563eb',
            }}
          >
            <span style={{ color: '#2563eb' }}>贷款合同</span>
          </button>
        </div>
      </div>

      {/* 分期还款列表：每期还款金额、还款状态（与截图一致） */}
      {isInstallment && loanData.schedule && loanData.schedule.length > 0 && (
        <div style={{ margin: '12px 12px 0' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#111', marginBottom: 10, paddingLeft: 4 }}>还款列表</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loanData.schedule.map((item) => {
              const st = statusLabels[item.status]
              const dueDateOnly = item.dueDate.slice(0, 10)
              return (
                <div key={item.period}
                  style={{ background: '#fff', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 6px rgba(0,0,0,0.06)', borderLeft: `4px solid ${st.color}` }}>
                  <div style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                      <span style={{ fontWeight: 700, color: '#111', fontSize: 14 }}>第{item.period}期</span>
                      <span style={{ padding: '3px 12px', borderRadius: 20, background: st.bg, color: st.color, fontSize: 12, fontWeight: 600 }}>
                        {st.text}
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0' }}>
                      <span style={{ color: '#888' }}>应还日期</span>
                      <span style={{ color: '#111' }}>{dueDateOnly}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0' }}>
                      <span style={{ color: '#888' }}>当期还款本金</span>
                      <span style={{ color: '#111' }}>¥ {item.principal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0' }}>
                      <span style={{ color: '#888' }}>当期还款利息</span>
                      <span style={{ color: '#111' }}>¥ {item.interest.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0' }}>
                      <span style={{ color: '#888' }}>当期还款总额</span>
                      <span style={{ color: '#111', fontWeight: 700 }}>¥ {item.total.toFixed(2)}</span>
                    </div>
                    {(item.status === 'overdue' || item.status === 'current') && (
                      <button
                        type="button"
                        onClick={() => router.push(`/repay_confirm?period=${item.period}&amount=${item.total.toFixed(2)}`)}
                        style={{ marginTop: 12, padding: '10px 0', background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer', width: '100%' }}
                      >
                        立即还款
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* 非分期模式下显示提示 */}
      {!isInstallment && (
        <div style={{ margin: '12px 12px 0', background: '#fff', borderRadius: 10, padding: 24, textAlign: 'center', color: '#aaa', fontSize: 14, boxShadow: '0 1px 6px rgba(0,0,0,0.06)' }}>
          全额还款模式，无需分期
        </div>
      )}

      <FooterNav />
    </div>
  )
}
