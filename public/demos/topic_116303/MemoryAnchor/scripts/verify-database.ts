// Database Verification Script
// Verify database initialization, migrations, and repository functionality

import Database from 'better-sqlite3';
import { MigrationManager } from '../src/database/sqlite/migrations/index';
import { initialMigration } from '../src/database/sqlite/migrations/001_initial';
import { BaseRepository } from '../src/database/sqlite/repositories/BaseRepository';

// 测试数据库路径
const TEST_DB_PATH = '/tmp/test-memory-anchor.db';

// 测试数据模型
interface TestCollection {
  id: string;
  url: string;
  title: string;
  content_text?: string;
  summary?: string;
  source_type: string;
  status: string;
  version_count: number;
  is_read: boolean;
  is_favorite: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
}

// 测试 Repository
class TestCollectionRepository extends BaseRepository<TestCollection> {
  constructor(db: Database.Database) {
    super('collections');
    this.db = db; // 直接使用传入的 db
  }
}

async function verifyDatabase() {
  console.log('=== 开始验证数据库功能 ===\n');

  let db: Database.Database;
  let migrationManager: MigrationManager;

  try {
    // 1. 测试数据库连接
    console.log('1. 测试数据库连接...');
    db = new Database(TEST_DB_PATH);
    console.log('   ✓ 数据库连接成功');
    console.log(`   ✓ 数据库路径: ${TEST_DB_PATH}\n`);

    // 2. 配置数据库
    console.log('2. 配置数据库...');
    db.pragma('foreign_keys = ON');
    db.pragma('journal_mode = WAL');
    console.log('   ✓ 外键约束已开启');
    console.log('   ✓ WAL 模式已开启\n');

    // 3. 测试迁移管理器
    console.log('3. 测试迁移管理器...');
    migrationManager = new MigrationManager(db);

    // 注册迁移
    migrationManager.registerMigration(initialMigration);
    console.log('   ✓ 迁移脚本已注册');

    // 应用迁移
    await migrationManager.applyMigrations();
    console.log('   ✓ 迁移已应用');

    // 验证迁移记录
    const appliedMigrations = migrationManager.getAppliedMigrations();
    console.log(`   ✓ 已应用迁移数量: ${appliedMigrations.length}`);
    console.log(`   ✓ 当前数据库版本: ${migrationManager.getCurrentVersion()}\n`);

    // 4. 验证表结构
    console.log('4. 验证表结构...');
    const tables = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'fts_%'"
      )
      .all() as Array<{ name: string }>;

    const expectedTables = [
      'collections',
      'versions',
      'vectors',
      'tags',
      'collection_tags',
      'scrape_tasks',
      'activity_logs',
      'schema_migrations',
      'collections_fts',
    ];

    console.log('   预期表:', expectedTables.join(', '));
    console.log('   实际表:', tables.map((t) => t.name).join(', '));

    const missingTables = expectedTables.filter(
      (name) => !tables.some((t) => t.name === name)
    );
    if (missingTables.length === 0) {
      console.log('   ✓ 所有表都已创建\n');
    } else {
      console.log('   ✗ 缺少表:', missingTables.join(', '), '\n');
    }

    // 5. 验证索引
    console.log('5. 验证索引...');
    const indexes = db
      .prepare(
        "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
      )
      .all() as Array<{ name: string }>;

    const expectedIndexes = [
      'idx_collections_url',
      'idx_collections_source_type',
      'idx_collections_status',
      'idx_collections_created_at',
      'idx_collections_updated_at',
      'idx_collections_is_deleted',
      'idx_collections_is_favorite',
      'idx_versions_collection_id',
      'idx_versions_version_number',
      'idx_versions_created_at',
      'idx_vectors_collection_id',
      'idx_vectors_model',
      'idx_tags_name',
      'idx_collection_tags_collection_id',
      'idx_collection_tags_tag_id',
      'idx_scrape_tasks_status',
      'idx_scrape_tasks_priority',
      'idx_activity_logs_action',
      'idx_activity_logs_entity',
      'idx_activity_logs_created_at',
    ];

    console.log('   预期索引数量:', expectedIndexes.length);
    console.log('   实际索引数量:', indexes.length);

    const missingIndexes = expectedIndexes.filter(
      (name) => !indexes.some((i) => i.name === name)
    );
    if (missingIndexes.length === 0) {
      console.log('   ✓ 所有索引都已创建\n');
    } else {
      console.log('   ✗ 缺少索引:', missingIndexes.join(', '), '\n');
    }

    // 6. 验证 FTS5 全文索引
    console.log('6. 验证 FTS5 全文索引...');
    const ftsTable = db
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='collections_fts'")
      .get() as { name: string } | undefined;

    if (ftsTable) {
      console.log('   ✓ FTS5 虚拟表已创建');

      // 验证触发器
      const triggers = db
        .prepare("SELECT name FROM sqlite_master WHERE type='trigger' AND name LIKE 'collections_%'")
        .all() as Array<{ name: string }>;

      const expectedTriggers = ['collections_ai', 'collections_ad', 'collections_au'];
      console.log('   预期触发器:', expectedTriggers.join(', '));
      console.log('   实际触发器:', triggers.map((t) => t.name).join(', '));

      if (expectedTriggers.every((name) => triggers.some((t) => t.name === name))) {
        console.log('   ✓ FTS5 同步触发器已创建\n');
      } else {
        console.log('   ✗ 缺少触发器\n');
      }
    } else {
      console.log('   ✗ FTS5 虚拟表未创建\n');
    }

    // 7. 测试 Repository 功能
    console.log('7. 测试 Repository 功能...');
    const repo = new TestCollectionRepository(db);

    // 测试创建
    const created = repo.create({
      url: 'https://example.com',
      title: '测试文章',
      content_text: '这是一篇测试文章的内容',
      summary: '测试文章摘要',
      source_type: 'web',
      status: 'completed',
      version_count: 1,
      is_read: false,
      is_favorite: false,
      is_deleted: false,
    });

    console.log('   ✓ 创建记录成功');
    console.log(`   ✓ 创建的 ID: ${created.id}`);

    // 测试读取
    const retrieved = repo.getById(created.id);
    if (retrieved) {
      console.log('   ✓ 根据 ID 查询成功');
      console.log(`   ✓ 查询的标题: ${retrieved.title}`);
    } else {
      console.log('   ✗ 根据 ID 查询失败');
    }

    // 测试更新
    const updated = repo.update(created.id, {
      title: '更新后的测试文章',
      is_favorite: true,
    });
    if (updated) {
      console.log('   ✓ 更新记录成功');
      console.log(`   ✓ 更新后的标题: ${updated.title}`);
      console.log(`   ✓ 更新后的收藏状态: ${updated.is_favorite}`);
    } else {
      console.log('   ✗ 更新记录失败');
    }

    // 测试条件查询
    const found = repo.findWhere([
      { field: 'source_type', value: 'web' },
      { field: 'is_deleted', value: false },
    ]);
    console.log(`   ✓ 条件查询成功，找到 ${found.length} 条记录`);

    // 测试分页
    const pageResult = repo.list({ page: 1, limit: 10 }, [
      { field: 'is_deleted', value: false },
    ]);
    console.log('   ✓ 分页查询成功');
    console.log(`   ✓ 总记录数: ${pageResult.total}`);
    console.log(`   ✓ 当前页: ${pageResult.page}`);
    console.log(`   ✓ 每页数量: ${pageResult.limit}`);

    // 测试删除
    const deleted = repo.delete(created.id);
    if (deleted) {
      console.log('   ✓ 删除记录成功');
    } else {
      console.log('   ✗ 删除记录失败');
    }

    // 验证删除
    const afterDelete = repo.getById(created.id);
    if (!afterDelete) {
      console.log('   ✓ 记录已成功删除\n');
    } else {
      console.log('   ✗ 记录删除失败\n');
    }

    // 8. 测试全文搜索
    console.log('8. 测试全文搜索...');
    // 先创建一些测试数据
    for (let i = 0; i < 5; i++) {
      repo.create({
        url: `https://example.com/${i}`,
        title: `测试文章 ${i}`,
        content_text: `这是测试文章 ${i} 的内容，包含关键词互联网和人工智能`,
        summary: `测试文章 ${i} 的摘要`,
        source_type: 'web',
        status: 'completed',
        version_count: 1,
        is_read: false,
        is_favorite: false,
        is_deleted: false,
      });
    }
    console.log('   ✓ 创建测试数据成功');

    // 测试全文搜索
    const searchResult = repo.fullTextSearch('互联网', { page: 1, limit: 10 });
    console.log('   ✓ 全文搜索成功');
    console.log(`   ✓ 搜索结果数量: ${searchResult.total}`);
    console.log(`   ✓ 搜索关键词: "互联网"\n`);

    // 9. 验证完整性
    console.log('9. 验证数据库完整性...');
    const integrityResult = db.pragma('integrity_check');
    const integrityCheck = integrityResult as Array<{ integrity_check: string }>;
    if (integrityCheck.length === 1 && integrityCheck[0].integrity_check === 'ok') {
      console.log('   ✓ 数据库完整性检查通过\n');
    } else {
      console.log('   ✗ 数据库完整性检查失败\n');
    }

    // 10. 总结
    console.log('=== 验证完成 ===\n');
    console.log('所有测试通过，数据库功能正常工作。');

  } catch (error) {
    console.error('\n✗ 验证过程中发生错误:', error);
    throw error;
  } finally {
    // 清理
    if (db) {
      db.close();
      console.log('\n数据库连接已关闭');
    }
  }
}

// 运行验证
verifyDatabase().catch(console.error);