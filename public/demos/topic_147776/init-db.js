const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  console.log('正在初始化数据库...');
  
  // 初始化 SQL.js
  const SQL = await initSqlJs();
  const db = new SQL.Database();
  
  // 创建表结构
  console.log('创建表结构...');
  
  // 销售员表
  db.run(`
    CREATE TABLE IF NOT EXISTS salespersons (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      region TEXT NOT NULL
    )
  `);
  
  // 客户表
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      industry TEXT NOT NULL,
      province TEXT NOT NULL
    )
  `);
  
  // 地区表
  db.run(`
    CREATE TABLE IF NOT EXISTS regions (
      province TEXT PRIMARY KEY,
      cities TEXT NOT NULL,
      region TEXT NOT NULL
    )
  `);
  
  // 商品表
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      price REAL NOT NULL
    )
  `);
  
  // 销售记录表
  db.run(`
    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      year INTEGER NOT NULL,
      quarter TEXT NOT NULL,
      month INTEGER NOT NULL,
      salesperson_id TEXT NOT NULL,
      salesperson_name TEXT NOT NULL,
      salesperson_region TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_industry TEXT NOT NULL,
      region_province TEXT NOT NULL,
      region_city TEXT NOT NULL,
      region TEXT NOT NULL,
      product_id TEXT NOT NULL,
      product_name TEXT NOT NULL,
      product_category TEXT NOT NULL,
      amount REAL NOT NULL,
      quantity INTEGER NOT NULL,
      FOREIGN KEY (salesperson_id) REFERENCES salespersons(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `);
  
  // 创建索引
  console.log('创建索引...');
  db.run('CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(date)');
  db.run('CREATE INDEX IF NOT EXISTS idx_sales_year ON sales(year)');
  db.run('CREATE INDEX IF NOT EXISTS idx_sales_quarter ON sales(quarter)');
  db.run('CREATE INDEX IF NOT EXISTS idx_sales_month ON sales(month)');
  db.run('CREATE INDEX IF NOT EXISTS idx_sales_salesperson ON sales(salesperson_name)');
  db.run('CREATE INDEX IF NOT EXISTS idx_sales_customer ON sales(customer_name)');
  db.run('CREATE INDEX IF NOT EXISTS idx_sales_province ON sales(region_province)');
  db.run('CREATE INDEX IF NOT EXISTS idx_sales_city ON sales(region_city)');
  db.run('CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(product_name)');
  db.run('CREATE INDEX IF NOT EXISTS idx_sales_category ON sales(product_category)');
  db.run('CREATE INDEX IF NOT EXISTS idx_sales_industry ON sales(customer_industry)');
  
  // 从 JSON 文件导入数据
  console.log('从 JSON 文件导入数据...');
  const dataPath = path.join(__dirname, 'data', 'sales_data.json');
  
  if (!fs.existsSync(dataPath)) {
    console.error('错误: 找不到 data/sales_data.json 文件');
    console.log('请先运行: node generate_data.js');
    process.exit(1);
  }
  
  const jsonData = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
  
  // 导入销售员数据
  console.log(`导入 ${jsonData.dimensions.salespersons.length} 个销售员...`);
  jsonData.dimensions.salespersons.forEach(sp => {
    db.run(
      'INSERT OR IGNORE INTO salespersons (id, name, region) VALUES (?, ?, ?)',
      [sp.id, sp.name, sp.region]
    );
  });
  
  // 导入客户数据
  console.log(`导入 ${jsonData.dimensions.customers.length} 个客户...`);
  jsonData.dimensions.customers.forEach(c => {
    db.run(
      'INSERT OR IGNORE INTO customers (id, name, industry, province) VALUES (?, ?, ?, ?)',
      [c.id, c.name, c.industry, c.province]
    );
  });
  
  // 导入地区数据
  console.log(`导入 ${jsonData.dimensions.regions.length} 个地区...`);
  jsonData.dimensions.regions.forEach(r => {
    db.run(
      'INSERT OR IGNORE INTO regions (province, cities, region) VALUES (?, ?, ?)',
      [r.province, JSON.stringify(r.cities), r.region]
    );
  });
  
  // 导入商品数据
  console.log(`导入 ${jsonData.dimensions.products.length} 个商品...`);
  jsonData.dimensions.products.forEach(p => {
    db.run(
      'INSERT OR IGNORE INTO products (id, name, category, price) VALUES (?, ?, ?, ?)',
      [p.id, p.name, p.category, p.price]
    );
  });
  
  // 导入销售记录
  console.log(`导入 ${jsonData.sales.length} 条销售记录...`);
  jsonData.sales.forEach(sale => {
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
  });
  
  // 保存数据库到文件
  const dbPath = path.join(__dirname, 'data', 'sales.db');
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
  
  console.log(`✓ 数据库已保存到: ${dbPath}`);
  console.log(`✓ 文件大小: ${(buffer.length / 1024).toFixed(2)} KB`);
  
  // 验证数据
  const result = db.exec('SELECT COUNT(*) as count FROM sales');
  const count = result[0].values[0][0];
  console.log(`✓ 数据库中共有 ${count} 条销售记录`);
  
  db.close();
  console.log('\n数据库初始化完成!');
}

initDatabase().catch(err => {
  console.error('数据库初始化失败:', err);
  process.exit(1);
});
