window.cosData = {
  getCards: function() {
    return Promise.resolve(window.DemoData && window.DemoData.cards ? window.DemoData.cards : []);
  },

  getCategories: function() {
    return Promise.resolve(window.DemoData && window.DemoData.categories ? window.DemoData.categories : []);
  },

  getAudioUrl: function(char) {
    return 'https://dict.youdao.com/dictvoice?audio=' + encodeURIComponent(char) + '&type=1';
  },

  getStorybooks: function() {
    return Promise.resolve(window.DemoData && window.DemoData.storybooks ? window.DemoData.storybooks : []);
  },

  getPinyinData: function() {
    return Promise.resolve(window.DemoData && window.DemoData.pinyin ? window.DemoData.pinyin : {});
  }
};
