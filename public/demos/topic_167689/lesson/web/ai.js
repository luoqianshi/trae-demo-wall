const ZHIPU_API_KEY = 'd74f4adc2e7744a1a6cbd6dd8c30d257.ANfGc0DaYrYupL8q';
const ZHIPU_API_URL = 'https://open.bigmodel.cn/api/paas/v4/chat/completions';

// 根据课程进度获取用户等级描述
function _getUserLevel(lessonNum) {
    if (!lessonNum || lessonNum <= 27) {
        return '初学者，不要求过好';
    } else if (lessonNum <= 54) {
        return '中等，提出少量提高建议';
    } else {
        return '高等，提出较多提高建议';
    }
}

async function _callZhipuAPI(messages) {
    try {
        const response = await fetch(ZHIPU_API_URL + '?t=' + Date.now(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + ZHIPU_API_KEY
            },
            body: JSON.stringify({
                model: 'glm-4-flash',
                messages: messages,
                temperature: 0.7,
                max_tokens: 2000
            })
        });

        if (!response.ok) {
            let errorMsg = 'API 请求失败';
            try {
                const errorData = await response.json();
                errorMsg = errorData.error?.message || errorMsg;
            } catch (e) {}
            return 'AI 服务暂时不可用: ' + errorMsg;
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || '未获取到回复';
    } catch (error) {
        console.error('[AI] 调用失败:', error);
        return 'AI 服务暂时不可用，请稍后重试。';
    }
}

// AI 代码审查
// 参数：code(用户代码), task(题目/任务), lessonNum(课程进度1-101)
async function AICodeCheck(code, task, lessonNum) {
    const userLevel = _getUserLevel(lessonNum);
    const taskDesc = (task && task.trim()) ? task : '未指定具体题目';

    const systemPrompt = '检查代码（web）。不要输出如"回答："的多余内容。找出错误，如果有，分条列出问题、改正内容。';

    const userPrompt = '用户：' + userLevel + '\n' +
        '题目：' + taskDesc + '\n' +
        '用户代码：\n' + code;

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ];
    return await _callZhipuAPI(messages);
}

// AI 问答
// 参数：message(提问内容), code(用户代码), task(本课内容), lessonNum(课程进度1-101)
async function AIChat(message, code, task, lessonNum) {
    const userLevel = _getUserLevel(lessonNum);
    const taskDesc = (task && task.trim()) ? task : '未指定';
    const codeDesc = (code && code.trim()) ? code : '无代码';

    const systemPrompt = '代码为web。不要输出如"回答："、"学生提问："的多余内容。';

    const userPrompt = '用户：' + userLevel + '\n' +
        '题目/本课内容：' + taskDesc + '\n' +
        '如果问题与代码无关，不用联系代码' + '\n' +
        '用户代码：\n' + codeDesc + '\n' +
        '提问内容：' + message;

    const messages = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
    ];
    return await _callZhipuAPI(messages);
}
