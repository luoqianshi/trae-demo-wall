package handler

import (
	"net/http"
	"os"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"coin-kids/internal/model"
	"coin-kids/internal/repository"
	"coin-kids/internal/service"

	"github.com/gin-gonic/gin"
)

type DeviceHandler struct {
	deviceRepo *repository.DeviceRepo
	rfidRepo   *repository.RFIDBindingRepo
	clockSvc   *service.ClockInService
}

func NewDeviceHandler(clockSvc *service.ClockInService) *DeviceHandler {
	return &DeviceHandler{
		deviceRepo: repository.NewDeviceRepo(),
		rfidRepo:   repository.NewRFIDBindingRepo(),
		clockSvc:   clockSvc,
	}
}

// --- 设备管理 ---

func (h *DeviceHandler) List(c *gin.Context) {
	devices, err := h.deviceRepo.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, devices)
}

func (h *DeviceHandler) Create(c *gin.Context) {
	var device model.Device
	if err := c.ShouldBindJSON(&device); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.deviceRepo.Create(&device); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusCreated, device)
}

func (h *DeviceHandler) Update(c *gin.Context) {
	id := c.Param("id")
	device, err := h.deviceRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "设备不存在"})
		return
	}
	if err := c.ShouldBindJSON(device); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.deviceRepo.Update(device); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, device)
}

func (h *DeviceHandler) Delete(c *gin.Context) {
	id := c.Param("id")
	if err := h.deviceRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

// --- RFID绑定 ---

func (h *DeviceHandler) ListRFIDBindings(c *gin.Context) {
	bindings, err := h.rfidRepo.List()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, bindings)
}

func (h *DeviceHandler) CreateRFIDBinding(c *gin.Context) {
	var binding model.RFIDBinding
	if err := c.ShouldBindJSON(&binding); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.rfidRepo.Create(&binding); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// 推送到设备
	if binding.ChildID != "" {
		h.clockSvc.SendRFIDBindingToDevices(&binding)
	}
	c.JSON(http.StatusCreated, binding)
}

func (h *DeviceHandler) UpdateRFIDBinding(c *gin.Context) {
	id := c.Param("id")
	binding, err := h.rfidRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "RFID绑定不存在"})
		return
	}
	if err := c.ShouldBindJSON(binding); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	if err := h.rfidRepo.Update(binding); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, binding)
}

func (h *DeviceHandler) DeleteRFIDBinding(c *gin.Context) {
	id := c.Param("id")
	if err := h.rfidRepo.Delete(id); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, gin.H{"message": "删除成功"})
}

// --- 睡觉检测配置 ---

func (h *DeviceHandler) GetSleepConfig(c *gin.Context) {
	deviceID := c.Param("id")
	cfg, err := h.clockSvc.GetSleepCheckConfig(deviceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, cfg)
}

func (h *DeviceHandler) UpdateSleepConfig(c *gin.Context) {
	deviceID := c.Param("id")
	var req model.SleepCheckConfig
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}
	// 先获取现有配置，避免 UNIQUE 约束冲突
	existing, err := h.clockSvc.GetSleepCheckConfig(deviceID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	if req.StartTime != "" {
		existing.StartTime = req.StartTime
	}
	if req.EndTime != "" {
		existing.EndTime = req.EndTime
	}
	if req.Reminder1Min != 0 {
		existing.Reminder1Min = req.Reminder1Min
	}
	if req.Reminder2Min != 0 {
		existing.Reminder2Min = req.Reminder2Min
	}
	if req.SoundThreshold != 0 {
		existing.SoundThreshold = req.SoundThreshold
	}
	existing.IsEnabled = req.IsEnabled
	if err := h.clockSvc.UpdateSleepCheckConfig(existing); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	// 推送配置到设备
	h.clockSvc.SendSleepCheckConfig(deviceID)
	c.JSON(http.StatusOK, existing)
}

// --- 设备日志 ---

func (h *DeviceHandler) ListDeviceLogs(c *gin.Context) {
	childID := c.Query("child_id")
	deviceID := c.Query("device_id")
	sort := c.DefaultQuery("sort", "desc") // asc/desc

	logs, err := h.clockSvc.ListDeviceLogs(childID, deviceID, sort)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}
	c.JSON(http.StatusOK, logs)
}

// --- 设备指令 ---

func (h *DeviceHandler) SendCommand(c *gin.Context) {
	id := c.Param("id")
	var req struct {
		Cmd string `json:"cmd"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// 校验设备是否存在
	device, err := h.deviceRepo.GetByID(id)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "设备不存在"})
		return
	}

	validCmds := map[string]bool{
		"enroll":    true,
		"wake":      true,
		"sleep":     true,
		"reset":     true,
		"calibrate": true,
		"stop_calibrate": true,
	}
	if !validCmds[req.Cmd] {
		c.JSON(http.StatusBadRequest, gin.H{"error": "无效指令，支持: enroll, wake, sleep, reset, calibrate, stop_calibrate"})
		return
	}

	// RFID 录入指令仅允许有 RFID 的设备
	if (req.Cmd == "enroll") && !device.HasRFID {
		c.JSON(http.StatusBadRequest, gin.H{"error": "该设备未连接RFID读卡器，无法执行录入操作"})
		return
	}

	h.clockSvc.SendDeviceCommand(id, req.Cmd)
	c.JSON(http.StatusOK, gin.H{"message": "指令已发送", "cmd": req.Cmd, "device_id": id})
}

// --- 打卡统计 ---

func (h *DeviceHandler) GetStats(c *gin.Context) {
	childID := c.Query("child_id")
	if childID == "" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "child_id 必填"})
		return
	}

	logs, err := repository.NewDeviceLogRepo().ListByChild(childID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 统计
	confirmed := 0
	rejected := 0
	confirmedDateSet := make(map[string]bool)
	confirmedDates := make([]string, 0)
	totalDateSet := make(map[string]bool)
	totalDates := make([]string, 0)

	for _, l := range logs {
		dateStr := l.CreatedAt.Format("2006-01-02")
		if !totalDateSet[dateStr] {
			totalDateSet[dateStr] = true
			totalDates = append(totalDates, dateStr)
		}
		if l.Status == "confirmed" {
			confirmed++
			if !confirmedDateSet[dateStr] {
				confirmedDateSet[dateStr] = true
				confirmedDates = append(confirmedDates, dateStr)
			}
		} else if l.Status == "rejected" {
			rejected++
		}
	}

	// 计算连续打卡天数（从最近往前推）
	sort.Strings(confirmedDates)
	streak := 0
	if len(confirmedDates) > 0 {
		streak = 1
		for i := len(confirmedDates) - 1; i > 0; i-- {
			curr, _ := time.Parse("2006-01-02", confirmedDates[i])
			prev, _ := time.Parse("2006-01-02", confirmedDates[i-1])
			if curr.Sub(prev).Hours() <= 30 { // 容差
				streak++
			} else {
				break
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"total":           confirmed + rejected,
		"confirmed":       confirmed,
		"rejected":        rejected,
		"streak_days":     streak,
		"confirmed_dates": confirmedDates,
		"total_dates":     totalDates,
	})
}

// --- 照片管理 ---

func (h *DeviceHandler) ListPhotos(c *gin.Context) {
	deviceID := c.Param("id")
	photoDir := filepath.Join("data", "photos", deviceID)
	entries, err := os.ReadDir(photoDir)
	if err != nil {
		// 目录不存在时返回空列表
		c.JSON(http.StatusOK, []gin.H{})
		return
	}
	var photos []gin.H
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		info, _ := e.Info()
		photos = append(photos, gin.H{
			"filename": e.Name(),
			"size":     info.Size(),
			"mod_time": info.ModTime().Format(time.RFC3339),
		})
	}
	c.JSON(http.StatusOK, photos)
}

func (h *DeviceHandler) ServePhoto(c *gin.Context) {
	deviceID := c.Param("id")
	filename := c.Param("filename")
	// 防止路径穿越
	if strings.Contains(filename, "..") || strings.Contains(filename, "/") || strings.Contains(filename, "\\") {
		c.JSON(http.StatusBadRequest, gin.H{"error": "非法文件名"})
		return
	}
	filePath := filepath.Join("data", "photos", deviceID, filename)
	c.File(filePath)
}