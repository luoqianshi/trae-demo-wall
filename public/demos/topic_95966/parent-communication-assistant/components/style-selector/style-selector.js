import { STYLES } from '../../utils/constants';

Component({
  properties: {
    value: {
      type: String,
      value: ''
    }
  },

  data: {
    styles: STYLES
  },

  methods: {
    onSelect(e) {
      const { id } = e.currentTarget.dataset;
      this.setData({ value: id });
      this.triggerEvent('change', { value: id });
    }
  }
});
