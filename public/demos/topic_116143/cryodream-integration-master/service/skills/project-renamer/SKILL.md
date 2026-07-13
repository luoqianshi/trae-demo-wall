---
name: "project-renamer"
description: "Renames the SpringBoot template project package name and artifact ID. Invoke when user asks to rename project, change package name, or initialize template project with new name."
---

# Project Renamer Skill

This skill helps rename the SpringBoot template project from `com.ice.springbootinit` to a new package name specified by the user.

## When to Invoke

- User asks to rename the project
- User wants to change the package name
- User wants to initialize the template with their own project name
- User mentions changing `springbootinit` to something else

## Execution Steps

When invoked, follow these steps:

### Step 1: Gather Information

Ask the user for:
1. **New package name** (e.g., `com.yourcompany.yourproject`) - Required
2. **New artifact ID** (e.g., `your-project`) - Optional, defaults to last part of package name

### Step 2: Confirm Changes

Show the user what will be changed:
- Old package: `com.ice.springbootinit`
- New package: `[user input]`
- Old artifact: `springboot-init`
- New artifact: `[user input or auto-generated]`

Ask for confirmation before proceeding.

### Step 3: Execute Renaming

Perform the following operations in order:

#### 3.1 Rename Package Directories

```powershell
# Rename main source directory
Move-Item -Path "src\main\java\com\ice\springbootinit" -Destination "src\main\java\[new_package_path]" -Force

# Rename test source directory
Move-Item -Path "src\test\java\com\ice\springbootinit" -Destination "src\test\java\[new_package_path]" -Force
```

Convert package name to path: `com.yourcompany.yourproject` → `com\yourcompany\yourproject`

#### 3.2 Replace Package Name in All Java Files

Search and replace `com.ice.springbootinit` with the new package name in:
- All `.java` files under `src/main/java/`
- All `.java` files under `src/test/java/`

Use PowerShell or search-replace tools to update:
- `package` declarations
- `import` statements
- Any other references

#### 3.3 Replace Package Name in All XML Files

Search and replace `com.ice.springbootinit` with the new package name in:
- `src/main/resources/mapper/*.xml` (MyBatis mapper namespaces)
- Any other XML configuration files

#### 3.4 Update pom.xml

Replace in `pom.xml`:
```xml
<!-- Replace artifactId -->
<artifactId>springboot-init</artifactId> → <artifactId>[new-artifact]</artifactId>

<!-- Replace name -->
<name>springboot-init</name> → <name>[new-artifact]</name>
```

#### 3.5 Update application.yml

Replace in `src/main/resources/application.yml`:
```yaml
spring:
  application:
    name: springboot-init → name: [new-artifact]
```

#### 3.6 Clean Build Cache

Delete the `target` directory to ensure clean compilation:
```powershell
Remove-Item -Path "target" -Recurse -Force
```

### Step 4: Verify and Inform

After completing all changes:

1. Inform the user what was changed
2. Provide next steps:
   ```
   ✅ 重命名完成！
   
   下一步操作：
   1. 在 IDE 中刷新项目
   2. 执行 mvn clean compile 重新编译
   3. 启动项目验证是否正常运行
   ```

## Important Notes

- **File Encoding**: When modifying files, preserve UTF-8 encoding
- **Backup**: Suggest user commits or backs up before renaming
- **IDE Refresh**: Remind user to refresh/reload the project in their IDE
- **Compilation**: Always recommend `mvn clean compile` after renaming

## Example Usage

**User**: "我想把项目名改成 com.alibaba.order"

**Assistant**: 
1. Confirms: "将把包名从 `com.ice.springbootinit` 改为 `com.alibaba.order`，项目名从 `springboot-init` 改为 `order`，是否继续？"
2. After confirmation, executes all steps above
3. Reports completion with next steps

## Files to Modify

| File/Directory | Action |
|----------------|--------|
| `src/main/java/com/ice/springbootinit/` | Rename directory |
| `src/test/java/com/ice/springbootinit/` | Rename directory |
| `src/**/*.java` | Replace package references |
| `src/main/resources/mapper/*.xml` | Replace package references |
| `pom.xml` | Update artifactId and name |
| `src/main/resources/application.yml` | Update application name |
| `target/` | Delete (clean cache) |

## Common Issues

### Issue: PowerShell execution policy blocks scripts
**Solution**: Use search-replace tools directly instead of running scripts

### Issue: IDE still shows old package names
**Solution**: Advise user to invalidate caches and restart IDE

### Issue: Compilation errors after rename
**Solution**: Check that all directories and references were updated consistently
