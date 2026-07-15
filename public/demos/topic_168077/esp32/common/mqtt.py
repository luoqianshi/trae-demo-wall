"""
Coin Kids - MQTT 客户端封装 (UIFlow2/MicroPython)
适用于 M5Stack CoreS3
"""
import ujson
import utime
import network
import _thread
from umqtt.simple import MQTTClient

# ============================================================
# MQTT 客户端
# ============================================================

class CoinKidsMQTT:
    """封装 MQTT 连接和消息收发"""

    def __init__(self, device_id, broker, client_id=None):
        self.device_id = device_id
        self.broker = broker
        self.client_id = client_id or f"coin-kids-{device_id}"
        self.client = None
        self._handlers = {}
        self._connected = False
        self._lock = _thread.allocate_lock()

    def connect(self):
        """连接 MQTT Broker"""
        print(f"[MQTT] 连接 Broker: {self.broker}")
        self.client = MQTTClient(
            self.client_id,
            self.broker,
            keepalive=60
        )
        self.client.set_callback(self._on_message)
        try:
            self.client.connect()
            self._connected = True
            print("[MQTT] 连接成功")
        except Exception as e:
            print(f"[MQTT] 连接失败: {e}")
            self._connected = False
        return self._connected

    def is_connected(self):
        return self._connected and self.client is not None

    def subscribe(self, topic, handler=None):
        """订阅话题，可选回调"""
        if self.client is None:
            return
        try:
            self.client.subscribe(topic)
            if handler:
                self._handlers[topic] = handler
            print(f"[MQTT] 订阅: {topic}")
        except Exception as e:
            print(f"[MQTT] 订阅失败 {topic}: {e}")

    def publish(self, suffix, payload):
        """发布消息到设备话题"""
        topic = f"coin-kids/device/{self.device_id}/{suffix}"
        if isinstance(payload, dict):
            payload = ujson.dumps(payload)
        try:
            self.client.publish(topic, payload)
            print(f"[MQTT] 发布 -> {topic}: {payload}")
        except Exception as e:
            print(f"[MQTT] 发布失败: {e}")

    def check(self):
        """检查新消息（非阻塞），必须在主循环中定期调用"""
        if self.client is None:
            return
        try:
            self.client.check_msg()
        except Exception:
            pass

    def _on_message(self, topic, msg):
        """内部消息回调"""
        topic = topic.decode() if isinstance(topic, bytes) else topic
        msg = msg.decode() if isinstance(msg, bytes) else msg
        print(f"[MQTT] 收到 <- {topic}")

        # 通用处理器
        if topic in self._handlers:
            self._handlers[topic](topic, msg)
            return

        # 按前缀匹配
        for pattern, handler in self._handlers.items():
            if pattern.endswith("#") and topic.startswith(pattern[:-1]):
                handler(topic, msg)
                return

    def disconnect(self):
        if self.client:
            try:
                self.client.disconnect()
            except:
                pass
            self._connected = False


# ============================================================
# WiFi 连接
# ============================================================

def connect_wifi(ssid, password, led_pin=None, timeout=15):
    """连接 WiFi"""
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)

    if wlan.isconnected():
        ip = wlan.ifconfig()[0]
        print(f"[WiFi] 已连接: {ip}")
        return True, ip

    print(f"[WiFi] 连接: {ssid}")
    wlan.connect(ssid, password)

    for _ in range(timeout):
        if wlan.isconnected():
            break
        utime.sleep(1)
        print(".", end="")
        if led_pin:
            led_pin.value(not led_pin.value())

    if led_pin:
        led_pin.value(0)

    if wlan.isconnected():
        ip = wlan.ifconfig()[0]
        print(f"\n[WiFi] 成功! IP: {ip}")
        return True, ip
    else:
        print(f"\n[WiFi] 失败")
        return False, None