'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Admin {
  id: string
  username: string
  status: number
  login_at?: string
  login_num: number
  created_at: string
}

export default function AdminsPage() {
  const router = useRouter()
  const [admins, setAdmins] = useState<Admin[]>([])
  const [loading, setLoading] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newAdmin, setNewAdmin] = useState({ username: '', password: '' })

  useEffect(() => {
    loadAdmins()
  }, [])

  const loadAdmins = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/admin/admins')
      const result = await response.json()

      if (result.code === 200) {
        setAdmins(result.data.list || [])
      }
    } catch (error) {
      console.error('Load admins error:', error)
      alert('加载管理员列表失败')
    } finally {
      setLoading(false)
    }
  }

  const handleAddAdmin = async () => {
    if (!newAdmin.username || !newAdmin.password) {
      alert('请输入用户名和密码')
      return
    }

    if (newAdmin.password.length < 6) {
      alert('密码长度至少6位')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/admin/admins', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAdmin)
      })

      const result = await response.json()

      if (result.code === 200) {
        alert('添加成功')
        setShowAddModal(false)
        setNewAdmin({ username: '', password: '' })
        loadAdmins()
      } else {
        alert(result.msg || '添加失败')
      }
    } catch (error) {
      alert('添加失败')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('确定要删除这个管理员吗？')) return

    setLoading(true)
    try {
      const response = await fetch(`/api/admin/admins/${id}`, {
        method: 'DELETE'
      })

      const result = await response.json()

      if (result.code === 200) {
        alert('删除成功')
        loadAdmins()
      } else {
        alert(result.msg || '删除失败')
      }
    } catch (error) {
      alert('删除失败')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: string) => {
    if (!date) return '-'
    return new Date(date).toLocaleString('zh-CN')
  }

  return (
    <div>
      {/* 操作栏 */}
      <div style={{
        background: '#2d2d2d',
        padding: '15px',
        marginBottom: '15px',
        borderRadius: '4px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif'
      }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>管理员管理</h2>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
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
          + 新增管理员
        </button>
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
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>用户名</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>状态</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>登录次数</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>最后登录</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>创建时间</th>
              <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
                  加载中...
                </td>
              </tr>
            ) : admins.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
                  暂无数据
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id} style={{ borderBottom: '1px solid #404040', color: '#ffffff', fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif', fontWeight: 'bold' }}>
                  <td style={{ padding: '12px' }}>{admin.username}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: admin.status === 1 ? '#2d5a2d' : '#4d4d4d',
                      color: admin.status === 1 ? '#4caf50' : '#b0b0b0',
                      fontSize: '12px'
                    }}>
                      {admin.status === 1 ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td style={{ padding: '12px' }}>{admin.login_num || 0}</td>
                  <td style={{ padding: '12px' }}>{formatDate(admin.login_at || '')}</td>
                  <td style={{ padding: '12px' }}>{formatDate(admin.created_at)}</td>
                  <td style={{ padding: '12px' }}>
                    <button
                      onClick={() => handleDeleteAdmin(admin.id)}
                      style={{
                        padding: '4px 8px',
                        background: '#dc2626',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        color: '#ffffff',
                        fontSize: '12px',
                        fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif',
                        fontWeight: 'bold'
                      }}
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* 新增管理员弹窗 */}
      {showAddModal && (
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
            maxWidth: '500px',
            padding: '20px',
            fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif'
          }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '18px', fontWeight: 'bold', color: '#ffffff' }}>新增管理员</h2>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>
                用户名
              </label>
              <input
                type="text"
                value={newAdmin.username}
                onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
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
                placeholder="请输入用户名"
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: '#ffffff' }}>
                密码
              </label>
              <input
                type="password"
                value={newAdmin.password}
                onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
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
                placeholder="请输入密码（至少6位）"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setNewAdmin({ username: '', password: '' })
                }}
                style={{
                  padding: '10px 20px',
                  background: '#3d3d3d',
                  color: '#fff',
                  border: '1px solid #404040',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif'
                }}
              >
                取消
              </button>
              <button
                onClick={handleAddAdmin}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: loading ? '#3d3d3d' : '#667eea',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                  fontFamily: 'PingFang SC, -apple-system, BlinkMacSystemFont, sans-serif'
                }}
              >
                {loading ? '添加中...' : '确认'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
