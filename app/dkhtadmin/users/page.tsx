'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshIcon } from '@/components/Icons'
import * as XLSX from 'xlsx'

interface User {
  id: number
  name?: string
  phone?: string
  id_number?: string
  loan_number?: string
  bank_card?: string
  amount?: number
  loan_date?: string
  due_date?: string
  overdue_days?: number
  overdue_amount?: number
  amount_due?: number
  is_settled?: boolean
  is_interest_free?: boolean
  payment_method?: any
  voucher_images?: string[]
  created_at?: string
  updated_at?: string
  annual_rate?: number
  repayment_months?: number
  daily_penalty?: number
  penalty_fee?: number
  interest?: number
}

export default function UsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(20)
  const [search, setSearch] = useState('')
  const [isSettledFilter, setIsSettledFilter] = useState<string>('')
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'payment' | 'installment'>('basic')

  useEffect(() => {
    loadUsers()
  }, [page, search, isSettledFilter])

  const loadUsers = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      if (search) params.append('search', search)
      if (isSettledFilter !== '') params.append('is_settled', isSettledFilter)

      const response = await fetch(`/api/admin/users?${params}`)
      const result = await response.json()

      if (result.code === 200) {
        setUsers(result.data.list || [])
        setTotal(result.data.total || 0)
      }
    } catch (error) {
      console.error('Load users error:', error)
      alert('加载用户列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser({ ...user })
    setActiveTab('basic')
    setShowEditModal(true)
  }

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这条记录吗？')) return

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE'
      })
      const result = await response.json()

      if (result.code === 200) {
        alert('删除成功')
        loadUsers()
      } else {
        alert(result.msg || '删除失败')
      }
    } catch (error) {
      alert('删除失败')
    }
  }

  const handleSave = async () => {
    if (!editingUser) return

    try {
      const url = editingUser.id
        ? `/api/admin/users/${editingUser.id}`
        : '/api/admin/users'
      const method = editingUser.id ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser)
      })

      const result = await response.json()

      if (result.code === 200) {
        alert('保存成功')
        setShowEditModal(false)
        setEditingUser(null)
        loadUsers()
      } else {
        alert(result.msg || '保存失败')
      }
    } catch (error) {
      alert('保存失败')
    }
  }

  const formatAmount = (amount?: number) => {
    if (amount === undefined || amount === null) return '-'
    return amount.toFixed(2)
  }

  const formatDate = (date?: string) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('zh-CN')
  }

  const maskString = (str?: string, start = 0, end = 3) => {
    if (!str) return '-'
    if (str.length <= start + end) return str
    return str.slice(0, start) + '***' + str.slice(-end)
  }

  return (
    <div style={{ fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      {/* 操作栏 */}
      <div style={{
        background: '#2d2d2d',
        padding: '15px',
        marginBottom: '15px',
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => {
              setEditingUser({} as User)
              setActiveTab('basic')
              setShowEditModal(true)
            }}
            style={{
              padding: '8px 16px',
              background: '#667eea',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            + 新增
          </button>
          <button
            onClick={() => {
              const input = document.createElement('input')
              input.type = 'file'
              input.accept = '.csv,.txt,.xlsx,.xls,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv,text/plain'
              input.onchange = async (e: any) => {
                const file = e.target.files[0]
                if (file) {
                  try {
                    const normalize = (s: string) => s.replace(/^\uFEFF/, '').trim()
                    const stripQuotes = (v: string) => (v ?? '').replace(/^["']|["']$/g, '').trim()
                    const ext = (file.name || '').toLowerCase().split('.').pop() || ''
                    let headers: string[] = []
                    let dataRows: { row: any }[] = []

                    if (ext === 'xlsx' || ext === 'xls') {
                      const buf = await file.arrayBuffer()
                      const wb = XLSX.read(new Uint8Array(buf), { type: 'array', cellDates: true })
                      const firstSheetName = wb.SheetNames[0]
                      if (!firstSheetName) {
                        alert('文件格式错误：Excel 中无工作表')
                        return
                      }
                      const sheet = wb.Sheets[firstSheetName]
                      const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as (string | number)[][]
                      if (!rows.length) {
                        alert('文件格式错误：至少需要表头和数据行')
                        return
                      }
                      const rawHeader = rows[0].map((c) => normalize(String(c ?? '')))
                      headers = rawHeader
                      dataRows = rows.slice(1).map((values: (string | number)[]) => {
                        const row: any = {}
                        headers.forEach((h, i) => {
                          const v = values[i]
                          let s = typeof v === 'number' ? (v as number).toString() : String(v ?? '')
                          if (v instanceof Date) s = (v as Date).toISOString().slice(0, 19).replace('T', ' ')
                          row[h] = stripQuotes(s.trim())
                        })
                        return { row }
                      })
                    } else {
                      let text = await file.text()
                      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)
                      const lines = text.split(/\r?\n/).map((line: string) => line.trim()).filter((line: string) => line.length > 0)
                      if (lines.length < 2) {
                        alert('文件格式错误，至少需要表头和数据行')
                        return
                      }
                      const firstLine = lines[0]
                      const tabCount = (firstLine.match(/\t/g) || []).length
                      const commaCount = (firstLine.match(/,/g) || []).length
                      const delim = tabCount >= commaCount && tabCount > 0 ? '\t' : ','
                      headers = firstLine.split(delim).map((h: string) => normalize(h))
                      dataRows = lines.slice(1).map((line: string) => {
                        const rawValues = line.split(delim)
                        const values = rawValues.map((v: string) => stripQuotes(v.trim()))
                        const row: any = {}
                        headers.forEach((header: string, index: number) => {
                          row[header] = values[index] ?? ''
                        })
                        return { row }
                      })
                    }

                    // 关键词识别：每个业务列对应多种可能的表头关键词（自动识别，不要求列顺序）
                    const fieldKeywords: [string, string[]][] = [
                      ['姓名', ['姓名', 'name', '用户名', '客户姓名', '借款人']],
                      ['手机号', ['手机号', '手机', '手机号码', 'phone', '电话', '联系电话', '手机号']],
                      ['身份证号', ['身份证号', '身份证', '身份证号码', 'id_number', '证件号', '身份证号']],
                      ['银行卡号', ['银行卡号', '银行卡', '银行账号', 'bank_card', '卡号', '收款账号']],
                      ['金额', ['金额', '借款金额', 'amount', '贷款金额', '本金', '放款金额']],
                      ['放款时间', ['放款时间', 'loan_date', '放款日', '借款时间', '放款日期']],
                      ['到期时间', ['到期时间', 'due_date', '到期日', '还款到期', '到期日期']],
                      ['借款期数', ['借款期数', '期数', 'repayment_months', '贷款期数', '借款期限']],
                      ['逾期天数', ['逾期天数', 'overdue_days', '逾期', '逾期天']],
                      ['逾期金额', ['逾期金额', 'overdue_amount', '逾期本息']],
                      ['违约金', ['违约金', 'penalty_fee', '罚金', '滞纳金']],
                      ['利息', ['利息', 'interest', '利率']],
                      ['应还金额', ['应还金额', 'amount_due', '应还', '总还款', '应还本息']],
                      ['分期期数', ['分期期数', '分期', '期数']],
                      ['放款编号', ['放款编号', 'loan_number', '编号', '合同编号', '借据号']],
                      ['添加时间', ['添加时间', 'created_at', '创建时间', '添加日期']],
                      ['修改时间', ['修改时间', 'updated_at', '更新时间']]
                    ]
                    const headerToField: Record<string, string> = {}
                    const fieldToHeader: Record<string, string> = {}
                    headers.forEach((header) => {
                      const h = header.toLowerCase()
                      let bestField = ''
                      let bestLen = 0
                      for (const [field, keywords] of fieldKeywords) {
                        for (const kw of keywords) {
                          const kwLower = kw.toLowerCase()
                          const match = h === kwLower || h.includes(kwLower) || kwLower.includes(h)
                          if (match && kw.length > bestLen) {
                            bestLen = kw.length
                            bestField = field
                          }
                        }
                      }
                      if (bestField && !fieldToHeader[bestField]) {
                        headerToField[header] = bestField
                        fieldToHeader[bestField] = header
                      }
                    })

                    const getVal = (row: any, field: string) => {
                      const header = fieldToHeader[field]
                      if (header && (row[header] !== undefined && row[header] !== '')) return String(row[header]).trim()
                      const keys = fieldKeywords.find(([f]) => f === field)?.[1] ?? []
                      for (const k of keys) {
                        if (row[k] !== undefined && row[k] !== '') return String(row[k]).trim()
                      }
                      return ''
                    }
                    const getNum = (row: any, field: string) => {
                      const v = getVal(row, field)
                      if (v === '' || v == null) return NaN
                      return parseFloat(String(v))
                    }
                    const getInt = (row: any, field: string) => {
                      const v = getVal(row, field)
                      if (v === '' || v == null) return null
                      const n = parseInt(String(v))
                      return isNaN(n) ? null : n
                    }

                    // 批量创建用户
                    let successCount = 0
                    let failCount = 0
                    for (const { row } of dataRows) {
                      try {
                        const toDateOnly = (v: string) => {
                          if (!v || typeof v !== 'string') return null
                          const s = v.trim()
                          if (s.includes(' ')) return s.split(' ')[0]
                          return s.length >= 10 ? s.slice(0, 10) : s
                        }
                        const userData: any = {
                          name: getVal(row, '姓名'),
                          phone: getVal(row, '手机号'),
                          id_number: getVal(row, '身份证号'),
                          loan_number: getVal(row, '放款编号'),
                          bank_card: getVal(row, '银行卡号'),
                          amount: getNum(row, '金额') || 0,
                          loan_date: toDateOnly(getVal(row, '放款时间')) || null,
                          due_date: toDateOnly(getVal(row, '到期时间')) || null,
                          repayment_months: getInt(row, '借款期数') ?? getInt(row, '分期期数'),
                          overdue_days: getInt(row, '逾期天数') || 0,
                          overdue_amount: getNum(row, '逾期金额') || 0,
                          penalty_fee: (() => { const v = getVal(row, '违约金'); return v !== '' ? getNum(row, '违约金') : undefined })(),
                          interest: (() => { const v = getVal(row, '利息'); return v !== '' ? getNum(row, '利息') : undefined })(),
                          amount_due: getNum(row, '应还金额') || 0,
                          is_settled: false,
                          is_interest_free: false
                        }

                        const response = await fetch('/api/admin/users', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify(userData)
                        })

                        const result = await response.json()
                        if (result.code === 200) {
                          successCount++
                        } else {
                          failCount++
                        }
                      } catch (error) {
                        failCount++
                        console.error('导入用户失败:', error)
                      }
                    }

                    alert(`导入完成！成功：${successCount}，失败：${failCount}`)
                    
                    // 自动生成验证码
                    try {
                      const codeResponse = await fetch('/api/admin/generate_codes', {
                        method: 'POST'
                      })
                      const codeResult = await codeResponse.json()
                      if (codeResult.code === 200) {
                        console.log(`已生成 ${codeResult.data.generated} 个验证码`)
                      }
                    } catch (error) {
                      console.error('生成验证码失败:', error)
                    }

                    // 刷新列表
                    loadUsers()
                  } catch (error) {
                    console.error('导入失败:', error)
                    alert('导入失败，请检查文件格式（支持 .csv / .txt / .xlsx / .xls），且首行为表头')
                  }
                }
              }
              input.click()
            }}
            style={{
              padding: '8px 16px',
              background: '#3d3d3d',
              border: '1px solid #404040',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#ffffff',
              fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
              fontWeight: 'bold'
            }}
          >
            导入
          </button>
          <button
            onClick={() => {
              // 创建CSV模板内容
              const csvContent = '姓名,手机号,身份证号,银行卡号,金额,放款时间,到期时间,借款期数,逾期天数,逾期金额,违约金,利息,应还金额,分期期数,放款编号,添加时间,修改时间\n示例,13800138000,110101199001011234,6217000010001234567,10000,2025-01-01 00:00:00,2026-01-01 00:00:00,12,0,0,0,0,10000,12,FQ123456789,,'
              
              // 创建Blob对象
              const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' })
              
              // 创建下载链接
              const link = document.createElement('a')
              const url = URL.createObjectURL(blob)
              link.setAttribute('href', url)
              link.setAttribute('download', '用户导入模板.csv')
              link.style.visibility = 'hidden'
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
            }}
            style={{
              padding: '8px 16px',
              background: '#3d3d3d',
              border: '1px solid #404040',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#ffffff',
              fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
              fontWeight: 'bold'
            }}
          >
            ↓ 下载模板
          </button>
          <button
            onClick={async () => {
              if (!confirm('确定要一键清空所有客户数据吗？\n\n将删除全部客户记录及关联的验证码，且不可恢复。')) return
              setLoading(true)
              try {
                const res = await fetch('/api/admin/users/clear', { method: 'POST' })
                const result = await res.json()
                if (result.code === 200) {
                  alert(`清空成功！已删除 ${result.data?.deletedUsers ?? 0} 条客户、${result.data?.deletedCodes ?? 0} 条验证码。`)
                  loadUsers()
                } else {
                  alert(result.msg || '清空失败')
                }
              } catch (e) {
                alert('清空失败，请重试')
              } finally {
                setLoading(false)
              }
            }}
            disabled={loading}
            style={{
              padding: '8px 16px',
              background: '#8b2e2e',
              border: '1px solid #a03a3a',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              color: '#ffffff',
              fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
              fontWeight: 'bold'
            }}
          >
            一键清空数据
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="搜索姓名/手机号/放款编号"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1)
                loadUsers()
              }
            }}
            style={{
              padding: '8px 12px',
              border: '1px solid #404040',
              borderRadius: '4px',
              width: '200px',
              background: '#1a1a1a',
              color: '#ffffff',
              fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
              fontWeight: 'bold'
            }}
          />
          <select
            value={isSettledFilter}
            onChange={(e) => {
              setIsSettledFilter(e.target.value)
              setPage(1)
            }}
            style={{
              padding: '8px 12px',
              border: '1px solid #404040',
              borderRadius: '4px',
              background: '#1a1a1a',
              color: '#ffffff',
              fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
              fontWeight: 'bold'
            }}
          >
            <option value="" style={{ background: '#1a1a1a', color: '#ffffff' }}>全部状态</option>
            <option value="false" style={{ background: '#1a1a1a', color: '#ffffff' }}>未结清</option>
            <option value="true" style={{ background: '#1a1a1a', color: '#ffffff' }}>已结清</option>
          </select>
          <button
            onClick={loadUsers}
            style={{
              padding: '8px 16px',
              background: '#3d3d3d',
              border: '1px solid #404040',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#ffffff',
              fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <RefreshIcon size={18} color="#ffffff" />
          </button>
        </div>
      </div>

      {/* 表格 */}
      <div style={{
        background: '#2d2d2d',
        borderRadius: '4px',
        overflow: 'auto'
      }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '14px',
          fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif'
        }}>
          <thead>
            <tr style={{ background: '#3d3d3d', borderBottom: '1px solid #404040' }}>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
                <input type="checkbox" />
              </th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>编号 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', minWidth: '80px' }}>姓名 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>手机号 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>身份证号 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>银行卡号 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>金额 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>放款时间 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>到期时间 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>借款期数 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>逾期天数 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>逾期金额 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>违约金 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>利息 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>应还金额 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>分期期数 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>放款编号 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>添加时间 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>修改时间 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={20} style={{ padding: '40px', textAlign: 'center', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
                  加载中...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={20} style={{ padding: '40px', textAlign: 'center', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
                  暂无数据
                </td>
              </tr>
            ) : (
              users.map((user) => (
                <tr key={user.id} style={{ borderBottom: '1px solid #404040' }}>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
                    <input type="checkbox" />
                  </td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{user.id}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold', whiteSpace: 'normal', wordBreak: 'break-all' }} title={user.name || ''}>{user.name || '-'}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{maskString(user.phone, 3, 3) || '-'}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{maskString(user.id_number, 4, 4) || '-'}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{maskString(user.bank_card, 4, 4) || '-'}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{formatAmount(user.amount)}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{user.loan_date || '-'}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{user.due_date || '-'}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{user.repayment_months ?? '-'}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{user.overdue_days ?? '-'}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{formatAmount(user.overdue_amount)}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{formatAmount(user.penalty_fee)}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{formatAmount(user.interest)}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{formatAmount(user.amount_due)}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{user.repayment_months ?? '-'}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{user.loan_number || '-'}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{formatDate(user.created_at)}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{formatDate(user.updated_at)}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          // 打开合同模板，传递用户信息
                          const contractUrl = `/contract?userId=${user.id}&name=${encodeURIComponent(user.name || '')}&phone=${encodeURIComponent(user.phone || '')}&idNumber=${encodeURIComponent(user.id_number || '')}&loanNumber=${encodeURIComponent(user.loan_number || '')}&bankCard=${encodeURIComponent(user.bank_card || '')}&amount=${user.amount || 0}`
                          window.open(contractUrl, '_blank')
                        }}
                        style={{ color: '#667eea', cursor: 'pointer', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}
                      >
                        凭证图片
                      </a>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          handleEdit(user)
                        }}
                        style={{ color: '#667eea', cursor: 'pointer', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}
                      >
                        编辑
                      </a>
                      <a
                        href="#"
                        onClick={(e) => {
                          e.preventDefault()
                          handleDelete(user.id)
                        }}
                        style={{ color: '#f56c6c', cursor: 'pointer', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}
                      >
                        删除
                      </a>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* 分页 */}
        <div style={{
          padding: '15px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderTop: '1px solid #404040'
        }}>
          <div style={{ color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
            共 {total} 项，每页 {limit} 条
          </div>
          <div style={{ display: 'flex', gap: '5px' }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              style={{
                padding: '5px 10px',
                border: '1px solid #404040',
                borderRadius: '4px',
                background: page === 1 ? '#3d3d3d' : '#2d2d2d',
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                color: '#ffffff',
                fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
                fontWeight: 'bold'
              }}
            >
              ←
            </button>
            <span style={{ padding: '5px 10px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
              {page} / {Math.ceil(total / limit)}
            </span>
            <button
              onClick={() => setPage(Math.min(Math.ceil(total / limit), page + 1))}
              disabled={page >= Math.ceil(total / limit)}
              style={{
                padding: '5px 10px',
                border: '1px solid #404040',
                borderRadius: '4px',
                background: page >= Math.ceil(total / limit) ? '#3d3d3d' : '#2d2d2d',
                cursor: page >= Math.ceil(total / limit) ? 'not-allowed' : 'pointer',
                color: '#ffffff',
                fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
                fontWeight: 'bold'
              }}
            >
              →
            </button>
          </div>
        </div>
      </div>

      {/* 编辑弹窗 */}
      {showEditModal && editingUser && (
        <EditModal
          user={editingUser}
          onChange={(updated) => setEditingUser(updated)}
          onClose={() => {
            setShowEditModal(false)
            setEditingUser(null)
          }}
          onSave={handleSave}
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />
      )}
    </div>
  )
}

// 编辑弹窗组件
function EditModal({
  user,
  onChange,
  onClose,
  onSave,
  activeTab,
  onTabChange
}: {
  user: User
  onChange: (user: User) => void
  onClose: () => void
  onSave: () => void
  activeTab: 'basic' | 'payment' | 'installment'
  onTabChange: (tab: 'basic' | 'payment' | 'installment') => void
}) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#2d2d2d',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '800px',
        maxHeight: '90vh',
        overflow: 'auto',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        {/* 标题栏 */}
        <div style={{
          padding: '20px',
          borderBottom: '1px solid #404040',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>编辑</h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              cursor: 'pointer',
              padding: '0',
              width: '30px',
              height: '30px',
              color: '#ffffff'
            }}
          >
            ×
          </button>
        </div>

        {/* 标签页 */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid #404040'
        }}>
          {(['basic', 'payment', 'installment'] as const).map(tab => (
            <button key={tab} onClick={() => onTabChange(tab)} style={{
              padding: '12px 24px',
              background: activeTab === tab ? '#667eea' : 'transparent',
              color: activeTab === tab ? '#fff' : '#b0b0b0',
              border: 'none', cursor: 'pointer', fontSize: '14px',
              fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
              fontWeight: 'bold'
            }}>
              {tab === 'basic' ? '基本设置' : tab === 'payment' ? '收款方式' : '设置分期'}
            </button>
          ))}
        </div>

        {/* 表单内容 */}
        <div style={{ padding: '20px', flex: 1 }}>
          {activeTab === 'basic' ? (
            <BasicSettingsTab user={user} onChange={onChange} />
          ) : activeTab === 'payment' ? (
            <PaymentMethodTab user={user} onChange={onChange} />
          ) : (
            <InstallmentTab user={user} onChange={onChange} />
          )}
        </div>

        {/* 底部按钮 */}
        <div style={{
          padding: '20px',
          borderTop: '1px solid #404040',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '10px'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 20px',
              background: '#3d3d3d',
              border: '1px solid #404040',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#ffffff',
              fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
              fontWeight: 'bold'
            }}
          >
            取消
          </button>
          <button
            onClick={onSave}
            style={{
              padding: '10px 20px',
              background: '#667eea',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
              fontWeight: 'bold'
            }}
          >
            确认
          </button>
        </div>
      </div>
    </div>
  )
}

// 基本设置标签页
function BasicSettingsTab({
  user,
  onChange
}: {
  user: User
  onChange: (user: User) => void
}) {
  return (
    <div style={{ display: 'grid', gap: '20px', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
          姓名
        </label>
        <input
          type="text"
          value={user.name || ''}
          onChange={(e) => onChange({ ...user, name: e.target.value })}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #404040',
            borderRadius: '4px',
            boxSizing: 'border-box',
            background: '#1a1a1a',
            color: '#ffffff',
            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 'bold'
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
          手机号码
        </label>
        <input
          type="text"
          value={user.phone || ''}
          onChange={(e) => onChange({ ...user, phone: e.target.value })}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #404040',
            borderRadius: '4px',
            boxSizing: 'border-box',
            background: '#1a1a1a',
            color: '#ffffff',
            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 'bold'
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
          身份证号码
        </label>
        <input
          type="text"
          value={user.id_number || ''}
          onChange={(e) => onChange({ ...user, id_number: e.target.value })}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #404040',
            borderRadius: '4px',
            boxSizing: 'border-box',
            background: '#1a1a1a',
            color: '#ffffff',
            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 'bold'
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
          放款编号
        </label>
        <input
          type="text"
          value={user.loan_number || ''}
          onChange={(e) => onChange({ ...user, loan_number: e.target.value })}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #404040',
            borderRadius: '4px',
            boxSizing: 'border-box',
            background: '#1a1a1a',
            color: '#ffffff',
            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 'bold'
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
          银行卡号
        </label>
        <input
          type="text"
          value={user.bank_card || ''}
          onChange={(e) => onChange({ ...user, bank_card: e.target.value })}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #404040',
            borderRadius: '4px',
            boxSizing: 'border-box',
            background: '#1a1a1a',
            color: '#ffffff',
            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 'bold'
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
          金额
        </label>
        <input
          type="number"
          value={user.amount || ''}
          onChange={(e) => onChange({ ...user, amount: parseFloat(e.target.value) || 0 })}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #404040',
            borderRadius: '4px',
            boxSizing: 'border-box',
            background: '#1a1a1a',
            color: '#ffffff',
            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 'bold'
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
          放款时间
        </label>
        <input
          type="date"
          value={user.loan_date || ''}
          onChange={(e) => onChange({ ...user, loan_date: e.target.value })}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #404040',
            borderRadius: '4px',
            boxSizing: 'border-box',
            background: '#1a1a1a',
            color: '#ffffff',
            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 'bold'
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
          到期时间
        </label>
        <input
          type="date"
          value={user.due_date || ''}
          onChange={(e) => onChange({ ...user, due_date: e.target.value })}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #404040',
            borderRadius: '4px',
            boxSizing: 'border-box',
            background: '#1a1a1a',
            color: '#ffffff',
            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 'bold'
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
          逾期天数
        </label>
        <input
          type="number"
          value={user.overdue_days || ''}
          onChange={(e) => onChange({ ...user, overdue_days: parseInt(e.target.value) || 0 })}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #404040',
            borderRadius: '4px',
            boxSizing: 'border-box',
            background: '#1a1a1a',
            color: '#ffffff',
            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 'bold'
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
          逾期金额
        </label>
        <input
          type="number"
          value={user.overdue_amount || ''}
          onChange={(e) => onChange({ ...user, overdue_amount: parseFloat(e.target.value) || 0 })}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #404040',
            borderRadius: '4px',
            boxSizing: 'border-box',
            background: '#1a1a1a',
            color: '#ffffff',
            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 'bold'
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
          违约金
        </label>
        <input
          type="number"
          value={user.penalty_fee ?? ''}
          onChange={(e) => onChange({ ...user, penalty_fee: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0 })}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #404040',
            borderRadius: '4px',
            boxSizing: 'border-box',
            background: '#1a1a1a',
            color: '#ffffff',
            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 'bold'
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
          利息
        </label>
        <input
          type="number"
          value={user.interest ?? ''}
          onChange={(e) => onChange({ ...user, interest: e.target.value === '' ? undefined : parseFloat(e.target.value) || 0 })}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #404040',
            borderRadius: '4px',
            boxSizing: 'border-box',
            background: '#1a1a1a',
            color: '#ffffff',
            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 'bold'
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
          应还金额
        </label>
        <input
          type="number"
          value={user.amount_due || ''}
          onChange={(e) => onChange({ ...user, amount_due: parseFloat(e.target.value) || 0 })}
          style={{
            width: '100%',
            padding: '8px 12px',
            border: '1px solid #404040',
            borderRadius: '4px',
            boxSizing: 'border-box',
            background: '#1a1a1a',
            color: '#ffffff',
            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
            fontWeight: 'bold'
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
          是否结清
        </label>
        <div style={{ display: 'flex', gap: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
            <input
              type="radio"
              name="is_settled"
              checked={!user.is_settled}
              onChange={() => onChange({ ...user, is_settled: false })}
            />
            未结清
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
            <input
              type="radio"
              name="is_settled"
              checked={!!user.is_settled}
              onChange={() => onChange({ ...user, is_settled: true })}
            />
            已结清
          </label>
        </div>
      </div>

      <div>
        <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
          是否免息
        </label>
        <div style={{ display: 'flex', gap: '20px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
            <input
              type="radio"
              name="is_interest_free"
              checked={!user.is_interest_free}
              onChange={() => onChange({ ...user, is_interest_free: false })}
            />
            不免
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
            <input
              type="radio"
              name="is_interest_free"
              checked={!!user.is_interest_free}
              onChange={() => onChange({ ...user, is_interest_free: true })}
            />
            免息
          </label>
        </div>
      </div>
    </div>
  )
}

// 收款方式标签页
function PaymentMethodTab({
  user,
  onChange
}: {
  user: User
  onChange: (user: User) => void
}) {
  const paymentMethods = user.payment_method || []

  const updatePaymentMethod = (index: number, field: string, value: string) => {
    const methods = [...paymentMethods]
    if (!methods[index]) {
      methods[index] = { type: '', bank_name: '', payee_name: '', card_number: '' }
    }
    methods[index] = { ...methods[index], [field]: value }
    onChange({ ...user, payment_method: methods })
  }

  const addPaymentMethod = () => {
    const methods = [...paymentMethods]
    methods.push({
      type: methods.length === 0 ? '银行卡一' : '银行卡二',
      bank_name: '',
      payee_name: '',
      card_number: ''
    })
    onChange({ ...user, payment_method: methods })
  }

  return (
    <div style={{ display: 'grid', gap: '20px', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>
      {paymentMethods.map((method: any, index: number) => (
        <div key={index} style={{
          padding: '15px',
          border: '1px solid #404040',
          borderRadius: '4px',
          background: '#3d3d3d'
        }}>
          <div style={{ marginBottom: '15px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>收款方式 {index + 1}</div>
          
          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
              *收款类型
            </label>
            <select
              value={method?.type || ''}
              onChange={(e) => updatePaymentMethod(index, 'type', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #404040',
                borderRadius: '4px',
                boxSizing: 'border-box',
                background: '#1a1a1a',
                color: '#ffffff',
                fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
                fontWeight: 'bold'
              }}
            >
              <option value="" style={{ background: '#1a1a1a', color: '#ffffff' }}>请选择</option>
              <option value="银行卡一" style={{ background: '#1a1a1a', color: '#ffffff' }}>银行卡一</option>
              <option value="银行卡二" style={{ background: '#1a1a1a', color: '#ffffff' }}>银行卡二</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
              银行卡名称
            </label>
            <input
              type="text"
              value={method?.bank_name || ''}
              onChange={(e) => updatePaymentMethod(index, 'bank_name', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #404040',
                borderRadius: '4px',
                boxSizing: 'border-box',
                background: '#1a1a1a',
                color: '#ffffff',
                fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
                fontWeight: 'bold'
              }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
              收款人姓名
            </label>
            <input
              type="text"
              value={method?.payee_name || ''}
              onChange={(e) => updatePaymentMethod(index, 'payee_name', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #404040',
                borderRadius: '4px',
                boxSizing: 'border-box',
                background: '#1a1a1a',
                color: '#ffffff',
                fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
                fontWeight: 'bold'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
              银行卡号
            </label>
            <input
              type="text"
              value={method?.card_number || ''}
              onChange={(e) => updatePaymentMethod(index, 'card_number', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 12px',
                border: '1px solid #404040',
                borderRadius: '4px',
                boxSizing: 'border-box',
                background: '#1a1a1a',
                color: '#ffffff',
                fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
                fontWeight: 'bold'
              }}
            />
          </div>
        </div>
      ))}

      <button
        onClick={addPaymentMethod}
        style={{
          padding: '10px 20px',
          background: '#3d3d3d',
          border: '1px dashed #404040',
          borderRadius: '4px',
          cursor: 'pointer',
          color: '#667eea',
          fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
          fontWeight: 'bold'
        }}
      >
        + 添加银行卡
      </button>
    </div>
  )
}

// 设置分期标签页
function InstallmentTab({ user, onChange }: { user: User; onChange: (u: User) => void }) {
  const inputStyle: React.CSSProperties = {
    width: '100%', padding: '9px 12px', border: '1px solid #404040', borderRadius: '4px',
    boxSizing: 'border-box', background: '#1a1a1a', color: '#ffffff', fontSize: '14px',
    fontFamily: 'PingFang SC, -apple-system, sans-serif',
  }
  const labelStyle: React.CSSProperties = {
    display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff',
    fontFamily: 'PingFang SC, -apple-system, sans-serif', fontSize: '14px',
  }

  // 实时预览计算
  const amount = Number(user.amount) || 0
  const months = Number(user.repayment_months) || 0
  const rate = Number(user.annual_rate) || 10.88
  const penalty = Number(user.daily_penalty) || 2.50
  const overdueDays = Number(user.overdue_days) || 0

  const monthlyPrincipal = months > 0 ? amount / months : 0
  const monthlyInterest = months > 0 ? (amount * rate / 100) / 12 : 0
  const totalInterest = monthlyInterest * months
  const totalPenalty = penalty * overdueDays
  const totalRepayment = amount + totalInterest + totalPenalty

  return (
    <div style={{ display: 'grid', gap: '20px', fontFamily: 'PingFang SC, -apple-system, sans-serif' }}>
      <div style={{ padding: '12px 16px', background: '#1a2a1a', border: '1px solid #2a5a2a', borderRadius: '6px', color: '#4ade80', fontSize: '13px' }}>
        设置分期后，用户端「还款」页面将显示详细的分期还款计划，包括每期还款金额、日期和逾期状态。
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div>
          <label style={labelStyle}>还款期数（月）<span style={{ color: '#ef4444', marginLeft: 4 }}>*</span></label>
          <input
            type="number" min="1" max="360" placeholder="例如：12"
            value={user.repayment_months ?? ''}
            onChange={e => onChange({ ...user, repayment_months: e.target.value ? parseInt(e.target.value) : undefined })}
            style={inputStyle}
          />
          <div style={{ fontSize: '12px', color: '#888', marginTop: 4 }}>填写0或清空则不启用分期</div>
        </div>
        <div>
          <label style={labelStyle}>年化利率（%）</label>
          <input
            type="number" min="0" max="100" step="0.01" placeholder="例如：10.88"
            value={user.annual_rate ?? 10.88}
            onChange={e => onChange({ ...user, annual_rate: parseFloat(e.target.value) || 10.88 })}
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>每日违约金（元/天）</label>
          <input
            type="number" min="0" step="0.01" placeholder="例如：2.50"
            value={user.daily_penalty ?? 2.50}
            onChange={e => onChange({ ...user, daily_penalty: parseFloat(e.target.value) || 0 })}
            style={inputStyle}
          />
        </div>
      </div>

      {months > 0 && (
        <div style={{ background: '#1e1e2e', border: '1px solid #404060', borderRadius: '8px', padding: '16px' }}>
          <div style={{ fontWeight: 'bold', color: '#aaa', fontSize: '13px', marginBottom: '12px' }}>分期预览</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {[
              ['借款金额', `¥ ${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2 })}`],
              ['还款期数', `${months} 个月`],
              ['年化利率', `${rate}%`],
              ['每月还款本金', `¥ ${monthlyPrincipal.toFixed(2)}`],
              ['每月还款利息', `¥ ${monthlyInterest.toFixed(2)}`],
              ['总利息', `¥ ${totalInterest.toFixed(2)}`],
              ['每日违约金', `¥ ${penalty.toFixed(2)}/天`],
              ['逾期天数', `${overdueDays} 天`],
              ['违约金合计', `¥ ${totalPenalty.toFixed(2)}`, overdueDays > 0],
              ['总还款金额', `¥ ${totalRepayment.toFixed(2)}`, true],
            ].map(([label, val, isRed]) => (
              <div key={label as string} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #333' }}>
                <span style={{ color: '#888', fontSize: '13px' }}>{label as string}</span>
                <span style={{ color: isRed ? '#ef4444' : '#fff', fontWeight: 600, fontSize: '13px' }}>{val as string}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
