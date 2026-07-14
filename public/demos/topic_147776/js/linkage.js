/**
 * 联动与钻取引擎
 * 管理全局筛选状态、数据过滤聚合、钻取层级
 */

class LinkageEngine {
  constructor() {
    this.originalData = [];
    this.filterState = {
      year: null,
      quarter: null,
      month: null,
      salesperson: null,
      customer: null,
      province: null,
      city: null,
      productCategory: null,
      product: null
    };
    this.drillPath = [];
    this.listeners = [];
  }

  setData(data) {
    this.originalData = data;
  }

  addListener(callback) {
    this.listeners.push(callback);
  }

  notifyListeners() {
    const filteredData = this.getFilteredData();
    this.listeners.forEach(callback => callback(filteredData, this.filterState));
  }

  updateFilter(dimension, value) {
    if (value === null || value === undefined || value === '') {
      this.filterState[dimension] = null;
    } else {
      this.filterState[dimension] = value;
    }
    this.notifyListeners();
  }

  clearFilter(dimension) {
    this.filterState[dimension] = null;
    this.notifyListeners();
  }

  resetAllFilters() {
    Object.keys(this.filterState).forEach(key => {
      this.filterState[key] = null;
    });
    this.drillPath = [];
    this.notifyListeners();
  }

  getFilteredData() {
    return this.originalData.filter(record => {
      if (this.filterState.year && record.year !== this.filterState.year) return false;
      if (this.filterState.quarter && record.quarter !== this.filterState.quarter) return false;
      if (this.filterState.month && record.month !== this.filterState.month) return false;
      if (this.filterState.salesperson && record.salesperson_name !== this.filterState.salesperson) return false;
      if (this.filterState.customer && record.customer_name !== this.filterState.customer) return false;
      if (this.filterState.province && record.region_province !== this.filterState.province) return false;
      if (this.filterState.city && record.region_city !== this.filterState.city) return false;
      if (this.filterState.productCategory && record.product_category !== this.filterState.productCategory) return false;
      if (this.filterState.product && record.product_name !== this.filterState.product) return false;
      return true;
    });
  }

  drillDown(dimension, value) {
    this.drillPath.push({ dimension, value });
    this.updateFilter(dimension, value);
  }

  drillUp(level) {
    this.drillPath = this.drillPath.slice(0, level);
    const newFilterState = {
      year: null,
      quarter: null,
      month: null,
      salesperson: null,
      customer: null,
      province: null,
      city: null,
      productCategory: null,
      product: null
    };
    this.drillPath.forEach(item => {
      newFilterState[item.dimension] = item.value;
    });
    this.filterState = newFilterState;
    this.notifyListeners();
  }

  getDrillPath() {
    return this.drillPath;
  }

  aggregateBy(data, dimension) {
    const result = {};
    data.forEach(record => {
      const key = record[dimension];
      if (!result[key]) {
        result[key] = {
          name: key,
          amount: 0,
          quantity: 0,
          count: 0
        };
      }
      result[key].amount += record.amount;
      result[key].quantity += record.quantity;
      result[key].count += 1;
    });
    return Object.values(result).sort((a, b) => b.amount - a.amount);
  }

  aggregateByMultiple(data, dimensions) {
    const result = {};
    data.forEach(record => {
      const key = dimensions.map(d => record[d]).join('|');
      if (!result[key]) {
        const obj = { amount: 0, quantity: 0, count: 0 };
        dimensions.forEach(d => {
          obj[d] = record[d];
        });
        result[key] = obj;
      }
      result[key].amount += record.amount;
      result[key].quantity += record.quantity;
      result[key].count += 1;
    });
    return Object.values(result).sort((a, b) => b.amount - a.amount);
  }

  calculateKPIs(data) {
    const totalAmount = data.reduce((sum, r) => sum + r.amount, 0);
    const totalQuantity = data.reduce((sum, r) => sum + r.quantity, 0);
    const uniqueCustomers = new Set(data.map(r => r.customer_id)).size;
    const avgOrderValue = data.length > 0 ? totalAmount / data.length : 0;

    return {
      totalAmount,
      totalQuantity,
      orderCount: data.length,
      customerCount: uniqueCustomers,
      avgOrderValue
    };
  }

  calculateYoY(data, currentYear, previousYear) {
    const currentData = data.filter(r => r.year === currentYear);
    const previousData = data.filter(r => r.year === previousYear);

    const currentAmount = currentData.reduce((sum, r) => sum + r.amount, 0);
    const previousAmount = previousData.reduce((sum, r) => sum + r.amount, 0);

    const growth = previousAmount > 0
      ? ((currentAmount - previousAmount) / previousAmount * 100).toFixed(2)
      : 0;

    return {
      currentAmount,
      previousAmount,
      growth: parseFloat(growth)
    };
  }
}

window.LinkageEngine = LinkageEngine;
