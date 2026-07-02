import { pool } from './config/database.js';
import fs from 'fs';
import path from 'path';

async function runMigrations() {
  const __dirname = path.dirname(new URL(import.meta.url).pathname);
  const migrationsDir = path.join(__dirname, '../migrations');

  // 先创建版本控制表
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version VARCHAR(64) PRIMARY KEY,
      executed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const version = file.replace('.sql', '');

    // 检查是否已执行
    const check = await pool.query(
      'SELECT 1 FROM schema_migrations WHERE version = $1',
      [version]
    );

    if (check.rows.length > 0) {
      console.log(`跳过: ${file} (已执行)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');

    console.log(`执行迁移: ${file}...`);
    await pool.query(sql);

    await pool.query(
      'INSERT INTO schema_migrations (version) VALUES ($1)',
      [version]
    );

    console.log(`完成: ${file}`);
  }

  console.log('\n所有迁移执行完毕！');
  await pool.end();
}

runMigrations().catch(err => {
  console.error('迁移失败:', err);
  process.exit(1);
});
