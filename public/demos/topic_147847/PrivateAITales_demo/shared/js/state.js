var UserState = {
  data: null,
  
  init: function() {
    var forceReset = window.location.href.indexOf('?reset') !== -1 || window.location.href.indexOf('&reset') !== -1;
    if (forceReset) {
      localStorage.removeItem('sishu_tales_user');
      console.log('[状态管理] ?reset 参数检测到，已清除缓存');
    }
    var saved = localStorage.getItem('sishu_tales_user');
    if (saved) {
      this.data = JSON.parse(saved);
    } else {
      this.data = this.getDefault();
    }
    console.log('[状态管理] 初始化完成 | 孩子姓名:', this.data.child.name, '| 年龄:', this.data.child.age);
  },
  
  getDefault: function() {
    return {
      parent: {
        name: '',
        role: '妈妈'
      },
      child: {
        name: '小明',
        age: 5,
        character: '活泼好奇',
        interest: '恐龙',
        reading: '初学'
      },
      values: ['诚实', '勇敢', '善良'],
      focusAreas: ['品德'],
      anxieties: [],
      onboardingComplete: false,
      currentBook: null,
      readingHistory: []
    };
  },
  
  save: function() {
    localStorage.setItem('sishu_tales_user', JSON.stringify(this.data));
  },
  
  updateOnboarding: function(data) {
    this.data.anxieties = data.anxieties || [];
    var defaultChild = this.getDefault().child;
    if (data.child && data.child.name) {
      this.data.child = {
        name: data.child.name || defaultChild.name,
        age: data.child.age || defaultChild.age,
        character: data.child.character || defaultChild.character,
        interest: data.child.interest || defaultChild.interest,
        reading: data.child.reading || defaultChild.reading
      };
    }
    this.data.values = (data.values && data.values.length) ? data.values : this.data.values;
    this.data.focusAreas = (data.focusAreas && data.focusAreas.length) ? data.focusAreas : this.data.focusAreas;
    this.data.onboardingComplete = true;
    this.save();
    console.log('[状态管理] 拜师收徒完成 | 孩子:', this.data.child.name, '| 价值观:', this.data.values.join('、'));
  },
  
  setCurrentBook: function(book) {
    this.data.currentBook = book;
    this.save();
  },
  
  addReadingRecord: function(bookId, pagesRead) {
    this.data.readingHistory.push({
      bookId: bookId,
      pagesRead: pagesRead,
      readAt: new Date().toISOString()
    });
    this.save();
  },
  
  reset: function() {
    this.data = this.getDefault();
    localStorage.removeItem('sishu_tales_user');
  },
  
  getParentAddress: function() {
    return this.data.child.name + '妈妈';
  },
  
  getChildAddress: function() {
    return this.data.child.name;
  },
  
  getChildInterest: function() {
    return this.data.child.interest;
  },
  
  getChildAge: function() {
    return this.data.child.age;
  },
  
  getValues: function() {
    return this.data.values;
  },
  
  isOnboardingComplete: function() {
    return this.data.onboardingComplete;
  }
};

UserState.init();