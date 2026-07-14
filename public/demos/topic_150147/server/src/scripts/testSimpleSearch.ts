import axios from 'axios';
import * as cheerio from 'cheerio';

async function testSimpleSearch() {
  const keyword = encodeURIComponent('植物喝水实验 教程');
  const url = `https://search.bilibili.com/all?keyword=${keyword}`;

  console.log('请求URL:', url);

  try {
    const response = await axios.get<string>(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      timeout: 15000,
    });

    console.log('状态码:', response.status);
    console.log('HTML长度:', response.data.length);

    const $ = cheerio.load(response.data);

    const allLinks = $('a[href*="/video/"]');
    console.log('找到的视频链接数:', allLinks.length);

    const results: any[] = [];
    allLinks.each((_, elem) => {
      const href = $(elem).attr('href');
      const title = $(elem).attr('title') || $(elem).text().trim();
      if (href && title) {
        results.push({ href, title: title.slice(0, 60) });
      }
    });

    console.log('\n前10条结果:');
    results.slice(0, 10).forEach((r, i) => {
      console.log(`  [${i + 1}] ${r.title}`);
      console.log(`       ${r.href}`);
    });

    // 看看页面上有没有视频标题的其他选择器
    console.log('\n尝试其他选择器...');
    const videoItems = $('.video-list-item, .bili-video-card, .video-item');
    console.log('video-list-item:', $('.video-list-item').length);
    console.log('bili-video-card:', $('.bili-video-card').length);
    console.log('video-item:', $('.video-item').length);
    console.log('img_thumbnail:', $('.img_thumbnail').length);

  } catch (error) {
    console.error('错误:', (error as Error).message);
  }
}

testSimpleSearch().catch(console.error);
