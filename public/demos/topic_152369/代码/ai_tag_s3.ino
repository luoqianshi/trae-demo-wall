/**
 * AI辅助通行帮手 - 挂件端
 * 硬件：ESP32-S3
 * 功能：BLE扫描门禁、连接验证、WiFi请求远程确认、LED状态指示
 * 
 * 接线：无需额外接线，使用开发板自带LED
 *   GPIO48 → 内置LED（按实际开发板调整）
 *   GPIO0  → BOOT按键（可选，手动触发扫描）
 */

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEScan.h>
#include <BLEAdvertisedDevice.h>
#include <WiFi.h>
#include <HTTPClient.h>

// ===== 配置区（请根据实际修改）=====
#define WIFI_SSID        "你的WiFi名称"
#define WIFI_PASSWORD    "你的WiFi密码"

// 家长端服务器地址（运行家长端HTML的电脑IP）
#define PARENT_SERVER    "http://192.168.1.xxx:8080"

// 门禁BLE服务UUID（必须与门禁端一致）
#define GATEWAY_SERVICE_UUID "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"

// 设备凭证
#define DEVICE_ID        "TAG001"
#define DEVICE_KEY       "ai_access_helper_2026"

// LED引脚（ESP32-S3 DevKit C默认内置LED是GPIO48）
#define STATUS_LED       48

// 按键引脚（ESP32-S3 BOOT键是GPIO0）
#define BUTTON_PIN       0

// 超时设置
#define SCAN_INTERVAL    5000      // 扫描间隔(ms)
#define STAY_ALERT_TIMEOUT 120000  // 2分钟停留预警
#define CONNECT_TIMEOUT  10000     // BLE连接超时(ms)

// ===== 全局变量 =====
BLEScan *pBLEScan = NULL;
BLEAdvertisedDevice *targetDevice = NULL;
BLERemoteCharacteristic *pRemoteCharacteristic = NULL;
BLERemoteCharacteristic *pTxCharacteristic = NULL;
BLEClient *pClient = NULL;

// WiFi连接状态
bool wifiConnected = false;

// 状态机
enum DeviceState {
  STATE_IDLE,          // 待机
  STATE_SCANNING,      // 扫描中
  STATE_CONNECTING,    // 连接中
  STATE_AUTHING,       // 验证中
  STATE_PASS,          // 通行成功
  STATE_HELP,          // 求助模式
  STATE_ALERT          // 预警模式
};

DeviceState currentState = STATE_IDLE;
DeviceState lastState = STATE_IDLE;

unsigned long lastScanTime = 0;
unsigned long gateArrivalTime = 0;
bool nearGate = false;

// ===== BLE 扫描回调 =====
class MyAdvertisedDeviceCallbacks : public BLEAdvertisedDeviceCallbacks {
  void onResult(BLEAdvertisedDevice advertisedDevice) {
    if (advertisedDevice.haveServiceUUID() &&
        advertisedDevice.isAdvertisingService(BLEUUID(GATEWAY_SERVICE_UUID))) {
      
      Serial.print("[扫描] 发现目标门禁: ");
      Serial.println(advertisedDevice.getName().c_str());
      
      if (targetDevice == NULL) {
        targetDevice = new BLEAdvertisedDevice(advertisedDevice);
        currentState = STATE_CONNECTING;
        nearGate = true;
        gateArrivalTime = millis();
      }
    }
  }
};

// ===== BLE 通知回调 =====
static void notifyCallback(
  BLERemoteCharacteristic *pBLERemoteCharacteristic,
  uint8_t *pData,
  size_t length,
  bool isNotify) {
  
  String response = "";
  for (int i = 0; i < length; i++) {
    response += (char)pData[i];
  }
  
  Serial.print("[通知] 收到门禁响应: ");
  Serial.println(response);

  if (response == "DOOR_OPEN:OK") {
    Serial.println("[通行] 门已打开！");
    currentState = STATE_PASS;
  } else if (response == "AUTH_FAIL") {
    Serial.println("[通行] 验证失败，进入求助模式");
    currentState = STATE_HELP;
  }
}

// ===== BLE 连接门禁 =====
bool connectToGateway(BLEAdvertisedDevice *device) {
  if (pClient != NULL) {
    pClient->disconnect();
    delete pClient;
    pClient = NULL;
  }

  pClient = BLEDevice::createClient();
  Serial.println("[连接] 正在连接门禁...");

  // 设置连接超时
  pClient->setClientCallbacks(new BLEClientCallbacks());

  if (!pClient->connect(device)) {
    Serial.println("[连接] 失败！");
    return false;
  }

  Serial.println("[连接] 成功！");

  // 获取服务
  BLERemoteService *pRemoteService = pClient->getService(BLEUUID(GATEWAY_SERVICE_UUID));
  if (pRemoteService == NULL) {
    Serial.println("[连接] 未找到服务！");
    pClient->disconnect();
    return false;
  }

  // 获取特征
  pRemoteCharacteristic = pRemoteService->getCharacteristic(BLEUUID("6E400002-B5A3-F393-E0A9-E50E24DCCA9E"));
  pTxCharacteristic = pRemoteService->getCharacteristic(BLEUUID("6E400003-B5A3-F393-E0A9-E50E24DCCA9E"));

  if (pRemoteCharacteristic == NULL || pTxCharacteristic == NULL) {
    Serial.println("[连接] 未找到特征！");
    pClient->disconnect();
    return false;
  }

  // 注册通知回调
  if (pTxCharacteristic->canNotify()) {
    pTxCharacteristic->registerForNotify(notifyCallback);
  }

  return true;
}

// ===== 发送验证请求 =====
bool sendAuth() {
  if (pRemoteCharacteristic == NULL || !pRemoteCharacteristic->canWrite()) {
    return false;
  }

  String authData = "AUTH:" + String(DEVICE_KEY);
  Serial.println("[验证] 发送凭证: " + authData);
  
  pRemoteCharacteristic->writeValue(authData.c_str(), authData.length());
  return true;
}

// ===== WiFi 功能 =====
void setupWiFi() {
  Serial.print("[WiFi] 正在连接 ");
  Serial.print(WIFI_SSID);
  
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(1000);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    wifiConnected = true;
    Serial.println();
    Serial.print("[WiFi] 连接成功！IP: ");
    Serial.println(WiFi.localIP());
  } else {
    wifiConnected = false;
    Serial.println();
    Serial.println("[WiFi] 连接失败，将使用离线模式");
  }
}

// ===== 发送HTTP请求到家长端 =====
bool sendRequestToParent(String type, String message) {
  if (!wifiConnected) {
    Serial.println("[HTTP] WiFi未连接，无法发送请求");
    return false;
  }

  HTTPClient http;
  String url = String(PARENT_SERVER) + "/request?type=" + type + 
               "&device=" + String(DEVICE_ID) + 
               "&msg=" + urlencode(message);

  http.begin(url);
  http.setTimeout(5000);
  int httpCode = http.GET();

  Serial.print("[HTTP] 发送请求，响应码: ");
  Serial.println(httpCode);

  http.end();
  return (httpCode == 200);
}

// ===== URL编码（简单实现）=====
String urlencode(String str) {
  String encoded = "";
  char c;
  for (int i = 0; i < str.length(); i++) {
    c = str.charAt(i);
    if (c == ' ') {
      encoded += "%20";
    } else if (isalnum(c) || c == '-' || c == '_' || c == '.' || c == '~') {
      encoded += c;
    } else {
      char hex[4];
      sprintf(hex, "%%%02X", c);
      encoded += hex;
    }
  }
  return encoded;
}

// ===== LED控制 =====
void setLEDState(DeviceState state) {
  switch (state) {
    case STATE_IDLE:
      // 呼吸灯效果（慢闪）
      for (int i = 0; i < 3; i++) {
        digitalWrite(STATUS_LED, HIGH);
        delay(200);
        digitalWrite(STATUS_LED, LOW);
        delay(200);
      }
      break;
      
    case STATE_SCANNING:
    case STATE_CONNECTING:
    case STATE_AUTHING:
      // 快速闪烁（正在工作）
      digitalWrite(STATUS_LED, HIGH);
      delay(100);
      digitalWrite(STATUS_LED, LOW);
      delay(100);
      break;
      
    case STATE_PASS:
      // 绿灯常亮（通行成功）
      digitalWrite(STATUS_LED, HIGH);
      break;
      
    case STATE_HELP:
      // 红灯闪烁（求助）
      for (int i = 0; i < 6; i++) {
        digitalWrite(STATUS_LED, HIGH);
        delay(150);
        digitalWrite(STATUS_LED, LOW);
        delay(150);
      }
      break;
      
    case STATE_ALERT:
      // 急促闪烁（预警）
      for (int i = 0; i < 10; i++) {
        digitalWrite(STATUS_LED, HIGH);
        delay(80);
        digitalWrite(STATUS_LED, LOW);
        delay(80);
      }
      break;
  }
}

// ===== 状态机执行 =====
void runStateMachine() {
  if (currentState != lastState) {
    Serial.print("[状态] ");
    Serial.print(lastState);
    Serial.print(" → ");
    Serial.println(currentState);
    lastState = currentState;
  }

  switch (currentState) {
    case STATE_IDLE:
      // 待机模式：定期扫描
      setLEDState(STATE_IDLE);
      if (millis() - lastScanTime > SCAN_INTERVAL) {
        lastScanTime = millis();
        currentState = STATE_SCANNING;
      }
      delay(10);
      break;

    case STATE_SCANNING:
      // 扫描门禁
      setLEDState(STATE_SCANNING);
      Serial.println("[扫描] 开始扫描BLE设备...");
      BLEScanResults foundDevices = pBLEScan->start(3, false);
      pBLEScan->clearResults();
      
      if (targetDevice != NULL) {
        // 发现门禁，准备连接
        currentState = STATE_CONNECTING;
      } else {
        Serial.println("[扫描] 未发现门禁，返回待机");
        currentState = STATE_IDLE;
      }
      delay(10);
      break;

    case STATE_CONNECTING:
      // 连接门禁
      setLEDState(STATE_CONNECTING);
      if (targetDevice != NULL) {
        if (connectToGateway(targetDevice)) {
          currentState = STATE_AUTHING;
        } else {
          Serial.println("[连接] 连接失败，进入求助模式");
          currentState = STATE_HELP;
        }
      }
      delay(10);
      break;

    case STATE_AUTHING:
      // 发送验证
      setLEDState(STATE_AUTHING);
      if (sendAuth()) {
        Serial.println("[验证] 已发送凭证，等待响应...");
        // 等待门禁响应（通过notifyCallback切换状态）
        delay(2000);
      } else {
        Serial.println("[验证] 发送失败");
        currentState = STATE_HELP;
      }
      delay(10);
      break;

    case STATE_PASS:
      // 通行成功
      setLEDState(STATE_PASS);
      Serial.println("[通行] ✅ 通行成功！");
      
      // 通知家长端
      sendRequestToParent("pass", "TAG001通过门禁");
      
      // 5秒后重置为待机
      delay(5000);
      resetToIdle();
      break;

    case STATE_HELP:
      // 求助模式
      setLEDState(STATE_HELP);
      Serial.println("[求助] 🆘 需要远程确认");
      
      // 发送远程请求到家长端
      if (sendRequestToParent("help", "TAG001在门禁处无法通行，请求远程确认")) {
        Serial.println("[求助] 已发送远程请求，等待家长确认");
      } else {
        Serial.println("[求助] 发送请求失败，请检查网络");
      }
      
      // 等待一段时间后重试
      delay(10000);
      
      // 如果还在门禁附近，尝试重新连接
      if (nearGate) {
        Serial.println("[求助] 重试BLE连接...");
        targetDevice = NULL; // 重新扫描
        currentState = STATE_IDLE;
      }
      break;

    case STATE_ALERT:
      // 预警模式
      setLEDState(STATE_ALERT);
      Serial.println("[预警] ⚠️ 异常停留！");
      
      // 发送预警通知
      sendRequestToParent("alert", "TAG001在门禁处停留超过2分钟");
      
      // 预警后重置
      delay(5000);
      resetToIdle();
      break;
  }
}

void resetToIdle() {
  if (pClient != NULL) {
    pClient->disconnect();
    delete pClient;
    pClient = NULL;
  }
  targetDevice = NULL;
  nearGate = false;
  currentState = STATE_IDLE;
  Serial.println("[系统] 已重置为待机模式");
}

// ===== 按键检测 =====
void checkButton() {
  static unsigned long lastPress = 0;
  if (digitalRead(BUTTON_PIN) == LOW) {  // BOOT键按下为LOW
    if (millis() - lastPress > 500) {    // 防抖
      lastPress = millis();
      Serial.println("[按键] 手动触发扫描");
      targetDevice = NULL;
      currentState = STATE_SCANNING;
    }
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n========================================");
  Serial.println("AI辅助通行帮手 - 挂件端");
  Serial.println("硬件: ESP32-S3");
  Serial.println("========================================");

  // 初始化引脚
  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(STATUS_LED, LOW);
  pinMode(BUTTON_PIN, INPUT_PULLUP);

  // 初始化BLE
  BLEDevice::init("AI_Tag_S3");
  pBLEScan = BLEDevice::getScan();
  pBLEScan->setAdvertisedDeviceCallbacks(new MyAdvertisedDeviceCallbacks());
  pBLEScan->setActiveScan(true);
  pBLEScan->setInterval(100);
  pBLEScan->setWindow(99);

  // 连接WiFi
  setupWiFi();

  // 启动闪烁
  for (int i = 0; i < 3; i++) {
    digitalWrite(STATUS_LED, HIGH);
    delay(200);
    digitalWrite(STATUS_LED, LOW);
    delay(200);
  }

  Serial.println("[系统] 初始化完成，进入待机模式");
  Serial.println("========================================\n");
  
  lastScanTime = millis();
}

void loop() {
  // 检查按键
  checkButton();
  
  // 检查是否在门禁附近超时
  if (nearGate && currentState != STATE_PASS && currentState != STATE_ALERT) {
    if (millis() - gateArrivalTime > STAY_ALERT_TIMEOUT) {
      Serial.println("[预警] 停留超时！");
      currentState = STATE_ALERT;
    }
  }

  // 运行状态机
  runStateMachine();
  
  delay(50);
}