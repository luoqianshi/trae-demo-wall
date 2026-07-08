Component({
  properties: {
    icon:    { type: String, value: '📦' },
    title:   { type: String, value: '暂无内容' },
    description: { type: String, value: '' },
    showBtn: { type: Boolean, value: false },
    btnText: { type: String, value: '去创建' }
  },

  methods: {
    onAction() {
      this.triggerEvent('action');
    }
  }
});
