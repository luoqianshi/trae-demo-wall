import { SCENES } from '../../utils/constants';

Component({
  properties: {
    value: {
      type: String,
      value: ''
    }
  },

  data: {
    scenes: SCENES
  },

  methods: {
    onSelect(e) {
      const { id } = e.currentTarget.dataset;
      this.setData({ value: id });
      this.triggerEvent('change', { value: id });
    }
  }
});
