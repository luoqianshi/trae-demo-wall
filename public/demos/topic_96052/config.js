const CONFIG = {
    defaultApiConfigs: [
        { 
            id: 'doubao', 
            name: '豆包API', 
            type: 'openai', 
            url: 'https://ark.cn-beijing.volces.com/api/v3/chat/completions', 
            apiKey: '', 
            model: 'doubao-pro-32k', 
            enabled: true 
        },
        { 
            id: 'huggingface', 
            name: 'Hugging Face (免费)', 
            type: 'huggingface', 
            url: 'https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3', 
            apiKey: '', 
            model: 'mistral-7b', 
            enabled: true 
        },
        { 
            id: 'custom', 
            name: 'GLM-5.2 API', 
            type: 'openai', 
            url: 'http://8.145.39.17:8080/v1/completions', 
            apiKey: 'sk-YOUR_API_KEY_HERE', 
            model: 'glm-5.2-w8a8', 
            enabled: true 
        }
    ],
    maxMemoryDays: 7,
    maxQuestions: 100
};
