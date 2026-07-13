const config = {
  projectName: 'zhiyou',
  date: '2026-6-25',
  framework: 'react',
  compiler: {
    type: 'webpack5',
    prebundle: { enable: false }
  },
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  plugins: [
    '@tarojs/plugin-framework-react',
    '@tarojs/plugin-html'
  ],
  defineConstants: {},
  copy: {
    patterns: [
      {
        from: 'src/assets/q-version',
        to: 'assets/q-version'
      }
    ],
    options: {}
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: false,
        config: {}
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      },
      'postcss-rpx-transform': {
        enable: true,
        config: {
          viewportWidth: 750
        }
      }
    }
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    postcss: {
      pxtransform: {
        enable: false,
        config: {}
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]'
        }
      },
      'postcss-rpx-transform': {
        enable: true,
        config: {
          viewportWidth: 750
        }
      }
    },
    devServer: {
      port: 10086,
      host: 'localhost'
    }
  },
  app: {
    output: {
      ios: 'ios',
      android: 'android'
    }
  }
}

module.exports = function (merge) {
  if (process.env.NODE_ENV === 'development') {
    return merge({}, config, require('./dev'))
  }
  return merge({}, config, require('./prod'))
}