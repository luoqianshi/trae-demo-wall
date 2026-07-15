/**
 * AI辅助通行帮手 - 门禁模拟器端
 * 硬件：ESP-WROOM-32D
 * 功能：BLE广播门禁服务、接收挂件验证、控制继电器开门
 * 
 * 接线：
 *   GPIO2  → 继电器 IN
 *   GPIO13 → LED指示灯（正极）
 *   GND    → 继电器 GND / LED 负极
 *   3.3V   → 继电器 VCC
 */

#include <BLEDevice.h>
#include <BLEUtils.h>
#include <BLEServer.h>
#include <BLE2902.h>
#include <WiFi.h>
#include <WebServer.h>

// ===== 配置区（请根据实际修改）=====
#define WIFI_SSID      "你的WiFi名称"
#define WIFI_PASSWORD  "你的WiFi密码"

// 继电器引脚
#define RELAY_PIN      2
#define RELAY_ON       LOW    // 低电平触发（根据继电器模块调整）
#define RELAY_OFF      HIGH

// LED指示灯
#define STATUS_LED     13

// BLE UUID
#define SERVICE_UUID        "6E400001-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_RX "6E400002-B5A3-F393-E0A9-E50E24DCCA9E"
#define CHARACTERISTIC_UUID_TX "6E400003-B5A3-F393-E0A9-E50E24DCCA9E"

// 设备验证凭证
#define DEVICE_KEY "ai_access_helper_2026"

// ===== 全局变量 =====
BLEServer *pServer = NULL;
BLECharacteristic *pTxCharacteristic = NULL;
bool deviceConnected = false;
bool doorOpen = false;

WebServer webServer(80);

// ===== BLE 回调 =====
class MyServerCallbacks : public BLEServerCallbacks {
  void onConnect(BLEServer *pServer) {
    deviceConnected = true;
    Serial.println("[BLE] 挂件已连接");
    digitalWrite(STATUS_LED, HIGH);
  }

  void onDisconnect(BLEServer *pServer) {
    deviceConnected = false;
    Serial.println("[BLE] 挂件已断开");
    digitalWrite(STATUS_LED, LOW);
    // 断开后重新开始广播
    pServer->getAdvertising()->start();
  }
};

class MyCallbacks : public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) {
    std::string rxValue = pCharacteristic->getValue();
    if (rxValue.length() > 0) {
      String data = String(rxValue.c_str());
      Serial.print("[BLE] 收到数据: ");
      Serial.println(data);

      // 解析命令
      if (data.startsWith("AUTH:")) {
        String key = data.substring(5);
        if (key == DEVICE_KEY) {
          Serial.println("[验证] 凭证正确，开门！");
          openDoor();
          sendResponse("DOOR_OPEN:OK");
        } else {
          Serial.println("[验证] 凭证错误，拒绝访问");
          sendResponse("AUTH_FAIL");
        }
      } else if (data == "REMOTE_OPEN") {
        // 来自家长端的远程开门指令（通过WiFi转发）
        Serial.println("[远程] 家长确认开门！");
        openDoor();
      } else if (data == "STATUS") {
        // 查询状态
        if (doorOpen) {
          sendResponse("DOOR:OPEN");
        } else {
          sendResponse("DOOR:CLOSED");
        }
      } else {
        Serial.println("[BLE] 未知命令");
        sendResponse("UNKNOWN_CMD");
      }
    }
  }
};

// ===== 开门控制 =====
void openDoor() {
  digitalWrite(RELAY_PIN, RELAY_ON);
  doorOpen = true;
  Serial.println("[门锁] 已开门（继电器吸合）");
  sendResponse("DOOR_OPEN:OK");

  // 5秒后自动关门
  delay(5000);
  digitalWrite(RELAY_PIN, RELAY_OFF);
  doorOpen = false;
  Serial.println("[门锁] 已关门（继电器断开）");
}

void sendResponse(String msg) {
  if (deviceConnected && pTxCharacteristic != NULL) {
    pTxCharacteristic->setValue(msg.c_str());
    pTxCharacteristic->notify();
    Serial.println("[BLE] 发送响应: " + msg);
  }
}

// ===== WiFi Web 服务器（接收家长端远程指令）=====
void handleRoot() {
  webServer.send(200, "text/plain", "AI Access Gateway - Running");
}

void handleRemoteOpen() {
  Serial.println("[Web] 收到远程开门请求");
  openDoor();
  webServer.send(200, "text/plain", "DOOR_OPEN:OK");
}

void handleStatus() {
  String status = doorOpen ? "OPEN" : "CLOSED";
  webServer.send(200, "application/json",
    "{\"door\":\"" + status + "\",\"ble_connected\":" + (deviceConnected ? "true" : "false") + "}");
}

void setupWiFi() {
  Serial.print("[WiFi] 正在连接 ");
  Serial.print(WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(1000);
    Serial.print(".");
    attempts++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.print("[WiFi] 连接成功！IP: ");
    Serial.println(WiFi.localIP());

    // 启动Web服务器
    webServer.on("/", handleRoot);
    webServer.on("/open", handleRemoteOpen);
    webServer.on("/status", handleStatus);
    webServer.begin();
    Serial.println("[Web] 服务器已启动，端口 80");
  } else {
    Serial.println();
    Serial.println("[WiFi] 连接失败，继续运行BLE模式");
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("\n========================================");
  Serial.println("AI辅助通行帮手 - 门禁模拟器端");
  Serial.println("硬件: ESP-WROOM-32D");
  Serial.println("========================================");

  // 初始化引脚
  pinMode(RELAY_PIN, OUTPUT);
  digitalWrite(RELAY_PIN, RELAY_OFF);  // 初始关门
  pinMode(STATUS_LED, OUTPUT);
  digitalWrite(STATUS_LED, LOW);

  // 连接WiFi
  setupWiFi();

  // 初始化BLE
  BLEDevice::init("AI_Access_Gateway");
  pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  BLEService *pService = pServer->createService(SERVICE_UUID);

  // 接收特征（挂件→门禁）
  BLECharacteristic *pRxCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID_RX,
    BLECharacteristic::PROPERTY_WRITE
  );
  pRxCharacteristic->setCallbacks(new MyCallbacks());

  // 发送特征（门禁→挂件）
  pTxCharacteristic = pService->createCharacteristic(
    CHARACTERISTIC_UUID_TX,
    BLECharacteristic::PROPERTY_NOTIFY
  );
  pTxCharacteristic->addDescriptor(new BLE2902());

  // 启动服务
  pService->start();
  pServer->getAdvertising()->start();

  Serial.println("[BLE] 广播已启动，等待挂件连接...");
  Serial.println("[BLE] 服务UUID: " + String(SERVICE_UUID));
  Serial.println("========================================\n");
}

void loop() {
  webServer.handleClient();
  delay(10);
}