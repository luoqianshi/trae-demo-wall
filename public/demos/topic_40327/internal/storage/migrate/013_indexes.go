package migrate

import (
	"database/sql"
)

func init() {
	Register(Migration{
		Version:     13,
		Description: "补充缺失的性能索引",
		Up: func(tx *sql.Tx) error {
			indexes := []string{
				// 高优先级：消息查询
				`CREATE INDEX IF NOT EXISTS idx_messages_platform_sender_ts ON messages(platform, sender_id, timestamp)`,
				`CREATE INDEX IF NOT EXISTS idx_messages_platform_group_ts ON messages(platform, group_id, timestamp)`,

				// 高优先级：排序查询
				`CREATE INDEX IF NOT EXISTS idx_person_profiles_updated ON person_profiles(updated_at)`,
				`CREATE INDEX IF NOT EXISTS idx_knowledge_entries_updated ON knowledge_entries(updated_at)`,
				`CREATE INDEX IF NOT EXISTS idx_graph_relations_created ON graph_relations(created_at)`,

				// 中优先级
				`CREATE INDEX IF NOT EXISTS idx_jargon_dict_updated ON jargon_dict(updated_at)`,
				`CREATE INDEX IF NOT EXISTS idx_tong_shadow_portraits_created ON tong_shadow_portraits(created_at)`,
				`CREATE INDEX IF NOT EXISTS idx_emojis_is_banned ON emojis(is_banned)`,
			}

			for _, idx := range indexes {
				if _, err := tx.Exec(idx); err != nil {
					return err
				}
			}
			return nil
		},
	})
}