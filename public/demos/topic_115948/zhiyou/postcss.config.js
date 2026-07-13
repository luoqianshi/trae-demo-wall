module.exports = {
  plugins: {
    'postcss-rpx-transform': {
      viewportWidth: 750,
      unitPrecision: 5,
      propList: ['*'],
      selectorBlackList: [],
      replace: true,
      minValue: 0,
      mediaQuery: false,
      exclude: null,
      transformUnit: 'vw'
    }
  }
}