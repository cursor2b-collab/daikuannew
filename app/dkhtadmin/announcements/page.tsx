'use client'
import { useEffect, useState } from 'react'

export default function AnnouncementsPage() {
  const [messages, setMessages] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newMsg, setNewMsg] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const r = await fetch('/api/admin/settings?key=copy_marquee_messages')
      const d = await r.json()
      if (d.code === 200 && d.data?.setting_value) {
        try {
          const arr = JSON.parse(d.data.setting_value)
          if (Array.isArray(arr)) { setMessages(arr); setLoading(false); return }
        } catch {}
        setMessages([d.data.setting_value])
      } else {
        setMessages([])
      }
    } finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const save = async (list: string[]) => {
    setSaving(true)
    try {
      const r = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'copy_marquee_messages', value: JSON.stringify(list) })
      })
      const d = await r.json()
      if (d.code === 200) alert('保存成功')
      else alert(d.msg || '保存失败')
    } finally { setSaving(false) }
  }

  const addMsg = () => {
    if (!newMsg.trim()) return
    const updated = [...messages, newMsg.trim()]
    setMessages(updated)
    setNewMsg('')
  }

  const removeMsg = (i: number) => {
    const updated = messages.filter((_, idx) => idx !== i)
    setMessages(updated)
  }

  const moveMsg = (i: number, dir: -1 | 1) => {
    const arr = [...messages]
    const j = i + dir
    if (j < 0 || j >= arr.length) return
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
    setMessages(arr)
  }

  return (
    <div style={{ fontFamily: 'PingFang SC, -apple-system, sans-serif' }}>
      <div style={{ background: '#2d2d2d', borderRadius: 8, padding: '16px 20px', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>发布公告</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#999' }}>管理首页滚动公告内容，修改后点击「保存」即可在前台生效</p>
      </div>

      <div style={{ background: '#2d2d2d', borderRadius: 8, padding: 24 }}>
        {/* 添加新公告 */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', color: '#aaa', fontSize: 13, marginBottom: 8 }}>新增公告内容</label>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={newMsg}
              onChange={e => setNewMsg(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addMsg()}
              placeholder="输入公告内容，按 Enter 或点击添加..."
              style={{ flex: 1, padding: '9px 14px', background: '#1a1a1a', border: '1px solid #404040', borderRadius: 6, color: '#fff', fontSize: 14 }}
            />
            <button onClick={addMsg} style={{ padding: '9px 20px', background: '#667eea', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14, fontWeight: 600, whiteSpace: 'nowrap' }}>
              + 添加
            </button>
          </div>
        </div>

        {/* 公告列表 */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ display: 'block', color: '#aaa', fontSize: 13, marginBottom: 8 }}>
            当前公告列表（共 {messages.length} 条，拖动序号调整顺序）
          </label>
          {loading ? (
            <div style={{ color: '#666', padding: 24, textAlign: 'center' }}>加载中...</div>
          ) : messages.length === 0 ? (
            <div style={{ color: '#555', padding: 24, textAlign: 'center', border: '1px dashed #404040', borderRadius: 6 }}>暂无公告，请点击上方添加</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#1a1a1a', border: '1px solid #333', borderRadius: 6 }}>
                  <span style={{ color: '#555', fontSize: 12, minWidth: 20, textAlign: 'right' }}>{i + 1}</span>
                  <span style={{ flex: 1, color: '#ddd', fontSize: 14 }}>{msg}</span>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button onClick={() => moveMsg(i, -1)} disabled={i === 0}
                      style={{ width: 28, height: 28, background: '#333', color: i === 0 ? '#555' : '#aaa', border: 'none', borderRadius: 4, cursor: i === 0 ? 'not-allowed' : 'pointer', fontSize: 12 }}>↑</button>
                    <button onClick={() => moveMsg(i, 1)} disabled={i === messages.length - 1}
                      style={{ width: 28, height: 28, background: '#333', color: i === messages.length - 1 ? '#555' : '#aaa', border: 'none', borderRadius: 4, cursor: i === messages.length - 1 ? 'not-allowed' : 'pointer', fontSize: 12 }}>↓</button>
                    <button onClick={() => removeMsg(i)}
                      style={{ width: 28, height: 28, background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}>×</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 保存按钮 */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
          <button onClick={load} style={{ padding: '9px 20px', background: '#404040', color: '#aaa', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 14 }}>重置</button>
          <button onClick={() => save(messages)} disabled={saving}
            style={{ padding: '9px 28px', background: saving ? '#444' : '#667eea', color: '#fff', border: 'none', borderRadius: 6, cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}>
            {saving ? '保存中...' : '保存公告'}
          </button>
        </div>
      </div>
    </div>
  )
}
