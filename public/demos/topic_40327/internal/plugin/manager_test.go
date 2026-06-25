package plugin

import (
	"os"
	"path/filepath"
	"testing"
)

// createTestPlugin 在指定目录下创建最小可用的插件 fixture
func createTestPlugin(t *testing.T, dir, id, name, jsContent string) {
	t.Helper()

	pluginDir := filepath.Join(dir, id)
	if err := os.MkdirAll(pluginDir, 0755); err != nil {
		t.Fatalf("创建测试插件目录失败: %v", err)
	}

	manifest := `{
		"manifestVersion": 2,
		"id": "` + id + `",
		"name": "` + name + `",
		"version": "1.0.0",
		"author": "test",
		"description": "测试插件",
		"main": "index.js",
		"type": "command",
		"hooks": ["chat.receive.before_process"],
		"permissions": ["event.subscribe", "hook.register"],
		"capabilities": ["send.text"]
	}`

	if err := os.WriteFile(filepath.Join(pluginDir, "plugin.json"), []byte(manifest), 0644); err != nil {
		t.Fatalf("写入 plugin.json 失败: %v", err)
	}

	if jsContent == "" {
		jsContent = `// 最小测试插件
function onLoad() {
	console.log("Test plugin loaded: ` + id + `");
}
function onUnload() {
	console.log("Test plugin unloaded: ` + id + `");
}`
	}

	if err := os.WriteFile(filepath.Join(pluginDir, "index.js"), []byte(jsContent), 0644); err != nil {
		t.Fatalf("写入 index.js 失败: %v", err)
	}
}

// ── LoadAll 测试 ──

func TestLoadAll_EmptyDir(t *testing.T) {
	tmpDir := t.TempDir()
	pm := InitPluginManager(tmpDir)

	err := pm.LoadAll()
	if err != nil {
		t.Fatalf("LoadAll 空目录失败: %v", err)
	}

	if pm.PluginCount() != 0 {
		t.Errorf("空目录应有 0 个插件，实际 %d 个", pm.PluginCount())
	}
}

func TestLoadAll_SinglePlugin(t *testing.T) {
	tmpDir := t.TempDir()
	createTestPlugin(t, tmpDir, "com.test.basic", "Basic Plugin", "")

	pm := InitPluginManager(tmpDir)
	err := pm.LoadAll()
	if err != nil {
		t.Fatalf("LoadAll 失败: %v", err)
	}

	if pm.PluginCount() != 1 {
		t.Errorf("应有 1 个插件，实际 %d 个", pm.PluginCount())
	}
	if !pm.IsLoaded("com.test.basic") {
		t.Error("插件 com.test.basic 应该已加载")
	}
}

func TestLoadAll_MultiplePlugins(t *testing.T) {
	tmpDir := t.TempDir()
	createTestPlugin(t, tmpDir, "com.test.plugin-a", "Plugin A", "")
	createTestPlugin(t, tmpDir, "com.test.plugin-b", "Plugin B", "")

	pm := InitPluginManager(tmpDir)
	err := pm.LoadAll()
	if err != nil {
		t.Fatalf("LoadAll 失败: %v", err)
	}

	if pm.PluginCount() != 2 {
		t.Errorf("应有 2 个插件，实际 %d 个", pm.PluginCount())
	}
	if !pm.IsLoaded("com.test.plugin-a") {
		t.Error("插件 A 应该已加载")
	}
	if !pm.IsLoaded("com.test.plugin-b") {
		t.Error("插件 B 应该已加载")
	}
}

func TestLoadAll_SkipNoManifest(t *testing.T) {
	tmpDir := t.TempDir()

	// 创建一个没有 plugin.json 的目录
	noManifestDir := filepath.Join(tmpDir, "no-manifest")
	os.MkdirAll(noManifestDir, 0755)

	// 创建一个有 plugin.json 的目录
	createTestPlugin(t, tmpDir, "com.test.valid", "Valid Plugin", "")

	pm := InitPluginManager(tmpDir)
	err := pm.LoadAll()
	if err != nil {
		t.Fatalf("LoadAll 失败: %v", err)
	}

	if pm.PluginCount() != 1 {
		t.Errorf("应有 1 个插件，实际 %d 个", pm.PluginCount())
	}
	if !pm.IsLoaded("com.test.valid") {
		t.Error("有效插件应该已加载")
	}
}

func TestLoadAll_DisabledPlugin(t *testing.T) {
	tmpDir := t.TempDir()
	createTestPlugin(t, tmpDir, "com.test.disabled", "Disabled Plugin", "")

	pm := InitPluginManager(tmpDir)
	pm.DisablePlugin("com.test.disabled")

	err := pm.LoadAll()
	if err != nil {
		t.Fatalf("LoadAll 失败: %v", err)
	}

	if pm.PluginCount() != 0 {
		t.Errorf("禁用的插件不应加载，实际 %d 个", pm.PluginCount())
	}
	if pm.IsLoaded("com.test.disabled") {
		t.Error("禁用的插件不应该被加载")
	}
}

// ── Reload 测试 ──

func TestReload_Success(t *testing.T) {
	tmpDir := t.TempDir()
	createTestPlugin(t, tmpDir, "com.test.reload", "Reload Plugin", "")

	pm := InitPluginManager(tmpDir)
	if err := pm.LoadAll(); err != nil {
		t.Fatalf("LoadAll 失败: %v", err)
	}

	if !pm.IsLoaded("com.test.reload") {
		t.Fatal("初始加载失败")
	}

	// 执行 Reload
	err := pm.Reload("com.test.reload")
	if err != nil {
		t.Fatalf("Reload 失败: %v", err)
	}

	if !pm.IsLoaded("com.test.reload") {
		t.Error("Reload 后插件应该仍然已加载")
	}
}

func TestReload_NotFound(t *testing.T) {
	tmpDir := t.TempDir()
	pm := InitPluginManager(tmpDir)

	err := pm.Reload("com.test.nonexistent")
	if err == nil {
		t.Error("Reload 不存在的插件应该报错")
	}
}

func TestReload_TwiceIsIdempotent(t *testing.T) {
	tmpDir := t.TempDir()
	createTestPlugin(t, tmpDir, "com.test.twice", "Twice Plugin", "")

	pm := InitPluginManager(tmpDir)
	if err := pm.LoadAll(); err != nil {
		t.Fatalf("LoadAll 失败: %v", err)
	}

	// 第一次 Reload
	if err := pm.Reload("com.test.twice"); err != nil {
		t.Fatalf("第一次 Reload 失败: %v", err)
	}

	// 第二次 Reload
	if err := pm.Reload("com.test.twice"); err != nil {
		t.Fatalf("第二次 Reload 失败: %v", err)
	}

	if !pm.IsLoaded("com.test.twice") {
		t.Error("两次 Reload 后插件应该仍已加载")
	}
}

// ── Discover 测试 ──

func TestDiscover_Success(t *testing.T) {
	tmpDir := t.TempDir()
	createTestPlugin(t, tmpDir, "com.test.disco", "Discovery Plugin", "")

	pm := InitPluginManager(tmpDir)
	manifests, err := pm.Discover()
	if err != nil {
		t.Fatalf("Discover 失败: %v", err)
	}

	if len(manifests) != 1 {
		t.Errorf("应发现 1 个插件，实际 %d 个", len(manifests))
	}
	if manifests[0].ID != "com.test.disco" {
		t.Errorf("插件 ID = %s, 期望 com.test.disco", manifests[0].ID)
	}
}

func TestDiscover_EmptyDir(t *testing.T) {
	tmpDir := t.TempDir()
	pm := InitPluginManager(tmpDir)

	manifests, err := pm.Discover()
	if err != nil {
		t.Fatalf("Discover 失败: %v", err)
	}

	if len(manifests) != 0 {
		t.Errorf("空目录应发现 0 个插件，实际 %d 个", len(manifests))
	}
}

// ── Unload 测试 ──

func TestUnload_Success(t *testing.T) {
	tmpDir := t.TempDir()
	createTestPlugin(t, tmpDir, "com.test.unload", "Unload Plugin", "")

	pm := InitPluginManager(tmpDir)
	if err := pm.LoadAll(); err != nil {
		t.Fatalf("LoadAll 失败: %v", err)
	}

	if !pm.IsLoaded("com.test.unload") {
		t.Fatal("加载后插件应该已加载")
	}

	if err := pm.Unload("com.test.unload"); err != nil {
		t.Fatalf("Unload 失败: %v", err)
	}

	if pm.IsLoaded("com.test.unload") {
		t.Error("Unload 后插件应该不再标记为已加载")
	}
}

func TestUnload_NotFound(t *testing.T) {
	tmpDir := t.TempDir()
	pm := InitPluginManager(tmpDir)

	err := pm.Unload("com.test.nonexistent")
	if err == nil {
		t.Error("Unload 不存在的插件应该报错")
	}
}

// ── GetPluginStatus / GetPluginIDs 测试 ──

func TestGetPluginStatus(t *testing.T) {
	tmpDir := t.TempDir()
	createTestPlugin(t, tmpDir, "com.test.status", "Status Plugin", "")

	pm := InitPluginManager(tmpDir)

	// 加载前应该返回 Unloaded
	status := pm.GetPluginStatus("com.test.status")
	if status != PluginStatusUnloaded {
		t.Errorf("加载前状态应为 Unloaded，实际 %s", status)
	}

	if err := pm.LoadAll(); err != nil {
		t.Fatalf("LoadAll 失败: %v", err)
	}

	status = pm.GetPluginStatus("com.test.status")
	if status != PluginStatusLoaded {
		t.Errorf("加载后状态应为 Loaded，实际 %s", status)
	}

	// 不存在插件
	status = pm.GetPluginStatus("com.test.nonexistent")
	if status != PluginStatusUnloaded {
		t.Errorf("不存在插件状态应为 Unloaded，实际 %s", status)
	}
}

func TestGetPluginIDs(t *testing.T) {
	tmpDir := t.TempDir()
	createTestPlugin(t, tmpDir, "com.test.a", "Plugin A", "")
	createTestPlugin(t, tmpDir, "com.test.b", "Plugin B", "")

	pm := InitPluginManager(tmpDir)
	if err := pm.LoadAll(); err != nil {
		t.Fatalf("LoadAll 失败: %v", err)
	}

	ids := pm.GetPluginIDs()
	if len(ids) != 2 {
		t.Errorf("应有 2 个插件 ID，实际 %d 个", len(ids))
	}
}

// ── Enable/Disable 测试 ──

func TestEnableDisable(t *testing.T) {
	tmpDir := t.TempDir()
	pm := InitPluginManager(tmpDir)

	pm.DisablePlugin("com.test.xyz")
	disabled := pm.GetDisabledList()
	if !disabled["com.test.xyz"] {
		t.Error("禁用后应该在禁用列表中")
	}

	pm.EnablePlugin("com.test.xyz")
	disabled = pm.GetDisabledList()
	if disabled["com.test.xyz"] {
		t.Error("启用后不应在禁用列表中")
	}
}

// ── Shutdown 测试 ──

func TestShutdown_CleansUp(t *testing.T) {
	tmpDir := t.TempDir()
	createTestPlugin(t, tmpDir, "com.test.shutdown", "Shutdown Plugin", "")

	pm := InitPluginManager(tmpDir)
	if err := pm.LoadAll(); err != nil {
		t.Fatalf("LoadAll 失败: %v", err)
	}

	if pm.PluginCount() != 1 {
		t.Fatalf("应有 1 个插件，实际 %d 个", pm.PluginCount())
	}

	pm.Shutdown()

	if pm.PluginCount() != 0 {
		t.Errorf("Shutdown 后应有 0 个插件，实际 %d 个", pm.PluginCount())
	}
}
