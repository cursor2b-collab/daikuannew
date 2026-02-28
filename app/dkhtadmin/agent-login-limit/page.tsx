'use client'
export default function Page() {
  return (
    <div style={{ fontFamily: 'PingFang SC, -apple-system, sans-serif' }}>
      <div style={{ background: '#2d2d2d', borderRadius: 8, padding: '16px 20px', marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: '#fff' }}>代理限制登录数</h2>
        <p style={{ margin: '4px 0 0', fontSize: 13, color: '#999' }}>设置代理账号最大同时在线登录数</p>
      </div>
      <div style={{ background: '#2d2d2d', borderRadius: 8, padding: 60, textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>🚧</div>
        <div style={{ color: '#666', fontSize: 15 }}>功能开发中，敬请期待</div>
      </div>
    </div>
  )
}
