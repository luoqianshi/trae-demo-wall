Component({
  properties: {
    tags: { type: Array, value: [] },
    selected: { type: Array, value: [] },
    type: { type: String, value: 'default' }
  },

  data: {
    displayTags: []
  },

  lifetimes: {
    attached() {
      this.refreshDisplayTags();
    }
  },

  observers: {
    'tags, selected': function() {
      this.refreshDisplayTags();
    }
  },

  methods: {
    refreshDisplayTags() {
      const selected = this.data.selected || [];
      const displayTags = (this.data.tags || []).map(name => ({
        name,
        selected: selected.indexOf(name) > -1
      }));
      this.setData({ displayTags });
    },

    toggleTag(e) {
      const name = e.currentTarget.dataset.name;
      const selected = [...(this.data.selected || [])];
      const index = selected.indexOf(name);
      if (index > -1) selected.splice(index, 1);
      else selected.push(name);
      this.setData({ selected });
      this.refreshDisplayTags();
      this.triggerEvent('change', { selected });
    }
  }
});
