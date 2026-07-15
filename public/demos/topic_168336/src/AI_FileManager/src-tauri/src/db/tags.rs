//! 标签管理模块
//! 标签 CRUD 操作、文件标签关联管理

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

/// 标签数据模型
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tag {
    pub id: i64,
    pub name: String,
    pub color: String,
    pub created_at: String,
    pub file_count: i64,
}

/// 创建标签
pub fn create_tag(conn: &Connection, name: &str, color: &str) -> Result<Tag, String> {
    let color = if color.is_empty() { "#4fc3f7" } else { color };
    conn.execute(
        "INSERT INTO tags (name, color) VALUES (?1, ?2)",
        params![name, color],
    )
    .map_err(|e| format!("创建标签失败: {}", e))?;

    let id = conn.last_insert_rowid();
    get_tag_by_id(conn, id)
}

/// 获取所有标签
pub fn get_all_tags(conn: &Connection) -> Result<Vec<Tag>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT t.id, t.name, t.color, t.created_at,
                    COALESCE(cnt.c, 0) AS file_count
             FROM tags t
             LEFT JOIN (SELECT tag_id, COUNT(*) AS c FROM file_tags GROUP BY tag_id) cnt
               ON t.id = cnt.tag_id
             ORDER BY t.name",
        )
        .map_err(|e| format!("查询标签失败: {}", e))?;

    let tags = stmt
        .query_map([], |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                created_at: row.get(3)?,
                file_count: row.get(4)?,
            })
        })
        .map_err(|e| format!("查询标签失败: {}", e))?
        .filter_map(|r| r.ok())
        .collect();

    Ok(tags)
}

/// 根据 ID 查询标签
pub fn get_tag_by_id(conn: &Connection, id: i64) -> Result<Tag, String> {
    conn.query_row(
        "SELECT t.id, t.name, t.color, t.created_at,
                COALESCE(cnt.c, 0) AS file_count
         FROM tags t
         LEFT JOIN (SELECT tag_id, COUNT(*) AS c FROM file_tags GROUP BY tag_id) cnt
           ON t.id = cnt.tag_id
         WHERE t.id = ?1",
        params![id],
        |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                created_at: row.get(3)?,
                file_count: row.get(4)?,
            })
        },
    )
    .map_err(|e| format!("查询标签失败: {}", e))
}

/// 更新标签
pub fn update_tag(conn: &Connection, id: i64, name: &str, color: &str) -> Result<Tag, String> {
    conn.execute(
        "UPDATE tags SET name = ?1, color = ?2 WHERE id = ?3",
        params![name, color, id],
    )
    .map_err(|e| format!("更新标签失败: {}", e))?;
    get_tag_by_id(conn, id)
}

/// 删除标签
pub fn delete_tag(conn: &Connection, id: i64) -> Result<(), String> {
    // 级联删除关联
    conn.execute("DELETE FROM file_tags WHERE tag_id = ?1", params![id])
        .map_err(|e| format!("删除标签关联失败: {}", e))?;
    conn.execute("DELETE FROM tags WHERE id = ?1", params![id])
        .map_err(|e| format!("删除标签失败: {}", e))?;
    Ok(())
}

/// 给文件添加标签
pub fn add_tag_to_file(conn: &Connection, file_id: i64, tag_id: i64) -> Result<(), String> {
    conn.execute(
        "INSERT OR IGNORE INTO file_tags (file_id, tag_id) VALUES (?1, ?2)",
        params![file_id, tag_id],
    )
    .map_err(|e| format!("添加标签失败: {}", e))?;
    Ok(())
}

/// 移除文件标签
pub fn remove_tag_from_file(conn: &Connection, file_id: i64, tag_id: i64) -> Result<(), String> {
    conn.execute(
        "DELETE FROM file_tags WHERE file_id = ?1 AND tag_id = ?2",
        params![file_id, tag_id],
    )
    .map_err(|e| format!("移除标签失败: {}", e))?;
    Ok(())
}

/// 获取文件的标签列表
pub fn get_file_tags(conn: &Connection, file_id: i64) -> Result<Vec<Tag>, String> {
    let mut stmt = conn
        .prepare(
            "SELECT t.id, t.name, t.color, t.created_at, 0 AS file_count
             FROM tags t
             INNER JOIN file_tags ft ON t.id = ft.tag_id
             WHERE ft.file_id = ?1
             ORDER BY t.name",
        )
        .map_err(|e| format!("查询文件标签失败: {}", e))?;

    let tags = stmt
        .query_map(params![file_id], |row| {
            Ok(Tag {
                id: row.get(0)?,
                name: row.get(1)?,
                color: row.get(2)?,
                created_at: row.get(3)?,
                file_count: row.get(4)?,
            })
        })
        .map_err(|e| format!("查询文件标签失败: {}", e))?
        .filter_map(|r| r.ok())
        .collect();

    Ok(tags)
}

/// 按标签查询文件
pub fn get_files_by_tag(conn: &Connection, tag_id: i64) -> Result<Vec<i64>, String> {
    let mut stmt = conn
        .prepare("SELECT file_id FROM file_tags WHERE tag_id = ?1 ORDER BY added_at DESC")
        .map_err(|e| format!("查询标签文件失败: {}", e))?;

    let ids = stmt
        .query_map(params![tag_id], |row| row.get(0))
        .map_err(|e| format!("查询标签文件失败: {}", e))?
        .filter_map(|r| r.ok())
        .collect();

    Ok(ids)
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::db::schema;
    use rusqlite::Connection;

    fn setup_db() -> Connection {
        let conn = Connection::open_in_memory().unwrap();
        schema::create_tables(&conn).unwrap();
        // 插入测试文件
        conn.execute_batch(
            "INSERT INTO file_metadata (path, md5_hash, sha256_hash, file_size, mime_type, created_at, modified_at)
             VALUES ('/test/a.txt', 'md5_a', 'sha256_a', 100, 'text/plain', datetime('now'), datetime('now'));
             INSERT INTO file_metadata (path, md5_hash, sha256_hash, file_size, mime_type, created_at, modified_at)
             VALUES ('/test/b.txt', 'md5_b', 'sha256_b', 200, 'text/plain', datetime('now'), datetime('now'));"
        ).unwrap();
        conn
    }

    #[test]
    fn test_create_and_get_tag() {
        let conn = setup_db();
        let tag = create_tag(&conn, "重要文档", "#ff0000").unwrap();
        assert_eq!(tag.name, "重要文档");
        assert_eq!(tag.color, "#ff0000");
        assert_eq!(tag.file_count, 0);

        let fetched = get_tag_by_id(&conn, tag.id).unwrap();
        assert_eq!(fetched.name, "重要文档");
    }

    #[test]
    fn test_create_duplicate_tag_fails() {
        let conn = setup_db();
        create_tag(&conn, "标签1", "#fff").unwrap();
        let result = create_tag(&conn, "标签1", "#000");
        assert!(result.is_err());
    }

    #[test]
    fn test_update_tag() {
        let conn = setup_db();
        let tag = create_tag(&conn, "旧名", "#fff").unwrap();
        let updated = update_tag(&conn, tag.id, "新名", "#000").unwrap();
        assert_eq!(updated.name, "新名");
        assert_eq!(updated.color, "#000");
    }

    #[test]
    fn test_delete_tag() {
        let conn = setup_db();
        let tag = create_tag(&conn, "待删除", "#fff").unwrap();
        assert!(get_tag_by_id(&conn, tag.id).is_ok());
        delete_tag(&conn, tag.id).unwrap();
        assert!(get_tag_by_id(&conn, tag.id).is_err());
    }

    #[test]
    fn test_add_and_remove_file_tag() {
        let conn = setup_db();
        let tag = create_tag(&conn, "测试标签", "#fff").unwrap();

        // 添加标签到文件
        add_tag_to_file(&conn, 1, tag.id).unwrap();
        let tags = get_file_tags(&conn, 1).unwrap();
        assert_eq!(tags.len(), 1);
        assert_eq!(tags[0].name, "测试标签");

        // 移除标签
        remove_tag_from_file(&conn, 1, tag.id).unwrap();
        let tags = get_file_tags(&conn, 1).unwrap();
        assert_eq!(tags.len(), 0);
    }

    #[test]
    fn test_get_files_by_tag() {
        let conn = setup_db();
        let tag = create_tag(&conn, "标签", "#fff").unwrap();
        add_tag_to_file(&conn, 1, tag.id).unwrap();
        add_tag_to_file(&conn, 2, tag.id).unwrap();

        let files = get_files_by_tag(&conn, tag.id).unwrap();
        assert_eq!(files.len(), 2);
        assert!(files.contains(&1));
        assert!(files.contains(&2));
    }

    #[test]
    fn test_file_count_in_tags() {
        let conn = setup_db();
        let tag = create_tag(&conn, "计数测试", "#fff").unwrap();
        add_tag_to_file(&conn, 1, tag.id).unwrap();
        add_tag_to_file(&conn, 2, tag.id).unwrap();

        let tags = get_all_tags(&conn).unwrap();
        assert_eq!(tags[0].file_count, 2);
    }
}