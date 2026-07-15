package service

import (
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"time"

	"coin-kids/internal/model"
	"coin-kids/internal/repository"

	"github.com/google/uuid"
)

// ChildInfo 服务器返回给孩子设备的信息（用于屏幕显示）
type ChildInfo struct {
	LogID       string `json:"log_id"`
	ChildID     string `json:"child_id"`
	ChildName   string `json:"child_name"`
	DeviceID    string `json:"device_id"`
	MaxAttempts int    `json:"max_attempts"` // 最多重试次数
}

// MathResult 设备上报的答题结果
type MathResult struct {
	LogID     string `json:"log_id"`
	ChildID   string `json:"child_id"`
	Correct   bool   `json:"correct"`
	Answer    string `json:"answer"`
	Problem   string `json:"problem"`
	Attempt   int    `json:"attempt"`   // 当前第几次尝试
	Attempts  int    `json:"attempts"`  // 总尝试次数
	StartTime string `json:"start_time"` // 刷卡时间
	EndTime   string `json:"end_time"`   // 答题完成时间
}

// GenerateMathProblem 生成三个两位数的整数四则运算题
// 返回结构化题目和正确答案
func GenerateMathProblem() (expression string, answer int) {
	// 生成三个 10-99 的随机两位整数
	a := rand.Intn(90) + 10
	b := rand.Intn(90) + 10
	c := rand.Intn(90) + 10

	// 随机选择运算模式：+ +, + -, - +, - -, + ×, × +, × -, - ×
	// 确保结果为非负整数
	var ops []string

	for i := 0; i < 20; i++ { // 最多尝试20次找到合适的组合
		op1 := rand.Intn(4) // 0:+ 1:- 2:× 3:÷
		op2 := rand.Intn(4)

		// 计算中间结果
		mid, ok1 := calcPair(a, op1, b)
		if !ok1 {
			continue
		}
		result, ok2 := calcPair(mid, op2, c)
		if !ok2 || result < 0 || result > 9999 {
			continue
		}

		// 构建表达式
		op1Str := opToString(op1)
		op2Str := opToString(op2)

		expression = fmt.Sprintf("%d %s %d %s %d = ?", a, op1Str, b, op2Str, c)
		answer = result
		_ = ops
		return
	}

	// 兜底：简单的加法
	expression = fmt.Sprintf("%d + %d + %d = ?", a, b, c)
	answer = a + b + c
	return
}

func calcPair(x, op, y int) (int, bool) {
	switch op {
	case 0: // +
		return x + y, true
	case 1: // -
		if x < y {
			return 0, false
		}
		return x - y, true
	case 2: // ×
		return x * y, true
	case 3: // ÷
		if y == 0 || x%y != 0 {
			return 0, false
		}
		return x / y, true
	}
	return 0, false
}

func opToString(op int) string {
	switch op {
	case 0:
		return "+"
	case 1:
		return "-"
	case 2:
		return "×"
	case 3:
		return "÷"
	}
	return "?"
}

// ============================
// RFID 打卡流程服务
// ============================

type ClockInService struct {
	deviceRepo    *repository.DeviceRepo
	rfidRepo      *repository.RFIDBindingRepo
	deviceLogRepo *repository.DeviceLogRepo
	childRepo     *repository.ChildRepo
	mqttSvc       *MQTTService
}

func NewClockInService(mqttSvc *MQTTService) *ClockInService {
	return &ClockInService{
		deviceRepo:    repository.NewDeviceRepo(),
		rfidRepo:      repository.NewRFIDBindingRepo(),
		deviceLogRepo: repository.NewDeviceLogRepo(),
		childRepo:     repository.NewChildRepo(),
		mqttSvc:       mqttSvc,
	}
}

// ProcessRFIDTap 处理RFID刷卡事件（新流程：服务器只返回孩子信息，数学题由设备端生成）
//
// 新流程:
//   1. 孩子刷卡 → 后端查RFID绑定 → 拿到 child_id → 查出姓名
//   2. 创建设备日志（pending状态）
//   3. 通过MQTT返回孩子信息（log_id, child_name, child_id）到设备
//   4. 设备端生成数学题、显示界面、判定对错、最多5次重试
//   5. 设备上报最终结果 → 后端更新日志
func (s *ClockInService) ProcessRFIDTap(sourceDeviceID, rfidUID string) (*ChildInfo, string, error) {
	// 1. 通过 RFID UID 查找绑定的孩子
	binding, err := s.rfidRepo.GetByUID(rfidUID)
	if err != nil {
		return nil, "", fmt.Errorf("未绑定的RFID卡: %s", rfidUID)
	}

	// 2. 查找孩子姓名
	child, err := s.childRepo.GetByID(binding.ChildID)
	if err != nil {
		return nil, "", fmt.Errorf("孩子不存在")
	}

	// 3. 多设备调度：找一台空闲设备
	targetDeviceID := s.findIdleDevice(sourceDeviceID)
	if targetDeviceID == "" {
		return nil, "", fmt.Errorf("所有设备正在使用中，请稍后再试")
	}

	// 4. 创建设备日志（pending状态，数学题由设备端生成）
	now := time.Now()
	logID := uuid.New().String()
	deviceLog := &model.DeviceLog{
		ID:            logID,
		DeviceID:      targetDeviceID,
		ChildID:       child.ID,
		RFIDUID:       rfidUID,
		EventType:     "wake_up",
		MathStartTime: &now,
		Status:        "pending",
	}
	if err := s.deviceLogRepo.Create(deviceLog); err != nil {
		return nil, "", fmt.Errorf("保存日志失败: %v", err)
	}

	// 5. 构建孩子信息（不含数学题，由设备端生成）
	info := &ChildInfo{
		LogID:       logID,
		ChildID:     child.ID,
		ChildName:   child.Name,
		DeviceID:    targetDeviceID,
		MaxAttempts: 5,
	}

	// 6. 通过MQTT发送孩子信息到目标设备
	topic := fmt.Sprintf("coin-kids/device/%s/child_info", targetDeviceID)
	payload, _ := json.Marshal(info)
	s.mqttSvc.Publish(topic, string(payload))

	log.Printf("[打卡] 孩子 %s 刷卡 (RFID:%s) → 设备 %s, logID=%s",
		child.Name, rfidUID, targetDeviceID, logID)

	return info, targetDeviceID, nil
}

// findIdleDevice 找一台空闲的 wake_up 设备
// 优先使用刷卡设备本身，其次找其他空闲设备，全部忙碌返回空字符串
func (s *ClockInService) findIdleDevice(sourceDeviceID string) string {
	// 先检查刷卡设备自己是否空闲
	_, err := s.deviceLogRepo.FindPendingMath(sourceDeviceID)
	if err != nil {
		// 刷卡设备空闲，直接使用
		log.Printf("[调度] 设备 %s 空闲，直接使用", sourceDeviceID)
		return sourceDeviceID
	}

	// 刷卡设备忙碌，找其他空闲设备（wake_up 和 multi 类型都可作为答题设备）
	devices, _ := s.deviceRepo.ListByTypes([]string{"wake_up", "multi"})
	for _, d := range devices {
		if d.ID == sourceDeviceID || !d.IsActive {
			continue
		}
		_, err := s.deviceLogRepo.FindPendingMath(d.ID)
		if err != nil {
			log.Printf("[调度] 设备 %s 忙碌 → 调度到设备 %s", sourceDeviceID, d.ID)
			return d.ID
		}
	}

	// 所有设备都忙碌
	log.Printf("[调度] 所有设备忙碌，无法调度")
	return ""
}

// ProcessMathResult 处理设备端上报的答题结果
// 设备端已自行判定对错，后端只负责记录日志
func (s *ClockInService) ProcessMathResult(result *MathResult) error {
	deviceLog, err := s.deviceLogRepo.GetByID(result.LogID)
	if err != nil {
		return fmt.Errorf("日志不存在: %s", result.LogID)
	}

	// 解析时间
	startTime, _ := time.Parse(time.RFC3339, result.StartTime)
	endTime, _ := time.Parse(time.RFC3339, result.EndTime)
	if !startTime.IsZero() {
		deviceLog.MathStartTime = &startTime
	}
	if !endTime.IsZero() {
		deviceLog.MathEndTime = &endTime
	}

	// 更新答题信息
	deviceLog.MathProblem = result.Problem
	deviceLog.MathUserAnswer = result.Answer
	deviceLog.MathCorrect = &result.Correct

	if result.Correct {
		deviceLog.Status = "confirmed"
	} else {
		deviceLog.Status = "rejected"
	}

	if err := s.deviceLogRepo.Update(deviceLog); err != nil {
		return err
	}

	child, _ := s.childRepo.GetByID(deviceLog.ChildID)
	childName := ""
	if child != nil {
		childName = child.Name
	}

	log.Printf("[打卡] 孩子 %s 答题结果: correct=%v problem=%s answer=%s attempt=%d/%d",
		childName, result.Correct, result.Problem, result.Answer, result.Attempt, result.Attempts)

	return nil
}

// GetSleepCheckConfig 获取睡觉检测配置
func (s *ClockInService) GetSleepCheckConfig(deviceID string) (*model.SleepCheckConfig, error) {
	cfg, err := repository.NewSleepCheckRepo().GetOrCreate(deviceID)
	return cfg, err
}

// UpdateSleepCheckConfig 更新睡觉检测配置
func (s *ClockInService) UpdateSleepCheckConfig(cfg *model.SleepCheckConfig) error {
	return repository.NewSleepCheckRepo().Update(cfg)
}

// SendDeviceCommand 向设备发送指令（如进入/退出录入模式）
func (s *ClockInService) SendDeviceCommand(deviceID, cmd string) {
	s.mqttSvc.SendCommand(deviceID, cmd)
}

// ListDeviceLogs 查询设备日志
func (s *ClockInService) ListDeviceLogs(childID, deviceID, sort string) ([]model.DeviceLog, error) {
	return s.deviceLogRepo.ListDeviceLogs(childID, deviceID, sort)
}

// SendRFIDBindingToDevices 将RFID绑定信息通过MQTT推送到所有活跃设备
func (s *ClockInService) SendRFIDBindingToDevices(binding *model.RFIDBinding) {
	child, _ := s.childRepo.GetByID(binding.ChildID)
	childName := ""
	if child != nil {
		childName = child.Name
	}

	devices, _ := s.deviceRepo.List()
	bindingInfo := map[string]interface{}{
		"rfid_uid":   binding.RFIDUID,
		"child_id":   binding.ChildID,
		"child_name": childName,
		"label":      binding.Label,
	}
	payload, _ := json.Marshal(bindingInfo)

	for _, device := range devices {
		if device.IsActive {
			topic := fmt.Sprintf("coin-kids/device/%s/rfid_binding", device.ID)
			s.mqttSvc.Publish(topic, string(payload))
		}
	}
	log.Printf("[RFID] 已将绑定信息推送到 %d 个活跃设备", len(devices))
}

// SendSleepCheckConfig 将睡觉检测配置通过MQTT发给设备
func (s *ClockInService) SendSleepCheckConfig(deviceID string) error {
	cfg, err := repository.NewSleepCheckRepo().GetOrCreate(deviceID)
	if err != nil {
		return err
	}
	topic := fmt.Sprintf("coin-kids/device/%s/sleep-config", deviceID)
	payload, _ := json.Marshal(cfg)
	s.mqttSvc.Publish(topic, string(payload))
	return nil
}