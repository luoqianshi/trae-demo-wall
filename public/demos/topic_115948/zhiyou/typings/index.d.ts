/// <reference types="@tarojs/taro" />

declare namespace JSX {
  interface IntrinsicElements {
    view: any
    text: any
    image: any
    input: any
    button: any
    scroll-view: any
  }
}

declare function definePageConfig(config: any): any
declare function defineAppConfig(config: any): any