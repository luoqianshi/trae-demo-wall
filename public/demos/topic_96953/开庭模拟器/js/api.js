(function (window) {
    'use strict';

    const API_BASE = 'https://api.siliconflow.cn/v1/chat/completions';

    const MODELS = [
        { id: 'deepseek-ai/DeepSeek-V4-Pro', name: 'DeepSeek-V4-Pro', desc: '深度求索·推理与表达均衡' },
        { id: 'zai-org/GLM-5.2', name: 'GLM-5.2', desc: '智谱·通用对话能力强' },
        { id: 'Pro/moonshotai/Kimi-K2.6', name: 'Kimi-K2.6', desc: '月之暗面·长文本质证' }
    ];

    function buildHeaders(apiKey) {
        return {
            'Authorization': 'Bearer ' + apiKey,
            'Content-Type': 'application/json'
        };
    }

    function buildBody(model, messages, options) {
        const body = {
            model: model,
            messages: messages,
            stream: options.stream !== false
        };
        if (options.maxTokens) body.max_tokens = options.maxTokens;
        if (options.temperature != null) body.temperature = options.temperature;
        if (options.topP != null) body.top_p = options.topP;
        return body;
    }

    function parseError(resp) {
        return resp.text().then(function (text) {
            let msg = '请求失败 (' + resp.status + ')';
            try {
                const data = JSON.parse(text);
                if (data.message) msg = data.message;
                else if (data.error && data.error.message) msg = data.error.message;
            } catch (e) {
                if (text) msg = text;
            }
            const err = new Error(msg);
            err.status = resp.status;
            return err;
        });
    }

    function streamChat(apiKey, model, messages, options, onChunk) {
        options = options || {};
        return fetch(API_BASE, {
            method: 'POST',
            headers: buildHeaders(apiKey),
            body: JSON.stringify(buildBody(model, messages, Object.assign({}, options, { stream: true })))
        }).then(function (resp) {
            if (!resp.ok) return parseError(resp).then(function (e) { throw e; });
            if (!resp.body) throw new Error('浏览器不支持流式响应');

            const reader = resp.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let buffer = '';
            let full = '';

            function pump() {
                return reader.read().then(function (res) {
                    if (res.done) {
                        if (buffer.trim()) handleLine(buffer, onChunk, function (c) { full += c; });
                        return full;
                    }
                    buffer += decoder.decode(res.value, { stream: true });
                    const lines = buffer.split('\n');
                    buffer = lines.pop();
                    for (let i = 0; i < lines.length; i++) {
                        handleLine(lines[i], onChunk, function (c) { full += c; });
                    }
                    return pump();
                });
            }
            return pump();
        });
    }

    function handleLine(line, onChunk, append) {
        line = line.trim();
        if (!line || !line.startsWith('data:')) return;
        const data = line.slice(5).trim();
        if (data === '[DONE]') return;
        try {
            const json = JSON.parse(data);
            const choice = json.choices && json.choices[0];
            if (!choice) return;
            const delta = choice.delta || {};
            if (delta.content) {
                if (onChunk) onChunk(delta.content);
                append(delta.content);
            }
        } catch (e) {
            /* 忽略解析异常的分片 */
        }
    }

    function chat(apiKey, model, messages, options) {
        options = options || {};
        return fetch(API_BASE, {
            method: 'POST',
            headers: buildHeaders(apiKey),
            body: JSON.stringify(buildBody(model, messages, Object.assign({}, options, { stream: false })))
        }).then(function (resp) {
            if (!resp.ok) return parseError(resp).then(function (e) { throw e; });
            return resp.json();
        }).then(function (data) {
            const choice = data.choices && data.choices[0];
            return choice && choice.message ? choice.message.content : '';
        });
    }

    function testKey(apiKey, model) {
        return chat(apiKey, model || MODELS[0].id, [
            { role: 'user', content: '请回复"OK"两个字符，用于连通性测试。' }
        ], { maxTokens: 16, temperature: 0 });
    }

    const TTS_MODEL = 'FunAudioLLM/CosyVoice2-0.5B';
    const TTS_BASE = 'https://api.siliconflow.cn/v1/audio/speech';
    const ASR_MODEL = 'FunAudioLLM/SenseVoiceSmall';
    const ASR_BASE = 'https://api.siliconflow.cn/v1/audio/transcriptions';

    function transcribeAudio(apiKey, audioBlob) {
        const formData = new FormData();
        formData.append('file', audioBlob, 'audio.wav');
        formData.append('model', ASR_MODEL);
        return fetch(ASR_BASE, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + apiKey
            },
            body: formData
        }).then(function (resp) {
            if (!resp.ok) {
                return resp.text().then(function (t) {
                    let msg = 'HTTP ' + resp.status;
                    try {
                        const d = JSON.parse(t);
                        if (d.message) msg = d.message;
                        if (d.error) msg = (typeof d.error === 'string' ? d.error : (d.error.message || JSON.stringify(d.error)));
                    } catch (e) {
                        if (t) msg = t.substring(0, 200);
                    }
                    throw new Error('[' + resp.status + '] ' + msg);
                });
            }
            return resp.json();
        }).then(function (data) {
            return data.text || '';
        }).catch(function (e) {
            if (e.message && e.message.indexOf('[') === 0) throw e;
            throw new Error('网络请求失败：' + e.message);
        });
    }

    function speak(apiKey, text, voice) {
        return fetch(TTS_BASE, {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: TTS_MODEL,
                input: text,
                voice: voice || (TTS_MODEL + ':alex'),
                response_format: 'mp3',
                speed: 1.0,
                gain: 0
            })
        }).then(function (resp) {
            if (!resp.ok) {
                return resp.text().then(function (t) {
                    let msg = '语音合成失败 (' + resp.status + ')';
                    try { const d = JSON.parse(t); if (d.message) msg = d.message; } catch (e) { if (t) msg = t; }
                    throw new Error(msg);
                });
            }
            return resp.blob();
        });
    }

    window.SiliconFlow = {
        MODELS: MODELS,
        TTS_MODEL: TTS_MODEL,
        ASR_MODEL: ASR_MODEL,
        streamChat: streamChat,
        chat: chat,
        testKey: testKey,
        speak: speak,
        transcribeAudio: transcribeAudio
    };
})(window);
