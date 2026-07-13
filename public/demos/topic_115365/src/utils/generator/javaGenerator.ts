import type { Control, ProjectConfig, GeneratedFile } from "@/types";

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const pkgPath = (pkg: string, sub: string) => `${pkg}.${sub}`;

export function generateJavaFiles(config: ProjectConfig, controls: Control[]): GeneratedFile[] {
  const files: GeneratedFile[] = [];
  const e = config.entityName;
  const pkg = config.packageName;

  files.push({ path: `entity/${e}.java`, lang: "java", side: "backend", content: genEntity(config, controls) });
  files.push({ path: `mapper/${e}Mapper.java`, lang: "java", side: "backend", content: genMapper(config, controls) });
  files.push({ path: `mapper/xml/${e}Mapper.xml`, lang: "xml", side: "backend", content: genMapperXml(config, controls) });
  files.push({ path: `service/${e}Service.java`, lang: "java", side: "backend", content: genService(config) });
  files.push({ path: `service/impl/${e}ServiceImpl.java`, lang: "java", side: "backend", content: genServiceImpl(config) });
  files.push({ path: `controller/${e}Controller.java`, lang: "java", side: "backend", content: genController(config, controls) });
  files.push({ path: `application.yml`, lang: "yaml", side: "backend", content: genYaml(config) });

  return files;
}

// Entity 实体类
function genEntity(config: ProjectConfig, controls: Control[]): string {
  const e = config.entityName;
  const pkg = config.packageName;
  const fields = controls
    .filter((c) => c.type !== "table")
    .map((c) => {
      const comment = `    /** ${c.label} */\n`;
      return `${comment}    private ${c.javaType} ${c.field};`;
    })
    .join("\n\n");
  const imports = new Set<string>(["java.io.Serializable"]);
  controls.forEach((c) => {
    if (c.javaType === "LocalDate") imports.add("java.time.LocalDate");
    if (c.javaType === "LocalTime") imports.add("java.time.LocalTime");
    if (c.javaType === "LocalDateTime") imports.add("java.time.LocalDateTime");
    if (c.javaType === "BigDecimal") imports.add("java.math.BigDecimal");
  });
  const importLines = [...imports].map((i) => `import ${i};`).join("\n");

  return `package ${pkgPath(pkg, "entity")};

${importLines}
import com.baomidou.mybatisplus.annotation.TableName;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.IdType;
import lombok.Data;

@Data
@TableName("${config.tableName}")
public class ${e} implements Serializable {

    private static final long serialVersionUID = 1L;

    /** 主键 */
    @TableId(type = IdType.ASSIGN_ID)
    private Long id;

${fields}
}
`;
}

// Mapper 接口
function genMapper(config: ProjectConfig, controls: Control[]): string {
  const e = config.entityName;
  const pkg = config.packageName;
  return `package ${pkgPath(pkg, "mapper")};

import ${pkgPath(pkg, "entity")}.${e};
import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ${e}Mapper extends BaseMapper<${e}> {
}
`;
}

// Mapper XML
function genMapperXml(config: ProjectConfig, controls: Control[]): string {
  const e = config.entityName;
  const pkg = config.packageName;
  const columns = ["id", ...controls.filter((c) => c.type !== "table").map((c) => toDbColumn(c.field))].join(", ");
  const props = ["id", ...controls.filter((c) => c.type !== "table").map((c) => c.field)].join(", ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="${pkgPath(pkg, "mapper")}.${e}Mapper">

    <resultMap id="BaseResultMap" type="${pkgPath(pkg, "entity")}.${e}">
        <id column="id" property="id"/>
${controls.filter((c) => c.type !== "table").map((c) => `        <result column="${toDbColumn(c.field)}" property="${c.field}"/>`).join("\n")}
    </resultMap>

    <sql id="Base_Column_List">
        ${columns}
    </sql>

    <select id="selectById" resultMap="BaseResultMap">
        select <include refid="Base_Column_List"/>
        from ${config.tableName}
        where id = #{id}
    </select>

</mapper>
`;
}

// Service 接口
function genService(config: ProjectConfig): string {
  const e = config.entityName;
  const pkg = config.packageName;
  return `package ${pkgPath(pkg, "service")};

import ${pkgPath(pkg, "entity")}.${e};
import com.baomidou.mybatisplus.extension.service.IService;

public interface ${e}Service extends IService<${e}> {
}
`;
}

// Service 实现
function genServiceImpl(config: ProjectConfig): string {
  const e = config.entityName;
  const pkg = config.packageName;
  return `package ${pkgPath(pkg, "service.impl")};

import ${pkgPath(pkg, "entity")}.${e};
import ${pkgPath(pkg, "mapper")}.${e}Mapper;
import ${pkgPath(pkg, "service")}.${e}Service;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import org.springframework.stereotype.Service;

@Service
public class ${e}ServiceImpl extends ServiceImpl<${e}Mapper, ${e}> implements ${e}Service {
}
`;
}

// Controller
function genController(config: ProjectConfig, controls: Control[]): string {
  const e = config.entityName;
  const pkg = config.packageName;
  const path = config.apiPrefix + "/" + config.moduleName;
  return `package ${pkgPath(pkg, "controller")};

import ${pkgPath(pkg, "entity")}.${e};
import ${pkgPath(pkg, "service")}.${e}Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import java.util.List;

@RestController
@RequestMapping("${path}")
public class ${e}Controller {

    @Autowired
    private ${e}Service ${config.moduleName}Service;

    /** 分页查询 */
    @GetMapping("/page")
    public Page<${e}> page(@RequestParam(defaultValue = "1") long current,
                          @RequestParam(defaultValue = "10") long size) {
        return ${config.moduleName}Service.page(new Page<>(current, size));
    }

    /** 列表查询 */
    @GetMapping("/list")
    public List<${e}> list() {
        return ${config.moduleName}Service.list();
    }

    /** 详情 */
    @GetMapping("/{id}")
    public ${e} getById(@PathVariable Long id) {
        return ${config.moduleName}Service.getById(id);
    }

    /** 新增 */
    @PostMapping
    public boolean save(@RequestBody ${e} entity) {
        return ${config.moduleName}Service.save(entity);
    }

    /** 修改 */
    @PutMapping
    public boolean update(@RequestBody ${e} entity) {
        return ${config.moduleName}Service.updateById(entity);
    }

    /** 删除 */
    @DeleteMapping("/{id}")
    public boolean delete(@PathVariable Long id) {
        return ${config.moduleName}Service.removeById(id);
    }
}
`;
}

// application.yml
function genYaml(config: ProjectConfig): string {
  return `server:
  port: 8080

spring:
  datasource:
    driver-class-name: com.mysql.cj.jdbc.Driver
    url: jdbc:mysql://localhost:3306/your_db?useUnicode=true&characterEncoding=utf-8&serverTimezone=Asia/Shanghai
    username: root
    password: root

mybatis-plus:
  mapper-locations: classpath*:mapper/xml/*.xml
  configuration:
    map-underscore-to-camel-case: true
    log-impl: org.apache.ibatis.logging.stdout.StdOutImpl
  global-config:
    db-config:
      id-type: assign_id
      logic-delete-field: deleted
      logic-delete-value: 1
      logic-not-delete-value: 0
`;
}

// 驼峰转数据库下划线列名
function toDbColumn(field: string): string {
  return field.replace(/([A-Z])/g, "_$1").toLowerCase();
}
