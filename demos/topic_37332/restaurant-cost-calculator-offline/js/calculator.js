// ==================== 成本核算引擎 ====================

class CostCalculator {
  constructor(materials, recipes, sales) {
    this.materials = materials;
    this.recipes = recipes;
    this.sales = sales;
    this.materialMap = new Map(materials.map(m => [m.material_id, m]));
    this.recipeMap = new Map(recipes.map(r => [r.product_id, r]));
  }

  // 计算单杯成本
  calculateUnitCost(productId) {
    const recipe = this.recipeMap.get(productId);
    if (!recipe) return 0;
    
    let cost = 0;
    for (const ing of recipe.ingredients) {
      const material = this.materialMap.get(ing.material_id);
      if (material) {
        cost += material.unit_cost * ing.amount;
      }
    }
    return Math.round(cost * 100) / 100;
  }

  // 计算所有产品的单杯成本
  getAllUnitCosts() {
    const costs = {};
    this.recipes.forEach(recipe => {
      costs[recipe.product_id] = {
        name: recipe.name,
        price: recipe.price,
        unitCost: this.calculateUnitCost(recipe.product_id),
        profit: recipe.price - this.calculateUnitCost(recipe.product_id)
      };
    });
    return costs;
  }

  // 按日期聚合
  aggregateByDay() {
    const daily = {};
    
    this.sales.forEach(sale => {
      if (!daily[sale.date]) {
        daily[sale.date] = {
          date: sale.date,
          totalRevenue: 0,
          totalCost: 0,
          totalUnits: 0,
          products: {}
        };
      }
      
      const day = daily[sale.date];
      const unitCost = this.calculateUnitCost(sale.product_id);
      const totalCost = unitCost * sale.quantity;
      
      day.totalRevenue += sale.revenue;
      day.totalCost += totalCost;
      day.totalUnits += sale.quantity;
      
      if (!day.products[sale.product_id]) {
        const recipe = this.recipeMap.get(sale.product_id);
        day.products[sale.product_id] = {
          productId: sale.product_id,
          name: recipe.name,
          quantity: 0,
          revenue: 0,
          cost: 0
        };
      }
      
      day.products[sale.product_id].quantity += sale.quantity;
      day.products[sale.product_id].revenue += sale.revenue;
      day.products[sale.product_id].cost += totalCost;
    });
    
    // 计算利润并排序
    return Object.values(daily).map(day => {
      day.grossProfit = day.totalRevenue - day.totalCost;
      day.profitMargin = day.totalRevenue > 0 ? (day.grossProfit / day.totalRevenue * 100) : 0;
      day.products = Object.values(day.products);
      return day;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }

  // 按周聚合
  aggregateByWeek() {
    const weekly = {};
    
    this.sales.forEach(sale => {
      const date = new Date(sale.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay() + 1); // 周一为周开始
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weekly[weekKey]) {
        weekly[weekKey] = {
          weekStart: weekKey,
          totalRevenue: 0,
          totalCost: 0,
          totalUnits: 0,
          products: {}
        };
      }
      
      const week = weekly[weekKey];
      const unitCost = this.calculateUnitCost(sale.product_id);
      const totalCost = unitCost * sale.quantity;
      
      week.totalRevenue += sale.revenue;
      week.totalCost += totalCost;
      week.totalUnits += sale.quantity;
      
      if (!week.products[sale.product_id]) {
        const recipe = this.recipeMap.get(sale.product_id);
        week.products[sale.product_id] = {
          productId: sale.product_id,
          name: recipe.name,
          quantity: 0,
          revenue: 0,
          cost: 0
        };
      }
      
      week.products[sale.product_id].quantity += sale.quantity;
      week.products[sale.product_id].revenue += sale.revenue;
      week.products[sale.product_id].cost += totalCost;
    });
    
    return Object.values(weekly).map(week => {
      week.grossProfit = week.totalRevenue - week.totalCost;
      week.profitMargin = week.totalRevenue > 0 ? (week.grossProfit / week.totalRevenue * 100) : 0;
      week.products = Object.values(week.products);
      return week;
    }).sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  }

  // 按月聚合
  aggregateByMonth() {
    const monthly = {};
    
    this.sales.forEach(sale => {
      const monthKey = sale.date.substring(0, 7); // YYYY-MM
      
      if (!monthly[monthKey]) {
        monthly[monthKey] = {
          month: monthKey,
          totalRevenue: 0,
          totalCost: 0,
          totalUnits: 0,
          products: {}
        };
      }
      
      const month = monthly[monthKey];
      const unitCost = this.calculateUnitCost(sale.product_id);
      const totalCost = unitCost * sale.quantity;
      
      month.totalRevenue += sale.revenue;
      month.totalCost += totalCost;
      month.totalUnits += sale.quantity;
      
      if (!month.products[sale.product_id]) {
        const recipe = this.recipeMap.get(sale.product_id);
        month.products[sale.product_id] = {
          productId: sale.product_id,
          name: recipe.name,
          quantity: 0,
          revenue: 0,
          cost: 0
        };
      }
      
      month.products[sale.product_id].quantity += sale.quantity;
      month.products[sale.product_id].revenue += sale.revenue;
      month.products[sale.product_id].cost += totalCost;
    });
    
    return Object.values(monthly).map(month => {
      month.grossProfit = month.totalRevenue - month.totalCost;
      month.profitMargin = month.totalRevenue > 0 ? (month.grossProfit / month.totalRevenue * 100) : 0;
      month.products = Object.values(month.products);
      return month;
    }).sort((a, b) => a.month.localeCompare(b.month));
  }

  // 按产品聚合（总计）
  aggregateByProduct() {
    const productStats = {};
    
    this.sales.forEach(sale => {
      if (!productStats[sale.product_id]) {
        const recipe = this.recipeMap.get(sale.product_id);
        productStats[sale.product_id] = {
          productId: sale.product_id,
          name: recipe.name,
          category: recipe.category,
          price: recipe.price,
          unitCost: this.calculateUnitCost(sale.product_id),
          quantity: 0,
          revenue: 0,
          cost: 0
        };
      }
      
      const stat = productStats[sale.product_id];
      const unitCost = this.calculateUnitCost(sale.product_id);
      
      stat.quantity += sale.quantity;
      stat.revenue += sale.revenue;
      stat.cost += unitCost * sale.quantity;
    });
    
    return Object.values(productStats).map(stat => {
      stat.grossProfit = stat.revenue - stat.cost;
      stat.profitMargin = stat.revenue > 0 ? (stat.grossProfit / stat.revenue * 100) : 0;
      stat.profitPerUnit = stat.price - stat.unitCost;
      return stat;
    }).sort((a, b) => b.grossProfit - a.grossProfit);
  }

  // 按线上渠道聚合
  aggregateByOnlineChannel() {
    const channelStats = {};
    const onlineChannels = ['美团外卖', '淘宝闪购', '微信小程序'];

    onlineChannels.forEach(ch => {
      channelStats[ch] = { revenue: 0, cost: 0, quantity: 0 };
    });

    this.sales.forEach(sale => {
      if (onlineChannels.includes(sale.channel)) {
        const unitCost = this.calculateUnitCost(sale.product_id);
        const totalCost = unitCost * sale.quantity;

        channelStats[sale.channel].revenue += sale.revenue;
        channelStats[sale.channel].cost += totalCost;
        channelStats[sale.channel].quantity += sale.quantity;
      }
    });

    // 四舍五入
    onlineChannels.forEach(ch => {
      channelStats[ch].revenue = Math.round(channelStats[ch].revenue * 100) / 100;
      channelStats[ch].cost = Math.round(channelStats[ch].cost * 100) / 100;
    });

    return channelStats;
  }

  // 按线下渠道聚合
  aggregateByOfflineChannel() {
    const channelStats = {};
    const offlineChannels = ['到店取餐'];

    offlineChannels.forEach(ch => {
      channelStats[ch] = { revenue: 0, cost: 0, quantity: 0 };
    });

    this.sales.forEach(sale => {
      if (offlineChannels.includes(sale.channel)) {
        const unitCost = this.calculateUnitCost(sale.product_id);
        const totalCost = unitCost * sale.quantity;

        channelStats[sale.channel].revenue += sale.revenue;
        channelStats[sale.channel].cost += totalCost;
        channelStats[sale.channel].quantity += sale.quantity;
      }
    });

    // 四舍五入
    offlineChannels.forEach(ch => {
      channelStats[ch].revenue = Math.round(channelStats[ch].revenue * 100) / 100;
      channelStats[ch].cost = Math.round(channelStats[ch].cost * 100) / 100;
    });

    return channelStats;
  }

  // 获取总体KPI
  getKPIs() {
    const totalRevenue = this.sales.reduce((sum, s) => sum + s.revenue, 0);
    const totalCost = this.sales.reduce((sum, s) => {
      return sum + this.calculateUnitCost(s.product_id) * s.quantity;
    }, 0);
    const totalUnits = this.sales.reduce((sum, s) => sum + s.quantity, 0);
    const grossProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? (grossProfit / totalRevenue * 100) : 0;

    return {
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      totalCost: Math.round(totalCost * 100) / 100,
      grossProfit: Math.round(grossProfit * 100) / 100,
      profitMargin: Math.round(profitMargin * 100) / 100,
      totalUnits: totalUnits
    };
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CostCalculator;
}
