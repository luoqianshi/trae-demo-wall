# 后端 CRUD 模板

> Entity / Mapper / Service / Controller 完整模板。

---

## 一、Entity 模板

```java
package com.ice.template.model.entity;

import com.baomidou.mybatisplus.annotation.*;
import lombok.Data;
import java.io.Serializable;
import java.util.Date;

@TableName("module_name")
@Data
public class Module implements Serializable {

    @TableId(type = IdType.ASSIGN_ID)   // 雪花 ID
    private Long id;

    @TableField("field_name")           // 显式映射
    private String fieldName;

    @TableField("user_id")
    private Long userId;

    @TableField("create_time")
    private Date createTime;            // 数据库维护

    @TableField("update_time")
    private Date updateTime;            // 数据库维护

    @TableLogic
    @TableField("is_delete")
    private Integer isDelete;

    @TableField(exist = false)
    private static final long serialVersionUID = 1L;
}
```

---

## 二、Mapper 接口

```java
package com.ice.template.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.ice.template.model.entity.Module;

public interface ModuleMapper extends BaseMapper<Module> {
    // 复杂查询写 XML，简单 CRUD 用 BaseMapper
}
```

---

## 三、Service 接口

```java
package com.ice.template.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.ice.template.model.entity.Module;
import com.ice.template.model.dto.module.ModuleQueryRequest;

public interface ModuleService extends IService<Module> {
    void validModule(Module module, boolean add);
}
```

---

## 四、Service 实现

```java
package com.ice.template.service.impl;

import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.ice.template.common.ErrorCode;
import com.ice.template.exception.BusinessException;
import com.ice.template.exception.ThrowUtils;
import com.ice.template.mapper.ModuleMapper;
import com.ice.template.model.entity.Module;
import com.ice.template.service.ModuleService;
import org.springframework.stereotype.Service;
import org.apache.commons.lang3.StringUtils;

@Service
public class ModuleServiceImpl extends ServiceImpl<ModuleMapper, Module>
        implements ModuleService {

    @Override
    public void validModule(Module module, boolean add) {
        if (module == null) {
            throw new BusinessException(ErrorCode.PARAMS_ERROR);
        }
        String fieldName = module.getFieldName();
        if (add) {
            ThrowUtils.throwIf(StringUtils.isBlank(fieldName), 
                ErrorCode.PARAMS_ERROR, "字段名不能为空");
        }
    }
}
```

---

## 五、DTO 模板

```java
// 查询请求
@Data
@ApiModel("模块查询请求")
public class ModuleQueryRequest extends PageRequest {
    @ApiModelProperty("用户 id")
    private Long userId;
    @ApiModelProperty("状态")
    private Integer status;
}

// 新增请求
@Data
@ApiModel("模块新增请求")
public class ModuleAddRequest implements Serializable {
    @ApiModelProperty("字段名")
    private String fieldName;
    private static final long serialVersionUID = 1L;
}

// 更新请求
@Data
@ApiModel("模块更新请求")
public class ModuleUpdateRequest implements Serializable {
    @ApiModelProperty("id")
    private Long id;
    @ApiModelProperty("字段名")
    private String fieldName;
    private static final long serialVersionUID = 1L;
}
```

---

## 六、VO 模板

```java
@Data
@ApiModel("模块视图")
public class ModuleVO implements Serializable {
    private String id;              // String 前端用
    private String fieldName;
    private String createTime;
    private static final long serialVersionUID = 1L;
}
```

---

## 七、Controller 模板

```java
package com.ice.template.controller;

import com.ice.template.annotation.AuthCheck;
import com.ice.template.common.*;
import com.ice.template.constant.UserConstant;
import com.ice.template.exception.BusinessException;
import com.ice.template.model.dto.module.*;
import com.ice.template.model.entity.Module;
import com.ice.template.model.vo.ModuleVO;
import com.ice.template.service.ModuleService;
import com.ice.template.service.UserService;
import io.swagger.annotations.Api;
import io.swagger.annotations.ApiOperation;
import org.springframework.web.bind.annotation.*;
import javax.annotation.Resource;
import javax.servlet.http.HttpServletRequest;

@RestController
@RequestMapping("/module")
@Api(tags = "模块管理")
public class ModuleController {

    @Resource
    private ModuleService moduleService;
    @Resource
    private UserService userService;

    @PostMapping("/add")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    @ApiOperation("新增模块")
    public BaseResponse<Long> addModule(@RequestBody ModuleAddRequest req) {
        moduleService.validModule(req, true);
        Module module = new Module();
        // BeanUtils.copyProperties(req, module);
        moduleService.save(module);
        return ResultUtils.success(module.getId());
    }

    @PostMapping("/delete")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    @ApiOperation("删除模块")
    public BaseResponse<Boolean> deleteModule(@RequestBody DeleteRequest req) {
        if (req.getId() == null) throw new BusinessException(ErrorCode.PARAMS_ERROR);
        return ResultUtils.success(moduleService.removeById(req.getId()));
    }

    @PostMapping("/update")
    @AuthCheck(mustRole = UserConstant.ADMIN_ROLE)
    @ApiOperation("更新模块")
    public BaseResponse<Boolean> updateModule(@RequestBody ModuleUpdateRequest req) {
        if (req.getId() == null) throw new BusinessException(ErrorCode.PARAMS_ERROR);
        Module module = moduleService.getById(req.getId());
        ThrowUtils.throwIf(module == null, ErrorCode.NOT_FOUND_ERROR);
        // BeanUtils.copyProperties(req, module);
        return ResultUtils.success(moduleService.updateById(module));
    }

    @PostMapping("/list/page/vo")
    @ApiOperation("分页获取模块列表")
    public BaseResponse<Page<ModuleVO>> listModuleVOByPage(@RequestBody ModuleQueryRequest req) {
        long current = req.getCurrent();
        long size = req.getPageSize();
        // QueryWrapper + 转换 VO
        return ResultUtils.success(null); // 简化示例
    }
}
```

---

## 八、新增模块 Checklist

- [ ] 1. 建表 `sql/create_table.sql`
- [ ] 2. Entity `model/entity/Module.java`
- [ ] 3. Mapper `mapper/ModuleMapper.java` + `mapper/ModuleMapper.xml`
- [ ] 4. Service `service/ModuleService.java` + `service/impl/ModuleServiceImpl.java`
- [ ] 5. DTO `model/dto/module/`（Add/Update/Query）
- [ ] 6. VO `model/vo/ModuleVO.java`
- [ ] 7. Controller `controller/ModuleController.java`
- [ ] 8. Swagger 注解 `@ApiModel`/`@ApiModelProperty`