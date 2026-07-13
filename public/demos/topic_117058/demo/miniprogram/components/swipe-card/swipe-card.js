Component({
  properties: {
    cards: {
      type: Array,
      value: []
    }
  },

  data: {
    displayCards: [],
    offsetX: 0,
    offsetY: 0,
    rotate: 0,
    opacity: 1,
    startX: 0,
    startY: 0,
    currentIndex: 0,
    moved: false
  },

  lifetimes: {
    attached() {
      this.initCards();
    }
  },

  observers: {
    cards() {
      this.initCards();
    }
  },

  methods: {
    initCards() {
      const cards = (this.data.cards || []).map((card, index) => ({
        ...card,
        zIndex: (this.data.cards || []).length - index,
        isTop: index === 0,
        status: ''
      }));
      this.setData({
        displayCards: cards,
        currentIndex: 0,
        offsetX: 0,
        offsetY: 0,
        rotate: 0,
        opacity: 1
      });
    },

    onTouchStart(e) {
      const touch = e.touches[0];
      this.setData({
        startX: touch.clientX,
        startY: touch.clientY,
        moved: false
      });
    },

    onTouchMove(e) {
      const touch = e.touches[0];
      const offsetX = touch.clientX - this.data.startX;
      const offsetY = touch.clientY - this.data.startY;
      this.setData({
        offsetX,
        offsetY,
        rotate: offsetX * 0.05,
        opacity: 1 - Math.min(Math.abs(offsetX) / 500, 0.35),
        moved: Math.abs(offsetX) > 8 || Math.abs(offsetY) > 8
      });
    },

    onTouchEnd() {
      const { offsetX, offsetY } = this.data;
      const threshold = 100;
      if (offsetX > threshold) this.swipeCard('potato');
      else if (offsetX < -threshold) this.swipeCard('pass');
      else if (offsetY < -threshold) this.onSuperLike();
      else this.resetCard();
    },

    swipeCard(direction) {
      const cards = [...this.data.displayCards];
      if (!cards.length) return;
      const card = cards[0];
      let translateX = 0;
      let translateY = 0;
      if (direction === 'potato') translateX = 560;
      if (direction === 'pass') translateX = -560;
      if (direction === 'super') translateY = -560;

      card.status = 'swiping-' + direction;

      this.setData({
        displayCards: cards,
        offsetX: translateX,
        offsetY: translateY,
        rotate: translateX * 0.04,
        opacity: 0
      });

      this.triggerEvent('swipe', { direction, user: card });

      setTimeout(() => {
        cards.shift();
        const nextCards = cards.map((item, index) => ({
          ...item,
          isTop: index === 0,
          zIndex: cards.length - index,
          status: ''
        }));
        this.setData({
          displayCards: nextCards,
          offsetX: 0,
          offsetY: 0,
          rotate: 0,
          opacity: 1
        });
      }, 350);
    },

    resetCard() {
      this.setData({
        offsetX: 0,
        offsetY: 0,
        rotate: 0,
        opacity: 1
      });
    },

    onLike() {
      this.swipeCard('potato');
    },

    onPass() {
      this.swipeCard('pass');
    },

    onSuperLike() {
      const cards = this.data.displayCards || [];
      if (!cards.length) return;
      this.triggerEvent('superLikeTap', { user: cards[0] });
    },

    onReload() {
      this.triggerEvent('reload');
    },

    openDetail(e) {
      if (this.data.moved) return;
      const userId = e.currentTarget.dataset.userid;
      this.triggerEvent('openDetail', { userId });
    }
  }
});
