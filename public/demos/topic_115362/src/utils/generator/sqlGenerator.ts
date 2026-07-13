import type { Control, ProjectConfig, GeneratedFile } from "@/types";

export function generateSqlFile(config: ProjectConfig, controls: Control[]): GeneratedFile {
  return {
    path: `sql/${config.tableName}.sql`,
    lang: "sql",
    side: "backend",
    content: generateCreateTable(config, controls),
  };
}

function generateCreateTable(config: ProjectConfig, controls: Control[]): string {
  const columns = controls
    .filter((c) => c.type !== "table")
    .map((c) => {
      const colName = toDbColumn(c.field);
      const typeStr = buildDbType(c);
      const nullable = c.required ? " NOT NULL" : " NULL";
      const comment = ` COMMENT '${c.label}'`;
      return `  \`${colName}\` ${typeStr}${nullable}${comment}`;
    })
    .join(",\n");

  return `-- ${config.entityName} 表
-- 数据库: MySQL
DROP TABLE IF EXISTS \`${config.tableName}\`;
CREATE TABLE \`${config.tableName}\` (
  \`id\` BIGINT NOT NULL COMMENT '主键',
${columns},
  \`create_time\` DATETIME NULL COMMENT '创建时间',
  \`update_time\` DATETIME NULL COMMENT '更新时间',
  \`deleted\` TINYINT NULL DEFAULT 0 COMMENT '逻辑删除',
  PRIMARY KEY (\`id\`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='${config.entityName}';
`;
}

function buildDbType(c: Control): string {
  if (c.type === "textarea") return "TEXT";
  if (c.type === "date") return "DATE";
  if (c.type === "time") return "TIME";
  if (c.type === "datetime") return "DATETIME";
  if (c.type === "number") {
    if (c.javaType === "Long") return "BIGINT";
    if (c.javaType === "BigDecimal") return `DECIMAL(${c.length ?? 18}, 2)`;
    return "INT";
  }
  if (c.type === "switch") return "TINYINT";
  // varchar
  const len = c.length && c.length > 0 ? c.length : 255;
  return `VARCHAR(${len})`;
}

function toDbColumn(field: string): string {
  return field.replace(/([A-Z])/g, "_$1").toLowerCase();
}
