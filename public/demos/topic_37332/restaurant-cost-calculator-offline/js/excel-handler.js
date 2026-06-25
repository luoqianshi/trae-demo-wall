// ==================== Excel 上传解析（支持列名映射配置）====================

class ExcelHandler {
  constructor() {
    this.materials = [];
    this.sales = [];

    // 默认列名映射配置
    this.DEFAULT_COLUMN_MAP = {
      materials: {
        material_id: ['材料ID', 'material_id', '材料编号', '物料ID'],
        name: ['材料名称', 'name', '物料名称', '材料名', '名称'],
        unit: ['单位', 'unit', '计量单位'],
        unit_cost: ['单位成本', 'unit_cost', '成本', '单价', '单位成本(元)', '成本(元)'],
        supplier: ['供应商', 'supplier', '供货方']
      },
      sales: {
        date: ['日期', 'date', '时间', '销售日期', 'Date'],
        product_id: ['产品ID', 'product_id', '产品编号', '商品ID', 'Product ID'],
        quantity: ['数量', 'quantity', '销量', '杯数', 'Quantity'],
        revenue: ['收入', 'revenue', '销售额', '金额', '收入(元)', '销售额(元)', 'Revenue'],
        channel: ['渠道', 'channel', '销售方式', '平台', 'Channel', '来源']
      }
    };

    // 加载已保存的映射配置
    this.columnMap = this.loadColumnMap();
  }

  // 从 localStorage 加载列名映射
  loadColumnMap() {
    try {
      const saved = localStorage.getItem('excel_column_map');
      if (saved) {
        const parsed = JSON.parse(saved);
        // 合并已保存的配置与默认配置（防止新增字段丢失）
        return this.mergeColumnMap(this.DEFAULT_COLUMN_MAP, parsed);
      }
    } catch (e) {
      console.warn('加载列名映射配置失败:', e);
    }
    return JSON.parse(JSON.stringify(this.DEFAULT_COLUMN_MAP));
  }

  // 合并列名映射（以已保存的为主，默认补充缺失字段）
  mergeColumnMap(defaultMap, savedMap) {
    const merged = { materials: {}, sales: {} };

    ['materials', 'sales'].forEach(type => {
      const defaultFields = defaultMap[type];
      const savedFields = savedMap[type] || {};

      Object.keys(defaultFields).forEach(field => {
        if (savedFields[field] && Array.isArray(savedFields[field]) && savedFields[field].length > 0) {
          merged[type][field] = [...savedFields[field]];
        } else {
          merged[type][field] = [...defaultFields[field]];
        }
      });
    });

    return merged;
  }

  // 保存列名映射到 localStorage
  saveColumnMap() {
    try {
      localStorage.setItem('excel_column_map', JSON.stringify(this.columnMap));
    } catch (e) {
      console.warn('保存列名映射配置失败:', e);
    }
  }

  // 设置列名映射
  setColumnMap(newMap) {
    this.columnMap = this.mergeColumnMap(this.DEFAULT_COLUMN_MAP, newMap);
    this.saveColumnMap();
  }

  // 重置为默认映射
  resetColumnMap() {
    this.columnMap = JSON.parse(JSON.stringify(this.DEFAULT_COLUMN_MAP));
    this.saveColumnMap();
  }

  // 根据映射查找列值（尝试多个可能的列名）
  findColumnValue(row, field, type) {
    const candidates = this.columnMap[type][field];
    if (!candidates) return undefined;

    for (const colName of candidates) {
      if (row[colName] !== undefined && row[colName] !== null && row[colName] !== '') {
        return row[colName];
      }
    }
    return undefined;
  }

  // 解析材料成本Excel
  async parseMaterialsFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          this.materials = jsonData.map((row, index) => ({
            material_id: this.findColumnValue(row, 'material_id', 'materials') || `M${String(index + 1).padStart(3, '0')}`,
            name: this.findColumnValue(row, 'name', 'materials') || '',
            unit: this.findColumnValue(row, 'unit', 'materials') || '',
            unit_cost: parseFloat(this.findColumnValue(row, 'unit_cost', 'materials') || 0),
            supplier: this.findColumnValue(row, 'supplier', 'materials') || ''
          })).filter(m => m.name && m.unit_cost > 0);

          resolve(this.materials);
        } catch (error) {
          reject(new Error('材料成本文件解析失败: ' + error.message));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  }

  // 解析销售数据Excel
  async parseSalesFile(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const jsonData = XLSX.utils.sheet_to_json(firstSheet);

          this.sales = jsonData.map(row => ({
            date: this.formatDate(this.findColumnValue(row, 'date', 'sales')),
            product_id: this.findColumnValue(row, 'product_id', 'sales') || '',
            quantity: parseInt(this.findColumnValue(row, 'quantity', 'sales') || 0),
            revenue: parseFloat(this.findColumnValue(row, 'revenue', 'sales') || 0),
            channel: this.findColumnValue(row, 'channel', 'sales') || '到店取餐'
          })).filter(s => s.date && s.product_id && s.quantity > 0);

          resolve(this.sales);
        } catch (error) {
          reject(new Error('销售数据文件解析失败: ' + error.message));
        }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  }

  // 格式化日期
  formatDate(dateValue) {
    if (!dateValue) return '';

    // 处理Excel序列号日期
    if (typeof dateValue === 'number') {
      const epoch = new Date(1899, 11, 30);
      const date = new Date(epoch.getTime() + dateValue * 24 * 60 * 60 * 1000);
      return date.toISOString().split('T')[0];
    }

    // 处理字符串日期
    if (typeof dateValue === 'string') {
      const date = new Date(dateValue);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0];
      }
    }

    return '';
  }

  // 导出Excel模板
  exportTemplate(type) {
    let data, headers, filename;

    if (type === 'materials') {
      headers = ['材料ID', '材料名称', '单位', '单位成本(元)', '供应商'];
      data = [
        ['M001', '咖啡豆', 'g', 0.15, '星巴克烘焙工坊'],
        ['M002', '牛奶', 'ml', 0.012, '蒙牛乳业'],
        ['M003', '糖浆', 'ml', 0.05, '莫林糖浆']
      ];
      filename = '材料成本模板.xlsx';
    } else if (type === 'sales') {
      headers = ['日期', '产品ID', '数量', '收入(元)', '渠道'];
      data = [
        ['2026-05-01', 'P001', 10, 320, '到店取餐'],
        ['2026-05-01', 'P002', 5, 140, '美团外卖'],
        ['2026-05-02', 'P001', 8, 256, '微信小程序']
      ];
      filename = '销售数据模板.xlsx';
    } else {
      return;
    }

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    XLSX.writeFile(wb, filename);
  }

  // 导出计算结果
  exportResults(results, filename = '成本核算结果.xlsx') {
    const headers = ['周期', '产品名称', '销售数量', '销售收入(元)', '成本(元)', '毛利(元)', '毛利率(%)'];
    const data = results.map(r => [
      r.period || r.date || r.weekStart || r.month,
      r.name || '-',
      r.quantity || r.totalUnits || 0,
      r.revenue || r.totalRevenue || 0,
      r.cost || r.totalCost || 0,
      r.grossProfit || 0,
      (r.profitMargin || 0).toFixed(2)
    ]);

    const ws = XLSX.utils.aoa_to_sheet([headers, ...data]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '核算结果');
    XLSX.writeFile(wb, filename);
  }
}

// 导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ExcelHandler;
}
