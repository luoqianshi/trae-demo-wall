import { Component, PropsWithChildren } from 'react';
import './app.css';

class App extends Component<PropsWithChildren> {
  componentDidMount() {
    // 检查登录状态
  }

  render() {
    return this.props.children;
  }
}

export default App;