# 雪球日记数据模型和存储方案

## 1. 数据模型设计

### 1.1 核心数据实体

#### 1.1.1 用户(User)
- **user_id**：用户唯一标识，UUID
- **username**：用户名，字符串
- **email**：邮箱，字符串
- **password_hash**：密码哈希，字符串
- **created_at**：创建时间，时间戳
- **updated_at**：更新时间，时间戳
- **preferences**：用户偏好设置，JSON对象
  - **theme**：主题，字符串
  - **notifications**：通知开关，布尔值
  - **reminder_time**：提醒时间，字符串

#### 1.1.2 目标(Goal)
- **goal_id**：目标唯一标识，UUID
- **user_id**：用户ID，外键
- **title**：目标标题，字符串
- **description**：目标描述，字符串
- **category**：目标分类，字符串
- **priority**：优先级，字符串
- **start_date**：开始日期，日期
- **end_date**：结束日期，日期
- **status**：状态，字符串
- **progress**：进度，数字
- **created_at**：创建时间，时间戳
- **updated_at**：更新时间，时间戳

#### 1.1.3 任务(Task)
- **task_id**：任务唯一标识，UUID
- **goal_id**：目标ID，外键
- **title**：任务标题，字符串
- **description**：任务描述，字符串
- **difficulty**：难度，数字
- **order**：顺序，数字
- **status**：状态，字符串
- **due_date**：截止日期，日期
- **completed_at**：完成时间，时间戳
- **created_at**：创建时间，时间戳
- **updated_at**：更新时间，时间戳

#### 1.1.4 记录(Record)
- **record_id**：记录唯一标识，UUID
- **user_id**：用户ID，外键
- **content**：记录内容，字符串
- **type**：记录类型，字符串
- **tags**：标签，字符串数组
- **images**：图片URL，字符串数组
- **mood**：心情，字符串
- **related_goal_id**：相关目标ID，外键
- **related_task_id**：相关任务ID，外键
- **created_at**：创建时间，时间戳
- **updated_at**：更新时间，时间戳

#### 1.1.5 成就(Achievement)
- **achievement_id**：成就唯一标识，UUID
- **user_id**：用户ID，外键
- **title**：成就标题，字符串
- **description**：成就描述，字符串
- **icon**：成就图标，字符串
- **unlocked_at**：解锁时间，时间戳
- **created_at**：创建时间，时间戳

#### 1.1.6 成长数据(Growth)
- **growth_id**：成长数据唯一标识，UUID
- **user_id**：用户ID，外键
- **date**：日期，日期
- **snowball_size**：雪球大小，数字
- **achievements_count**：成就数量，数字
- **tasks_completed**：完成任务数量，数字
- **records_count**：记录数量，数字
- **created_at**：创建时间，时间戳

### 1.2 数据关系

```
User ────┐
         │
         ▼
Goal ────┐
         │
         ▼
Task ────┐
         │
         ▼
Record ──┘

User ────┐
         │
         ▼
Achievement

User ────┐
         │
         ▼
Growth
```

## 2. 存储方案

### 2.1 混合存储策略

#### 2.1.1 本地存储
- **localStorage**：存储用户偏好设置、临时数据
- **IndexedDB**：存储大量本地数据，如记录、任务、目标等

#### 2.1.2 云端存储
- **Supabase**：BaaS平台，提供数据库、认证、存储等服务
  - **PostgreSQL**：关系型数据库，存储用户数据、目标、任务、记录等
  - **Storage**：存储用户上传的图片等文件

### 2.2 存储分配

| 数据类型 | 本地存储 | 云端存储 | 同步策略 |
|---------|---------|---------|---------|
| 用户信息 | 缓存 | 主要存储 | 双向同步 |
| 目标数据 | 主要存储 | 备份 | 双向同步 |
| 任务数据 | 主要存储 | 备份 | 双向同步 |
| 记录数据 | 主要存储 | 备份 | 双向同步 |
| 成就数据 | 缓存 | 主要存储 | 单向同步（云端→本地） |
| 成长数据 | 缓存 | 主要存储 | 单向同步（云端→本地） |
| 用户偏好 | 主要存储 | 备份 | 双向同步 |

## 3. 数据同步策略

### 3.1 同步机制

#### 3.1.1 实时同步
- **网络可用时**：数据变更实时同步到云端
- **网络不可用时**：数据存储在本地，网络恢复后自动同步

#### 3.1.2 冲突处理
- **最后写入 wins**：以最后更新的版本为准
- **冲突检测**：检测数据冲突，提示用户选择
- **自动合并**：对于非冲突字段自动合并

### 3.2 同步流程

1. **本地数据变更**：用户在本地修改数据
2. **本地存储**：数据存储到本地IndexedDB
3. **网络检测**：检测网络连接状态
4. **同步触发**：网络可用时触发同步
5. **云端更新**：将本地变更同步到云端
6. **本地更新**：将云端变更同步到本地
7. **冲突处理**：处理可能的冲突

### 3.3 同步优化

- **批量同步**：合并多个变更为批量操作，减少网络请求
- **增量同步**：只同步变更的数据，减少数据传输
- **后台同步**：在后台进行同步，不影响用户操作
- **同步状态提示**：显示同步状态，让用户了解数据同步情况

## 4. 数据安全

### 4.1 本地存储安全

- **数据加密**：本地存储的数据进行加密
- **访问控制**：限制对本地存储的访问
- **数据清理**：用户登出时清理本地数据

### 4.2 云端存储安全

- **HTTPS**：数据传输使用HTTPS加密
- **密码哈希**：用户密码使用bcrypt等算法哈希存储
- **JWT认证**：使用JWT进行身份验证
- **权限控制**：基于用户ID的权限控制
- **数据备份**：定期备份云端数据

### 4.3 隐私保护

- **数据匿名化**：敏感数据匿名化处理
- **用户控制**：用户可以控制数据的使用和共享
- **合规性**：遵循GDPR和其他隐私法规

## 5. 数据访问

### 5.1 前端数据访问

- **本地数据访问**：使用IndexedDB API访问本地数据
- **云端数据访问**：使用Supabase JS SDK访问云端数据
- **数据缓存**：缓存常用数据，提高访问速度

### 5.2 后端数据访问

- **API接口**：通过Supabase提供的API接口访问数据
- **Serverless Functions**：处理复杂的数据操作
- **数据库查询**：优化数据库查询，提高性能

### 5.3 数据查询优化

- **索引**：为常用查询字段创建索引
- **分页**：实现数据分页，减少数据传输
- **缓存**：缓存查询结果，提高查询速度
- **批量操作**：合并多个查询为批量操作

## 6. 数据迁移

### 6.1 版本管理

- **数据版本**：为数据模型添加版本号
- **迁移脚本**：编写数据迁移脚本，处理数据模型变更
- **向后兼容**：确保旧版本数据的兼容性

### 6.2 迁移流程

1. **检测版本**：检测当前数据版本
2. **执行迁移**：根据版本执行相应的迁移脚本
3. **验证数据**：验证迁移后的数据完整性
4. **更新版本**：更新数据版本号

## 7. 数据备份和恢复

### 7.1 自动备份

- **本地备份**：定期自动备份本地数据
- **云端备份**：Supabase自动备份云端数据
- **备份频率**：根据数据重要性设置备份频率

### 7.2 手动备份

- **导出数据**：允许用户导出数据为JSON或CSV格式
- **导入数据**：允许用户导入之前导出的数据
- **备份存储**：建议用户将备份存储在安全的位置

### 7.3 恢复流程

1. **检测数据**：检测当前数据状态
2. **选择备份**：选择要恢复的备份
3. **执行恢复**：执行数据恢复操作
4. **验证数据**：验证恢复后的数据完整性

## 8. 性能优化

### 8.1 存储优化

- **数据压缩**：压缩存储的数据，减少存储空间
- **数据清理**：定期清理过期数据
- **存储配额**：设置合理的存储配额

### 8.2 访问优化

- **缓存策略**：合理设置缓存策略
- **预加载**：预加载常用数据
- **延迟加载**：延迟加载不常用数据

### 8.3 同步优化

- **网络检测**：智能检测网络状态
- **同步时机**：选择合适的同步时机
- **同步优先级**：设置同步优先级

## 9. 实现细节

### 9.1 本地存储实现

#### 9.1.1 IndexedDB封装
```javascript
// 数据库名称和版本
const DB_NAME = 'snowball-diary';
const DB_VERSION = 1;

// 打开数据库
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      
      // 创建存储对象
      if (!db.objectStoreNames.contains('users')) {
        db.createObjectStore('users', { keyPath: 'user_id' });
      }
      
      if (!db.objectStoreNames.contains('goals')) {
        const goalsStore = db.createObjectStore('goals', { keyPath: 'goal_id' });
        goalsStore.createIndex('user_id', 'user_id');
      }
      
      if (!db.objectStoreNames.contains('tasks')) {
        const tasksStore = db.createObjectStore('tasks', { keyPath: 'task_id' });
        tasksStore.createIndex('goal_id', 'goal_id');
      }
      
      if (!db.objectStoreNames.contains('records')) {
        const recordsStore = db.createObjectStore('records', { keyPath: 'record_id' });
        recordsStore.createIndex('user_id', 'user_id');
      }
    };
    
    request.onsuccess = (event) => {
      resolve(event.target.result);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// 存储数据
async function storeData(storeName, data) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);
    const request = store.put(data);
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// 获取数据
async function getData(storeName, key) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);
    
    request.onsuccess = () => {
      resolve(request.result);
    };
    
    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}
```

### 9.2 云端存储实现

#### 9.2.1 Supabase配置
```javascript
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
```

#### 9.2.2 数据同步实现
```javascript
// 同步数据到云端
async function syncToCloud(data, table) {
  try {
    const { error } = await supabase
      .from(table)
      .upsert(data);
    
    if (error) {
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error('Sync to cloud failed:', error);
    return false;
  }
}

// 从云端同步数据
async function syncFromCloud(table, filters = {}) {
  try {
    const { data, error } = await supabase
      .from(table)
      .select('*')
      .match(filters);
    
    if (error) {
      throw error;
    }
    
    return data;
  } catch (error) {
    console.error('Sync from cloud failed:', error);
    return [];
  }
}

// 智能同步
async function smartSync() {
  // 检测网络连接
  if (!navigator.onLine) {
    console.log('Offline, will sync later');
    return;
  }
  
  try {
    // 获取本地变更
    const localChanges = await getLocalChanges();
    
    // 同步到云端
    for (const change of localChanges) {
      await syncToCloud(change.data, change.table);
    }
    
    // 从云端同步
    const tables = ['goals', 'tasks', 'records'];
    for (const table of tables) {
      const cloudData = await syncFromCloud(table, { user_id: currentUser.id });
      await updateLocalData(table, cloudData);
    }
    
    console.log('Sync completed');
  } catch (error) {
    console.error('Smart sync failed:', error);
  }
}
```

## 10. 总结

本数据模型和存储方案设计了完整的数据结构和混合存储策略，确保数据的安全性、可靠性和可用性。通过本地存储和云端存储的结合，实现了离线使用和数据同步的功能，为用户提供了更好的使用体验。

同时，通过合理的数据同步策略和安全措施，确保了数据的一致性和安全性。该方案不仅满足了当前项目的需求，也为未来的功能扩展和性能优化提供了基础。