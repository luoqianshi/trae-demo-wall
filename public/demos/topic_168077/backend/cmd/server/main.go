package main

import (
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"strings"

	"coin-kids/internal/config"
	"coin-kids/internal/handler"
	"coin-kids/internal/middleware"
	"coin-kids/internal/model"
	"coin-kids/internal/repository"
	"coin-kids/internal/service"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func main() {
	cfg := config.Load()

	// 初始化系统设置（存储在 JSON 文件中）
	settingsPath := filepath.Join(filepath.Dir(cfg.DBPath), "settings.json")
	if cfg.DBPath == "" {
		settingsPath = "settings.json"
	}
	repository.InitSettings(settingsPath)

	// Initialize database
	if err := repository.InitDB(cfg); err != nil {
		log.Fatalf("数据库初始化失败: %v", err)
	}

	// Initialize MQTT
	mqttSvc := service.NewMQTTService(cfg)
	clockInSvc := service.NewClockInService(mqttSvc)

	// 设置MQTT消息处理回调
	mqttSvc.SetHandlers(
		// RFID刷卡回调
		func(deviceID, rfidUID string) {
			_, targetDeviceID, err := clockInSvc.ProcessRFIDTap(deviceID, rfidUID)
			if err != nil {
				log.Printf("[打卡] RFID处理失败: %v", err)
				resp := map[string]interface{}{
					"error":    err.Error(),
					"rfid_uid": rfidUID,
					"busy":     true,
				}
				payload, _ := json.Marshal(resp)
				mqttSvc.Publish("coin-kids/device/"+deviceID+"/error", string(payload))
				return
			}
			log.Printf("[打卡] 孩子信息已发送到设备 %s", targetDeviceID)
		},
		// 数学题结果回调（设备端自行判定后上报）
		func(deviceID string, result *service.MathResult) {
			if err := clockInSvc.ProcessMathResult(result); err != nil {
				log.Printf("[打卡] 处理答题结果失败: %v", err)
				return
			}
			log.Printf("[打卡] 设备 %s 上报结果: correct=%v problem=%s answer=%s attempt=%d/%d",
				deviceID, result.Correct, result.Problem, result.Answer, result.Attempt, result.Attempts)
		},
		// 声音检测回调
		func(deviceID string, level int) {
			log.Printf("[声音] 设备 %s 检测到声音: 级别=%d", deviceID, level)
			// 记录到设备日志
			deviceLogRepo := repository.NewDeviceLogRepo()
			deviceLog := &model.DeviceLog{
				DeviceID:  deviceID,
				EventType: "sleep_check",
				Status:    "confirmed",
			}
			if err := deviceLogRepo.Create(deviceLog); err != nil {
				log.Printf("[声音] 记录日志失败: %v", err)
			}
		},
		// 录入模式回调
		func(deviceID, uid string, index int) {
			log.Printf("[录入] 设备 %s 录入第%d个RFID卡: %s", deviceID, index, uid)
			// 自动创建RFID绑定（未绑定孩子的，需要后续在管理页面绑定）
			rfidRepo := repository.NewRFIDBindingRepo()
			_, err := rfidRepo.GetByUID(uid)
			if err == nil {
				log.Printf("[录入] RFID卡 %s 已存在，跳过", uid)
				return
			}
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				log.Printf("[录入] 查询RFID卡 %s 失败: %v", uid, err)
				return
			}
			binding := &model.RFIDBinding{
				RFIDUID: uid,
				Label:   fmt.Sprintf("录入卡-%d", index),
			}
			if err := rfidRepo.Create(binding); err != nil {
				log.Printf("[录入] 保存RFID绑定失败: %v", err)
			} else {
				log.Printf("[录入] 已保存RFID绑定: %s (索引=%d)", uid, index)
			}
		},
		// 照片上传回调
		func(deviceID, filename string, data []byte) {
			photoDir := filepath.Join("data", "photos", deviceID)
			if err := os.MkdirAll(photoDir, 0755); err != nil {
				log.Printf("[照片] 创建目录失败: %v", err)
				return
			}
			filePath := filepath.Join(photoDir, filename)
			if err := os.WriteFile(filePath, data, 0644); err != nil {
				log.Printf("[照片] 保存文件失败: %v", err)
				return
			}
			log.Printf("[照片] 已保存: %s (%d bytes)", filePath, len(data))
		},
	)

	// 连接MQTT
	if err := mqttSvc.Connect(); err != nil {
		log.Printf("[MQTT] 连接失败（非致命）: %v", err)
	} else {
		log.Println("[MQTT] 已连接到Broker")
	}

	// 确保照片存储目录存在
	if err := os.MkdirAll("data/photos", 0755); err != nil {
		log.Printf("[照片] 创建根目录失败: %v", err)
	}

	// Initialize handlers
	childHandler := handler.NewChildHandler()
	scheduleHandler := handler.NewScheduleHandler()
	allowanceHandler := handler.NewAllowanceHandler()
	rewardHandler := handler.NewRewardHandler()
	clockHandler := handler.NewClockHandler()
	deviceHandler := handler.NewDeviceHandler(clockInSvc)
	settingsHandler := handler.NewSettingsHandler()
	festivalHandler := handler.NewFestivalHandler()

	// Setup router
	r := gin.Default()
	r.Use(middleware.CORS())

	// API routes
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

		// Clock-in (ESP32 legacy)
		api.POST("/clock-in", clockHandler.ESP32ClockIn)
		api.POST("/clock-in/:id/confirm", clockHandler.Confirm)
		api.POST("/clock-in/:id/reject", clockHandler.Reject)
		api.GET("/clock-in/child/:child_id", clockHandler.ListByChild)
		api.GET("/clock-in/device", clockHandler.ListByDevice)

		// 设备管理
		api.GET("/devices", deviceHandler.List)
		api.POST("/devices", deviceHandler.Create)
		api.PUT("/devices/:id", deviceHandler.Update)
		api.DELETE("/devices/:id", deviceHandler.Delete)

		// RFID绑定
		api.GET("/rfid-bindings", deviceHandler.ListRFIDBindings)
		api.POST("/rfid-bindings", deviceHandler.CreateRFIDBinding)
		api.PUT("/rfid-bindings/:id", deviceHandler.UpdateRFIDBinding)
		api.DELETE("/rfid-bindings/:id", deviceHandler.DeleteRFIDBinding)

		// 睡觉检测配置
		api.GET("/devices/:id/sleep-config", deviceHandler.GetSleepConfig)
		api.PUT("/devices/:id/sleep-config", deviceHandler.UpdateSleepConfig)

		// 设备日志
		api.GET("/device-logs", deviceHandler.ListDeviceLogs)

		// 设备指令
		api.POST("/devices/:id/command", deviceHandler.SendCommand)

		// 设备照片
		api.GET("/devices/:id/photos", deviceHandler.ListPhotos)
		api.GET("/devices/:id/photos/:filename", deviceHandler.ServePhoto)

		// 打卡统计
		api.GET("/stats", deviceHandler.GetStats)

		// 系统设置
		api.GET("/settings", settingsHandler.Get)
		api.PUT("/settings", settingsHandler.Update)

		// 节日/主题
		api.GET("/festivals/today", festivalHandler.GetToday)
		api.GET("/festivals", festivalHandler.GetByDate)
		api.GET("/festivals/year", festivalHandler.ListByYear)
		api.GET("/themes/current", festivalHandler.GetToday)
		api.GET("/themes", festivalHandler.GetThemes)
	}

	// 生产模式：托管前端静态文件
	if cfg.IsProduction() {
		staticDir := cfg.StaticDir
		if staticDir == "" {
			candidates := []string{
				"../frontend/dist",
				"./frontend/dist",
				"frontend/dist",
			}
			for _, candidate := range candidates {
				if info, err := os.Stat(candidate); err == nil && info.IsDir() {
					absPath, _ := filepath.Abs(candidate)
					staticDir = absPath
					break
				}
			}
		}

		if staticDir != "" {
			log.Printf("生产模式：托管静态文件目录 %s", staticDir)
			r.Static("/assets", filepath.Join(staticDir, "assets"))
			r.NoRoute(func(c *gin.Context) {
				if strings.HasPrefix(c.Request.URL.Path, "/api/") {
					c.JSON(http.StatusNotFound, gin.H{"error": "接口不存在"})
					return
				}
				c.File(filepath.Join(staticDir, "index.html"))
			})
		} else {
			log.Println("警告：未找到前端静态文件目录，请先执行 pnpm build")
		}
	} else {
		log.Println("开发模式：静态文件由 Vite Dev Server 代理")
	}

	// Start server
	addr := fmt.Sprintf(":%s", cfg.ServerPort)
	log.Printf("服务启动于 %s", addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("服务启动失败: %v", err)
	}
}