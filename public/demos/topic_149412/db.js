/**
 * 数见 - 前端数据库引擎 (Standalone)
 * 基于 sql.js asm 版本，零后端依赖
 */

const ShujianDB = {
  SQL: null,
  db: null,
  metadata: { tables: [], relations: [], version: '1.0' },
  initialized: false,

  // 加载 sql.js asm
  async loadSqlJs() {
    if (this.SQL) return this.SQL;
    return new Promise((resolve, reject) => {
      if (typeof initSqlJs !== 'undefined') {
        initSqlJs().then(SQL => { this.SQL = SQL; resolve(SQL); }).catch(reject);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/sql-asm.js';
      script.onload = () => {
        if (typeof initSqlJs !== 'undefined') {
          initSqlJs().then(SQL => { this.SQL = SQL; resolve(SQL); }).catch(reject);
        } else {
          reject(new Error('加载 sql.js 失败：initSqlJs 未找到'));
        }
      };
      script.onerror = () => reject(new Error('加载 sql.js 失败'));
      document.head.appendChild(script);
    });
  },

  // 初始化数据库
  async init() {
    if (this.initialized) return;
    await this.loadSqlJs();

    const saved = localStorage.getItem('shujian-db-data');
    if (saved) {
      try {
        const binary = this.base64ToUint8(saved);
        this.db = new this.SQL.Database(binary);
      } catch (e) {
        this.db = new this.SQL.Database();
      }
    } else {
      this.db = new this.SQL.Database();
    }

    const meta = localStorage.getItem('shujian-db-metadata');
    if (meta) {
      try { this.metadata = JSON.parse(meta); } catch (e) {}
    }

    // 如果数据库没有任何表，或数据版本不匹配，自动导入演示数据
    const dbVersion = localStorage.getItem('shujian-db-version');
    if (this.getTables().length === 0 || dbVersion !== '2') {
      // 版本不匹配时清空重建
      if (dbVersion !== '2') {
        localStorage.removeItem('shujian-db-data');
        localStorage.removeItem('shujian-db-metadata');
        this.db = new this.SQL.Database();
      }
      this._seedDemoData();
      localStorage.setItem('shujian-db-version', '2');
    }

    this.initialized = true;
  },

  // 导入演示数据（首次访问或清空后）
  _seedDemoData() {
    const pad = n => String(n).padStart(2, '0');
    const users = ['U1001','U1002','U1003','U1004','U1005','U1006','U1007','U1008','U1009','U1010','U1011','U1012','U1013','U1014','U1015','U1016','U1017','U1018','U1019','U1020','U1021','U1022','U1023','U1024','U1025'];
    const products = ['P10001','P10002','P10003','P10004','P10005','P10006','P10007','P10008','P10009','P10010','P10011','P10012','P10013','P10014','P10015','P10016','P10017','P10018','P10019','P10020'];
    const startDate = new Date('2025-01-01').getTime();
    const endDate = new Date('2026-06-30').getTime();

    // 生成 200 行 transactions
    const txRows = [];
    for (let i = 0; i < 200; i++) {
      const userID = users[Math.floor(Math.random() * users.length)];
      const productID = products[Math.floor(Math.random() * products.length)];
      const orderTimeVal = startDate + Math.random() * (endDate - startDate);
      const orderDate = new Date(orderTimeVal);
      const orderTimeStr = orderDate.getFullYear() + '-' + pad(orderDate.getMonth()+1) + '-' + pad(orderDate.getDate()) + ' ' + pad(orderDate.getHours()) + ':' + pad(orderDate.getMinutes());
      const payDate = new Date(orderTimeVal + (1 + Math.floor(Math.random() * 3)) * 86400000);
      const payTimeStr = payDate.getFullYear() + '-' + pad(payDate.getMonth()+1) + '-' + pad(payDate.getDate()) + ' ' + pad(payDate.getHours()) + ':' + pad(payDate.getMinutes());
      const qty = 1 + Math.floor(Math.random() * 5);
      const amount = parseFloat((100 + Math.random() * 9900).toFixed(2));
      const coupon = Math.random() > 0.3 ? parseFloat((Math.random() * 500).toFixed(2)) : '_';
      const redpacket = Math.random() > 0.2 ? parseFloat((Math.random() * 300).toFixed(2)) : '_';
      let actual = amount;
      if (coupon !== '_') actual -= parseFloat(coupon);
      if (redpacket !== '_') actual -= parseFloat(redpacket);
      actual = parseFloat(Math.max(0, actual).toFixed(2));
      const r = Math.random();
      let status = '已完成';
      if (r < 0.70) status = '已完成';
      else if (r < 0.85) status = '已支付';
      else if (r < 0.95) status = '待支付';
      else status = '已退款';
      let refundTime = '-';
      if (status === '已退款') {
        const refundDate = new Date(payDate.getTime() + Math.floor(Math.random() * 7) * 86400000);
        refundTime = refundDate.getFullYear() + '-' + pad(refundDate.getMonth()+1) + '-' + pad(refundDate.getDate()) + ' ' + pad(refundDate.getHours()) + ':' + pad(refundDate.getMinutes());
      }
      txRows.push([userID, productID, orderTimeStr, payTimeStr, String(qty), String(amount), String(coupon), String(redpacket), String(actual), status, refundTime]);
    }
    this.createTable('transactions', ['用户ID','商品ID','下单时间','购买时间','购买数量','消费金额','优惠券','红包','实付订单','订单状态','退单时间'], txRows);

    // users
    const userRows = [
      ['U1001','男','28','广东'], ['U1002','女','35','北京'], ['U1003','男','_','上海'],
      ['U1004','女','25','浙江'], ['U1005','男','31','江苏'], ['U1006','_','29','四川'],
      ['U1007','男','45','湖北'], ['U1008','女','22','湖南'], ['U1009','男','38','山东'], ['U1010','女','27','福建']
    ];
    this.createTable('users', ['用户ID','用户性别','用户年龄','用户省份'], userRows);

    // products
    const prodRows = [
      ['P10001','北欧风实木书桌','家居','1299.00'], ['P10002','轻奢羽绒被','家居','899.00'],
      ['P10003','专业跑步鞋','运动','599.00'], ['P10004','瑜伽垫加厚款','运动','129.00'],
      ['P10005','纯棉T恤经典款','服装','199.00'], ['P10006','轻薄羽绒夹克','服装','599.00'],
      ['P10007','精华液套装','美妆','459.00'], ['P10008','防晒霜SPF50','美妆','189.00'],
      ['P10009','Python编程入门','书籍','79.00'], ['P10010','数据科学导论','书籍','89.00']
    ];
    this.createTable('products', ['商品ID','商品名称','商品类别','单价'], prodRows);

    // 更新 metadata
    this.metadata.tables = [
      { table_name: 'transactions', original_name: 'transactions.csv', file_type: 'CSV', file_size: 0, row_count: 200, col_count: 11, uploaded_at: '2025-07-01 09:15' },
      { table_name: 'users', original_name: 'users.xlsx', file_type: 'XLSX', file_size: 0, row_count: 10, col_count: 4, uploaded_at: '2025-07-01 09:16' },
      { table_name: 'products', original_name: 'products.csv', file_type: 'CSV', file_size: 0, row_count: 10, col_count: 4, uploaded_at: '2025-07-01 09:16' }
    ];
    // 预置表关联关系
    this.metadata.relations = [
      { from: 'transactions', fromField: '商品ID', to: 'products', toField: '商品ID', label: '订单-商品关联' },
      { from: 'transactions', fromField: '用户ID', to: 'users', toField: '用户ID', label: '订单-用户关联' }
    ];
    this.save();
  },

  // 保存数据库到 localStorage
  save() {
    if (!this.db) return;
    try {
      const binary = this.db.export();
      const base64 = this.uint8ToBase64(binary);
      localStorage.setItem('shujian-db-data', base64);
      localStorage.setItem('shujian-db-metadata', JSON.stringify(this.metadata));
    } catch (e) {
      console.warn('数据库保存失败（可能超出存储限制）:', e);
    }
  },

  // 执行 SQL（SELECT）
  query(sql) {
    if (!this.db) throw new Error('数据库未初始化');
    try {
      const res = this.db.exec(sql);
      if (!res || res.length === 0) return { columns: [], rows: [] };
      const columns = res[0].columns;
      const rows = res[0].values.map(row => {
        const obj = {};
        columns.forEach((col, i) => obj[col] = row[i]);
        return obj;
      });
      return { columns, rows };
    } catch (e) {
      throw new Error('SQL 执行错误: ' + e.message);
    }
  },

  // 执行非查询 SQL
  run(sql) {
    if (!this.db) throw new Error('数据库未初始化');
    this.db.run(sql);
  },

  // 获取所有表名
  getTables() {
    try {
      const res = this.query("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
      return res.rows.map(r => r.name);
    } catch (e) { return []; }
  },

  // 获取表结构
  getSchema(tableName) {
    try {
      const info = this.query(`PRAGMA table_info("${tableName}")`);
      const schema = info.rows.map(row => {
        const type = this.inferType(row.type, row.name);
        return {
          name: row.name,
          type: type,
          isTime: this.isTimeField(row.name, type)
        };
      });
      return { table_name: tableName, schema };
    } catch (e) { return null; }
  },

  inferType(sqliteType, name) {
    const t = (sqliteType || '').toLowerCase();
    if (t.includes('int') || t.includes('real') || t.includes('float') || t.includes('double') || t.includes('num') || t.includes('dec')) return 'number';
    if (t.includes('date') || t.includes('time')) return 'datetime';
    return 'string';
  },

  isTimeField(name, type) {
    if (type === 'datetime') return true;
    const n = name.toLowerCase();
    if (n.includes('时间') || n.includes('日期') || n.includes('time') || n.includes('date')) {
      if (type === 'number') return false;
      return true;
    }
    return false;
  },

  // 创建表并插入数据
  createTable(tableName, headers, rows) {
    // 推断列类型
    const colTypes = headers.map((h, i) => {
      const sample = rows.find(r => r[i] !== null && r[i] !== undefined && r[i] !== '');
      if (sample === undefined) return 'TEXT';
      const val = sample[i];
      if (typeof val === 'number') return 'REAL';
      if (!isNaN(Number(val)) && val !== '') return 'REAL';
      return 'TEXT';
    });

    const cols = headers.map((h, i) => `"${h}" ${colTypes[i]}`).join(', ');
    this.run(`DROP TABLE IF EXISTS "${tableName}"`);
    this.run(`CREATE TABLE "${tableName}" (${cols})`);

    // 批量插入
    const stmt = this.db.prepare(`INSERT INTO "${tableName}" VALUES (${headers.map(() => '?').join(', ')})`);
    for (const row of rows) {
      stmt.run(row.map(v => {
        if (v === null || v === undefined || v === '' || v === '_' || v === '-') return null;
        const n = Number(v);
        return isNaN(n) ? String(v) : n;
      }));
    }
    stmt.free();
  },

  // 删除表
  dropTable(tableName) {
    this.run(`DROP TABLE IF EXISTS "${tableName}"`);
    this.metadata.tables = this.metadata.tables.filter(t => t.table_name !== tableName);
    this.save();
  },

  // 获取预览数据
  preview(tableName, limit = 50) {
    return this.query(`SELECT * FROM "${tableName}" LIMIT ${limit}`);
  },

  // 获取统计数据
  stats(tableName) {
    const schema = this.getSchema(tableName);
    const count = this.query(`SELECT COUNT(*) as cnt FROM "${tableName}"`);
    const totalRows = count.rows[0]?.cnt || 0;

    const missing = [];
    schema.schema.forEach(col => {
      const res = this.query(`SELECT COUNT(*) as cnt FROM "${tableName}" WHERE "${col.name}" IS NULL OR "${col.name}" = '' OR "${col.name}" = '_' OR "${col.name}" = '-'`);
      const c = res.rows[0]?.cnt || 0;
      if (c > 0) missing.push({ field: col.name, count: c, rate: totalRows > 0 ? Math.round(c / totalRows * 10000) / 100 : 0 });
    });

    // 使用 rowid 代替 COUNT(DISTINCT *)（SQLite 不支持 DISTINCT *）
    let dupRows = 0;
    try {
      const cols = schema.schema.map(c => `"${c.name}"`).join(', ');
      const dup = this.query(`SELECT COUNT(*) - COUNT(DISTINCT ${cols}) as dup FROM "${tableName}"`);
      dupRows = dup.rows[0]?.dup || 0;
    } catch (e) {
      // 回退方案：使用 rowid
      try {
        const dup = this.query(`SELECT COUNT(*) - COUNT(DISTINCT rowid) as dup FROM "${tableName}"`);
        dupRows = Math.max(0, dup.rows[0]?.dup || 0);
      } catch (e2) { dupRows = 0; }
    }

    // 时间范围
    let timeRange = null;
    const timeCol = schema.schema.find(c => c.isTime);
    if (timeCol) {
      try {
        const range = this.query(`SELECT MIN("${timeCol.name}") as minv, MAX("${timeCol.name}") as maxv FROM "${tableName}"`);
        if (range.rows[0]?.minv) timeRange = { min: range.rows[0].minv, max: range.rows[0].maxv };
      } catch (e) {}
    }

    return {
      total_rows: totalRows,
      total_cols: schema.schema.length,
      completeness: totalRows > 0 ? Math.round((1 - missing.reduce((s, m) => s + m.count, 0) / (totalRows * schema.schema.length)) * 10000) / 100 : 100,
      missing: { total_missing: missing.reduce((s, m) => s + m.count, 0), fields: missing },
      duplicates: { duplicate_rows: dupRows, duplicate_rate: totalRows > 0 ? Math.round(dupRows / totalRows * 10000) / 100 : 0 },
      time_range: timeRange
    };
  },

  // 质量报告
  qualityReport(tableName) {
    const schema = this.getSchema(tableName);
    const stats = this.stats(tableName);

    // 数值字段异常值
    const outlierFields = [];
    const businessIssues = [];
    const typeIssues = [];
    const pkViolations = [];

    schema.schema.forEach(col => {
      if (col.type === 'number') {
        try {
          // 排除 null、占位符值计算统计量
          const cleanWhere = `"${col.name}" IS NOT NULL AND "${col.name}" != '_' AND "${col.name}" != '-' AND typeof("${col.name}") != 'text'`;
          const res = this.query(`SELECT MIN("${col.name}") as minv, MAX("${col.name}") as maxv, AVG("${col.name}") as avgv FROM "${tableName}" WHERE ${cleanWhere}`);
          const row = res.rows[0];
          const neg = this.query(`SELECT COUNT(*) as cnt FROM "${tableName}" WHERE ${cleanWhere} AND "${col.name}" < 0`);
          const negCount = neg.rows[0]?.cnt || 0;
          const zero = this.query(`SELECT COUNT(*) as cnt FROM "${tableName}" WHERE ${cleanWhere} AND "${col.name}" = 0`);
          const zeroCount = zero.rows[0]?.cnt || 0;
          const avg = row.avgv ? parseFloat(row.avgv) : 0;
          const stddev = this.query(`SELECT AVG(CASE WHEN ${cleanWhere} THEN ("${col.name}" - ${avg}) * ("${col.name}" - ${avg}) END) as sd FROM "${tableName}"`);
          const sd = stddev.rows[0]?.sd ? Math.sqrt(parseFloat(stddev.rows[0].sd)) : 0;
          // IQR 异常值检测
          const cleanCount = this.query(`SELECT COUNT(*) as cnt FROM "${tableName}" WHERE ${cleanWhere}`);
          const n = cleanCount.rows[0]?.cnt || stats.total_rows;
          const q1r = this.query(`SELECT "${col.name}" as val FROM "${tableName}" WHERE ${cleanWhere} ORDER BY "${col.name}" LIMIT 1 OFFSET ${Math.floor(n * 0.25)}`);
          const q3r = this.query(`SELECT "${col.name}" as val FROM "${tableName}" WHERE ${cleanWhere} ORDER BY "${col.name}" LIMIT 1 OFFSET ${Math.floor(n * 0.75)}`);
          const q1 = q1r.rows[0]?.val ? parseFloat(q1r.rows[0].val) : avg - sd;
          const q3 = q3r.rows[0]?.val ? parseFloat(q3r.rows[0].val) : avg + sd;
          const iqr = q3 - q1;
          const lowerBound = q1 - 1.5 * iqr;
          const upperBound = q3 + 1.5 * iqr;
          const extreme = this.query(`SELECT COUNT(*) as cnt FROM "${tableName}" WHERE "${col.name}" IS NOT NULL AND ("${col.name}" < ${lowerBound} OR "${col.name}" > ${upperBound})`);
          const extremeCount = extreme.rows[0]?.cnt || 0;

          outlierFields.push({
            field: col.name,
            negative_count: negCount,
            zero_count: zeroCount,
            min: row.minv,
            max: row.maxv,
            mean: Math.round(avg * 100) / 100,
            extreme_high_count: extremeCount,
            extreme_low_count: 0
          });
          if (negCount > 0 && (col.name.includes('金额') || col.name.includes('价格') || col.name.includes('实付') || col.name.includes('消费'))) {
            businessIssues.push({ field: col.name, issue: '金额字段出现负值', detail: `负值共 ${negCount} 条，建议核实数据来源` });
          }
          if (extremeCount > 0) {
            businessIssues.push({ field: col.name, issue: '存在极端异常值', detail: `共 ${extremeCount} 条超出 IQR 1.5 倍范围 (均值${Math.round(avg)}, 标准差${Math.round(sd)})` });
          }
        } catch (e) {}
      }

      // 类型异常检测：数值型字段中存在看起来像文本的值
      if (col.type === 'number') {
        try {
          const textLike = this.query(`SELECT COUNT(*) as cnt FROM "${tableName}" WHERE typeof("${col.name}") = 'text'`);
          const textCount = textLike.rows[0]?.cnt || 0;
          if (textCount > 0) {
            typeIssues.push({ field: col.name, issue: '数值字段包含文本值', detail: `共 ${textCount} 条记录的该字段为文本类型而非数值` });
          }
        } catch (e) {}
      }
    });

    // 主键候选唯一性检测
    const pkCandidates = schema.schema.filter(c => c.name.includes('ID') || c.name.includes('id') || c.name.includes('编号'));
    pkCandidates.forEach(col => {
      try {
        const dup = this.query(`SELECT COUNT(*) - COUNT(DISTINCT "${col.name}") as dup FROM "${tableName}" WHERE "${col.name}" IS NOT NULL`);
        const dupCount = Math.max(0, dup.rows[0]?.dup || 0);
        if (dupCount > 0) {
          const total = this.query(`SELECT COUNT(DISTINCT "${col.name}") as cnt FROM "${tableName}" WHERE "${col.name}" IS NOT NULL`);
          const uniqueCount = total.rows[0]?.cnt || 0;
          pkViolations.push({ field: col.name, duplicate_count: dupCount, unique_count: uniqueCount });
        }
      } catch (e) {}
    });

    // 状态字段的一致性检测
    const statusCol = schema.schema.find(c => c.name.includes('状态') || c.name.includes('status'));
    if (statusCol) {
      try {
        const statusVals = this.query(`SELECT DISTINCT "${statusCol.name}" as val FROM "${tableName}" WHERE "${statusCol.name}" IS NOT NULL ORDER BY "${statusCol.name}"`);
        if (statusVals.rows.length > 0) {
          const vals = statusVals.rows.map(r => String(r.val));
          // 检查是否有异常状态值
        }
      } catch (e) {}
    }

    let score = 100;
    if (stats.missing.total_missing > 0) score -= Math.min(20, stats.missing.total_missing / stats.total_rows * 5);
    if (stats.duplicates.duplicate_rows > 0) score -= Math.min(15, stats.duplicates.duplicate_rows / stats.total_rows * 100);
    if (businessIssues.length > 0) score -= Math.min(20, businessIssues.length * 5);
    if (typeIssues.length > 0) score -= Math.min(10, typeIssues.length * 5);
    if (pkViolations.length > 0) score -= Math.min(10, pkViolations.length * 3);
    score = Math.max(0, Math.round(score));

    return {
      table_name: tableName,
      overview: { total_rows: stats.total_rows, total_cols: stats.total_cols, memory_mb: 0 },
      missing: stats.missing,
      duplicates: stats.duplicates,
      outliers: { fields: outlierFields },
      type_issues: typeIssues,
      business_issues: businessIssues,
      pk_violations: pkViolations,
      health_score: score
    };
  },

  // 获取所有 schema
  getAllSchemas() {
    const schemas = {};
    const tables = this.getTables();
    tables.forEach(t => {
      const s = this.getSchema(t);
      if (s) schemas[t] = s;
    });
    return schemas;
  },

  // ===== 表关联管理 =====
  
  // 获取所有关联关系
  getRelations() {
    return this.metadata.relations || [];
  },
  
  // 添加关联关系
  addRelation(from, fromField, to, toField, label) {
    if (!this.metadata.relations) this.metadata.relations = [];
    // 去重检查
    const exists = this.metadata.relations.some(r =>
      r.from === from && r.fromField === fromField && r.to === to && r.toField === toField
    );
    if (exists) return false;
    this.metadata.relations.push({ from, fromField, to, toField, label: label || '' });
    this.save();
    return true;
  },
  
  // 删除关联关系
  removeRelation(from, fromField, to, toField) {
    if (!this.metadata.relations) return;
    this.metadata.relations = this.metadata.relations.filter(r =>
      !(r.from === from && r.fromField === fromField && r.to === to && r.toField === toField)
    );
    this.save();
  },
  
  // 根据字段名自动查找关联的表
  findJoinTable(field, currentTable) {
    const relations = this.getRelations();
    for (const r of relations) {
      if (r.from === currentTable && r.fromField === field) {
        return { joinTable: r.to, joinField: r.toField, fromField: r.fromField };
      }
      if (r.to === currentTable && r.toField === field) {
        return { joinTable: r.from, joinField: r.fromField, fromField: r.toField };
      }
    }
    return null;
  },
  
  // 自动扩展 SQL：如果查询的字段有关联表，自动 JOIN 并替换字段名
  // 例如 transactions.商品ID -> products.商品名称
  expandQueryWithJoin(sql, tableName) {
    const relations = this.getRelations();
    if (relations.length === 0) return sql;
    
    // 找到与当前表相关的所有关联
    let expandedSql = sql;
    const joinedTables = new Set([tableName]);
    const joinClauses = [];
    
    for (const r of relations) {
      let mainTable = null;
      let joinTarget = null;
      let joinOnFrom = null;
      let joinOnTo = null;
      
      if (r.from === tableName && !joinedTables.has(r.to)) {
        mainTable = r.from;
        joinTarget = r.to;
        joinOnFrom = `"${r.from}"."${r.fromField}"`;
        joinOnTo = `"${r.to}"."${r.toField}"`;
      } else if (r.to === tableName && !joinedTables.has(r.from)) {
        mainTable = r.to;
        joinTarget = r.from;
        joinOnFrom = `"${r.from}"."${r.fromField}"`;
        joinOnTo = `"${r.to}"."${r.toField}"`;
      }
      
      if (mainTable && joinTarget) {
        joinClauses.push(`LEFT JOIN "${joinTarget}" ON ${joinOnFrom} = ${joinOnTo}`);
        joinedTables.add(joinTarget);
      }
    }
    
    if (joinClauses.length === 0) return sql;
    
    // 在 FROM 子句后插入 JOIN
    expandedSql = expandedSql.replace(
      /FROM\s+"(\w+)"(\s+WHERE)?/i,
      (match, table, where) => {
        const joins = joinClauses.join(' ');
        return `FROM "${table}" ${joins}${where || ''}`;
      }
    );
    
    // 消除歧义：JOIN 后如果多表有同名字段，给原始 SQL 中的字段加表名前缀
    const ambiguousFields = [];
    for (const jTable of joinedTables) {
      const jSchema = this.getSchema(jTable);
      if (jSchema) {
        const mSchema = this.getSchema(tableName);
        if (mSchema) {
          for (const col of jSchema.schema) {
            if (mSchema.schema.find(c => c.name === col.name)) {
              ambiguousFields.push(col.name);
            }
          }
        }
      }
    }
    // 给歧义字段加表名前缀：将独立的 "字段名" 替换为 "主表"."字段名"
    // 只替换不含 "." 的字段引用，避免影响已有的 "表"."字段" 格式
    ambiguousFields.forEach(field => {
      const safeField = field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // 匹配 "字段名" 且前面不是 "."（即不是 "表"."字段"）
      const re = new RegExp('(?<!\\.)"' + safeField + '"', 'g');
      expandedSql = expandedSql.replace(re, (full) => {
        return '"' + tableName + '"."' + field + '"';
      });
    });
    
    return expandedSql;
  },
  
  // 智能查询：自动将 ID 字段替换为关联表的名称字段
  // 用于问答场景：当查询涉及商品ID/用户ID时，自动关联显示商品名称/用户省份等
  smartQuery(sql, tableName) {
    // 先获取关联表中有哪些"名称"或"描述"类字段
    const nameFields = {};
    const relations = this.getRelations();
    for (const r of relations) {
      let joinTable = null;
      if (r.from === tableName) joinTable = r.to;
      else if (r.to === tableName) joinTable = r.from;
      
      if (joinTable) {
        const schema = this.getSchema(joinTable);
        if (schema) {
          // 优先找"名称"字段，其次找第一个非ID文本字段
          const nameField = schema.schema.find(c => c.name.includes('名称') || c.name.includes('名')) 
            || schema.schema.find(c => c.type === 'string' && !c.name.includes('ID') && !c.isTime);
          if (nameField) {
            const idField = r.from === tableName ? r.fromField : r.toField;
            nameFields[idField] = { table: joinTable, field: nameField.name };
          }
        }
      }
    }
    
    // 扩展 SQL 加入 JOIN
    let expandedSql = this.expandQueryWithJoin(sql, tableName);
    
    return { sql: expandedSql, nameFields };
  },

  // 工具函数
  uint8ToBase64(u8) {
    let binary = '';
    const len = u8.byteLength;
    for (let i = 0; i < len; i++) binary += String.fromCharCode(u8[i]);
    return btoa(binary);
  },

  base64ToUint8(b64) {
    const binary = atob(b64);
    const len = binary.length;
    const u8 = new Uint8Array(len);
    for (let i = 0; i < len; i++) u8[i] = binary.charCodeAt(i);
    return u8;
  },

  // 加载外部脚本
  loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = src;
      s.onload = resolve;
      s.onerror = reject;
      document.head.appendChild(s);
    });
  },

  // 加载 PapaParse
  async loadPapaParse() {
    if (typeof Papa !== 'undefined') return;
    await this.loadScript('https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.4.1/papaparse.min.js');
  },

  // 加载 SheetJS
  async loadSheetJS() {
    if (typeof XLSX !== 'undefined') return;
    await this.loadScript('https://cdn.sheetjs.com/xlsx-0.20.1/package/dist/xlsx.full.min.js');
  },

  // 解析 CSV
  async parseCSV(file) {
    await this.loadPapaParse();
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        complete: (results) => {
          if (results.errors.length > 0 && results.data.length === 0) {
            reject(new Error('CSV 解析失败'));
            return;
          }
          const headers = results.meta.fields;
          const rows = results.data.map(obj => headers.map(h => obj[h]));
          resolve({ headers, rows, count: rows.length });
        },
        error: (err) => reject(err)
      });
    });
  },

  // 解析 Excel
  async parseExcel(file) {
    await this.loadSheetJS();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
          const json = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
          if (json.length < 2) { reject(new Error('Excel 文件为空')); return; }
          const headers = json[0].map(h => String(h));
          const rows = json.slice(1).map(r => headers.map((_, i) => r[i] !== undefined ? r[i] : null));
          resolve({ headers, rows, count: rows.length });
        } catch (err) { reject(err); }
      };
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsArrayBuffer(file);
    });
  }
};

// 自动初始化
document.addEventListener('DOMContentLoaded', () => {
  ShujianDB.init().catch(console.error);
});
