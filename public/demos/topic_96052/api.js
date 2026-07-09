const callHuggingFaceAPI = async (url, prompt) => {
    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            inputs: prompt,
            parameters: {
                max_new_tokens: 200,
                temperature: 0.7,
                top_p: 0.9,
                do_sample: true,
                return_full_text: false
            }
        })
    });
    
    const data = await response.json();
    
    if (data.error) {
        if (data.error.includes('currently loading') || data.error.includes('loading')) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            return callHuggingFaceAPI(url, prompt);
        }
        throw new Error(data.error);
    }
    
    return data[0]?.generated_text || data.generated_text || '';
};

const callOpenAIAPI = async (url, apiKey, model, messages) => {
    try {
        console.log('[API] 调用OpenAI API:', {url, model, messagesCount: messages.length});
        
        const isChatEndpoint = url.includes('chat/completions');
        const isCompletionEndpoint = url.includes('completions') && !isChatEndpoint;
        
        let bodyData;
        if (isChatEndpoint) {
            bodyData = {
                model,
                messages,
                temperature: 0.9,
                max_tokens: 500,
                top_p: 0.9,
                frequency_penalty: 0,
                presence_penalty: 0,
                stream: false
            };
        } else if (isCompletionEndpoint) {
            const systemMsg = messages.find(m => m.role === 'system')?.content || '';
            const userMsg = messages.find(m => m.role === 'user')?.content || '';
            const prompt = `${systemMsg}\n\n用户问：${userMsg}\n请回答：`;
            
            bodyData = {
                model,
                prompt,
                temperature: 0.9,
                max_tokens: 500,
                top_p: 0.9,
                frequency_penalty: 0,
                presence_penalty: 0,
                stream: false
            };
        } else {
            bodyData = {
                model,
                messages,
                temperature: 0.9,
                max_tokens: 500
            };
        }
        
        console.log('[API] 请求体:', JSON.stringify(bodyData).substring(0, 500));
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(bodyData),
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin'
        });
        
        console.log('[API] HTTP状态码:', response.status, response.statusText);
        
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            const text = await response.text();
            console.error('[API] JSON解析失败，响应文本:', text);
            throw new Error(`API返回格式错误: ${jsonError.message}`);
        }
        
        console.log('[API] API返回完整数据:', JSON.stringify(data).substring(0, 1500));
        
        if (data.error) {
            throw new Error(data.error.message || JSON.stringify(data.error));
        }
        
        let content = '';
        if (isChatEndpoint) {
            content = data.choices?.[0]?.message?.content || '';
            console.log('[API] 提取的content:', content.substring(0, 200));
            
            if (!content) {
                const reasoning = data.choices?.[0]?.message?.reasoning || '';
                console.log('[API] 尝试reasoning字段:', reasoning.substring(0, 200));
                content = reasoning;
            }
        } else if (isCompletionEndpoint) {
            content = data.choices?.[0]?.text || '';
            console.log('[API] 提取的text:', content.substring(0, 200));
        } else {
            content = data.choices?.[0]?.message?.content || data.content || JSON.stringify(data);
        }
        
        if (!content || content.trim().length === 0) {
            throw new Error('API返回内容为空');
        }
        
        return content.trim();
    } catch (error) {
        console.error('[API] callOpenAIAPI异常:', error.message || error);
        throw error;
    }
};

const callSimpleAPI = async (url, prompt) => {
    const encodedPrompt = encodeURIComponent(prompt);
    const fullUrl = url + encodedPrompt;
    
    const response = await fetch(fullUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
    });
    
    const data = await response.json();
    return typeof data === 'string' ? data : JSON.stringify(data);
};

const callRealAPI = async (character, userMessage, msg) => {
    const config = state.apiConfigs.find(c => c.id === state.selectedApi);
    
    console.log('[API] 当前选中的API:', {
        id: config.id, 
        name: config.name, 
        type: config.type, 
        url: config.url, 
        hasApiKey: config.apiKey ? '有' : '无',
        model: config.model
    });
    
    if (!config.url) {
        const errorMsg = 'API地址未配置，请先配置API';
        console.error('[API]', errorMsg);
        updateMessage(msg, `⚠️ ${errorMsg}`);
        showToast(errorMsg, 'error');
        return;
    }
    
    if (!config.apiKey && config.type !== 'huggingface') {
        const errorMsg = 'API密钥未配置，请先配置API';
        console.error('[API]', errorMsg);
        updateMessage(msg, `⚠️ ${errorMsg}`);
        showToast(errorMsg, 'error');
        return;
    }
    
    const { systemPrompt } = character;
    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
    ];
    
    try {
        showLoading();
        let response = '';
        
        if (config.type === 'huggingface') {
            const prompt = `<s>[INST] ${systemPrompt}\n\n用户问：${userMessage}\n请用${character.name}的语气回答。 [/INST]`;
            response = await callHuggingFaceAPI(config.url, prompt);
        } else if (config.type === 'openai') {
            console.log('[API] 调用callOpenAIAPI:', {url: config.url, model: config.model, messagesLength: messages.length});
            response = await callOpenAIAPI(config.url, config.apiKey, config.model, messages);
        } else if (config.type === 'simple') {
            const prompt = `${systemPrompt}\n用户问：${userMessage}\n请用${character.name}的语气回答。`;
            response = await callSimpleAPI(config.url, prompt);
        }
        
        console.log('[API] API返回内容长度:', response.length, '字符');
        console.log('[API] 返回内容预览:', response.substring(0, 200));
        
        if (!response || response.length < 5) {
            throw new Error(`API返回内容过短 (长度: ${response.length})，内容: "${response}"`);
        }
        
        updateMessage(msg, response);
        saveMemory({ type: 'response', content: response });
    } catch (error) {
        console.error('[API] API调用失败:', error.message || error);
        const errorMsg = `⚠️ API调用失败: ${error.message}`;
        updateMessage(msg, errorMsg);
        showToast(errorMsg, 'error');
    } finally {
        hideLoading();
    }
};

const getCurrentApiConfig = () => state.apiConfigs.find(c => c.id === state.selectedApi);

const testApiConnection = async () => {
    const config = state.apiConfigs.find(c => c.id === state.selectedApi);
    if (!config.url) {
        return { success: false, message: 'API地址未配置' };
    }
    
    try {
        showLoading();
        
        if (config.type === 'openai') {
            const testMessages = [
                { role: 'system', content: '你是一个测试助手，请简单回复"测试成功"' },
                { role: 'user', content: '测试' }
            ];
            
            const response = await callOpenAIAPI(config.url, config.apiKey, config.model, testMessages);
            return { success: true, message: 'API连接测试成功', response: response.substring(0, 50) };
        } else if (config.type === 'huggingface') {
            const response = await callHuggingFaceAPI(config.url, '<s>[INST] 测试 [/INST]');
            return { success: response.length > 0, message: 'HuggingFace API测试完成', response: response.substring(0, 50) };
        } else {
            return { success: false, message: '不支持的API类型' };
        }
    } catch (error) {
        return { success: false, message: 'API连接测试失败: ' + error.message };
    } finally {
        hideLoading();
    }
};
