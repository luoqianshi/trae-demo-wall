import {
  createMockItems,
  createMockSubs,
  daysBetween,
  cycleToMonths,
  monthlyAmount,
  cycleToDays,
  addDays,
  newId,
} from './data.js';

export const store = {
  state: {
    currentPage: 'login',
    prevPage: '',
    items: [],
    subs: [],
    keyword: '',
    userInfo: { nickname: '生活管家' },
    // sheet / action sheet
    typeSheetVisible: false,
    itemSheetVisible: false,
    subSheetVisible: false,
    actionVisible: false,
    actionTarget: null,
    actionItems: [],
    // form cache
    editingItem: null,
    editingSub: null,
  },

  initData() {
    this.state.items = createMockItems();
    this.state.subs = createMockSubs();
  },

  setPage(page) {
    this.state.prevPage = this.state.currentPage;
    this.state.currentPage = page;
  },

  setKeyword(kw) {
    this.state.keyword = kw;
  },

  // items
  addItem(item) {
    this.state.items.unshift({ ...item, id: newId() });
  },
  updateItem(item) {
    const idx = this.state.items.findIndex((i) => i.id === item.id);
    if (idx >= 0) this.state.items.splice(idx, 1, { ...item });
  },
  deleteItem(id) {
    this.state.items = this.state.items.filter((i) => i.id !== id);
  },
  extendItem(id, days = 30) {
    const item = this.state.items.find((i) => i.id === id);
    if (item && item.dueDate) {
      item.dueDate = addDays(item.dueDate, days);
    }
  },

  // subs
  addSub(sub) {
    this.state.subs.unshift({ ...sub, id: newId() });
  },
  updateSub(sub) {
    const idx = this.state.subs.findIndex((s) => s.id === sub.id);
    if (idx >= 0) this.state.subs.splice(idx, 1, { ...sub });
  },
  deleteSub(id) {
    this.state.subs = this.state.subs.filter((s) => s.id !== id);
  },
  renewSub(id) {
    const sub = this.state.subs.find((s) => s.id === id);
    if (sub && sub.renewDate) {
      sub.renewDate = addDays(sub.renewDate, cycleToDays(sub.cycle));
    }
  },

  // getters
  get filteredItems() {
    const kw = this.state.keyword.trim().toLowerCase();
    if (!kw) return this.state.items;
    return this.state.items.filter(
      (i) =>
        i.name.toLowerCase().includes(kw) ||
        (i.category && i.category.toLowerCase().includes(kw)) ||
        (i.location && i.location.toLowerCase().includes(kw))
    );
  },

  get filteredSubs() {
    const kw = this.state.keyword.trim().toLowerCase();
    if (!kw) return this.state.subs;
    return this.state.subs.filter(
      (s) =>
        s.name.toLowerCase().includes(kw) ||
        (s.status && s.status.toLowerCase().includes(kw)) ||
        (s.paymentMethod && s.paymentMethod.toLowerCase().includes(kw))
    );
  },

  get monthly() {
    return Math.round(
      this.state.subs
        .filter((s) => s.status !== '已取消')
        .reduce((sum, s) => sum + Number(s.amount || 0) / cycleToMonths(s.cycle), 0)
    );
  },

  get yearly() {
    return this.monthly * 12;
  },

  get activeCount() {
    return this.state.subs.filter((s) => s.status !== '已取消').length;
  },

  get overview() {
    const soonItems = this.state.items.filter((i) => {
      const d = daysBetween(i.dueDate);
      return d !== null && d >= 0 && d <= 30;
    }).length;
    const soonSubs = this.state.subs.filter((s) => {
      const d = daysBetween(s.renewDate);
      return s.status !== '已取消' && d !== null && d >= 0 && d <= 30;
    }).length;
    return {
      itemCount: this.state.items.length,
      subCount: this.state.subs.length,
      monthlyTotal: this.monthly,
      soonCount: soonItems + soonSubs,
    };
  },

  get remindSummary() {
    let in7Days = 0;
    let overdue = 0;
    let today = 0;
    this.state.items.forEach((i) => {
      const d = daysBetween(i.dueDate);
      if (d === null) return;
      if (d < 0) overdue += 1;
      else if (d === 0) today += 1;
      else if (d <= 7) in7Days += 1;
    });
    this.state.subs.forEach((s) => {
      if (s.status === '已取消') return;
      const d = daysBetween(s.renewDate);
      if (d === null) return;
      if (d < 0) overdue += 1;
      else if (d === 0) today += 1;
      else if (d <= 7) in7Days += 1;
    });
    return { in7Days, overdue, today };
  },

  get remindGroups() {
    const groups = {};
    const add = (title, vo) => {
      if (!groups[title]) groups[title] = [];
      groups[title].push(vo);
    };

    [...this.state.items, ...this.state.subs]
      .filter((vo) => {
        const kw = this.state.keyword.trim().toLowerCase();
        if (!kw) return true;
        return vo.name.toLowerCase().includes(kw);
      })
      .forEach((vo) => {
        const isSub = 'renewDate' in vo;
        const dateKey = isSub ? vo.renewDate : vo.dueDate;
        const d = daysBetween(dateKey);
        if (d === null) return;
        if (d < 0) add('已过期', { type: isSub ? 'sub' : 'item', ...vo });
        else if (d === 0) add('今天', { type: isSub ? 'sub' : 'item', ...vo });
        else if (d <= 7) add('未来 7 天', { type: isSub ? 'sub' : 'item', ...vo });
        else if (d <= 30) add('未来 30 天', { type: isSub ? 'sub' : 'item', ...vo });
      });

    return groups;
  },
};
