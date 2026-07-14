import { useEffect } from 'react'

declare global {
  interface Window {
    APPFLOW_CHAT_SDK?: {
      init: (config: {
        integrateConfig: {
          integrateId: string
          domain: {
            requestDomain: string
          }
        }
      }) => void
    }
  }
}

export default function BaichuanChat() {
  useEffect(() => {
    const initChat = () => {
      if (window.APPFLOW_CHAT_SDK) {
        window.APPFLOW_CHAT_SDK.init({
          integrateConfig: {
            integrateId: 'cit-4062cd76fe88459b9b9d',
            domain: {
              requestDomain: 'https://1041699244330050.appflow.aliyunnest.com'
            }
          }
        })
      }
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initChat)
      return () => document.removeEventListener('DOMContentLoaded', initChat)
    } else {
      initChat()
    }
  }, [])

  return null
}
