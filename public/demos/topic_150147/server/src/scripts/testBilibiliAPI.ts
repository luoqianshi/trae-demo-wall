import axios from 'axios';

async function testBilibiliAPI() {
  const keyword = encodeURIComponent('植物喝水实验 小学生');

  try {
    const url = `https://api.bilibili.com/x/web-interface/search/type?search_type=video&keyword=${keyword}&order=click&duration=1`;
    console.log('请求URL:', url);

    const response = await axios.get<any>(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://search.bilibili.com/',
        'Accept': 'application/json, text/plain, */*',
      },
      timeout: 10000,
    });

    console.log('状态码:', response.status);
    console.log('响应数据结构:', JSON.stringify(response.data).slice(0, 500));

    if (response.data && response.data.data && response.data.data.result) {
      const results = response.data.data.result;
      console.log(`\n找到 ${results.length} 条结果`);
      results.slice(0, 5).forEach((r: any, i: number) => {
        console.log(`  [${i + 1}] ${r.title.replace(/<[^>]+>/g, '')} (播放:${r.play})`);
        console.log(`      BV: ${r.bvid}`);
        console.log(`      URL: https://www.bilibili.com/video/${r.bvid}`);
      });
    }
  } catch (error) {
    console.error('错误:', (error as Error).message);
  }
}

testBilibiliAPI().catch(console.error);
