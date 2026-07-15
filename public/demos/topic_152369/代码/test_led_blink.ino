/**
 * ESP32-S3 LED 闪烁测试程序
 * 用途：验证开发板和Arduino IDE开发环境连接是否正常
 * 频率：2Hz（每秒闪烁2次，周期500ms）
 * 
 * 硬件：ESP32-S3 DevKit C
 * LED引脚：GPIO48（开发板内置RGB LED）
 * 
 * 上传步骤：
 * 1. 用USB线连接ESP32-S3到电脑
 * 2. Arduino IDE中选择：工具 → 开发板 → ESP32 Arduino → ESP32S3 Dev Module
 * 3. 选择正确的COM端口
 * 4. 点击上传按钮（→）
 * 5. 上传完成后观察LED是否以2Hz频率闪烁
 */

#define LED_PIN 48  // ESP32-S3 DevKit C 内置LED引脚

void setup() {
  Serial.begin(115200);
  pinMode(LED_PIN, OUTPUT);
  
  Serial.println("\n========================================");
  Serial.println("ESP32-S3 LED 闪烁测试");
  Serial.println("频率：2Hz（周期500ms）");
  Serial.println("========================================");
  Serial.println("如果LED正常闪烁，说明开发环境配置成功！");
}

void loop() {
  digitalWrite(LED_PIN, HIGH);   // LED亮
  delay(250);                     // 持续250ms
  
  digitalWrite(LED_PIN, LOW);    // LED灭
  delay(250);                     // 持续250ms
  
  // 2Hz = 每秒闪烁2次（亮250ms + 灭250ms = 500ms一个周期）
}