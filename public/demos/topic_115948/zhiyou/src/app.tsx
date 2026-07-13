import { Component } from 'react'
import Taro from '@tarojs/taro'
import './app.scss'
import { TOKEN_KEY } from './config/api'
import themeStore from './store/theme'

const NO_AUTH_PAGES = ['/pages/login/login']

class App extends Component {
  componentDidMount() {
    this.applyTheme()
    this.checkAuth()
  }

  componentDidShow() {
    this.applyTheme()
  }

  componentDidHide() {}

  applyTheme() {
    const variables = themeStore.getCssVariables()
    const root = document.documentElement
    Object.keys(variables).forEach(key => {
      root.style.setProperty(key, variables[key])
    })
  }

  checkAuth() {
    const token = Taro.getStorageSync(TOKEN_KEY)
    const currentPages = Taro.getCurrentPages()
    const currentRoute = currentPages.length > 0 ? '/' + currentPages[0].route : ''

    if (!token && !NO_AUTH_PAGES.includes(currentRoute)) {
      Taro.redirectTo({ url: '/pages/login/login' })
    }
  }

  render() {
    return this.props.children
  }
}

export default App
