from __future__ import annotations

import base64
import json
from dataclasses import dataclass

from tencentcloud.asr.v20190614 import asr_client, models
from tencentcloud.common import credential
from tencentcloud.common.profile.client_profile import ClientProfile
from tencentcloud.common.profile.http_profile import HttpProfile


ENGINE_BY_LANGUAGE = {
    "zh": "16k_zh",
    "en": "16k_en",
    "ja": "16k_ja",
    "ar": "16k_ar",
}


@dataclass(slots=True)
class TencentAsrClient:
    secret_id: str
    secret_key: str
    region: str = "ap-shanghai"

    def recognize_pcm(self, pcm_bytes: bytes, source_lang: str) -> str:
        if not self.secret_id or not self.secret_key:
            raise RuntimeError("Tencent ASR credentials are not configured")

        engine = ENGINE_BY_LANGUAGE.get(source_lang)
        if not engine:
            raise RuntimeError(f"Unsupported ASR language: {source_lang}")

        cred = credential.Credential(self.secret_id, self.secret_key)
        http_profile = HttpProfile(endpoint="asr.tencentcloudapi.com")
        client_profile = ClientProfile(httpProfile=http_profile)
        client = asr_client.AsrClient(cred, self.region, client_profile)

        req = models.SentenceRecognitionRequest()
        req.from_json_string(
            json.dumps(
                {
                    "ProjectId": 0,
                    "SubServiceType": 2,
                    "EngSerViceType": engine,
                    "SourceType": 1,
                    "VoiceFormat": "pcm",
                    "Data": base64.b64encode(pcm_bytes).decode("ascii"),
                    "DataLen": len(pcm_bytes),
                    "FilterDirty": 0,
                    "FilterModal": 0,
                    "FilterPunc": 0,
                    "ConvertNumMode": 1,
                    "WordInfo": 0,
                }
            )
        )
        response = client.SentenceRecognition(req)
        payload = json.loads(response.to_json_string())
        return payload.get("Response", {}).get("Result", "").strip()
