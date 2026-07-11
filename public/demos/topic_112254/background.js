chrome.runtime.onInstalled.addListener(() => {
    console.log('杀死那个撒谎者 - 扩展已安装');
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'fetchCrossref') {
        fetchCrossref(request.url)
            .then(data => sendResponse({ success: true, data: data }))
            .catch(error => sendResponse({ success: false, error: error.message }));
        return true;
    }
});

async function fetchCrossref(url) {
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'User-Agent': 'KillTheLiar/1.0 (mailto:example@example.com)'
        }
    });

    if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
}
