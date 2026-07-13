import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { HomeIcon, UserIcon } from '../components/svg/icons'

export default class CustomTabBar extends Taro.Component {
  state = {
    selected: 0,
    color: '#9B9BAB',
    selectedColor: '#FF6B6B',
    list: [
      {
        pagePath: '/pages/index/index',
        text: '首页',
        icon: HomeIcon,
      },
      {
        pagePath: '/pages/my/my',
        text: '我的',
        icon: UserIcon,
      },
    ],
  }

  componentDidMount() {
    const pages = Taro.getCurrentPages()
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1]
      const route = '/' + currentPage.route
      const index = this.state.list.findIndex(item => item.pagePath === route)
      if (index !== -1) {
        this.setState({ selected: index })
      }
    }
  }

  switchTab(e: { currentTarget: { dataset: { index: number } } }) {
    const index = e.currentTarget.dataset.index
    const item = this.state.list[index]
    this.setState({ selected: index })
    Taro.switchTab({ url: item.pagePath })
  }

  render() {
    const { selected, color, selectedColor, list } = this.state

    return (
      <View className='custom-tab-bar'>
        {list.map((item, index) => {
          const Icon = item.icon
          const isSelected = selected === index
          return (
            <View
              key={index}
              className='tab-item'
              onClick={this.switchTab.bind(this)}
              data-index={index}
            >
              <Icon color={isSelected ? selectedColor : color} />
              <Text className={`tab-text ${isSelected ? 'selected' : ''}`}>{item.text}</Text>
            </View>
          )
        })}
      </View>
    )
  }
}
