Component({
  properties: {
    duration: { type: Number, value: 0 },
    src: { type: String, value: '' }
  },

  data: {
    isPlaying: false
  },

  methods: {
    play() {
      const next = !this.data.isPlaying;
      this.setData({ isPlaying: next });
      if (next) {
        setTimeout(() => this.setData({ isPlaying: false }), Math.max(this.data.duration, 1) * 1000);
      }
    }
  }
});
