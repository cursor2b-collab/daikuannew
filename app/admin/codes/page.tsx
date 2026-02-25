'use client'

import { useEffect, useState } from 'react'
import { RefreshIcon } from '@/components/Icons'

interface VerificationCode {
  id: number
  user_id?: number
  phone: string
  code: string
  used: boolean
  expires_at: string
  created_at: string
  users?: {
    id: number
  }
}

export default function CodesPage() {
  const [codes, setCodes] = useState<VerificationCode[]>([])
  const [loading, setLoading] = useState(false)
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(20)
  const [searchPhone, setSearchPhone] = useState('')

  useEffect(() => {
    loadCodes()
  }, [page, searchPhone])

  const loadCodes = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString()
      })
      if (searchPhone) params.append('phone', searchPhone)

      const response = await fetch(`/api/admin/codes?${params}`)
      const result = await response.json()

      if (result.code === 200) {
        setCodes(result.data.list || [])
        setTotal(result.data.total || 0)
      }
    } catch (error) {
      console.error('Load codes error:', error)
      alert('加载验证码列表失败')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString('zh-CN')
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      alert(`${type}已复制到剪贴板`)
    } catch (error) {
      // 降级方案
      const textArea = document.createElement('textarea')
      textArea.value = text
      textArea.style.position = 'fixed'
      textArea.style.opacity = '0'
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand('copy')
        alert(`${type}已复制到剪贴板`)
      } catch (err) {
        alert('复制失败，请手动复制')
      }
      document.body.removeChild(textArea)
    }
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
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>验证码管理</h2>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={async () => {
              if (!confirm('确定要为所有用户生成验证码吗？')) return
              try {
                const response = await fetch('/api/admin/generate_codes', {
                  method: 'POST'
                })
                const result = await response.json()
                if (result.code === 200) {
                  alert(`成功生成 ${result.data.generated} 个验证码`)
                  loadCodes()
                } else {
                  alert(result.msg || '生成失败')
                }
              } catch (error) {
                console.error('生成验证码失败:', error)
                alert('生成验证码失败')
              }
            }}
            style={{
              padding: '8px 16px',
              background: '#667eea',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              color: '#ffffff',
              fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
              fontWeight: 'bold'
            }}
          >
            生成验证码
          </button>
          <input
            type="text"
            placeholder="搜索手机号"
            value={searchPhone}
            onChange={(e) => setSearchPhone(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                setPage(1)
                loadCodes()
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
          <button
            onClick={loadCodes}
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
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>编号</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>手机号</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>验证码</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>使用状态</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>过期时间</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>创建时间</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
                  加载中...
                </td>
              </tr>
            ) : codes.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
                  暂无数据
                </td>
              </tr>
            ) : (
              codes.map((code) => (
                <tr key={code.id} style={{ borderBottom: '1px solid #404040' }}>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
                    {code.user_id || code.id}
                  </td>
                  <td 
                    onClick={() => copyToClipboard(code.phone, '手机号')}
                    style={{ 
                      padding: '12px', 
                      color: '#667eea', 
                      fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', 
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                    title="点击复制"
                  >
                    {code.phone}
                  </td>
                  <td 
                    onClick={() => copyToClipboard(code.code, '验证码')}
                    style={{ 
                      padding: '12px', 
                      color: '#667eea', 
                      fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', 
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                    title="点击复制"
                  >
                    {code.code}
                  </td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: code.used ? '#4d4d4d' : '#2d5a2d',
                      color: code.used ? '#b0b0b0' : '#4caf50',
                      fontSize: '12px',
                      fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
                      fontWeight: 'bold'
                    }}>
                      {code.used ? '已使用' : '未使用'}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{formatDate(code.expires_at)}</td>
                  <td style={{ padding: '12px', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>{formatDate(code.created_at)}</td>
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
    </div>
  )
}
