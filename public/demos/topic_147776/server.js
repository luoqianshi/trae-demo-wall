const express = require('express');
const initSqlJs = require('sql.js');
const WebSocket = require('ws');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

let db;
let SQL;
let wss;

// 维度数据缓存
const dimensionData = {
  salespersons: [],
  customers: [],
  products: [],
  regions: [],
  categories: [],
  industries: []
};

// 初始化数据库
async function initDatabase() {
  SQL = await initSqlJs();
  const dbPath = path.join(__dirname, 'data', 'sales.db');
  
  if (!fs.existsSync(dbPath)) {
    console.error('数据库文件不存在,请先运行: node init-db.js');
    process.exit(1);
  }
  
  const buffer = fs.readFileSync(dbPath);
  db = new SQL.Database(buffer);
  
  // 加载维度数据到缓存
  loadDimensionData();
  
  console.log('✓ 数据库加载成功');
}

// 加载维度数据
function loadDimensionData() {
  const salespersonsResult = db.exec('SELECT DISTINCT salesperson_id, salesperson_name, salesperson_region FROM sales');
  if (salespersonsResult.length > 0) {
    dimensionData.salespersons = salespersonsResult[0].values.map(row => ({
      id: row[0],
      name: row[1],
      region: row[2]
    }));
  }
  
  const customersResult = db.exec('SELECT DISTINCT customer_id, customer_name, customer_industry FROM sales');
  if (customersResult.length > 0) {
    dimensionData.customers = customersResult[0].values.map(row => ({
      id: row[0],
      name: row[1],
      industry: row[2]
    }));
  }
  
  const productsResult = db.exec('SELECT DISTINCT product_id, product_name, product_category FROM sales');
  if (productsResult.length > 0) {
    dimensionData.products = productsResult[0].values.map(row => ({
      id: row[0],
      name: row[1],
      category: row[2]
    }));
  }
  
  const regionsResult = db.exec('SELECT DISTINCT region_province, region_city, region FROM sales');
  if (regionsResult.length > 0) {
    dimensionData.regions = regionsResult[0].values.map(row => ({
      province: row[0],
      city: row[1],
      region: row[2]
    }));
  }
  
  const categoriesResult = db.exec('SELECT DISTINCT product_category FROM sales');
  if (categoriesResult.length > 0) {
    dimensionData.categories = categoriesResult[0].values.map(row => row[0]);
  }
  
  const industriesResult = db.exec('SELECT DISTINCT customer_industry FROM sales');
  if (industriesResult.length > 0) {
    dimensionData.industries = industriesResult[0].values.map(row => row[0]);
  }
  
  console.log('✓ 维度数据加载完成');
}

// 保存数据库
function saveDatabase() {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(path.join(__dirname, 'data', 'sales.db'), buffer);
}

// API: 获取维度数据
app.get('/api/dimensions', (req, res) => {
  res.json(dimensionData);
});

// API: 获取销售数据(支持筛选)
app.get('/api/sales', (req, res) => {
  try {
    const filters = req.query;
    let sql = 'SELECT * FROM sales WHERE 1=1';
    const params = [];
    
    // 构建筛选条件
    if (filters.year) {
      sql += ' AND year = ?';
      params.push(parseInt(filters.year));
    }
    if (filters.quarter) {
      sql += ' AND quarter = ?';
      params.push(filters.quarter);
    }
    if (filters.month) {
      sql += ' AND month = ?';
      params.push(parseInt(filters.month));
    }
    if (filters.salesperson) {
      sql += ' AND salesperson_name = ?';
      params.push(filters.salesperson);
    }
    if (filters.customer) {
      sql += ' AND customer_name = ?';
      params.push(filters.customer);
    }
    if (filters.province) {
      sql += ' AND region_province = ?';
      params.push(filters.province);
    }
    if (filters.city) {
      sql += ' AND region_city = ?';
      params.push(filters.city);
    }
    if (filters.productCategory) {
      sql += ' AND product_category = ?';
      params.push(filters.productCategory);
    }
    if (filters.product) {
      sql += ' AND product_name = ?';
      params.push(filters.product);
    }
    if (filters.industry) {
      sql += ' AND customer_industry = ?';
      params.push(filters.industry);
    }
    
    sql += ' ORDER BY date DESC, id DESC';
    
    const result = db.exec(sql, params);
    
    if (result.length === 0) {
      res.json([]);
      return;
    }
    
    const columns = result[0].columns;
    const values = result[0].values;
    
    const sales = values.map(row => {
      const obj = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });
    
    res.json(sales);
  } catch (error) {
    console.error('查询销售数据失败:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

// API: 获取KPI统计
app.get('/api/kpi', (req, res) => {
  try {
    const filters = req.query;
    let sql = `
      SELECT 
        SUM(amount) as total_amount,
        COUNT(*) as order_count,
        COUNT(DISTINCT customer_id) as customer_count,
        AVG(amount) as avg_order_value
      FROM sales WHERE 1=1
    `;
    const params = [];
    
    // 构建筛选条件(与/api/sales相同)
    if (filters.year) {
      sql += ' AND year = ?';
      params.push(parseInt(filters.year));
    }
    if (filters.quarter) {
      sql += ' AND quarter = ?';
      params.push(filters.quarter);
    }
    if (filters.month) {
      sql += ' AND month = ?';
      params.push(parseInt(filters.month));
    }
    if (filters.salesperson) {
      sql += ' AND salesperson_name = ?';
      params.push(filters.salesperson);
    }
    if (filters.customer) {
      sql += ' AND customer_name = ?';
      params.push(filters.customer);
    }
    if (filters.province) {
      sql += ' AND region_province = ?';
      params.push(filters.province);
    }
    if (filters.city) {
      sql += ' AND region_city = ?';
      params.push(filters.city);
    }
    if (filters.productCategory) {
      sql += ' AND product_category = ?';
      params.push(filters.productCategory);
    }
    if (filters.product) {
      sql += ' AND product_name = ?';
      params.push(filters.product);
    }
    if (filters.industry) {
      sql += ' AND customer_industry = ?';
      params.push(filters.industry);
    }
    
    const result = db.exec(sql, params);
    
    if (result.length === 0 || result[0].values.length === 0) {
      res.json({
        total_amount: 0,
        order_count: 0,
        customer_count: 0,
        avg_order_value: 0
      });
      return;
    }
    
    const row = result[0].values[0];
    res.json({
      total_amount: row[0] || 0,
      order_count: row[1] || 0,
      customer_count: row[2] || 0,
      avg_order_value: row[3] || 0
    });
  } catch (error) {
    console.error('查询KPI失败:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

// WebSocket 连接
function setupWebSocket() {
  wss = new WebSocket.Server({ port: 8080 });
  
  wss.on('connection', (ws) => {
    console.log('✓ 新的WebSocket连接');
    
    ws.on('message', (message) => {
      try {
        const data = JSON.parse(message);
        console.log('收到消息:', data);
        
        if (data.type === 'generate_sales') {
          // 生成新的销售数据
          generateSalesData(data.count || 1);
        }
      } catch (error) {
        console.error('处理WebSocket消息失败:', error);
      }
    });
    
    ws.on('close', () => {
      console.log('✗ WebSocket连接关闭');
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket错误:', error);
    });
  });
  
  console.log('✓ WebSocket服务器启动在 ws://localhost:8080');
}

// 生成模拟销售数据
function generateSalesData(count = 1) {
  const salespersons = dimensionData.salespersons;
  const customers = dimensionData.customers;
  const products = dimensionData.products;
  const regions = dimensionData.regions;
  
  const newSales = [];
  
  for (let i = 0; i < count; i++) {
    // 随机选择维度
    const salesperson = salespersons[Math.floor(Math.random() * salespersons.length)];
    const customer = customers[Math.floor(Math.random() * customers.length)];
    const product = products[Math.floor(Math.random() * products.length)];
    const region = regions[Math.floor(Math.random() * regions.length)];
    
    // 生成当前时间的销售记录
    const now = new Date();
    const date = now.toISOString().split('T')[0];
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const quarter = `Q${Math.ceil(month / 3)}`;
    
    // 随机金额和数量
    const basePrice = 1000 + Math.random() * 50000;
    const quantity = Math.floor(1 + Math.random() * 100);
    const amount = basePrice * quantity;
    
    const sale = {
      date,
      year,
      quarter,
      month,
      salesperson_id: salesperson.id,
      salesperson_name: salesperson.name,
      salesperson_region: salesperson.region,
      customer_id: customer.id,
      customer_name: customer.name,
      customer_industry: customer.industry,
      region_province: region.province,
      region_city: region.city,
      region: region.region,
      product_id: product.id,
      product_name: product.name,
      product_category: product.category,
      amount: Math.round(amount * 100) / 100,
      quantity
    };
    
    // 插入数据库
    db.run(`
      INSERT INTO sales (
        date, year, quarter, month,
        salesperson_id, salesperson_name, salesperson_region,
        customer_id, customer_name, customer_industry,
        region_province, region_city, region,
        product_id, product_name, product_category,
        amount, quantity
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      sale.date, sale.year, sale.quarter, sale.month,
      sale.salesperson_id, sale.salesperson_name, sale.salesperson_region,
      sale.customer_id, sale.customer_name, sale.customer_industry,
      sale.region_province, sale.region_city, sale.region,
      sale.product_id, sale.product_name, sale.product_category,
      sale.amount, sale.quantity
    ]);
    
    newSales.push(sale);
  }
  
  // 保存数据库
  saveDatabase();
  
  // 广播给所有WebSocket客户端
  broadcastUpdate(newSales);
  
  console.log(`✓ 生成了 ${count} 条新销售数据`);
}

// 广播数据更新
function broadcastUpdate(newSales) {
  if (wss) {
    const message = JSON.stringify({
      type: 'sales_update',
      data: newSales,
      timestamp: new Date().toISOString()
    });
    
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }
}

// 定时生成数据(每5秒)
function startAutoGeneration() {
  setInterval(() => {
    generateSalesData(Math.floor(1 + Math.random() * 3)); // 每次生成1-3条
  }, 5000);
  
  console.log('✓ 自动数据生成已启动(每5秒)');
}

// 启动服务器
async function start() {
  try {
    await initDatabase();
    setupWebSocket();
    
    app.listen(PORT, () => {
      console.log(`\n========================================`);
      console.log(`✓ 服务器启动成功!`);
      console.log(`✓ HTTP API: http://localhost:${PORT}`);
      console.log(`✓ WebSocket: ws://localhost:8080`);
      console.log(`✓ 前端页面: http://localhost:${PORT}`);
      console.log(`========================================\n`);
      
      // 启动自动生成
      startAutoGeneration();
    });
  } catch (error) {
    console.error('启动失败:', error);
    process.exit(1);
  }
}

start();
