import { useEffect } from 'react'
import Taro from '@tarojs/taro'
import './app.scss'

function App(props: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.TARO_ENV === 'weapp') {
      Taro.cloud.init({ env: '', traceUser: true })
    }
  }, [])

  return props.children
}

export default App