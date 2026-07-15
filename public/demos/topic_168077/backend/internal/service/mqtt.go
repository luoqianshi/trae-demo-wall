package service

import (
	"encoding/json"
	"fmt"
	"log"
	"time"

	"coin-kids/internal/config"

	mqtt "github.com/eclipse/paho.mqtt.golang"
)

type MQTTService struct {
	client mqtt.Client
	cfg    *config.Config
	onRFIDTap       func(deviceID, rfidUID string)
	onMathResult    func(deviceID string, result *MathResult)
	onSoundDetected func(deviceID string, level int)
	onEnrollUID     func(deviceID, uid string, index int)
	onPhoto         func(deviceID, filename string, data []byte)
	photoMetaBuf    map[string]string // deviceID -> filename 缓存
}

func NewMQTTService(cfg *config.Config) *MQTTService {
	return &MQTTService{cfg: cfg, photoMetaBuf: make(map[string]string)}
}

func (s *MQTTService) SetHandlers(
	onRFIDTap func(deviceID, rfidUID string),
	onMathResult func(deviceID string, result *MathResult),
	onSoundDetected func(deviceID string, level int),
	onEnrollUID func(deviceID, uid string, index int),
	onPhoto func(deviceID, filename string, data []byte),
) {
	s.onRFIDTap = onRFIDTap
	s.onMathResult = onMathResult
	s.onSoundDetected = onSoundDetected
	s.onEnrollUID = onEnrollUID
	s.onPhoto = onPhoto
}

func (s *MQTTService) Connect() error {
	broker := s.cfg.MQTTBroker
	clientID := s.cfg.MQTTClientID

	opts := mqtt.NewClientOptions()
	opts.AddBroker(broker)
	opts.SetClientID(clientID)
	opts.SetAutoReconnect(true)
	opts.SetMaxReconnectInterval(10 * time.Second)
	opts.SetOnConnectHandler(func(c mqtt.Client) {
		log.Println("[MQTT] 已连接")
		// 订阅设备上报
		c.Subscribe("coin-kids/device/+/rfid", 1, s.rfidHandler)
		c.Subscribe("coin-kids/device/+/result", 1, s.resultHandler)
		c.Subscribe("coin-kids/device/+/sound", 1, s.soundHandler)
		c.Subscribe("coin-kids/device/+/enroll", 1, s.enrollHandler)
		c.Subscribe("coin-kids/device/+/photo_meta", 1, s.photoMetaHandler)
		c.Subscribe("coin-kids/device/+/photo", 1, s.photoHandler)
	})

	opts.SetConnectionLostHandler(func(c mqtt.Client, err error) {
		log.Printf("[MQTT] 连接断开: %v", err)
	})

	s.client = mqtt.NewClient(opts)
	token := s.client.Connect()
	if token.Wait() && token.Error() != nil {
		return fmt.Errorf("MQTT连接失败: %v", token.Error())
	}

	return nil
}

func (s *MQTTService) Publish(topic, payload string) {
	if s.client == nil || !s.client.IsConnected() {
		log.Println("[MQTT] 未连接，无法发布")
		return
	}
	token := s.client.Publish(topic, 1, false, payload)
	token.Wait()
}

func (s *MQTTService) rfidHandler(client mqtt.Client, msg mqtt.Message) {
	// 从 topic 解析设备ID: coin-kids/device/{deviceID}/rfid
	deviceID := extractDeviceID(msg.Topic())
	log.Printf("[MQTT] 收到RFID刷卡: device=%s payload=%s", deviceID, string(msg.Payload()))
	if s.onRFIDTap != nil {
		s.onRFIDTap(deviceID, string(msg.Payload()))
	}
}

func (s *MQTTService) resultHandler(client mqtt.Client, msg mqtt.Message) {
	deviceID := extractDeviceID(msg.Topic())
	log.Printf("[MQTT] 收到设备答题结果: device=%s payload=%s", deviceID, string(msg.Payload()))
	if s.onMathResult != nil {
		var result MathResult
		if err := json.Unmarshal(msg.Payload(), &result); err != nil {
			log.Printf("[MQTT] 解析答题结果JSON失败: %v", err)
			return
		}
		if result.LogID == "" {
			log.Printf("[MQTT] 答题结果缺少log_id，忽略")
			return
		}
		s.onMathResult(deviceID, &result)
	}
}

func (s *MQTTService) soundHandler(client mqtt.Client, msg mqtt.Message) {
	deviceID := extractDeviceID(msg.Topic())
	log.Printf("[MQTT] 检测到声音: device=%s level=%s", deviceID, string(msg.Payload()))
	if s.onSoundDetected != nil {
		var data struct {
			Level int `json:"level"`
		}
		if err := json.Unmarshal(msg.Payload(), &data); err == nil {
			s.onSoundDetected(deviceID, data.Level)
		} else {
			// 兼容纯数字格式
			level := 0
			fmt.Sscanf(string(msg.Payload()), "%d", &level)
			s.onSoundDetected(deviceID, level)
		}
	}
}

func (s *MQTTService) Disconnect() {
	if s.client != nil && s.client.IsConnected() {
		s.client.Disconnect(250)
	}
}

func (s *MQTTService) enrollHandler(client mqtt.Client, msg mqtt.Message) {
	deviceID := extractDeviceID(msg.Topic())
	log.Printf("[MQTT] 录入模式: device=%s payload=%s", deviceID, string(msg.Payload()))
	if s.onEnrollUID != nil {
		var data struct {
			UID   string `json:"uid"`
			Index int    `json:"index"`
		}
		if err := json.Unmarshal(msg.Payload(), &data); err == nil && data.UID != "" {
			s.onEnrollUID(deviceID, data.UID, data.Index)
		}
	}
}

func (s *MQTTService) photoMetaHandler(client mqtt.Client, msg mqtt.Message) {
	deviceID := extractDeviceID(msg.Topic())
	var meta struct {
		Filename  string `json:"filename"`
		Size      int    `json:"size"`
		Timestamp string `json:"timestamp"`
	}
	if err := json.Unmarshal(msg.Payload(), &meta); err != nil {
		log.Printf("[照片] 解析元数据失败: %v", err)
		return
	}
	s.photoMetaBuf[deviceID] = meta.Filename
	log.Printf("[照片] 设备 %s 准备上传: %s (%d bytes)", deviceID, meta.Filename, meta.Size)
}

func (s *MQTTService) photoHandler(client mqtt.Client, msg mqtt.Message) {
	deviceID := extractDeviceID(msg.Topic())
	filename := s.photoMetaBuf[deviceID]
	if filename == "" {
		filename = fmt.Sprintf("photo_%d.jpg", time.Now().Unix())
	}
	delete(s.photoMetaBuf, deviceID)

	log.Printf("[照片] 收到设备 %s 上传: %s (%d bytes)", deviceID, filename, len(msg.Payload()))

	if s.onPhoto != nil {
		s.onPhoto(deviceID, filename, msg.Payload())
	}
}

// SendCommand 向设备发送指令
func (s *MQTTService) SendCommand(deviceID, cmd string) {
	topic := fmt.Sprintf("coin-kids/device/%s/command", deviceID)
	payload, _ := json.Marshal(map[string]string{"cmd": cmd})
	s.Publish(topic, string(payload))
	log.Printf("[MQTT] 发送指令到设备 %s: %s", deviceID, cmd)
}

func extractDeviceID(topic string) string {
	// coin-kids/device/{deviceID}/rfid -> deviceID
	parts := splitTopic(topic)
	if len(parts) >= 3 {
		return parts[2]
	}
	return ""
}

func splitTopic(topic string) []string {
	var parts []string
	start := 0
	for i, c := range topic {
		if c == '/' {
			parts = append(parts, topic[start:i])
			start = i + 1
		}
	}
	parts = append(parts, topic[start:])
	return parts
}