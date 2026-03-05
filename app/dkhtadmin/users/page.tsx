'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshIcon } from '@/components/Icons'

interface User {
  id: number
  name?: string
  phone?: string
  id_number?: string
  loan_number?: string
  bank_card?: string
  amount?: number
  loan_date?: string
  overdue_days?: number
  overdue_amount?: number
  amount_due?: number
  is_settled?: boolean
  is_interest_free?: boolean
  payment_method?: any
  voucher_images?: string[]
  created_at?: string
  annual_rate?: number
  repayment_months?: number
  daily_penalty?: number
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
              input.accept = '.xlsx,.xls,.csv'
              input.onchange = async (e: any) => {
                const file = e.target.files[0]
                if (file) {
                  try {
                    // 读取CSV文件
                    let text = await file.text()
                    // 去除 UTF-8 BOM，否则表头会变成 "\uFEFF姓名" 导致 row['姓名'] 等全部为空白
                    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1)
                    const lines = text.split(/\r?\n/).map((line: string) => line.trim()).filter((line: string) => line.length > 0)
                    if (lines.length < 2) {
                      alert('文件格式错误，至少需要表头和数据行')
                      return
                    }

                    // 解析CSV：表头与每行按逗号分割，并统一去除首尾空白和 BOM
                    const normalize = (s: string) => s.replace(/^\uFEFF/, '').trim()
                    const headers = lines[0].split(',').map((h: string) => normalize(h))
                    const dataRows = lines.slice(1).map((line: string) => {
                      const values = line.split(',').map((v: string) => v.trim())
                      const row: any = {}
                      headers.forEach((header: string, index: number) => {
                        row[header] = values[index] ?? ''
                      })
                      return row
                    })

                    // 批量创建用户
                    let successCount = 0
                    let failCount = 0
                    for (const row of dataRows) {
                      try {
                        const userData: any = {
                          name: row['姓名'] || row['name'] || '',
                          phone: row['手机号码'] || row['phone'] || '',
                          id_number: row['身份证号码'] || row['id_number'] || '',
                          loan_number: row['放款编号'] || row['loan_number'] || '',
                          bank_card: row['银行卡号'] || row['bank_card'] || '',
                          amount: parseFloat(row['金额'] || row['amount'] || '0'),
                          loan_date: row['放款时间'] || row['loan_date'] || null,
                          overdue_days: parseInt(row['逾期天数'] || row['overdue_days'] || '0'),
                          overdue_amount: parseFloat(row['逾期金额'] || row['overdue_amount'] || '0'),
                          amount_due: parseFloat(row['应还金额'] || row['amount_due'] || '0'),
                          is_settled: (row['是否结清'] || row['is_settled'] || '否') === '是' || (row['是否结清'] || row['is_settled']) === 'true',
                          is_interest_free: (row['是否免息'] || row['is_interest_free'] || '否') === '是' || (row['是否免息'] || row['is_interest_free']) === 'true'
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
                    alert('导入失败，请检查文件格式')
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
              const csvContent = '姓名,手机号码,身份证号码,放款编号,银行卡号,金额,放款时间,逾期天数,逾期金额,应还金额,是否结清,是否免息\n示例,13800138000,110101199001011234,FQ123456789,6217000010001234567,10000,2024-01-01,0,0,10000,否,否'
              
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
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>手机号码 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>身份证号码 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>放款编号 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>银行卡号 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>金额 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>放款时间 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>逾期天数 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>逾期金额 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>应还金额 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>是否结清 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>是否免息 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>创建时间 ↕</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={16} style={{ padding: '40px', textAlign: 'center', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
                  加载中...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={16} style={{ padding: '40px', textAlign: 'center', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
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
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{user.loan_number || '-'}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{maskString(user.bank_card, 4, 4) || '-'}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{formatAmount(user.amount)}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{user.loan_date || '-'}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{user.overdue_days || '-'}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{formatAmount(user.overdue_amount)}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{formatAmount(user.amount_due)}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
                    {user.is_settled ? '已结清' : '未结清'}
                  </td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
                    {user.is_interest_free ? '免息' : '-'}
                  </td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{formatDate(user.created_at)}</td>
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
