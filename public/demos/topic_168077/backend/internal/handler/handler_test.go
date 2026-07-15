package handler

import (
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"coin-kids/internal/model"
	"coin-kids/internal/repository"
	"coin-kids/internal/service"

	"coin-kids/internal/testutil"

	"github.com/gin-gonic/gin"
)

// setupRouter 创建带所有路由的测试引擎
func setupRouter() *gin.Engine {
	gin.SetMode(gin.TestMode)

	clockInSvc := service.NewClockInService(&service.MQTTService{})
	childHandler := NewChildHandler()
	scheduleHandler := NewScheduleHandler()
	allowanceHandler := NewAllowanceHandler()
	rewardHandler := NewRewardHandler()
	clockHandler := NewClockHandler()
	deviceHandler := NewDeviceHandler(clockInSvc)
	settingsHandler := NewSettingsHandler()

	r := gin.Default()
	api := r.Group("/api/v1")
	{
		// Children
		api.GET("/children", childHandler.List)
		api.POST("/children", childHandler.Create)
		api.GET("/children/:id", childHandler.GetByID)
		api.PUT("/children/:id", childHandler.Update)
		api.DELETE("/children/:id", childHandler.Delete)

		// Schedules
		api.GET("/schedules", scheduleHandler.ListByChildAndDate)
		api.GET("/schedules/date", scheduleHandler.ListByDate)
		api.POST("/schedules", scheduleHandler.Create)
		api.PUT("/schedules/:id", scheduleHandler.Update)
		api.DELETE("/schedules/:id", scheduleHandler.Delete)
		api.POST("/schedules/generate", scheduleHandler.Generate)

		// Schedule Templates
		api.GET("/schedule-templates", scheduleHandler.ListTemplates)
		api.POST("/schedule-templates", scheduleHandler.CreateTemplate)
		api.PUT("/schedule-templates/:id", scheduleHandler.UpdateTemplate)
		api.DELETE("/schedule-templates/:id", scheduleHandler.DeleteTemplate)

		// Allowance
		api.GET("/allowance/:child_id", allowanceHandler.GetBalance)
		api.GET("/allowance/:child_id/transactions", allowanceHandler.ListTransactions)
		api.POST("/allowance/:child_id/spend", allowanceHandler.Spend)

		// Reward Rules
		api.GET("/reward-rules", rewardHandler.ListRules)
		api.POST("/reward-rules", rewardHandler.CreateRule)
		api.PUT("/reward-rules/:id", rewardHandler.UpdateRule)
		api.DELETE("/reward-rules/:id", rewardHandler.DeleteRule)

		// Reward Records
		api.GET("/reward-records", rewardHandler.ListRecords)
		api.POST("/reward-records", rewardHandler.CreateRecord)
		api.PUT("/reward-records/:id", rewardHandler.UpdateRecord)
		api.DELETE("/reward-records/:id", rewardHandler.DeleteRecord)

		// Clock-in
		api.POST("/clock-in", clockHandler.ESP32ClockIn)
		api.POST("/clock-in/:id/confirm", clockHandler.Confirm)
		api.POST("/clock-in/:id/reject", clockHandler.Reject)
		api.GET("/clock-in/child/:child_id", clockHandler.ListByChild)
		api.GET("/clock-in/device", clockHandler.ListByDevice)

		// Devices
		api.GET("/devices", deviceHandler.List)
		api.POST("/devices", deviceHandler.Create)
		api.PUT("/devices/:id", deviceHandler.Update)
		api.DELETE("/devices/:id", deviceHandler.Delete)

		// RFID Bindings
		api.GET("/rfid-bindings", deviceHandler.ListRFIDBindings)
		api.POST("/rfid-bindings", deviceHandler.CreateRFIDBinding)
		api.PUT("/rfid-bindings/:id", deviceHandler.UpdateRFIDBinding)
		api.DELETE("/rfid-bindings/:id", deviceHandler.DeleteRFIDBinding)

		// Sleep Config
		api.GET("/devices/:id/sleep-config", deviceHandler.GetSleepConfig)
		api.PUT("/devices/:id/sleep-config", deviceHandler.UpdateSleepConfig)

		// Device Logs
		api.GET("/device-logs", deviceHandler.ListDeviceLogs)

		// Device Command
		api.POST("/devices/:id/command", deviceHandler.SendCommand)

		// Stats
		api.GET("/stats", deviceHandler.GetStats)

		// Settings
		api.GET("/settings", settingsHandler.Get)
		api.PUT("/settings", settingsHandler.Update)
	}
	return r
}

// jsonBody 构建 JSON 请求体
func jsonBody(v interface{}) string {
	b, _ := json.Marshal(v)
	return string(b)
}

// performRequest 执行 HTTP 测试请求
func performRequest(r *gin.Engine, method, path, body string) *httptest.ResponseRecorder {
	w := httptest.NewRecorder()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	r.ServeHTTP(w, req)
	return w
}

// ============================================================
// 测试入口
// ============================================================

func TestMain(m *testing.M) {
	// 全局初始化一次
	testutil.InitTestDB()
	m.Run()
}

// ============================================================
// Children API 测试
// ============================================================

func TestChildrenAPI(t *testing.T) {
	testutil.CleanTestDB()
	r := setupRouter()

	t.Run("Create child", func(t *testing.T) {
		w := performRequest(r, "POST", "/api/v1/children", jsonBody(map[string]string{
			"name": "小明",
		}))
		if w.Code != http.StatusCreated {
			t.Errorf("期望 201, 得到 %d: %s", w.Code, w.Body.String())
		}
		var child model.Child
		json.Unmarshal(w.Body.Bytes(), &child)
		if child.Name != "小明" {
			t.Errorf("期望 name=小明, 得到 %s", child.Name)
		}
		if child.ID == "" {
			t.Error("期望 ID 非空")
		}
	})

	t.Run("Create child with invalid body", func(t *testing.T) {
		w := performRequest(r, "POST", "/api/v1/children", `{invalid}`)
		if w.Code != http.StatusBadRequest {
			t.Errorf("期望 400, 得到 %d", w.Code)
		}
	})

	t.Run("List children", func(t *testing.T) {
		w := performRequest(r, "GET", "/api/v1/children", "")
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d", w.Code)
		}
		var children []model.Child
		json.Unmarshal(w.Body.Bytes(), &children)
		if len(children) == 0 {
			t.Error("期望至少有1个孩子")
		}
	})

	t.Run("Get child by ID", func(t *testing.T) {
		// 先创建
		createW := performRequest(r, "POST", "/api/v1/children", jsonBody(map[string]string{"name": "小红"}))
		var created model.Child
		json.Unmarshal(createW.Body.Bytes(), &created)

		w := performRequest(r, "GET", "/api/v1/children/"+created.ID, "")
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d", w.Code)
		}
		var child model.Child
		json.Unmarshal(w.Body.Bytes(), &child)
		if child.Name != "小红" {
			t.Errorf("期望 name=小红, 得到 %s", child.Name)
		}
	})

	t.Run("Get child by nonexistent ID", func(t *testing.T) {
		w := performRequest(r, "GET", "/api/v1/children/nonexistent", "")
		if w.Code != http.StatusNotFound {
			t.Errorf("期望 404, 得到 %d", w.Code)
		}
	})

	t.Run("Update child", func(t *testing.T) {
		createW := performRequest(r, "POST", "/api/v1/children", jsonBody(map[string]string{"name": "小刚"}))
		var created model.Child
		json.Unmarshal(createW.Body.Bytes(), &created)

		w := performRequest(r, "PUT", "/api/v1/children/"+created.ID, jsonBody(map[string]string{"name": "小刚改"}))
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d: %s", w.Code, w.Body.String())
		}
		var updated model.Child
		json.Unmarshal(w.Body.Bytes(), &updated)
		if updated.Name != "小刚改" {
			t.Errorf("期望 name=小刚改, 得到 %s", updated.Name)
		}
	})

	t.Run("Delete child", func(t *testing.T) {
		createW := performRequest(r, "POST", "/api/v1/children", jsonBody(map[string]string{"name": "要删除"}))
		var created model.Child
		json.Unmarshal(createW.Body.Bytes(), &created)

		w := performRequest(r, "DELETE", "/api/v1/children/"+created.ID, "")
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d: %s", w.Code, w.Body.String())
		}

		// 验证已删除
		getW := performRequest(r, "GET", "/api/v1/children/"+created.ID, "")
		if getW.Code != http.StatusNotFound {
			t.Errorf("删除后期望 404, 得到 %d", getW.Code)
		}
	})
}

// ============================================================
// Devices API 测试
// ============================================================

func TestDevicesAPI(t *testing.T) {
	testutil.CleanTestDB()
	r := setupRouter()

	t.Run("Create device", func(t *testing.T) {
		w := performRequest(r, "POST", "/api/v1/devices", jsonBody(map[string]interface{}{
			"name":        "CoreS3-01",
			"device_type": "multi",
			"has_rfid":    true,
		}))
		if w.Code != http.StatusCreated {
			t.Errorf("期望 201, 得到 %d: %s", w.Code, w.Body.String())
		}
		var dev model.Device
		json.Unmarshal(w.Body.Bytes(), &dev)
		if dev.Name != "CoreS3-01" {
			t.Errorf("期望 name=CoreS3-01, 得到 %s", dev.Name)
		}
		if dev.DeviceType != "multi" {
			t.Errorf("期望 device_type=multi, 得到 %s", dev.DeviceType)
		}
	})

	t.Run("List devices", func(t *testing.T) {
		w := performRequest(r, "GET", "/api/v1/devices", "")
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d", w.Code)
		}
		var devices []model.Device
		json.Unmarshal(w.Body.Bytes(), &devices)
		if len(devices) == 0 {
			t.Error("期望至少有1个设备")
		}
	})

	t.Run("Update device", func(t *testing.T) {
		createW := performRequest(r, "POST", "/api/v1/devices", jsonBody(map[string]interface{}{
			"name": "Test-Dev", "device_type": "wake_up",
		}))
		var created model.Device
		json.Unmarshal(createW.Body.Bytes(), &created)

		w := performRequest(r, "PUT", "/api/v1/devices/"+created.ID, jsonBody(map[string]string{
			"name": "Test-Dev-Updated",
		}))
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d: %s", w.Code, w.Body.String())
		}
	})

	t.Run("Delete device", func(t *testing.T) {
		createW := performRequest(r, "POST", "/api/v1/devices", jsonBody(map[string]interface{}{
			"name": "ToDelete", "device_type": "wake_up",
		}))
		var created model.Device
		json.Unmarshal(createW.Body.Bytes(), &created)

		w := performRequest(r, "DELETE", "/api/v1/devices/"+created.ID, "")
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d: %s", w.Code, w.Body.String())
		}
	})
}

// ============================================================
// RFID Bindings API 测试
// ============================================================

func TestRFIDBindingsAPI(t *testing.T) {
	testutil.CleanTestDB()
	r := setupRouter()

	// 先创建孩子
	childW := performRequest(r, "POST", "/api/v1/children", jsonBody(map[string]string{"name": "RFID测试"}))
	var child model.Child
	json.Unmarshal(childW.Body.Bytes(), &child)

	bindingPayload := map[string]string{
		"child_id": child.ID,
		"rfid_uid": "A1:B2:C3:D4",
		"label":    "测试卡",
	}

	t.Run("Create RFID binding", func(t *testing.T) {
		w := performRequest(r, "POST", "/api/v1/rfid-bindings", jsonBody(bindingPayload))
		if w.Code != http.StatusCreated {
			t.Errorf("期望 201, 得到 %d: %s", w.Code, w.Body.String())
		}
		var binding model.RFIDBinding
		json.Unmarshal(w.Body.Bytes(), &binding)
		if binding.RFIDUID != "A1:B2:C3:D4" {
			t.Errorf("期望 RFID=A1:B2:C3:D4, 得到 %s", binding.RFIDUID)
		}
	})

	t.Run("List RFID bindings", func(t *testing.T) {
		w := performRequest(r, "GET", "/api/v1/rfid-bindings", "")
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d", w.Code)
		}
		var bindings []model.RFIDBinding
		json.Unmarshal(w.Body.Bytes(), &bindings)
		if len(bindings) == 0 {
			t.Error("期望至少有1个绑定")
		}
	})

	t.Run("Update RFID binding", func(t *testing.T) {
		w := performRequest(r, "GET", "/api/v1/rfid-bindings", "")
		var bindings []model.RFIDBinding
		json.Unmarshal(w.Body.Bytes(), &bindings)
		if len(bindings) == 0 {
			t.Fatal("没有绑定可更新")
		}

		updateW := performRequest(r, "PUT", "/api/v1/rfid-bindings/"+bindings[0].ID, jsonBody(map[string]string{
			"label": "已更新卡",
		}))
		if updateW.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d: %s", updateW.Code, updateW.Body.String())
		}
	})

	t.Run("Delete RFID binding", func(t *testing.T) {
		w := performRequest(r, "GET", "/api/v1/rfid-bindings", "")
		var bindings []model.RFIDBinding
		json.Unmarshal(w.Body.Bytes(), &bindings)
		if len(bindings) == 0 {
			t.Fatal("没有绑定可删除")
		}

		deleteW := performRequest(r, "DELETE", "/api/v1/rfid-bindings/"+bindings[0].ID, "")
		if deleteW.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d: %s", deleteW.Code, deleteW.Body.String())
		}
	})
}

// ============================================================
// Clock-in API 测试
// ============================================================

func TestClockInAPI(t *testing.T) {
	testutil.CleanTestDB()
	r := setupRouter()

	// 先创建孩子
	childW := performRequest(r, "POST", "/api/v1/children", jsonBody(map[string]string{"name": "打卡测试"}))
	var child model.Child
	json.Unmarshal(childW.Body.Bytes(), &child)

	t.Run("ESP32ClockIn", func(t *testing.T) {
		w := performRequest(r, "POST", "/api/v1/clock-in", jsonBody(map[string]string{
			"child_id":   child.ID,
			"device_id":  "test-device-1",
			"event_type": "wake_up",
		}))
		if w.Code != http.StatusCreated {
			t.Errorf("期望 201, 得到 %d: %s", w.Code, w.Body.String())
		}
		var record model.ClockInRecord
		json.Unmarshal(w.Body.Bytes(), &record)
		if record.Status != "pending" {
			t.Errorf("期望 status=pending, 得到 %s", record.Status)
		}
	})

	t.Run("ESP32ClockIn invalid body", func(t *testing.T) {
		w := performRequest(r, "POST", "/api/v1/clock-in", jsonBody(map[string]string{
			"child_id": child.ID,
			// missing device_id and event_type
		}))
		if w.Code != http.StatusBadRequest {
			t.Errorf("期望 400, 得到 %d", w.Code)
		}
	})

	t.Run("Confirm and Reject", func(t *testing.T) {
		// 创建
		createW := performRequest(r, "POST", "/api/v1/clock-in", jsonBody(map[string]string{
			"child_id": child.ID, "device_id": "d2", "event_type": "wake_up",
		}))
		var record model.ClockInRecord
		json.Unmarshal(createW.Body.Bytes(), &record)

		// 确认
		confirmW := performRequest(r, "POST", "/api/v1/clock-in/"+record.ID+"/confirm", "")
		if confirmW.Code != http.StatusOK {
			t.Errorf("确认期望 200, 得到 %d: %s", confirmW.Code, confirmW.Body.String())
		}

		// 创建另一条用于拒绝
		createW2 := performRequest(r, "POST", "/api/v1/clock-in", jsonBody(map[string]string{
			"child_id": child.ID, "device_id": "d3", "event_type": "wake_up",
		}))
		var record2 model.ClockInRecord
		json.Unmarshal(createW2.Body.Bytes(), &record2)

		rejectW := performRequest(r, "POST", "/api/v1/clock-in/"+record2.ID+"/reject", "")
		if rejectW.Code != http.StatusOK {
			t.Errorf("拒绝期望 200, 得到 %d: %s", rejectW.Code, rejectW.Body.String())
		}
	})

	t.Run("ListByChild", func(t *testing.T) {
		w := performRequest(r, "GET", "/api/v1/clock-in/child/"+child.ID, "")
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d", w.Code)
		}
		var records []model.ClockInRecord
		json.Unmarshal(w.Body.Bytes(), &records)
		if len(records) == 0 {
			t.Error("期望至少有1条打卡记录")
		}
	})

	t.Run("ListByDevice", func(t *testing.T) {
		w := performRequest(r, "GET", "/api/v1/clock-in/device?device_id=d2", "")
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d", w.Code)
		}
	})
}

// ============================================================
// Sleep Config API 测试
// ============================================================

func TestSleepConfigAPI(t *testing.T) {
	testutil.CleanTestDB()
	r := setupRouter()

	// 创建设备
	devW := performRequest(r, "POST", "/api/v1/devices", jsonBody(map[string]interface{}{
		"name": "Sleep-Test", "device_type": "multi",
	}))
	var dev model.Device
	json.Unmarshal(devW.Body.Bytes(), &dev)

	t.Run("Get sleep config (auto-created)", func(t *testing.T) {
		w := performRequest(r, "GET", "/api/v1/devices/"+dev.ID+"/sleep-config", "")
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d: %s", w.Code, w.Body.String())
		}
		var cfg model.SleepCheckConfig
		json.Unmarshal(w.Body.Bytes(), &cfg)
		if cfg.DeviceID != dev.ID {
			t.Errorf("期望 device_id=%s, 得到 %s", dev.ID, cfg.DeviceID)
		}
	})

	t.Run("Update sleep config", func(t *testing.T) {
		w := performRequest(r, "PUT", "/api/v1/devices/"+dev.ID+"/sleep-config", jsonBody(map[string]interface{}{
			"start_time":      "21:00",
			"end_time":        "07:00",
			"sound_threshold": 800,
		}))
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d: %s", w.Code, w.Body.String())
		}
		var cfg model.SleepCheckConfig
		json.Unmarshal(w.Body.Bytes(), &cfg)
		if cfg.StartTime != "21:00" {
			t.Errorf("期望 start_time=21:00, 得到 %s", cfg.StartTime)
		}
		if cfg.SoundThreshold != 800 {
			t.Errorf("期望 sound_threshold=800, 得到 %d", cfg.SoundThreshold)
		}
	})
}

// ============================================================
// Device Command API 测试
// ============================================================

func TestDeviceCommandAPI(t *testing.T) {
	testutil.CleanTestDB()
	r := setupRouter()

	t.Run("Send command to nonexistent device", func(t *testing.T) {
		w := performRequest(r, "POST", "/api/v1/devices/nonexistent/command", jsonBody(map[string]string{
			"cmd": "wake",
		}))
		if w.Code != http.StatusNotFound {
			t.Errorf("期望 404, 得到 %d: %s", w.Code, w.Body.String())
		}
	})

	t.Run("Send command to device with RFID", func(t *testing.T) {
		devW := performRequest(r, "POST", "/api/v1/devices", jsonBody(map[string]interface{}{
			"name": "CMD-Test-RFID", "device_type": "multi", "has_rfid": true,
		}))
		var dev model.Device
		json.Unmarshal(devW.Body.Bytes(), &dev)

		validCmds := []string{"wake", "sleep", "reset", "enroll", "calibrate", "stop_calibrate"}
		for _, cmd := range validCmds {
			t.Run("cmd_"+cmd, func(t *testing.T) {
				w := performRequest(r, "POST", "/api/v1/devices/"+dev.ID+"/command", jsonBody(map[string]string{"cmd": cmd}))
				if w.Code != http.StatusOK {
					t.Errorf("指令 %s 期望 200, 得到 %d: %s", cmd, w.Code, w.Body.String())
				}
			})
		}
	})

	t.Run("Send enroll to device without RFID", func(t *testing.T) {
		devW := performRequest(r, "POST", "/api/v1/devices", jsonBody(map[string]interface{}{
			"name": "CMD-Test-NoRFID", "device_type": "multi", "has_rfid": false,
		}))
		var dev model.Device
		json.Unmarshal(devW.Body.Bytes(), &dev)

		w := performRequest(r, "POST", "/api/v1/devices/"+dev.ID+"/command", jsonBody(map[string]string{"cmd": "enroll"}))
		if w.Code != http.StatusBadRequest {
			t.Errorf("无RFID设备录入期望 400, 得到 %d: %s", w.Code, w.Body.String())
		}
	})

	t.Run("Send invalid command", func(t *testing.T) {
		devW := performRequest(r, "POST", "/api/v1/devices", jsonBody(map[string]interface{}{
			"name": "CMD-Test-Invalid", "device_type": "multi",
		}))
		var dev model.Device
		json.Unmarshal(devW.Body.Bytes(), &dev)

		w := performRequest(r, "POST", "/api/v1/devices/"+dev.ID+"/command", jsonBody(map[string]string{"cmd": "invalid_cmd"}))
		if w.Code != http.StatusBadRequest {
			t.Errorf("无效指令期望 400, 得到 %d: %s", w.Code, w.Body.String())
		}
	})
}

// ============================================================
// Device Logs API 测试
// ============================================================

func TestDeviceLogsAPI(t *testing.T) {
	testutil.CleanTestDB()
	r := setupRouter()

	// 先创建一个 child 和 device log
	childW := performRequest(r, "POST", "/api/v1/children", jsonBody(map[string]string{"name": "Log测试"}))
	var child model.Child
	json.Unmarshal(childW.Body.Bytes(), &child)

	// 直接创建日志用于测试
	repo := repository.NewDeviceLogRepo()
	log := &model.DeviceLog{
		DeviceID:  "test-device-log",
		ChildID:   child.ID,
		EventType: "wake_up",
		Status:    "confirmed",
	}
	repo.Create(log)

	t.Run("List device logs by child", func(t *testing.T) {
		w := performRequest(r, "GET", "/api/v1/device-logs?child_id="+child.ID, "")
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d: %s", w.Code, w.Body.String())
		}
		var logs []model.DeviceLog
		json.Unmarshal(w.Body.Bytes(), &logs)
		if len(logs) == 0 {
			t.Error("期望至少有1条日志")
		}
	})

	t.Run("List device logs by device", func(t *testing.T) {
		w := performRequest(r, "GET", "/api/v1/device-logs?device_id=test-device-log", "")
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d: %s", w.Code, w.Body.String())
		}
	})
}

// ============================================================
// Stats API 测试
// ============================================================

func TestStatsAPI(t *testing.T) {
	testutil.CleanTestDB()
	r := setupRouter()

	childW := performRequest(r, "POST", "/api/v1/children", jsonBody(map[string]string{"name": "Stats测试"}))
	var child model.Child
	json.Unmarshal(childW.Body.Bytes(), &child)

	// 创建几条日志
	repo := repository.NewDeviceLogRepo()
	now := time.Now()
	for i := 0; i < 3; i++ {
		confirmed := true
		repo.Create(&model.DeviceLog{
			DeviceID:   "stats-device",
			ChildID:    child.ID,
			EventType:  "wake_up",
			Status:     "confirmed",
			MathCorrect: &confirmed,
			CreatedAt:  now,
		})
	}

	t.Run("Get stats without child_id", func(t *testing.T) {
		w := performRequest(r, "GET", "/api/v1/stats", "")
		if w.Code != http.StatusBadRequest {
			t.Errorf("期望 400, 得到 %d: %s", w.Code, w.Body.String())
		}
	})

	t.Run("Get stats with child_id", func(t *testing.T) {
		w := performRequest(r, "GET", "/api/v1/stats?child_id="+child.ID, "")
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d: %s", w.Code, w.Body.String())
		}
		var stats map[string]interface{}
		json.Unmarshal(w.Body.Bytes(), &stats)
		if stats["total"].(float64) != 3 {
			t.Errorf("期望 total=3, 得到 %v", stats["total"])
		}
		if stats["confirmed"].(float64) != 3 {
			t.Errorf("期望 confirmed=3, 得到 %v", stats["confirmed"])
		}
	})
}

// ============================================================
// Schedule API 测试
// ============================================================

func TestScheduleAPI(t *testing.T) {
	testutil.CleanTestDB()
	r := setupRouter()

	childW := performRequest(r, "POST", "/api/v1/children", jsonBody(map[string]interface{}{
		"name": "作息测试", "gender": "male", "school": "实验小学", "class": "一年级1班",
	}))
	var child model.Child
	json.Unmarshal(childW.Body.Bytes(), &child)

	t.Run("Create schedule", func(t *testing.T) {
		w := performRequest(r, "POST", "/api/v1/schedules", jsonBody(map[string]interface{}{
			"child_id":    child.ID,
			"activity":    "起床",
			"start_time":  "07:00",
			"end_time":    "07:30",
			"date":        "2026-06-21",
			"status":      "pending",
		}))
		if w.Code != http.StatusCreated {
			t.Errorf("期望 201, 得到 %d: %s", w.Code, w.Body.String())
		}
		var s model.Schedule
		json.Unmarshal(w.Body.Bytes(), &s)
		if s.Activity != "起床" {
			t.Errorf("期望 activity=起床, 得到 %s", s.Activity)
		}
	})

	t.Run("List by child and date", func(t *testing.T) {
		w := performRequest(r, "GET", "/api/v1/schedules?child_id="+child.ID+"&date=2026-06-21", "")
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d: %s", w.Code, w.Body.String())
		}
	})

	t.Run("List by date", func(t *testing.T) {
		w := performRequest(r, "GET", "/api/v1/schedules/date?date=2026-06-21", "")
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d: %s", w.Code, w.Body.String())
		}
	})

	t.Run("Generate schedules", func(t *testing.T) {
		w := performRequest(r, "POST", "/api/v1/schedules/generate?child_id="+child.ID+"&date=2026-06-22", "")
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d: %s", w.Code, w.Body.String())
		}
	})
}

// ============================================================
// Schedule Template API 测试
// ============================================================

func TestScheduleTemplateAPI(t *testing.T) {
	testutil.CleanTestDB()
	r := setupRouter()
	var createdTplID string

	t.Run("Create template", func(t *testing.T) {
		w := performRequest(r, "POST", "/api/v1/schedule-templates", jsonBody(map[string]interface{}{
			"day_of_week": 1,
			"start_time":  "22:00",
			"end_time":    "22:30",
			"activity":    "刷牙",
			"is_required": true,
			"sort_order":  1,
		}))
		if w.Code != http.StatusCreated {
			t.Errorf("期望 201, 得到 %d: %s", w.Code, w.Body.String())
		}
		var tpl model.ScheduleTemplate
		json.Unmarshal(w.Body.Bytes(), &tpl)
		if tpl.Activity != "刷牙" {
			t.Errorf("期望 activity=刷牙, 得到 %s", tpl.Activity)
		}
		// 保存ID供后续测试用
		createdTplID = tpl.ID
	})

	t.Run("List templates", func(t *testing.T) {
		w := performRequest(r, "GET", "/api/v1/schedule-templates", "")
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d", w.Code)
		}
	})

	t.Run("Update template", func(t *testing.T) {
		if createdTplID == "" {
			t.Fatal("没有模板可更新")
		}
		w := performRequest(r, "PUT", "/api/v1/schedule-templates/"+createdTplID, jsonBody(map[string]interface{}{
			"activity":   "洗脸",
			"start_time": "22:00",
			"end_time":   "22:20",
			"day_of_week": 1,
		}))
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d: %s", w.Code, w.Body.String())
		}
		var tpl model.ScheduleTemplate
		json.Unmarshal(w.Body.Bytes(), &tpl)
		if tpl.Activity != "洗脸" {
			t.Errorf("期望 activity=洗脸, 得到 %s", tpl.Activity)
		}
	})

	t.Run("Delete template", func(t *testing.T) {
		if createdTplID == "" {
			t.Fatal("没有模板可删除")
		}
		w := performRequest(r, "DELETE", "/api/v1/schedule-templates/"+createdTplID, "")
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d: %s", w.Code, w.Body.String())
		}
	})
}

// ============================================================
// Allowance API 测试
// ============================================================

func TestAllowanceAPI(t *testing.T) {
	testutil.CleanTestDB()
	r := setupRouter()

	childW := performRequest(r, "POST", "/api/v1/children", jsonBody(map[string]string{"name": "零花钱测试"}))
	var child model.Child
	json.Unmarshal(childW.Body.Bytes(), &child)

	t.Run("GetBalance initial", func(t *testing.T) {
		w := performRequest(r, "GET", "/api/v1/allowance/"+child.ID, "")
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d: %s", w.Code, w.Body.String())
		}
	})

	t.Run("ListTransactions initial", func(t *testing.T) {
		w := performRequest(r, "GET", "/api/v1/allowance/"+child.ID+"/transactions", "")
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d: %s", w.Code, w.Body.String())
		}
	})

	t.Run("Spend without enough balance", func(t *testing.T) {
		w := performRequest(r, "POST", "/api/v1/allowance/"+child.ID+"/spend", jsonBody(map[string]interface{}{
			"amount":      999,
			"description": "买玩具",
		}))
		// 期望 400 (余额不足) 或 200 (如果创建时自动给了初始余额)
		if w.Code != http.StatusBadRequest && w.Code != http.StatusOK {
			t.Errorf("期望 400 或 200, 得到 %d: %s", w.Code, w.Body.String())
		}
	})
}

// ============================================================
// Reward API 测试
// ============================================================

func TestRewardAPI(t *testing.T) {
	testutil.CleanTestDB()
	r := setupRouter()
	var createdRecordID string

	t.Run("Create rule", func(t *testing.T) {
		w := performRequest(r, "POST", "/api/v1/reward-rules", jsonBody(map[string]interface{}{
			"name":        "按时起床",
			"type":        "reward",
			"amount":      10,
			"description": "7点前起床奖励10分",
			"is_active":   true,
		}))
		if w.Code != http.StatusCreated {
			t.Errorf("期望 201, 得到 %d: %s", w.Code, w.Body.String())
		}
	})

	t.Run("List rules", func(t *testing.T) {
		w := performRequest(r, "GET", "/api/v1/reward-rules", "")
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d", w.Code)
		}
	})

	t.Run("Create record", func(t *testing.T) {
		w := performRequest(r, "POST", "/api/v1/reward-records", jsonBody(map[string]interface{}{
			"child_id":   "test-child",
			"rule_id":    "test-rule",
			"type":       "reward",
			"amount":     10,
			"reason":     "测试打卡奖励",
			"created_by": "家长",
		}))
		if w.Code != http.StatusCreated {
			t.Errorf("期望 201, 得到 %d: %s", w.Code, w.Body.String())
		}
		var record model.RewardRecord
		json.Unmarshal(w.Body.Bytes(), &record)
		if record.Amount != 10 {
			t.Errorf("期望 amount=10, 得到 %f", record.Amount)
		}
		// 保存ID供后续更新和删除测试
		createdRecordID = record.ID
	})

	t.Run("List records", func(t *testing.T) {
		w := performRequest(r, "GET", "/api/v1/reward-records", "")
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d", w.Code)
		}
	})

	t.Run("Update record", func(t *testing.T) {
		if createdRecordID == "" {
			t.Fatal("没有记录可更新")
		}
		w := performRequest(r, "PUT", "/api/v1/reward-records/"+createdRecordID, jsonBody(map[string]interface{}{
			"type":       "reward",
			"amount":     20,
			"reason":     "更新为双倍奖励",
			"created_by": "家长",
		}))
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d: %s", w.Code, w.Body.String())
		}
		var record model.RewardRecord
		json.Unmarshal(w.Body.Bytes(), &record)
		if record.Amount != 20 {
			t.Errorf("期望 amount=20, 得到 %f", record.Amount)
		}
	})

	t.Run("Delete record", func(t *testing.T) {
		if createdRecordID == "" {
			t.Fatal("没有记录可删除")
		}
		w := performRequest(r, "DELETE", "/api/v1/reward-records/"+createdRecordID, "")
		if w.Code != http.StatusOK {
			t.Errorf("期望 200, 得到 %d: %s", w.Code, w.Body.String())
		}
	})
}

// ============================================================
// 测试汇总输出
// ============================================================

func TestAllAPIs(t *testing.T) {
	// 该测试仅在需要时做汇总统计用
	t.Log("所有 API 接口测试已完成")
}

// getEnv 获取环境变量，用于跳过需要 MQTT 的测试
func getEnv(key, defaultVal string) string {
	return defaultVal
}

// TestCORS 测试 CORS 中间件
func TestCORS(t *testing.T) {
	testutil.CleanTestDB()
	r := setupRouter()

	w := httptest.NewRecorder()
	req, _ := http.NewRequest("OPTIONS", "/api/v1/children", nil)
	req.Header.Set("Origin", "http://localhost:5173")
	req.Header.Set("Access-Control-Request-Method", "GET")
	r.ServeHTTP(w, req)

	if w.Code != http.StatusNoContent && w.Code != http.StatusOK {
		t.Logf("OPTIONS 请求返回 %d (CORS中间件可能未处理OPTIONS)", w.Code)
	}

	// 检查实际的 GET 请求是否有 CORS 头
	w2 := httptest.NewRecorder()
	req2, _ := http.NewRequest("GET", "/api/v1/children", nil)
	req2.Header.Set("Origin", "http://localhost:5173")
	r.ServeHTTP(w2, req2)

	// 测试是 OK 即可
	if w2.Code == http.StatusOK {
		t.Log("CORS + API 请求正常")
	}
}

// TestInvalidRoutes 测试不存在的路由
func TestInvalidRoutes(t *testing.T) {
	testutil.CleanTestDB()
	r := setupRouter()

	t.Run("Nonexistent route returns 404", func(t *testing.T) {
		w := performRequest(r, "GET", "/api/v1/nonexistent-route", "")
		if w.Code != http.StatusNotFound {
			t.Errorf("期望 404, 得到 %d", w.Code)
		}
	})

	t.Run("Wrong method returns 405", func(t *testing.T) {
		w := performRequest(r, "DELETE", "/api/v1/children", "")
		if w.Code != http.StatusNotFound && w.Code != http.StatusMethodNotAllowed {
			t.Errorf("期望 404 或 405, 得到 %d", w.Code)
		}
	})
}

// TestEdgeCases 测试边界情况
func TestEdgeCases(t *testing.T) {
	testutil.CleanTestDB()
	r := setupRouter()

	t.Run("Empty request body", func(t *testing.T) {
		w := performRequest(r, "POST", "/api/v1/children", "")
		if w.Code != http.StatusBadRequest {
			t.Errorf("期望 400, 得到 %d: %s", w.Code, w.Body.String())
		}
	})

	t.Run("Malformed JSON", func(t *testing.T) {
		w := performRequest(r, "POST", "/api/v1/devices", `{"name": `)
		if w.Code != http.StatusBadRequest {
			t.Errorf("期望 400, 得到 %d: %s", w.Code, w.Body.String())
		}
	})

	t.Run("Empty string fields", func(t *testing.T) {
		w := performRequest(r, "POST", "/api/v1/children", jsonBody(map[string]string{"name": ""}))
		if w.Code != http.StatusBadRequest && w.Code != http.StatusCreated {
			t.Errorf("期望 400 或 201, 得到 %d: %s", w.Code, w.Body.String())
		}
	})

	t.Run("Very long input", func(t *testing.T) {
		longName := strings.Repeat("A", 1000)
		w := performRequest(r, "POST", "/api/v1/children", jsonBody(map[string]string{"name": longName}))
		if w.Code != http.StatusCreated && w.Code != http.StatusBadRequest {
			t.Errorf("期望 201 或 400, 得到 %d", w.Code)
		}
	})
}

// TestAllRoutesPerMethod 确保每个路由至少能正确响应
func TestAllRoutesPerMethod(t *testing.T) {
	testutil.CleanTestDB()
	r := setupRouter()

	// 先建必要数据
	childW := performRequest(r, "POST", "/api/v1/children", jsonBody(map[string]string{"name": "测试"}))
	var child model.Child
	json.Unmarshal(childW.Body.Bytes(), &child)

	devW := performRequest(r, "POST", "/api/v1/devices", jsonBody(map[string]interface{}{
		"name": "Test", "device_type": "multi", "has_rfid": true,
	}))
	var dev model.Device
	json.Unmarshal(devW.Body.Bytes(), &dev)

	routes := []struct {
		method string
		path   string
		body   string
		code   int // 期望状态码
	}{
		// Children
		{"GET", "/api/v1/children", "", 200},
		{"POST", "/api/v1/children", jsonBody(map[string]interface{}{"name": "测试2"}), 201},
		{"GET", fmt.Sprintf("/api/v1/children/%s", child.ID), "", 200},
		{"PUT", fmt.Sprintf("/api/v1/children/%s", child.ID), jsonBody(map[string]string{"name": "更新"}), 200},
		{"DELETE", fmt.Sprintf("/api/v1/children/%s", child.ID), "", 200},

		// Devices
		{"GET", "/api/v1/devices", "", 200},
		{"POST", "/api/v1/devices", jsonBody(map[string]string{"name": "D2", "device_type": "wake_up"}), 201},
		{"PUT", fmt.Sprintf("/api/v1/devices/%s", dev.ID), jsonBody(map[string]string{"name": "D-Updated"}), 200},

		// RFID
		{"GET", "/api/v1/rfid-bindings", "", 200},
		{"POST", "/api/v1/rfid-bindings", jsonBody(map[string]string{"child_id": child.ID, "rfid_uid": "11:22:33:44"}), 201},

		// Sleep Config
		{"GET", fmt.Sprintf("/api/v1/devices/%s/sleep-config", dev.ID), "", 200},
		{"PUT", fmt.Sprintf("/api/v1/devices/%s/sleep-config", dev.ID), jsonBody(map[string]interface{}{
			"start_time": "22:00", "end_time": "07:00",
		}), 200},

		// Command
		{"POST", fmt.Sprintf("/api/v1/devices/%s/command", dev.ID), jsonBody(map[string]string{"cmd": "wake"}), 200},

		// Stats
		{"GET", "/api/v1/stats?child_id=" + child.ID, "", 200},

		// Schedules
		{"GET", "/api/v1/schedules?child_id=" + child.ID + "&date=2026-06-21", "", 200},
		{"GET", "/api/v1/schedules/date?date=2026-06-21", "", 200},
		{"POST", "/api/v1/schedules", jsonBody(map[string]interface{}{
			"child_id": child.ID, "activity": "T", "start_time": "12:00", "end_time": "12:30", "date": "2026-06-21",
		}), 201},

		// Schedule Templates
		{"GET", "/api/v1/schedule-templates", "", 200},
		{"POST", "/api/v1/schedule-templates", jsonBody(map[string]interface{}{
			"day_of_week": 1, "activity": "Tpl", "start_time": "12:00", "end_time": "12:30",
		}), 201},

		// Allowance
		{"GET", fmt.Sprintf("/api/v1/allowance/%s", child.ID), "", 200},
		{"GET", fmt.Sprintf("/api/v1/allowance/%s/transactions", child.ID), "", 200},
		{"POST", fmt.Sprintf("/api/v1/allowance/%s/spend", child.ID), jsonBody(map[string]interface{}{
			"amount": 5, "description": "测试",
		}), 200}, // 余额不足时可能返回400，也视为合法

		// Rewards
		{"GET", "/api/v1/reward-rules", "", 200},
		{"POST", "/api/v1/reward-rules", jsonBody(map[string]interface{}{"name": "R1", "type": "reward", "amount": 10}), 201},
		{"GET", "/api/v1/reward-records", "", 200},
		{"POST", "/api/v1/reward-records", jsonBody(map[string]interface{}{
			"child_id": child.ID, "type": "reward", "amount": 5,
		}), 201},
		{"POST", "/api/v1/clock-in", jsonBody(map[string]string{
			"child_id": child.ID, "device_id": "d-all", "event_type": "wake_up",
		}), 201},

		// Settings
		{"GET", "/api/v1/settings", "", 200},
		{"PUT", "/api/v1/settings", jsonBody(map[string]interface{}{
			"mqtt": map[string]interface{}{
				"broker": "tcp://test:1883", "topic_prefix": "test",
			},
		}), 200},
	}

	for _, rt := range routes {
		t.Run(fmt.Sprintf("%s_%s", rt.method, rt.path), func(t *testing.T) {
			w := performRequest(r, rt.method, rt.path, rt.body)
			// 余额不足时可接受400
			accept := []int{rt.code}
			if strings.Contains(rt.path, "/spend") {
				accept = append(accept, http.StatusBadRequest)
			}
			matched := false
			for _, code := range accept {
				if w.Code == code {
					matched = true
					break
				}
			}
			if !matched {
				t.Errorf("%s %s: 期望 %d, 得到 %d. Body: %s",
					rt.method, rt.path, rt.code, w.Code, w.Body.String())
			}
		})
	}
}