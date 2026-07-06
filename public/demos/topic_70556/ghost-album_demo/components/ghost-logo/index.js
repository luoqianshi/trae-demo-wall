Component({
  properties: {
    size: {
      type: Number,
      value: 128
    },
    glow: {
      type: Boolean,
      value: false
    }
  },
  data: {
    height: 154
  },
  observers: {
    size: function (size) {
      this.setData({
        height: Math.round(size * 1.2)
      });
    }
  }
});
