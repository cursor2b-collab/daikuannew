'use client'

import { useEffect, useState } from 'react'

export default function ChatlinkPage() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadCustomerServiceUrl = async () => {
      try {
        const response = await fetch('/api/get_customer_service_url')
        const result = await response.json()
        const url = result.code === 200 && result.data?.url ? result.data.url : 'https://kbn.dot01ui.cfd/chat/index?channelId=817bc25124614b89afe65ecf4533a94a'
        window.location.href = url
      } catch (error) {
        window.location.href = 'https://iridescent-faun-faf709.netlify.app/'
      }
    }

    loadCustomerServiceUrl()
  }, [])

  return (
    <div className="main-content loaded" style={{ padding: '20px', textAlign: 'center' }}>
      <p>正在跳转到在线客服页面...</p>
    </div>
  )
}

