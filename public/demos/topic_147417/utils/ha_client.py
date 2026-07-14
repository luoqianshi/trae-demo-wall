import requests
import streamlit as st
from typing import Optional


class HAClient:
    def __init__(self):
        # st.secrets.get() 在 secrets.toml 文件不存在时会抛 FileNotFoundError，
        # 此处用 try/except 静默捕获，使"无 HA 配置"等价于"HA 未启用"。
        try:
            self.url = st.secrets.get("HA_URL", "").rstrip('/')
            self.token = st.secrets.get("HA_TOKEN", "")
        except Exception:
            self.url = ""
            self.token = ""
        self.enabled = bool(self.url and self.token)
        self.connected = False

    def get_devices(self) -> Optional[list]:
        if not self.enabled:
            return None
        try:
            resp = requests.get(
                f"{self.url}/api/states",
                headers={"Authorization": f"Bearer {self.token}"},
                timeout=1.0
            )
            if resp.status_code != 200:
                return None
            data = resp.json()
            devices = []
            for entity in data:
                entity_id = entity.get('entity_id', '')
                if entity_id.startswith('zone.') or entity_id.startswith('person.'):
                    continue
                # 逐设备安全解析：单个实体异常不应拖垮整批设备
                try:
                    brightness_raw = entity.get('attributes', {}).get('brightness', 255)
                    if brightness_raw is None:
                        brightness_raw = 255
                    brightness = int(brightness_raw / 255 * 100)
                except Exception:
                    brightness = 100
                dev = {
                    'id': entity_id,
                    'label': entity.get('attributes', {}).get('friendly_name', entity_id),
                    'type': self._infer_type(entity_id),
                    'is_on': entity.get('state') == 'on',
                    'brightness': brightness,
                    'room': entity.get('attributes', {}).get('area_id', ''),
                    '_entity_id': entity_id,
                    'x': 0,
                    'y': 0,
                }
                devices.append(dev)
            self.connected = True
            return devices
        except Exception:
            self.connected = False
            return None

    def control_device(self, entity_id: str, command: str, **kwargs) -> bool:
        if not self.enabled or not self.connected:
            return False
        try:
            if command == 'turn_on':
                service, payload = 'turn_on', {}
            elif command == 'turn_off':
                service, payload = 'turn_off', {}
            elif command == 'set_brightness':
                service, payload = 'turn_on', {'brightness': int(kwargs.get('brightness', 100) / 100 * 255)}
            else:
                return False
            domain = 'light' if not entity_id.startswith('switch.') else 'switch'
            url = f"{self.url}/api/services/{domain}/{service}"
            resp = requests.post(
                url,
                headers={"Authorization": f"Bearer {self.token}", "Content-Type": "application/json"},
                json={"entity_id": entity_id, **payload},
                timeout=1.0
            )
            return resp.status_code == 200
        except Exception:
            return False

    def _infer_type(self, entity_id: str) -> str:
        mapping = {'light': 'xiaomi_light', 'switch': 'xiaomi_plug', 'sensor': 'xiaomi_sensor',
                   'binary_sensor': 'xiaomi_sensor', 'climate': 'xiaomi_climate', 'cover': 'xiaomi_curtain'}
        for prefix, mapped in mapping.items():
            if entity_id.startswith(prefix + '.'):
                return mapped
        return 'xiaomi_device'

    def is_available(self) -> bool:
        return self.enabled and self.connected
